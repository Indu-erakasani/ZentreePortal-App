"""
Candidate Tracking schema helpers for pymongo.
All documents stored in the 'candidate_tracking' collection.
"""
from datetime import datetime

STAGES = [
    "Screening", "Technical Round 1", "Technical Round 2",
    "HR Round", "Manager Round", "Final Round",
    "Offer Stage", "Negotiation", "Offer Accepted",
    "Offer Declined", "Joined", "Rejected", "Withdrawn",
]
PIPELINE_STATUSES  = ["Active", "On Hold", "Completed", "Dropped"]
INTERVIEW_TYPES    = ["Phone", "Video", "In-Person", "Panel"]
RECOMMENDATIONS    = ["Strong Hire", "Hire", "Maybe", "No Hire"]
OFFER_STATUSES     = ["Pending", "Extended", "Accepted", "Declined", "Negotiating"]


def tracking_schema(
    resume_id: str,
    candidate_name: str,
    job_id: str,
    client_name: str = "",
    job_title: str = "",
    current_stage: str = "Screening",
    pipeline_status: str = "Active",
    recruiter: str = "",
    next_step: str = "",
    next_date=None,
    salary_offered: float = 0,
    offer_status: str = "Pending",
    offer_date=None,
    joining_date=None,
    notes: str = "",
    rejection_reason: str = "",
) -> dict:
    if current_stage not in STAGES:
        raise ValueError(f"current_stage must be one of {STAGES}")
    return {
        "resume_id":         resume_id,
        "candidate_name":    candidate_name,
        "job_id":            job_id,
        "client_name":       client_name,
        "job_title":         job_title,
        "current_stage":     current_stage,
        "stage_date":        datetime.utcnow(),
        "days_in_stage":     0,
        "pipeline_status":   pipeline_status,
        "interviews":        [],
        "stage_history":     [{"stage": current_stage, "entered_at": datetime.utcnow(), "exited_at": None, "outcome": "", "notes": ""}],
        "next_step":         next_step,
        "next_date":         next_date,
        "salary_offered":    salary_offered,
        "offer_status":      offer_status,
        "offer_date":        offer_date,
        "joining_date":      joining_date,
        "notes":             notes,
        "rejection_reason":  rejection_reason,
        "recruiter":         recruiter,
        "created_at":        datetime.utcnow(),
        "updated_at":        datetime.utcnow(),
    }


def serialize_tracking(t: dict) -> dict:
    doc = dict(t)
    doc["_id"] = str(doc.get("_id", ""))
    for field in ("stage_date", "next_date", "offer_date", "joining_date", "created_at", "updated_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    # serialise nested stage_history dates
    for entry in doc.get("stage_history", []):
        for df in ("entered_at", "exited_at"):
            if isinstance(entry.get(df), datetime):
                entry[df] = entry[df].isoformat()
    # serialise interview dates
    for iv in doc.get("interviews", []):
        if isinstance(iv.get("interview_date"), datetime):
            iv["interview_date"] = iv["interview_date"].isoformat()
    return doc