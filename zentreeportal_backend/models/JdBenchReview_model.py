from datetime import datetime

REVIEW_STATUSES = ["Pending Upload", "Pending Review", "Accepted", "Rejected"]

def jd_review_schema(
    bench_id: str,
    bench_person_name: str,
    candidate_email: str,
    job_id: str,
    job_title: str,
    client_name: str,
    senior_reviewer_email: str,
    senior_reviewer_name: str,
    assigned_by: str,   # recruiter name/email
) -> dict:
    return {
        "bench_id":               bench_id,
        "bench_person_name":      bench_person_name,
        "candidate_email":        candidate_email,
        "job_id":                 job_id,
        "job_title":              job_title,
        "client_name":            client_name,
        "senior_reviewer_email":  senior_reviewer_email,
        "senior_reviewer_name":   senior_reviewer_name,
        "assigned_by":            assigned_by,
        "status":                 "Pending Upload",  # REVIEW_STATUSES
        "upload_token":           "",   # UUID given to candidate for upload
        "review_token":           "",   # UUID given to senior for review page
        "resume_file":            "",   # uploaded tailored resume filename
        "feedback":               "",   # senior's feedback
        "rejection_count":        0,    # how many times rejected
        "history": [],                  # list of { status, feedback, timestamp }
        "created_at":             datetime.utcnow(),
        "updated_at":             datetime.utcnow(),
    }

def serialize_review(r: dict) -> dict:
    doc = dict(r)
    doc["_id"] = str(doc.get("_id", ""))
    for f in ("created_at", "updated_at"):
        if isinstance(doc.get(f), datetime):
            doc[f] = doc[f].isoformat()
    return doc