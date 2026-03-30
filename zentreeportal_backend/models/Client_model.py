"""
Client schema helpers for pymongo.
All documents stored in the 'clients' collection.
Mirrors the Mongoose schema provided by the user.
"""
from datetime import datetime

# ── Allowed values ────────────────────────────────────────────────────────────
INDUSTRIES = [
    "Information Technology", "Banking & Finance", "Healthcare",
    "Manufacturing", "Retail", "Telecom", "Consulting",
    "E-commerce", "Automotive", "Energy", "Other",
]
AGREEMENT_TYPES       = ["MSA", "SOW", "Contract", "NDA"]
RELATIONSHIP_STATUSES = ["Active", "Inactive", "On Hold", "Prospect"]
PAYMENT_TERMS         = ["Net 15", "Net 30", "Net 45", "Net 60"]

# ── Schema template ───────────────────────────────────────────────────────────
def client_schema(
    client_id: str,
    company_name: str,
    industry: str,
    company_size: str,
    location: str,
    primary_contact: str,
    contact_title: str,
    email: str,
    phone: str,
    city: str = "",
    state: str = "",
    country: str = "India",
    address: str = "",
    website: str = "",
    agreement_type: str = "",
    agreement_start=None,
    agreement_end=None,
    payment_terms: str = "Net 30",
    relationship_status: str = "Active",
    account_manager: str = "",
    billing_rate: float = 0.0,
    notes: str = "",
) -> dict:
    """Return a new client document ready to insert into MongoDB."""
    if industry not in INDUSTRIES:
        raise ValueError(f"industry must be one of {INDUSTRIES}")
    if relationship_status not in RELATIONSHIP_STATUSES:
        raise ValueError(f"relationship_status must be one of {RELATIONSHIP_STATUSES}")
    return {
        "client_id":           client_id.upper().strip(),
        "company_name":        company_name.strip(),
        "industry":            industry,
        "company_size":        company_size,
        "location":            location,
        "primary_contact":     primary_contact,
        "contact_title":       contact_title,
        "email":               email.lower().strip(),
        "phone":               phone,
        "city":                city,
        "state":               state,
        "country":             country,
        "address":             address,
        "website":             website,
        "agreement_type":      agreement_type,
        "agreement_start":     agreement_start,
        "agreement_end":       agreement_end,
        "payment_terms":       payment_terms,
        "relationship_status": relationship_status,
        "account_manager":     account_manager,
        "billing_rate":        billing_rate,
        "notes":               notes,
        "active_jobs":         0,
        "total_placements":    0,
        "created_at":          datetime.utcnow(),
        "updated_at":          datetime.utcnow(),
    }

# ── Helpers ────────────────────────────────────────────────────────────────────
def serialize_client(client: dict) -> dict:
    """Convert ObjectId & dates to JSON-serialisable types."""
    c = dict(client)
    c["_id"] = str(c.get("_id", ""))
    for field in ("agreement_start", "agreement_end", "created_at", "updated_at"):
        if isinstance(c.get(field), datetime):
            c[field] = c[field].isoformat()
    return c