
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
import os, uuid, random, smtplib, requests as http_requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from extensions import mongo

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

# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _next_exam_id() -> str:
    count = mongo.db.exams.count_documents({})
    return f"EXM{str(count + 1).zfill(4)}"

def _next_notif_id() -> str:
    count = mongo.db.notifications.count_documents({})
    return f"NTF{str(count + 1).zfill(4)}"

def _serialize(doc: dict) -> dict:
    d = dict(doc)
    d["_id"] = str(d.get("_id", ""))
    for f in ("sent_at", "started_at", "submitted_at", "expires_at",
              "created_at", "updated_at"):
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
        print(f"[EMAIL SKIPPED] {to_email}: {exam_link}")
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
        <div style="text-align:center;margin:30px 0">
          <a href="{exam_link}" style="background:#1a237e;color:#fff;padding:15px 40px;
             border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;
             display:inline-block">Start Exam</a>
        </div>
        <p style="color:#777;font-size:13px;border-top:1px solid #e0e0e0;padding-top:15px">
          If the button doesn't work:<br>
          <a href="{exam_link}" style="color:#0277bd">{exam_link}</a>
        </p>
        <p style="color:#999;font-size:12px">
          Please complete the exam in one sitting. Do not close the browser.
        </p>
      </div>
    </div>"""
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo(); server.starttls(); server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        print(f"[EMAIL SENT] {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def _create_recruiter_notification(recruiter_id: str, exam_doc: dict):
    notif = {
        "notification_id": _next_notif_id(),
        "type":            "exam_submitted",
        "recipient_id":    recruiter_id,
        "title":           "Exam Submitted",
        "message":         f"{exam_doc.get('candidate_name')} submitted the screening exam for {exam_doc.get('job_title')}",
        "exam_id":         str(exam_doc.get("_id", "")),
        "exam_id_str":     exam_doc.get("exam_id", ""),
        "candidate_name":  exam_doc.get("candidate_name", ""),
        "candidate_email": exam_doc.get("candidate_email", ""),
        "job_title":       exam_doc.get("job_title", ""),
        "mcq_score":       exam_doc.get("mcq_score", 0),
        "mcq_total":       exam_doc.get("mcq_count", 0),
        "is_read":         False,
        "created_at":      datetime.utcnow(),
    }
    mongo.db.notifications.insert_one(notif)


# ═══════════════════════════════════════════════════════════════════════════════
#  COMPILE CODE  (proxy to Judge0 CE — no API key needed)
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/compile", methods=["POST"])
def compile_code():
    """
    POST /api/exams/compile
    Body: { code, language, stdin? }
    Returns: { stdout, stderr, status }
    """
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
            json={
                "source_code": code,
                "language_id": lang_id,
                "stdin":       stdin,
            },
            params={"base64_encoded": "false", "wait": "true"},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        r = resp.json()
        return jsonify(
            success = True,
            data    = {
                "stdout":          r.get("stdout") or "",
                "stderr":          r.get("stderr") or "",
                "compile_output":  r.get("compile_output") or "",
                "status":          r.get("status", {}).get("description", "Unknown"),
                "status_id":       r.get("status", {}).get("id", 0),
                "time":            r.get("time"),
                "memory":          r.get("memory"),
            }
        ), 200
    except http_requests.exceptions.Timeout:
        return jsonify(success=False, message="Compiler timed out. Try again."), 504
    except Exception as e:
        return jsonify(success=False, message=f"Compiler error: {str(e)}"), 500


# ═══════════════════════════════════════════════════════════════════════════════
#  SEND EXAM
# ═══════════════════════════════════════════════════════════════════════════════

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
    expires_in_days = max(1,  int(data.get("expires_in_days", 3)))

    if not candidate_id or not job_id:
        return jsonify(success=False, message="candidate_id and job_id required"), 400

    # Load candidate
    try:
        candidate = mongo.db.candidate_processing.find_one({"_id": ObjectId(candidate_id)})
    except InvalidId:
        return jsonify(success=False, message="Invalid candidate ID"), 400
    if not candidate:
        return jsonify(success=False, message="Candidate not found"), 404
    if not candidate.get("email"):
        return jsonify(success=False, message="Candidate has no email address"), 400

    # Load job + question bank
    try:
        job = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
    except InvalidId:
        return jsonify(success=False, message="Invalid job ID"), 400
    if not job:
        return jsonify(success=False, message="Job not found"), 404

    mcq_bank  = job.get("mcq_questions",       []) or []
    subj_bank = job.get("subjective_questions", []) or []
    code_bank = job.get("coding_questions",     []) or []

    if mcq_count    > len(mcq_bank):  return jsonify(success=False, message=f"Not enough MCQ ({len(mcq_bank)} available)"), 400
    if subj_count   > len(subj_bank): return jsonify(success=False, message=f"Not enough subjective ({len(subj_bank)} available)"), 400
    if coding_count > len(code_bank): return jsonify(success=False, message=f"Not enough coding ({len(code_bank)} available)"), 400

    # Randomly select questions
    selected_mcq  = random.sample(mcq_bank,  mcq_count)  if mcq_count    else []
    selected_subj = random.sample(subj_bank, subj_count) if subj_count   else []
    selected_code = random.sample(code_bank, coding_count) if coding_count else []

    # Strip correct answers from MCQ for candidate (store server-side only)
    exam_mcq = [{
        "question":   q.get("question", ""),
        "options":    q.get("options", []),
        "topic":      q.get("topic", ""),
        "difficulty": q.get("difficulty", ""),
        "_correct":   q.get("correct_answer", []),
    } for q in selected_mcq]

    exam_subj = [{
        "question":   q.get("question", ""),
        "skill":      q.get("skill", ""),
        "difficulty": q.get("difficulty", ""),
    } for q in selected_subj]

    exam_code = [{
        "question":            q.get("question", ""),
        "programming_language": q.get("programming_language", "Python"),
        "difficulty":          q.get("difficulty", ""),
        "topic":               q.get("topic", ""),
    } for q in selected_code]

    # Load recruiter info
    try:
        recruiter = mongo.db.users.find_one({"_id": ObjectId(identity)})
    except Exception:
        recruiter = None
    recruiter_name  = f"{recruiter.get('first_name','')} {recruiter.get('last_name','')}".strip() if recruiter else "Recruiter"
    recruiter_email = recruiter.get("email", "") if recruiter else ""

    # Create exam record
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
        "answers": {
            "mcq":        [],
            "subjective": [],
            "coding":     [],
        },
        "mcq_score":       0,
        "mcq_correct":     0,
        "mcq_total":       mcq_count,
        "subjective_score": None,   # filled by recruiter manually
        "coding_score":    None,    # filled by recruiter manually
        "overall_score":   None,
        "created_at":      datetime.utcnow(),
    }

    result = mongo.db.exams.insert_one(exam_doc)
    exam_doc["_id"] = result.inserted_id

    # Send email
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
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
        success = True,
        message = f"Exam sent to {candidate.get('email')}" if email_sent
                  else "Exam created — email delivery failed. Share link manually.",
        data    = {
            "exam_id":    exam_id,
            "token":      token,
            "exam_link":  exam_link,
            "expires_at": expires_at.isoformat(),
            "email_sent": email_sent,
        }
    ), 201


# ═══════════════════════════════════════════════════════════════════════════════
#  CANDIDATE — TAKE EXAM  (public)
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

    # Strip correct answers from MCQ
    safe_mcq = [{
        "question":   q.get("question"),
        "options":    q.get("options", []),
        "topic":      q.get("topic", ""),
        "difficulty": q.get("difficulty", ""),
    } for q in (exam.get("mcq_questions") or [])]

    safe_subj = [{
        "question":   q.get("question"),
        "skill":      q.get("skill", ""),
        "difficulty": q.get("difficulty", ""),
    } for q in (exam.get("subjective_questions") or [])]

    safe_code = [{
        "question":             q.get("question"),
        "programming_language": q.get("programming_language", "Python"),
        "difficulty":           q.get("difficulty", ""),
        "topic":                q.get("topic", ""),
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
#  CANDIDATE — SUBMIT EXAM  (public)
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/submit/<token>", methods=["POST"])
def submit_exam(token):
    """
    Body: {
        mcq:        [{ question_index, selected_option }],
        subjective: [{ question_index, answer }],
        coding:     [{ question_index, code, run_output, run_stderr, run_status }]
    }
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

    mcq_questions  = exam.get("mcq_questions",        [])
    subj_questions = exam.get("subjective_questions",  [])
    code_questions = exam.get("coding_questions",      [])

    # ── Grade MCQ (auto) ──────────────────────────────────────────────────────
    mcq_correct = 0
    graded_mcq  = []
    for ans in mcq_answers:
        idx      = ans.get("question_index", -1)
        selected = ans.get("selected_option", "")
        if 0 <= idx < len(mcq_questions):
            q            = mcq_questions[idx]
            correct_list = q.get("_correct", [])
            is_correct   = selected in correct_list
            if is_correct:
                mcq_correct += 1
            graded_mcq.append({
                "question_index":  idx,
                "question_text":   q.get("question", ""),
                "options":         q.get("options", []),
                "topic":           q.get("topic", ""),
                "difficulty":      q.get("difficulty", ""),
                "selected_option": selected,
                "is_correct":      is_correct,
                "correct_answer":  correct_list,
            })

    mcq_score = round((mcq_correct / len(mcq_questions)) * 100) if mcq_questions else 0

    # ── Store subjective answers with question text ───────────────────────────
    stored_subj = []
    for ans in subj_answers:
        idx = ans.get("question_index", -1)
        if 0 <= idx < len(subj_questions):
            q = subj_questions[idx]
            stored_subj.append({
                "question_index": idx,
                "question_text":  q.get("question", ""),
                "skill":          q.get("skill", ""),
                "difficulty":     q.get("difficulty", ""),
                "answer":         ans.get("answer", ""),
            })

    # ── Store coding answers with question text + run output ──────────────────
    stored_code = []
    for ans in code_answers:
        idx = ans.get("question_index", -1)
        if 0 <= idx < len(code_questions):
            q = code_questions[idx]
            stored_code.append({
                "question_index":      idx,
                "question_text":       q.get("question", ""),
                "programming_language": q.get("programming_language", ""),
                "difficulty":          q.get("difficulty", ""),
                "topic":               q.get("topic", ""),
                "code":                ans.get("code", ""),
                "run_output":          ans.get("run_output", ""),
                "run_stderr":          ans.get("run_stderr", ""),
                "run_status":          ans.get("run_status", ""),
            })

    # ── Save to DB ────────────────────────────────────────────────────────────
    mongo.db.exams.update_one(
        {"_id": exam["_id"]},
        {"$set": {
            "status":       "Completed",
            "submitted_at": datetime.utcnow(),
            "answers": {
                "mcq":        graded_mcq,
                "subjective": stored_subj,
                "coding":     stored_code,
            },
            "mcq_score":   mcq_score,
            "mcq_correct": mcq_correct,
            "mcq_total":   len(mcq_questions),
        }}
    )

    # Notify recruiter
    exam["mcq_score"] = mcq_score
    exam["mcq_count"] = len(mcq_questions)
    _create_recruiter_notification(exam.get("recruiter_id", ""), exam)

    return jsonify(
        success = True,
        message = "Exam submitted successfully. Thank you!",
        data    = {
            "mcq_score":   mcq_score,
            "mcq_correct": mcq_correct,
            "mcq_total":   len(mcq_questions),
            "subj_count":  len(stored_subj),
            "code_count":  len(stored_code),
        }
    ), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  MANUAL SCORING  (recruiter updates subjective / coding scores)
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/<exam_id>/score", methods=["PUT"])
@jwt_required()
def update_manual_score(exam_id):
    """
    PUT /api/exams/<exam_id>/score
    Body: { subjective_score, coding_score, overall_score, notes }
    """
    identity = get_jwt_identity()
    data     = request.get_json(silent=True) or {}
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
#  GET EXAMS FOR A CANDIDATE  (recruiter — for candidate detail view)
# ═══════════════════════════════════════════════════════════════════════════════

@exam_bp.route("/by-candidate/<candidate_id>", methods=["GET"])
@jwt_required()
def get_exams_by_candidate(candidate_id):
    """Returns all exams sent to a specific candidate."""
    exams = list(
        mongo.db.exams
        .find({"candidate_id": candidate_id})
        .sort("created_at", -1)
        .limit(20)
    )
    return jsonify(success=True, data=[_serialize(e) for e in exams]), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  RECRUITER — LIST & DETAIL
# ═══════════════════════════════════════════════════════════════════════════════

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
    return jsonify(success=True, data=[_serialize(n) for n in notifs], unread=unread), 200


@exam_bp.route("/notifications/<nid>/read", methods=["PUT"])
@jwt_required()
def mark_read(nid):
    try:
        mongo.db.notifications.update_one(
            {"_id": ObjectId(nid)}, {"$set": {"is_read": True}}
        )
    except InvalidId:
        pass
    return jsonify(success=True), 200


@exam_bp.route("/notifications/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    identity = get_jwt_identity()
    mongo.db.notifications.update_many(
        {"recipient_id": identity}, {"$set": {"is_read": True}}
    )
    return jsonify(success=True), 200