"""
Placement schema helpers for pymongo.
All documents stored in the 'placements' collection.
"""
from datetime import datetime, timedelta

PAYMENT_STATUSES   = ["Pending", "Partial", "Paid", "Overdue"]
CANDIDATE_STATUSES = ["Active", "Probation", "Confirmed", "Resigned", "Terminated"]


def placement_schema(
    resume_id: str,
    candidate_name: str,
    job_id: str,
    client_name: str,
    job_title: str,
    recruiter: str,
    offer_date,
    joining_date,
    final_ctc: float,
    billing_amount: float,
    billing_percentage: float = 0,
    invoice_number: str = "",
    invoice_date=None,
    payment_status: str = "Pending",
    payment_due_date=None,
    payment_received_date=None,
    account_manager: str = "",
    candidate_status: str = "Active",
    guarantee_period: int = 90,
    replacement_required: bool = False,
    notes: str = "",
    time_to_fill: int = 0,
) -> dict:
    # Compute guarantee end date
    if isinstance(joining_date, str):
        jd = datetime.fromisoformat(joining_date)
    elif isinstance(joining_date, datetime):
        jd = joining_date
    else:
        jd = datetime.utcnow()

    guarantee_end = jd + timedelta(days=guarantee_period)

    return {
        "resume_id":              resume_id,
        "candidate_name":         candidate_name,
        "job_id":                 job_id,
        "client_name":            client_name,
        "job_title":              job_title,
        "recruiter":              recruiter,
        "account_manager":        account_manager,
        "offer_date":             offer_date,
        "joining_date":           joining_date if isinstance(joining_date, datetime) else jd,
        "time_to_fill":           time_to_fill,
        "final_ctc":              final_ctc,
        "billing_amount":         billing_amount,
        "billing_percentage":     billing_percentage,
        "invoice_number":         invoice_number,
        "invoice_date":           invoice_date,
        "payment_status":         payment_status,
        "payment_due_date":       payment_due_date,
        "payment_received_date":  payment_received_date,
        "candidate_status":       candidate_status,
        "guarantee_period":       guarantee_period,
        "guarantee_end_date":     guarantee_end,
        "replacement_required":   replacement_required,
        "notes":                  notes,
        "milestones":             [],
        "created_at":             datetime.utcnow(),
        "updated_at":             datetime.utcnow(),
    }


def serialize_placement(p: dict) -> dict:
    doc = dict(p)
    doc["_id"] = str(doc.get("_id", ""))
    for field in (
        "offer_date", "joining_date", "invoice_date",
        "payment_due_date", "payment_received_date",
        "guarantee_end_date", "created_at", "updated_at",
    ):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc