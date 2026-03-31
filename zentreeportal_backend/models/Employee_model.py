
from datetime import datetime

EMPLOYEE_STATUSES  = ["Active", "On Bench", "On Notice", "Resigned", "Terminated"]
EMPLOYMENT_TYPES   = ["Permanent", "Contract", "C2H", "Freelance"]
BILLING_CURRENCIES = ["INR", "USD", "GBP", "EUR", "AED"]
DEPARTMENTS        = [
    "Engineering", "QA & Testing", "DevOps & Cloud", "Design & UX",
    "Data & Analytics", "Management", "Sales", "HR", "Finance", "Other",
]


def employee_schema(
    name: str,
    email: str,
    emp_id: str,
    phone: str = "",
    designation: str = "",
    department: str = "Engineering",
    employment_type: str = "Permanent",
    date_of_joining=None,
    skills: str = "",
    experience: float = 0,
    location: str = "",
    reporting_manager: str = "",
    status: str = "Active",
    current_client: str = "",
    current_project: str = "",
    current_billing_rate: float = 0,
    billing_currency: str = "INR",
    salary: float = 0,
    notes: str = "",
) -> dict:
    if status not in EMPLOYEE_STATUSES:
        raise ValueError(f"status must be one of {EMPLOYEE_STATUSES}")
    return {
        "emp_id":               emp_id.upper().strip(),
        "name":                 name.strip(),
        "email":                email.lower().strip(),
        "phone":                phone,
        "designation":          designation,
        "department":           department,
        "employment_type":      employment_type,
        "date_of_joining":      date_of_joining or datetime.utcnow(),
        "skills":               skills,
        "experience":           float(experience),
        "location":             location,
        "reporting_manager":    reporting_manager,
        "status":               status,
        "current_client":       current_client,
        "current_project":      current_project,
        "current_billing_rate": float(current_billing_rate),
        "billing_currency":     billing_currency,
        "salary":               float(salary),
        "client_history":       [],
        "notes":                notes,
        "created_at":           datetime.utcnow(),
        "updated_at":           datetime.utcnow(),
    }


def engagement_schema(
    client_name: str,
    project_name: str = "",
    role: str = "",
    start_date=None,
    end_date=None,
    billing_rate: float = 0,
    billing_currency: str = "INR",
    work_location: str = "",
    technology: str = "",
    notes: str = "",
) -> dict:
    return {
        "client_name":      client_name.strip(),
        "project_name":     project_name,
        "role":             role,
        "start_date":       start_date or datetime.utcnow(),
        "end_date":         end_date,
        "billing_rate":     float(billing_rate),
        "billing_currency": billing_currency,
        "work_location":    work_location,
        "technology":       technology,
        "notes":            notes,
        "added_at":         datetime.utcnow(),
    }


def serialize_employee(e: dict) -> dict:
    doc = dict(e)
    doc["_id"] = str(doc.get("_id", ""))
    for field in ("date_of_joining", "created_at", "updated_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    for ch in doc.get("client_history", []):
        for df in ("start_date", "end_date", "added_at"):
            if isinstance(ch.get(df), datetime):
                ch[df] = ch[df].isoformat()
    return doc