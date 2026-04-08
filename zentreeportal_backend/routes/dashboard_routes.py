
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
from extensions import mongo

dashboard_bp = Blueprint("dashboard", __name__)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _month_range():
    now   = datetime.utcnow()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return start, now


def _fmt_currency(v):
    if not v: return "₹0"
    if v >= 100000: return f"₹{v/100000:.1f}L"
    return f"₹{v:,.0f}"


def _serialize_oid(doc: dict) -> dict:
    """Convert ObjectId fields to strings for JSON serialisation."""
    doc["_id"] = str(doc.get("_id", ""))
    for field in ("created_at", "updated_at", "joining_date", "offer_date"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


# ── GET /api/dashboard/  ─────────────────────────────────────────────────────
# Used by Admin + Manager dashboards
@dashboard_bp.route("/", methods=["GET"])
@jwt_required()
def get_dashboard():
    month_start, now = _month_range()

    # ── Core KPIs ─────────────────────────────────────────────────────────────
    total_clients     = mongo.db.clients.count_documents({})
    active_clients    = mongo.db.clients.count_documents({"relationship_status": "Active"})
    open_jobs         = mongo.db.jobs.count_documents({"status": "Open"})
    total_jobs        = mongo.db.jobs.count_documents({})
    total_candidates  = mongo.db.candidate_processing.count_documents({})
    placements_mtd    = mongo.db.placements.count_documents(
        {"joining_date": {"$gte": month_start}}
    )
    placements_total  = mongo.db.placements.count_documents({})

    # Revenue this month
    rev_agg = list(mongo.db.placements.aggregate([
        {"$match": {"joining_date": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$billing_amount"}}},
    ]))
    revenue_mtd = rev_agg[0]["total"] if rev_agg else 0

    # Fill rate = placements_total / total_jobs
    fill_rate = round(placements_total / total_jobs * 100, 1) if total_jobs else 0

    # Avg time to fill
    ttf = list(mongo.db.placements.aggregate([
        {"$match": {"time_to_fill": {"$gt": 0}}},
        {"$group": {"_id": None, "avg": {"$avg": "$time_to_fill"}}},
    ]))
    avg_days = round(ttf[0]["avg"], 1) if ttf else 0

    # ── Candidate pipeline (candidate_processing status counts) ────────────────────────
    pipeline_raw = list(mongo.db.candidate_processing.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]))
    pipeline = {r["_id"]: r["count"] for r in pipeline_raw if r["_id"]}

    # ── Tracking stage counts (active candidates) ─────────────────────────────
    stage_counts_raw = list(mongo.db.candidate_tracking.aggregate([
        {"$match": {"pipeline_status": "Active"}},
        {"$group": {"_id": "$current_stage", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]))
    stage_counts = [{"stage": r["_id"], "count": r["count"]} for r in stage_counts_raw if r["_id"]]

    # ── High priority open jobs ───────────────────────────────────────────────
    hp_jobs = list(
        mongo.db.jobs.find(
            {"priority": {"$in": ["High", "Critical"]}, "status": "Open"},
            {"job_id":1, "title":1, "client_name":1, "openings":1,
             "priority":1, "created_at":1, "location":1}
        ).sort("created_at", -1).limit(6)
    )
    for j in hp_jobs:
        j["_id"] = str(j["_id"])
        if isinstance(j.get("created_at"), datetime):
            j["created_at"] = j["created_at"].isoformat()

    # ── Recruiter performance (from placements + tracking) ────────────────────
    placement_by_recruiter = list(mongo.db.placements.aggregate([
        {"$group": {
            "_id":       "$recruiter",
            "placements": {"$sum": 1},
            "revenue":    {"$sum": "$billing_amount"},
        }},
        {"$sort": {"placements": -1}},
        {"$limit": 8},
    ]))

    interviews_by_recruiter = {
        r["_id"]: r["count"]
        for r in mongo.db.candidate_tracking.aggregate([
            {"$match": {"current_stage": {"$in": [
                "Technical Interview", "HR Interview", "Final Interview"
            ]}}},
            {"$group": {"_id": "$recruiter", "count": {"$sum": 1}}},
        ])
        if r["_id"]
    }

    offers_by_recruiter = {
        r["_id"]: r["count"]
        for r in mongo.db.candidate_tracking.aggregate([
            {"$match": {"current_stage": "Offer"}},
            {"$group": {"_id": "$recruiter", "count": {"$sum": 1}}},
        ])
        if r["_id"]
    }

    # Also pull recruiter names from jobs (posted_by_name) for recruiters with 0 placements
    jobs_posted = {
        r["_id"]: r["count"]
        for r in mongo.db.jobs.aggregate([
            {"$match": {"posted_by_name": {"$exists": True, "$ne": ""}}},
            {"$group": {"_id": "$posted_by_name", "count": {"$sum": 1}}},
        ])
        if r["_id"]
    }

    recruiter_perf = []
    seen = set()
    for p in placement_by_recruiter:
        name = p["_id"] or "Unknown"
        seen.add(name)
        interviews  = interviews_by_recruiter.get(name, 0)
        offers      = offers_by_recruiter.get(name, 0)
        placed      = p["placements"]
        conversion  = round(placed / interviews * 100, 1) if interviews else 0
        recruiter_perf.append({
            "name":            name,
            "jobs_posted":     jobs_posted.get(name, 0),
            "interviews":      interviews,
            "offers":          offers,
            "placements":      placed,
            "revenue":         p["revenue"],
            "conversion_rate": conversion,
        })

    # Add recruiters with jobs but no placements yet
    for name, jobs in jobs_posted.items():
        if name not in seen:
            recruiter_perf.append({
                "name":            name,
                "jobs_posted":     jobs,
                "interviews":      interviews_by_recruiter.get(name, 0),
                "offers":          offers_by_recruiter.get(name, 0),
                "placements":      0,
                "revenue":         0,
                "conversion_rate": 0,
            })

    recruiter_perf.sort(key=lambda x: (x["placements"], x["revenue"]), reverse=True)

    # ── Client revenue summary ────────────────────────────────────────────────
    client_revenue = list(mongo.db.placements.aggregate([
        {"$group": {
            "_id":        "$client_name",
            "placements": {"$sum": 1},
            "revenue":    {"$sum": "$billing_amount"},
        }},
        {"$sort": {"revenue": -1}},
        {"$limit": 6},
    ]))
    client_revenue = [
        {"client": r["_id"], "placements": r["placements"], "revenue": r["revenue"]}
        for r in client_revenue if r["_id"]
    ]

    # ── Recent activity (latest placements + new candidates) ─────────────────
    recent_placements = list(
        mongo.db.placements.find(
            {}, {"candidate_name":1, "job_title":1, "client_name":1, "joining_date":1}
        ).sort("joining_date", -1).limit(3)
    )
    recent_candidates = list(
        mongo.db.candidate_processing.find(
            {}, {"name":1, "current_role":1, "source":1, "created_at":1}
        ).sort("created_at", -1).limit(3)
    )

    recent_activity = []
    for p in recent_placements:
        dt = p.get("joining_date") or p.get("created_at")
        recent_activity.append({
            "type":    "placement",
            "message": f"{p.get('candidate_name','')} joined {p.get('client_name','')} as {p.get('job_title','')}",
            "time":    dt.isoformat() if isinstance(dt, datetime) else "",
        })
    for c in recent_candidates:
        dt = c.get("created_at")
        recent_activity.append({
            "type":    "candidate",
            "message": f"New candidate: {c.get('name','')} — {c.get('current_role','')}",
            "time":    dt.isoformat() if isinstance(dt, datetime) else "",
        })
    recent_activity.sort(key=lambda x: x["time"], reverse=True)

    return jsonify(
        success=True,
        dashboard={
            "kpis": {
                "active_clients":   active_clients,
                "total_clients":    total_clients,
                "open_jobs":        open_jobs,
                "total_jobs":       total_jobs,
                "total_candidates": total_candidates,
                "placements_mtd":   placements_mtd,
                "placements_total": placements_total,
                "revenue_mtd":      revenue_mtd,
                "fill_rate":        fill_rate,
                "avg_days_to_fill": avg_days,
            },
            "pipeline":           pipeline,
            "stage_counts":       stage_counts,
            "high_priority_jobs": hp_jobs,
            "recruiter_perf":     recruiter_perf,
            "client_revenue":     client_revenue,
            "recent_activity":    recent_activity,
        }
    ), 200


# ── GET /api/dashboard/recruiter ─────────────────────────────────────────────
# Scoped to the logged-in recruiter's own data
@dashboard_bp.route("/recruiter", methods=["GET"])
@jwt_required()
def get_recruiter_dashboard():
    identity = get_jwt_identity()
    month_start, now = _month_range()

    # Get this recruiter's name from users collection
    recruiter_name = "Unknown"
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(identity)})
        if user:
            first = user.get("first_name", "")
            last  = user.get("last_name",  "")
            recruiter_name = f"{first} {last}".strip() or user.get("email", "Unknown")
    except Exception:
        pass

    # Jobs posted by this recruiter
    my_jobs = list(
        mongo.db.jobs.find(
            {"posted_by": identity},
            {"job_id":1, "title":1, "client_name":1, "status":1, "priority":1, "openings":1}
        ).sort("created_at", -1).limit(10)
    )
    for j in my_jobs: j["_id"] = str(j["_id"])

    # Candidates in my pipeline (tracking)
    my_pipeline = list(mongo.db.candidate_tracking.aggregate([
        {"$match": {"recruiter": recruiter_name, "pipeline_status": "Active"}},
        {"$group": {"_id": "$current_stage", "count": {"$sum": 1}}},
    ]))

    # My placements this month
    my_placements_mtd = mongo.db.placements.count_documents({
        "recruiter":    recruiter_name,
        "joining_date": {"$gte": month_start},
    })

    # My revenue this month
    my_rev = list(mongo.db.placements.aggregate([
        {"$match": {"recruiter": recruiter_name, "joining_date": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$billing_amount"}}},
    ]))

    # My recent candidates
    my_candidates = list(
        mongo.db.candidate_processing.find(
            {"linked_job_id": {"$in": [str(j["_id"]) for j in my_jobs]}},
            {"name":1, "status":1, "linked_job_title":1, "created_at":1}
        ).sort("created_at", -1).limit(8)
    )
    for c in my_candidates:
        c["_id"] = str(c["_id"])
        if isinstance(c.get("created_at"), datetime):
            c["created_at"] = c["created_at"].isoformat()

    return jsonify(
        success=True,
        dashboard={
            "recruiter_name": recruiter_name,
            "stats": {
                "my_open_jobs":      mongo.db.jobs.count_documents({"posted_by": identity, "status": "Open"}),
                "my_total_jobs":     mongo.db.jobs.count_documents({"posted_by": identity}),
                "active_pipeline":   sum(r["count"] for r in my_pipeline),
                "placements_mtd":    my_placements_mtd,
                "revenue_mtd":       my_rev[0]["total"] if my_rev else 0,
            },
            "my_jobs":       my_jobs,
            "my_pipeline":   [{"stage": r["_id"], "count": r["count"]} for r in my_pipeline],
            "my_candidates": my_candidates,
        }
    ), 200