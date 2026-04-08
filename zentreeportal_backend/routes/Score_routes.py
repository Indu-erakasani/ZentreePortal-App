
# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required
# from bson import ObjectId
# from bson.errors import InvalidId
# from datetime import datetime
# import os, json, requests as http

# from extensions import mongo

# score_bp = Blueprint("score", __name__)

# GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
# GEMINI_URL = (
#     "https://generativelanguage.googleapis.com/v1beta"
#     "/models/gemini-2.5-flash:generateContent"
# )


# # ── helpers ───────────────────────────────────────────────────────────────────

# def _serialize(doc: dict) -> dict:
#     d = dict(doc)
#     d["_id"] = str(d.get("_id", ""))
#     for f in ("scored_at",):
#         if isinstance(d.get(f), datetime):
#             d[f] = d[f].isoformat()
#     return d


# def _build_prompt(resume: dict, job: dict) -> str:
#     skills_list = ", ".join(job.get("skills", [])) if isinstance(job.get("skills"), list) else job.get("skills", "")
#     return f"""
# Score this recruitment candidate against the job description.
# Return ONLY a valid JSON object — no markdown, no backticks, no extra text.

# JOB:
# Title: {job.get('title', '')}
# Required skills: {skills_list}
# Experience required: {job.get('experience_min', 0)}–{job.get('experience_max', 5)} years
# Salary budget: ₹{job.get('salary_min', 0)}–₹{job.get('salary_max', 0)} per annum
# Location: {job.get('location', '')}
# Work mode: {job.get('work_mode', 'On-site')}
# Job type: {job.get('job_type', 'Full-Time')}

# CANDIDATE:
# Name: {resume.get('name', '')}
# Current role: {resume.get('current_role', '')}
# Skills: {resume.get('skills', '')}
# Experience: {resume.get('experience', 0)} years
# Expected salary: ₹{resume.get('expected_salary', 0)} per annum
# Notice period: {resume.get('notice_period', '')}
# Location: {resume.get('location', '')}

# Return exactly this JSON structure:
# {{
#   "overall_score": <integer 0-100>,
#   "verdict": "<one of: Strong match | Good match | Moderate match | Weak match>",
#   "skills_score": <integer 0-100>,
#   "experience_score": <integer 0-100>,
#   "salary_score": <integer 0-100>,
#   "notice_score": <integer 0-100>,
#   "location_score": <integer 0-100>,
#   "gaps": ["<gap 1>", "<gap 2>"],
#   "strengths": ["<strength 1>", "<strength 2>"],
#   "summary": "<2-3 sentence recruiter summary>"
# }}

# Scoring rules:
# - skills_score: % of required skills the candidate has (exact + adjacent matches)
# - experience_score: 100 if within range, reduce 10pt per year outside range
# - salary_score: 100 if expected <= max budget, reduce proportionally if over
# - notice_score: 100=Immediate, 85=15days, 70=30days, 50=60days, 30=90days
# - location_score: 100 if same city, 80 if same state, 60 if remote-friendly, 40 otherwise
# - overall_score: weighted average (skills 40%, experience 25%, salary 15%, notice 10%, location 10%)
# - gaps: list of specific missing skills or mismatches (max 5 items, keep concise)
# - strengths: list of candidate's strong points relevant to this job (max 3 items)
# """.strip()


# # ── POST /api/score/candidate ─────────────────────────────────────────────────
# @score_bp.route("/candidate", methods=["POST"])
# @jwt_required()
# def score_candidate():
#     data = request.get_json(silent=True) or {}
#     resume_mongo_id = data.get("resume_id", "")
#     job_mongo_id    = data.get("job_id",    "")

#     if not resume_mongo_id or not job_mongo_id:
#         return jsonify(success=False, message="'resume_id' and 'job_id' are required"), 400

#     # ── Fetch resume ──────────────────────────────────────────────────────────
#     try:
#         resume = mongo.db.candidate_processing.find_one({"_id": ObjectId(resume_mongo_id)})
#     except InvalidId:
#         return jsonify(success=False, message="Invalid resume_id"), 400
#     if not resume:
#         return jsonify(success=False, message="Resume not found"), 404

#     # ── Fetch job ─────────────────────────────────────────────────────────────
#     try:
#         job = mongo.db.jobs.find_one({"_id": ObjectId(job_mongo_id)})
#     except InvalidId:
#         return jsonify(success=False, message="Invalid job_id"), 400
#     if not job:
#         return jsonify(success=False, message="Job not found"), 404

#     if not GEMINI_KEY:
#         return jsonify(success=False, message="GEMINI_API_KEY not configured on server"), 500

