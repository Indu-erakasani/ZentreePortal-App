

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime ,timedelta
import os, json, base64, uuid, shutil
import requests as http
from extensions import mongo
from models.Resume_model import resume_schema, serialize_resume, SCREENING_STATUSES, SOURCES
import re
import logging
from ai_service import  ai_parse_pdf


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
resume_bp = Blueprint("resumes", __name__)

# ── Upload directory setup ────────────────────────────────────────────────────
_default_upload = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
UPLOAD_DIR = os.environ.get("UPLOAD_FOLDER", _default_upload)
RESUME_DIR = os.path.join(UPLOAD_DIR, "resumes")
RAW_DIR    = os.path.join(UPLOAD_DIR, "resumes", "raw")
os.makedirs(RESUME_DIR, exist_ok=True)
os.makedirs(RAW_DIR,    exist_ok=True)



def _extract_gemini_text(response_json: dict) -> str:
    """Extract the final answer text from a Gemini response (thinking-model safe)."""
    try:
        parts = response_json["candidates"][0]["content"]["parts"]
        text_parts = [p["text"] for p in parts if p.get("text", "").strip()]
        if not text_parts:
            raise ValueError("No text content in Gemini response")
        return text_parts[-1]   # last part = actual answer, not thinking
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected Gemini response structure: {e}") from e


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _find(rid: str):
    try:
        oid = ObjectId(rid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid resume ID"), 400)
    doc = mongo.db.candidate_processing.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Resume not found"), 404)
    return doc, None


def _find_raw(rid: str):
    try:
        oid = ObjectId(rid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid raw resume ID"), 400)
    doc = mongo.db.raw_resumes.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Raw resume not found"), 404)
    return doc, None


def _next_resume_id() -> str:
    count = mongo.db.candidate_processing.count_documents({})
    return f"RES{str(count + 1).zfill(3)}"


def _next_raw_id() -> str:
    count = mongo.db.raw_resumes.count_documents({})
    return f"RAW{str(count + 1).zfill(3)}"


def _resolve_job_id(val: str) -> str:
    if not val:
        return val
    if re.match(r'^[a-f0-9]{24}$', val.strip()):
        try:
            job = mongo.db.jobs.find_one({"_id": ObjectId(val)})
            if job:
                return job.get("job_id", val)
        except Exception:
            pass
    return val



def _serialize_raw(r: dict) -> dict:
    doc = dict(r)
    doc["_id"] = str(doc.get("_id", ""))
    for field in ("created_at", "updated_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    # ── ensure screening fields are always present ────────────────────────────
    doc.setdefault("screening_status", "")   # Sent / Interested / Not Interested
    doc.setdefault("screening_token",  "")
    return doc

# ═══════════════════════════════════════════════════════════════════════════════
#  RAW RESUME ROUTES  (/api/resumes/raw/...)
# ═══════════════════════════════════════════════════════════════════════════════

@resume_bp.route("/raw/upload", methods=["POST"])
@jwt_required()
def raw_upload():
    data      = request.get_json(silent=True) or {}
    file_b64  = data.get("file_b64", "")
    file_name = data.get("file_name", "resume.pdf")

    if not file_b64:
        return jsonify(success=False, message="'file_b64' is required"), 400

    raw_id    = _next_raw_id()
    filename  = f"{raw_id}.pdf"
    file_path = os.path.join(RAW_DIR, filename)

    try:
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(file_b64))
    except Exception as e:
        return jsonify(success=False, message=f"Failed to save file: {str(e)}"), 500

    parsed_data  = {}
    parse_status = "pending"
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key:
        prompt = (
            "Extract candidate information from this resume and return ONLY a valid JSON object "
            "with no extra text, no markdown, no backticks.\n\n"
            "Use exactly these keys:\n"
            '{\n'
            '  "name": "",\n'
            '  "email": "",\n'
            '  "phone": "",\n'
            '  "current_role": "",\n'
            '  "current_company": "",\n'
            '  "experience": 0,\n'
            '  "skills": "",\n'
            '  "location": "",\n'
            '  "current_salary": 0,\n'
            '  "expected_salary": 0,\n'
            '  "notice_period": ""\n'
            '}\n'
            "Rules: experience=total years as number; skills=comma-separated string; "
            "salaries=annual INR as number (0 if missing); "
            'notice_period: one of "Immediate","15 days","30 days","60 days","90 days"; '
            'return "" for missing text, 0 for missing numbers.'
        )
        try:
            # resp = http.post(
            #     f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
            #     headers={"Content-Type": "application/json"},
            #     json={"contents": [{"parts": [
            #         {"inline_data": {"mime_type": "application/pdf", "data": file_b64}},
            #         {"text": prompt},
            #     ]}]},
            #     timeout=60,
            # )
            # resp.raise_for_status()
            # # ── Use helper to handle thinking model multi-part response ────────
            # raw_text     = _extract_gemini_text(resp.json())
            
            raw_text     = ai_parse_pdf(file_b64, prompt, timeout=60)
            parsed_data  = json.loads(raw_text.replace("```json", "").replace("```", "").strip())
            parse_status = "parsed"
        except Exception:
            parse_status = "failed"
            parsed_data  = {}

    doc = {
        "raw_id":          raw_id,
        "filename":        filename,
        "original_name":   file_name,
        "name":            parsed_data.get("name", ""),
        "email":           parsed_data.get("email", ""),
        "phone":           parsed_data.get("phone", ""),
        "current_role":    parsed_data.get("current_role", ""),
        "current_company": parsed_data.get("current_company", ""),
        "experience":      parsed_data.get("experience", 0),
        "skills":          parsed_data.get("skills", ""),
        "location":        parsed_data.get("location", ""),
        "current_salary":  parsed_data.get("current_salary", 0),
        "expected_salary": parsed_data.get("expected_salary", 0),
        "notice_period":   parsed_data.get("notice_period", ""),
        "linked_job_id":    "",
        "linked_job_title": "",
        "client_name":      "",
        "parse_status":         parse_status,
        "status":               "Stored",
        "converted_resume_id":  "",
        "notes":                "",
        "created_at":      datetime.utcnow(),
        "updated_at":      datetime.utcnow(),
    }
    result    = mongo.db.raw_resumes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify(success=True, message="Resume stored", parse_status=parse_status, data=_serialize_raw(doc)), 201


@resume_bp.route("/raw/", methods=["GET"])
@jwt_required()
def get_raw_all():
    status   = request.args.get("status", "")
    job_id   = request.args.get("job_id", "")
    q        = request.args.get("q", "").strip()
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))

    query = {}
    if status: query["status"]        = status
    if job_id: query["linked_job_id"] = job_id
    if q:
        query["$or"] = [
            {"name":         {"$regex": q, "$options": "i"}},
            {"skills":       {"$regex": q, "$options": "i"}},
            {"current_role": {"$regex": q, "$options": "i"}},
            {"raw_id":       {"$regex": q, "$options": "i"}},
            {"original_name":{"$regex": q, "$options": "i"}},
        ]

    total = mongo.db.raw_resumes.count_documents(query)
    docs  = list(
        mongo.db.raw_resumes.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(success=True, data=[_serialize_raw(d) for d in docs], total=total, page=page, per_page=per_page), 200


@resume_bp.route("/raw/<rid>/file", methods=["GET"])
@jwt_required()
def get_raw_file(rid):
    doc, err = _find_raw(rid)
    if err:
        return err
    file_path = os.path.join(RAW_DIR, doc.get("filename", ""))
    if not os.path.exists(file_path):
        return jsonify(success=False, message="File not found on server"), 404
    return send_file(file_path, mimetype="application/pdf", as_attachment=False,
                     download_name=doc.get("original_name", "resume.pdf"))


@resume_bp.route("/raw/<rid>/assign-job", methods=["PUT"])
@jwt_required()
def assign_raw_to_job(rid):
    doc, err = _find_raw(rid)
    if err:
        return err

    data      = request.get_json(silent=True) or {}
    job_id    = data.get("job_id", "").strip()
    job_title = data.get("job_title", "")
    client    = data.get("client_name", "")

    if not job_id:
        return jsonify(success=False, message="'job_id' is required"), 400

    resolved_id = _resolve_job_id(job_id)
    if resolved_id == job_id and re.match(r'^[a-f0-9]{24}$', job_id):
        job_doc = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
        if job_doc:
            resolved_id = job_doc.get("job_id", job_id)
            job_title   = job_doc.get("title", job_title)
            client      = job_doc.get("client_name", client)

    upd = {
        "linked_job_id":    resolved_id,
        "linked_job_title": job_title,
        "client_name":      client,
        "status":           "Assigned",
        "updated_at":       datetime.utcnow(),
    }
    mongo.db.raw_resumes.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.raw_resumes.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Job assigned", data=_serialize_raw(updated)), 200


@resume_bp.route("/raw/<rid>/convert", methods=["POST"])
@jwt_required()
def convert_raw(rid):
    doc, err = _find_raw(rid)
    if err:
        return err

    if doc.get("status") == "Converted":
        return jsonify(success=False, message="Already converted to a candidate"), 409

    data  = request.get_json(silent=True) or {}
    name  = data.get("name",  doc.get("name",  "")).strip()
    email = data.get("email", doc.get("email", "")).strip()

    if not name or not email:
        return jsonify(success=False, message="'name' and 'email' are required to convert"), 400

    if mongo.db.candidate_processing.find_one({"email": email.lower()}):
        return jsonify(success=False, message="A candidate with this email already exists"), 409

    try:
        candidate = resume_schema(
            name             = name,
            email            = email,
            phone            = data.get("phone",            doc.get("phone", "")),
            current_role     = data.get("current_role",     doc.get("current_role", "")),
            current_company  = data.get("current_company",  doc.get("current_company", "")),
            experience       = data.get("experience",       doc.get("experience", 0)),
            skills           = data.get("skills",           doc.get("skills", "")),
            location         = data.get("location",         doc.get("location", "")),
            current_salary   = data.get("current_salary",   doc.get("current_salary", 0)),
            expected_salary  = data.get("expected_salary",  doc.get("expected_salary", 0)),
            notice_period    = data.get("notice_period",    doc.get("notice_period", "30 days")),
            source           = data.get("source", "Direct"),
            status           = data.get("status", "New"),
            linked_job_id    = data.get("linked_job_id",    doc.get("linked_job_id", "")),
            linked_job_title = data.get("linked_job_title", doc.get("linked_job_title", "")),
            notes            = data.get("notes",            doc.get("notes", "")),
        )

        resume_id              = _next_resume_id()
        candidate["resume_id"] = resume_id
        candidate["resume_file"] = ""

        result = mongo.db.candidate_processing.insert_one(candidate)

        raw_path  = os.path.join(RAW_DIR, doc.get("filename", ""))
        perm_name = f"{resume_id}.pdf"
        perm_path = os.path.join(RESUME_DIR, perm_name)
        if os.path.exists(raw_path):
            shutil.copy2(raw_path, perm_path)
            mongo.db.candidate_processing.update_one(
                {"_id": result.inserted_id},
                {"$set": {"resume_file": perm_name}},
            )
            candidate["resume_file"] = perm_name

        mongo.db.raw_resumes.update_one(
            {"_id": doc["_id"]},
            {"$set": {"status": "Converted", "converted_resume_id": resume_id, "updated_at": datetime.utcnow()}},
        )

        candidate["_id"] = result.inserted_id
        return jsonify(success=True, message="Converted to full candidate", data=serialize_resume(candidate)), 201

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# @resume_bp.route("/raw/<rid>", methods=["DELETE"])
# @jwt_required()
# def delete_raw(rid):
#     doc, err = _find_raw(rid)
#     if err:
#         return err
#     file_path = os.path.join(RAW_DIR, doc.get("filename", ""))
#     if os.path.exists(file_path):
#         os.remove(file_path)
#     mongo.db.raw_resumes.delete_one({"_id": doc["_id"]})
#     return jsonify(success=True, message="Raw resume deleted"), 200
@resume_bp.route("/raw/<rid>", methods=["DELETE"])
@jwt_required()
def delete_raw(rid):
    doc, err = _find_raw(rid)
    if err:
        return err
    filename = doc.get("filename", "")
    if filename:                                    # ← only attempt if there's an actual file
        file_path = os.path.join(RAW_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    mongo.db.raw_resumes.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Raw resume deleted"), 200

@resume_bp.route("/raw/manual", methods=["POST"])
@jwt_required()
def raw_manual():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify(success=False, message="'name' is required"), 400

    raw_id    = _next_raw_id()
    job_id    = data.get("linked_job_id", "")
    job_title = data.get("linked_job_title", "")
    client    = data.get("client_name", "")

    if job_id and re.match(r'^[a-f0-9]{24}$', job_id.strip()):
        try:
            job_doc = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
            if job_doc:
                job_id    = job_doc.get("job_id", job_id)
                job_title = job_doc.get("title", job_title)
                client    = job_doc.get("client_name", client)
        except Exception:
            pass

    filename      = ""
    original_name = ""
    file_b64      = data.get("file_b64", "")
    if file_b64:
        original_name = data.get("file_name", "resume.pdf")
        filename      = f"{raw_id}.pdf"
        file_path     = os.path.join(RAW_DIR, filename)
        try:
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(file_b64))
        except Exception as e:
            return jsonify(success=False, message=f"Failed to save PDF: {str(e)}"), 500

    doc = {
        "raw_id":          raw_id,
        "filename":        filename,
        "original_name":   original_name,
        "name":            name,
        "email":           data.get("email", ""),
        "phone":           data.get("phone", ""),
        "current_role":    data.get("current_role", ""),
        "current_company": data.get("current_company", ""),
        "experience":      float(data.get("experience", 0) or 0),
        "skills":          data.get("skills", ""),
        "location":        data.get("location", ""),
        "current_salary":  float(data.get("current_salary", 0) or 0),
        "expected_salary": float(data.get("expected_salary", 0) or 0),
        "notice_period":   data.get("notice_period", ""),
        "linked_job_id":   job_id,
        "linked_job_title": job_title,
        "client_name":     client,
        "parse_status":    "manual",
        "status":          "Stored" if not job_id else "Assigned",
        "converted_resume_id": "",
        "notes":           data.get("notes", ""),
        "created_at":      datetime.utcnow(),
        "updated_at":      datetime.utcnow(),
    }
    result     = mongo.db.raw_resumes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify(success=True, message="Manual resume entry created", data=_serialize_raw(doc)), 201


#  RESUME BANK ROUTES


@resume_bp.route("/parse-pdf", methods=["POST"])
@jwt_required()
def parse_pdf():
    data     = request.get_json(silent=True) or {}
    file_b64 = data.get("file_b64", "")
    if not file_b64:
        return jsonify(success=False, message="'file_b64' is required"), 400

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return jsonify(success=False, message="GEMINI_API_KEY not set on server"), 500

    file_id   = str(uuid.uuid4())
    temp_path = os.path.join(RESUME_DIR, f"temp_{file_id}.pdf")
    try:
        pdf_bytes = base64.b64decode(file_b64)
        with open(temp_path, "wb") as f:
            f.write(pdf_bytes)
    except Exception as e:
        return jsonify(success=False, message=f"Failed to save file: {str(e)}"), 500

    prompt = (
        "Extract candidate information from this resume and return ONLY a valid JSON object "
        "with no extra text, no markdown, no backticks.\n\n"
        "Use exactly these keys:\n"
        '{\n'
        '  "name": "",\n'
        '  "email": "",\n'
        '  "phone": "",\n'
        '  "current_role": "",\n'
        '  "current_company": "",\n'
        '  "experience": 0,\n'
        '  "skills": "",\n'
        '  "location": "",\n'
        '  "current_salary": 0,\n'
        '  "expected_salary": 0,\n'
        '  "notice_period": "",\n'
        '  "source": "Direct"\n'
        '}\n\n'
        "Rules:\n"
        "- experience: total years as a number (e.g. 5)\n"
        "- skills: comma-separated string of top skills found\n"
        "- current_salary / expected_salary: annual amount in INR as a number, 0 if not found\n"
        '- notice_period: one of "Immediate", "15 days", "30 days", "60 days", "90 days"\n'
        '- source: always "Direct"\n'
        '- Return empty string "" for any text field not found, 0 for any number not found'
    )

    try:
        # resp = http.post(
        #     f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
        #     headers={"Content-Type": "application/json"},
        #     json={"contents": [{"parts": [
        #         {"inline_data": {"mime_type": "application/pdf", "data": file_b64}},
        #         {"text": prompt},
        #     ]}]},
        #     timeout=60,
        # )
        # resp.raise_for_status()
        # # ── Use helper to handle thinking model multi-part response ────────────
        # raw    = _extract_gemini_text(resp.json())
        
        raw    = ai_parse_pdf(file_b64, prompt, timeout=60)
        parsed = json.loads(raw.replace("```json", "").replace("```", "").strip())
        return jsonify(success=True, data=parsed, file_id=file_id), 200

    except json.JSONDecodeError:
        return jsonify(success=False, message="AI returned non-JSON — fill manually", file_id=file_id), 422
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        # Return file_id even on error so frontend can proceed with manual entry
        return jsonify(success=False, message=str(e), file_id=file_id), 500


@resume_bp.route("/<rid>/file", methods=["GET"])
@jwt_required()
def get_file(rid):
    doc, err = _find(rid)
    if err:
        return err
    filename = doc.get("resume_file", "")
    if not filename:
        return jsonify(success=False, message="No resume file uploaded for this candidate"), 404
    file_path = os.path.join(RESUME_DIR, filename)
    if not os.path.exists(file_path):
        return jsonify(success=False, message="File not found on server"), 404
    return send_file(file_path, mimetype="application/pdf", as_attachment=False,
                     download_name=f"{doc.get('name', 'resume').replace(' ', '_')}_resume.pdf")


@resume_bp.route("/<rid>/upload-file", methods=["POST"])
@jwt_required()
def upload_file(rid):
    doc, err = _find(rid)
    if err:
        return err
    data     = request.get_json(silent=True) or {}
    file_b64 = data.get("file_b64", "")
    if not file_b64:
        return jsonify(success=False, message="'file_b64' is required"), 400
    try:
        old_filename = doc.get("resume_file", "")
        if old_filename:
            old_path = os.path.join(RESUME_DIR, old_filename)
            if os.path.exists(old_path):
                os.remove(old_path)
        resume_id = doc.get("resume_id", str(doc["_id"]))
        filename  = f"{resume_id}.pdf"
        file_path = os.path.join(RESUME_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(file_b64))
        mongo.db.candidate_processing.update_one(
            {"_id": doc["_id"]},
            {"$set": {"resume_file": filename, "updated_at": datetime.utcnow()}},
        )
        return jsonify(success=True, message="File uploaded", resume_file=filename), 200
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


@resume_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    from flask_jwt_extended import get_jwt_identity
    import json as _json

    q        = request.args.get("q", "").strip()
    status   = request.args.get("status", "")
    source   = request.args.get("source", "")
    job_id   = request.args.get("job_id", "")
    min_exp  = request.args.get("min_exp", "")
    max_exp  = request.args.get("max_exp", "")
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    # ── Role-based gate: HR sees only Hired candidates ────────────────────────
    identity = get_jwt_identity()
    try:
        caller_role = (_json.loads(identity) if isinstance(identity, str) else identity).get("role", "")
    except Exception:
        caller_role = ""

    query = {}
    if caller_role == "hr":
        query["status"] = "Hired"          # HR locked to Hired only
    else:
        if status:
            query["status"] = status       # Recruiter/admin can filter freely

    if q:
        query["$or"] = [
            {"name":         {"$regex": q, "$options": "i"}},
            {"skills":       {"$regex": q, "$options": "i"}},
            {"current_role": {"$regex": q, "$options": "i"}},
            {"resume_id":    {"$regex": q, "$options": "i"}},
        ]
    if source:  query["source"]        = source
    if job_id:  query["linked_job_id"] = job_id
    if min_exp: query["experience"]    = {"$gte": float(min_exp)}
    if max_exp:
        query.setdefault("experience", {})
        query["experience"]["$lte"] = float(max_exp)

    total = mongo.db.candidate_processing.count_documents(query)
    docs  = list(
        mongo.db.candidate_processing.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(success=True, data=[serialize_resume(d) for d in docs],
                   total=total, page=page, per_page=per_page), 200

@resume_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    by_status = list(mongo.db.candidate_processing.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]))
    by_source = list(mongo.db.candidate_processing.aggregate([{"$group": {"_id": "$source", "count": {"$sum": 1}}}]))
    return jsonify(success=True, data={"by_status": by_status, "by_source": by_source}), 200


