

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


# # ── Helper: resolve full name from JWT identity (user _id string) ─────────────
# def _get_posted_by_name(identity: str) -> str:
#     """
#     Looks up the user document by _id and returns their full name.
#     Falls back gracefully if the user is not found.
#     """
#     try:
#         user = mongo.db.users.find_one({"_id": ObjectId(identity)})
#         if user:
#             first = user.get("first_name", "")
#             last  = user.get("last_name",  "")
#             full  = f"{first} {last}".strip()
#             return full if full else user.get("email", "Unknown")
#     except Exception:
#         pass
#     return "Unknown"


# # ── GET /api/jobs ─────────────────────────────────────────────────────────────
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


# # ── POST /api/jobs ────────────────────────────────────────────────────────────
# @job_bp.route("/", methods=["POST"])
# @jwt_required()
# def create_job():
#     identity = get_jwt_identity()          # user _id string from JWT
#     data     = request.get_json(silent=True) or {}

#     required = ["job_id", "title", "client_id", "client_name", "openings"]
#     for field in required:
#         if not data.get(field):
#             return jsonify(success=False, message=f"'{field}' is required"), 400

#     if mongo.db.jobs.find_one({"job_id": data["job_id"].upper().strip()}):
#         return jsonify(success=False, message="Job ID already exists"), 409

#     # ── Resolve the poster's full name from the users collection ─────────────
#     posted_by_name = _get_posted_by_name(identity)

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
#             posted_by      = identity,          # store _id for internal use
#             posted_by_name = posted_by_name,    # ← store human-readable name
#             deadline       = data.get("deadline"),
#             notes          = data.get("notes", ""),
#         )
#         result = mongo.db.jobs.insert_one(doc)

#         # Increment active_jobs counter on the linked client
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


# # ── GET /api/jobs/<id> ────────────────────────────────────────────────────────
# @job_bp.route("/<job_id>", methods=["GET"])
# @jwt_required()
# def get_job(job_id):
#     job, err = _find_job(job_id)
#     if err:
#         return err
#     return jsonify(success=True, data=serialize_job(job)), 200


# # ── PUT /api/jobs/<id> ────────────────────────────────────────────────────────
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


# # ── DELETE /api/jobs/<id> ─────────────────────────────────────────────────────
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


# # ── GET /api/jobs/meta/options ────────────────────────────────────────────────
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














# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from bson import ObjectId
# from bson.errors import InvalidId
# from datetime import datetime
# from extensions import mongo
# from models.Job_model import serialize_job, PRIORITIES, STATUSES, JOB_TYPES, WORK_MODES

# job_bp = Blueprint("jobs", __name__)


# # ── Private helpers ───────────────────────────────────────────────────────────

# def _find_job(job_id_str: str):
#     """Return (job_doc, None) or (None, error_response_tuple)."""
#     try:
#         oid = ObjectId(job_id_str)
#     except InvalidId:
#         return None, (jsonify(success=False, message="Invalid job ID"), 400)
#     job = mongo.db.jobs.find_one({"_id": oid})
#     if not job:
#         return None, (jsonify(success=False, message="Job not found"), 404)
#     return job, None


# def _get_posted_by_name(identity: str) -> str:
#     """Resolve full name from JWT identity (_id string)."""
#     try:
#         user = mongo.db.users.find_one({"_id": ObjectId(identity)})
#         if user:
#             first = user.get("first_name", "")
#             last  = user.get("last_name",  "")
#             full  = f"{first} {last}".strip()
#             return full if full else user.get("email", "Unknown")
#     except Exception:
#         pass
#     return "Unknown"


# def _int(val, default: int = 0) -> int:
#     try:    return int(val)
#     except: return default


# def _float(val, default: float = 0.0) -> float:
#     try:    return float(val)
#     except: return default


# def _build_doc(data: dict, identity: str, posted_by_name: str) -> dict:
#     """Build a full MongoDB document. Used only on POST (create)."""
#     return {
#         # ── Core ──────────────────────────────────────────────────────────────
#         "job_id":      data["job_id"].upper().strip(),
#         "title":       data["title"].strip(),
#         "client_id":   data["client_id"],
#         "client_name": data["client_name"],

