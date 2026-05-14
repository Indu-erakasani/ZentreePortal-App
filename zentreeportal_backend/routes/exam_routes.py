
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
import os, uuid, random, smtplib, time, json
import requests as http_requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from extensions import mongo
import gridfs
import base64
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

exam_bp = Blueprint("exams", __name__)

# ── Language map for Judge0 ───────────────────────────────────────────────────
JUDGE0_LANGUAGES = {
    "Python":     71,
    "Python 3":   71,
    "JavaScript": 63,
    "Java":       62,
    "C++":        54,
    "C":          50,
    "Go":         60,
    "Ruby":       72,
    "TypeScript": 74,
    "Rust":       73,
    "Kotlin":     78,
    "Swift":      83,
}

# ── API Keys & URLs ───────────────────────────────────────────────────────────
GEMINI_KEY       = os.environ.get("GEMINI_API_KEY",   "")
GROQ_KEY         = os.environ.get("GROQ_API_KEY",     "")
GRADING_PROVIDER = os.environ.get("GRADING_PROVIDER", "groq")

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


# ═══════════════════════════════════════════════════════════════════════════════
#  GEMINI HELPER (fallback only)
# ═══════════════════════════════════════════════════════════════════════════════

def _extract_gemini_text(response_json: dict) -> str:
    try:
        parts = response_json["candidates"][0]["content"]["parts"]
        text_parts = [p["text"] for p in parts if p.get("text", "").strip()]
        if not text_parts:
            raise ValueError("No text content in Gemini response")
        return text_parts[-1]
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected Gemini response structure: {e}") from e


def _gemini_call(prompt: str, max_retries: int = 2) -> str:
    delays = [3, 8]
    for attempt in range(max_retries):
        try:
            resp = http_requests.post(
                f"{GEMINI_URL}?key={GEMINI_KEY}",
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=45,
            )
            if resp.status_code in (429, 503):
                if attempt < max_retries - 1:
                    time.sleep(delays[attempt])
                    continue
                resp.raise_for_status()
                logger.warning(f"[Gemini] Rate limit/service error (attempt {attempt+1}), retrying...")
            resp.raise_for_status()
            return _extract_gemini_text(resp.json())
        except http_requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                time.sleep(delays[attempt])
                continue
            raise ValueError("Gemini timed out")
    raise ValueError("Gemini failed after retries")
def _store_question_image(b64_image: str, job_id: str) -> str:
    """Store question image in GridFS, return file_id string."""
    try:
        image_data = base64.b64decode(b64_image)
        fs = gridfs.GridFS(mongo.db)
        file_id = fs.put(
            image_data,
            filename=f"qimg_{job_id}_{datetime.utcnow().timestamp()}.jpg",
            content_type="image/jpeg",
        )
        return str(file_id)
    except Exception as e:
        logger.error(f"[Question Image] Store failed: {e}")
        return None


def _normalize_option(text: str) -> str:
    """
    Strip leading option labels like 'A)', 'A.', 'a)', '(A)' and lowercase+strip.
    Ensures 'A. Polymorphism' matches 'Polymorphism' if stored that way.
    """
    import re
    text = text.strip()
    # Remove prefix like "A)", "A.", "(A)", "a)", "1.", "1)"
    text = re.sub(r'^[\(\s]*[A-Da-d1-4][\.\)\s]+', '', text).strip()
    return text.lower()



# ═══════════════════════════════════════════════════════════════════════════════
#  GROQ CALL (primary grading model)
# ═══════════════════════════════════════════════════════════════════════════════

