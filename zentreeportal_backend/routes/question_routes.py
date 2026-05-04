from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import os, json, difflib
import requests as http
from extensions import mongo

question_bp = Blueprint("questions", __name__)


#  HELPERS

def _extract_gemini_text(response_json: dict) -> str:
    """Extract final answer text from Gemini response (thinking-model safe)."""
    try:
        parts = response_json["candidates"][0]["content"]["parts"]
        text_parts = [p["text"] for p in parts if p.get("text", "").strip()]
        if not text_parts:
            raise ValueError("No text content in Gemini response")
        return text_parts[-1]
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected Gemini response structure: {e}") from e


def _experience_level(exp_min: int, exp_max: int) -> tuple:
    """
    Maps experience range to a level label + interviewer guidance string.
    Returns (level_label, guidance_string).
    """
    avg = (exp_min + exp_max) / 2
    if avg <= 2:
        return (
            "Junior",
            "Focus on fundamentals, basic concepts, and simple implementations. "
            "Avoid advanced system design. Test core language knowledge and basic algorithms.",
        )
    elif avg <= 5:
        return (
            "Mid-level",
            "Balance conceptual depth with practical problem-solving. "
            "Include some system design basics, design patterns, and real-world debugging scenarios.",
        )
    elif avg <= 9:
        return (
            "Senior",
            "Emphasise architecture decisions, trade-offs, performance optimisation, "
            "and team leadership / mentoring scenarios. Include complex system design.",
        )
    else:
        return (
            "Lead / Principal",
            "Focus on system design at scale, org-wide technical decisions, "
            "cross-team collaboration, strategic planning, and mentoring culture.",
        )


def _difficulty_distribution(level: str) -> str:
    """Returns difficulty mix string for the Gemini prompt."""
    return {
        "Junior":           "60% Easy, 30% Medium, 10% Hard",
        "Mid-level":        "20% Easy, 55% Medium, 25% Hard",
        "Senior":           "10% Easy, 40% Medium, 50% Hard",
        "Lead / Principal": "5%  Easy, 30% Medium, 65% Hard",
    }.get(level, "20% Easy, 50% Medium, 30% Hard")


def _is_duplicate(new_q: str, existing_qs: list, threshold: float = 0.80) -> bool:
    """
    Returns True if new_q is >= threshold similar to any question in existing_qs.
    Uses difflib.SequenceMatcher — 0.80 = 80% similarity.

    Example:
        _is_duplicate("What is polymorphism?", ["Explain polymorphism in OOP"])
        → True  (very similar concept, high overlap)
    """
    new_q_lower = new_q.lower().strip()
    for eq in existing_qs:
        ratio = difflib.SequenceMatcher(None, new_q_lower, eq.lower().strip()).ratio()
        if ratio >= threshold:
            return True
    return False


def _dedup(new_items: list, existing_items: list, key: str = "question") -> tuple:
    """
    Filters new_items, removing any whose `key` field is a duplicate of existing_items.
    Also deduplicates within new_items themselves (prevents self-duplicates in one batch).

    Returns:
        (unique_new_items, duplicate_count)
    """
    existing_texts = [q.get(key, "") for q in existing_items]
    unique, dup_count = [], 0

    for item in new_items:
        text = item.get(key, "")
        if _is_duplicate(text, existing_texts):
            dup_count += 1
        else:
            unique.append(item)
            existing_texts.append(text)   # prevent self-duplication in same batch

    return unique, dup_count


