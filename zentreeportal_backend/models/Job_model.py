
from datetime import datetime
from bson import ObjectId

# ── Constants (mirror Mongoose enum arrays) ───────────────────────────────────
PRIORITIES = ["Low", "Medium", "High", "Critical"]
STATUSES   = ["Open", "On Hold", "Closed", "Filled"]
JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"]
WORK_MODES = ["On-site", "Remote", "Hybrid"]


# ── Sub-document builders ──────────────────────────────────────────────────────

def mcq_question(question: str, options: list, correct_answer: list) -> dict:
    """
    Mirrors MCQQuestionSchema:
        { question, options[], correct_answer[] }
    """
    if not question:
        raise ValueError("mcq_question: 'question' is required")
    if not options or not isinstance(options, list):
        raise ValueError("mcq_question: 'options' must be a non-empty list")
    if not correct_answer or not isinstance(correct_answer, list):
        raise ValueError("mcq_question: 'correct_answer' must be a non-empty list")
    return {
        "question":       question.strip(),
        "options":        [str(o) for o in options],
        "correct_answer": [str(a) for a in correct_answer],
    }


def subjective_question(
    question: str,
    reference_answer: str = "",
    key_points: str = "",
    skill: str = "",
    difficulty: str = "",
) -> dict:
    """
    Mirrors SubjectiveQuestionSchema:
        { question, reference_answer, key_points, skill, difficulty }
    """
    if not question:
        raise ValueError("subjective_question: 'question' is required")
    return {
        "question":         question.strip(),
        "reference_answer": reference_answer,
        "key_points":       key_points,
        "skill":            skill,
        "difficulty":       difficulty,
    }


def coding_question(programming_language: str, question: str) -> dict:
    """
    Mirrors CodingQuestionSchema:
        { programming_language, question }
    """
    if not programming_language:
        raise ValueError("coding_question: 'programming_language' is required")
    if not question:
        raise ValueError("coding_question: 'question' is required")
    return {
        "programming_language": programming_language.strip(),
        "question":             question.strip(),
    }


# ── Main schema builder ────────────────────────────────────────────────────────

