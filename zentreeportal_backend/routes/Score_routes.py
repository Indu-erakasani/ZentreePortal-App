
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

# def _extract_gemini_text(response_json: dict) -> str:
#     """Extract final answer text from Gemini response (thinking-model safe)."""
#     try:
#         parts = response_json["candidates"][0]["content"]["parts"]
#         text_parts = [p["text"] for p in parts if p.get("text", "").strip()]
#         if not text_parts:
#             raise ValueError("No text content in Gemini response")
#         return text_parts[-1]   # last part = actual answer, not thinking
#     except (KeyError, IndexError) as e:
#         raise ValueError(f"Unexpected Gemini response structure: {e}") from e
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

#         raw_text = _extract_gemini_text(resp.json())
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










import os, json, time, re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import requests as http

from extensions import mongo

score_bp = Blueprint("score", __name__)

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta"
    "/models/gemini-2.5-flash:generateContent"
)


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _extract_gemini_text(response_json: dict) -> str:
    """
    Extract the final answer text from a Gemini response.
    Thinking models return [thinking_part, ..., answer_part] — we always
    want the LAST non-empty text part.
    """
    try:
        parts = response_json["candidates"][0]["content"]["parts"]
        text_parts = [p["text"] for p in parts if p.get("text", "").strip()]
        if not text_parts:
            raise ValueError("No text content in Gemini response")
        return text_parts[-1]
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected Gemini response structure: {e}") from e


def _resolve_resume(resume_id: str) -> dict | None:
    """
    Find candidate by resume_id string (e.g. 'RES001') OR by MongoDB _id.
    Returns None if not found.
    """
    # Try string resume_id first
    doc = mongo.db.candidate_processing.find_one(
        {"resume_id": {"$regex": f"^\\s*{resume_id.strip()}\\s*$", "$options": "i"}}
    )
    if doc:
        return doc
    # Try MongoDB _id
    try:
        doc = mongo.db.candidate_processing.find_one({"_id": ObjectId(resume_id)})
        return doc
    except (InvalidId, Exception):
        return None


def _resolve_job(job_id: str) -> dict | None:
    """
    Find job by job_id string (e.g. 'JOB-001') OR by MongoDB _id.
    Returns None if not found.
    """
    doc = mongo.db.jobs.find_one(
        {"job_id": {"$regex": f"^\\s*{job_id.strip()}\\s*$", "$options": "i"}}
    )
    if doc:
        return doc
    try:
        doc = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
        return doc
    except (InvalidId, Exception):
        return None


# ═══════════════════════════════════════════════════════════════════════════════
#  RULE-BASED FALLBACK SCORER
#  Used when Gemini is unavailable. Deterministic, transparent, fast.
# ═══════════════════════════════════════════════════════════════════════════════

def _skill_overlap(candidate_skills: str, job_skills) -> tuple[float, list, list]:
    """
    Returns (overlap_ratio, matched_skills, missing_skills).
    job_skills can be a list or comma-separated string.
    """
    def tokenize(val):
        if isinstance(val, list):
            tokens = val
        else:
            tokens = re.split(r"[,/|;]+", str(val or ""))
        return {t.strip().lower() for t in tokens if len(t.strip()) > 1}

    cand_set = tokenize(candidate_skills)
    job_set  = tokenize(job_skills)

    if not job_set:
        return 1.0, [], []

    matched = [s for s in job_set if any(s in c or c in s for c in cand_set)]
    missing = [s for s in job_set if s not in [m for m in matched]]
    ratio   = len(matched) / len(job_set)
    return ratio, matched, missing


def _experience_score(cand_exp: float, job_min: int, job_max: int) -> float:
    """Returns 0–1 based on how well experience matches the job range."""
    if job_min == 0 and job_max == 0:
        return 0.8  # no requirement specified — neutral
    if cand_exp < job_min:
        gap = job_min - cand_exp
        return max(0.0, 1.0 - gap * 0.15)  # -15% per year under
    if cand_exp > job_max + 3:
        return 0.7  # over-qualified but acceptable
    return 1.0


def _salary_score(expected: float, job_min: float, job_max: float) -> float:
    """Returns 0–1 based on salary alignment."""
    if job_min == 0 and job_max == 0:
        return 0.8
    if expected == 0:
        return 0.8
    if expected <= job_max:
        return 1.0
    overshoot = (expected - job_max) / max(job_max, 1)
    return max(0.2, 1.0 - overshoot)


def _notice_score(notice_period: str) -> float:
    """Shorter notice = better. Returns 0–1."""
    mapping = {
        "immediate": 1.0,
        "15 days":   0.9,
        "30 days":   0.75,
        "60 days":   0.55,
        "90 days":   0.35,
    }
    return mapping.get((notice_period or "").lower().strip(), 0.6)


def _rule_based_score(resume: dict, job: dict) -> dict:
    """
    Compute a match score without Gemini.
    Field names match exactly what the frontend ScoreDialog expects.
    """
    cand_skills  = resume.get("skills", "")
    job_skills   = job.get("skills", []) or job.get("required_skills", [])
    cand_exp     = float(resume.get("experience", 0) or 0)
    job_exp_min  = int(job.get("experience_min", 0) or 0)
    job_exp_max  = int(job.get("experience_max", 0) or 0)
    cand_salary  = float(resume.get("expected_salary", 0) or 0)
    job_sal_min  = float(job.get("salary_min", 0) or 0)
    job_sal_max  = float(job.get("salary_max", 0) or 0)
    cand_loc     = (resume.get("location") or "").lower().strip()
    job_loc      = (job.get("location")    or "").lower().strip()
    notice       = resume.get("notice_period", "30 days")

    skill_ratio, matched_skills, missing_skills = _skill_overlap(cand_skills, job_skills)
    exp_ratio    = _experience_score(cand_exp, job_exp_min, job_exp_max)
    sal_ratio    = _salary_score(cand_salary, job_sal_min, job_sal_max)
    notice_ratio = _notice_score(notice)

    # Location score
    if not job_loc or job.get("work_mode", "").lower() in ("remote", "hybrid"):
        loc_ratio = 0.8
    elif cand_loc and job_loc:
        if cand_loc == job_loc:
            loc_ratio = 1.0
        elif any(w in job_loc for w in cand_loc.split()) or any(w in cand_loc for w in job_loc.split()):
            loc_ratio = 0.8
        else:
            loc_ratio = 0.4
    else:
        loc_ratio = 0.6

    # Weighted composite (skills 40%, exp 25%, salary 15%, notice 10%, location 10%)
    overall = (
        skill_ratio  * 0.40 +
        exp_ratio    * 0.25 +
        sal_ratio    * 0.15 +
        notice_ratio * 0.10 +
        loc_ratio    * 0.10
    )
    overall_pct = round(overall * 100)

    # Verdict — lowercase "match" to match frontend verdictColor keys
    if overall_pct >= 80:
        verdict = "Strong match"
    elif overall_pct >= 60:
        verdict = "Good match"
    elif overall_pct >= 40:
        verdict = "Moderate match"
    else:
        verdict = "Weak match"

    # Strengths / gaps
    strengths = []
    gaps      = []

    if skill_ratio >= 0.7:
        strengths.append(f"Strong skill alignment — matches {round(skill_ratio*100)}% of required skills")
    elif skill_ratio >= 0.4:
        strengths.append(f"Partial skill match — covers {round(skill_ratio*100)}% of required skills")
    else:
        gaps.append(f"Skill gap — only {round(skill_ratio*100)}% of required skills found")

    if missing_skills:
        gaps.append(f"Missing skills: {', '.join(missing_skills[:5])}")

    if exp_ratio >= 0.9:
        strengths.append(f"{cand_exp} yrs experience fits the {job_exp_min}–{job_exp_max} yr requirement")
    elif cand_exp < job_exp_min:
        gaps.append(f"Under-experienced by {round(job_exp_min - cand_exp, 1)} year(s)")

    if sal_ratio >= 0.9:
        strengths.append("Salary expectation within budget")
    elif sal_ratio < 0.6:
        gaps.append("Salary expectation exceeds the listed budget")

    if notice_ratio >= 0.9:
        strengths.append("Immediate / short notice — can join quickly")
    elif notice_ratio <= 0.4:
        gaps.append(f"Long notice period ({notice}) may delay joining")

    summary = (
        f"{resume.get('name', 'Candidate')} is a {verdict.lower()} for {job.get('title', 'this role')} "
        f"at {job.get('client_name', 'the client')}. "
        f"Skill coverage is {round(skill_ratio*100)}% with {cand_exp} years of experience. "
        f"{'Consider fast-tracking.' if overall_pct >= 70 else 'Further screening recommended.'}"
    )

    return {
        # ── Fields the frontend ScoreDialog reads ─────────────────────────
        "overall_score":    overall_pct,
        "verdict":          verdict,           # "Strong match" / "Good match" / etc.
        "skills_score":     round(skill_ratio  * 100),
        "experience_score": round(exp_ratio    * 100),
        "salary_score":     round(sal_ratio    * 100),
        "notice_score":     round(notice_ratio * 100),
        "location_score":   round(loc_ratio    * 100),
        "strengths":        strengths,
        "gaps":             gaps,
        "summary":          summary,
        # ── Extra metadata ─────────────────────────────────────────────────
        "matched_skills":   matched_skills,
        "missing_skills":   missing_skills,
        "scored_by":        "rule_engine",
        "scored_at":        datetime.utcnow().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  GEMINI SCORER  (with retry + 503 handling)
# ═══════════════════════════════════════════════════════════════════════════════

def _build_prompt(resume: dict, job: dict) -> str:
    skills_list = ", ".join(job.get("skills", [])) if isinstance(job.get("skills"), list) else str(job.get("skills", ""))
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
  "overall_score":     <integer 0-100>,
  "verdict":           "<one of: Strong match | Good match | Moderate match | Weak match>",
  "skills_score":      <integer 0-100>,
  "experience_score":  <integer 0-100>,
  "salary_score":      <integer 0-100>,
  "notice_score":      <integer 0-100>,
  "location_score":    <integer 0-100>,
  "gaps":              ["<gap 1>", "<gap 2>"],
  "strengths":         ["<strength 1>", "<strength 2>"],
  "summary":           "<2-3 sentence recruiter summary>",
  "scored_by":         "gemini"
}}

