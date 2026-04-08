
from datetime import datetime

SCREENING_STATUSES = ["New", "In Review", "Shortlisted", "Interviewed", "Offered", "Hired", "Rejected", "On Hold"]
SOURCES            = ["LinkedIn", "Naukri", "Indeed", "Referral", "Job Portal", "Direct", "Other"]
NOTICE_PERIODS     = ["Immediate", "15 days", "30 days", "60 days", "90 days"]


def resume_schema(
    name: str,
    email: str,
    phone: str = "",
    current_role: str = "",
    current_company: str = "",
    experience: float = 0,
    skills: str = "",
    location: str = "",
    current_salary: float = 0,
    expected_salary: float = 0,
    notice_period: str = "30 days",
    source: str = "LinkedIn",
    status: str = "New",
    linked_job_id: str = "",
    linked_job_title: str = "",
    notes: str = "",
) -> dict:
    return {
        "name":              name.strip(),
        "email":             email.lower().strip(),
        "phone":             phone,
        "current_role":      current_role,
        "current_company":   current_company,
        "experience":        float(experience),
        "skills":            skills,                  # comma-separated string
        "location":          location,
        "current_salary":    float(current_salary),
        "expected_salary":   float(expected_salary),
        "notice_period":     notice_period,
        "source":            source,
        "status":            status,
        "linked_job_id":     linked_job_id,
        "linked_job_title":  linked_job_title,
        "notes":             notes,
        "created_at":        datetime.utcnow(),
        "updated_at":        datetime.utcnow(),
    }


def serialize_resume(r: dict) -> dict:
    doc = dict(r)
    doc["_id"] = str(doc.get("_id", ""))
    for field in ("created_at", "updated_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc