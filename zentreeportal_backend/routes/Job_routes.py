# """
# Job routes: /api/jobs/...
# """
# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from bson import ObjectId
# from bson.errors import InvalidId
# from datetime import datetime
# from extensions import mongo
# from models.Job_model import job_schema, serialize_job, PRIORITIES, STATUSES, JOB_TYPES, WORK_MODES

# job_bp = Blueprint("jobs", __name__)


# def _find_job(job_id_str: str):
#     try:
#         oid = ObjectId(job_id_str)
#     except InvalidId:
#         return None, (jsonify(success=False, message="Invalid job ID"), 400)
#     job = mongo.db.jobs.find_one({"_id": oid})
#     if not job:
#         return None, (jsonify(success=False, message="Job not found"), 404)
#     return job, None


# # ── GET /api/jobs ─────────────────────────────────────────────────────────
# @job_bp.route("/", methods=["GET"])
# @jwt_required()
# def get_jobs():
#     q         = request.args.get("q", "").strip()
#     status    = request.args.get("status", "")
#     priority  = request.args.get("priority", "")
#     client_id = request.args.get("client_id", "")
#     page      = int(request.args.get("page", 1))
#     per_page  = int(request.args.get("per_page", 20))

#     query = {}
#     if q:
#         query["$or"] = [
#             {"title":       {"$regex": q, "$options": "i"}},
#             {"client_name": {"$regex": q, "$options": "i"}},
#             {"job_id":      {"$regex": q, "$options": "i"}},
#         ]
#     if status:
#         query["status"] = status
#     if priority:
#         query["priority"] = priority
#     if client_id:
#         query["client_id"] = client_id

#     total = mongo.db.jobs.count_documents(query)
#     jobs  = list(
#         mongo.db.jobs.find(query)
#         .sort("created_at", -1)
#         .skip((page - 1) * per_page)
#         .limit(per_page)
#     )
#     return jsonify(
#         success=True,
#         data=[serialize_job(j) for j in jobs],
#         total=total,
#         page=page,
#         per_page=per_page,
#         pages=(total + per_page - 1) // per_page,
#     ), 200


# # ── POST /api/jobs ────────────────────────────────────────────────────────
# @job_bp.route("/", methods=["POST"])
# @jwt_required()
# def create_job():
#     identity = get_jwt_identity()
#     data = request.get_json(silent=True) or {}
#     required = ["job_id", "title", "client_id", "client_name", "openings"]
#     for field in required:
#         if not data.get(field):
#             return jsonify(success=False, message=f"'{field}' is required"), 400

#     if mongo.db.jobs.find_one({"job_id": data["job_id"].upper().strip()}):
#         return jsonify(success=False, message="Job ID already exists"), 409

#     try:
#         doc = job_schema(
#             job_id         = data["job_id"],
#             title          = data["title"],
#             client_id      = data["client_id"],
#             client_name    = data["client_name"],
#             openings       = int(data["openings"]),
#             job_type       = data.get("job_type", "Full-Time"),
#             work_mode      = data.get("work_mode", "On-site"),
#             location       = data.get("location", ""),
#             experience_min = int(data.get("experience_min", 0)),
#             experience_max = int(data.get("experience_max", 5)),
#             salary_min     = float(data.get("salary_min", 0)),
#             salary_max     = float(data.get("salary_max", 0)),
#             skills         = data.get("skills", []),
#             description    = data.get("description", ""),
#             priority       = data.get("priority", "Medium"),
#             status         = data.get("status", "Open"),
#             posted_by      = identity,
#             deadline       = data.get("deadline"),
#             notes          = data.get("notes", ""),
#         )
#         result = mongo.db.jobs.insert_one(doc)
#         # increment active_jobs counter on client
#         mongo.db.clients.update_one(
#             {"client_id": data["client_id"]},
#             {"$inc": {"active_jobs": 1}}
#         )
#         doc["_id"] = result.inserted_id
#         return jsonify(success=True, message="Job created", data=serialize_job(doc)), 201
#     except ValueError as e:
#         return jsonify(success=False, message=str(e)), 400
#     except Exception as e:
#         return jsonify(success=False, message="Failed to create job", error=str(e)), 500