def job_schema(
    # ── Core identifiers ──────────────────────────────────────────────────────
    job_id: str,
    title: str,
    client_id: str,
    client_name: str,

    # ── openings = single field for number of vacancies ───────────────────────
    # (replaces the previous openings + number_of_vacancies + open_positions)
    openings: int = 1,

    # ── Job details ───────────────────────────────────────────────────────────
    job_type: str = "Full-Time",
    work_mode: str = "On-site",
    location: str = "",
    experience_min: int = 0,
    experience_max: int = 5,
    salary_min: float = 0,
    salary_max: float = 0,
    skills: list = None,
    description: str = "",
    priority: str = "Medium",
    status: str = "Open",

    # ── deadline = single date field (replaces deadline + application_deadline) ─
    deadline=None,

    notes: str = "",

    # ── Posted by ─────────────────────────────────────────────────────────────
    posted_by: str = "",
    posted_by_name: str = "",

    # ── Extended JD fields ────────────────────────────────────────────────────
    # prefix removed — not needed
    hiring_manager: str = "",
    programming_language: str = "",
    programming_level: str = "",
    secondary_skills: list = None,

    # ── Screening test configuration ──────────────────────────────────────────
    mcq_questions_count: int = 0,
    subjective_questions_count: int = 0,
    coding_questions_count: int = 0,
    screening_time_minutes: int = 0,
    screening_test_pass_percentage: str = "",

    # ── Question banks ────────────────────────────────────────────────────────
    mcq_questions: list = None,
    subjective_questions: list = None,
    coding_questions: list = None,

    # ── Contacts ──────────────────────────────────────────────────────────────
    recruiter_contacts: list = None,
    interviewer_contacts: list = None,

    # ── Lifecycle & meta ──────────────────────────────────────────────────────
    is_active: bool = True,
    expiration_time=None,
    preferred_location: str = "",
    department: str = "",
    remarks: str = "",
    jd_edit_status: str = "",
) -> dict:


    # ── Enum validation ───────────────────────────────────────────────────────
    if priority not in PRIORITIES:
        raise ValueError(f"priority must be one of {PRIORITIES}")
    if status not in STATUSES:
        raise ValueError(f"status must be one of {STATUSES}")
    if job_type not in JOB_TYPES:
        raise ValueError(f"job_type must be one of {JOB_TYPES}")
    if work_mode not in WORK_MODES:
        raise ValueError(f"work_mode must be one of {WORK_MODES}")

    # ── Min/max validation ────────────────────────────────────────────────────
    if openings < 1:
        raise ValueError("openings must be >= 1")
    if experience_min < 0:
        raise ValueError("experience_min must be >= 0")
    if experience_max < 0:
        raise ValueError("experience_max must be >= 0")

    return {
        # ── Core identifiers ──────────────────────────────────────────────────
        "job_id":      job_id.upper().strip(),
        "title":       title.strip(),
        "client_id":   client_id,
        "client_name": client_name,

        # ── Job details ───────────────────────────────────────────────────────
        "openings":       openings,     # single field: how many vacancies
        "filled":         0,
        "job_type":       job_type,
        "work_mode":      work_mode,
        "location":       location,
        "experience_min": experience_min,
        "experience_max": experience_max,
        "salary_min":     salary_min,
        "salary_max":     salary_max,
        "skills":         skills or [],
        "description":    description,
        "priority":       priority,
        "status":         status,
        "deadline":       deadline,     # single date: covers both recruitment & application deadline
        "applications":   0,
        "notes":          notes,

        # ── Posted by ─────────────────────────────────────────────────────────
        "posted_by":      posted_by,
        "posted_by_name": posted_by_name,

        # ── Extended JD fields ────────────────────────────────────────────────
        "hiring_manager":       hiring_manager,
        "programming_language": programming_language,
        "programming_level":    programming_level,
        "secondary_skills":     secondary_skills or [],

        # ── Screening test configuration ──────────────────────────────────────
        "mcq_questions_count":            mcq_questions_count,
        "subjective_questions_count":     subjective_questions_count,
        "coding_questions_count":         coding_questions_count,
        "screening_time_minutes":         screening_time_minutes,
        "screening_test_pass_percentage": screening_test_pass_percentage,

        # ── Question banks ────────────────────────────────────────────────────
        "mcq_questions":        mcq_questions        or [],
        "subjective_questions": subjective_questions or [],
        "coding_questions":     coding_questions      or [],

        # ── Contacts ──────────────────────────────────────────────────────────
        "recruiter_contacts":   recruiter_contacts   or [],
        "interviewer_contacts": interviewer_contacts  or [],

        # ── Lifecycle & meta ──────────────────────────────────────────────────
        "is_active":          is_active,
        "expiration_time":    expiration_time,
        "preferred_location": preferred_location,
        "department":         department,
        "remarks":            remarks,
        "jd_edit_status":     jd_edit_status,

        # ── Timestamps ────────────────────────────────────────────────────────
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


# ── Serializer ────────────────────────────────────────────────────────────────

def serialize_job(job: dict) -> dict:

    j = dict(job)

    j["_id"] = str(j.get("_id", ""))

    # ObjectId ref fields → strings
    for ref_field in ("posted_by", "hiring_manager"):
        if isinstance(j.get(ref_field), ObjectId):
            j[ref_field] = str(j[ref_field])

    # ObjectId array fields → string arrays
    for arr_field in ("recruiter_contacts", "interviewer_contacts"):
        if isinstance(j.get(arr_field), list):
            j[arr_field] = [
                str(v) if isinstance(v, ObjectId) else v
                for v in j[arr_field]
            ]

    # datetime fields → ISO strings
    for dt_field in ("deadline", "created_at", "updated_at", "expiration_time"):
        if isinstance(j.get(dt_field), datetime):
            j[dt_field] = j[dt_field].isoformat()

    # days_open virtual
    if isinstance(job.get("created_at"), datetime):
        j["days_open"] = (datetime.utcnow() - job["created_at"]).days
    else:
        j.setdefault("days_open", 0)

    return j