#         # ── Job details ───────────────────────────────────────────────────────
#         "openings":       _int(data.get("openings", 1)),   # single vacancy field
#         "filled":         0,
#         "job_type":       data.get("job_type",    "Full-Time"),
#         "work_mode":      data.get("work_mode",   "On-site"),
#         "location":       data.get("location",    ""),
#         "experience_min": _int(data.get("experience_min",  0)),
#         "experience_max": _int(data.get("experience_max",  5)),
#         "salary_min":     _float(data.get("salary_min",    0)),
#         "salary_max":     _float(data.get("salary_max",    0)),
#         "skills":         data.get("skills",      []),
#         "description":    data.get("description", ""),
#         "priority":       data.get("priority",    "Medium"),
#         "status":         data.get("status",      "Open"),
#         "deadline":       data.get("deadline"),             # single date field
#         "applications":   0,
#         "notes":          data.get("notes",       ""),

#         # ── Posted by ─────────────────────────────────────────────────────────
#         "posted_by":      identity,
#         "posted_by_name": posted_by_name,

#         # ── Extended JD fields (prefix removed) ───────────────────────────────
#         "hiring_manager":       data.get("hiring_manager",        ""),
#         "programming_language": data.get("programming_language",  ""),
#         "programming_level":    data.get("programming_level",     ""),
#         "secondary_skills":     data.get("secondary_skills",      []),

#         # ── Screening config ──────────────────────────────────────────────────
#         "mcq_questions_count":            _int(data.get("mcq_questions_count",         0)),
#         "subjective_questions_count":     _int(data.get("subjective_questions_count",  0)),
#         "coding_questions_count":         _int(data.get("coding_questions_count",      0)),
#         "screening_time_minutes":         _int(data.get("screening_time_minutes",      0)),
#         "screening_test_pass_percentage": data.get("screening_test_pass_percentage",   ""),

#         # ── Question banks ────────────────────────────────────────────────────
#         "mcq_questions":        data.get("mcq_questions",         []),
#         "subjective_questions": data.get("subjective_questions",   []),
#         "coding_questions":     data.get("coding_questions",       []),

#         # ── Contacts ──────────────────────────────────────────────────────────
#         "recruiter_contacts":   data.get("recruiter_contacts",    []),
#         "interviewer_contacts": data.get("interviewer_contacts",   []),

#         # ── Lifecycle & meta (number_of_vacancies, open_positions removed) ────
#         "is_active":          data.get("is_active",          True),
#         "expiration_time":    data.get("expiration_time"),
#         "preferred_location": data.get("preferred_location", ""),
#         "department":         data.get("department",         ""),
#         "remarks":            data.get("remarks",            ""),
#         "jd_edit_status":     data.get("jd_edit_status",     ""),

#         # ── Timestamps ────────────────────────────────────────────────────────
#         "created_at": datetime.utcnow(),
#         "updated_at": datetime.utcnow(),
#     }


# # ── GET /api/jobs ─────────────────────────────────────────────────────────────
# @job_bp.route("/", methods=["GET"])
# @jwt_required()
# def get_jobs():
#     q         = request.args.get("q", "").strip()
#     status    = request.args.get("status",    "")
#     priority  = request.args.get("priority",  "")
#     client_id = request.args.get("client_id", "")
#     page      = max(1, _int(request.args.get("page",     1)))
#     per_page  = max(1, _int(request.args.get("per_page", 20)))

#     query = {}
#     if q:
#         query["$or"] = [
#             {"title":                {"$regex": q, "$options": "i"}},
#             {"client_name":          {"$regex": q, "$options": "i"}},
#             {"job_id":               {"$regex": q, "$options": "i"}},
#             {"location":             {"$regex": q, "$options": "i"}},
#             {"posted_by_name":       {"$regex": q, "$options": "i"}},
#             {"department":           {"$regex": q, "$options": "i"}},
#             {"programming_language": {"$regex": q, "$options": "i"}},
#         ]
#     if status:    query["status"]    = status
#     if priority:  query["priority"]  = priority
#     if client_id: query["client_id"] = client_id

#     total = mongo.db.jobs.count_documents(query)
#     jobs  = list(
#         mongo.db.jobs.find(query)
#         .sort("created_at", -1)
#         .skip((page - 1) * per_page)
#         .limit(per_page)
#     )

