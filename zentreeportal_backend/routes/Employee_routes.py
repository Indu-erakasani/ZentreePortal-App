
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


# ── GET /api/employees/meta/options ─────────────────────────────────────────
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


# ── GET /api/employees/stats ─────────────────────────────────────────────────
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
        "by_status":      by_status,
        "by_department":  by_dept,
        "active_clients": len(active_clients),
    }), 200


# ── GET /api/employees/ ──────────────────────────────────────────────────────
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
    return jsonify(success=True, data=[serialize_employee(d) for d in docs],
                   total=total, page=page, per_page=per_page), 200


# ── POST /api/employees/ ─────────────────────────────────────────────────────
@employee_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    for f in ["name", "email"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    if mongo.db.employees.find_one({"email": data["email"].lower().strip()}):
        return jsonify(success=False, message="An employee with this email already exists"), 409

    try:
        emp_id = _next_emp_id()
        doj    = None
        if data.get("date_of_joining"):
            try:
                doj = datetime.fromisoformat(data["date_of_joining"].replace("Z", "+00:00"))
            except Exception:
                doj = None

        doc = employee_schema(
            name                  = data["name"],
            email                 = data["email"],
            emp_id                = emp_id,
            phone                 = data.get("phone", ""),
            designation           = data.get("designation", ""),
            department            = data.get("department", "Engineering"),
            employment_type       = data.get("employment_type", "Permanent"),
            date_of_joining       = doj,
            skills                = data.get("skills", ""),
            experience            = data.get("experience", 0),
            location              = data.get("location", ""),
            reporting_manager     = data.get("reporting_manager", ""),
            status                = data.get("status", "Active"),
            current_client        = data.get("current_client", ""),
            current_project       = data.get("current_project", ""),
            current_billing_rate  = data.get("current_billing_rate", 0),
            billing_currency      = data.get("billing_currency", "INR"),
            salary                = data.get("salary", 0),
            notes                 = data.get("notes", ""),
        )
        result = mongo.db.employees.insert_one(doc)
        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Employee created", data=serialize_employee(doc)), 201
    except ValueError as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# ── GET /api/employees/<id> ──────────────────────────────────────────────────
@employee_bp.route("/<eid>", methods=["GET"])
@jwt_required()
def get_one(eid):
    doc, err = _find(eid)
    if err:
        return err
    return jsonify(success=True, data=serialize_employee(doc)), 200


# ── PUT /api/employees/<id> ──────────────────────────────────────────────────
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
    mongo.db.employees.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_employee(updated)), 200


# ── DELETE /api/employees/<id> ───────────────────────────────────────────────
@employee_bp.route("/<eid>", methods=["DELETE"])
@jwt_required()
def delete(eid):
    doc, err = _find(eid)
    if err:
        return err
    mongo.db.employees.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Employee deleted"), 200


# ── POST /api/employees/<id>/engagement — add client engagement ──────────────
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
        start = None
        end   = None
        if data.get("start_date"):
            try:
                start = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
            except Exception:
                start = datetime.utcnow()
        if data.get("end_date"):
            try:
                end = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00"))
            except Exception:
                end = None

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
            {
                "$push": {"client_history": eng},
                "$set":  {
                    "updated_at":           datetime.utcnow(),
                    "current_client":       data["client_name"] if not end else doc.get("current_client", ""),
                    "current_project":      data.get("project_name", "") if not end else doc.get("current_project", ""),
                    "current_billing_rate": data.get("billing_rate", 0) if not end else doc.get("current_billing_rate", 0),
                    "billing_currency":     data.get("billing_currency", "INR") if not end else doc.get("billing_currency", "INR"),
                },
            },
        )
        updated = mongo.db.employees.find_one({"_id": doc["_id"]})
        return jsonify(success=True, message="Engagement added", data=serialize_employee(updated)), 200
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500


# ── PUT /api/employees/<id>/engagement/<idx> — mark engagement as ended ──────
@employee_bp.route("/<eid>/engagement/<int:idx>", methods=["PUT"])
@jwt_required()
def end_engagement(eid, idx):
    doc, err = _find(eid)
    if err:
        return err
    history = doc.get("client_history", [])
    if idx >= len(history):
        return jsonify(success=False, message="Engagement index out of range"), 400
    data = request.get_json(silent=True) or {}
    end_date = datetime.utcnow()
    if data.get("end_date"):
        try:
            end_date = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00"))
        except Exception:
            pass
    mongo.db.employees.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            f"client_history.{idx}.end_date": end_date,
            "updated_at": datetime.utcnow(),
        }},
    )
    updated = mongo.db.employees.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Engagement ended", data=serialize_employee(updated)), 200