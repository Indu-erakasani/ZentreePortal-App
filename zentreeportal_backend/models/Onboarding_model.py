

from datetime import datetime

DOCUMENT_STATUSES = ["Pending", "Received", "Verified", "Waived"]
BGV_STATUSES      = ["Not Initiated", "Initiated", "In Progress", "Completed", "Failed"]

DOCUMENT_CATEGORIES = {
    "Identity":     ["Aadhar Card", "PAN Card", "Passport", "Voter ID", "Driving License"],
    "Address":      ["Utility Bill", "Rental Agreement", "Bank Statement (Address Proof)"],
    "Education":    ["10th Marksheet", "12th Marksheet", "Graduation Certificate",
                     "PG Certificate", "Professional Certifications"],
    "Professional": ["Previous Offer Letter", "Relieving Letter", "Experience Letter",
                     "Last 3 Months Payslips", "Form 16"],
    "Medical":      ["Medical Fitness Certificate", "Health Declaration Form"],
    "Other":        ["Photograph", "Signed Offer Letter", "Signed NDA",
                     "Signed Employment Agreement"],
}

ONBOARDING_CHECKLIST_ITEMS = [
    "Offer Letter Signed",
    "Employment Agreement Signed",
    "NDA Signed",
    "Welcome Kit Given",
    "ID Card Issued",
    "Corporate Email Created",
    "Induction / Orientation Completed",
    "Buddy / Mentor Assigned",
    "Laptop / System Assigned",
    "System Access Granted",
    "Tools Access (Slack, Jira, GitHub, etc.)",
    "Payroll Enrolment Done",
    "PF / ESI Enrolment Completed",
    "Medical Insurance Enrolled",
    "BGV Initiated",
    "BGV Completed",
    "Probation Review Scheduled",
]


def checklist_item(label: str, done: bool = False, remarks: str = "") -> dict:
    return {
        "label":      label,
        "done":       done,
        "remarks":    remarks,
        "updated_at": datetime.utcnow(),
    }


def document_entry(
    name: str,
    category: str,
    status: str   = "Pending",
    remarks: str  = "",
) -> dict:
    return {
        "name":       name,
        "category":   category,
        "status":     status,
        "remarks":    remarks,
        "file_name":  None,
        "file_path":  None,
        "updated_at": datetime.utcnow(),
    }


def bank_details_schema(
    account_holder_name: str = "",
    account_number: str      = "",
    ifsc_code: str           = "",
    bank_name: str           = "",
    branch: str              = "",
    account_type: str        = "Savings",
) -> dict:
    return {
        "account_holder_name": account_holder_name,
        "account_number":      account_number,
        "ifsc_code":           ifsc_code.upper().strip() if ifsc_code else "",
        "bank_name":           bank_name,
        "branch":              branch,
        "account_type":        account_type,
    }


def emergency_contact_schema(
    name: str         = "",
    relationship: str = "",
    phone: str        = "",
    email: str        = "",
    address: str      = "",
) -> dict:
    return {
        "name":         name,
        "relationship": relationship,
        "phone":        phone,
        "email":        email,
        "address":      address,
    }


def onboarding_schema(employee_id: str, joining_date=None) -> dict:
    return {
        "employee_id":        employee_id,
        "joining_date":       joining_date or datetime.utcnow(),
        "probation_end_date": None,
        "blood_group":        "",
        "personal_email":     "",
        "referred_by":        "",
        "bank_details":       bank_details_schema(),
        "emergency_contact":  emergency_contact_schema(),
        "bgv_status":         "Not Initiated",
        "bgv_agency":         "",
        "bgv_remarks":        "",
        "laptop_serial":      "",
        "laptop_make_model":  "",
        "access_card_number": "",
        "email_id_created":   "",
        "checklist":          [checklist_item(i) for i in ONBOARDING_CHECKLIST_ITEMS],
        "documents":          [],
        "hr_notes":           "",
        "it_notes":           "",
        "created_at":         datetime.utcnow(),
        "updated_at":         datetime.utcnow(),
    }


def serialize_onboarding(doc: dict) -> dict:
    if not doc:
        return {}
    d = dict(doc)
    d["_id"] = str(d.get("_id", ""))
    for f in ("joining_date", "probation_end_date", "created_at", "updated_at"):
        if isinstance(d.get(f), datetime):
            d[f] = d[f].isoformat()
    for item in d.get("checklist", []):
        if isinstance(item.get("updated_at"), datetime):
            item["updated_at"] = item["updated_at"].isoformat()
    for doc_item in d.get("documents", []):
        if isinstance(doc_item.get("updated_at"), datetime):
            doc_item["updated_at"] = doc_item["updated_at"].isoformat()
        # Never expose the server-side file_path to the frontend
        doc_item.pop("file_path", None)
    return d