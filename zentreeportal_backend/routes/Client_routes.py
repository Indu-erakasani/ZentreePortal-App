"""
Client routes: /api/clients/...
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from extensions import mongo
from models.Client_model import client_schema, serialize_client, INDUSTRIES, RELATIONSHIP_STATUSES
import re
client_bp = Blueprint("clients", __name__)


def _find_client(client_id_str: str):
    """Find by Mongo _id. Returns (client, error_response)."""
    try:
        oid = ObjectId(client_id_str)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid client ID"), 400)
    client = mongo.db.clients.find_one({"_id": oid})
    if not client:
        return None, (jsonify(success=False, message="Client not found"), 404)
    return client, None

def _parse_date(value):
    """Parse an ISO date string into a datetime, or return None."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None
    


# ── POST /api/clients  (create) ────────────────────────────────────────────
@client_bp.route("/", methods=["POST"])
@jwt_required()
def create_client():
    data = request.get_json(silent=True) or {}
    required = ["client_id", "company_name", "industry", "company_size",
                "location", "primary_contact", "contact_title", "email", "phone"]
    for field in required:
        if not data.get(field):
            return jsonify(success=False, message=f"'{field}' is required"), 400

    # Duplicate check
    if mongo.db.clients.find_one({"client_id": data["client_id"].upper().strip()}):
        return jsonify(success=False, message="Client ID already exists"), 409
    if mongo.db.clients.find_one({"email": data["email"].lower().strip()}):
        return jsonify(success=False, message="Email already registered for another client"), 409

    try:
        doc = client_schema(
            client_id       = data["client_id"],
            company_name    = data["company_name"],
            industry        = data["industry"],
            company_size    = data["company_size"],
            location        = data["location"],
            primary_contact = data["primary_contact"],
            contact_title   = data["contact_title"],
            email           = data["email"],
            phone           = data["phone"],
            city            = data.get("city", ""),
            state           = data.get("state", ""),
            country         = data.get("country", "India"),
            address         = data.get("address", ""),
            website         = data.get("website", ""),
            # agreement_type  = data.get("agreement_type", ""),
            # agreement_start = data.get("agreement_start"),
            # agreement_end   = data.get("agreement_end"),
            agreement_type  = data.get("agreement_type", ""),
            agreement_start = _parse_date(data.get("agreement_start")),
            agreement_end   = _parse_date(data.get("agreement_end")),
            payment_terms   = data.get("payment_terms", "Net 30"),
            relationship_status = data.get("relationship_status", "Active"),
            account_manager = data.get("account_manager", ""),
            # billing_rate    = float(data.get("billing_rate", 0)),
            billing_rate = float(data.get("billing_rate") or 0),
            notes           = data.get("notes", ""),
        )
        result = mongo.db.clients.insert_one(doc)
        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Client created successfully", data=serialize_client(doc)), 201
    except ValueError as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message="Failed to create client", error=str(e)), 500


# ── GET /api/clients/meta/options ─────────────────────────────────────────
@client_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def get_options():
    return jsonify(
        success=True,
        industries=INDUSTRIES,
        statuses=RELATIONSHIP_STATUSES,
    ), 200
    
    
    
    
@client_bp.route("/names/list", methods=["GET"])
@jwt_required()
def get_client_names():
    clients = list(mongo.db.clients.find({}, {"company_name": 1, "_id": 0}))
    names = [c["company_name"] for c in clients if c.get("company_name")]
    internal = "ZentreeLabs Pvt Ltd"
    if not any(n.lower() == internal.lower() for n in names):
        names.insert(0, internal)
    return jsonify(success=True, data=names), 200   



# ── GET /api/clients  (list + search + filter) ─────────────────────────────
@client_bp.route("/", methods=["GET"])
@jwt_required()
def get_clients():
    q          = request.args.get("q", "").strip()
    industry   = request.args.get("industry", "")
    status     = request.args.get("status", "")
    page       = int(request.args.get("page", 1))
    per_page   = int(request.args.get("per_page", 20))

    query = {}
    if q:
        query["$or"] = [
            {"company_name":    {"$regex": q, "$options": "i"}},
            {"primary_contact": {"$regex": q, "$options": "i"}},
            {"client_id":       {"$regex": q, "$options": "i"}},
        ]
    if industry:
        query["industry"] = industry
    if status:
        query["relationship_status"] = status

    total   = mongo.db.clients.count_documents(query)
    clients = list(
        mongo.db.clients.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(
        success=True,
        data=[serialize_client(c) for c in clients],
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page,
    ), 200

# ── GET /api/clients/<id> ──────────────────────────────────────────────────
@client_bp.route("/<client_id>", methods=["GET"])
@jwt_required()
def get_client(client_id):
    client, err = _find_client(client_id)
    if err:
        return err
    return jsonify(success=True, data=serialize_client(client)), 200


# ── PUT /api/clients/<id> ──────────────────────────────────────────────────
@client_bp.route("/<client_id>", methods=["PUT"])
@jwt_required()
def update_client(client_id):
    client, err = _find_client(client_id)
    if err:
        return err

    data = request.get_json(silent=True) or {}
    allowed_fields = [
        "company_name", "industry", "company_size", "location",
        "primary_contact", "contact_title", "email", "phone",
        "city", "state", "country", "address", "website",
        "agreement_type", "agreement_start", "agreement_end",
        "payment_terms", "relationship_status", "account_manager",
        "billing_rate", "notes",
    ]
    update = {k: data[k] for k in allowed_fields if k in data}
    if not update:
        return jsonify(success=False, message="No valid fields to update"), 400
    # Parse contract dates
    if "agreement_start" in update:
        update["agreement_start"] = _parse_date(update["agreement_start"])
    if "agreement_end" in update:
        update["agreement_end"] = _parse_date(update["agreement_end"])
        
        
    # Validate enum fields
    if "industry" in update and update["industry"] not in INDUSTRIES:
        return jsonify(success=False, message=f"Invalid industry"), 400
    if "relationship_status" in update and update["relationship_status"] not in RELATIONSHIP_STATUSES:
        return jsonify(success=False, message=f"Invalid relationship_status"), 400

    update["updated_at"] = datetime.utcnow()
    mongo.db.clients.update_one({"_id": client["_id"]}, {"$set": update})
    updated = mongo.db.clients.find_one({"_id": client["_id"]})
    return jsonify(success=True, message="Client updated successfully", data=serialize_client(updated)), 200


# ── DELETE /api/clients/<id> ───────────────────────────────────────────────
@client_bp.route("/<client_id>", methods=["DELETE"])
@jwt_required()
def delete_client(client_id):
    client, err = _find_client(client_id)
    if err:
        return err
    mongo.db.clients.delete_one({"_id": client["_id"]})
    return jsonify(success=True, message="Client deleted successfully"), 200


    
# -------------------------------- Client Analytics Part Routes-------------------------------
    
    
    
@client_bp.route("/analytics/all", methods=["GET"])
@jwt_required()
def all_clients_analytics():
    from flask_jwt_extended import get_jwt
    from extensions import resourcing_db  # ← make sure this is imported

    clients = list(mongo.db.clients.find({}))
    all_jobs = list(mongo.db.jobs.find({}))
    all_resumes = list(mongo.db.resumes.find({}))
    all_employees = list(mongo.db.employees.find({}))

    result = []
    grand_billing = 0.0
    grand_salary = 0.0
    grand_active_emp = 0
    grand_jds = 0
    grand_candidates = 0
    grand_hired = 0

    INTERNAL_COMPANY = "zentreelabs pvt ltd"

    # ── Internal employees (unchanged) ──────────────────────────────────────
    internal_employees = []
    internal_billing = 0.0
    internal_salary  = 0.0

    for e in all_employees:
        if (e.get("current_client") or "").lower().strip() != INTERNAL_COMPANY:
            continue
        internal_employees.append({
            "employee_id":         str(e["_id"]),
            "emp_id":              e.get("emp_id", ""),
            "name":                e.get("name", ""),
            "designation":         e.get("designation", ""),
            "department":          e.get("department", ""),
            "project_name":        e.get("current_project", ""),
            "client_billing_rate": e.get("current_billing_rate", 0),
            "billing_currency":    e.get("billing_currency", "INR"),
            "employee_salary":     e.get("salary", 0),
            "status":              e.get("status", ""),
        })
        internal_billing += e.get("current_billing_rate", 0) or 0
        internal_salary  += e.get("salary", 0) or 0

    # ── Build a set of portal client names (lowercase) for dedup ────────────
    portal_client_names_lower = {
        c["company_name"].lower().strip() for c in clients
    }

    # ── Process existing portal clients (unchanged logic) ───────────────────
    def _process_client_entry(company_name, client_meta, client_id_str):
        """
        Shared logic to compute engagements + financials for any company name.
        client_meta: the portal client doc (or None for RB-only clients).
        client_id_str: str(_id) or a synthetic id string.
        """
        client_jobs = [
            j for j in all_jobs
            if j.get("client_id") == client_id_str
            or (client_meta and j.get("client_id") == client_meta.get("client_id"))
        ]


        # Build job ID sets covering both possible link formats
        client_job_ids_str   = {str(j["_id"]) for j in client_jobs}
        client_job_ids_field = {j.get("job_id", "") for j in client_jobs}
        client_job_ids_all   = client_job_ids_str | client_job_ids_field

        # ── ZentreePortal candidates (existing) ──────────────────────────────────
        client_resumes = [
            r for r in all_resumes
            if r.get("linked_job_id") and str(r["linked_job_id"]) in client_job_ids_all
        ]
        hired_count = sum(
            1 for r in client_resumes
            if (r.get("status") or "").lower() in ("hired", "offer accepted", "joined", "placed")
        )

        # ── ResourcingBot candidates — look up by companyName in jd_details ──────
        # For RB-only clients, client_jobs is empty so client_job_ids_all is empty.
        # Instead, fetch JD IDs from jd_details by companyName, then count candidates.
        try:
            rb_jd_ids = [
                str(d["_id"])
                for d in resourcing_db["jd_details"].find(
                    {"companyName": {"$regex": f"^{re.escape(company_name.strip())}$", "$options": "i"}},
                    {"_id": 1, "jdID": 1}
                )
            ]
            rb_jd_id_strings = set()
            for d in resourcing_db["jd_details"].find(
                {"companyName": {"$regex": f"^{re.escape(company_name.strip())}$", "$options": "i"}},
                {"_id": 1, "jdID": 1}
            ):
                rb_jd_id_strings.add(str(d["_id"]))
                if d.get("jdID"):
                    rb_jd_id_strings.add(str(d["jdID"]))

            if rb_jd_id_strings:
                rb_candidates = list(
                    resourcing_db["candidate_profiles"].find(
                        {"jdID": {"$in": list(rb_jd_id_strings)}},
                        {"_id": 1, "overallStatus": 1}
                    )
                )
                rb_hired = sum(
                    1 for c in rb_candidates
                    if (c.get("overallStatus") or "").lower() in ("hired", "offer accepted", "joined", "placed", "selected")
                )
                # Merge into totals — avoid double-counting if same candidate
                # is in both systems (edge case)
                client_resumes = list(client_resumes) + rb_candidates
                hired_count   += rb_hired
        except Exception as rb_err:
            # Never crash the main analytics for a ResourcingBot lookup failure
            print(f"[analytics] RB candidate lookup failed for {company_name}: {rb_err}")

        engagements = []
        total_billing = 0.0
        total_salary  = 0.0
        active_count  = 0
        seen_active   = set()

        for e in all_employees:
            if (e.get("current_client") or "").lower().strip() != company_name.lower().strip():
                continue
            if str(e["_id"]) in seen_active:
                continue
            seen_active.add(str(e["_id"]))

            active_eng = next(
                (eng for eng in e.get("client_history", [])
                 if eng.get("client_name", "").lower().strip() == company_name.lower().strip()
                 and not eng.get("end_date")),
                None
            )
            billing_rate     = active_eng.get("billing_rate", 0) if active_eng else e.get("current_billing_rate", 0)
            billing_currency = active_eng.get("billing_currency", "INR") if active_eng else e.get("billing_currency", "INR")
            start_date       = active_eng.get("start_date") if active_eng else None
            years = None
            if start_date:
                if isinstance(start_date, str):
                    try: start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                    except: start_date = None
                if start_date:
                    years = round((datetime.utcnow() - start_date).days / 365.25, 2)

            engagements.append({
                "employee_id":         str(e["_id"]),
                "emp_id":              e.get("emp_id", ""),
                "name":                e.get("name", ""),
                "designation":         e.get("designation", ""),
                "department":          e.get("department", ""),
                "project_name":        e.get("current_project", ""),
                "role":                active_eng.get("role", "") if active_eng else "",
                "client_billing_rate": billing_rate,
                "billing_currency":    billing_currency,
                "employee_salary":     e.get("salary", 0),
                "years_on_client":     years,
                "is_active":           True,
                "start_date":          start_date.isoformat() if start_date and not isinstance(start_date, str) else start_date,
                "end_date":            None,
            })
            active_count  += 1
            total_billing += billing_rate or 0
            total_salary  += e.get("salary", 0) or 0

        for e in all_employees:
            for eng in e.get("client_history", []):
                if eng.get("client_name", "").lower().strip() != company_name.lower().strip():
                    continue
                is_active = not eng.get("end_date")
                if is_active and str(e["_id"]) in seen_active:
                    continue

                start_date = eng.get("start_date")
                end_date   = eng.get("end_date") or datetime.utcnow()
                if isinstance(start_date, str):
                    try: start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                    except: start_date = None
                if isinstance(end_date, str):
                    try: end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                    except: end_date = datetime.utcnow()
                years = round((end_date - start_date).days / 365.25, 2) if start_date else None

                engagements.append({
                    "employee_id":         str(e["_id"]),
                    "emp_id":              e.get("emp_id", ""),
                    "name":                e.get("name", ""),
                    "designation":         e.get("designation", ""),
                    "department":          e.get("department", ""),
                    "project_name":        eng.get("project_name", ""),
                    "role":                eng.get("role", ""),
                    "client_billing_rate": eng.get("billing_rate", 0),
                    "billing_currency":    eng.get("billing_currency", "INR"),
                    "employee_salary":     e.get("salary", 0),
                    "years_on_client":     years,
                    "is_active":           False,
                    "start_date":          start_date.isoformat() if start_date else None,
                    "end_date":            end_date.isoformat() if isinstance(end_date, datetime) else None,
                })
                if is_active:
                    active_count  += 1
                    total_billing += eng.get("billing_rate", 0) or 0
                    total_salary  += e.get("salary", 0) or 0

        return {
            "engagements":    engagements,
            "total_billing":  total_billing,
            "total_salary":   total_salary,
            "active_count":   active_count,
            "client_jobs":    client_jobs,
            "client_resumes": client_resumes,
            "hired_count":    hired_count,
        }

    # ── Portal clients ───────────────────────────────────────────────────────
    for client in clients:
        company_name  = client["company_name"]
        client_id_str = str(client["_id"])

        r = _process_client_entry(company_name, client, client_id_str)
        
        # ── Count RB JDs for this portal client too ──────────────────────────
        rb_jd_count_for_portal = resourcing_db["jd_details"].count_documents(
            {"companyName": {"$regex": f"^{re.escape(company_name.strip())}$", "$options": "i"}}
        )
        total_jds_combined = len(r["client_jobs"]) + rb_jd_count_for_portal
    
    
        grand_billing    += r["total_billing"]
        grand_salary     += r["total_salary"]
        grand_active_emp += r["active_count"]
        grand_jds        += total_jds_combined
        grand_candidates += len(r["client_resumes"])
        grand_hired      += r["hired_count"]

        result.append({
            "client_id":             client_id_str,
            "client_ref_id":         client.get("client_id", ""),
            "company_name":          company_name,
            "industry":              client.get("industry", ""),
            "relationship_status":   client.get("relationship_status", ""),
            "source":                "portal",          # ← tag so UI can distinguish
            "agreement_start":       client.get("agreement_start").isoformat() if isinstance(client.get("agreement_start"), datetime) else None,
            "agreement_end":         client.get("agreement_end").isoformat() if isinstance(client.get("agreement_end"), datetime) else None,
            "total_active_employees": r["active_count"],
            "total_jds":             total_jds_combined,
            "total_candidates":      len(r["client_resumes"]),
            "total_hired":           r["hired_count"],
            "conversion_rate":       round((r["hired_count"] / len(r["client_resumes"]) * 100), 1) if r["client_resumes"] else 0,
            "total_billing_revenue": r["total_billing"],
            "total_salary_cost":     r["total_salary"],
            "net_margin":            r["total_billing"] - r["total_salary"],
            "margin_pct":            round(((r["total_billing"] - r["total_salary"]) / r["total_billing"] * 100), 1) if r["total_billing"] else 0,
            "engagements":           r["engagements"],
            "jobs": [
                {
                    "job_id":     j.get("job_id"),
                    "title":      j.get("job_title") or j.get("title", ""),
                    "status":     j.get("status", ""),
                    "created_at": j.get("created_at").isoformat() if isinstance(j.get("created_at"), datetime) else None,
                }
                for j in r["client_jobs"]
            ],
        })

    # ── NEW: ResourcingBot-only clients ──────────────────────────────────────
    # Pull all distinct companyName values from jd_details (case-insensitive dedup)
    rb_company_names_raw = resourcing_db["jd_details"].distinct("companyName")

    seen_rb_lower = set()   # track which RB names we've already added

    for raw_name in rb_company_names_raw:
        if not raw_name or not raw_name.strip():
            continue

        name_lower = raw_name.strip().lower()

        # Skip if already in portal clients or already processed (handles
        # duplicate casing like "Acme" vs "ACME" in the RB collection itself)
        if name_lower in portal_client_names_lower:
            continue
        if name_lower == INTERNAL_COMPANY:
            continue
        if name_lower in seen_rb_lower:
            continue
        seen_rb_lower.add(name_lower)

        # Count JDs for this company from ResourcingBot jd_details
        rb_jd_count = resourcing_db["jd_details"].count_documents(
            {"companyName": {"$regex": f"^{raw_name.strip()}$", "$options": "i"}}
        )

        # Process employee engagements using the same shared logic
        # Pass None for client_meta and a fake id so job lookup skips portal jobs
        r = _process_client_entry(raw_name.strip(), None, "__rb_only__")

        grand_billing    += r["total_billing"]
        grand_salary     += r["total_salary"]
        grand_active_emp += r["active_count"]
        grand_jds        += rb_jd_count          # use RB JD count, not portal jobs
        grand_candidates += len(r["client_resumes"])
        grand_hired      += r["hired_count"]

        result.append({
            "client_id":              f"rb_{name_lower.replace(' ', '_')}",  # synthetic id
            "client_ref_id":          "",
            "company_name":           raw_name.strip(),
            "industry":               "",
            "relationship_status":    "ResourcingBot",   # visual tag in UI
            "source":                 "resourcing_bot",  # ← tag so UI can style differently
            "agreement_start":        None,
            "agreement_end":          None,
            "total_active_employees": r["active_count"],
            "total_jds":              rb_jd_count,
            "total_candidates":       len(r["client_resumes"]),
            "total_hired":            r["hired_count"],
            "conversion_rate":        round((r["hired_count"] / len(r["client_resumes"]) * 100), 1) if r["client_resumes"] else 0,
            "total_billing_revenue":  r["total_billing"],
            "total_salary_cost":      r["total_salary"],
            "net_margin":             r["total_billing"] - r["total_salary"],
            "margin_pct":             round(((r["total_billing"] - r["total_salary"]) / r["total_billing"] * 100), 1) if r["total_billing"] else 0,
            "engagements":            r["engagements"],
            "jobs":                   [],   # portal jobs list empty; RB JDs tracked by rb_jd_count
        })

    return jsonify(
        success=True,
        data={
            "clients": result,
            "internal": {
                "employees":     internal_employees,
                "count":         len(internal_employees),
                "total_billing": internal_billing,
                "total_salary":  internal_salary,
                "net_margin":    internal_billing - internal_salary,
            },
            "summary": {
                "total_clients":          len(result),          # now includes RB clients
                "active_clients":         sum(1 for c in clients if c.get("relationship_status") == "Active"),
                "total_active_employees": grand_active_emp,
                "total_jds":              grand_jds,
                "total_candidates":       grand_candidates,
                "total_hired":            grand_hired,
                "overall_conversion_rate": round((grand_hired / grand_candidates * 100), 1) if grand_candidates else 0,
                "total_billing_revenue":  grand_billing,
                "total_salary_cost":      grand_salary,
                "net_margin":             grand_billing - grand_salary,
                "margin_pct":             round(((grand_billing - grand_salary) / grand_billing * 100), 1) if grand_billing else 0,
            }
        }
    ), 200    
    
    