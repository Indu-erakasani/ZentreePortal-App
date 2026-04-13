
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
from extensions import mongo

notification_bp = Blueprint("notifications", __name__)


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _serialize(doc: dict) -> dict:
    d = dict(doc)
    d["_id"] = str(d.get("_id", ""))
    for f in ("created_at", "updated_at"):
        if isinstance(d.get(f), datetime):
            d[f] = d[f].isoformat()
    return d


def _get_user_id() -> str:
    """Return current JWT user id as string."""
    try:
        return str(get_jwt_identity())
    except Exception:
        return ""


def _upsert_notification(
    *,
    ref_id: str,
    notif_type: str,
    title: str,
    message: str,
    meta: dict = None,
    user_id: str = "",
) -> None:
    """
    Insert a notification only if one with the same ref_id + type doesn't
    already exist (idempotent — safe to call on every poll).
    """
    exists = mongo.db.notifications.find_one(
        {"ref_id": ref_id, "type": notif_type}
    )
    if not exists:
        mongo.db.notifications.insert_one({
            "ref_id":     ref_id,
            "type":       notif_type,
            "title":      title,
            "message":    message,
            "meta":       meta or {},
            "is_read":    False,
            "user_id":    user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })


# ═══════════════════════════════════════════════════════════════════════════════
#  GENERATORS — called on every GET to keep notifications fresh
# ═══════════════════════════════════════════════════════════════════════════════

def _generate_interview_notifications() -> None:
    """Today's and next-48-hour interviews."""
    now      = datetime.utcnow()
    window   = now + timedelta(hours=48)
    today_s  = now.date()

    tracking_docs = mongo.db.candidate_tracking.find(
        {"scheduled_interviews": {"$exists": True, "$ne": []}}
    )
    for doc in tracking_docs:
        for sched in (doc.get("scheduled_interviews") or []):
            sat = sched.get("scheduled_at")
            if isinstance(sat, str):
                try:    sat = datetime.fromisoformat(sat)
                except: continue
            if not sat or sat < now:
                continue

            schedule_id    = sched.get("schedule_id", str(doc["_id"]))
            candidate_name = doc.get("candidate_name", "Unknown")
            job_title      = doc.get("job_title", "")
            client_name    = doc.get("client_name", "")
            stage          = sched.get("stage", doc.get("current_stage", ""))
            fmt_time       = sat.strftime("%I:%M %p")
            fmt_date       = sat.strftime("%d %b %Y")

            if sat.date() == today_s:
                _upsert_notification(
                    ref_id     = f"interview_today_{str(doc['_id'])}_{schedule_id}",
                    notif_type = "interview_today",
                    title      = f"Interview Today — {candidate_name}",
                    message    = (
                        f"{stage} interview with {candidate_name} for {job_title}"
                        f" ({client_name}) is scheduled today at {fmt_time}."
                    ),
                    meta={
                        "tracking_id":   str(doc["_id"]),
                        "schedule_id":   schedule_id,
                        "candidate_name": candidate_name,
                        "job_title":     job_title,
                        "stage":         stage,
                        "scheduled_at":  sat.isoformat(),
                        "meeting_link":  sched.get("meeting_link", ""),
                    },
                )
            elif now < sat <= window:
                _upsert_notification(
                    ref_id     = f"interview_upcoming_{str(doc['_id'])}_{schedule_id}",
                    notif_type = "interview_upcoming",
                    title      = f"Upcoming Interview — {candidate_name}",
                    message    = (
                        f"{stage} interview with {candidate_name} for {job_title}"
                        f" ({client_name}) is on {fmt_date} at {fmt_time}."
                    ),
                    meta={
                        "tracking_id":   str(doc["_id"]),
                        "schedule_id":   schedule_id,
                        "candidate_name": candidate_name,
                        "job_title":     job_title,
                        "stage":         stage,
                        "scheduled_at":  sat.isoformat(),
                        "meeting_link":  sched.get("meeting_link", ""),
                    },
                )


def _generate_job_notifications() -> None:
    """Jobs whose deadline is within 3 days, and jobs posted in the last 24 h."""
    now       = datetime.utcnow()
    in_3_days = now + timedelta(days=3)
    last_24h  = now - timedelta(hours=24)

    # Deadline approaching
    jobs_deadline = mongo.db.jobs.find({
        "deadline": {"$exists": True, "$ne": None, "$gt": now.isoformat(), "$lt": in_3_days.isoformat()},
        "status": {"$in": ["Open", "Active"]},
    })
    for job in jobs_deadline:
        job_id  = job.get("job_id", str(job["_id"]))
        title   = job.get("title", "Untitled Job")
        client  = job.get("client_name", "")
        _upsert_notification(
            ref_id     = f"job_deadline_{job_id}",
            notif_type = "job_deadline",
            title      = f"Job Deadline Soon — {title}",
            message    = (
                f"'{title}' for {client} is closing soon. "
                f"Act fast to fill remaining {job.get('openings', 1) - job.get('filled', 0)} opening(s)."
            ),
            meta={
                "job_id":     job_id,
                "mongo_id":   str(job["_id"]),
                "title":      title,
                "client":     client,
                "openings":   job.get("openings", 1),
                "filled":     job.get("filled", 0),
                "deadline":   job.get("deadline", ""),
            },
        )

    # Newly posted jobs
    new_jobs = mongo.db.jobs.find({
        "created_at": {"$gte": last_24h},
    })
    for job in new_jobs:
        job_id = job.get("job_id", str(job["_id"]))
        title  = job.get("title", "Untitled Job")
        client = job.get("client_name", "")
        _upsert_notification(
            ref_id     = f"job_posted_{job_id}",
            notif_type = "job_posted",
            title      = f"New Job Posted — {title}",
            message    = (
                f"A new {job.get('job_type', 'Full-Time')} position '{title}' has been"
                f" posted for {client} with {job.get('openings', 1)} opening(s)."
            ),
            meta={
                "job_id":   job_id,
                "mongo_id": str(job["_id"]),
                "title":    title,
                "client":   client,
                "priority": job.get("priority", "Medium"),
                "openings": job.get("openings", 1),
            },
        )