#     return jsonify(
#         success  = True,
#         data     = [serialize_job(j) for j in jobs],
#         total    = total,
#         page     = page,
#         per_page = per_page,
#         pages    = (total + per_page - 1) // per_page,
#     ), 200


# # ── GET /api/jobs/meta/options ────────────────────────────────────────────────
# # Defined BEFORE /<job_id> so Flask does not treat "meta" as an _id param
# @job_bp.route("/meta/options", methods=["GET"])
# @jwt_required()
# def get_options():
#     return jsonify(
#         success    = True,
#         priorities = PRIORITIES,
#         statuses   = STATUSES,
#         job_types  = JOB_TYPES,
#         work_modes = WORK_MODES,
#     ), 200


# # ── POST /api/jobs ────────────────────────────────────────────────────────────
# @job_bp.route("/", methods=["POST"])
# @jwt_required()
# def create_job():
#     identity = get_jwt_identity()
#     data     = request.get_json(silent=True) or {}

#     # Required field check
#     for field in ["job_id", "title", "client_id", "client_name"]:
#         if not data.get(field):
#             return jsonify(success=False, message=f"'{field}' is required"), 400

#     # Enum validation
#     if data.get("priority", "Medium") not in PRIORITIES:
#         return jsonify(success=False, message=f"priority must be one of {PRIORITIES}"), 400
#     if data.get("status", "Open") not in STATUSES:
#         return jsonify(success=False, message=f"status must be one of {STATUSES}"), 400

#     # Duplicate job_id check
#     if mongo.db.jobs.find_one({"job_id": data["job_id"].upper().strip()}):
#         return jsonify(success=False, message="Job ID already exists"), 409

#     posted_by_name = _get_posted_by_name(identity)

#     try:
#         doc    = _build_doc(data, identity, posted_by_name)
#         result = mongo.db.jobs.insert_one(doc)

#         mongo.db.clients.update_one(
#             {"client_id": data["client_id"]},
#             {"$inc": {"active_jobs": 1}}
#         )

#         doc["_id"] = result.inserted_id
#         return jsonify(success=True, message="Job created", data=serialize_job(doc)), 201

#     except Exception as e:
#         return jsonify(success=False, message="Failed to create job", error=str(e)), 500


# # ── GET /api/jobs/<id> ────────────────────────────────────────────────────────
# @job_bp.route("/<job_id>", methods=["GET"])
# @jwt_required()
# def get_job(job_id):
#     job, err = _find_job(job_id)
#     if err:
#         return err
#     return jsonify(success=True, data=serialize_job(job)), 200


# # ── PUT /api/jobs/<id> ────────────────────────────────────────────────────────
# @job_bp.route("/<job_id>", methods=["PUT"])
# @jwt_required()
# def update_job(job_id):
#     job, err = _find_job(job_id)
#     if err:
#         return err

#     data = request.get_json(silent=True) or {}

#     allowed = [
#         # job details
#         "title", "openings", "job_type", "work_mode", "location",
#         "experience_min", "experience_max", "salary_min", "salary_max",
#         "skills", "description", "priority", "status",
#         "deadline",                         # single date field
#         "notes",

#         # extended JD fields (prefix removed)
#         "hiring_manager", "programming_language", "programming_level",
#         "secondary_skills",

#         # screening config
#         "mcq_questions_count", "subjective_questions_count",
#         "coding_questions_count", "screening_time_minutes",
#         "screening_test_pass_percentage",

#         # NOTE: question banks updated via PATCH /<id>/questions only

#         # contacts
#         "recruiter_contacts", "interviewer_contacts",

#         # lifecycle & meta (number_of_vacancies, open_positions, application_deadline removed)
#         "is_active", "expiration_time", "preferred_location",
#         "department", "remarks", "jd_edit_status",
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


# # ── PATCH /api/jobs/<id>/questions ────────────────────────────────────────────
# @job_bp.route("/<job_id>/questions", methods=["PATCH"])
# @jwt_required()
# def update_questions(job_id):
#     job, err = _find_job(job_id)
#     if err:
#         return err

#     data   = request.get_json(silent=True) or {}
#     update = {}

#     if "mcq_questions"        in data: update["mcq_questions"]        = data["mcq_questions"]
#     if "subjective_questions" in data: update["subjective_questions"]  = data["subjective_questions"]
#     if "coding_questions"     in data: update["coding_questions"]      = data["coding_questions"]