def _groq_call(prompt: str, max_retries: int = 3) -> str:
    delays = [2, 4, 8]
    for attempt in range(max_retries):
        try:
            resp = http_requests.post(
                GROQ_URL,
                headers={
                    "Content-Type":  "application/json",
                    "Authorization": f"Bearer {GROQ_KEY}",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {
                            "role":    "system",
                            "content": (
                                "You are an expert technical interviewer and software engineer. "
                                "Always respond with valid JSON only. "
                                "No markdown. No backticks. No extra text before or after the JSON."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens":  1024,
                },
                timeout=40,
            )
            if resp.status_code == 429:
                if attempt < max_retries - 1:
                    time.sleep(delays[attempt])
                    continue
                resp.raise_for_status()
            if resp.status_code in (500, 502, 503):
                if attempt < max_retries - 1:
                    time.sleep(delays[attempt])
                    continue
                resp.raise_for_status()
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except http_requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                time.sleep(delays[attempt])
                continue
            raise ValueError("Groq timed out after retries")
        except KeyError as e:
            raise ValueError(f"Unexpected Groq response structure: {e}")
    raise ValueError("Groq failed after all retries")


# ═══════════════════════════════════════════════════════════════════════════════
#  UNIFIED GRADING CALL
# ═══════════════════════════════════════════════════════════════════════════════

def _call_grading_model(prompt: str) -> str:
    provider = GRADING_PROVIDER.lower()
    if provider == "groq" and GROQ_KEY:
        try:
            logger.info(f"[Grading] Using Groq ({GROQ_MODEL})")
            return _groq_call(prompt)
        except Exception as e:
            logger.warning(f"[Grading] Groq failed: {e} — falling back to Gemini")
    if GEMINI_KEY:
        logger.info("[Grading] Using Gemini (fallback)")
        return _gemini_call(prompt)
    raise ValueError(
        "No grading API key configured. "
        "Set GROQ_API_KEY in your .env file and restart the server."
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  AI GRADING — SUBJECTIVE
# ═══════════════════════════════════════════════════════════════════════════════
def _ai_grade_subjective(question: str, reference_answer: str,
                          key_points: str, candidate_answer: str) -> dict:
    if not candidate_answer.strip():
        return {
            "score": 0, "max_score": 10,
            "feedback": "No answer was provided.",
            "key_points_covered": [], "key_points_missed": [],
            "verdict": "No Answer"
        }

    prompt = f"""You are a strict technical interviewer grading a candidate's written answer.

QUESTION BEING EVALUATED:
{question}

REFERENCE ANSWER (internal — do not reveal to candidate):
{reference_answer or "Not provided"}

KEY POINTS THAT MUST BE COVERED FOR FULL MARKS:
{key_points or "Not provided"}

CANDIDATE'S ANSWER:
{candidate_answer}

STRICT GRADING RULES:
1. Grade ONLY based on how well the answer addresses THIS specific question.
2. If the answer is completely off-topic or does not address the question at all → score MUST be 0.
3. If the answer is vague or generic without any specific technical content → score MUST be 1-2.
4. Only award marks for content that is DIRECTLY relevant and TECHNICALLY CORRECT for this question.
5. Do NOT give benefit of the doubt. Missing a key point = score deduction.
6. An answer that is long but irrelevant still scores 0-2.

SCORING GUIDE (strict):
10 = All key points covered with accurate technical depth
8-9 = Most key points with good accuracy, minor gaps only
6-7 = Majority of key points, some gaps or inaccuracies
4-5 = Partial coverage, shows understanding but misses critical points
2-3 = Very limited, barely touches the topic
1   = Mentions topic name only, no substance
0   = Off-topic, empty, or completely wrong

Return ONLY this JSON (no markdown, no extra text):
{{
  "score": <integer 0-10>,
  "max_score": 10,
  "feedback": "<2-3 sentences of specific, direct feedback citing what was/wasn't addressed>",
  "key_points_covered": ["<point the candidate correctly addressed>"],
  "key_points_missed": ["<key point the candidate missed entirely>"],
  "verdict": "<Excellent|Good|Adequate|Poor|No Answer>"
}}"""

    try:
        raw   = _call_grading_model(prompt)
        clean = raw.replace("```json", "").replace("```", "").strip()
        if "{" in clean:
            clean = clean[clean.index("{"):clean.rindex("}") + 1]
        result = json.loads(clean)
        result["score"] = max(0, min(10, int(result.get("score", 0))))

        # Hard override: if key_points_covered is empty and score > 2, clamp it
        if not result.get("key_points_covered") and result.get("score", 0) > 2:
            result["score"] = min(result["score"], 2)
            result["feedback"] = (
                "The answer did not clearly address the required key points. "
                + result.get("feedback", "")
            )
        return result
    except json.JSONDecodeError:
        return {
            "score": 0, "max_score": 10,
            "feedback": "AI returned an invalid response format.",
            "key_points_covered": [], "key_points_missed": [],
            "verdict": "Error"
        }
    except Exception as e:
        return {
            "score": 0, "max_score": 10,
            "feedback": f"AI grading failed: {str(e)}",
            "key_points_covered": [], "key_points_missed": [],
            "verdict": "Error"
        }
        
        

#  AI GRADING — CODING
def _ai_grade_coding(question: str, language: str, code: str,
                      run_output: str, run_status: str) -> dict:
    if not code.strip():
        return {
            "score": 0, "max_score": 10,
            "feedback": "No code was submitted.",
            "language_correct": False, "code_quality": "Poor",
            "logic_correct": False, "edge_cases_handled": False,
            "verdict": "No Answer"
        }

    # Determine execution success for scoring context
    ran_successfully = run_status in (
        "Accepted", "Compilation Error" is False and run_output
    )
    has_output      = bool(run_output and run_output.strip())
    has_error       = "error" in (run_status or "").lower() or \
                      "error" in (run_output  or "").lower()

    prompt = f"""You are a senior software engineer doing a strict technical interview code review.

PROBLEM STATEMENT (this is the ONLY problem the candidate must solve):
{question}

REQUIRED PROGRAMMING LANGUAGE: {language}
(Any submission NOT in {language} automatically scores 0 — no exceptions)

CANDIDATE'S SUBMITTED CODE: {code}
EXECUTION RESULT:
- Status : {run_status or "Not executed"}
- Output : {run_output or "No output captured"}
- Has errors: {"Yes" if has_error else "No"}

STRICT GRADING RULES:
1. LANGUAGE CHECK FIRST: If code is not written in {language}, set score=0, language_correct=false, verdict="Wrong Language". Stop.
2. RELEVANCE CHECK: Does the code attempt to solve the stated problem? If it solves a completely different problem, score=0-1.
3. CORRECTNESS: Does the logic actually solve the problem correctly for all cases?
4. EXECUTION: If the code ran and produced wrong output, maximum score is 5 regardless of code quality.
5. ERRORS: Compilation/runtime errors reduce score significantly — maximum 4 if code doesn't run at all.
6. Do NOT reward clean-looking code that is logically wrong. Logic correctness outweighs style.

SCORING GUIDE:
10 = Correct solution, handles edge cases, clean code, runs perfectly
8-9 = Correct logic, minor issues (style, missed 1 edge case), runs correctly
6-7 = Mostly correct, small logical gap or handles only basic cases
4-5 = Partial — right approach but wrong output, OR runs but incorrect result
2-3 = Attempts the problem but fundamental logic is wrong
1   = Code exists but completely wrong approach
0   = Wrong language, empty, or solves a completely different problem

Return ONLY this JSON (no markdown):
{{
  "score": <integer 0-10>,
  "max_score": 10,
  "feedback": "<2-3 sentences citing specific issues: what the code does right/wrong, referencing the actual code logic>",
  "language_correct": <true|false>,
  "code_quality": "<Excellent|Good|Adequate|Poor>",
  "logic_correct": <true if core algorithm solves the problem>,
  "edge_cases_handled": <true if handles empty input, 0, negatives, boundaries etc>,
  "verdict": "<Excellent|Good|Adequate|Poor|No Answer|Wrong Language>"
}}"""

    try:
        raw   = _call_grading_model(prompt)
        clean = raw.replace("```json", "").replace("```", "").strip()
        if "{" in clean:
            clean = clean[clean.index("{"):clean.rindex("}") + 1]
        result = json.loads(clean)
        result["score"] = max(0, min(10, int(result.get("score", 0))))

        # Hard override: wrong language always 0
        if not result.get("language_correct", True):
            result["score"] = 0
            result["verdict"] = "Wrong Language"

        # Hard override: if execution shows errors and score > 4, clamp
        if has_error and not has_output and result.get("score", 0) > 4:
            result["score"] = min(result["score"], 4)
            result["feedback"] = (
                f"Code did not execute successfully ({run_status}). "
                + result.get("feedback", "")
            )

        return result
    except json.JSONDecodeError:
        return {
            "score": 0, "max_score": 10,
            "feedback": "AI returned an invalid response format.",
            "language_correct": True, "code_quality": "Poor",
            "logic_correct": False, "edge_cases_handled": False,
            "verdict": "Error"
        }
    except Exception as e:
        return {
            "score": 0, "max_score": 10,
            "feedback": f"AI grading failed: {str(e)}",
            "language_correct": True, "code_quality": "Poor",
            "logic_correct": False, "edge_cases_handled": False,
            "verdict": "Error"
        }
        
        
        


#  GENERAL HELPERS


def _next_exam_id() -> str:
    result = mongo.db.counters.find_one_and_update(
        {"_id": "exam_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return f"EXM{str(result['seq']).zfill(4)}"
def _next_notif_id() -> str:
    result = mongo.db.counters.find_one_and_update(
        {"_id": "notif_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return f"NTF{str(result['seq']).zfill(4)}"



def _serialize(doc: dict) -> dict:
    d = dict(doc)
    d["_id"] = str(d.get("_id", ""))
    for f in ("sent_at", "started_at", "submitted_at", "expires_at", "created_at", "updated_at"):
        if isinstance(d.get(f), datetime):
            d[f] = d[f].isoformat()
    return d


def _send_exam_email(to_email, candidate_name, job_title,
                     recruiter_name, company_name,
                     exam_link, time_limit, expires_at) -> bool:
    smtp_host  = os.environ.get("SMTP_SERVER",   "").strip().strip('"')
    smtp_port  = int(os.environ.get("SMTP_PORT", 587))
    smtp_user  = os.environ.get("SMTP_USERNAME", "").strip().strip('"')
    smtp_pass  = os.environ.get("SMTP_PASSWORD", "").strip().strip('"')
    from_email = os.environ.get("FROM_EMAIL",    "").strip().strip('"') or smtp_user

    if not smtp_host or not smtp_user:
        logger.warning(f"[EMAIL SKIPPED] No SMTP config — {to_email}: {exam_link}")
        return False

    msg            = MIMEMultipart("alternative")
    msg["Subject"] = f"Screening Exam Invitation — {job_title}"
    msg["From"]    = from_email
    msg["To"]      = to_email
    expires_str    = expires_at.strftime("%d %b %Y, %I:%M %p UTC")

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#1a237e,#0277bd);padding:30px;
                  border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">Screening Exam Invitation</h1>
        <p style="color:#90caf9;margin:8px 0 0">{company_name or 'Recruitment Team'}</p>
      </div>
      <div style="background:#f8f9fa;padding:30px;border:1px solid #e0e0e0;border-top:none">
        <p style="font-size:16px;color:#333">Dear <strong>{candidate_name}</strong>,</p>
        <p style="color:#555;line-height:1.6">
          You have been invited by <strong>{recruiter_name}</strong> to complete a
          screening exam for the position of <strong>{job_title}</strong>.
        </p>
        <div style="background:#fff3e0;border-left:4px solid #f57c00;padding:15px;
                    margin:20px 0;border-radius:4px">
          <p style="margin:0;color:#e65100;font-weight:bold">&#9201; Time Limit: {time_limit} minutes</p>
          <p style="margin:5px 0 0;color:#bf360c;font-size:13px">Exam expires: {expires_str}</p>
        </div>
        <div style="background:#e3f2fd;border-left:4px solid #1565c0;padding:15px;
                    margin:20px 0;border-radius:4px">
          <p style="margin:0;color:#0d47a1;font-weight:bold">📷 Camera Required</p>
          <p style="margin:5px 0 0;color:#1565c0;font-size:13px">
            This exam uses AI proctoring. Your webcam must be enabled and your face visible throughout.
          </p>
        </div>
        <div style="text-align:center;margin:30px 0">
          <a href="{exam_link}" style="background:#1a237e;color:#fff;padding:15px 40px;
             border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;
             display:inline-block">Start Exam</a>
        </div>
        <p style="color:#777;font-size:13px;border-top:1px solid #e0e0e0;padding-top:15px">
          If the button does not work, copy this link into your browser:<br>
          <a href="{exam_link}" style="color:#0277bd">{exam_link}</a>
        </p>
      </div>
    </div>"""
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        logger.info(f"[EMAIL SENT] {to_email}")
        return True
    except Exception as e:

        logger.error(f"[EMAIL ERROR] {e}")
        return False

def _build_proctoring_summary(events: list, snapshots: list) -> dict:
    """Compute integrity metrics from proctoring data."""
    alert_count    = sum(1 for e in events if e.get("type") == "alert")
    warning_count  = sum(1 for e in events if e.get("type") == "warning")
    flagged_snaps  = sum(1 for s in snapshots if s.get("flag") not in ("ok", None, ""))
    
    # ── NEW: detailed counts ───────────────────────────────────────────────────
    gaze_events    = sum(1 for e in events if "iris" in e.get("msg","").lower() 
                         or "looking away" in e.get("msg","").lower()
                         or "gaze" in e.get("msg","").lower())
    phone_events   = sum(1 for e in events if "phone" in e.get("msg","").lower())
    person_events  = sum(1 for e in events if "person" in e.get("msg","").lower()
                         or "background" in e.get("msg","").lower())
    tab_events     = sum(1 for e in events if "tab" in e.get("msg","").lower()
                         or "switch" in e.get("msg","").lower())
    voice_events   = sum(1 for e in events if "voice" in e.get("msg","").lower()
                         or "audio" in e.get("msg","").lower()
                         or "talking" in e.get("msg","").lower())

    # Suspicious findings for summary
    suspicious_findings = []
    if alert_count > 0:
        suspicious_findings.append(f"{alert_count} critical alert(s) detected")
    if gaze_events > 2:
        suspicious_findings.append(f"Candidate looked away from screen {gaze_events} times")
    if phone_events > 0:
        suspicious_findings.append(f"Phone detected {phone_events} time(s)")
    if person_events > 0:
        suspicious_findings.append(f"Another person detected {person_events} time(s)")
    if tab_events > 0:
        suspicious_findings.append(f"Tab/window switching detected {tab_events} time(s)")
    if voice_events > 3:
        suspicious_findings.append(f"Voice/talking detected {voice_events} times")

    return {
        "total_events":          len(events),
        "alert_count":           alert_count,
        "warning_count":         warning_count,
        "total_snapshots":       len(snapshots),
        "flagged_snapshots":     flagged_snaps,
        "gaze_away_events":      gaze_events,
        "phone_events":          phone_events,
        "background_person_events": person_events,
        "tab_switch_events":     tab_events,
        "voice_events":          voice_events,
        "suspicious_findings":   suspicious_findings,
        "integrity_score":       max(0, 100 - (alert_count * 15) - (warning_count * 5)),
    }

def _create_recruiter_notification(recruiter_id: str, exam_doc: dict):
    proctor_summary = exam_doc.get("proctoring_summary", {})
    notif = {
        "notification_id":   _next_notif_id(),
        "type":              "exam_submitted",
        "recipient_id":      recruiter_id,
        "title":             "Exam Submitted & Graded",
        "message": (
            f"{exam_doc.get('candidate_name')} completed the screening exam for "
            f"{exam_doc.get('job_title')} — Overall: {exam_doc.get('overall_score', '?')}% | "
            f"Integrity: {proctor_summary.get('integrity_score', 100)}%"
        ),
        "exam_id":           str(exam_doc.get("_id", "")),
        "exam_id_str":       exam_doc.get("exam_id", ""),
        "candidate_name":    exam_doc.get("candidate_name", ""),
        "candidate_email":   exam_doc.get("candidate_email", ""),
        "job_title":         exam_doc.get("job_title", ""),
        "mcq_score":         exam_doc.get("mcq_score", 0),
        "mcq_total":         exam_doc.get("mcq_count", 0),
        "overall_score":     exam_doc.get("overall_score", 0),
        "integrity_score":   proctor_summary.get("integrity_score", 100),
        "proctoring_alerts": proctor_summary.get("alert_count", 0),
        "is_read":           False,
        "created_at":        datetime.utcnow(),
    }
    mongo.db.notifications.insert_one(notif)


#  COMPILE CODE (proxy to Judge0 CE)

@exam_bp.route("/compile", methods=["POST"])
def compile_code():
    data     = request.get_json(silent=True) or {}
    code     = data.get("code", "")
    language = data.get("language", "Python")
    stdin    = data.get("stdin", "")
    lang_id  = JUDGE0_LANGUAGES.get(language, 71)

    if not code.strip():
        return jsonify(success=False, message="No code provided"), 400

    try:
        resp = http_requests.post(
            "https://ce.judge0.com/submissions",
            json={"source_code": code, "language_id": lang_id, "stdin": stdin},
            params={"base64_encoded": "false", "wait": "true"},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        r = resp.json()
        return jsonify(
            success=True,
            data={
                "stdout":         r.get("stdout")         or "",
                "stderr":         r.get("stderr")         or "",
                "compile_output": r.get("compile_output") or "",
                "status":         r.get("status", {}).get("description", "Unknown"),
                "status_id":      r.get("status", {}).get("id", 0),
                "time":           r.get("time"),
                "memory":         r.get("memory"),
            }
        ), 200
    except http_requests.exceptions.Timeout:
        return jsonify(success=False, message="Compiler timed out. Try again."), 504
    except Exception as e:
        return jsonify(success=False, message=f"Compiler error: {str(e)}"), 500


#  SEND EXAM

@exam_bp.route("/send", methods=["POST"])
@jwt_required()
def send_exam():
    identity = get_jwt_identity()
    data     = request.get_json(silent=True) or {}

    candidate_id    = data.get("candidate_id", "")
    job_id          = data.get("job_id", "")
    mcq_count       = max(0, int(data.get("mcq_count",        0)))
    subj_count      = max(0, int(data.get("subjective_count", 0)))
    coding_count    = max(0, int(data.get("coding_count",     0)))
    time_limit      = max(10, int(data.get("time_limit_minutes", 60)))
    expires_in_days = max(1,  int(data.get("expires_in_days",    3)))

    if not candidate_id or not job_id:
        return jsonify(success=False, message="candidate_id and job_id required"), 400

    try:
        candidate = mongo.db.candidate_processing.find_one({"_id": ObjectId(candidate_id)})
    except InvalidId:
        return jsonify(success=False, message="Invalid candidate ID"), 400
    if not candidate:
        return jsonify(success=False, message="Candidate not found"), 404
    if not candidate.get("email"):
        return jsonify(success=False, message="Candidate has no email address"), 400

    try:
        job = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
    except InvalidId:
        return jsonify(success=False, message="Invalid job ID"), 400
    if not job:
        return jsonify(success=False, message="Job not found"), 404

    # mcq_bank  = job.get("mcq_questions",       []) or []
    # subj_bank = job.get("subjective_questions", []) or []
    # code_bank = job.get("coding_questions",     []) or []
    # Only use active questions for exam
    mcq_bank  = [q for q in (job.get("mcq_questions",       []) or []) if q.get("is_active", True)]
    subj_bank = [q for q in (job.get("subjective_questions", []) or []) if q.get("is_active", True)]
    code_bank = [q for q in (job.get("coding_questions",     []) or []) if q.get("is_active", True)]
    
    
    
    if mcq_count    > len(mcq_bank):
        return jsonify(success=False, message=f"Not enough MCQ questions ({len(mcq_bank)} available)"), 400
    if subj_count   > len(subj_bank):
        return jsonify(success=False, message=f"Not enough subjective questions ({len(subj_bank)} available)"), 400
    if coding_count > len(code_bank):
        return jsonify(success=False, message=f"Not enough coding questions ({len(code_bank)} available)"), 400

    selected_mcq  = random.sample(mcq_bank,  mcq_count)    if mcq_count    else []
    selected_subj = random.sample(subj_bank, subj_count)   if subj_count   else []
    selected_code = random.sample(code_bank, coding_count) if coding_count else []

    exam_mcq = [{
        "question":   q.get("question", ""),
        "options":    q.get("options", []),
        "topic":      q.get("topic", ""),
        "difficulty": q.get("difficulty", ""),
        "_correct":   q.get("correct_answer", []),
    } for q in selected_mcq]

    exam_subj = [{
        "question":         q.get("question", ""),
        "skill":            q.get("skill", ""),
        "difficulty":       q.get("difficulty", ""),
        "reference_answer": q.get("reference_answer", ""),
        "key_points":       q.get("key_points", ""),
    } for q in selected_subj]

    exam_code = [{
        "question":             q.get("question", ""),
        "programming_language": q.get("programming_language", "Python"),
        "difficulty":           q.get("difficulty", ""),
        "topic":                q.get("topic", ""),
    } for q in selected_code]

    try:
        recruiter = mongo.db.users.find_one({"_id": ObjectId(identity)})
    except Exception:
        recruiter = None
    recruiter_name  = (
        f"{recruiter.get('first_name','')} {recruiter.get('last_name','')}".strip()
        if recruiter else "Recruiter"
    )
    recruiter_email = recruiter.get("email", "") if recruiter else ""

    token      = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
    exam_id    = _next_exam_id()

    exam_doc = {
        "exam_id":              exam_id,
        "token":                token,
        "candidate_id":         candidate_id,
        "candidate_name":       candidate.get("name", ""),
        "candidate_email":      candidate.get("email", ""),
        "resume_id":            candidate.get("resume_id", ""),
        "job_mongo_id":         job_id,
        "job_id":               job.get("job_id", ""),
        "job_title":            job.get("title", ""),
        "client_name":          job.get("client_name", ""),
        "recruiter_id":         identity,
        "recruiter_name":       recruiter_name,
        "recruiter_email":      recruiter_email,
        "mcq_questions":        exam_mcq,
        "subjective_questions": exam_subj,
        "coding_questions":     exam_code,
        "mcq_count":            mcq_count,
        "subjective_count":     subj_count,
        "coding_count":         coding_count,
        "time_limit_minutes":   time_limit,
        "status":               "Sent",
        "sent_at":              datetime.utcnow(),
        "started_at":           None,
        "submitted_at":         None,
        "expires_at":           expires_at,
        "answers": {"mcq": [], "subjective": [], "coding": []},
        "mcq_score":      0,
        "mcq_correct":    0,
        "mcq_total":      mcq_count,
        "subj_score":     None,
        "subj_total_pts": None,
        "subj_max_pts":   None,
        "code_score":     None,
        "code_total_pts": None,
        "code_max_pts":   None,
        "overall_score":  None,
        # Proctoring fields — populated at submit time
        "proctoring_events":    [],
        "proctoring_snapshots": [],
        "proctoring_summary":   {},
        "created_at":           datetime.utcnow(),
    }

    result = mongo.db.exams.insert_one(exam_doc)
    exam_doc["_id"] = result.inserted_id

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3001")
    exam_link    = f"{frontend_url}/exam/{token}"

    email_sent = _send_exam_email(
        to_email       = candidate.get("email"),
        candidate_name = candidate.get("name", "Candidate"),
        job_title      = job.get("title", ""),
        recruiter_name = recruiter_name,
        company_name   = job.get("client_name", ""),
        exam_link      = exam_link,
        time_limit     = time_limit,
        expires_at     = expires_at,
    )

    return jsonify(
        success=True,
        message=(
            f"Exam sent to {candidate.get('email')}"
            if email_sent
            else "Exam created — email delivery failed. Share link manually."
        ),
        data={
            "exam_id":    exam_id,
            "token":      token,
            "exam_link":  exam_link,
            "expires_at": expires_at.isoformat(),
            "email_sent": email_sent,
        }
    ), 201


# ═══════════════════════════════════════════════════════════════════════════════
#  TAKE EXAM (public — candidate)
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/take/<token>", methods=["GET"])
def take_exam(token):
    exam = mongo.db.exams.find_one({"token": token})
    if not exam:
        return jsonify(success=False, message="Exam not found or link is invalid"), 404
    if exam.get("status") == "Completed":
        return jsonify(success=False, message="This exam has already been submitted"), 409
    if datetime.utcnow() > exam.get("expires_at", datetime.utcnow()):
        mongo.db.exams.update_one({"_id": exam["_id"]}, {"$set": {"status": "Expired"}})
        return jsonify(success=False, message="This exam link has expired"), 410

    if exam.get("status") == "Sent":
        mongo.db.exams.update_one(
            {"_id": exam["_id"]},
            {"$set": {"status": "In Progress", "started_at": datetime.utcnow()}}
        )

    
    safe_mcq = [{
        "question":      q.get("question"),
        "options":       q.get("options", []),
        "topic":         q.get("topic", ""),
        "difficulty":    q.get("difficulty", ""),
        "image_file_id": q.get("image_file_id"),  
    } for q in (exam.get("mcq_questions") or [])]

    safe_subj = [{
        "question":      q.get("question"),
        "skill":         q.get("skill", ""),
        "difficulty":    q.get("difficulty", ""),
        "image_file_id": q.get("image_file_id"),  
    } for q in (exam.get("subjective_questions") or [])]

    safe_code = [{
        "question":             q.get("question"),
        "programming_language": q.get("programming_language", "Python"),
        "difficulty":           q.get("difficulty", ""),
        "topic":                q.get("topic", ""),
        "image_file_id":        q.get("image_file_id"),   
    } for q in (exam.get("coding_questions") or [])]

    return jsonify(success=True, data={
        "exam_id":              exam.get("exam_id"),
        "job_title":            exam.get("job_title"),
        "client_name":          exam.get("client_name"),
        "candidate_name":       exam.get("candidate_name"),
        "recruiter_name":       exam.get("recruiter_name"),
        "time_limit_minutes":   exam.get("time_limit_minutes"),
        "mcq_count":            exam.get("mcq_count"),
        "subjective_count":     exam.get("subjective_count"),
        "coding_count":         exam.get("coding_count"),
        "status":               exam.get("status"),
        "started_at":           exam.get("started_at").isoformat() if exam.get("started_at") else None,
        "expires_at":           exam.get("expires_at").isoformat() if exam.get("expires_at") else None,
        "mcq_questions":        safe_mcq,
        "subjective_questions": safe_subj,
        "coding_questions":     safe_code,
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  SUBMIT EXAM — with full proctoring persistence
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/submit/<token>", methods=["POST"])
def submit_exam(token):
    """
    Grades MCQ automatically.
    Grades subjective + coding using Groq (Llama 3.3 70B) with Gemini as fallback.
    Saves all proctoring events, snapshots, and integrity score.
    """
    exam = mongo.db.exams.find_one({"token": token})
    if not exam:
        return jsonify(success=False, message="Exam not found"), 404
    if exam.get("status") == "Completed":
        return jsonify(success=False, message="Already submitted"), 409
    if datetime.utcnow() > exam.get("expires_at", datetime.utcnow()):
        return jsonify(success=False, message="Exam has expired"), 410

    data         = request.get_json(silent=True) or {}
    mcq_answers  = data.get("mcq",        [])
    subj_answers = data.get("subjective",  [])
    code_answers = data.get("coding",      [])

    # Proctoring data sent at submit time
    proctor_data              = data.get("proctoring", {})
    proctor_events_from_sub   = proctor_data.get("events",    [])
    proctor_snapshots_from_sub = proctor_data.get("snapshots", [])

    mcq_questions  = exam.get("mcq_questions",        [])
    subj_questions = exam.get("subjective_questions",  [])
    code_questions = exam.get("coding_questions",      [])



    # ── 1. Grade MCQ ─────────────────────────────────────────────────────────
    mcq_correct = 0
    graded_mcq  = []

    for ans in mcq_answers:
        idx      = ans.get("question_index", -1)
        selected = ans.get("selected_option", "").strip()

        if not (0 <= idx < len(mcq_questions)):
            continue

        q            = mcq_questions[idx]
        correct_list = q.get("_correct", [])
        options      = q.get("options", [])

        # Attempt 1: direct match (selected text == correct text exactly)
        is_correct = selected in correct_list

        # Attempt 2: normalized match (handles 'A. text' vs 'text' mismatches)
        if not is_correct and selected:
            norm_selected = _normalize_option(selected)
            for correct_opt in correct_list:
                if norm_selected == _normalize_option(correct_opt):
                    is_correct = True
                    break

        # Attempt 3: if candidate sent just the label letter ('A','B','C','D')
        # resolve it to the actual option text and compare
        if not is_correct and selected.upper() in ('A', 'B', 'C', 'D'):
            label_index = ord(selected.upper()) - ord('A')  # A=0, B=1 ...
            if 0 <= label_index < len(options):
                resolved = options[label_index]
                is_correct = resolved in correct_list or \
                    _normalize_option(resolved) in [_normalize_option(c) for c in correct_list]

        if is_correct:
            mcq_correct += 1

        graded_mcq.append({
            "question_index":  idx,
            "question_text":   q.get("question", ""),
            "options":         options,
            "topic":           q.get("topic", ""),
            "difficulty":      q.get("difficulty", ""),
            "selected_option": selected,
            "is_correct":      is_correct,
            "correct_answer":  correct_list,
            "image_file_id":   q.get("image_file_id"), 
        })

    mcq_score = round((mcq_correct / len(mcq_questions)) * 100) if mcq_questions else 0

    # ── 2. Grade Subjective ───────────────────────────────────────────────────
    stored_subj      = []
    subj_total_score = 0
    subj_max_score   = 0

    for i, ans in enumerate(subj_answers):
        idx = ans.get("question_index", -1)
        if 0 <= idx < len(subj_questions):
            q           = subj_questions[idx]
            answer_text = ans.get("answer", "").strip()
            logger.info(f"[Grading] Subjective Q{idx + 1}/{len(subj_answers)}")
            ai_result = _ai_grade_subjective(
                question         = q.get("question", ""),
                reference_answer = q.get("reference_answer", ""),
                key_points       = q.get("key_points", ""),
                candidate_answer = answer_text,
            )
            subj_total_score += ai_result.get("score", 0)
            subj_max_score   += ai_result.get("max_score", 10)
            stored_subj.append({
                "question_index":     idx,
                "question_text":      q.get("question", ""),
                "skill":              q.get("skill", ""),
                "difficulty":         q.get("difficulty", ""),
                "image_file_id": q.get("image_file_id"),
                "answer":             answer_text,
                "ai_score":           ai_result.get("score", 0),
                "ai_max_score":       ai_result.get("max_score", 10),
                "ai_feedback":        ai_result.get("feedback", ""),
                "key_points_covered": ai_result.get("key_points_covered", []),
                "key_points_missed":  ai_result.get("key_points_missed", []),
                "verdict":            ai_result.get("verdict", ""),
                
            })
            if i < len(subj_answers) - 1:
                time.sleep(1)

    subj_score_pct = (
        round((subj_total_score / subj_max_score) * 100)
        if subj_max_score > 0 else 0
    )

    # ── 3. Grade Coding ───────────────────────────────────────────────────────
    stored_code      = []
    code_total_score = 0
    code_max_score   = 0

    for i, ans in enumerate(code_answers):
        idx = ans.get("question_index", -1)
        if 0 <= idx < len(code_questions):
            q    = code_questions[idx]
            code = ans.get("code", "").strip()
            lang = q.get("programming_language", "Python")
            logger.info(f"[Grading] Coding Q{idx + 1}/{len(code_answers)}")
            ai_result = _ai_grade_coding(
                question   = q.get("question", ""),
                language   = lang,
                code       = code,
                run_output = ans.get("run_output", ""),
                run_status = ans.get("run_status", ""),
            )
            code_total_score += ai_result.get("score", 0)
            code_max_score   += ai_result.get("max_score", 10)
            stored_code.append({
                "question_index":       idx,
                "question_text":        q.get("question", ""),
                "programming_language": lang,
                "difficulty":           q.get("difficulty", ""),
                "topic":                q.get("topic", ""),
                "image_file_id": q.get("image_file_id"),
                "code":                 code,
                "run_output":           ans.get("run_output", ""),
                "run_stderr":           ans.get("run_stderr", ""),
                "run_status":           ans.get("run_status", ""),
                "ai_score":             ai_result.get("score", 0),
                "ai_max_score":         ai_result.get("max_score", 10),
                "ai_feedback":          ai_result.get("feedback", ""),
                "language_correct":     ai_result.get("language_correct", True),
                "code_quality":         ai_result.get("code_quality", ""),
                "logic_correct":        ai_result.get("logic_correct", False),
                "edge_cases_handled":   ai_result.get("edge_cases_handled", False),
                "verdict":              ai_result.get("verdict", ""),
            })
            if i < len(code_answers) - 1:
                time.sleep(1)

    code_score_pct = (
        round((code_total_score / code_max_score) * 100)
        if code_max_score > 0 else 0
    )

    # ── 4. Overall weighted score ─────────────────────────────────────────────
    weights = []
    scores  = []
    if mcq_questions:  weights.append(0.40); scores.append(mcq_score)
    if subj_questions: weights.append(0.35); scores.append(subj_score_pct)
    if code_questions: weights.append(0.25); scores.append(code_score_pct)

    total_weight  = sum(weights)
    overall_score = (
        round(sum(s * (w / total_weight) for s, w in zip(scores, weights)))
        if weights else 0
    )

    # ── 5. Process proctoring snapshots ──────────────────────────────────────
    
    live_events            = exam.get("proctoring_events", [])
    all_events             = live_events + proctor_events_from_sub   # merge both

    # Store snapshots from submit payload (cap at 80)
    stored_snapshots = []
    # for snap in proctor_snapshots_from_sub[:80]:
    
    # Keep all flagged snapshots + sample of ok ones, max 80 total
    flagged_snaps = [s for s in proctor_snapshots_from_sub if s.get("analysis", {}).get("flag") != "ok"]
    ok_snaps = [s for s in proctor_snapshots_from_sub if s.get("analysis", {}).get("flag") == "ok"]
    combined = flagged_snaps + ok_snaps[:max(0, 80 - len(flagged_snaps))]
    for snap in combined:
        
        analysis = snap.get("analysis", {})
        stored_snapshots.append({
            "ts":       snap.get("ts"),
            "label":    snap.get("label", "periodic"),
            "dataUrl":  snap.get("dataUrl", ""),  # store for recruiter review
            "analysis": analysis,
            "flag":     analysis.get("flag", "ok"),
            "reason":   analysis.get("reason", ""),
        })

    proctor_summary = _build_proctoring_summary(all_events, stored_snapshots)

    # ── 6. Save to DB ─────────────────────────────────────────────────────────
    mongo.db.exams.update_one(
        {"_id": exam["_id"]},
        {"$set": {
            "status":         "Completed",
            "submitted_at":   datetime.utcnow(),
            "answers": {
                "mcq":        graded_mcq,
                "subjective": stored_subj,
                "coding":     stored_code,
            },
            "mcq_score":      mcq_score,
            "mcq_correct":    mcq_correct,
            "mcq_total":      len(mcq_questions),
            "subj_score":     subj_score_pct,
            "subj_total_pts": subj_total_score,
            "subj_max_pts":   subj_max_score,
            "code_score":     code_score_pct,
            "code_total_pts": code_total_score,
            "code_max_pts":   code_max_score,
            "overall_score":  overall_score,
            # Proctoring — persisted for recruiter review
            "proctoring_snapshots": stored_snapshots,
            "proctoring_summary":   proctor_summary,
        }}
    )

    # ── 7. Notify recruiter ───────────────────────────────────────────────────
    exam["mcq_score"]          = mcq_score
    exam["mcq_count"]          = len(mcq_questions)
    exam["overall_score"]      = overall_score
    exam["proctoring_summary"] = proctor_summary
    _create_recruiter_notification(exam.get("recruiter_id", ""), exam)

    logger.info(
    f"[Grading] Done — MCQ:{mcq_score}% Subj:{subj_score_pct}% "
    f"Code:{code_score_pct}% Overall:{overall_score}% "
    f"Integrity:{proctor_summary['integrity_score']}%"
)

    return jsonify(
        success=True,
        message="Exam submitted and graded successfully!",
        data={
            "mcq_score":     mcq_score,
            "mcq_correct":   mcq_correct,
            "mcq_total":     len(mcq_questions),
            "subj_score":    subj_score_pct,
            "subj_count":    len(stored_subj),
            "code_score":    code_score_pct,
            "code_count":    len(stored_code),
            "overall_score": overall_score,
            "subj_feedback": [
                {
                    "q":        s["question_text"],
                    "score":    s["ai_score"],
                    "max":      s["ai_max_score"],
                    "feedback": s["ai_feedback"],
                    "verdict":  s["verdict"],
                    "covered":  s["key_points_covered"],
                    "missed":   s["key_points_missed"],
                }
                for s in stored_subj
            ],
            "code_feedback": [
                {
                    "q":        s["question_text"],
                    "score":    s["ai_score"],
                    "max":      s["ai_max_score"],
                    "feedback": s["ai_feedback"],
                    "verdict":  s["verdict"],
                    "lang_ok":  s["language_correct"],
                    "quality":  s["code_quality"],
                }
                for s in stored_code
            ],
        }
    ), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  MANUAL SCORE OVERRIDE (recruiter)
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/<exam_id>/score", methods=["PUT"])
@jwt_required()
def update_manual_score(exam_id):
    identity = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    try:
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)})
    except InvalidId:
        exam = mongo.db.exams.find_one({"exam_id": exam_id})
    if not exam:
        return jsonify(success=False, message="Exam not found"), 404
    if exam.get("recruiter_id") != identity:
        return jsonify(success=False, message="Access denied"), 403

    update = {}
    if "subjective_score" in data: update["subjective_score"] = data["subjective_score"]
    if "coding_score"     in data: update["coding_score"]     = data["coding_score"]
    if "overall_score"    in data: update["overall_score"]    = data["overall_score"]
    if "notes"            in data: update["score_notes"]      = data["notes"]
    update["scored_at"] = datetime.utcnow()

    mongo.db.exams.update_one({"_id": exam["_id"]}, {"$set": update})
    return jsonify(success=True, message="Scores updated"), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  GET EXAMS
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/by-candidate/<candidate_id>", methods=["GET"])
@jwt_required()
def get_exams_by_candidate(candidate_id):
    exams = list(
        mongo.db.exams
        .find({"candidate_id": candidate_id})
        .sort("created_at", -1)
        .limit(20)
    )
    return jsonify(success=True, data=[_serialize(e) for e in exams]), 200


@exam_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_exams():
    identity = get_jwt_identity()
    status   = request.args.get("status", "")
    query    = {"recruiter_id": identity}
    if status:
        query["status"] = status
    exams = list(mongo.db.exams.find(query).sort("created_at", -1).limit(200))
    return jsonify(success=True, data=[_serialize(e) for e in exams]), 200


@exam_bp.route("/<exam_id>", methods=["GET"])
@jwt_required()
def get_exam(exam_id):
    try:
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)})
    except InvalidId:
        exam = mongo.db.exams.find_one({"exam_id": exam_id})
    if not exam:
        return jsonify(success=False, message="Exam not found"), 404
    return jsonify(success=True, data=_serialize(exam)), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/notifications/", methods=["GET"])
@jwt_required()
def get_notifications():
    identity = get_jwt_identity()
    notifs   = list(
        mongo.db.notifications
        .find({"recipient_id": identity})
        .sort("created_at", -1)
        .limit(50)
    )
    unread = mongo.db.notifications.count_documents(
        {"recipient_id": identity, "is_read": False}
    )
    return jsonify(
        success=True,
        data=[_serialize(n) for n in notifs],
        unread=unread
    ), 200


@exam_bp.route("/notifications/<nid>/read", methods=["PUT"])
@jwt_required()
def mark_read(nid):
    try:
        mongo.db.notifications.update_one(
            {"_id": ObjectId(nid)},
            {"$set": {"is_read": True}}
        )
    except InvalidId:
        pass
    return jsonify(success=True), 200


@exam_bp.route("/notifications/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    identity = get_jwt_identity()
    mongo.db.notifications.update_many(
        {"recipient_id": identity},
        {"$set": {"is_read": True}}
    )
    return jsonify(success=True), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  PROCTORING ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/proctor/<token>/event", methods=["POST"])
def store_proctor_event(token):
    """
    Called by the frontend for every flagged proctoring event (live, during exam).
    Public endpoint — no JWT required.
    """
    exam = mongo.db.exams.find_one({"token": token})
    if not exam:
        return jsonify(success=False, message="Exam not found"), 404
    if exam.get("status") == "Completed":
        return jsonify(success=True), 200  # silently accept late events

    data  = request.get_json(silent=True) or {}
    event = {
        "ts":       data.get("ts",       datetime.utcnow().isoformat()),
        "type":     data.get("type",     "info"),
        "msg":      data.get("msg",      ""),
        "snapshot": data.get("snapshot", None),
    }

    mongo.db.exams.update_one(
        {"_id": exam["_id"]},
        {"$push": {"proctoring_events": event}}
    )
    return jsonify(success=True), 200
@exam_bp.route("/<exam_id>/proctoring", methods=["GET"])
@jwt_required()
def get_proctoring_report(exam_id):
    identity = get_jwt_identity()
    try:
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)})
    except InvalidId:
        exam = mongo.db.exams.find_one({"exam_id": exam_id})
    if not exam:
        return jsonify(success=False, message="Exam not found"), 404
    if exam.get("recruiter_id") != identity:
        return jsonify(success=False, message="Access denied"), 403

    events    = exam.get("proctoring_events",    [])
    snapshots = exam.get("proctoring_snapshots", [])
    summary   = exam.get("proctoring_summary",   
                         _build_proctoring_summary(events, snapshots))

    # ── Check BOTH possible storage locations for video ──
    proctoring_nested = exam.get("proctoring", {})
    video_uploaded_at = proctoring_nested.get("video_uploaded_at")
    video_file_id     = proctoring_nested.get("video_file_id", "")

    # Also check top-level (in case stored differently)
    if not video_uploaded_at:
        video_uploaded_at = exam.get("video_uploaded_at")
        video_file_id     = exam.get("video_file_id", video_file_id)

    if video_uploaded_at:
        summary["video_uploaded_at"] = video_uploaded_at
        summary["video_file_id"]     = video_file_id
        summary["has_recording"]     = True
    else:
        summary["has_recording"] = False

    return jsonify(
        success=True,
        data={
            "exam_id":         exam.get("exam_id"),
            "exam_mongo_id":   str(exam.get("_id", "")),   # ← add this
            "candidate_name":  exam.get("candidate_name"),
            "candidate_email": exam.get("candidate_email"),
            "events":          events,
            "snapshots":       snapshots,
            "summary":         summary,
        }
    ), 200


    
# ── Shared Gemini vision helper ───────────────────────────────────────────────






def _gemini_vision(b64_image: str, prompt: str) -> str:
    """Call Gemini 2.0 Flash with a base64 image - FREE tier available."""
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError("GEMINI_API_KEY not set")
    
    # Use gemini-2.0-flash — free tier, reliable vision
    # url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.0-flash:generateContent"
        f"?key={key}"
    )
    
    payload = {
        "contents": [{
            "parts": [
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": b64_image
                    }
                },
                {
                    "text": prompt
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            # "maxOutputTokens": 300,
            "maxOutputTokens": 20000,
        }
    }
    
    try:
        resp = http_requests.post(
            f"{url}?key={key}",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        
        # Handle blocked responses
        if data.get("promptFeedback", {}).get("blockReason"):
            raise ValueError(f"Blocked: {data['promptFeedback']['blockReason']}")
        
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError(f"No candidates in response: {data}")
        
        # Check finish reason
        finish_reason = candidates[0].get("finishReason", "")
        if finish_reason in ("SAFETY", "RECITATION"):
            raise ValueError(f"Response blocked: {finish_reason}")
        
        text = candidates[0]["content"]["parts"][0]["text"].strip()
        return text
        
    except http_requests.exceptions.HTTPError as e:
        logger.error(f"[Gemini] HTTP error {resp.status_code}: {resp.text[:200]}")
        raise
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected Gemini response: {data}") from e


@exam_bp.route("/proctor/verify-face", methods=["POST"])
def verify_face():
    """Camera gate before exam starts."""
    data = request.get_json(silent=True) or {}
    b64  = data.get("image", "")
    if not b64:
        return jsonify(success=False, message="No image"), 400

    # Simpler, more direct prompt works better with Gemini
    prompt = """Look at this webcam image and return ONLY this JSON (no markdown, no backticks):
{"face_visible":true,"single_person":true,"good_lighting":true,"approved":true,"reason":""}

Set approved=true ONLY if: exactly one human face is clearly visible and lighting is adequate.
Set approved=false and explain in reason if: no face, multiple faces, too dark, or face obscured."""

    try:
        raw = _gemini_vision(b64, prompt)
        # Clean any markdown that slips through
        raw = raw.replace("```json", "").replace("```", "").strip()
        if "{" in raw:
            raw = raw[raw.index("{"):raw.rindex("}") + 1]
        result = json.loads(raw)
        
        # Validate expected fields exist
        if "approved" not in result:
            result = {"approved": True, "reason": "validation_fallback"}
            
    except json.JSONDecodeError as e:
        logger.warning(f"[Proctor] JSON parse error: {raw!r}")
        result = {"approved": True, "reason": "parse_fallback"}
    except Exception as e:
        logger.error(f"[Proctor] verify_face error: {e}")
        result = {"approved": True, "reason": ""}  # fail open

    return jsonify(success=True, data=result), 200



# ── analyze snapshot + store frame ───────────────────────────────────────────

@exam_bp.route("/proctor/<token>/analyze", methods=["POST"])
def analyze_snapshot(token):
    exam = mongo.db.exams.find_one({"token": token}, {"_id": 1, "status": 1})
    if not exam or exam.get("status") == "Completed":
        return jsonify(success=False), 404

    data  = request.get_json(silent=True) or {}
    b64   = data.get("image", "")
    label = data.get("label", "periodic")
    ts    = data.get("ts", datetime.utcnow().isoformat())

    if not b64 or len(b64) < 1000:
        return jsonify(success=True, data={"flag": "ok", "reason": "image_too_small"}), 200


     
    prompt = """You are an ULTRA-STRICT AI exam proctoring system. Analyze this webcam frame with MAXIMUM attention.
    Scan the ENTIRE image — every pixel, every corner, background, foreground, edges.

    Return ONLY valid JSON, no markdown, no explanation:

    {
    "face_detected": true,
    "face_count": 1,
    "candidate_present": true,
    "background_person_detected": false,
    "looking_away": false,
    "eye_direction": "center",
    "iris_on_screen": true,
    "gaze_confidence": "high",
    "eyes_closed": false,
    "eyes_closed_duration": "none",
    "head_tilt": "straight",
    "head_movement": "stable",
    "mouth_movement": false,
    "whispering": false,
    "phone_detected": false,
    "phone_location": "",
    "earphone_detected": false,
    "book_detected": false,
    "paper_detected": false,
    "secondary_screen_detected": false,
    "multiple_people": false,
    "tab_switch_suspected": false,
    "suspicious_hand_movement": false,
    "person_leaning": false,
    "flag": "ok",
    "reason": "",
    "confidence": "high"
    }

    DETECTION INSTRUCTIONS — be EXTREMELY thorough:

    PERSON DETECTION:
    - face_detected: Is the primary candidate face clearly visible?
    - face_count: Count EVERY human face including background, reflections, photos on wall, TV screens
    - candidate_present: Is candidate in frame? false if they left completely
    - background_person_detected: ANY other human visible ANYWHERE — doorway, behind, reflection, shadow

    EYE & GAZE TRACKING (CRITICAL):
    - eye_direction: Where are the eyes/irises pointing? Values: "center"(screen) / "left" / "right" / "up" / "down" / "ceiling" / "floor" / "closed" / "unknown"
    - iris_on_screen: true ONLY if both irises are clearly directed at the screen/camera. false if looking sideways, upward at ceiling, downward at notes, or away
    - gaze_confidence: "high" / "medium" / "low" based on how clearly you can determine gaze
    - looking_away: true if eye_direction is NOT "center" — candidate is NOT looking at screen
    - eyes_closed: Are eyes shut? Could indicate sleeping or avoiding camera
    - eyes_closed_duration: "none" / "brief" / "extended"

    HEAD ANALYSIS:
    - head_tilt: "straight" / "left" / "right" / "down" / "up"
    - head_movement: "stable" / "turning" / "nodding" / "excessive"
    - person_leaning: true if candidate is leaning significantly to look at something off-screen

    COMMUNICATION DETECTION:
    - mouth_movement: lips visibly moving — talking or whispering
    - whispering: subtle lip movement suggesting whispered communication with someone

    DEVICE DETECTION (scan hands, desk, lap, pockets):
    - phone_detected: ANY mobile phone, smartphone visible ANYWHERE including hand, desk, lap
    - phone_location: "hand" / "desk" / "lap" / "pocket_visible" / ""
    - earphone_detected: earbuds, AirPods, wired earphones in ears
    - secondary_screen_detected: another monitor, TV, tablet visible in background

    MATERIAL DETECTION:
    - book_detected: books, notebooks, printed notes, flashcards
    - paper_detected: any paper, cheat sheets, sticky notes visible

    BEHAVIORAL:
    - suspicious_hand_movement: hands moving under desk, reaching for something off-screen
    - tab_switch_suspected: sudden gaze shift suggesting alt-tab or window switching

    FLAG RULES — STRICTLY ENFORCED:

    Set flag="alert" if ANY of these:
    - candidate_present = false
    - face_detected = false  
    - face_count > 1
    - background_person_detected = true
    - multiple_people = true
    - phone_detected = true
    - book_detected = true
    - paper_detected = true
    - earphone_detected = true
    - secondary_screen_detected = true

    Set flag="warning" if ANY of these (no alert condition present):
    - iris_on_screen = false (looking away based on iris)
    - looking_away = true
    - eyes_closed = true
    - mouth_movement = true
    - whispering = true
    - head_tilt extreme
    - suspicious_hand_movement = true
    - person_leaning = true

    Set flag="ok" ONLY if: one face, candidate present, iris on screen, no devices, no background persons.

    IMPORTANT: iris_on_screen=false should trigger warning even if face is detected.
    Provide specific reason describing exactly what was detected."""
    
    analysis_ok = True
    try:
        raw    = _vision_analyze(b64, prompt)
        raw    = raw.replace("```json", "").replace("```", "").strip()
        if "{" in raw:
            raw = raw[raw.index("{"):raw.rindex("}") + 1]
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"face_detected": True, "flag": "ok", "reason": "parse_error"}
        analysis_ok = False
    except Exception as e:
        logger.error(f"[Proctor] analyze_snapshot error: {e}")
        # ── Don't store snapshots when vision API isn't configured ──
        # Return ok so exam isn't disrupted, but skip DB storage
        return jsonify(success=True, data={"flag": "ok", "reason": ""}), 200
    




# ── Hard override: enforce flag based on detected fields ──────────────────
    if analysis_ok:
        alert_conditions = [
            not result.get("candidate_present", True),
            not result.get("face_detected", True),
            result.get("face_count", 1) > 1,
            result.get("background_person_detected", False),
            result.get("multiple_people", False),
            result.get("phone_detected", False),
            result.get("book_detected", False),
            result.get("paper_detected", False),
        ]
        warning_conditions = [
            result.get("looking_away", False),
            result.get("eyes_closed", False),
            result.get("mouth_movement", False),
        ]
        if any(alert_conditions):
            result["flag"] = "alert"
            if not result.get("reason"):
                triggered = []
                if not result.get("candidate_present", True): triggered.append("candidate left frame")
                if not result.get("face_detected", True): triggered.append("no face detected")
                if result.get("face_count", 1) > 1: triggered.append(f"{result.get('face_count')} faces detected")
                if result.get("background_person_detected"): triggered.append("person in background")
                if result.get("phone_detected"): triggered.append("phone detected")
                if result.get("book_detected"): triggered.append("book/notes detected")
                if result.get("paper_detected"): triggered.append("paper/cheatsheet detected")
                result["reason"] = ", ".join(triggered) if triggered else "suspicious activity"
        elif any(warning_conditions) and result.get("flag") == "ok":
            result["flag"] = "warning"
            if not result.get("reason"):
                triggered = []
                if result.get("looking_away"): triggered.append("looking away from screen")
                if result.get("eyes_closed"): triggered.append("eyes closed")
                if result.get("mouth_movement"): triggered.append("talking/whispering")
                result["reason"] = ", ".join(triggered)

    # ── Post-process: ensure background_person_detected triggers alert ──
    if result.get("background_person_detected") or result.get("face_count", 1) > 1:
        result["flag"] = "alert"
        result["multiple_people"] = True
        if not result.get("reason"):
            result["reason"] = f"Another person detected in frame (face count: {result.get('face_count', '?')})"
            
            
    # Only store snapshot if analysis actually ran
    if analysis_ok:
        snap_doc = {
            "ts":       ts,
            "label":    label,
            "dataUrl":  f"data:image/jpeg;base64,{b64}",
            "flag":     result.get("flag", "ok"),
            "analysis": result,
        }
        mongo.db.exams.update_one(
            {"_id": exam["_id"]},
            {"$push": {"proctoring_snapshots": snap_doc}}
        )



# ── upload full video ─────────────────────────────────────────────────────────
@exam_bp.route("/proctor/<token>/upload-video", methods=["POST"])
def upload_video(token):
    exam = mongo.db.exams.find_one({"token": token}, {"_id": 1})
    if not exam:
        return jsonify(success=False, message="Exam not found"), 404

    video_file = request.files.get("video")
    if not video_file:
        return jsonify(success=False, message="No video file"), 400

    video_data = video_file.read()
    if not video_data or len(video_data) < 1000:
        return jsonify(success=False, message="Empty or too-small video"), 400

    try:
        fs      = gridfs.GridFS(mongo.db)
        file_id = fs.put(
            video_data,
            filename      = f"exam_{token}.webm",
            content_type  = "video/webm",
            exam_token    = token,
            uploaded_at   = datetime.utcnow().isoformat(),
        )
        now = datetime.utcnow().isoformat()
        mongo.db.exams.update_one(
            {"_id": exam["_id"]},
            {"$set": {
                # Store in BOTH locations so either lookup works
                "proctoring.video_file_id":     str(file_id),
                "proctoring.video_uploaded_at": now,
                "video_file_id":                str(file_id),   # ← top-level too
                "video_uploaded_at":            now,            # ← top-level too
            }}
        )
        logger.info(f"[Proctor] Video stored: {file_id}, size: {len(video_data)} bytes")
        return jsonify(success=True, data={"file_id": str(file_id)}), 200

    except Exception as e:
        logger.error(f"[Proctor] Video upload error: {e}")
        return jsonify(success=False, message=str(e)), 500


# ── stream video back to recruiter ───────────────────────────────────────────
@exam_bp.route("/proctor/<exam_id>/video", methods=["GET"])
def stream_video(exam_id):
    try:
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)})
        if not exam:
            return jsonify(success=False, message="Not found"), 404

        file_id_str = exam.get("proctoring", {}).get("video_file_id")
        if not file_id_str:
            return jsonify(success=False, message="No video recorded"), 404

        fs       = gridfs.GridFS(mongo.db)
        grid_out = fs.get(ObjectId(file_id_str))

        from flask import Response, stream_with_context
        def generate():
            while True:
                chunk = grid_out.read(65536)
                if not chunk:
                    break
                yield chunk

        return Response(
            stream_with_context(generate()),
            mimetype = "video/webm",
            headers  = {
                "Content-Disposition": f'inline; filename="exam_{exam_id}.webm"',
                "Access-Control-Allow-Origin": "*",
            }
        )
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500




@exam_bp.route("/proctor/<token>/video-debug", methods=["GET"])
def video_debug(token):
    exam = mongo.db.exams.find_one({"token": token})
    if not exam:
        return jsonify(found=False), 404
    return jsonify(
        found=True,
        proctoring=exam.get("proctoring", {}),
        video_uploaded_at=exam.get("video_uploaded_at"),
        video_file_id=exam.get("video_file_id"),
    ), 200




def _openrouter_vision(b64_image: str, prompt: str) -> str:
    """
    Use OpenRouter free tier — models like:
    - meta-llama/llama-4-scout:free  (has vision)
    - google/gemini-2.0-flash-exp:free
    Sign up free at openrouter.ai
    """
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        raise ValueError("OPENROUTER_API_KEY not set")

    resp = http_requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",  # your app URL
        },
        json={
            "model": "google/gemini-2.0-flash-exp:free",  # free vision model
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }],
            "max_tokens": 300,
            "temperature": 0.1,
        },
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()
def _vision_analyze(b64_image: str, prompt: str) -> str:
    """Try Gemini first, fall back to OpenRouter."""
    
    # Try Gemini first (free tier: 15 RPM, 1500/day)
    if os.environ.get("GEMINI_API_KEY"):
        try:
            return _gemini_vision(b64_image, prompt)
        except Exception as e:
            logger.warning(f"[Vision] Gemini failed: {e}, trying fallback...")
    
    # Fallback: OpenRouter free tier
    if os.environ.get("OPENROUTER_API_KEY"):
        try:
            return _openrouter_vision(b64_image, prompt)
        except Exception as e:
            logger.error(f"[Vision] OpenRouter failed: {e}")
    
    raise ValueError("No vision API available — set GEMINI_API_KEY or OPENROUTER_API_KEY")



@exam_bp.route("/proctor/test-vision", methods=["GET"])
def test_vision():
    """Quick sanity check"""

    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        return jsonify(error="GEMINI_API_KEY not set"), 500

    resp = http_requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-3.1-flash-live-preview:generateContent"
        f"?key={key}",
        json={
            "contents": [
                {
                    "parts": [
                        {"text": "Reply with just OK"}
                    ]
                }
            ]
        },
        timeout=15,
    )

    return jsonify(
        status_code=resp.status_code,
        response=resp.json(),
        key_prefix=key[:8] + "..."
    )

@exam_bp.route("/question-image/<file_id>", methods=["GET"])
def get_question_image(file_id):
    try:
        fs       = gridfs.GridFS(mongo.db)
        grid_out = fs.get(ObjectId(file_id))
        mime     = grid_out.content_type or "image/jpeg"  
        from flask import Response
        return Response(
            grid_out.read(),
            mimetype=mime,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400",  
            },
        )
    except Exception as e:
        return jsonify(success=False, message="Image not found"), 404