def _generate_resume_expiry_notifications() -> None:
    """Raw resumes within 7 days of the 90-day auto-delete cutoff."""
    now             = datetime.utcnow()
    expiry_window_s = now - timedelta(days=83)   # 90 - 7 = 83 days old
    expiry_window_e = now - timedelta(days=80)   # warn between 80-83 days old

    expiring = mongo.db.raw_resumes.find({
        "created_at": {"$lte": expiry_window_s, "$gte": expiry_window_e},
        "status":     {"$ne": "Converted"},
    })
    for doc in expiring:
        raw_id = doc.get("raw_id", str(doc["_id"]))
        name   = doc.get("name") or doc.get("original_name", "Unknown")
        days_left = 90 - int((now - doc["created_at"]).days)
        _upsert_notification(
            ref_id     = f"resume_expiring_{raw_id}",
            notif_type = "resume_expiring",
            title      = f"Resume Expiring — {name}",
            message    = (
                f"Raw resume for '{name}' will be auto-deleted in ~{max(days_left, 1)} day(s). "
                f"Convert it to a candidate profile to retain it."
            ),
            meta={
                "raw_id":   raw_id,
                "mongo_id": str(doc["_id"]),
                "name":     name,
                "days_left": max(days_left, 1),
            },
        )


def _sync_exam_notifications() -> None:
    """Mirror unread exam notifications into the unified collection."""
    exam_notifs = mongo.db.exam_notifications.find({"is_read": False})
    for n in exam_notifs:
        _upsert_notification(
            ref_id     = f"exam_{str(n['_id'])}",
            notif_type = "exam_result",
            title      = n.get("title", "Exam Result"),
            message    = n.get("message", ""),
            meta={
                "exam_notif_id": str(n["_id"]),
                "mcq_score":     n.get("mcq_score", 0),
                "mcq_total":     n.get("mcq_total", 0),
            },
        )


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@notification_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    # Refresh notifications on every poll
    try:
        _generate_interview_notifications()
        _generate_job_notifications()
        _generate_resume_expiry_notifications()
        _sync_exam_notifications()
    except Exception as e:
        print(f"[NOTIF] Generator error: {e}")

    notif_type = request.args.get("type", "")
    query = {}
    if notif_type:
        query["type"] = notif_type

    docs  = list(
        mongo.db.notifications.find(query)
        .sort("created_at", -1)
        .limit(100)
    )
    unread = mongo.db.notifications.count_documents({**query, "is_read": False})

    return jsonify(
        success = True,
        data    = [_serialize(d) for d in docs],
        unread  = unread,
        total   = len(docs),
    ), 200


@notification_bp.route("/<nid>/read", methods=["PUT"])
@jwt_required()
def mark_read(nid):
    try:
        oid = ObjectId(nid)
    except InvalidId:
        return jsonify(success=False, message="Invalid notification ID"), 400

    mongo.db.notifications.update_one(
        {"_id": oid},
        {"$set": {"is_read": True, "updated_at": datetime.utcnow()}},
    )
    return jsonify(success=True, message="Marked as read"), 200


@notification_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    mongo.db.notifications.update_many(
        {"is_read": False},
        {"$set": {"is_read": True, "updated_at": datetime.utcnow()}},
    )
    return jsonify(success=True, message="All marked as read"), 200


@notification_bp.route("/<nid>", methods=["DELETE"])
@jwt_required()
def delete_notification(nid):
    try:
        oid = ObjectId(nid)
    except InvalidId:
        return jsonify(success=False, message="Invalid notification ID"), 400

    result = mongo.db.notifications.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify(success=False, message="Notification not found"), 404
    return jsonify(success=True, message="Notification deleted"), 200


@notification_bp.route("/clear-all", methods=["DELETE"])
@jwt_required()
def clear_all():
    """Delete ALL read notifications (cleanup utility)."""
    result = mongo.db.notifications.delete_many({"is_read": True})
    return jsonify(success=True, message=f"Deleted {result.deleted_count} read notifications"), 200