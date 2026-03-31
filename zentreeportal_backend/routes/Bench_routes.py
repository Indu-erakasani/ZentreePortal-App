
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import os, json, base64, uuid, shutil
import requests as http
from extensions import mongo
from models.Benchpeople_model import (
    bench_schema, serialize_bench, BENCH_STATUSES, EMPLOYMENT_TYPES,
)

bench_bp = Blueprint("bench", __name__)

_default_upload = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
UPLOAD_DIR = os.environ.get("UPLOAD_FOLDER", _default_upload)
BENCH_DIR  = os.path.join(UPLOAD_DIR, "bench_resumes")
os.makedirs(BENCH_DIR, exist_ok=True)


def _find(bid: str):
    try:
        oid = ObjectId(bid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid bench ID"), 400)
    doc = mongo.db.bench_people.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Bench person not found"), 404)
    return doc, None


def _next_bench_id() -> str:
    count = mongo.db.bench_people.count_documents({})
    return f"BCH{str(count + 1).zfill(3)}"


# ── POST /api/bench/parse-pdf ────────────────────────────────────────────────
@bench_bp.route("/parse-pdf", methods=["POST"])
@jwt_required()
def parse_pdf():
    data     = request.get_json(silent=True) or {}
    file_b64 = data.get("file_b64", "")
    if not file_b64:
        return jsonify(success=False, message="'file_b64' is required"), 400

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return jsonify(success=False, message="GEMINI_API_KEY not set"), 500

    file_id   = str(uuid.uuid4())
    temp_path = os.path.join(BENCH_DIR, f"temp_{file_id}.pdf")
    try:
        with open(temp_path, "wb") as f:
            f.write(base64.b64decode(file_b64))
    except Exception as e:
        return jsonify(success=False, message=f"Failed to save file: {e}"), 500

    prompt = (
        "Extract candidate information from this resume and return ONLY a valid JSON object "
        "with no extra text, no markdown, no backticks.\n\n"
        "Use exactly these keys:\n"
        '{ "name":"","email":"","phone":"","current_role":"","skills":"",'
        '"experience":0,"location":"","current_salary":0,"expected_salary":0,'
        '"notice_period":"Immediate","last_client":"","last_project":"" }\n\n'
        "Rules: experience=total years as number, skills=comma-separated string, "
        "salaries=annual INR as number (0 if not found), "
        'notice_period: one of "Immediate","15 days","30 days","60 days","90 days"'
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
        raw    = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw.replace("```json", "").replace("```", "").strip())
        return jsonify(success=True, data=parsed, file_id=file_id), 200
    except json.JSONDecodeError:
        return jsonify(success=False, message="AI returned non-JSON — fill manually", file_id=file_id), 422
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify(success=False, message=str(e)), 500


# ── GET /api/bench/stats ─────────────────────────────────────────────────────
@bench_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    by_status = list(mongo.db.bench_people.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]))
    return jsonify(success=True, data={"by_status": by_status}), 200


# ── GET /api/bench/meta/options ──────────────────────────────────────────────
@bench_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def options():
    return jsonify(success=True, statuses=BENCH_STATUSES, employment_types=EMPLOYMENT_TYPES), 200


