
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import os, json, base64, uuid, shutil
import requests as http
from extensions import mongo
from models.Resume_model import resume_schema, serialize_resume, SCREENING_STATUSES, SOURCES

resume_bp = Blueprint("resumes", __name__)

# ── Upload directory setup ────────────────────────────────────────────────────
# Falls back to a local ./uploads folder when running outside Docker
_default_upload = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
UPLOAD_DIR = os.environ.get("UPLOAD_FOLDER", _default_upload)
RESUME_DIR = os.path.join(UPLOAD_DIR, "resumes")
os.makedirs(RESUME_DIR, exist_ok=True)


def _find(rid: str):
    try:
        oid = ObjectId(rid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid resume ID"), 400)
    doc = mongo.db.resume_bank.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Resume not found"), 404)
    return doc, None


def _next_resume_id() -> str:
    count = mongo.db.resume_bank.count_documents({})
    return f"RES{str(count + 1).zfill(3)}"


# ── POST /api/resumes/parse-pdf ───────────────────────────────────────────────
# Accepts base64 PDF → calls Gemini → saves PDF to disk → returns parsed data + file_id
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

    # ── Save the PDF to disk immediately with a temp UUID name ────────────────
    file_id   = str(uuid.uuid4())
    temp_path = os.path.join(RESUME_DIR, f"temp_{file_id}.pdf")
    try:
        pdf_bytes = base64.b64decode(file_b64)
        with open(temp_path, "wb") as f:
            f.write(pdf_bytes)
    except Exception as e:
        return jsonify(success=False, message=f"Failed to save file: {str(e)}"), 500

    # ── Call Gemini to parse the resume ──────────────────────────────────────
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
            json={
                "contents": [{
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": "application/pdf",
                                "data": file_b64,
                            }
                        },
                        {"text": prompt},
                    ]
                }]
            },
            timeout=60,
        )
        resp.raise_for_status()
        raw    = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw.replace("```json", "").replace("```", "").strip())
        # Return parsed data AND file_id so frontend can link the file when saving
        return jsonify(success=True, data=parsed, file_id=file_id), 200

    except json.JSONDecodeError:
        # Parsing failed but file is saved — still return file_id so user can fill manually
        return jsonify(
            success=False,
            message="AI returned non-JSON — fill manually",
            file_id=file_id,
        ), 422
    except Exception as e:
        # Clean up temp file on hard failure
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify(success=False, message=str(e)), 500


# ── GET /api/resumes/<id>/file ────────────────────────────────────────────────
# Streams the stored PDF back to the browser (inline — opens in PDF viewer)
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

    return send_file(
        file_path,
        mimetype="application/pdf",
        as_attachment=False,              # inline — opens in browser PDF viewer
        download_name=f"{doc.get('name', 'resume').replace(' ', '_')}_resume.pdf",
    )



# ── POST /api/resumes/<id>/upload-file ───────────────────────────────────────
# Upload / replace a PDF for an already-saved candidate (used by Add Candidate form)
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
        # Delete old file if one exists
        old_filename = doc.get("resume_file", "")
        if old_filename:
            old_path = os.path.join(RESUME_DIR, old_filename)
            if os.path.exists(old_path):
                os.remove(old_path)

        # Save new file as <resume_id>.pdf
        resume_id = doc.get("resume_id", str(doc["_id"]))
        filename  = f"{resume_id}.pdf"
        file_path = os.path.join(RESUME_DIR, filename)

        with open(file_path, "wb") as f:
            f.write(base64.b64decode(file_b64))

        mongo.db.resume_bank.update_one(
            {"_id": doc["_id"]},
            {"$set": {"resume_file": filename, "updated_at": datetime.utcnow()}},
        )
        return jsonify(success=True, message="File uploaded", resume_file=filename), 200

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# ── GET /api/resumes/ ─────────────────────────────────────────────────────────
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
        ]
    if status:  query["status"]        = status
    if source:  query["source"]        = source
    if job_id:  query["linked_job_id"] = job_id
    if min_exp: query["experience"]    = {"$gte": float(min_exp)}
    if max_exp:
        query.setdefault("experience", {})
        query["experience"]["$lte"] = float(max_exp)

    total = mongo.db.resume_bank.count_documents(query)
    docs  = list(
        mongo.db.resume_bank.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(
        success=True,
        data=[serialize_resume(d) for d in docs],
        total=total, page=page, per_page=per_page,
    ), 200


# ── GET /api/resumes/stats ────────────────────────────────────────────────────
@resume_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    by_status = list(mongo.db.resume_bank.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]))
    by_source = list(mongo.db.resume_bank.aggregate([
        {"$group": {"_id": "$source", "count": {"$sum": 1}}},
    ]))
    return jsonify(success=True, data={"by_status": by_status, "by_source": by_source}), 200