@resume_bp.route("/<rid>", methods=["GET"])
@jwt_required()
def get_one(rid):
    doc, err = _find(rid)
    if err:
        return err
    return jsonify(success=True, data=serialize_resume(doc)), 200


@resume_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    for f in ["name", "email"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    # if mongo.db.candidate_processing.find_one({"email": data["email"].lower().strip()}):
    #     return jsonify(success=False, message="A candidate with this email already exists"), 409

    existing = mongo.db.candidate_processing.find_one({"email": data["email"].lower().strip()})
    if existing:
        new_job_id = _resolve_job_id(data.get("linked_job_id", ""))
        existing_job_id = existing.get("linked_job_id", "")
        # Only block if same email AND same job
        if existing_job_id == new_job_id and new_job_id:
            return jsonify(
                success=False,
                message=f"This candidate is already added for job {new_job_id}."
            ), 409
        # Different job (or no job) — allow creation, no questions asked
            
        
    try:
        doc = resume_schema(
            name             = data["name"],
            email            = data["email"],
            phone            = data.get("phone", ""),
            current_role     = data.get("current_role", ""),
            current_company  = data.get("current_company", ""),
            experience       = data.get("experience", 0),
            skills           = data.get("skills", ""),
            location         = data.get("location", ""),
            current_salary   = data.get("current_salary", 0),
            expected_salary  = data.get("expected_salary", 0),
            notice_period    = data.get("notice_period", "30 days"),
            source           = data.get("source", "LinkedIn"),
            status           = data.get("status", "New"),
            linked_job_id    = _resolve_job_id(data.get("linked_job_id", "")),
            linked_job_title = data.get("linked_job_title", ""),
            notes            = data.get("notes", ""),
        )
        resume_id          = _next_resume_id()
        doc["resume_id"]   = resume_id
        doc["resume_file"] = ""
        result = mongo.db.candidate_processing.insert_one(doc)

        file_id = data.get("file_id", "")
        if file_id:
            temp_path = os.path.join(RESUME_DIR, f"temp_{file_id}.pdf")
            perm_name = f"{resume_id}.pdf"
            perm_path = os.path.join(RESUME_DIR, perm_name)
            if os.path.exists(temp_path):
                shutil.move(temp_path, perm_path)
                mongo.db.candidate_processing.update_one(
                    {"_id": result.inserted_id},
                    {"$set": {"resume_file": perm_name}},
                )
                doc["resume_file"] = perm_name

        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Candidate added", data=serialize_resume(doc)), 201

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


@resume_bp.route("/<rid>", methods=["PUT"])
@jwt_required()
def update(rid):
    doc, err = _find(rid)
    if err:
        return err
    data    = request.get_json(silent=True) or {}
    allowed = [
        "name", "phone", "current_role", "current_company", "experience",
        "skills", "location", "current_salary", "expected_salary",
        "notice_period", "source", "status", "linked_job_id", "linked_job_title", "notes",
    ]
    upd = {k: data[k] for k in allowed if k in data}
    if "linked_job_id" in upd:
        upd["linked_job_id"] = _resolve_job_id(upd["linked_job_id"])
    if "status" in upd and upd["status"] not in SCREENING_STATUSES:
        return jsonify(success=False, message="Invalid status"), 400
    upd["updated_at"] = datetime.utcnow()
    mongo.db.candidate_processing.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.candidate_processing.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_resume(updated)), 200


