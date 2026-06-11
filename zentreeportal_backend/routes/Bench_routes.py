
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required,get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime,timedelta
import os, json, base64, uuid, shutil
import requests as http
from extensions import mongo
from models.Benchpeople_model import (
    bench_schema, serialize_bench, BENCH_STATUSES, EMPLOYMENT_TYPES,
)
from routes.Resume_routes import _extract_gemini_text
from ai_service import ai_parse_pdf
import logging
logger = logging.getLogger(__name__)
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

def _get_token_doc(token: str):
    doc = mongo.db.bench_form_tokens.find_one({"token": token})
    if not doc:
        return None, (jsonify(success=False, message="Invalid or expired link"), 404)
    if doc.get("expires_at") and doc["expires_at"] < datetime.utcnow():
        return None, (jsonify(success=False, message="This link has expired"), 410)
    if not doc.get("is_active", True):
        return None, (jsonify(success=False, message="This link has been deactivated"), 403)
    return doc, None



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
        '{ "name":"","email":"","phone":"","current_role":"","skills":[{"name":"","rating":3}],'
        '"experience":0,"location":"","current_salary":0,"expected_salary":0,'
        '"notice_period":"Immediate","last_client":"","last_project":"" }\n\n'
        "Rules: experience=total years as number, skills=comma-separated string, "
        "salaries=annual INR as number (0 if not found), "
        'notice_period: one of "Immediate","15 days","30 days","60 days","90 days"'
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
        # # raw    = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        # raw    = _extract_gemini_text(resp.json())
        raw    = ai_parse_pdf(file_b64, prompt, timeout=60)
        parsed = json.loads(raw.replace("```json", "").replace("```", "").strip())
        return jsonify(success=True, data=parsed, file_id=file_id), 200
    except json.JSONDecodeError:
        return jsonify(success=False, message="AI returned non-JSON — fill manually", file_id=file_id), 422
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify(success=False, message=str(e)), 500
    
    
# ── GET /api/bench/by-skill/<skill_name> ─────────────────────────────────────
@bench_bp.route("/by-skill/<skill_name>", methods=["GET"])
@jwt_required()
def by_skill(skill_name):
    docs = list(
        mongo.db.bench_people
        .find({"skills": {"$regex": skill_name.strip(), "$options": "i"}})
        .sort("created_at", -1)
    )
    return jsonify(success=True, data=[serialize_bench(d) for d in docs]), 200

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
            # {"skills":       {"$regex": q, "$options": "i"}},
            {"skills.name": {"$regex": q, "$options": "i"}},
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



# ── GET /api/bench/talent-search?q=... ───────────────────────────────────────
@bench_bp.route("/talent-search", methods=["GET"])
@jwt_required()
def talent_search():
    import re
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify(success=True, data=[]), 200

    tokens = [t.strip() for t in re.split(r'[\s,]+', q) if len(t.strip()) >= 2]
    if not tokens:
        return jsonify(success=True, data=[]), 200

    all_patterns = list({q} | set(tokens))
    pattern = "|".join(re.escape(p) for p in all_patterns)

    docs = list(
        mongo.db.bench_people.find(
            {"skills": {"$regex": pattern, "$options": "i"}}
        ).sort("created_at", -1)
    )
    return jsonify(success=True, data=[serialize_bench(d) for d in docs]), 200