def _find_job(jid: str):
    """
    Loads a job by MongoDB ObjectId string.
    Returns (job_doc, error_response) — one of them will be None.
    """
    try:
        oid = ObjectId(jid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid job ID"), 400)

    job = mongo.db.jobs.find_one({"_id": oid})
    if not job:
        return None, (jsonify(success=False, message="Job not found"), 404)

    return job, None


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

# ── Generate questions for a job ──────────────────────────────────────────────
@question_bp.route("/jobs/<jid>/generate", methods=["POST"])
@jwt_required()
def generate_questions(jid):
    """
    POST /api/questions/jobs/<jid>/generate
    Body:
    {
        "mcq_count":         10,
        "subjective_count":   5,
        "coding_count":       3,
        "replace_existing": false
    }
    """
    # ── 1. Load job ───────────────────────────────────────────────────────────
    job, err = _find_job(jid)
    if err:
        return err

    # ── 2. Parse & validate request config ───────────────────────────────────
    data             = request.get_json(silent=True) or {}
    mcq_count        = max(0, min(30, int(data.get("mcq_count",        10))))
    subjective_count = max(0, min(20, int(data.get("subjective_count",  5))))
    coding_count     = max(0, min(10, int(data.get("coding_count",      3))))
    replace_existing = bool(data.get("replace_existing", False))

    if mcq_count + subjective_count + coding_count == 0:
        return jsonify(success=False, message="At least one question count must be > 0"), 400

    # ── 3. Extract job context ────────────────────────────────────────────────
    jd_text   = (job.get("description") or "").strip()
    job_title = job.get("title", "")
    skills    = job.get("skills")    or []
    prog_lang = job.get("programming_language") or "Python"
    exp_min   = int(job.get("experience_min") or 0)
    exp_max   = int(job.get("experience_max") or 5)

    if not jd_text:
        return jsonify(
            success=False,
            message="Job has no description — add a description first for better quality questions"
        ), 400

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return jsonify(success=False, message="GEMINI_API_KEY not configured on server"), 500

    # ── 4. Experience-aware config ────────────────────────────────────────────
    exp_level, exp_guidance = _experience_level(exp_min, exp_max)
    custom_dist = data.get("difficulty_distribution", "").strip()
    difficulty_dist = custom_dist if custom_dist else _difficulty_distribution(exp_level)
    skills_str              = ", ".join(skills) if skills else "skills mentioned in the JD"

    # ── 5. Build Gemini prompt ────────────────────────────────────────────────
    prompt = f"""
You are a senior technical interviewer creating a screening question bank.

=== ROLE CONTEXT ===
Job Title        : {job_title}
Experience Band  : {exp_min}–{exp_max} years ({exp_level})
Experience Focus : {exp_guidance}
Required Skills  : {skills_str}
Primary Language : {prog_lang}
Difficulty Mix   : {difficulty_dist}

=== JOB DESCRIPTION ===
{jd_text}

=== TASK ===
Generate EXACTLY:
  - {mcq_count} MCQ questions
  - {subjective_count} subjective / open-ended questions
  - {coding_count} coding challenge questions

These questions are for a {exp_level} candidate with {exp_min}–{exp_max} years experience.
{exp_guidance}

Return ONLY valid JSON. No markdown. No backticks. No extra text.

{{
  "mcq_questions": [
    {{
      "question":        "Question text ending with ?",
      "options":         ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer":  ["exact text of the correct option"],
      "topic":           "concept or skill being tested",
      "difficulty":      "Easy|Medium|Hard"
    }}
  ],
  "subjective_questions": [
    {{
      "question":         "Open-ended question text?",
      "reference_answer": "Comprehensive model answer covering key aspects...",
      "key_points":       "• Point 1\\n• Point 2\\n• Point 3",
      "skill":            "specific skill being tested",
      "difficulty":       "Easy|Medium|Hard"
    }}
  ],
  "coding_questions": [
    {{
      "programming_language": "{prog_lang}",
      "question":   "Problem title\\n\\nProblem statement...\\n\\nInput: description\\nOutput: description\\n\\nExample:\\nInput: example\\nOutput: example\\n\\nConstraints:\\n- constraint 1",
      "difficulty": "Easy|Medium|Hard",
      "topic":      "algorithmic concept tested"
    }}
  ]
}}

Rules:
- Difficulty distribution MUST follow: {difficulty_dist}
- MCQ: exactly 4 distinct options; correct_answer must exactly match one option's text
- MCQ topics must spread across all listed skills — do not cluster on one skill
- Subjective: use open-ended STAR-friendly phrasing ("Describe a time…", "How would you…")
- Coding: self-contained problem with clear examples; complexity calibrated for {exp_level}
- Every question must be unique and directly relevant to the job role
- Do NOT repeat similar concepts across questions in the same batch
"""

    # ── 6. Call Gemini ────────────────────────────────────────────────────────
    try:
        resp = http.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=90,
        )
        resp.raise_for_status()
        raw_text  = _extract_gemini_text(resp.json())
        generated = json.loads(raw_text.replace("```json", "").replace("```", "").strip())

    except json.JSONDecodeError:
        return jsonify(success=False, message="AI returned invalid JSON — please retry"), 422
    except Exception as e:
        return jsonify(success=False, message=f"Gemini API error: {str(e)}"), 500

    # ── 7. Extract generated lists ────────────────────────────────────────────
    new_mcq  = generated.get("mcq_questions",        []) or []
    new_subj = generated.get("subjective_questions",  []) or []
    new_code = generated.get("coding_questions",      []) or []

    for lst in (new_mcq, new_subj, new_code):
        if not isinstance(lst, list):
            lst = []

    # ── 8. Deduplication against existing bank ────────────────────────────────
    if replace_existing:
        existing_mcq  = []
        existing_subj = []
        existing_code = []
    else:
        existing_mcq  = job.get("mcq_questions",        []) or []
        existing_subj = job.get("subjective_questions",  []) or []
        existing_code = job.get("coding_questions",      []) or []

    unique_mcq,  dup_mcq  = _dedup(new_mcq,  existing_mcq)
    unique_subj, dup_subj = _dedup(new_subj, existing_subj)
    unique_code, dup_code = _dedup(new_code, existing_code, key="question")

    total_dups = dup_mcq + dup_subj + dup_code

    # ── 9. Build final merged question banks ──────────────────────────────────
    if replace_existing:
        final_mcq  = unique_mcq
        final_subj = unique_subj
        final_code = unique_code
    else:
        final_mcq  = existing_mcq  + unique_mcq
        final_subj = existing_subj + unique_subj
        final_code = existing_code + unique_code

    # ── 10. Generation history entry ──────────────────────────────────────────
    history_entry = {
        "generated_at":       datetime.utcnow().isoformat(),
        "exp_level":          exp_level,
        "mcq_requested":      mcq_count,
        "subj_requested":     subjective_count,
        "coding_requested":   coding_count,
        "mcq_added":          len(unique_mcq),
        "subj_added":         len(unique_subj),
        "coding_added":       len(unique_code),
        "duplicates_skipped": total_dups,
        "replace_existing":   replace_existing,
        "difficulty_distribution": difficulty_dist,  
        "custom_difficulty":       bool(custom_dist), 
    }
    existing_history = job.get("generation_history", []) or []

    # ── 11. Persist to DB ─────────────────────────────────────────────────────
    mongo.db.jobs.update_one(
        {"_id": job["_id"]},
        {"$set": {
            "mcq_questions":              final_mcq,
            "subjective_questions":       final_subj,
            "coding_questions":           final_code,
            "mcq_questions_count":        len(final_mcq),
            "subjective_questions_count": len(final_subj),
            "coding_questions_count":     len(final_code),
            "questions_generated_at":     datetime.utcnow(),
            "generation_history":         existing_history + [history_entry],
            "updated_at":                 datetime.utcnow(),
        }}
    )

    return jsonify(
        success=True,
        message=(
            f"Added {len(unique_mcq)} MCQ, {len(unique_subj)} subjective, "
            f"{len(unique_code)} coding. Skipped {total_dups} duplicate(s)."
        ),
        data={
            "mcq_questions":        unique_mcq,
            "subjective_questions": unique_subj,
            "coding_questions":     unique_code,
            "mcq_added":            len(unique_mcq),
            "subj_added":           len(unique_subj),
            "coding_added":         len(unique_code),
            "duplicates_skipped":   total_dups,
            "exp_level":            exp_level,
            "total_mcq_in_bank":    len(final_mcq),
            "total_subj_in_bank":   len(final_subj),
            "total_code_in_bank":   len(final_code),
            "generation_history":   existing_history + [history_entry],
        }
    ), 200