# # ── GET /api/jobs/<id> ─────────────────────────────────────────────────────
# @job_bp.route("/<job_id>", methods=["GET"])
# @jwt_required()
# def get_job(job_id):
#     job, err = _find_job(job_id)
#     if err:
#         return err
#     return jsonify(success=True, data=serialize_job(job)), 200


# # ── PUT /api/jobs/<id> ─────────────────────────────────────────────────────
# @job_bp.route("/<job_id>", methods=["PUT"])
# @jwt_required()
# def update_job(job_id):
#     job, err = _find_job(job_id)
#     if err:
#         return err

#     data = request.get_json(silent=True) or {}
#     allowed = [
#         "title", "openings", "job_type", "work_mode", "location",
#         "experience_min", "experience_max", "salary_min", "salary_max",
#         "skills", "description", "priority", "status", "deadline", "notes",
#     ]
#     update = {k: data[k] for k in allowed if k in data}
#     if not update:
#         return jsonify(success=False, message="No valid fields to update"), 400

#     if "priority" in update and update["priority"] not in PRIORITIES:
#         return jsonify(success=False, message="Invalid priority"), 400
#     if "status" in update and update["status"] not in STATUSES:
#         return jsonify(success=False, message="Invalid status"), 400

#     update["updated_at"] = datetime.utcnow()
#     mongo.db.jobs.update_one({"_id": job["_id"]}, {"$set": update})
#     updated = mongo.db.jobs.find_one({"_id": job["_id"]})
#     return jsonify(success=True, message="Job updated", data=serialize_job(updated)), 200


# # ── DELETE /api/jobs/<id> ──────────────────────────────────────────────────
# @job_bp.route("/<job_id>", methods=["DELETE"])
# @jwt_required()
# def delete_job(job_id):
#     job, err = _find_job(job_id)
#     if err:
#         return err
#     mongo.db.jobs.delete_one({"_id": job["_id"]})
#     mongo.db.clients.update_one(
#         {"client_id": job["client_id"]},
#         {"$inc": {"active_jobs": -1}}
#     )
#     return jsonify(success=True, message="Job deleted"), 200


# # ── GET /api/jobs/meta/options ─────────────────────────────────────────────
# @job_bp.route("/meta/options", methods=["GET"])
# @jwt_required()
# def get_options():
#     return jsonify(
#         success=True,
#         priorities=PRIORITIES,
#         statuses=STATUSES,
#         job_types=JOB_TYPES,
#         work_modes=WORK_MODES,
#     ), 200