Scoring rules:
- skills_score: % of required skills the candidate has (exact + adjacent matches)
- experience_score: 100 if within range, reduce 10pt per year outside range
- salary_score: 100 if expected <= max budget, reduce proportionally if over
- notice_score: 100=Immediate, 85=15days, 70=30days, 50=60days, 30=90days
- location_score: 100 if same city, 80 if same state, 60 if remote-friendly, 40 otherwise
- overall_score: weighted average (skills 40%, experience 25%, salary 15%, notice 10%, location 10%)
- gaps: list of specific missing skills or mismatches (max 5 items)
- strengths: list of candidate's strong points relevant to this job (max 3 items)
- verdict must be EXACTLY one of: "Strong match", "Good match", "Moderate match", "Weak match"
""".strip()


def _gemini_score(resume: dict, job: dict, max_retries: int = 2) -> dict | None:
    """
    Call Gemini and parse the result.
    Returns parsed dict on success, None on any failure (triggers fallback).
    """
    if not GEMINI_KEY:
        return None

    prompt = _build_prompt(resume, job)

    for attempt in range(max_retries + 1):
        try:
            resp = http.post(
                f"{GEMINI_URL}?key={GEMINI_KEY}",
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=45,
            )

            # Retryable errors: 503 Service Unavailable, 429 Rate Limit
            if resp.status_code in (503, 429, 502):
                if attempt < max_retries:
                    wait = (attempt + 1) * 3   # 3s, 6s
                    print(f"[SCORE] Gemini {resp.status_code} — retry {attempt+1}/{max_retries} in {wait}s")
                    time.sleep(wait)
                    continue
                else:
                    print(f"[SCORE] Gemini {resp.status_code} after {max_retries} retries — using fallback")
                    return None

            if not resp.ok:
                print(f"[SCORE] Gemini error {resp.status_code}: {resp.text[:200]}")
                return None

            raw_text = _extract_gemini_text(resp.json())
            result   = json.loads(
                raw_text.replace("```json", "").replace("```", "").strip()
            )
            result["scored_by"] = "gemini"
            return result

        except json.JSONDecodeError as e:
            print(f"[SCORE] Gemini returned non-JSON: {e}")
            return None
        except Exception as e:
            print(f"[SCORE] Gemini attempt {attempt+1} failed: {e}")
            if attempt < max_retries:
                time.sleep((attempt + 1) * 2)
                continue
            return None

    return None


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@score_bp.route("/candidate", methods=["GET"])
@jwt_required()
def get_score():
    """
    GET /api/score/candidate?resume_id=<id>&job_id=<id>
    Accepts both MongoDB ObjectIds and string IDs (e.g. RES001 / JOB-001).
    Fetch the most recent saved score for a candidate+job pair.
    """
    resume_id = request.args.get("resume_id", "").strip()
    job_id    = request.args.get("job_id",    "").strip()

    if not resume_id or not job_id:
        return jsonify(success=False, message="'resume_id' and 'job_id' are required"), 400

    # Resolve to actual documents so we have all ID variants
    resume = _resolve_resume(resume_id)
    job    = _resolve_job(job_id)

    # Collect every possible resume identifier
    r_ids = {resume_id}
    if resume:
        r_ids.add(str(resume["_id"]))
        if resume.get("resume_id"):
            r_ids.add(resume["resume_id"])

    # Collect every possible job identifier
    j_ids = {job_id}
    if job:
        j_ids.add(str(job["_id"]))
        if job.get("job_id"):
            j_ids.add(job["job_id"])

    # Flat $or — any matching combo of (resume ref, job ref)
    query = {"$or": []}
    for r in r_ids:
        for j in j_ids:
            query["$or"].append({"resume_id": r,       "job_id": j})
            query["$or"].append({"resume_id": r,       "job_mongo_id": j})
            query["$or"].append({"resume_mongo_id": r, "job_id": j})
            query["$or"].append({"resume_mongo_id": r, "job_mongo_id": j})

    doc = mongo.db.match_scores.find_one(query, sort=[("created_at", -1)])

    if not doc:
        return jsonify(success=False, message="No score found for this candidate–job pair"), 404

    doc["_id"] = str(doc["_id"])
    for f in ("created_at", "updated_at", "scored_at"):
        if isinstance(doc.get(f), datetime):
            doc[f] = doc[f].isoformat()
    return jsonify(success=True, data=doc), 200


@score_bp.route("/candidate", methods=["POST"])
@jwt_required()
def score_candidate():
    """
    POST /api/score/candidate
    Body: { "resume_id": "...", "job_id": "..." }

    Computes a match score using Gemini (with retry) or rule-based fallback.
    Saves the result to mongo.db.match_scores and returns it.
    """
    data      = request.get_json(silent=True) or {}
    resume_id = (data.get("resume_id") or "").strip()
    job_id    = (data.get("job_id")    or "").strip()

    if not resume_id or not job_id:
        return jsonify(success=False, message="'resume_id' and 'job_id' are required"), 400

    # ── Resolve documents ──────────────────────────────────────────────────────
    resume = _resolve_resume(resume_id)
    if not resume:
        return jsonify(success=False, message=f"Candidate not found: {resume_id}"), 404

    job = _resolve_job(job_id)
    if not job:
        return jsonify(success=False, message=f"Job not found: {job_id}"), 404

    # ── Score: Gemini first, fallback to rule engine ───────────────────────────
    result = _gemini_score(resume, job)

    if result is None:
        print("[SCORE] Using rule-based fallback scorer")
        result = _rule_based_score(resume, job)

    # ── Persist to DB ──────────────────────────────────────────────────────────
    now = datetime.utcnow()
    score_doc = {
        "resume_id":       resume.get("resume_id", resume_id),
        "resume_mongo_id": str(resume["_id"]),
        "candidate_name":  resume.get("name", ""),
        "job_id":          job.get("job_id", job_id),
        "job_mongo_id":    str(job["_id"]),
        "job_title":       job.get("title", ""),
        "client_name":     job.get("client_name", ""),
        **result,
        "scored_at":  now,   # ← frontend reads this for "Scored X" timestamp
        "created_at": now,
        "updated_at": now,
    }

    # Upsert — update if score already exists for this pair
    mongo.db.match_scores.update_one(
        {
            "resume_id": score_doc["resume_id"],
            "job_id":    score_doc["job_id"],
        },
        {"$set": score_doc},
        upsert=True,
    )

    saved = mongo.db.match_scores.find_one({
        "resume_id": score_doc["resume_id"],
        "job_id":    score_doc["job_id"],
    })
    saved["_id"] = str(saved["_id"])
    for f in ("created_at", "updated_at", "scored_at"):
        if isinstance(saved.get(f), datetime):
            saved[f] = saved[f].isoformat()

    return jsonify(
        success   = True,
        message   = "Score computed successfully",
        scored_by = result.get("scored_by", "unknown"),
        data      = saved,
    ), 201


@score_bp.route("/candidate/bulk", methods=["POST"])
@jwt_required()
def bulk_score():
    """
    POST /api/score/candidate/bulk
    Body: { "job_id": "...", "resume_ids": ["RES001", "RES002", ...] }

    Scores multiple candidates against one job.
    Falls back to rule engine per-candidate if Gemini is down.
    """
    data       = request.get_json(silent=True) or {}
    job_id     = (data.get("job_id") or "").strip()
    resume_ids = data.get("resume_ids", [])

    if not job_id:
        return jsonify(success=False, message="'job_id' is required"), 400
    if not resume_ids or not isinstance(resume_ids, list):
        return jsonify(success=False, message="'resume_ids' must be a non-empty list"), 400

    job = _resolve_job(job_id)
    if not job:
        return jsonify(success=False, message=f"Job not found: {job_id}"), 404

    results  = []
    errors   = []

    for rid in resume_ids[:50]:   # cap at 50 to avoid abuse
        resume = _resolve_resume(str(rid).strip())
        if not resume:
            errors.append({"resume_id": rid, "error": "Not found"})
            continue

        result = _gemini_score(resume, job)
        if result is None:
            result = _rule_based_score(resume, job)

        now = datetime.utcnow()
        score_doc = {
            "resume_id":       resume.get("resume_id", rid),
            "resume_mongo_id": str(resume["_id"]),
            "candidate_name":  resume.get("name", ""),
            "job_id":          job.get("job_id", job_id),
            "job_mongo_id":    str(job["_id"]),
            "job_title":       job.get("title", ""),
            "client_name":     job.get("client_name", ""),
            **result,
            "created_at": now,
            "updated_at": now,
        }
        mongo.db.match_scores.update_one(
            {"resume_id": score_doc["resume_id"], "job_id": score_doc["job_id"]},
            {"$set": score_doc},
            upsert=True,
        )
        score_doc["_id"]        = str(score_doc.get("_id", ""))
        score_doc["created_at"] = now.isoformat()
        score_doc["updated_at"] = now.isoformat()
        results.append(score_doc)

    return jsonify(
        success  = True,
        scored   = len(results),
        errors   = errors,
        data     = sorted(results, key=lambda x: x.get("overall_score", 0), reverse=True),
    ), 200


@score_bp.route("/job/<job_id>", methods=["GET"])
@jwt_required()
def get_scores_for_job(job_id):
    """
    GET /api/score/job/<job_id>
    Returns all saved scores for a given job, sorted by overall_score desc.
    """
    job = _resolve_job(job_id.strip())
    if not job:
        return jsonify(success=False, message=f"Job not found: {job_id}"), 404

    real_job_id = job.get("job_id", job_id)
    docs = list(
        mongo.db.match_scores.find(
            {"$or": [{"job_id": real_job_id}, {"job_mongo_id": str(job["_id"])}]}
        ).sort("overall_score", -1)
    )
    for d in docs:
        d["_id"] = str(d["_id"])
        for f in ("created_at", "updated_at"):
            if isinstance(d.get(f), datetime):
                d[f] = d[f].isoformat()

    return jsonify(success=True, data=docs, total=len(docs)), 200


@score_bp.route("/resume/<resume_id>", methods=["GET"])
@jwt_required()
def get_scores_for_resume(resume_id):
    """
    GET /api/score/resume/<resume_id>
    Returns all saved scores for a given candidate across all jobs.
    """
    resume = _resolve_resume(resume_id.strip())
    if not resume:
        return jsonify(success=False, message=f"Candidate not found: {resume_id}"), 404

    real_resume_id = resume.get("resume_id", resume_id)
    docs = list(
        mongo.db.match_scores.find(
            {"$or": [{"resume_id": real_resume_id}, {"resume_mongo_id": str(resume["_id"])}]}
        ).sort("overall_score", -1)
    )
    for d in docs:
        d["_id"] = str(d["_id"])
        for f in ("created_at", "updated_at"):
            if isinstance(d.get(f), datetime):
                d[f] = d[f].isoformat()

    return jsonify(success=True, data=docs, total=len(docs)), 200