# ── GET /api/resumes/<id> ─────────────────────────────────────────────────────
@resume_bp.route("/<rid>", methods=["GET"])
@jwt_required()
def get_one(rid):
    doc, err = _find(rid)
    if err:
        return err
    return jsonify(success=True, data=serialize_resume(doc)), 200


# ── POST /api/resumes/ ────────────────────────────────────────────────────────
@resume_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    for f in ["name", "email"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    if mongo.db.resume_bank.find_one({"email": data["email"].lower().strip()}):
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
            linked_job_id    = data.get("linked_job_id", ""),
            linked_job_title = data.get("linked_job_title", ""),
            notes            = data.get("notes", ""),
        )

        # Generate resume_id before insert so we can name the file
        resume_id     = _next_resume_id()
        doc["resume_id"]   = resume_id
        doc["resume_file"] = ""          # will be updated below if file_id present

        result = mongo.db.resume_bank.insert_one(doc)

        # ── Move temp PDF to permanent location ───────────────────────────────
        file_id = data.get("file_id", "")
        if file_id:
            temp_path = os.path.join(RESUME_DIR, f"temp_{file_id}.pdf")
            perm_name = f"{resume_id}.pdf"
            perm_path = os.path.join(RESUME_DIR, perm_name)
            if os.path.exists(temp_path):
                shutil.move(temp_path, perm_path)
                mongo.db.resume_bank.update_one(
                    {"_id": result.inserted_id},
                    {"$set": {"resume_file": perm_name}},
                )
                doc["resume_file"] = perm_name

        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Candidate added", data=serialize_resume(doc)), 201

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# ── PUT /api/resumes/<id> ─────────────────────────────────────────────────────
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
        "notice_period", "source", "status", "linked_job_id",
        "linked_job_title", "notes",
    ]
    upd = {k: data[k] for k in allowed if k in data}
    if "status" in upd and upd["status"] not in SCREENING_STATUSES:
        return jsonify(success=False, message="Invalid status"), 400

    upd["updated_at"] = datetime.utcnow()
    mongo.db.resume_bank.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.resume_bank.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_resume(updated)), 200


# ── DELETE /api/resumes/<id> ──────────────────────────────────────────────────
@resume_bp.route("/<rid>", methods=["DELETE"])
@jwt_required()
def delete(rid):
    doc, err = _find(rid)
    if err:
        return err

    # Delete the physical file too
    filename = doc.get("resume_file", "")
    if filename:
        file_path = os.path.join(RESUME_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    mongo.db.resume_bank.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Candidate deleted"), 200


# ── GET /api/resumes/meta/options ─────────────────────────────────────────────
@resume_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def options():
    return jsonify(success=True, statuses=SCREENING_STATUSES, sources=SOURCES), 200

# ── GET /api/resumes/by-skill/<skill_name> ────────────────────────────────────
@resume_bp.route("/by-skill/<skill_name>", methods=["GET"])
@jwt_required()
def by_skill(skill_name):
    docs = list(
        mongo.db.resume_bank.find(
            {"skills": {"$regex": skill_name.strip(), "$options": "i"}}
        ).sort("created_at", -1)
    )
    return jsonify(success=True, data=[serialize_resume(d) for d in docs]), 200