# ── Get all questions for a job ───────────────────────────────────────────────

@question_bp.route("/jobs/<jid>", methods=["GET"])
@jwt_required()
def get_questions(jid):
    job, err = _find_job(jid)
    if err:
        return err

    show_all = request.args.get("show_all", "false").lower() == "true"

    mcq  = job.get("mcq_questions",        []) or []
    subj = job.get("subjective_questions",  []) or []
    code = job.get("coding_questions",      []) or []

    if not show_all:
        mcq  = [q for q in mcq  if q.get("is_active", True)]
        subj = [q for q in subj if q.get("is_active", True)]
        code = [q for q in code if q.get("is_active", True)]

    return jsonify(
        success=True,
        data={
            "mcq_questions":              mcq,
            "subjective_questions":       subj,
            "coding_questions":           code,
            "mcq_questions_count":        len([q for q in (job.get("mcq_questions") or []) if q.get("is_active", True)]),
            "subjective_questions_count": len([q for q in (job.get("subjective_questions") or []) if q.get("is_active", True)]),
            "coding_questions_count":     len([q for q in (job.get("coding_questions") or []) if q.get("is_active", True)]),
            "mcq_total":                  len(job.get("mcq_questions",        []) or []),
            "subj_total":                 len(job.get("subjective_questions",  []) or []),
            "code_total":                 len(job.get("coding_questions",      []) or []),
            "questions_generated_at":     job.get("questions_generated_at", ""),
            "generation_history":         job.get("generation_history",    []),
            "show_all":                   show_all,
        }
    ), 200
    
    