"""
Job routes: /api/jobs/...
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from extensions import mongo
from models.Job_model import job_schema, serialize_job, PRIORITIES, STATUSES, JOB_TYPES, WORK_MODES

job_bp = Blueprint("jobs", __name__)


def _find_job(job_id_str: str):
    try:
        oid = ObjectId(job_id_str)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid job ID"), 400)
    job = mongo.db.jobs.find_one({"_id": oid})
    if not job:
        return None, (jsonify(success=False, message="Job not found"), 404)
    return job, None


# ── Helper: resolve full name from JWT identity (user _id string) ─────────────
def _get_posted_by_name(identity: str) -> str:
    """
    Looks up the user document by _id and returns their full name.
    Falls back gracefully if the user is not found.
    """
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(identity)})
        if user:
            first = user.get("first_name", "")
            last  = user.get("last_name",  "")
            full  = f"{first} {last}".strip()
            return full if full else user.get("email", "Unknown")
    except Exception:
        pass
    return "Unknown"


# ── GET /api/jobs ─────────────────────────────────────────────────────────────
@job_bp.route("/", methods=["GET"])
@jwt_required()
def get_jobs():
    q         = request.args.get("q", "").strip()
    status    = request.args.get("status", "")
    priority  = request.args.get("priority", "")
    client_id = request.args.get("client_id", "")
    page      = int(request.args.get("page", 1))
    per_page  = int(request.args.get("per_page", 20))

    query = {}
    if q:
        query["$or"] = [
            {"title":       {"$regex": q, "$options": "i"}},
            {"client_name": {"$regex": q, "$options": "i"}},
            {"job_id":      {"$regex": q, "$options": "i"}},
        ]
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if client_id:
        query["client_id"] = client_id

    total = mongo.db.jobs.count_documents(query)
    jobs  = list(
        mongo.db.jobs.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(
        success=True,
        data=[serialize_job(j) for j in jobs],
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page,
    ), 200


# ── POST /api/jobs ────────────────────────────────────────────────────────────
@job_bp.route("/", methods=["POST"])
@jwt_required()
def create_job():
    identity = get_jwt_identity()          # user _id string from JWT
    data     = request.get_json(silent=True) or {}

    required = ["job_id", "title", "client_id", "client_name", "openings"]
    for field in required:
        if not data.get(field):
            return jsonify(success=False, message=f"'{field}' is required"), 400

    if mongo.db.jobs.find_one({"job_id": data["job_id"].upper().strip()}):
        return jsonify(success=False, message="Job ID already exists"), 409

    # ── Resolve the poster's full name from the users collection ─────────────
    posted_by_name = _get_posted_by_name(identity)

    try:
        doc = job_schema(
            job_id         = data["job_id"],
            title          = data["title"],
            client_id      = data["client_id"],
            client_name    = data["client_name"],
            openings       = int(data["openings"]),
            job_type       = data.get("job_type", "Full-Time"),
            work_mode      = data.get("work_mode", "On-site"),
            location       = data.get("location", ""),
            experience_min = int(data.get("experience_min", 0)),
            experience_max = int(data.get("experience_max", 5)),
            salary_min     = float(data.get("salary_min", 0)),
            salary_max     = float(data.get("salary_max", 0)),
            skills         = data.get("skills", []),
            description    = data.get("description", ""),
            priority       = data.get("priority", "Medium"),
            status         = data.get("status", "Open"),
            posted_by      = identity,          # store _id for internal use
            posted_by_name = posted_by_name,    # ← store human-readable name
            deadline       = data.get("deadline"),
            notes          = data.get("notes", ""),
        )
        result = mongo.db.jobs.insert_one(doc)

        # Increment active_jobs counter on the linked client
        mongo.db.clients.update_one(
            {"client_id": data["client_id"]},
            {"$inc": {"active_jobs": 1}}
        )

        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Job created", data=serialize_job(doc)), 201

    except ValueError as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message="Failed to create job", error=str(e)), 500


# ── GET /api/jobs/<id> ────────────────────────────────────────────────────────
@job_bp.route("/<job_id>", methods=["GET"])
@jwt_required()
def get_job(job_id):
    job, err = _find_job(job_id)
    if err:
        return err
    return jsonify(success=True, data=serialize_job(job)), 200


# ── PUT /api/jobs/<id> ────────────────────────────────────────────────────────
@job_bp.route("/<job_id>", methods=["PUT"])
@jwt_required()
def update_job(job_id):
    job, err = _find_job(job_id)
    if err:
        return err

    data = request.get_json(silent=True) or {}
    allowed = [
        "title", "openings", "job_type", "work_mode", "location",
        "experience_min", "experience_max", "salary_min", "salary_max",
        "skills", "description", "priority", "status", "deadline", "notes",
    ]
    update = {k: data[k] for k in allowed if k in data}
    if not update:
        return jsonify(success=False, message="No valid fields to update"), 400

    if "priority" in update and update["priority"] not in PRIORITIES:
        return jsonify(success=False, message="Invalid priority"), 400
    if "status" in update and update["status"] not in STATUSES:
        return jsonify(success=False, message="Invalid status"), 400

    update["updated_at"] = datetime.utcnow()
    mongo.db.jobs.update_one({"_id": job["_id"]}, {"$set": update})
    updated = mongo.db.jobs.find_one({"_id": job["_id"]})
    return jsonify(success=True, message="Job updated", data=serialize_job(updated)), 200


# ── DELETE /api/jobs/<id> ─────────────────────────────────────────────────────
@job_bp.route("/<job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    job, err = _find_job(job_id)
    if err:
        return err
    mongo.db.jobs.delete_one({"_id": job["_id"]})
    mongo.db.clients.update_one(
        {"client_id": job["client_id"]},
        {"$inc": {"active_jobs": -1}}
    )
    return jsonify(success=True, message="Job deleted"), 200


# ── GET /api/jobs/meta/options ────────────────────────────────────────────────
@job_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def get_options():
    return jsonify(
        success=True,
        priorities=PRIORITIES,
        statuses=STATUSES,
        job_types=JOB_TYPES,
        work_modes=WORK_MODES,
    ), 200