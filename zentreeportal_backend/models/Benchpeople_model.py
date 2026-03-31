
from datetime import datetime

BENCH_STATUSES   = ["Available", "In Interview", "Deployed", "On Hold", "Resigned"]
EMPLOYMENT_TYPES = ["Permanent", "Contract", "C2H", "Freelance"]
NOTICE_PERIODS   = ["Immediate", "15 days", "30 days", "60 days", "90 days"]


def bench_schema(
    name: str,
    email: str,
    phone: str = "",
    current_role: str = "",
    skills: str = "",
    experience: float = 0,
    location: str = "",
    current_salary: float = 0,
    expected_salary: float = 0,
    notice_period: str = "Immediate",
    availability_date=None,
    last_client: str = "",
    last_project: str = "",
    bench_since=None,
    status: str = "Available",
    added_by: str = "",
    employment_type: str = "Permanent",
    notes: str = "",
) -> dict:
    if status not in BENCH_STATUSES:
        raise ValueError(f"status must be one of {BENCH_STATUSES}")
    return {
        "name":              name.strip(),
        "email":             email.lower().strip(),
        "phone":             phone,
        "current_role":      current_role,
        "skills":            skills,
        "experience":        float(experience),
        "location":          location,
        "current_salary":    float(current_salary),
        "expected_salary":   float(expected_salary),
        "notice_period":     notice_period,
        "availability_date": availability_date or datetime.utcnow(),
        "last_client":       last_client,
        "last_project":      last_project,
        "bench_since":       bench_since or datetime.utcnow(),
        "status":            status,
        "added_by":          added_by,
        "employment_type":   employment_type,
        "resume_file":       "",
        "notes":             notes,
        "created_at":        datetime.utcnow(),
        "updated_at":        datetime.utcnow(),
    }


def serialize_bench(b: dict) -> dict:
    doc = dict(b)
    doc["_id"] = str(doc.get("_id", ""))
    for field in ("availability_date", "bench_since", "created_at", "updated_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc