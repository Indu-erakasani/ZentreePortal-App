from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from extensions import mongo
from models.Employee_model import (
    employee_schema, engagement_schema, serialize_employee,
    EMPLOYEE_STATUSES, EMPLOYMENT_TYPES, BILLING_CURRENCIES, DEPARTMENTS,
)
from models.Onboarding_model import *

employee_bp = Blueprint("employees", __name__)


def _find(eid: str):
    try:
        oid = ObjectId(eid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid employee ID"), 400)
    doc = mongo.db.employees.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Employee not found"), 404)
    return doc, None


def _next_emp_id() -> str:
    count = mongo.db.employees.count_documents({})
    return f"EMP{str(count + 1).zfill(3)}"
def _serialize_with_contract(doc):
    data = serialize_employee(doc)
    current_client = (doc.get("current_client") or "").strip().lower()
    active_eng = next(
        (e for e in doc.get("client_history", [])
         if _is_engagement_active_now(e)
         and (e.get("client_name", "") or "").strip().lower() == current_client),
        None
    )
    end = _to_dt(active_eng.get("end_date")) if active_eng else None
    data["current_engagement_end_date"] = end.isoformat() if end else None
    return data
def _to_dt(value):
    """Coerce a Mongo value (datetime, ISO string, or None) into a naive datetime, or None."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.replace(tzinfo=None) if value.tzinfo else value
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt.replace(tzinfo=None) if dt.tzinfo else dt
    except Exception:
        return None


def _is_engagement_active_now(eng):
    """Active = started in past/now AND (no end_date OR end_date is in the future)."""
    now = datetime.utcnow()

    end = _to_dt(eng.get("end_date"))
    if end and end <= now:
        return False  # ended

    start = _to_dt(eng.get("start_date"))
    if start and start > now:
        return False  # not started yet

    return True


def _recompute_employee_current_state(employee_doc):
    """
    Re-derive current_client / current_project / current_billing_rate / status
    from client_history, based on whichever engagement (if any) is active *now*.

    - Active engagement exists  -> employee is "Active", current_* mirrors it.
    - No active engagement      -> employee goes "On Bench" ONLY once the
      previously-active engagement's end_date has actually passed.
    - Statuses other than "Active"/"On Bench" (e.g. "Resigned", "On Leave")
      are left untouched.
    """
    now = datetime.utcnow()
    history = employee_doc.get("client_history", [])
    current_status = employee_doc.get("status", "")

    active_engs = [e for e in history if _is_engagement_active_now(e)]
    active_eng = None
    if active_engs:
        active_eng = max(active_engs, key=lambda e: _to_dt(e.get("start_date")) or datetime.min)

    update = {}

    if active_eng:
        update["current_client"]       = active_eng.get("client_name", "")
        update["current_project"]      = active_eng.get("project_name", "")
        update["current_billing_rate"] = active_eng.get("billing_rate", 0) or 0
        update["billing_currency"]     = active_eng.get("billing_currency", "INR")
        if current_status == "On Bench":
            update["status"] = "Active"
    else:
        if current_status == "Active":
            update["current_client"]       = ""
            update["current_project"]      = ""
            update["current_billing_rate"] = 0
            update["status"]               = "On Bench"

    if update:
        update["updated_at"] = now
        mongo.db.employees.update_one({"_id": employee_doc["_id"]}, {"$set": update})

def _months_between(start, end):
    if not start or not end or end <= start:
        return 0.0
    return (end - start).days / 30.0


def _prorated_total(history, default_rate, period_start, period_end):
    """
    Sum of monthly_rate * months_active over [period_start, period_end],
    using a billing_history/salary_history list of {rate, effective_from}.
    Falls back to default_rate if history is empty.
    """
    if period_end <= period_start:
        return 0.0
    if not history:
        return round((default_rate or 0) * _months_between(period_start, period_end), 2)

    sorted_hist = sorted(history, key=lambda h: _to_dt(h.get("effective_from")) or datetime.min)
    total = 0.0

    # Time before the first recorded rate change — use that rate retroactively
    first_start = _to_dt(sorted_hist[0].get("effective_from"))
    if first_start and first_start > period_start:
        total += (sorted_hist[0].get("rate", default_rate) or default_rate or 0) \
                 * _months_between(period_start, first_start)

    for i, h in enumerate(sorted_hist):
        seg_start = _to_dt(h.get("effective_from")) or period_start
        seg_end   = _to_dt(sorted_hist[i + 1].get("effective_from")) if i + 1 < len(sorted_hist) else None
        lo = max(seg_start, period_start)
        hi = min(seg_end, period_end) if seg_end else period_end
        if hi > lo:
            total += (h.get("rate", 0) or 0) * _months_between(lo, hi)

    return round(total, 2)


def _merge_intervals(intervals):
    """intervals: list of (start, end) datetimes; end=None means open-ended (now)."""
    now = datetime.utcnow()
    norm = [(s, e or now) for s, e in intervals if s]
    norm.sort(key=lambda x: x[0])

    merged = []
    for s, e in norm:
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return merged


def _compute_bench_periods(doc):
    """Gaps in client_history coverage between date_of_joining and now."""
    now = datetime.utcnow()
    doj = _to_dt(doc.get("date_of_joining")) or now

    intervals = [
        (_to_dt(eng.get("start_date")), _to_dt(eng.get("end_date")))
        for eng in doc.get("client_history", [])
        if _to_dt(eng.get("start_date"))
    ]
    merged = _merge_intervals(intervals)

    bench_periods = []
    cursor = doj
    for s, e in merged:
        if s > cursor:
            bench_periods.append({"start": cursor.isoformat(), "end": s.isoformat(),
                                   "days": (s - cursor).days, "ongoing": False})
        cursor = max(cursor, e)
    if cursor < now:
        bench_periods.append({"start": cursor.isoformat(), "end": now.isoformat(),
                               "days": (now - cursor).days, "ongoing": True})

    return bench_periods, sum(p["days"] for p in bench_periods)



@employee_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def options():
    return jsonify(
        success=True,
        statuses=EMPLOYEE_STATUSES,
        employment_types=EMPLOYMENT_TYPES,
        billing_currencies=BILLING_CURRENCIES,
        departments=DEPARTMENTS,
    ), 200


@employee_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    by_status = list(mongo.db.employees.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]))
    by_dept = list(mongo.db.employees.aggregate([
        {"$group": {"_id": "$department", "count": {"$sum": 1}}}
    ]))
    active_clients = mongo.db.employees.distinct(
        "current_client",
        {"status": "Active", "current_client": {"$ne": ""}},
    )
    return jsonify(success=True, data={
        "by_status":     by_status,
        "by_department": by_dept,
        "active_clients": len(active_clients),
    }), 200


@employee_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    q          = request.args.get("q", "").strip()
    status     = request.args.get("status", "")
    department = request.args.get("department", "")
    client     = request.args.get("client", "")
    page       = int(request.args.get("page", 1))
    per_page   = int(request.args.get("per_page", 50))

    query = {}
    if q:
        query["$or"] = [
            {"name":        {"$regex": q, "$options": "i"}},
            {"emp_id":      {"$regex": q, "$options": "i"}},
            {"designation": {"$regex": q, "$options": "i"}},
            {"skills":      {"$regex": q, "$options": "i"}},
        ]
    if status:     query["status"]         = status
    if department: query["department"]     = department
    if client:     query["current_client"] = {"$regex": client, "$options": "i"}

    total = mongo.db.employees.count_documents(query)
    docs  = list(
        mongo.db.employees.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(success=True, data=[_serialize_with_contract(d) for d in docs],
                   total=total, page=page, per_page=per_page), 200


@employee_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    for f in ["name", "email"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    if mongo.db.employees.find_one({"email": data["email"].lower().strip()}):
        return jsonify(success=False, message="An employee with this email already exists"), 409

    #  Use user-provided emp_id, fall back to auto-generate only if blank
    emp_id = data.get("emp_id", "").strip().upper() or _next_emp_id()

    # Check uniqueness of the chosen ID
    if mongo.db.employees.find_one({"emp_id": emp_id}):
        return jsonify(success=False, message=f"Employee ID '{emp_id}' is already in use"), 409

    try:
        doj = None
        if data.get("date_of_joining"):
            try:
                doj = datetime.fromisoformat(data["date_of_joining"].replace("Z", "+00:00"))
            except Exception:
                doj = None

        doc = employee_schema(
            name                 = data["name"],
            email                = data["email"],
            emp_id               = emp_id,           # ← now uses the resolved emp_id
            phone                = data.get("phone", ""),
            designation          = data.get("designation", ""),
            department           = data.get("department", "Engineering"),
            employment_type      = data.get("employment_type", "Permanent"),
            date_of_joining      = doj,
            skills               = data.get("skills", ""),
            experience           = data.get("experience", 0),
            location             = data.get("location", ""),
            reporting_manager    = data.get("reporting_manager", ""),
            status               = data.get("status", "Active"),
            current_client       = data.get("current_client", ""),
            current_project      = data.get("current_project", ""),
            current_billing_rate = data.get("current_billing_rate", 0),
            billing_currency     = data.get("billing_currency", "INR"),
            salary               = data.get("salary", 0),
            notes                = data.get("notes", ""),
        )
        result     = mongo.db.employees.insert_one(doc)
        doc["_id"] = result.inserted_id

        ob = onboarding_schema(str(result.inserted_id), joining_date=doj)
        mongo.db.onboarding.insert_one(ob)
        
        # ── Auto-create first client engagement if client is provided ──
        if data.get("current_client", "").strip():
            eng = engagement_schema(
                client_name      = data["current_client"].strip(),
                project_name     = data.get("current_project", ""),
                role             = data.get("designation", ""),
                start_date       = doj or datetime.utcnow(),
                end_date         = None,
                billing_rate     = data.get("current_billing_rate", 0),
                billing_currency = data.get("billing_currency", "INR"),
                work_location    = data.get("location", ""),
                technology       = data.get("skills", ""),
                notes            = "Auto-created on employee registration",
            )
            mongo.db.employees.update_one(
                {"_id": result.inserted_id},
                {"$push": {"client_history": eng}}
            )
            doc = mongo.db.employees.find_one({"_id": result.inserted_id})
        # ── Seed salary history with the initial salary ──
        if data.get("salary"):
            mongo.db.employees.update_one(
                {"_id": result.inserted_id},
                {"$push": {"salary_history": {
                    "rate":           float(data.get("salary", 0)),
                    "effective_from": doj or datetime.utcnow(),
                    "note":           "Initial salary",
                }}}
            )
            doc = mongo.db.employees.find_one({"_id": result.inserted_id})

        return jsonify(success=True, message="Employee created", data=serialize_employee(doc)), 201
    except ValueError as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@employee_bp.route("/<eid>/salary", methods=["POST"])
@jwt_required()
def update_salary(eid):
    """Record a salary change (increment/decrement) with history."""
    doc, err = _find(eid)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    new_salary = float(data.get("salary", 0))
    note = data.get("note", "")
    effective_from = datetime.utcnow()
    if data.get("effective_from"):
        try:
            effective_from = datetime.fromisoformat(data["effective_from"].replace("Z", "+00:00"))
        except Exception:
            pass

    mongo.db.employees.update_one(
        {"_id": doc["_id"]},
        {
            "$set":  {"salary": new_salary, "updated_at": datetime.utcnow()},
            "$push": {"salary_history": {
                "rate": new_salary, "effective_from": effective_from, "note": note,
            }},
        }
    )
    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Salary updated", data=_serialize_with_contract(updated)), 200



@employee_bp.route("/<eid>", methods=["GET"])
@jwt_required()
def get_one(eid):
    doc, err = _find(eid)
    if err:
        return err
    return jsonify(success=True, data=_serialize_with_contract(doc)), 200


@employee_bp.route("/<eid>", methods=["PUT"])
@jwt_required()
def update(eid):
    doc, err = _find(eid)
    if err:
        return err
    data    = request.get_json(silent=True) or {}
    allowed = [
        "name", "phone", "designation", "department", "employment_type",
        "date_of_joining", "skills", "experience", "location",
        "reporting_manager", "status", "current_client", "current_project",
        "current_billing_rate", "billing_currency", "salary", "notes",
    ]
    upd = {k: data[k] for k in allowed if k in data}
    if "status" in upd and upd["status"] not in EMPLOYEE_STATUSES:
        return jsonify(success=False, message="Invalid status"), 400
    if "date_of_joining" in upd and isinstance(upd["date_of_joining"], str):
        try:
            upd["date_of_joining"] = datetime.fromisoformat(
                upd["date_of_joining"].replace("Z", "+00:00")
            )
        except Exception:
            upd.pop("date_of_joining", None)

    upd["updated_at"] = datetime.utcnow()
    # ── Auto-track salary changes made via the edit form ──
    if "salary" in upd:
        old_salary = float(doc.get("salary", 0) or 0)
        new_salary = float(upd["salary"] or 0)
        if new_salary != old_salary:
            mongo.db.employees.update_one(
                {"_id": doc["_id"]},
                {"$push": {"salary_history": {
                    "rate": new_salary,
                    "effective_from": datetime.utcnow(),
                    "note": "Updated via employee edit",
                }}}
            )
    # ── Auto-create engagement if client changed ──
    new_client = upd.get("current_client", "").strip()
    old_client = doc.get("current_client", "").strip()

    if new_client and new_client != old_client:
        # Close existing active engagement (no end_date)
        history = doc.get("client_history", [])
        for i, eng in enumerate(history):
            if not eng.get("end_date"):
                mongo.db.employees.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {f"client_history.{i}.end_date": datetime.utcnow()}}
                )

        # Push new engagement
        new_eng = engagement_schema(
            client_name      = new_client,
            project_name     = upd.get("current_project", doc.get("current_project", "")),
            role             = upd.get("designation", doc.get("designation", "")),
            start_date       = datetime.utcnow(),
            end_date         = None,
            billing_rate     = upd.get("current_billing_rate", doc.get("current_billing_rate", 0)),
            billing_currency = upd.get("billing_currency", doc.get("billing_currency", "INR")),
            work_location    = upd.get("location", doc.get("location", "")),
            technology       = upd.get("skills", doc.get("skills", "")),
            notes            = "Auto-created on client reassignment",
        )
        upd_copy = dict(upd)  # avoid mutating upd
        mongo.db.employees.update_one(
            {"_id": doc["_id"]},
            {"$set": upd_copy, "$push": {"client_history": new_eng}}
        )
        updated = mongo.db.employees.find_one({"_id": doc["_id"]})
        return jsonify(success=True, message="Updated", data=serialize_employee(updated)), 200

    # Default update (no client change)
    mongo.db.employees.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_employee(updated)), 200


@employee_bp.route("/<eid>", methods=["DELETE"])
@jwt_required()
def delete(eid):
    doc, err = _find(eid)
    if err:
        return err
    mongo.db.employees.delete_one({"_id": doc["_id"]})
    mongo.db.onboarding.delete_one({"employee_id": eid})   # clean up onboarding too
    return jsonify(success=True, message="Employee deleted"), 200


@employee_bp.route("/<eid>/engagement", methods=["POST"])
@jwt_required()
def add_engagement(eid):
    doc, err = _find(eid)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    if not data.get("client_name"):
        return jsonify(success=False, message="'client_name' is required"), 400
    try:
        start = end = None
        if data.get("start_date"):
            try:
                start = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
            except Exception:
                start = datetime.utcnow()
        if data.get("end_date"):
            try:
                end = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00"))
            except Exception:
                pass

        eng = engagement_schema(
            client_name      = data["client_name"],
            project_name     = data.get("project_name", ""),
            role             = data.get("role", ""),
            start_date       = start,
            end_date         = end,
            billing_rate     = data.get("billing_rate", 0),
            billing_currency = data.get("billing_currency", "INR"),
            work_location    = data.get("work_location", ""),
            technology       = data.get("technology", ""),
            notes            = data.get("notes", ""),
        )
        mongo.db.employees.update_one(
            {"_id": doc["_id"]},
            {"$push": {"client_history": eng},
             "$set": {
                 "updated_at":           datetime.utcnow(),
                 "current_client":       data["client_name"] if not end else doc.get("current_client", ""),
                 "current_project":      data.get("project_name", "") if not end else doc.get("current_project", ""),
                 "current_billing_rate": data.get("billing_rate", 0) if not end else doc.get("current_billing_rate", 0),
                 "billing_currency":     data.get("billing_currency", "INR") if not end else doc.get("billing_currency", "INR"),
             }},
        )
        updated = mongo.db.employees.find_one({"_id": doc["_id"]})
        _recompute_employee_current_state(updated)

        updated = mongo.db.employees.find_one({"_id": doc["_id"]})
        return jsonify(success=True, message="Engagement added", data=serialize_employee(updated)), 200
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


@employee_bp.route("/<eid>/engagement/<int:idx>/end", methods=["PUT"])
@jwt_required()
def end_engagement(eid, idx):
    doc, err = _find(eid)
    if err:
        return err
    history = doc.get("client_history", [])
    if idx >= len(history):
        return jsonify(success=False, message="Engagement index out of range"), 400
    data     = request.get_json(silent=True) or {}
    end_date = datetime.utcnow()
    if data.get("end_date"):
        try:
            end_date = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00"))
        except Exception:
            pass
    mongo.db.employees.update_one(
        {"_id": doc["_id"]},
        {"$set": {f"client_history.{idx}.end_date": end_date, "updated_at": datetime.utcnow()}},
    )

    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    _recompute_employee_current_state(updated)
    
    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Engagement ended", data=serialize_employee(updated)), 200




# billing rate update endpoint from the client
@employee_bp.route("/<eid>/engagement/<int:idx>/billing", methods=["POST"])
@jwt_required()
def update_billing_rate(eid, idx):
    """Add a new billing rate entry to an engagement's history."""
    doc, err = _find(eid)
    if err:
        return err
    history = doc.get("client_history", [])
    if idx >= len(history):
        return jsonify(success=False, message="Engagement index out of range"), 400
    data = request.get_json(silent=True) or {}
    new_rate = float(data.get("billing_rate", 0))
    currency = data.get("billing_currency", "INR")
    note     = data.get("note", "")
    effective_from = datetime.utcnow()
    if data.get("effective_from"):
        try:
            effective_from = datetime.fromisoformat(data["effective_from"].replace("Z", "+00:00"))
        except Exception:
            pass

    history_entry = {
        "rate":           new_rate,
        "currency":       currency,
        "effective_from": effective_from,
        "note":           note,
    }
    mongo.db.employees.update_one(
        {"_id": doc["_id"]},
        {
            "$set":  {
                f"client_history.{idx}.billing_rate":     new_rate,
                f"client_history.{idx}.billing_currency": currency,
                "updated_at": datetime.utcnow(),
            },
            "$push": { f"client_history.{idx}.billing_history": history_entry },
        }
    )
    # If this is the active engagement, also update top-level current_billing_rate
    if not history[idx].get("end_date"):
        mongo.db.employees.update_one(
            {"_id": doc["_id"]},
            {"$set": {"current_billing_rate": new_rate, "billing_currency": currency}}
        )
    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Billing rate updated", data=serialize_employee(updated)), 200



@employee_bp.route("/<eid>/engagement/<int:idx>", methods=["PUT"])
@jwt_required()
def update_engagement(eid, idx):
    """Edit any field of an existing engagement by index."""
    doc, err = _find(eid)
    if err:
        return err
    history = doc.get("client_history", [])
    if idx >= len(history):
        return jsonify(success=False, message="Engagement index out of range"), 400

    data    = request.get_json(silent=True) or {}
    allowed = ["client_name", "project_name", "role", "work_location", "technology", "notes",
               "billing_rate", "billing_currency", "start_date", "end_date"]
    upd = {}
    for k in allowed:
        if k in data:
            upd[f"client_history.{idx}.{k}"] = data[k]

    # Parse dates
    for df in ("start_date", "end_date"):
        key = f"client_history.{idx}.{df}"
        if key in upd:
            if upd[key]:
                try:
                    upd[key] = datetime.fromisoformat(str(upd[key]).replace("Z", "+00:00"))
                except Exception:
                    upd.pop(key, None)
            else:
                upd[key] = None   # allow clearing end_date to re-activate

    if "billing_rate" in data:
        upd[f"client_history.{idx}.billing_rate"] = float(data["billing_rate"])

    upd["updated_at"] = datetime.utcnow()

    # If this is the active engagement (no end_date after edit), sync top-level fields
    is_active_after = not (data.get("end_date") or history[idx].get("end_date"))
    if is_active_after:
        if "billing_rate"     in data: upd["current_billing_rate"] = float(data["billing_rate"])
        if "billing_currency" in data: upd["billing_currency"]     = data["billing_currency"]
        if "client_name"      in data: upd["current_client"]       = data["client_name"]
        if "project_name"     in data: upd["current_project"]      = data["project_name"]

    mongo.db.employees.update_one({"_id": doc["_id"]}, {"$set": upd})

    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    _recompute_employee_current_state(updated)

    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Engagement updated", data=serialize_employee(updated)), 200



# ------------------------employee lifecycle endpoint---------------------------
def _fmt_tenure(days):
    total_months = round(days / 30.44)
    yrs = total_months // 12
    mos = total_months % 12
    if yrs == 0:   return f"{mos} mo"
    if mos == 0:   return f"{yrs} yr"
    return f"{yrs} yr {mos} mo"
@employee_bp.route("/<eid>/lifecycle", methods=["GET"])
@jwt_required()
def get_lifecycle(eid):
    doc, err = _find(eid)
    if err:
        return err

    now = datetime.utcnow()
    doj = _to_dt(doc.get("date_of_joining")) or _to_dt(doc.get("created_at")) or now
    tenure_days = max((now - doj).days, 0)

    # ── Bench periods ──
    bench_periods, total_bench_days = _compute_bench_periods(doc)

    # ── Client engagements + revenue (per-engagement, prorated via billing_history) ──
    engagements, revenue_by_client = [], {}
    total_revenue = 0.0

    for eng in doc.get("client_history", []):
        start = _to_dt(eng.get("start_date")) or now
        end   = _to_dt(eng.get("end_date")) or now

        raw_billing_hist = eng.get("billing_history", [])
        
        # ── FIX: only keep billing history entries within the engagement period ──
        # If effective_from is outside [start, end], it corrupts _prorated_total
        clipped_billing_hist = [
            bh for bh in raw_billing_hist
            if _to_dt(bh.get("effective_from")) and
            start <= _to_dt(bh.get("effective_from")) <= end
        ]
        
        # Normalize annual → monthly
        monthly_billing_hist = [
            {**bh, "rate": (bh.get("rate", 0) or 0) / 12}
            for bh in clipped_billing_hist
        ]
        monthly_rate = (eng.get("billing_rate", 0) or 0) / 12
        revenue = _prorated_total(monthly_billing_hist, monthly_rate, start, end)        
        
        total_revenue += revenue
        client = eng.get("client_name", "Unknown")
        revenue_by_client[client] = revenue_by_client.get(client, 0) + revenue

        engagements.append({
            "client_name":       client,
            "project_name":      eng.get("project_name", ""),
            "role":              eng.get("role", ""),
            "start_date":        start.isoformat(),
            "end_date":          end.isoformat() if eng.get("end_date") else None,
            "is_active":         _is_engagement_active_now(eng),
            "billing_rate":      eng.get("billing_rate", 0) or 0,
            "billing_currency":  eng.get("billing_currency", "INR"),
            "billing_history":   eng.get("billing_history", []),
            "revenue_generated": round(revenue, 2),
        })

    revenue_by_client = [
        {"client_name": k, "total_revenue": round(v, 2)}
        for k, v in sorted(revenue_by_client.items(), key=lambda x: -x[1])
    ]

    # # ── Salary history + increments ──

    salary_history = sorted(
        doc.get("salary_history", []),
        key=lambda h: _to_dt(h.get("effective_from")) or datetime.min
    )
    if not salary_history:
        salary_history = [{"rate": doc.get("salary", 0) or 0,
                            "effective_from": doj.isoformat(), "note": "Initial salary"}]

    increments = []
    for i in range(1, len(salary_history)):
        prev, curr = salary_history[i - 1], salary_history[i]
        diff = (curr.get("rate", 0) or 0) - (prev.get("rate", 0) or 0)
        pct  = round((diff / prev["rate"] * 100), 2) if prev.get("rate") else 0
        increments.append({
            "effective_from":  curr.get("effective_from"),
            "from_rate":       prev.get("rate", 0),
            "to_rate":         curr.get("rate", 0),
            "increase_amount": round(diff, 2),
            "increase_pct":    pct,
            "note":            curr.get("note", ""),
        })

    # ── FIX: normalize annual → monthly before prorating ──
    monthly_salary_hist = [
        {**s, "rate": (s.get("rate", 0) or 0) / 12}
        for s in salary_history
    ]
    monthly_salary_default = (doc.get("salary", 0) or 0) / 12

    # This now correctly accounts for increments too
    total_salary_paid = _prorated_total(
        monthly_salary_hist,        # ← monthly rates with correct effective_from dates
        monthly_salary_default,     # ← fallback monthly rate
        doj,
        now
    )

    return jsonify(success=True, data={
        "date_of_joining":         doj.isoformat(),
        "tenure_days":             tenure_days,
        "tenure_years":            round(tenure_days / 365.25, 2),
        "tenure_readable":   _fmt_tenure(tenure_days),
        "bench_periods":           bench_periods,
        "total_bench_days":        total_bench_days,
        "engagements":             engagements,
        "revenue_by_client":       revenue_by_client,
        "total_revenue_generated": round(total_revenue, 2),
        "salary_history":          salary_history,
        "salary_increments":       increments,
        "total_salary_paid":       total_salary_paid,
        "net_contribution":        round(total_revenue - total_salary_paid, 2),
    }), 200