#     if not update:
#         return jsonify(success=False, message="No question banks provided"), 400

#     update["updated_at"] = datetime.utcnow()
#     mongo.db.jobs.update_one({"_id": job["_id"]}, {"$set": update})
#     updated = mongo.db.jobs.find_one({"_id": job["_id"]})
#     return jsonify(success=True, message="Question banks updated", data=serialize_job(updated)), 200


# # ── DELETE /api/jobs/<id> ─────────────────────────────────────────────────────
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












from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from extensions import mongo
from models.Job_model import serialize_job, PRIORITIES, STATUSES, JOB_TYPES, WORK_MODES

job_bp = Blueprint("jobs", __name__)


# ═════════════════════════════════════════════════════════════════════════════
#  SECTION A — SHARED HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def _int(val, default: int = 0) -> int:
    try:    return int(val)
    except: return default

def _float(val, default: float = 0.0) -> float:
    try:    return float(val)
    except: return default


# ═════════════════════════════════════════════════════════════════════════════
#  SECTION B — JOBS  (/api/jobs/...)
# ═════════════════════════════════════════════════════════════════════════════

def _find_job(job_id_str: str):
    """Return (job_doc, None) or (None, error_response_tuple)."""
    try:
        oid = ObjectId(job_id_str)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid job ID"), 400)
    job = mongo.db.jobs.find_one({"_id": oid})
    if not job:
        return None, (jsonify(success=False, message="Job not found"), 404)
    return job, None


def _get_posted_by_name(identity: str) -> str:
    """Resolve full name from JWT identity (_id string)."""
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