@bench_bp.route("/<bench_id>/promote-to-candidate", methods=["POST"])
@jwt_required()
def promote_to_candidate(bench_id):

    bench = mongo.db.bench_people.find_one({"bench_id": bench_id})
    if not bench:
        return jsonify(success=False, message="Bench person not found"), 404

    # ── Resolve logged-in recruiter's RB user _id ─────────────────────────────
    identity        = get_jwt_identity()
    rb_recruiter_id = ""
    try:
        from extensions import resourcing_db as _rdb
        zentree_user = mongo.db.users.find_one({"_id": ObjectId(identity)})
        if zentree_user:
            rb_user = _rdb["users"].find_one({"email": zentree_user.get("email", "")})
            if rb_user:
                rb_recruiter_id = str(rb_user["_id"])
    except Exception:
        pass
    # ─────────────────────────────────────────────────────────────────────────

    data        = request.get_json(silent=True) or {}
    job_id      = data.get("job_id", "")
    job_title   = data.get("job_title", "")
    client_name = data.get("client_name", "")

    # ── Resolve job_id string and jdID from mongo _id ─────────────────────────
    resolved_job_id = ""
    rb_jd_id        = ""
    source          = data.get("source", "zentree")   # ← read source from request

    if job_id:
        if source == "resourcing_bot":
            # ── Job is from ResourcingBot jd_details ─────────────────────────
            try:
                from extensions import resourcing_db
                rb_jd = resourcing_db["jd_details"].find_one({"_id": ObjectId(job_id)})
                if rb_jd:
                    rb_jd_id        = rb_jd.get("jdID", job_id)
                    resolved_job_id = rb_jd_id          # use jdID as canonical id
                    job_title       = rb_jd.get("jobRole", rb_jd.get("jobTitle", job_title))
                    client_name     = rb_jd.get("companyName", client_name)
            except Exception:
                rb_jd_id        = job_id
                resolved_job_id = job_id
        else:
            # ── Job is from Zentree jobs ──────────────────────────────────────
            try:
                job_doc = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
                if job_doc:
                    resolved_job_id = job_doc.get("job_id", "")
                    job_title       = job_doc.get("title", job_title)
                    client_name     = job_doc.get("client_name", client_name)
            except Exception:
                pass

            # Look up matching jdID in resourcing_bot by zentree_job_id
            try:
                from extensions import resourcing_db
                rb_jd = resourcing_db["jd_details"].find_one({"zentree_job_id": resolved_job_id})
                if rb_jd:
                    rb_jd_id = rb_jd.get("jdID", resolved_job_id)
                else:
                    rb_jd_id = resolved_job_id
            except Exception:
                rb_jd_id = resolved_job_id

    # ── Check if already exists in zentree for same email + job ──────────────
    existing = mongo.db.candidate_processing.find_one({
        "email":         bench["email"].lower().strip(),
        "linked_job_id": resolved_job_id,
    })
    if existing:
        from models.Resume_model import serialize_resume

        # ── Still sync to ResourcingBot if missing there ───────────────────
        try:
            from extensions import get_candidate_profiles_col
            col = get_candidate_profiles_col()
            already_in_rb = col.find_one({
                "candidateEmail": bench["email"].lower().strip(),
                "jdID":           rb_jd_id,
            })
            if not already_in_rb:
                _write_to_resourcing_bot(
                    bench, rb_jd_id, job_title, client_name,
                    existing.get("resume_id", ""), bench_id,
                    recruiter_id=rb_recruiter_id
                )
        except Exception as rb_err:
            logger.warning(f"[promote] ResourcingBot sync skipped: {rb_err}")

        return jsonify(
            success=True,
            message="Candidate already exists for this job",
            data=serialize_resume(existing),
            already_existed=True,
        ), 200

    # ── Build skills string ───────────────────────────────────────────────────
    skills_raw = bench.get("skills", [])
    if isinstance(skills_raw, list):
        skills_str = ", ".join(
            s["name"] if isinstance(s, dict) else str(s)
            for s in skills_raw
        )
    else:
        skills_str = str(skills_raw)

    try:
        from models.Resume_model import resume_schema, serialize_resume

        count     = mongo.db.candidate_processing.count_documents({})
        resume_id = f"RES{str(count + 1).zfill(3)}"

        candidate = resume_schema(
            name             = bench["name"],
            email            = bench["email"],
            phone            = bench.get("phone", ""),
            current_role     = bench.get("current_role", ""),
            current_company  = bench.get("last_client", ""),
            experience       = bench.get("experience", 0),
            skills           = skills_str,
            location         = bench.get("location", ""),
            current_salary   = bench.get("current_salary", 0),
            expected_salary  = bench.get("expected_salary", 0),
            notice_period    = bench.get("notice_period", "Immediate"),
            source           = "Bench",
            status           = "Shortlisted",
            linked_job_id    = resolved_job_id,
            linked_job_title = job_title,
            notes            = f"Promoted from bench. Bench ID: {bench_id}. {bench.get('notes','')}",
        )
        candidate["resume_id"]   = resume_id
        candidate["resume_file"] = bench.get("resume_file", "")
        candidate["bench_id"]    = bench_id

        result = mongo.db.candidate_processing.insert_one(candidate)

        # ── Copy resume PDF ───────────────────────────────────────────────
        bench_resume = bench.get("resume_file", "")
        if bench_resume:
            UPLOAD_DIR = os.environ.get("UPLOAD_FOLDER", "uploads")
            src = os.path.join(UPLOAD_DIR, "bench_resumes", bench_resume)
            dst = os.path.join(UPLOAD_DIR, "resumes", f"{resume_id}.pdf")
            if os.path.exists(src):
                shutil.copy2(src, dst)
                mongo.db.candidate_processing.update_one(
                    {"_id": result.inserted_id},
                    {"$set": {"resume_file": f"{resume_id}.pdf"}}
                )
                candidate["resume_file"] = f"{resume_id}.pdf"

        # ── Write to ResourcingBot candidate_profiles ─────────────────────
        try:
            _write_to_resourcing_bot(
                bench, rb_jd_id, job_title, client_name, resume_id, bench_id, recruiter_id=rb_recruiter_id
            )
        except Exception as rb_err:
            logger.warning(f"[promote] ResourcingBot write failed (non-fatal): {rb_err}")

        candidate["_id"] = result.inserted_id
        return jsonify(
            success=True,
            message="Bench person promoted to candidate",
            data=serialize_resume(candidate),
            already_existed=False,
        ), 201

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