# ── GET /api/bench/ ──────────────────────────────────────────────────────────
@bench_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    q        = request.args.get("q", "").strip()
    status   = request.args.get("status", "")
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))

    query = {}
    if q:
        query["$or"] = [
            {"name":         {"$regex": q, "$options": "i"}},
            {"skills":       {"$regex": q, "$options": "i"}},
            {"current_role": {"$regex": q, "$options": "i"}},
            {"bench_id":     {"$regex": q, "$options": "i"}},
        ]
    if status:
        query["status"] = status

    total = mongo.db.bench_people.count_documents(query)
    docs  = list(
        mongo.db.bench_people.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(success=True, data=[serialize_bench(d) for d in docs],
                   total=total, page=page, per_page=per_page), 200


# ── POST /api/bench/ ─────────────────────────────────────────────────────────
@bench_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    for f in ["name", "email"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    if mongo.db.bench_people.find_one({"email": data["email"].lower().strip()}):
        return jsonify(success=False, message="A bench person with this email already exists"), 409

    try:
        doc = bench_schema(
            name              = data["name"],
            email             = data["email"],
            phone             = data.get("phone", ""),
            current_role      = data.get("current_role", ""),
            skills            = data.get("skills", ""),
            experience        = data.get("experience", 0),
            location          = data.get("location", ""),
            current_salary    = data.get("current_salary", 0),
            expected_salary   = data.get("expected_salary", 0),
            notice_period     = data.get("notice_period", "Immediate"),
            last_client       = data.get("last_client", ""),
            last_project      = data.get("last_project", ""),
            status            = data.get("status", "Available"),
            added_by          = data.get("added_by", ""),
            employment_type   = data.get("employment_type", "Permanent"),
            notes             = data.get("notes", ""),
        )
        bench_id          = _next_bench_id()
        doc["bench_id"]   = bench_id
        doc["resume_file"] = ""

        result = mongo.db.bench_people.insert_one(doc)

        file_id = data.get("file_id", "")
        if file_id:
            temp_path = os.path.join(BENCH_DIR, f"temp_{file_id}.pdf")
            perm_name = f"{bench_id}.pdf"
            perm_path = os.path.join(BENCH_DIR, perm_name)
            if os.path.exists(temp_path):
                shutil.move(temp_path, perm_path)
                mongo.db.bench_people.update_one(
                    {"_id": result.inserted_id},
                    {"$set": {"resume_file": perm_name}},
                )
                doc["resume_file"] = perm_name

        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Bench person added", data=serialize_bench(doc)), 201
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# ── GET /api/bench/<id>/file ─────────────────────────────────────────────────
@bench_bp.route("/<bid>/file", methods=["GET"])
@jwt_required()
def get_file(bid):
    doc, err = _find(bid)
    if err:
        return err
    filename = doc.get("resume_file", "")
    if not filename:
        return jsonify(success=False, message="No resume file uploaded"), 404
    file_path = os.path.join(BENCH_DIR, filename)
    if not os.path.exists(file_path):
        return jsonify(success=False, message="File not found on server"), 404
    return send_file(file_path, mimetype="application/pdf", as_attachment=False,
                     download_name=f"{doc.get('name','bench').replace(' ','_')}_resume.pdf")


# ── POST /api/bench/<id>/upload-file ─────────────────────────────────────────
@bench_bp.route("/<bid>/upload-file", methods=["POST"])
@jwt_required()
def upload_file(bid):
    doc, err = _find(bid)
    if err:
        return err
    data     = request.get_json(silent=True) or {}
    file_b64 = data.get("file_b64", "")
    if not file_b64:
        return jsonify(success=False, message="'file_b64' is required"), 400
    try:
        old = doc.get("resume_file", "")
        if old:
            old_path = os.path.join(BENCH_DIR, old)
            if os.path.exists(old_path):
                os.remove(old_path)
        bench_id  = doc.get("bench_id", str(doc["_id"]))
        filename  = f"{bench_id}.pdf"
        file_path = os.path.join(BENCH_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(file_b64))
        mongo.db.bench_people.update_one(
            {"_id": doc["_id"]},
            {"$set": {"resume_file": filename, "updated_at": datetime.utcnow()}},
        )
        return jsonify(success=True, message="File uploaded", resume_file=filename), 200
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# ── GET /api/bench/<id> ──────────────────────────────────────────────────────
@bench_bp.route("/<bid>", methods=["GET"])
@jwt_required()
def get_one(bid):
    doc, err = _find(bid)
    if err:
        return err
    return jsonify(success=True, data=serialize_bench(doc)), 200


# ── PUT /api/bench/<id> ──────────────────────────────────────────────────────
@bench_bp.route("/<bid>", methods=["PUT"])
@jwt_required()
def update(bid):
    doc, err = _find(bid)
    if err:
        return err
    data    = request.get_json(silent=True) or {}
    allowed = [
        "name", "phone", "current_role", "skills", "experience", "location",
        "current_salary", "expected_salary", "notice_period", "availability_date",
        "last_client", "last_project", "bench_since", "status", "added_by",
        "employment_type", "notes",
    ]
    upd = {k: data[k] for k in allowed if k in data}
    if "status" in upd and upd["status"] not in BENCH_STATUSES:
        return jsonify(success=False, message="Invalid status"), 400
    upd["updated_at"] = datetime.utcnow()
    mongo.db.bench_people.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.bench_people.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_bench(updated)), 200


# ── DELETE /api/bench/<id> ───────────────────────────────────────────────────
@bench_bp.route("/<bid>", methods=["DELETE"])
@jwt_required()
def delete(bid):
    doc, err = _find(bid)
    if err:
        return err
    filename = doc.get("resume_file", "")
    if filename:
        fp = os.path.join(BENCH_DIR, filename)
        if os.path.exists(fp):
            os.remove(fp)
    mongo.db.bench_people.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Deleted"), 200