@resume_bp.route("/<rid>", methods=["DELETE"])
@jwt_required()
def delete(rid):
    doc, err = _find(rid)
    if err:
        return err
    filename = doc.get("resume_file", "")
    if filename:
        file_path = os.path.join(RESUME_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    mongo.db.candidate_processing.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Candidate deleted"), 200


@resume_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def options():
    return jsonify(success=True, statuses=SCREENING_STATUSES, sources=SOURCES), 200


@resume_bp.route("/by-skill/<skill_name>", methods=["GET"])
@jwt_required()
def by_skill(skill_name):
    docs = list(
        mongo.db.candidate_processing.find({"skills": {"$regex": skill_name.strip(), "$options": "i"}})
        .sort("created_at", -1)
    )
    return jsonify(success=True, data=[serialize_resume(d) for d in docs]), 200




def cleanup_expired_raw_resumes():
    """
    Auto-delete raw resumes older than 90 days.
    Skips records with status='Converted' to avoid orphaning converted candidates.
    """
    cutoff = datetime.utcnow() - timedelta(days=90)
    query = {
        "created_at": {"$lt": cutoff},
        "status":     {"$ne": "Converted"}   # never delete converted ones
    }
    expired = list(mongo.db.raw_resumes.find(query))
    deleted_count = 0
    error_count   = 0

    for doc in expired:
        try:
            # Delete the PDF from disk
            filename  = doc.get("filename", "")
            file_path = os.path.join(RAW_DIR, filename)
            if filename and os.path.exists(file_path):
                os.remove(file_path)

            # Delete the DB document
            mongo.db.raw_resumes.delete_one({"_id": doc["_id"]})
            deleted_count += 1

        except Exception as e:
            error_count += 1
            logger.warning(f"[cleanup] Failed to delete {doc.get('raw_id')}: {e}")

    logger.error(f"[cleanup] Expired raw resumes — deleted: {deleted_count}, errors: {error_count}")
    
    
    
@resume_bp.route("/raw/cleanup-expired", methods=["POST"])
@jwt_required()
def trigger_cleanup():
    """Manually trigger the expired raw resume cleanup."""
    cleanup_expired_raw_resumes()
    return jsonify(success=True, message="Cleanup triggered"), 200



# ── GET /api/resumes/talent-search?q=... ─────────────────────────────────────
@resume_bp.route("/talent-search", methods=["GET"])
@jwt_required()
def talent_search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify(success=True, data=[]), 200

    # Tokenize — split on spaces and commas, filter noise words < 2 chars
    tokens = [t.strip() for t in re.split(r'[\s,]+', q) if len(t.strip()) >= 2]
    if not tokens:
        return jsonify(success=True, data=[]), 200

    # Also add the full phrase as an option: 
    all_patterns = list({q} | set(tokens))
    pattern = "|".join(re.escape(p) for p in all_patterns)

    docs = list(
        mongo.db.candidate_processing.find(
            {"skills": {"$regex": pattern, "$options": "i"}}
        ).sort("created_at", -1)
    )
    return jsonify(success=True, data=[serialize_resume(d) for d in docs]), 200































# candidate intrest to add the resume to the jd for the stored resumes 
# ── POST /api/resumes/raw/<rid>/send-screening ────────────────────────────────



# @resume_bp.route("/raw/<rid>/send-screening", methods=["POST"])
# @jwt_required()
# def send_screening(rid):
#     doc, err = _find_raw(rid)
#     if err:
#         return err

#     data            = request.get_json(silent=True) or {}
#     candidate_email = data.get("email") or doc.get("email", "")
#     job_id          = data.get("job_id", doc.get("linked_job_id", ""))
#     job_title       = data.get("job_title", doc.get("linked_job_title", ""))
#     client_name     = data.get("client_name", doc.get("client_name", ""))
#     candidate_name  = data.get("name") or doc.get("name", "Candidate")

#     if not candidate_email:
#         return jsonify(success=False, message="Candidate email is required"), 400
#     if not job_title:
#         return jsonify(success=False, message="Please assign this resume to a job first"), 400

#     token      = str(uuid.uuid4())
#     expires_at = datetime.utcnow() + timedelta(days=3)

#     mongo.db.screening_confirmations.insert_one({
#         "token":           token,
#         "raw_resume_id":   str(doc["_id"]),
#         "raw_id":          doc.get("raw_id", ""),
#         "candidate_email": candidate_email.lower().strip(),
#         "candidate_name":  candidate_name,
#         "job_id":          job_id,
#         "job_title":       job_title,
#         "client_name":     client_name,
#         "status":          "Pending",
#         "created_at":      datetime.utcnow(),
#         "expires_at":      expires_at,
#     })




#     smtp_host = os.environ.get("SMTP_SERVER", "")        # was SMTP_HOST
#     smtp_user = os.environ.get("SMTP_USERNAME", "")      # was SMTP_USER  
#     smtp_pass = os.environ.get("SMTP_PASSWORD", "")      # was SMTP_PASS
#     smtp_port = int(os.environ.get("SMTP_PORT", 587))
#     from_email = os.environ.get("FROM_EMAIL", smtp_user) # SendGrid needs exact from_email
#     from_name = os.environ.get("FROM_NAME", "Recruitment Team")
#     frontend_base = os.environ.get("FRONTEND_URL", "http://localhost:3000")  # was FRONTEND_URL
#     api_base = os.environ.get("API_BASE_URL", "http://10.10.2.240:5000")
#     yes_link = f"{api_base}/api/resumes/screening/{token}/yes"
#     no_link  = f"{api_base}/api/resumes/screening/{token}/no"
#     # yes_link = f"{frontend_base}/screening-response/{token}/yes"
#     # no_link  = f"{frontend_base}/screening-response/{token}/no"


#     # ── Guard: skip email if SMTP not configured ──────────────────────────────
#     if not smtp_host or not smtp_user or not smtp_pass:
#         # Still mark as sent in DB so frontend chip updates
#         mongo.db.raw_resumes.update_one(
#             {"_id": doc["_id"]},
#             {"$set": {
#                 "screening_status": "Sent",
#                 "screening_token":  token,
#                 "updated_at":       datetime.utcnow(),
#             }}
#         )
#         return jsonify(
#             success=True,
#             message="Token created (SMTP not configured — email not sent)",
#             token=token,
#             yes_link=yes_link,
#             no_link=no_link,
#         ), 200

#     try:
#         import smtplib
#         from email.mime.multipart import MIMEMultipart
#         from email.mime.text import MIMEText

#         msg            = MIMEMultipart("alternative")
#         msg["Subject"] = f"Job Opportunity: {job_title}{f' at {client_name}' if client_name else ''}"
#         msg["From"]    = f"{from_name} <{from_email}>" 
#         msg["To"]      = candidate_email

#         html = f"""
#         <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;
#                     padding:32px 24px;background:#f8fafc;border-radius:12px;">
#           <div style="background:#fff;border-radius:10px;padding:32px;border:1px solid #e2e8f0;">
#             <h2 style="color:#1e3a5f;margin:0 0 8px;">Hi {candidate_name},</h2>
#             <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
#               We came across your profile and feel you could be a great fit:
#             </p>
#             <div style="background:#f0f9ff;border-left:4px solid #0369a1;
#                         border-radius:6px;padding:16px 20px;margin-bottom:24px;">
#               <div style="font-size:18px;font-weight:700;color:#0369a1;">{job_title}</div>
#               {f'<div style="font-size:14px;color:#64748b;margin-top:4px;">{client_name}</div>'
#                if client_name else ''}
#             </div>
#             <div style="text-align:center;margin-bottom:28px;">
#               <a href="{yes_link}"
#                  style="display:inline-block;background:#15803d;color:#fff;
#                         text-decoration:none;padding:14px 32px;border-radius:8px;
#                         font-weight:700;font-size:15px;margin-right:12px;">
#                 ✅ Yes, I'm Interested
#               </a>
#               <a href="{no_link}"
#                  style="display:inline-block;background:#f1f5f9;color:#64748b;
#                         text-decoration:none;padding:14px 32px;border-radius:8px;
#                         font-weight:700;font-size:15px;border:1px solid #e2e8f0;">
#                 No, Not Right Now
#               </a>
#             </div>
#             <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
#               This link expires in 3 days.
#             </p>
#           </div>
#         </div>
#         """
#         msg.attach(MIMEText(html, "html"))

#         with smtplib.SMTP(smtp_host, smtp_port) as server:
#             server.starttls()
#             server.login(smtp_user, smtp_pass)
#             server.sendmail(from_email, candidate_email, msg.as_string())

#         mongo.db.raw_resumes.update_one(
#             {"_id": doc["_id"]},
#             {"$set": {
#                 "screening_status": "Sent",
#                 "screening_token":  token,
#                 "updated_at":       datetime.utcnow(),
#             }}
#         )
#         return jsonify(
#             success=True,
#             message=f"Screening email sent to {candidate_email}",
#             token=token,
#         ), 200

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return jsonify(success=False, message=f"Failed to send email: {str(e)}"), 500





@resume_bp.route("/raw/<rid>/send-screening", methods=["POST"])
@jwt_required()
def send_screening(rid):
    doc, err = _find_raw(rid)
    if err:
        return err

    data            = request.get_json(silent=True) or {}
    candidate_email = data.get("email") or doc.get("email", "")
    job_id          = data.get("job_id", doc.get("linked_job_id", ""))
    job_title       = data.get("job_title", doc.get("linked_job_title", ""))
    client_name     = data.get("client_name", doc.get("client_name", ""))
    candidate_name  = data.get("name") or doc.get("name", "Candidate")

    if not candidate_email:
        return jsonify(success=False, message="Candidate email is required"), 400
    if not job_title:
        return jsonify(success=False, message="Please assign this resume to a job first"), 400

    # ── Fetch full JD details from jobs collection ────────────────────────────
    # job_doc = None
    # try:
    #     if job_id:
    #         # Try by job_id string first, then by mongo _id
    #         job_doc = mongo.db.jobs.find_one({"job_id": job_id})
    #         if not job_doc and re.match(r'^[a-f0-9]{24}$', job_id.strip()):
    #             job_doc = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
    # except Exception:
    #     job_doc = None

    # # Extract JD fields safely
    # jd_location      = job_doc.get("location", "")           if job_doc else ""
    # jd_experience    = job_doc.get("experience_required", "") if job_doc else ""
    # jd_employment    = job_doc.get("employment_type", "")     if job_doc else ""
    # jd_salary_min    = job_doc.get("salary_min", "")          if job_doc else ""
    # jd_salary_max    = job_doc.get("salary_max", "")          if job_doc else ""
    # jd_skills        = job_doc.get("required_skills", "")     if job_doc else ""
    # jd_description   = job_doc.get("description", "")         if job_doc else ""
    # jd_responsibilities = job_doc.get("responsibilities", "") if job_doc else ""

    # # Format salary range
    # salary_str = ""
    # if jd_salary_min and jd_salary_max:
    #     salary_str = f"₹{jd_salary_min} – ₹{jd_salary_max} LPA"
    # elif jd_salary_min:
    #     salary_str = f"₹{jd_salary_min}+ LPA"
    # elif jd_salary_max:
    #     salary_str = f"Up to ₹{jd_salary_max} LPA"

    # # Format skills as badges
    # skills_html = ""
    # if jd_skills:
    #     skill_list = [s.strip() for s in str(jd_skills).split(",") if s.strip()]
    #     badges = "".join([
    #         f'<span style="display:inline-block;background:#e0f2fe;color:#0369a1;'
    #         f'padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;'
    #         f'margin:3px 4px 3px 0;">{s}</span>'
    #         for s in skill_list[:10]  # cap at 10 skills
    #     ])
    #     skills_html = f"""
    #     <div style="margin-bottom:16px;">
    #       <div style="font-size:12px;font-weight:700;color:#64748b;
    #                   text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
    #         Key Skills
    #       </div>
    #       <div>{badges}</div>
    #     </div>
    #     """

    # # Format quick-info pills (location, exp, type, salary)
    # meta_items = []
    # if jd_location:
    #     meta_items.append(("📍", jd_location))
    # if jd_experience:
    #     meta_items.append(("💼", f"{jd_experience} yrs experience"))
    # if jd_employment:
    #     meta_items.append(("⏱️", jd_employment))
    # if salary_str:
    #     meta_items.append(("💰", salary_str))

    # meta_html = ""
    # if meta_items:
    #     pills = "".join([
    #         f'<div style="display:flex;align-items:center;gap:6px;'
    #         f'background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;'
    #         f'padding:8px 14px;margin:4px;">'
    #         f'<span style="font-size:14px;">{icon}</span>'
    #         f'<span style="font-size:13px;color:#374151;font-weight:500;">{text}</span>'
    #         f'</div>'
    #         for icon, text in meta_items
    #     ])
    #     meta_html = f"""
    #     <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:20px;">
    #       {pills}
    #     </div>
    #     """

    # # Format description (first 300 chars as teaser)
    # desc_html = ""
    # if jd_description:
    #     teaser = str(jd_description)[:350].strip()
    #     if len(str(jd_description)) > 350:
    #         teaser += "…"
    #     desc_html = f"""
    #     <div style="margin-bottom:16px;">
    #       <div style="font-size:12px;font-weight:700;color:#64748b;
    #                   text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
    #         About the Role
    #       </div>
    #       <p style="color:#475569;font-size:13px;line-height:1.7;margin:0;">{teaser}</p>
    #     </div>
    #     """

    # # Format responsibilities (first 3 bullet points)
    # resp_html = ""
    # if jd_responsibilities:
    #     if isinstance(jd_responsibilities, list):
    #         resp_list = jd_responsibilities[:4]
    #     else:
    #         resp_list = [r.strip() for r in str(jd_responsibilities).split("\n") if r.strip()][:4]
    #     if resp_list:
    #         bullets = "".join([
    #             f'<li style="color:#475569;font-size:13px;line-height:1.7;margin-bottom:4px;">{r}</li>'
    #             for r in resp_list
    #         ])
    #         resp_html = f"""
    #         <div style="margin-bottom:20px;">
    #           <div style="font-size:12px;font-weight:700;color:#64748b;
    #                       text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
    #             Key Responsibilities
    #           </div>
    #           <ul style="margin:0;padding-left:18px;">{bullets}</ul>
    #         </div>
    #         """

    job_doc = None
    try:
        if job_id:
            job_doc = mongo.db.jobs.find_one({"job_id": job_id})
            if not job_doc and re.match(r'^[a-f0-9]{24}$', job_id.strip()):
                job_doc = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        job_doc = None

    # Extract JD fields safely
    jd_location      = job_doc.get("location", "")            if job_doc else ""
    jd_experience    = job_doc.get("experience_required", "")  if job_doc else ""
    jd_employment    = job_doc.get("employment_type", "")      if job_doc else ""
    jd_salary_min    = job_doc.get("salary_min", "")           if job_doc else ""
    jd_salary_max    = job_doc.get("salary_max", "")           if job_doc else ""
    jd_skills        = job_doc.get("required_skills", "")      if job_doc else ""
    jd_description   = job_doc.get("description", "")          if job_doc else ""
    jd_requirements  = job_doc.get("requirements", "")         if job_doc else ""
    jd_responsibilities = job_doc.get("responsibilities", "")  if job_doc else ""
    jd_nice_to_have  = job_doc.get("nice_to_have", "")         if job_doc else ""

    # ── Format salary — convert raw numbers to LPA ────────────────────────────
    def fmt_salary(val):
        """Convert 500000 → 5 LPA, 1200000 → 12 LPA, already-string → as-is."""
        if not val:
            return ""
        try:
            n = float(str(val).replace(",", "").strip())
            if n >= 100000:                        # raw rupees → LPA
                lpa = n / 100000
                return f"{lpa:.0f} LPA" if lpa == int(lpa) else f"{lpa:.1f} LPA"
            elif n > 0:                            # already in lakhs
                return f"{n:.0f} LPA" if n == int(n) else f"{n:.1f} LPA"
        except (ValueError, TypeError):
            return str(val)                        # already a string like "8-10 LPA"
        return ""

    sal_min_str = fmt_salary(jd_salary_min)
    sal_max_str = fmt_salary(jd_salary_max)

    if sal_min_str and sal_max_str:
        salary_str = f"₹{sal_min_str} – ₹{sal_max_str}"
    elif sal_min_str:
        salary_str = f"₹{sal_min_str}+"
    elif sal_max_str:
        salary_str = f"Up to ₹{sal_max_str}"
    else:
        salary_str = ""

    # ── Skills badges ─────────────────────────────────────────────────────────
    skills_html = ""
    if jd_skills:
        skill_list = [s.strip() for s in str(jd_skills).split(",") if s.strip()]
        badges = "".join([
            f'<span style="display:inline-block;background:#e0f2fe;color:#0369a1;'
            f'padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;'
            f'margin:3px 4px 3px 0;">{s}</span>'
            for s in skill_list
        ])
        skills_html = f"""
        <div style="margin-bottom:18px;">
          <div style="font-size:11px;font-weight:700;color:#64748b;
                      text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">
            Key Skills Required
          </div>
          <div>{badges}</div>
        </div>
        """

    # ── Meta pills ────────────────────────────────────────────────────────────
    meta_items = []
    if jd_location:
        meta_items.append(("📍", jd_location))
    if jd_experience:
        meta_items.append(("💼", f"{jd_experience} yrs exp"))
    if jd_employment:
        meta_items.append(("⏱️", jd_employment))
    if salary_str:
        meta_items.append(("💰", salary_str))

    meta_html = ""
    if meta_items:
        pills = "".join([
            f'<div style="display:inline-flex;align-items:center;gap:5px;'
            f'background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;'
            f'padding:7px 12px;margin:3px 4px 3px 0;">'
            f'<span style="font-size:13px;">{icon}</span>'
            f'<span style="font-size:12px;color:#374151;font-weight:500;">{text}</span>'
            f'</div>'
            for icon, text in meta_items
        ])
        meta_html = f'<div style="margin-bottom:18px;">{pills}</div>'

    # ── Full description (no truncation) ─────────────────────────────────────
    desc_html = ""
    if jd_description:
        # Convert newlines to <br> for proper HTML rendering
        desc_formatted = str(jd_description).replace("\n", "<br>")
        desc_html = f"""
        <div style="margin-bottom:18px;">
          <div style="font-size:11px;font-weight:700;color:#64748b;
                      text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">
            About the Role
          </div>
          <p style="color:#475569;font-size:13px;line-height:1.8;margin:0;">
            {desc_formatted}
          </p>
        </div>
        """

    # ── Requirements ─────────────────────────────────────────────────────────
    req_html = ""
    if jd_requirements:
        if isinstance(jd_requirements, list):
            req_list = jd_requirements
        else:
            req_list = [r.strip() for r in str(jd_requirements).split("\n") if r.strip()]
        if req_list:
            bullets = "".join([
                f'<li style="color:#475569;font-size:13px;line-height:1.8;'
                f'margin-bottom:4px;">{r}</li>'
                for r in req_list
            ])
            req_html = f"""
            <div style="margin-bottom:18px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;
                          text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">
                Requirements
              </div>
              <ul style="margin:0;padding-left:20px;">{bullets}</ul>
            </div>
            """

    # ── Responsibilities ──────────────────────────────────────────────────────
    resp_html = ""
    if jd_responsibilities:
        if isinstance(jd_responsibilities, list):
            resp_list = jd_responsibilities
        else:
            resp_list = [r.strip() for r in str(jd_responsibilities).split("\n") if r.strip()]
        if resp_list:
            bullets = "".join([
                f'<li style="color:#475569;font-size:13px;line-height:1.8;'
                f'margin-bottom:4px;">{r}</li>'
                for r in resp_list
            ])
            resp_html = f"""
            <div style="margin-bottom:18px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;
                          text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">
                Key Responsibilities
              </div>
              <ul style="margin:0;padding-left:20px;">{bullets}</ul>
            </div>
            """

    # ── Nice to have ──────────────────────────────────────────────────────────
    nice_html = ""
    if jd_nice_to_have:
        if isinstance(jd_nice_to_have, list):
            nice_list = jd_nice_to_have
        else:
            nice_list = [r.strip() for r in str(jd_nice_to_have).split("\n") if r.strip()]
        if nice_list:
            bullets = "".join([
                f'<li style="color:#475569;font-size:13px;line-height:1.8;'
                f'margin-bottom:4px;">{r}</li>'
                for r in nice_list
            ])
            nice_html = f"""
            <div style="margin-bottom:18px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;
                          text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">
                Nice to Have
              </div>
              <ul style="margin:0;padding-left:20px;">{bullets}</ul>
            </div>
            """
    token      = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=3)

    mongo.db.screening_confirmations.insert_one({
        "token":           token,
        "raw_resume_id":   str(doc["_id"]),
        "raw_id":          doc.get("raw_id", ""),
        "candidate_email": candidate_email.lower().strip(),
        "candidate_name":  candidate_name,
        "job_id":          job_id,
        "job_title":       job_title,
        "client_name":     client_name,
        "status":          "Pending",
        "created_at":      datetime.utcnow(),
        "expires_at":      expires_at,
    })

    smtp_host  = os.environ.get("SMTP_SERVER",   "")
    smtp_user  = os.environ.get("SMTP_USERNAME", "")
    smtp_pass  = os.environ.get("SMTP_PASSWORD", "")
    smtp_port  = int(os.environ.get("SMTP_PORT", 587))
    from_email = os.environ.get("FROM_EMAIL",    smtp_user)
    from_name  = os.environ.get("FROM_NAME",     "Recruitment Team")
    api_base   = os.environ.get("API_BASE_URL",  "http://10.10.2.240:5000")
    frontend_base = os.environ.get("FRONTEND_URL", "http://10.10.2.240:3000")

    yes_link = f"{api_base}/api/resumes/screening/{token}/yes"
    no_link  = f"{api_base}/api/resumes/screening/{token}/no"

    # ── Guard: skip email if SMTP not configured ──────────────────────────────
    if not smtp_host or not smtp_user or not smtp_pass:
        mongo.db.raw_resumes.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "screening_status": "Sent",
                "screening_token":  token,
                "updated_at":       datetime.utcnow(),
            }}
        )
        return jsonify(
            success=True,
            message="Token created (SMTP not configured — email not sent)",
            token=token,
            yes_link=yes_link,
            no_link=no_link,
        ), 200

    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        msg            = MIMEMultipart("alternative")
        msg["Subject"] = f"Job Opportunity: {job_title}{f' at {client_name}' if client_name else ''}"
        msg["From"]    = f"{from_name} <{from_email}>"
        msg["To"]      = candidate_email

