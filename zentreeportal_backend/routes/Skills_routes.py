
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
        candidate_count = mongo.db.candidate_processing.count_documents({
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
        bench_available = mongo.db.bench_people.count_documents({
            "skills": {"$regex": skill_name, "$options": "i"},
            "status": "Available",
        })
        bench_total = mongo.db.bench_people.count_documents({
            "skills": {"$regex": skill_name, "$options": "i"},
        })

        serialized = serialize_skill(doc)
        serialized["candidate_count"] = candidate_count
        serialized["job_count"]       = job_count
        serialized["bench_available"]  = bench_available   
        serialized["bench_total"]      = bench_total       
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


# ── GET /api/skills/<sid>/insights ────────────────────────────────────────────
@skills_bp.route("/<sid>/insights", methods=["GET"])
@jwt_required()
def get_insights(sid):
    """
    Aggregated talent intelligence for a skill:
    - Pipeline stage breakdown for candidates
    - Bench availability breakdown
    - Salary range stats
    - Experience distribution
    """
    doc, err = _find(sid)
    if err:
        return err

    skill_name = doc.get("skill_name", "")
    related    = [s.strip() for s in (doc.get("related_skills") or "").split(",") if s.strip()]
    all_skills = [skill_name] + related

    # Build regex that matches any of the skill names
    regex_pattern = "|".join(all_skills)

    # ── Candidates ────────────────────────────────────────────────────────────
    candidates = list(mongo.db.candidate_processing.find(
        {"skills": {"$regex": regex_pattern, "$options": "i"}}
    ))
    candidate_ids = [str(c.get("resume_id", "")) for c in candidates]

    # Pipeline stage breakdown via tracking
    tracking_docs = list(mongo.db.candidate_tracking.find(
        {"resume_id": {"$in": candidate_ids}}
    )) if candidate_ids else []

    stage_breakdown = {}
    for t in tracking_docs:
        stage = t.get("current_stage", "Unknown")
        stage_breakdown[stage] = stage_breakdown.get(stage, 0) + 1

    # Status breakdown
    status_breakdown = {}
    for c in candidates:
        st = c.get("status", "Unknown")
        status_breakdown[st] = status_breakdown.get(st, 0) + 1

    # Experience distribution
    exp_bands = {"0-2": 0, "3-5": 0, "6-10": 0, "10+": 0}
    salaries  = []
    for c in candidates:
        exp = float(c.get("experience") or 0)
        if exp <= 2:   exp_bands["0-2"]  += 1
        elif exp <= 5: exp_bands["3-5"]  += 1
        elif exp <= 10:exp_bands["6-10"] += 1
        else:          exp_bands["10+"]  += 1
        es = c.get("expected_salary")
        if es and float(es) > 0:
            salaries.append(float(es))

    # Notice period breakdown
    notice_breakdown = {}
    for c in candidates:
        np = c.get("notice_period", "Unknown") or "Unknown"
        notice_breakdown[np] = notice_breakdown.get(np, 0) + 1

    # ── Bench People ──────────────────────────────────────────────────────────
    bench_people = list(mongo.db.bench_people.find(
        {"skills": {"$regex": regex_pattern, "$options": "i"}}
    ))

    bench_status_breakdown = {}
    bench_exp_bands = {"0-2": 0, "3-5": 0, "6-10": 0, "10+": 0}
    bench_salaries  = []
    for b in bench_people:
        st = b.get("status", "Unknown")
        bench_status_breakdown[st] = bench_status_breakdown.get(st, 0) + 1
        exp = float(b.get("experience") or 0)
        if exp <= 2:    bench_exp_bands["0-2"]  += 1
        elif exp <= 5:  bench_exp_bands["3-5"]  += 1
        elif exp <= 10: bench_exp_bands["6-10"] += 1
        else:           bench_exp_bands["10+"]  += 1
        es = b.get("expected_salary")
        if es and float(es) > 0:
            bench_salaries.append(float(es))

    all_salaries = salaries + bench_salaries

    return jsonify(
        success=True,
        data={
            "skill_name":   skill_name,
            "related":      related,
            # Candidate insights
            "candidate_total":        len(candidates),
            "candidate_status":       status_breakdown,
            "candidate_stage":        stage_breakdown,
            "candidate_exp_bands":    exp_bands,
            "candidate_notice":       notice_breakdown,
            # Bench insights
            "bench_total":            len(bench_people),
            "bench_status":           bench_status_breakdown,
            "bench_exp_bands":        bench_exp_bands,
            "bench_available":        bench_status_breakdown.get("Available", 0),
            # Combined salary intel
            "salary_min":  min(all_salaries) if all_salaries else 0,
            "salary_max":  max(all_salaries) if all_salaries else 0,
            "salary_avg":  round(sum(all_salaries) / len(all_salaries)) if all_salaries else 0,
            # Open jobs
            "open_jobs":   mongo.db.jobs.count_documents({
                "status": "Open",
                "$or": [
                    {"skills": {"$regex": regex_pattern, "$options": "i"}},
                ]
            }),
            # Demand gap: open jobs vs available people
            "demand_gap":  mongo.db.jobs.count_documents({
                "status": "Open",
                "$or": [{"skills": {"$regex": regex_pattern, "$options": "i"}}]
            }) - bench_status_breakdown.get("Available", 0),
        }
    ), 200