# ── Clear all questions for a job ─────────────────────────────────────────────
@question_bp.route("/jobs/<jid>/clear", methods=["DELETE"])
@jwt_required()
def clear_questions(jid):
    """
    DELETE /api/questions/jobs/<jid>/clear
    Wipes the entire question bank for a job.
    """
    job, err = _find_job(jid)
    if err:
        return err

    mongo.db.jobs.update_one(
        {"_id": job["_id"]},
        {"$set": {
            "mcq_questions":              [],
            "subjective_questions":       [],
            "coding_questions":           [],
            "mcq_questions_count":        0,
            "subjective_questions_count": 0,
            "coding_questions_count":     0,
            "updated_at":                 datetime.utcnow(),
        }}
    )
    return jsonify(success=True, message="All questions cleared"), 200


# ── Delete a single question ──────────────────────────────────────────────────
@question_bp.route("/jobs/<jid>/<q_type>/<int:index>", methods=["DELETE"])
@jwt_required()
def delete_question(jid, q_type, index):
    """
    DELETE /api/questions/jobs/<jid>/<q_type>/<index>
    q_type: mcq | subjective | coding
    index : 0-based position in the array

    Example: DELETE /api/questions/jobs/abc123/mcq/2
             → removes the 3rd MCQ question
    """
    job, err = _find_job(jid)
    if err:
        return err

    field_map = {
        "mcq":        ("mcq_questions",        "mcq_questions_count"),
        "subjective": ("subjective_questions",  "subjective_questions_count"),
        "coding":     ("coding_questions",      "coding_questions_count"),
    }
    if q_type not in field_map:
        return jsonify(success=False, message="q_type must be one of: mcq, subjective, coding"), 400

    field, count_field = field_map[q_type]
    questions = list(job.get(field, []) or [])

    if index < 0 or index >= len(questions):
        return jsonify(success=False, message=f"Index {index} out of range (bank has {len(questions)} questions)"), 400

    questions.pop(index)

    mongo.db.jobs.update_one(
        {"_id": job["_id"]},
        {"$set": {
            field:       questions,
            count_field: len(questions),
            "updated_at": datetime.utcnow(),
        }}
    )
    return jsonify(success=True, message=f"Question deleted. {len(questions)} remaining."), 200


# ── Generation history for a job ──────────────────────────────────────────────
@question_bp.route("/jobs/<jid>/history", methods=["GET"])
@jwt_required()
def get_generation_history(jid):
    """
    GET /api/questions/jobs/<jid>/history
    Returns just the generation_history log for a job.
    """
    job, err = _find_job(jid)
    if err:
        return err

    return jsonify(
        success=True,
        data=job.get("generation_history", [])
    ), 200
    
    
