
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from extensions import mongo
from models.Skills_model import skill_schema, serialize_skill, DEMAND_LEVELS, CATEGORIES

skills_bp = Blueprint("skills", __name__)


def _find(sid: str):
    try:
        oid = ObjectId(sid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid skill ID"), 400)
    doc = mongo.db.skills_matrix.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Skill not found"), 404)
    return doc, None


def _next_skill_id() -> str:
    count = mongo.db.skills_matrix.count_documents({})
    return f"SKL{str(count + 1).zfill(3)}"


# ── GET /api/skills/ ──────────────────────────────────────────────────────────

@skills_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    q        = request.args.get("q", "").strip()
    category = request.args.get("category", "")
    demand   = request.args.get("demand", "")
    job_id   = request.args.get("job_id", "")

    query = {}
    if q:        query["skill_name"] = {"$regex": q, "$options": "i"}
    if category: query["category"]   = category
    if demand:   query["demand_level"] = demand
    if job_id:   query["job_id"]     = job_id

    docs = list(mongo.db.skills_matrix.find(query).sort("skill_name", 1))

    # ── Dynamically compute candidate_count and job_count for each skill ──
    result = []
    for doc in docs:
        skill_name = doc.get("skill_name", "")

        # Count resumes whose skills field contains this skill name (case-insensitive)
        candidate_count = mongo.db.resume_bank.count_documents({
            "skills": {"$regex": skill_name, "$options": "i"}
        })

        # Count open jobs whose required_skills or title contains this skill name
        job_count = mongo.db.jobs.count_documents({
            "status": "Open",
            "$or": [
                {"required_skills": {"$regex": skill_name, "$options": "i"}},
                {"skills":          {"$regex": skill_name, "$options": "i"}},
            ]
        })

        serialized = serialize_skill(doc)
        serialized["candidate_count"] = candidate_count
        serialized["job_count"]       = job_count
        result.append(serialized)

    return jsonify(success=True, data=result), 200

# ── GET /api/skills/by-job/:job_id ────────────────────────────────────────────
@skills_bp.route("/by-job/<job_id>", methods=["GET"])
@jwt_required()
def by_job(job_id):
    docs = list(mongo.db.skills_matrix.find({"job_id": job_id}).sort("demand_level", 1))
    return jsonify(success=True, data=[serialize_skill(d) for d in docs]), 200


# ── GET /api/skills/:id ───────────────────────────────────────────────────────
@skills_bp.route("/<sid>", methods=["GET"])
@jwt_required()
def get_one(sid):
    doc, err = _find(sid)
    if err: return err
    return jsonify(success=True, data=serialize_skill(doc)), 200


# ── POST /api/skills/ ─────────────────────────────────────────────────────────
@skills_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    for f in ["skill_name", "category"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    # Duplicate check
    if mongo.db.skills_matrix.find_one({"skill_name": {"$regex": f"^{data['skill_name']}$", "$options": "i"}}):
        return jsonify(success=False, message="Skill already exists"), 409

    try:
        doc = skill_schema(
            skill_name         = data["skill_name"],
            category           = data["category"],
            proficiency_levels = data.get("proficiency_levels", ""),
            description        = data.get("description", ""),
            demand_level       = data.get("demand_level", "Medium"),
            related_skills     = data.get("related_skills", ""),
        )
        doc["skill_id"] = _next_skill_id()
        result = mongo.db.skills_matrix.insert_one(doc)
        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Skill created", data=serialize_skill(doc)), 201
    except ValueError as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# ── POST /api/skills/bulk ─────────────────────────────────────────────────────
@skills_bp.route("/bulk", methods=["POST"])
@jwt_required()
def bulk_create():
    data   = request.get_json(silent=True) or {}
    skills = data.get("skills", [])
    if not skills:
        return jsonify(success=False, message="'skills' array is required"), 400
    try:
        count = mongo.db.skills_matrix.count_documents({})
        docs  = []
        for i, s in enumerate(skills):
            doc = skill_schema(
                skill_name         = s["skill_name"],
                category           = s.get("category", "Other"),
                demand_level       = s.get("demand_level", "Medium"),
                proficiency_levels = s.get("proficiency_levels", ""),
                description        = s.get("description", ""),
                related_skills     = s.get("related_skills", ""),
            )
            doc["skill_id"] = f"SKL{str(count + i + 1).zfill(3)}"
            docs.append(doc)
        mongo.db.skills_matrix.insert_many(docs)
        return jsonify(success=True, message=f"{len(docs)} skills created"), 201
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# ── PUT /api/skills/:id ───────────────────────────────────────────────────────
@skills_bp.route("/<sid>", methods=["PUT"])
@jwt_required()
def update(sid):
    doc, err = _find(sid)
    if err: return err

    data    = request.get_json(silent=True) or {}
    allowed = ["skill_name", "category", "proficiency_levels", "description",
               "demand_level", "related_skills", "candidate_count", "job_count"]
    upd = {k: data[k] for k in allowed if k in data}
    if "demand_level" in upd and upd["demand_level"] not in DEMAND_LEVELS:
        return jsonify(success=False, message="Invalid demand_level"), 400

    upd["updated_at"] = datetime.utcnow()
    mongo.db.skills_matrix.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.skills_matrix.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_skill(updated)), 200


# ── DELETE /api/skills/:id ────────────────────────────────────────────────────
@skills_bp.route("/<sid>", methods=["DELETE"])
@jwt_required()
def delete(sid):
    doc, err = _find(sid)
    if err: return err
    mongo.db.skills_matrix.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Skill deleted"), 200


# ── GET /api/skills/meta/options ──────────────────────────────────────────────
@skills_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def options():
    return jsonify(success=True, categories=CATEGORIES, demand_levels=DEMAND_LEVELS), 200