

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

resume_bp = Blueprint("resumes", __name__)

# ── Upload directory setup ────────────────────────────────────────────────────
_default_upload = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
UPLOAD_DIR = os.environ.get("UPLOAD_FOLDER", _default_upload)
RESUME_DIR = os.path.join(UPLOAD_DIR, "resumes")
RAW_DIR    = os.path.join(UPLOAD_DIR, "resumes", "raw")
os.makedirs(RESUME_DIR, exist_ok=True)
os.makedirs(RAW_DIR,    exist_ok=True)


# ═══════════════════════════════════════════════════════════════════════════════
#  GEMINI HELPER — handles thinking models (gemini-2.5-flash etc.)
#  Thinking models return multiple parts: [thinking_part, ..., answer_part]
#  We always want the LAST text part which contains the actual answer.
# ═══════════════════════════════════════════════════════════════════════════════

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
            resp = http.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [
                    {"inline_data": {"mime_type": "application/pdf", "data": file_b64}},
                    {"text": prompt},
                ]}]},
                timeout=60,
            )
            resp.raise_for_status()
            # ── Use helper to handle thinking model multi-part response ────────
            raw_text     = _extract_gemini_text(resp.json())
            parsed_data  = json.loads(raw_text.replace("```json", "").replace("```", "").strip())
            parse_status = "parsed"
        except Exception:
            parse_status = "failed"

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


@resume_bp.route("/raw/<rid>", methods=["DELETE"])
@jwt_required()
def delete_raw(rid):
    doc, err = _find_raw(rid)
    if err:
        return err
    file_path = os.path.join(RAW_DIR, doc.get("filename", ""))
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
        resp = http.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [
                {"inline_data": {"mime_type": "application/pdf", "data": file_b64}},
                {"text": prompt},
            ]}]},
            timeout=60,
        )
        resp.raise_for_status()
        # ── Use helper to handle thinking model multi-part response ────────────
        raw    = _extract_gemini_text(resp.json())
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
    q        = request.args.get("q", "").strip()
    status   = request.args.get("status", "")
    source   = request.args.get("source", "")
    job_id   = request.args.get("job_id", "")
    min_exp  = request.args.get("min_exp", "")
    max_exp  = request.args.get("max_exp", "")
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    query = {}
    if q:
        query["$or"] = [
            {"name":         {"$regex": q, "$options": "i"}},
            {"skills":       {"$regex": q, "$options": "i"}},
            {"current_role": {"$regex": q, "$options": "i"}},
            {"resume_id":    {"$regex": q, "$options": "i"}},
        ]
    if status:  query["status"]        = status
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

    if mongo.db.candidate_processing.find_one({"email": data["email"].lower().strip()}):
        return jsonify(success=False, message="A candidate with this email already exists"), 409

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
            print(f"[cleanup] Failed to delete {doc.get('raw_id')}: {e}")

    print(f"[cleanup] Expired raw resumes — deleted: {deleted_count}, errors: {error_count}")
    
    
    
@resume_bp.route("/raw/cleanup-expired", methods=["POST"])
@jwt_required()
def trigger_cleanup():
    """Manually trigger the expired raw resume cleanup."""
    cleanup_expired_raw_resumes()
    return jsonify(success=True, message="Cleanup triggered"), 200