#     # ── Call Gemini ───────────────────────────────────────────────────────────
#     try:
#         resp = http.post(
#             f"{GEMINI_URL}?key={GEMINI_KEY}",
#             headers={"Content-Type": "application/json"},
#             json={"contents": [{"parts": [{"text": _build_prompt(resume, job)}]}]},
#             timeout=45,
#         )
#         if not resp.ok:
#             return jsonify(success=False, message=f"Gemini API error {resp.status_code}: {resp.text[:300]}"), 500
#         resp.raise_for_status()
#         raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
#         result   = json.loads(raw_text.replace("```json", "").replace("```", "").strip())
#     except json.JSONDecodeError:
#         return jsonify(success=False, message="AI returned non-JSON response, please retry"), 422
#     except Exception as e:
#         return jsonify(success=False, message=f"Scoring failed: {str(e)}"), 500

#     # ── Upsert into candidate_scores ──────────────────────────────────────────
#     score_doc = {
#         "resume_id":       str(resume["_id"]),
#         "resume_id_human": resume.get("resume_id", ""),
#         "candidate_name":  resume.get("name", ""),
#         "job_id":          str(job["_id"]),
#         "job_id_human":    job.get("job_id", ""),
#         "job_title":       job.get("title", ""),
#         "client_name":     job.get("client_name", ""),
#         **result,
#         "scored_at": datetime.utcnow(),
#     }

#     mongo.db.candidate_scores.update_one(
#         {"resume_id": str(resume["_id"]), "job_id": str(job["_id"])},
#         {"$set": score_doc},
#         upsert=True,
#     )

#     return jsonify(success=True, data=_serialize(score_doc)), 200


# # ── GET /api/score/candidate?resume_id=X&job_id=Y ────────────────────────────
# @score_bp.route("/candidate", methods=["GET"])
# @jwt_required()
# def get_score():
#     resume_id = request.args.get("resume_id", "")
#     job_id    = request.args.get("job_id",    "")
#     if not resume_id or not job_id:
#         return jsonify(success=False, message="'resume_id' and 'job_id' query params required"), 400

#     doc = mongo.db.candidate_scores.find_one({"resume_id": resume_id, "job_id": job_id})
#     if not doc:
#         return jsonify(success=False, message="No score found — score this candidate first"), 404

#     return jsonify(success=True, data=_serialize(doc)), 200


# # ── GET /api/score/all/<resume_id> ────────────────────────────────────────────
# @score_bp.route("/all/<resume_id>", methods=["GET"])
# @jwt_required()
# def get_all_scores(resume_id):
#     docs = list(
#         mongo.db.candidate_scores
#         .find({"resume_id": resume_id})
#         .sort("scored_at", -1)
#     )
#     return jsonify(success=True, data=[_serialize(d) for d in docs]), 200







"""
POST /api/score/candidate        → score a candidate against their linked job (calls Gemini)
GET  /api/score/candidate        → fetch cached score (?resume_id=X&job_id=Y)
GET  /api/score/all/<resume_id>  → all scores ever generated for a candidate
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import os, json, requests as http

from extensions import mongo

score_bp = Blueprint("score", __name__)

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta"
    "/models/gemini-2.5-flash:generateContent"
)


# ── helpers ───────────────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    d = dict(doc)
    d["_id"] = str(d.get("_id", ""))
    for f in ("scored_at",):
        if isinstance(d.get(f), datetime):
            d[f] = d[f].isoformat()
    return d


def _build_prompt(resume: dict, job: dict) -> str:
    skills_list = ", ".join(job.get("skills", [])) if isinstance(job.get("skills"), list) else job.get("skills", "")
    return f"""
Score this recruitment candidate against the job description.
Return ONLY a valid JSON object — no markdown, no backticks, no extra text.

JOB:
Title: {job.get('title', '')}
Required skills: {skills_list}
Experience required: {job.get('experience_min', 0)}–{job.get('experience_max', 5)} years
Salary budget: ₹{job.get('salary_min', 0)}–₹{job.get('salary_max', 0)} per annum
Location: {job.get('location', '')}
Work mode: {job.get('work_mode', 'On-site')}
Job type: {job.get('job_type', 'Full-Time')}

CANDIDATE:
Name: {resume.get('name', '')}
Current role: {resume.get('current_role', '')}
Skills: {resume.get('skills', '')}
Experience: {resume.get('experience', 0)} years
Expected salary: ₹{resume.get('expected_salary', 0)} per annum
Notice period: {resume.get('notice_period', '')}
Location: {resume.get('location', '')}

