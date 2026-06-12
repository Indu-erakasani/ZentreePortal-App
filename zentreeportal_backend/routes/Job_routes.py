

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from extensions import mongo, resourcing_db
from models.Job_model import serialize_job, PRIORITIES, STATUSES, JOB_TYPES, WORK_MODES
import re
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
    # job = mongo.db.jobs.find_one({"_id": oid})
    job = resourcing_db["jobs"].find_one({"_id": oid})
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


def _sync_job_to_resourcingbot(data: dict, identity: str, posted_by_name: str):
    """
    Mirror a newly created ZentreePortal job into ResourcingBot's jd_details
    collection. Marks the source as 'recruitment_portal' so it's identifiable.
    Fails silently — a ResourcingBot write failure must not break the main flow.
    """
    try:
        # ── Resolve the poster's email from ZentreePortal users ───────────────
        current_user = mongo.db.users.find_one({"_id": ObjectId(identity)})
        user_email   = current_user.get("email", "") if current_user else ""
        user_role    = current_user.get("role",  "") if current_user else ""

        # ── Find the matching user in ResourcingBot by email ──────────────────
        rb_user = resourcing_db["users"].find_one({"email": user_email}) if user_email else None

        # ── Build recruiterContacts: ObjectId list if poster is a recruiter ───
        recruiter_contacts = []
        if rb_user and user_role == "recruiter":
            recruiter_contacts = [rb_user["_id"]]

        # ── Skills: ZentreePortal stores as list, ResourcingBot expects list ──
        skills = data.get("skills", [])
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

        secondary_skills = data.get("secondary_skills", [])
        if isinstance(secondary_skills, str):
            secondary_skills = [s.strip() for s in secondary_skills.split(",") if s.strip()]

        rb_jd_doc = {
            # ── Identifiers ───────────────────────────────────────────────────
            "jdID":              data["job_id"].upper().strip(),
            "companyName":       data.get("client_name", ""),

            # ── Job details ───────────────────────────────────────────────────
            "jobRole":           data.get("title", ""),
            "jobDescription":    data.get("description", ""),
            "skills":            skills,
            "secondarySkills":   secondary_skills,
            "experience":        f"{data.get('experience_min', 0)}-{data.get('experience_max', 5)}",
            "salaryRange":       f"{data.get('salary_min', '')} - {data.get('salary_max', '')}",
            "preferredLocation": data.get("preferred_location", data.get("location", "")),
            "department":        data.get("department", ""),
            "openPositions":     _int(data.get("openings", 1)),
            "remarks":           data.get("remarks", ""),
            "programmingLanguage": data.get("programming_language", ""),
            "programmingLevel":    data.get("programming_level", ""),

            # ── Screening config ──────────────────────────────────────────────
            "mcq_questions_count":        _int(data.get("mcq_questions_count",        0)),
            "subjective_questions_count": _int(data.get("subjective_questions_count", 0)),
            "coding_questions_count":     _int(data.get("coding_questions_count",     0)),
            "screening_time_minutes":     _int(data.get("screening_time_minutes",     0)),
            "screeningTestPassPercentage": data.get("screening_test_pass_percentage", ""),

            # ── Contacts ──────────────────────────────────────────────────────
            "recruiterContacts":   recruiter_contacts,
            "interviewerContacts": [],
            "hiringManager":       None,

            # ── Lifecycle ─────────────────────────────────────────────────────
            "is_active":       data.get("is_active", True),
            "creation_time":   datetime.utcnow(),
            "expiration_time": datetime.fromisoformat(data["deadline"]) if data.get("deadline") else None,

            # ── Source tracking ───────────────────────────────────────────────
            "source":              "recruitment_portal",   # ← marks origin
            "posted_by_name":      posted_by_name,
            "posted_by_email":     user_email,
            "zentree_job_id":      data["job_id"].upper().strip(),  # cross-reference

            # ── Timestamps ────────────────────────────────────────────────────
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        resourcing_db["jd_details"].insert_one(rb_jd_doc)

    except Exception as e:
        # Log but never crash the main request
        print(f"[ResourcingBot sync warning] Failed to mirror job: {e}")
        
        
        
        
# ── GET /api/jobs ─────────────────────────────────────────────────────────────
@job_bp.route("/", methods=["GET"])
@jwt_required()
def get_jobs():
    identity = get_jwt_identity()   # ← already available from jwt_required

    q         = request.args.get("q", "").strip()
    status    = request.args.get("status",    "")
    priority  = request.args.get("priority",  "")
    client_id = request.args.get("client_id", "")
    page      = max(1, _int(request.args.get("page",     1)))
    per_page  = max(1, _int(request.args.get("per_page", 20)))

    # ── Fetch the logged-in user to check their role ──────────────────────────
    current_user = mongo.db.users.find_one({"_id": ObjectId(identity)})
    user_role    = current_user.get("role", "") if current_user else ""

    query = {}

    # ── Recruiters only see jobs they posted ──────────────────────────────────
    if user_role == "recruiter":
        query["posted_by"] = identity   # stored as string in _build_doc()

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
        # ── Write to ZentreePortal DB (existing) ─────────────────────────────
        doc    = _build_doc(data, identity, posted_by_name)
        result = mongo.db.jobs.insert_one(doc)
        mongo.db.clients.update_one(
            {"client_id": data["client_id"]},
            {"$inc": {"active_jobs": 1}}
        )
        doc["_id"] = result.inserted_id

        # ── Sync to ResourcingBot DB ──────────────────────────────────────────
        _sync_job_to_resourcingbot(data, identity, posted_by_name)

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
# def _jd_col():
#     try:
#         client = mongo.cx                          # Flask-PyMongo 2.x
#     except AttributeError:
#         client = mongo.connection                  # Flask-PyMongo 0.x / 1.x fallback

#     return client["resourcing_bot_db"]["jd_details"]   # ← no double underscores
def _jd_col():
    return resourcing_db["jd_details"]



def _serialize_jd(doc: dict) -> dict:
    """
    Recursively convert ALL ObjectIds to strings.
    Handles nested dicts, lists, and direct ObjectId values.
    """
    def _convert(obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: _convert(v) for k, v in obj.items() if k != "__v"}
        if isinstance(obj, list):
            return [_convert(v) for v in obj]
        return obj

    return _convert(doc)


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
    identity = get_jwt_identity()   # logged-in user's _id string (ZentreePortal)

    q         = request.args.get("q", "").strip()
    is_active = request.args.get("is_active", "")
    company = request.args.get("company", "").strip()
    page      = max(1, _int(request.args.get("page",     1)))
    per_page  = max(1, _int(request.args.get("per_page", 20)))

    col = _jd_col()   # resourcing_bot_db["jd_details"]

    # ── Resolve the logged-in user's role and ResourcingBot _id ──────────────
    current_user = mongo.db.users.find_one({"_id": ObjectId(identity)})
    user_role    = current_user.get("role", "") if current_user else ""
    user_email   = current_user.get("email", "") if current_user else ""

    query = {}
    
    
    if company:
            query["companyName"] = {"$regex": re.escape(company), "$options": "i"}
            
            
    if user_role == "recruiter":
        # Find this recruiter's record in ResourcingBot DB by email
        rb_user = resourcing_db["users"].find_one({
            "email": user_email,
            "userType": "recruiter"
        })

        if not rb_user:
            # Recruiter exists in ZentreePortal but not in ResourcingBot —
            # return empty result rather than erroring out
            return jsonify(
                success  = True,
                data     = [],
                total    = 0,
                page     = page,
                per_page = per_page,
                pages    = 0,
                message  = "No ResourcingBot account found for this recruiter"
            ), 200

        rb_user_id = rb_user["_id"]   # ObjectId in ResourcingBot

        # Filter JDs where recruiterContacts array contains this ObjectId
        query["recruiterContacts"] = rb_user_id

    # ── Search filters (applied on top of role filter) ────────────────────────
    if q:
        query["$or"] = [
            {"jdID":        {"$regex": q, "$options": "i"}},
            {"companyName": {"$regex": q, "$options": "i"}},
            {"jobRole":     {"$regex": q, "$options": "i"}},
        ]
    if is_active in ("true", "false"):
        query["is_active"] = is_active == "true"

    total = col.count_documents(query)
    docs  = list(
        col.find(query)
        .sort("creation_time", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    # ── Auto-expire JDs past their expiration_time ────────────────────────────
    now = datetime.utcnow()
    for doc in docs:
        exp = doc.get("expiration_time") or doc.get("deadline")
        if isinstance(exp, str):
            try:
                exp = datetime.fromisoformat(exp.split("T")[0])
            except ValueError:
                exp = None
        if exp and isinstance(exp, datetime) and exp < now and doc.get("is_active", True):
            col.update_one({"_id": doc["_id"]}, {"$set": {"is_active": False}})
            doc["is_active"] = False

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