# ── Add questions manually ────────────────────────────────────────────────────
@question_bp.route("/jobs/<jid>/manual", methods=["POST"])
@jwt_required()
def add_manual_questions(jid):
    """
    POST /api/questions/jobs/<jid>/manual
    Body:
    {
        "type": "mcq" | "subjective" | "coding",
        "question": { ...question object... }
    }
    """
    job, err = _find_job(jid)
    if err:
        return err

    data  = request.get_json(silent=True) or {}
    qtype = data.get("type", "")
    q     = data.get("question", {})

    if qtype not in ("mcq", "subjective", "coding"):
        return jsonify(success=False, message="type must be mcq, subjective, or coding"), 400
    if not q.get("question", "").strip():
        return jsonify(success=False, message="question text is required"), 400

    field_map = {
        "mcq":        ("mcq_questions",        "mcq_questions_count"),
        "subjective": ("subjective_questions",  "subjective_questions_count"),
        "coding":     ("coding_questions",      "coding_questions_count"),
    }
    field, count_field = field_map[qtype]
    existing = list(job.get(field, []) or [])

    # Duplicate check
    if _is_duplicate(q["question"], [e.get("question", "") for e in existing]):
        return jsonify(success=False, message="A similar question already exists in the bank"), 409

    existing.append(q)
    mongo.db.jobs.update_one(
        {"_id": job["_id"]},
        {"$set": {
            field:        existing,
            count_field:  len(existing),
            "updated_at": datetime.utcnow(),
        }}
    )
    return jsonify(
        success=True,
        message=f"Question added. Bank now has {len(existing)} {qtype} questions.",
        data={"total": len(existing)}
    ), 201
    
    
    
# ── Toggle question active/inactive ──────────────────────────────────────────
@question_bp.route("/jobs/<jid>/<q_type>/<int:index>/toggle", methods=["PUT"])
@jwt_required()
def toggle_question_active(jid, q_type, index):
    """
    PUT /api/questions/jobs/<jid>/<q_type>/<index>/toggle
    Toggles is_active field on a question (default True if missing).
    """
    job, err = _find_job(jid)
    if err:
        return err

    field_map = {
        "mcq":        ("mcq_questions",        "mcq_questions_count"),
        "subjective": ("subjective_questions",  "subjective_questions_count"),
        "coding":     ("coding_questions",      "coding_questions_count"),
    }
    if q_type not in field_map:
        return jsonify(success=False, message="q_type must be mcq, subjective, or coding"), 400

    field, count_field = field_map[q_type]
    questions = list(job.get(field, []) or [])

    if index < 0 or index >= len(questions):
        return jsonify(success=False, 
                      message=f"Index {index} out of range"), 400

    # Toggle: if currently active (or missing), set inactive; else set active
    current = questions[index].get("is_active", True)
    questions[index]["is_active"] = not current

    # Recount only active questions
    active_count = sum(1 for q in questions if q.get("is_active", True))

    mongo.db.jobs.update_one(
        {"_id": job["_id"]},
        {"$set": {
            field:        questions,
            count_field:  active_count,
            "updated_at": datetime.utcnow(),
        }}
    )
    new_state = questions[index]["is_active"]
    return jsonify(
        success=True,
        message=f"Question {'activated' if new_state else 'deactivated'}.",
        data={
            "is_active":    new_state,
            "active_count": active_count,
            "total":        len(questions),
        }
    ), 200


# ── Update active counts for all question types (maintenance) ─────────────────
@question_bp.route("/jobs/<jid>/sync-counts", methods=["POST"])
@jwt_required()
def sync_counts(jid):
    """Recalculates active counts — useful after bulk operations."""
    job, err = _find_job(jid)
    if err:
        return err

    mcq   = job.get("mcq_questions",        []) or []
    subj  = job.get("subjective_questions",  []) or []
    code  = job.get("coding_questions",      []) or []

    mongo.db.jobs.update_one(
        {"_id": job["_id"]},
        {"$set": {
            "mcq_questions_count":        sum(1 for q in mcq  if q.get("is_active", True)),
            "subjective_questions_count": sum(1 for q in subj if q.get("is_active", True)),
            "coding_questions_count":     sum(1 for q in code if q.get("is_active", True)),
            "updated_at": datetime.utcnow(),
        }}
    )
    return jsonify(success=True, message="Counts synced"), 200