def _write_to_resourcing_bot(
    bench: dict,
    jd_id: str,
    job_title: str,
    client_name: str,
    resume_id: str,
    bench_id: str,
    recruiter_id: str = "",
):
    """
    Mirror a bench-promoted candidate into resourcing_bot_db.candidate_profiles.
    Fails silently — never crashes the main promote flow.
    """
    from extensions import get_candidate_profiles_col, resourcing_db

    # ── Skills: list of dicts → comma-separated string ────────────────────────
    skills_raw = bench.get("skills", [])
    if isinstance(skills_raw, list):
        skills_list = [
            s["name"] if isinstance(s, dict) else str(s)
            for s in skills_raw
        ]
    else:
        skills_list = [s.strip() for s in str(skills_raw).split(",") if s.strip()]

    col = get_candidate_profiles_col()

    # ── Guard: skip if already present for same email + jdID ─────────────────
    if col.find_one({
        "candidateEmail": bench["email"].lower().strip(),
        "jdID":           jd_id,
    }):
        return

    profile_doc = {
        # ── Identity ──────────────────────────────────────────────────────────
        "candidatename":  bench.get("name", ""),
        "candidateEmail": bench["email"].lower().strip(),
        "phone":          bench.get("phone", ""),
        "address":        bench.get("location", ""),
        "jobRole":        job_title,

        # ── JD linkage ────────────────────────────────────────────────────────
        "jdID":           jd_id,
        "companyName":    client_name,
        # "jobTitle":       job_title,

        # ── Screening placeholders ────────────────────────────────────────────
        "summaries":              bench.get("notes", ""),
        "overallStatus":          "NewCandidate",
        "match_score":            0,
        "ScreeningTestScore":     0,
        "mcq_questions":          [],
        "subjective_questions":   [],
        "programming_questions":  [],
        "interviewFeedback":      [],
        "recruiterFeedback":      "",
        "hiringManagerFeedback":  "",

        # ── Skills ────────────────────────────────────────────────────────────
        "skills":         skills_list,

        # ── Source tracking ───────────────────────────────────────────────────
        "source":              "Bench",
        "zentree_resume_id":   resume_id,
        "bench_id":            bench_id,
        "recruiterid":         recruiter_id,

        # ── Resume ────────────────────────────────────────────────────────────
        "resumeUrl":      bench.get("resume_file", ""),

        # ── Timestamps ────────────────────────────────────────────────────────
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    col.insert_one(profile_doc)


















# ══════════════════════════════════════════════════════════════════════════════
# RECRUITER — Link Generation (JWT protected)
# ══════════════════════════════════════════════════════════════════════════════

@bench_bp.route("/generate-link", methods=["POST"])
@jwt_required()
def generate_link():
    data            = request.get_json(silent=True) or {}
    label           = data.get("label", "Candidate Registration Form")
    expires_in_days = int(data.get("expires_in_days", 7))
    created_by      = data.get("created_by", "")
    token           = str(uuid.uuid4())
    expires_at      = datetime.utcnow() + timedelta(days=expires_in_days)
    mongo.db.bench_form_tokens.insert_one({
        "token": token, "label": label, "created_by": created_by,
        "created_at": datetime.utcnow(), "expires_at": expires_at,
        "is_active": True, "used_count": 0,
    })
    frontend_base = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return jsonify(success=True, token=token, url=f"{frontend_base}/candidate-form/{token}",
                   label=label, expires_at=expires_at.isoformat()), 201


@bench_bp.route("/form-links", methods=["GET"])
@jwt_required()
def list_links():
    docs = list(mongo.db.bench_form_tokens.find().sort("created_at", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
        for f in ("created_at", "expires_at"):
            if isinstance(d.get(f), datetime):
                d[f] = d[f].isoformat()
    return jsonify(success=True, data=docs), 200


@bench_bp.route("/form-links/<token>/deactivate", methods=["PATCH"])
@jwt_required()
def deactivate_link(token):
    res = mongo.db.bench_form_tokens.update_one(
        {"token": token}, {"$set": {"is_active": False}}
    )
    if res.matched_count == 0:
        return jsonify(success=False, message="Token not found"), 404
    return jsonify(success=True, message="Link deactivated"), 200


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC — Candidate Self-Registration (NO JWT)
# ══════════════════════════════════════════════════════════════════════════════

@bench_bp.route("/public/bench-form/<token>", methods=["GET"])
def get_form_meta(token):
    token_doc, err = _get_token_doc(token)
    if err:
        return err
    return jsonify(success=True, label=token_doc.get("label", "Candidate Registration"),
                   expires_at=token_doc["expires_at"].isoformat() if token_doc.get("expires_at") else None,
                   statuses=BENCH_STATUSES, employment_types=EMPLOYMENT_TYPES), 200


@bench_bp.route("/public/bench-form/<token>/parse-pdf", methods=["POST"])
def public_parse_pdf(token):
    token_doc, err = _get_token_doc(token)
    if err:
        return err
    data     = request.get_json(silent=True) or {}
    file_b64 = data.get("file_b64", "")
    if not file_b64:
        return jsonify(success=False, message="'file_b64' is required"), 400
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
        raw    = ai_parse_pdf(file_b64, prompt, timeout=60)
        parsed = json.loads(raw.replace("```json", "").replace("```", "").strip())
        return jsonify(success=True, data=parsed, file_id=file_id), 200
    except json.JSONDecodeError:
        return jsonify(success=False, message="AI returned non-JSON — fill manually", file_id=file_id), 422
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify(success=False, message=str(e)), 500


@bench_bp.route("/public/bench-form/<token>/submit", methods=["POST"])
def submit_form(token):
    token_doc, err = _get_token_doc(token)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    for f in ["name", "email"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400
    if mongo.db.bench_people.find_one({"email": data["email"].lower().strip()}):
        return jsonify(success=False, message="A profile with this email already exists"), 409
    try:
        doc = bench_schema(
            name            = data["name"],
            email           = data["email"],
            phone           = data.get("phone", ""),
            current_role    = data.get("current_role", ""),
            skills          = data.get("skills", ""),
            experience      = data.get("experience", 0),
            location        = data.get("location", ""),
            current_salary  = data.get("current_salary", 0),
            expected_salary = data.get("expected_salary", 0),
            notice_period   = data.get("notice_period", "Immediate"),
            last_client     = data.get("last_client", ""),
            last_project    = data.get("last_project", ""),
            status          = "Pending Review",
            added_by        = f"self_registered:{token_doc.get('label', token)}",
            employment_type = data.get("employment_type", "Permanent"),
            notes           = data.get("notes", ""),
        )
        bench_id           = _next_bench_id()
        doc["bench_id"]    = bench_id
        doc["resume_file"] = ""
        doc["source"]      = "self_registered"
        doc["form_token"]  = token
        result = mongo.db.bench_people.insert_one(doc)
        file_id = data.get("file_id", "")
        if file_id:
            temp_path = os.path.join(BENCH_DIR, f"temp_{file_id}.pdf")
            perm_name = f"{bench_id}.pdf"
            perm_path = os.path.join(BENCH_DIR, perm_name)
            if os.path.exists(temp_path):
                shutil.move(temp_path, perm_path)
                mongo.db.bench_people.update_one(
                    {"_id": result.inserted_id}, {"$set": {"resume_file": perm_name}}
                )
        mongo.db.bench_form_tokens.update_one({"token": token}, {"$inc": {"used_count": 1}})
        return jsonify(success=True,
                       message="Profile submitted! Our team will review and get in touch.",
                       bench_id=bench_id), 201
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500