#         html = f"""
# <!DOCTYPE html>
# <html>
# <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
# <div style="max-width:580px;margin:32px auto;padding:0 16px;">

#   <!-- Header -->
#   <div style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
#     <div style="color:#93c5fd;font-size:12px;font-weight:700;
#                 text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
#       {from_name}
#     </div>
#     <div style="color:#fff;font-size:22px;font-weight:800;">
#       We found a role that fits you
#     </div>
#   </div>

#   <!-- Body -->
#   <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">

#     <!-- Greeting -->
#     <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 6px;">
#       Hi {candidate_name},
#     </p>
#     <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
#       We came across your profile and believe you could be an excellent fit for the
#       following opportunity. We'd love to know if you're open to exploring it.
#     </p>

#     <!-- Job Card -->
#     <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;
#                 padding:20px 24px;margin-bottom:24px;">

#       <!-- Job title + company -->
#       <div style="font-size:20px;font-weight:800;color:#0369a1;margin-bottom:4px;">
#         {job_title}
#       </div>
#       {f'<div style="font-size:14px;color:#64748b;font-weight:600;margin-bottom:16px;">🏢 {client_name}</div>' if client_name else '<div style="margin-bottom:16px;"></div>'}

#       <!-- Meta pills -->
#       {meta_html}

