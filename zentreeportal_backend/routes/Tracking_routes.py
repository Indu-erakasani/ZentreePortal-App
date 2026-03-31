"""
Candidate Tracking routes: /api/tracking/...
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from extensions import mongo
from models.Tracking_model import (
    tracking_schema, serialize_tracking,
    STAGES, PIPELINE_STATUSES,
)

tracking_bp = Blueprint("tracking", __name__)


def _find(tid: str):
    try:
        oid = ObjectId(tid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid tracking ID"), 400)
    doc = mongo.db.candidate_tracking.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Tracking record not found"), 404)
    return doc, None


# ── GET /api/tracking/ ────────────────────────────────────────────────────────
@tracking_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    stage   = request.args.get("stage", "")
    status  = request.args.get("status", "")
    job_id  = request.args.get("job_id", "")
    q       = request.args.get("q", "").strip()
    page    = int(request.args.get("page", 1))
    per_page= int(request.args.get("per_page", 50))

    query = {}
    if stage:  query["current_stage"]   = stage
    if status: query["pipeline_status"] = status
    if job_id: query["job_id"]          = job_id
    if q:
        query["$or"] = [
            {"candidate_name": {"$regex": q, "$options": "i"}},
            {"job_title":      {"$regex": q, "$options": "i"}},
            {"client_name":    {"$regex": q, "$options": "i"}},
        ]

    total = mongo.db.candidate_tracking.count_documents(query)
    docs  = list(
        mongo.db.candidate_tracking.find(query)
        .sort("stage_date", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(success=True, data=[serialize_tracking(d) for d in docs],
                   total=total, page=page, per_page=per_page), 200


# ── GET /api/tracking/pipeline — aggregated stage counts ─────────────────────
@tracking_bp.route("/pipeline", methods=["GET"])
@jwt_required()
def get_pipeline():
    pipeline = list(mongo.db.candidate_tracking.aggregate([
        {"$match": {"pipeline_status": "Active"}},
        {"$group": {
            "_id":   "$current_stage",
            "count": {"$sum": 1},
            "candidates": {"$push": {
                "name":     "$candidate_name",
                "jobTitle": "$job_title",
                "client":   "$client_name",
            }},
        }},
        {"$sort": {"_id": 1}},
    ]))
    return jsonify(success=True, data=pipeline), 200

# ── GET /api/tracking/by-resume/<resume_id> ───────────────────────────────────
@tracking_bp.route("/by-resume/<resume_id>", methods=["GET"])
@jwt_required()
def get_by_resume(resume_id):
    docs = list(
        mongo.db.candidate_tracking
        .find({
            "resume_id": {
                "$regex": f"^\\s*{resume_id.strip()}\\s*$",
                "$options": "i"
            }
        })
        .sort("created_at", -1)
    )
    return jsonify(success=True, data=[serialize_tracking(d) for d in docs]), 200
# ── GET /api/tracking/:id ─────────────────────────────────────────────────────

@tracking_bp.route("/<tid>", methods=["GET"])
@jwt_required()
def get_one(tid):
    doc, err = _find(tid)
    if err: return err
    return jsonify(success=True, data=serialize_tracking(doc)), 200


# ── POST /api/tracking/ ───────────────────────────────────────────────────────
@tracking_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    required = ["resume_id", "candidate_name", "job_id"]
    for f in required:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400
    try:
        doc = tracking_schema(
            resume_id        = data["resume_id"],
            candidate_name   = data["candidate_name"],
            job_id           = data["job_id"],
            client_name      = data.get("client_name", ""),
            job_title        = data.get("job_title", ""),
            current_stage    = data.get("current_stage", "Screening"),
            pipeline_status  = data.get("pipeline_status", "Active"),
            recruiter        = data.get("recruiter", ""),
            next_step        = data.get("next_step", ""),
            notes            = data.get("notes", ""),
        )
        result = mongo.db.candidate_tracking.insert_one(doc)
        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Tracking record created", data=serialize_tracking(doc)), 201
    except ValueError as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message="Failed to create", error=str(e)), 500


# ── PUT /api/tracking/:id ─────────────────────────────────────────────────────
@tracking_bp.route("/<tid>", methods=["PUT"])
@jwt_required()
def update(tid):
    doc, err = _find(tid)
    if err: return err

    data = request.get_json(silent=True) or {}
    allowed = [
        "current_stage", "pipeline_status", "recruiter",
        "next_step", "next_date", "salary_offered", "offer_status",
        "offer_date", "joining_date", "notes", "rejection_reason",
    ]
    update = {k: data[k] for k in allowed if k in data}

    # Auto-log stage history when stage changes
    if "current_stage" in update and update["current_stage"] != doc.get("current_stage"):
        if update["current_stage"] not in STAGES:
            return jsonify(success=False, message="Invalid stage"), 400
        new_entry = {
            "stage":      update["current_stage"],
            "entered_at": datetime.utcnow(),
            "exited_at":  None,
            "outcome":    data.get("stage_notes", ""),
            "notes":      data.get("stage_notes", ""),
        }
        update["stage_date"]    = datetime.utcnow()
        update["days_in_stage"] = 0
        mongo.db.candidate_tracking.update_one(
            {"_id": doc["_id"]},
            {"$push": {"stage_history": new_entry}}
        )

    update["updated_at"] = datetime.utcnow()
    mongo.db.candidate_tracking.update_one({"_id": doc["_id"]}, {"$set": update})
    updated = mongo.db.candidate_tracking.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_tracking(updated)), 200


# ── POST /api/tracking/:id/interview — add interview feedback ─────────────────
@tracking_bp.route("/<tid>/interview", methods=["POST"])
@jwt_required()
def add_interview(tid):
    doc, err = _find(tid)
    if err: return err

    data = request.get_json(silent=True) or {}
    if not data.get("interviewer"):
        return jsonify(success=False, message="'interviewer' is required"), 400

    interview = {
        "interviewer":       data.get("interviewer", ""),
        "interview_date":    datetime.utcnow(),
        "interview_type":    data.get("interview_type", "Video"),
        "feedback_score":    int(data.get("feedback_score", 3)),
        "feedback_summary":  data.get("feedback_summary", ""),
        "strengths":         data.get("strengths", []),
        "weaknesses":        data.get("weaknesses", []),
        "recommendation":    data.get("recommendation", "Maybe"),
    }
    mongo.db.candidate_tracking.update_one(
        {"_id": doc["_id"]},
        {"$push": {"interviews": interview}, "$set": {"updated_at": datetime.utcnow()}}
    )
    updated = mongo.db.candidate_tracking.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Interview feedback added", data=serialize_tracking(updated)), 200


# ── DELETE /api/tracking/:id ──────────────────────────────────────────────────
@tracking_bp.route("/<tid>", methods=["DELETE"])
@jwt_required()
def delete(tid):
    doc, err = _find(tid)
    if err: return err
    mongo.db.candidate_tracking.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Deleted"), 200


# ── GET /api/tracking/meta/options ────────────────────────────────────────────
@tracking_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def options():
    return jsonify(success=True, stages=STAGES, pipeline_statuses=PIPELINE_STATUSES), 200