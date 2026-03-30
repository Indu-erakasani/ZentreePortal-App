# """
# Job schema helpers for pymongo.
# All documents stored in the 'jobs' collection.
# """
# from datetime import datetime

# PRIORITIES  = ["Low", "Medium", "High", "Critical"]
# STATUSES    = ["Open", "On Hold", "Closed", "Filled"]
# JOB_TYPES   = ["Full-Time", "Part-Time", "Contract", "Internship"]
# WORK_MODES  = ["On-site", "Remote", "Hybrid"]

# def job_schema(
#     job_id: str,
#     title: str,
#     client_id: str,
#     client_name: str,
#     openings: int,
#     job_type: str = "Full-Time",
#     work_mode: str = "On-site",
#     location: str = "",
#     experience_min: int = 0,
#     experience_max: int = 5,
#     salary_min: float = 0,
#     salary_max: float = 0,
#     skills: list = None,
#     description: str = "",
#     priority: str = "Medium",
#     status: str = "Open",
#     posted_by: str = "",
#     deadline=None,
#     notes: str = "",
# ) -> dict:
#     if priority not in PRIORITIES:
#         raise ValueError(f"priority must be one of {PRIORITIES}")
#     if status not in STATUSES:
#         raise ValueError(f"status must be one of {STATUSES}")
#     return {
#         "job_id":          job_id.upper().strip(),
#         "title":           title.strip(),
#         "client_id":       client_id,
#         "client_name":     client_name,
#         "openings":        openings,
#         "filled":          0,
#         "job_type":        job_type,
#         "work_mode":       work_mode,
#         "location":        location,
#         "experience_min":  experience_min,
#         "experience_max":  experience_max,
#         "salary_min":      salary_min,
#         "salary_max":      salary_max,
#         "skills":          skills or [],
#         "description":     description,
#         "priority":        priority,
#         "status":          status,
#         "posted_by":       posted_by,
#         "deadline":        deadline,
#         "applications":    0,
#         "days_open":       0,
#         "notes":           notes,
#         "created_at":      datetime.utcnow(),
#         "updated_at":      datetime.utcnow(),
#     }

# def serialize_job(job: dict) -> dict:
#     j = dict(job)
#     j["_id"] = str(j.get("_id", ""))
#     for field in ("deadline", "created_at", "updated_at"):
#         if isinstance(j.get(field), datetime):
#             j[field] = j[field].isoformat()
#     # compute days_open dynamically
#     if isinstance(job.get("created_at"), datetime):
#         j["days_open"] = (datetime.utcnow() - job["created_at"]).days
#     return j



"""
Job schema helpers for pymongo.
All documents stored in the 'jobs' collection.
"""
from datetime import datetime

PRIORITIES = ["Low", "Medium", "High", "Critical"]
STATUSES   = ["Open", "On Hold", "Closed", "Filled"]
JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"]
WORK_MODES = ["On-site", "Remote", "Hybrid"]


def job_schema(
    job_id: str,
    title: str,
    client_id: str,
    client_name: str,
    openings: int,
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
    posted_by: str = "",           # stores user _id (internal)
    posted_by_name: str = "",      # ← stores human-readable full name
    deadline=None,
    notes: str = "",
) -> dict:
    if priority not in PRIORITIES:
        raise ValueError(f"priority must be one of {PRIORITIES}")
    if status not in STATUSES:
        raise ValueError(f"status must be one of {STATUSES}")
    return {
        "job_id":          job_id.upper().strip(),
        "title":           title.strip(),
        "client_id":       client_id,
        "client_name":     client_name,
        "openings":        openings,
        "filled":          0,
        "job_type":        job_type,
        "work_mode":       work_mode,
        "location":        location,
        "experience_min":  experience_min,
        "experience_max":  experience_max,
        "salary_min":      salary_min,
        "salary_max":      salary_max,
        "skills":          skills or [],
        "description":     description,
        "priority":        priority,
        "status":          status,
        "posted_by":       posted_by,           # user _id string
        "posted_by_name":  posted_by_name,      # ← "Priya Sharma"
        "deadline":        deadline,
        "applications":    0,
        "days_open":       0,
        "notes":           notes,
        "created_at":      datetime.utcnow(),
        "updated_at":      datetime.utcnow(),
    }


def serialize_job(job: dict) -> dict:
    j = dict(job)
    j["_id"] = str(j.get("_id", ""))
    for field in ("deadline", "created_at", "updated_at"):
        if isinstance(j.get(field), datetime):
            j[field] = j[field].isoformat()
    # Compute days_open dynamically from created_at
    if isinstance(job.get("created_at"), datetime):
        j["days_open"] = (datetime.utcnow() - job["created_at"]).days
    return j