#       <!-- Skills -->
#       {skills_html}

#       <!-- Description -->
#       {desc_html}

#       <!-- Responsibilities -->
#       {resp_html}

#     </div>

#     <!-- CTA -->
#     <p style="color:#475569;font-size:14px;text-align:center;margin:0 0 24px;">
#       Are you open to exploring this opportunity?
#     </p>
#     <div style="text-align:center;margin-bottom:28px;">
#       <a href="{yes_link}"
#          style="display:inline-block;background:#15803d;color:#fff;
#                 text-decoration:none;padding:14px 36px;border-radius:8px;
#                 font-weight:700;font-size:15px;margin-right:12px;
#                 box-shadow:0 2px 8px rgba(21,128,61,0.3);">
#         ✅ Yes, I'm Interested
#       </a>
#       <a href="{no_link}"
#          style="display:inline-block;background:#f8fafc;color:#64748b;
#                 text-decoration:none;padding:14px 36px;border-radius:8px;
#                 font-weight:700;font-size:15px;border:1.5px solid #e2e8f0;">
#         No, Not Right Now
#       </a>
#     </div>

#     <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
#       This link expires in 3 days · Simply reply to this email if you have questions.
#     </p>
#   </div>

#   <!-- Footer -->
#   <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;
#               border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
#     <p style="color:#94a3b8;font-size:11px;margin:0;">
#       You're receiving this because a recruiter at {from_name} reviewed your profile.
#       This email was sent to {candidate_email}.
#     </p>
#   </div>

# </div>
# </body>
# </html>
#         """

        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
        <div style="max-width:620px;margin:32px auto;padding:0 16px;">

        <!-- Header -->
        <div style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
            <div style="color:#93c5fd;font-size:12px;font-weight:700;
                        text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
            {from_name}
            </div>
            <div style="color:#fff;font-size:22px;font-weight:800;">
            We found a role that fits you
            </div>
        </div>

        <!-- Body -->
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">

            <!-- Greeting -->
            <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 6px;">
            Hi {candidate_name},
            </p>
            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
            We came across your profile and believe you could be an excellent fit for the
            following opportunity. We'd love to know if you're open to exploring it.
            </p>

            <!-- Job Card -->
            <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;
                        padding:24px;margin-bottom:28px;">

            <div style="font-size:22px;font-weight:800;color:#0369a1;margin-bottom:4px;">
                {job_title}
            </div>
            {f'<div style="font-size:14px;color:#64748b;font-weight:600;margin-bottom:16px;">🏢 {client_name}</div>' if client_name else '<div style="margin-bottom:16px;"></div>'}

            {meta_html}
            {skills_html}
            {desc_html}
            {req_html}
            {resp_html}
            {nice_html}

            </div>

            <!-- CTA -->
            <p style="color:#475569;font-size:14px;text-align:center;margin:0 0 20px;">
            Are you open to exploring this opportunity?
            </p>
            <div style="text-align:center;margin-bottom:28px;">
            <a href="{yes_link}"
                style="display:inline-block;background:#15803d;color:#fff;
                        text-decoration:none;padding:14px 36px;border-radius:8px;
                        font-weight:700;font-size:15px;margin-right:12px;
                        box-shadow:0 2px 8px rgba(21,128,61,0.3);">
                ✅ Yes, I'm Interested
            </a>
            <a href="{no_link}"
                style="display:inline-block;background:#f8fafc;color:#64748b;
                        text-decoration:none;padding:14px 36px;border-radius:8px;
                        font-weight:700;font-size:15px;border:1.5px solid #e2e8f0;">
                No, Not Right Now
            </a>
            </div>

            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
            This link expires in 3 days · Simply reply to this email if you have questions.
            </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;
                    border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">
            You're receiving this because a recruiter at {from_name} reviewed your profile.
            Sent to {candidate_email}.
            </p>
        </div>

        </div>
        </body>
        </html>
                """
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, candidate_email, msg.as_string())

        mongo.db.raw_resumes.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "screening_status": "Sent",
                "screening_token":  token,
                "updated_at":       datetime.utcnow(),
            }}
        )
        return jsonify(
            success=True,
            message=f"Screening email sent to {candidate_email}",
            token=token,
        ), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=f"Failed to send email: {str(e)}"), 500















# ── GET /api/resumes/screening-token-info/<token> — public, no auth ───────────
@resume_bp.route("/screening-token-info/<token>", methods=["GET"])
def screening_token_info(token):
    conf = mongo.db.screening_confirmations.find_one({"token": token})
    if not conf:
        return jsonify(success=False), 404
    return jsonify(
        success=True,
        job_title=conf.get("job_title", ""),
        status=conf.get("status", "Pending"),
    ), 200


















# ── GET /api/resumes/screening/<token>/<response> ─────────────────────────────
# ── GET /api/resumes/screening/<token>/<response> ─────────────────────────────
@resume_bp.route("/screening/<token>/<response>", methods=["GET"])
def screening_response(token, response):
    """Candidate clicks Yes/No link in email — no auth needed."""
    conf = mongo.db.screening_confirmations.find_one({"token": token})
    if not conf:
        return jsonify(success=False, message="Invalid or expired link"), 404
    if conf.get("expires_at") and conf["expires_at"] < datetime.utcnow():
        # Still redirect but with expired status
        frontend_base = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        from flask import redirect
        return redirect(f"{frontend_base}/screening-response-done?status=Expired&job={conf.get('job_title','')}")
    if conf.get("status") != "Pending":
        # Already responded — redirect with their original response
        frontend_base = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        from flask import redirect
        return redirect(f"{frontend_base}/screening-response-done?status={conf['status'].replace(' ', '+')}&job={conf.get('job_title','')}&already=true")

    status = "Interested" if response == "yes" else "Not Interested"

    mongo.db.screening_confirmations.update_one(
        {"token": token},
        {"$set": {"status": status, "responded_at": datetime.utcnow()}}
    )

    # ── Always update raw_resume screening_status ─────────────────────────────
    mongo.db.raw_resumes.update_one(
        {"_id": ObjectId(conf["raw_resume_id"])},
        {"$set": {
            "screening_status": status,
            "updated_at":       datetime.utcnow(),
        }}
    )

    # ── If interested, auto-convert ───────────────────────────────────────────
    if status == "Interested":
        try:
            raw_doc = mongo.db.raw_resumes.find_one({"_id": ObjectId(conf["raw_resume_id"])})
            if raw_doc and raw_doc.get("status") != "Converted":
                if not mongo.db.candidate_processing.find_one({"email": conf["candidate_email"]}):
                    from models.Resume_model import resume_schema, serialize_resume
                    candidate = resume_schema(
                        name             = conf["candidate_name"],
                        email            = conf["candidate_email"],
                        phone            = raw_doc.get("phone", ""),
                        current_role     = raw_doc.get("current_role", ""),
                        current_company  = raw_doc.get("current_company", ""),
                        experience       = raw_doc.get("experience", 0),
                        skills           = raw_doc.get("skills", ""),
                        location         = raw_doc.get("location", ""),
                        current_salary   = raw_doc.get("current_salary", 0),
                        expected_salary  = raw_doc.get("expected_salary", 0),
                        notice_period    = raw_doc.get("notice_period", "30 days"),
                        source           = "Direct",
                        status           = "New",
                        linked_job_id    = conf.get("job_id", ""),
                        linked_job_title = conf.get("job_title", ""),
                        notes            = "Auto-added after candidate confirmed interest via email screening",
                    )
                    resume_id              = _next_resume_id()
                    candidate["resume_id"] = resume_id
                    candidate["resume_file"] = ""
                    result = mongo.db.candidate_processing.insert_one(candidate)

                    raw_path  = os.path.join(RAW_DIR, raw_doc.get("filename", ""))
                    perm_name = f"{resume_id}.pdf"
                    perm_path = os.path.join(RESUME_DIR, perm_name)
                    if os.path.exists(raw_path):
                        shutil.copy2(raw_path, perm_path)
                        mongo.db.candidate_processing.update_one(
                            {"_id": result.inserted_id},
                            {"$set": {"resume_file": perm_name}}
                        )

                    mongo.db.raw_resumes.update_one(
                        {"_id": raw_doc["_id"]},
                        {"$set": {
                            "status":               "Converted",
                            "converted_resume_id":  resume_id,
                            "screening_status":     "Interested",
                            "updated_at":           datetime.utcnow(),
                        }}
                    )
        except Exception as e:
            import traceback
            traceback.print_exc()

    frontend_base = os.environ.get("FRONTEND_URL", "http://localhost:3000")  # ← FIXED
    from flask import redirect
    return redirect(
        f"{frontend_base}/screening-response-done"
        f"?status={status.replace(' ', '+')}"
        f"&job={conf.get('job_title', '')}"
    )


# ── GET /api/resumes/screening-status/<raw_id> ────────────────────────────────
@resume_bp.route("/screening-status/<raw_id>", methods=["GET"])
@jwt_required()
def get_screening_status(raw_id):
    """Recruiter checks if candidate has responded to screening email."""
    conf = mongo.db.screening_confirmations.find_one(
        {"raw_id": raw_id},
        sort=[("created_at", -1)]
    )
    if not conf:
        return jsonify(success=True, data=None), 200
    conf["_id"] = str(conf["_id"])
    for f in ("created_at", "expires_at", "responded_at"):
        if isinstance(conf.get(f), datetime):
            conf[f] = conf[f].isoformat()
    return jsonify(success=True, data=conf), 200