Return exactly this JSON structure:
{{
  "overall_score": <integer 0-100>,
  "verdict": "<one of: Strong match | Good match | Moderate match | Weak match>",
  "skills_score": <integer 0-100>,
  "experience_score": <integer 0-100>,
  "salary_score": <integer 0-100>,
  "notice_score": <integer 0-100>,
  "location_score": <integer 0-100>,
  "gaps": ["<gap 1>", "<gap 2>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "summary": "<2-3 sentence recruiter summary>"
}}

Scoring rules:
- skills_score: % of required skills the candidate has (exact + adjacent matches)
- experience_score: 100 if within range, reduce 10pt per year outside range
- salary_score: 100 if expected <= max budget, reduce proportionally if over
- notice_score: 100=Immediate, 85=15days, 70=30days, 50=60days, 30=90days
- location_score: 100 if same city, 80 if same state, 60 if remote-friendly, 40 otherwise
- overall_score: weighted average (skills 40%, experience 25%, salary 15%, notice 10%, location 10%)
- gaps: list of specific missing skills or mismatches (max 5 items, keep concise)
- strengths: list of candidate's strong points relevant to this job (max 3 items)
""".strip()


# ── POST /api/score/candidate ─────────────────────────────────────────────────
@score_bp.route("/candidate", methods=["POST"])
@jwt_required()
def score_candidate():
    data = request.get_json(silent=True) or {}
    resume_mongo_id = data.get("resume_id", "")
    job_mongo_id    = data.get("job_id",    "")

    if not resume_mongo_id or not job_mongo_id:
        return jsonify(success=False, message="'resume_id' and 'job_id' are required"), 400

    # ── Fetch resume ──────────────────────────────────────────────────────────
    try:
        resume = mongo.db.candidate_processing.find_one({"_id": ObjectId(resume_mongo_id)})
    except InvalidId:
        return jsonify(success=False, message="Invalid resume_id"), 400
    if not resume:
        return jsonify(success=False, message="Resume not found"), 404

    # ── Fetch job ─────────────────────────────────────────────────────────────
    try:
        job = mongo.db.jobs.find_one({"_id": ObjectId(job_mongo_id)})
    except InvalidId:
        return jsonify(success=False, message="Invalid job_id"), 400
    if not job:
        return jsonify(success=False, message="Job not found"), 404

    if not GEMINI_KEY:
        return jsonify(success=False, message="GEMINI_API_KEY not configured on server"), 500

    # ── Call Gemini ───────────────────────────────────────────────────────────
    try:
        resp = http.post(
            f"{GEMINI_URL}?key={GEMINI_KEY}",
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": _build_prompt(resume, job)}]}]},
            timeout=45,
        )
        if not resp.ok:
            return jsonify(success=False, message=f"Gemini API error {resp.status_code}: {resp.text[:300]}"), 500
        resp.raise_for_status()
        parts = resp.json()["candidates"][0]["content"]["parts"]
        text_parts = [p["text"] for p in parts if p.get("text", "").strip()]
        raw_text  = text_parts[-1]
        result   = json.loads(raw_text.replace("```json", "").replace("```", "").strip())
    except json.JSONDecodeError:
        return jsonify(success=False, message="AI returned non-JSON response, please retry"), 422
    except Exception as e:
        return jsonify(success=False, message=f"Scoring failed: {str(e)}"), 500

    # ── Upsert into candidate_scores ──────────────────────────────────────────
    score_doc = {
        "resume_id":       str(resume["_id"]),
        "resume_id_human": resume.get("resume_id", ""),
        "candidate_name":  resume.get("name", ""),
        "job_id":          str(job["_id"]),
        "job_id_human":    job.get("job_id", ""),
        "job_title":       job.get("title", ""),
        "client_name":     job.get("client_name", ""),
        **result,
        "scored_at": datetime.utcnow(),
    }

    mongo.db.candidate_scores.update_one(
        {"resume_id": str(resume["_id"]), "job_id": str(job["_id"])},
        {"$set": score_doc},
        upsert=True,
    )

    return jsonify(success=True, data=_serialize(score_doc)), 200


# ── GET /api/score/candidate?resume_id=X&job_id=Y ────────────────────────────
@score_bp.route("/candidate", methods=["GET"])
@jwt_required()
def get_score():
    resume_id = request.args.get("resume_id", "")
    job_id    = request.args.get("job_id",    "")
    if not resume_id or not job_id:
        return jsonify(success=False, message="'resume_id' and 'job_id' query params required"), 400

    doc = mongo.db.candidate_scores.find_one({"resume_id": resume_id, "job_id": job_id})
    if not doc:
        return jsonify(success=False, message="No score found — score this candidate first"), 404

    return jsonify(success=True, data=_serialize(doc)), 200


# ── GET /api/score/all/<resume_id> ────────────────────────────────────────────
@score_bp.route("/all/<resume_id>", methods=["GET"])
@jwt_required()
def get_all_scores(resume_id):
    docs = list(
        mongo.db.candidate_scores
        .find({"resume_id": resume_id})
        .sort("scored_at", -1)
    )
    return jsonify(success=True, data=[_serialize(d) for d in docs]), 200