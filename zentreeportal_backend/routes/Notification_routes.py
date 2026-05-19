from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import json
from extensions import mongo
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


notification_bp = Blueprint("notifications", __name__)

# ── Role → which notification types each role can see ────────────────────────
ROLE_TYPE_MAP = {
    "admin":     None,   # None = sees everything
    "manager":   ["new_candidate", "placement", "job_update", "report",
                  "team_update", "offer", "system", "warning"],
    "recruiter": ["new_candidate", "job_update", "interview", "exam_submitted",
                  "offer", "pipeline_update", "system", "warning"],
    "hr":        ["new_hire", "onboarding", "bgv_update", "document_uploaded",
                  "employee_update", "system", "warning"],
}


# def _get_caller() -> tuple:
#     """Return (user_id_str, role) from JWT identity."""
#     identity = get_jwt_identity()
#     try:
#         data = json.loads(identity) if isinstance(identity, str) else identity
#         return str(data.get("id", data.get("_id", ""))), data.get("role", "recruiter")
#     except Exception:
#         return str(identity), "recruiter"
def _get_caller() -> tuple:
    identity = get_jwt_identity()
    try:
        # If identity is a dict with role
        if isinstance(identity, dict):
            return str(identity.get("id", identity.get("_id", ""))), identity.get("role", "recruiter")
        # If identity is a JSON string
        if isinstance(identity, str):
            try:
                data = json.loads(identity)
                if isinstance(data, dict):
                    return str(data.get("id", data.get("_id", ""))), data.get("role", "recruiter")
            except (json.JSONDecodeError, ValueError):
                pass
            # identity is just a plain user_id string — look up role from DB
            user = mongo.db.users.find_one({"_id": ObjectId(identity)})
            if user:
                return identity, user.get("role", "recruiter")
        return str(identity), "recruiter"
    except Exception:
        return str(identity), "recruiter"

# ── GET /api/notifications/ ───────────────────────────────────────────────────

@notification_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id, role = _get_caller()
    logger.info(f"\nDEBUG get_notifications: user_id={user_id!r}, role={role!r}")

    limit = int(request.args.get("limit", 50))

    allowed_types = ROLE_TYPE_MAP.get(role)

    if allowed_types is None:
        # admin — sees everything
        user_filter = {
            "$or": [
                {"target_user_id": user_id},
                {"target_role":    role},
                {"target_user_id": {"$in": [None, ""]},
                 "target_role":    {"$in": [None, ""]}},
            ]
        }
    else:
        user_filter = {
            "$or": [
                {"target_user_id": user_id},
                {"target_role":    role},
                {
                    "target_user_id": {"$in": [None, ""]},
                    "target_role":    {"$in": [None, ""]},
                    "type":           {"$in": allowed_types},
                },
            ]
        }

    docs = list(
        mongo.db.notifications.find(user_filter)
        .sort("created_at", -1)
        .limit(limit)
    )

    serialized = [_serialize(d) for d in docs]
    unread     = sum(1 for d in serialized if not d.get("is_read"))

    return jsonify(success=True, data=serialized, unread=unread), 200




# ── PUT /api/notifications/<id>/read ─────────────────────────────────────────
@notification_bp.route("/<nid>/read", methods=["PUT"])
@jwt_required()
def mark_read(nid):
    user_id, _ = _get_caller()
    try:
        oid = ObjectId(nid)
    except InvalidId:
        return jsonify(success=False, message="Invalid notification ID"), 400

    mongo.db.notifications.update_one(
        {"_id": oid},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}},
    )
    return jsonify(success=True, message="Marked as read"), 200


# ── PUT /api/notifications/read-all ──────────────────────────────────────────
@notification_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    user_id, role = _get_caller()
    allowed_types = ROLE_TYPE_MAP.get(role)

    if allowed_types is None:
        query = {
            "$or": [
                {"target_user_id": user_id},
                {"target_role":    role},
                {"target_user_id": {"$in": [None, ""]},
                 "target_role":    {"$in": [None, ""]}},
            ],
            "is_read": False,
        }
    else:
        query = {
            "$or": [
                {"target_user_id": user_id},
                {"target_role":    role},
                {
                    "target_user_id": {"$in": [None, ""]},
                    "target_role":    {"$in": [None, ""]},
                    "type":           {"$in": allowed_types},
                },
            ],
            "is_read": False,
        }

    mongo.db.notifications.update_many(
        query,
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}},
    )
    return jsonify(success=True, message="All marked as read"), 200




# ── POST /api/notifications/ — create a notification ─────────────────────────
# Called internally by other routes (e.g. when a candidate is hired,
# a new exam is submitted, onboarding is started, etc.)
@notification_bp.route("/", methods=["POST"])
@jwt_required()
def create_notification():
    data = request.get_json(silent=True) or {}

    required = ["type", "title"]
    for f in required:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    doc = {
        "type":           data["type"],           # e.g. "new_hire", "exam_submitted"
        "title":          data["title"],
        "message":        data.get("message", ""),
        "target_user_id": data.get("target_user_id", ""),   # specific user, or "" = broadcast
        "target_role":    data.get("target_role", ""),       # specific role, or "" = all roles
        "related_id":     data.get("related_id", ""),        # e.g. candidate _id
        "related_type":   data.get("related_type", ""),      # e.g. "candidate", "employee"
        "is_read":        False,
        "read_at":        None,
        "created_at":     datetime.utcnow(),
    }

    result = mongo.db.notifications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify(success=True, message="Notification created", data=_serialize(doc)), 201


# ── DELETE /api/notifications/<id> ───────────────────────────────────────────
@notification_bp.route("/<nid>", methods=["DELETE"])
@jwt_required()
def delete_notification(nid):
    try:
        oid = ObjectId(nid)
    except InvalidId:
        return jsonify(success=False, message="Invalid notification ID"), 400
    mongo.db.notifications.delete_one({"_id": oid})
    return jsonify(success=True, message="Deleted"), 200


# ── Serializer ────────────────────────────────────────────────────────────────
def _serialize(doc: dict) -> dict:
    d = dict(doc)
    d["_id"] = str(d.get("_id", ""))
    for f in ("created_at", "read_at"):
        if isinstance(d.get(f), datetime):
            d[f] = d[f].isoformat()
    return d


# ── Helper: create notification from anywhere in the codebase ────────────────
def push_notification(
    notif_type: str,
    title: str,
    message: str = "",
    target_user_id: str = "",
    target_role: str = "",
    related_id: str = "",
    related_type: str = "",
):
    """
    Call this from any route to create a notification.

    Examples:
        # Notify all HR when a candidate is hired:
        push_notification("new_hire", "New hire: John Doe",
                          target_role="hr", related_id=str(candidate_id))

        # Notify a specific recruiter their exam was submitted:
        push_notification("exam_submitted", "Exam submitted by Jane",
                          target_user_id=recruiter_id)

        # Notify all managers of a new placement:
        push_notification("placement", "New placement recorded",
                          target_role="manager")
    """
    doc = {
        "type":           notif_type,
        "title":          title,
        "message":        message,
        "target_user_id": target_user_id,
        "target_role":    target_role,
        "related_id":     related_id,
        "related_type":   related_type,
        "is_read":        False,
        "read_at":        None,
        "created_at":     datetime.utcnow(),
    }
    try:
        mongo.db.notifications.insert_one(doc)
    except Exception as e:
        logger.error(f"[push_notification] Failed: {e}")