def _build_doc(data: dict, identity: str, posted_by_name: str) -> dict:
    """Build a full MongoDB document for the jobs collection. Used only on POST."""
    return {
        # ── Core ──────────────────────────────────────────────────────────────
        "job_id":      data["job_id"].upper().strip(),
        "title":       data["title"].strip(),
        "client_id":   data["client_id"],
        "client_name": data["client_name"],

        # ── Job details ───────────────────────────────────────────────────────
        "openings":       _int(data.get("openings", 1)),
        "filled":         0,
        "job_type":       data.get("job_type",    "Full-Time"),
        "work_mode":      data.get("work_mode",   "On-site"),
        "location":       data.get("location",    ""),
        "experience_min": _int(data.get("experience_min",  0)),
        "experience_max": _int(data.get("experience_max",  5)),
        "salary_min":     _float(data.get("salary_min",    0)),
        "salary_max":     _float(data.get("salary_max",    0)),
        "skills":         data.get("skills",      []),
        "description":    data.get("description", ""),
        "priority":       data.get("priority",    "Medium"),
        "status":         data.get("status",      "Open"),
        "deadline":       data.get("deadline"),
        "applications":   0,
        "notes":          data.get("notes",       ""),

        # ── Posted by ─────────────────────────────────────────────────────────
        "posted_by":      identity,
        "posted_by_name": posted_by_name,

        # ── Extended JD fields ────────────────────────────────────────────────
        "hiring_manager":       data.get("hiring_manager",        ""),
        "programming_language": data.get("programming_language",  ""),
        "programming_level":    data.get("programming_level",     ""),
        "secondary_skills":     data.get("secondary_skills",      []),

        # ── Screening config ──────────────────────────────────────────────────
        "mcq_questions_count":            _int(data.get("mcq_questions_count",         0)),
        "subjective_questions_count":     _int(data.get("subjective_questions_count",  0)),
        "coding_questions_count":         _int(data.get("coding_questions_count",      0)),
        "screening_time_minutes":         _int(data.get("screening_time_minutes",      0)),
        "screening_test_pass_percentage": data.get("screening_test_pass_percentage",   ""),

        # ── Question banks ────────────────────────────────────────────────────
        "mcq_questions":        data.get("mcq_questions",         []),
        "subjective_questions": data.get("subjective_questions",   []),
        "coding_questions":     data.get("coding_questions",       []),

        # ── Contacts ──────────────────────────────────────────────────────────
        "recruiter_contacts":   data.get("recruiter_contacts",    []),
        "interviewer_contacts": data.get("interviewer_contacts",   []),

        # ── Lifecycle & meta ──────────────────────────────────────────────────
        "is_active":          data.get("is_active",          True),
        "expiration_time":    data.get("expiration_time"),
        "preferred_location": data.get("preferred_location", ""),
        "department":         data.get("department",         ""),
        "remarks":            data.get("remarks",            ""),
        "jd_edit_status":     data.get("jd_edit_status",     ""),

        # ── Timestamps ────────────────────────────────────────────────────────
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


# ── GET /api/jobs ─────────────────────────────────────────────────────────────
@job_bp.route("/", methods=["GET"])
@jwt_required()
def get_jobs():
    q         = request.args.get("q", "").strip()
    status    = request.args.get("status",    "")
    priority  = request.args.get("priority",  "")
    client_id = request.args.get("client_id", "")
    page      = max(1, _int(request.args.get("page",     1)))
    per_page  = max(1, _int(request.args.get("per_page", 20)))

    query = {}
    if q:
        query["$or"] = [
            {"title":                {"$regex": q, "$options": "i"}},
            {"client_name":          {"$regex": q, "$options": "i"}},
            {"job_id":               {"$regex": q, "$options": "i"}},
            {"location":             {"$regex": q, "$options": "i"}},
            {"posted_by_name":       {"$regex": q, "$options": "i"}},
            {"department":           {"$regex": q, "$options": "i"}},
            {"programming_language": {"$regex": q, "$options": "i"}},
        ]
    if status:    query["status"]    = status
    if priority:  query["priority"]  = priority
    if client_id: query["client_id"] = client_id

    total = mongo.db.jobs.count_documents(query)
    jobs  = list(
        mongo.db.jobs.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(
        success  = True,
        data     = [serialize_job(j) for j in jobs],
        total    = total,
        page     = page,
        per_page = per_page,
        pages    = (total + per_page - 1) // per_page,
    ), 200


# ── GET /api/jobs/meta/options ────────────────────────────────────────────────
# Must stay BEFORE /<job_id> so Flask does not treat "meta" as an _id param
@job_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def get_options():
    return jsonify(
        success    = True,
        priorities = PRIORITIES,
        statuses   = STATUSES,
        job_types  = JOB_TYPES,
        work_modes = WORK_MODES,
    ), 200


# ── POST /api/jobs ────────────────────────────────────────────────────────────
@job_bp.route("/", methods=["POST"])
@jwt_required()
def create_job():
    identity = get_jwt_identity()
    data     = request.get_json(silent=True) or {}

    for field in ["job_id", "title", "client_id", "client_name"]:
        if not data.get(field):
            return jsonify(success=False, message=f"'{field}' is required"), 400

    if data.get("priority", "Medium") not in PRIORITIES:
        return jsonify(success=False, message=f"priority must be one of {PRIORITIES}"), 400
    if data.get("status", "Open") not in STATUSES:
        return jsonify(success=False, message=f"status must be one of {STATUSES}"), 400

    if mongo.db.jobs.find_one({"job_id": data["job_id"].upper().strip()}):
        return jsonify(success=False, message="Job ID already exists"), 409

    posted_by_name = _get_posted_by_name(identity)

    try:
        doc    = _build_doc(data, identity, posted_by_name)
        result = mongo.db.jobs.insert_one(doc)
        mongo.db.clients.update_one(
            {"client_id": data["client_id"]},
            {"$inc": {"active_jobs": 1}}
        )
        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Job created", data=serialize_job(doc)), 201
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

    data    = request.get_json(silent=True) or {}
    allowed = [
        "title", "openings", "job_type", "work_mode", "location",
        "experience_min", "experience_max", "salary_min", "salary_max",
        "skills", "description", "priority", "status", "deadline", "notes",
        "hiring_manager", "programming_language", "programming_level", "secondary_skills",
        "mcq_questions_count", "subjective_questions_count",
        "coding_questions_count", "screening_time_minutes", "screening_test_pass_percentage",
        # question banks intentionally excluded — use PATCH /<id>/questions
        "recruiter_contacts", "interviewer_contacts",
        "is_active", "expiration_time", "preferred_location",
        "department", "remarks", "jd_edit_status",
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


# ── PATCH /api/jobs/<id>/questions ────────────────────────────────────────────
@job_bp.route("/<job_id>/questions", methods=["PATCH"])
@jwt_required()
def update_questions(job_id):
    job, err = _find_job(job_id)
    if err:
        return err

    data   = request.get_json(silent=True) or {}
    update = {}
    if "mcq_questions"        in data: update["mcq_questions"]        = data["mcq_questions"]
    if "subjective_questions" in data: update["subjective_questions"]  = data["subjective_questions"]
    if "coding_questions"     in data: update["coding_questions"]      = data["coding_questions"]

    if not update:
        return jsonify(success=False, message="No question banks provided"), 400

    update["updated_at"] = datetime.utcnow()
    mongo.db.jobs.update_one({"_id": job["_id"]}, {"$set": update})
    updated = mongo.db.jobs.find_one({"_id": job["_id"]})
    return jsonify(success=True, message="Question banks updated", data=serialize_job(updated)), 200


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



@job_bp.route("/debug/mongo", methods=["GET"])
def debug_mongo():
    attrs = [a for a in dir(mongo) if not a.startswith("_")]
    return jsonify(attrs=attrs)
# ✅ CORRECT
def _jd_col():
    try:
        client = mongo.cx                          # Flask-PyMongo 2.x
    except AttributeError:
        client = mongo.connection                  # Flask-PyMongo 0.x / 1.x fallback

    return client["resourcing_bot_db"]["jd_details"]   # ← no double underscores


def _serialize_jd(doc: dict) -> dict:
    """
    Convert a raw jd_details document to a JSON-safe dict.
    Handles camelCase Mongoose field names as-is — no renaming.
    """
    j = dict(doc)
    j["_id"] = str(j.get("_id", ""))

    # ObjectId single refs → strings
    if isinstance(j.get("hiringManager"), ObjectId):
        j["hiringManager"] = str(j["hiringManager"])

    # ObjectId array refs → string arrays
    for arr in ("recruiterContacts", "interviewerContacts"):
        if isinstance(j.get(arr), list):
            j[arr] = [str(v) if isinstance(v, ObjectId) else v for v in j[arr]]

    # datetime fields → ISO strings
    for dt in ("creation_time", "expiration_time"):
        if isinstance(j.get(dt), datetime):
            j[dt] = j[dt].isoformat()

    # Remove internal Mongoose version key
    j.pop("__v", None)

    return j


def _find_jd(jd_id_str: str):
    """Return (jd_doc, None) or (None, error_response_tuple)."""
    try:
        oid = ObjectId(jd_id_str)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid JD ID"), 400)
    doc = _jd_col().find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="JD not found"), 404)
    return doc, None


# ── GET /api/jobs/jd ─────────────────────────────────────────────────────────
# Must be defined BEFORE /api/jobs/<job_id> to avoid Flask routing conflict.
# Flask matches routes top-to-bottom; /jd/ is a fixed segment and wins over
# the dynamic <job_id> only if it appears first in the source file.
@job_bp.route("/jd/", methods=["GET"])
@jwt_required()
def get_jds():
    q         = request.args.get("q", "").strip()
    is_active = request.args.get("is_active", "")
    page      = max(1, _int(request.args.get("page",     1)))
    per_page  = max(1, _int(request.args.get("per_page", 20)))

    query = {}
    if q:
        query["$or"] = [
            {"jdID":        {"$regex": q, "$options": "i"}},
            {"companyName": {"$regex": q, "$options": "i"}},
            {"jobRole":     {"$regex": q, "$options": "i"}},
        ]
    if is_active in ("true", "false"):
        query["is_active"] = is_active == "true"

    col   = _jd_col()
    total = col.count_documents(query)
    docs  = list(
        col.find(query)
        .sort("creation_time", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(
        success  = True,
        data     = [_serialize_jd(d) for d in docs],
        total    = total,
        page     = page,
        per_page = per_page,
        pages    = (total + per_page - 1) // per_page,
    ), 200


# ── GET /api/jobs/jd/<id> ─────────────────────────────────────────────────────
@job_bp.route("/jd/<jd_id>", methods=["GET"])
@jwt_required()
def get_jd(jd_id):
    doc, err = _find_jd(jd_id)
    if err:
        return err
    return jsonify(success=True, data=_serialize_jd(doc)), 200