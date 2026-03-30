"""
Placement routes: /api/placements/...
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
from extensions import mongo
from models.Placement_model import (
    placement_schema, serialize_placement,
    PAYMENT_STATUSES, CANDIDATE_STATUSES,
)

placement_bp = Blueprint("placements", __name__)


def _find(pid: str):
    try:
        oid = ObjectId(pid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid placement ID"), 400)
    doc = mongo.db.placements.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Placement not found"), 404)
    return doc, None


def _next_placement_id() -> str:
    count = mongo.db.placements.count_documents({})
    return f"PLC{str(count + 1).zfill(3)}"


def _next_invoice_number() -> str:
    count = mongo.db.placements.count_documents({})
    return f"INV-{datetime.utcnow().year}-{str(count + 1).zfill(3)}"


# ── GET /api/placements/ ──────────────────────────────────────────────────────
@placement_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    client_name    = request.args.get("client_name", "")
    recruiter      = request.args.get("recruiter", "")
    payment_status = request.args.get("payment_status", "")
    start_date     = request.args.get("start_date", "")
    end_date       = request.args.get("end_date", "")
    q              = request.args.get("q", "").strip()
    page           = int(request.args.get("page", 1))
    per_page       = int(request.args.get("per_page", 20))

    query = {}
    if client_name:    query["client_name"]    = {"$regex": client_name, "$options": "i"}
    if recruiter:      query["recruiter"]       = recruiter
    if payment_status: query["payment_status"]  = payment_status
    if q:
        query["$or"] = [
            {"candidate_name": {"$regex": q, "$options": "i"}},
            {"job_title":      {"$regex": q, "$options": "i"}},
            {"client_name":    {"$regex": q, "$options": "i"}},
        ]
    if start_date or end_date:
        query["joining_date"] = {}
        if start_date: query["joining_date"]["$gte"] = datetime.fromisoformat(start_date)
        if end_date:   query["joining_date"]["$lte"] = datetime.fromisoformat(end_date)

    total = mongo.db.placements.count_documents(query)
    docs  = list(
        mongo.db.placements.find(query)
        .sort("joining_date", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(success=True, data=[serialize_placement(d) for d in docs],
                   total=total, page=page, per_page=per_page), 200


# ── GET /api/placements/stats ─────────────────────────────────────────────────
@placement_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    overall = list(mongo.db.placements.aggregate([
        {"$group": {
            "_id":           None,
            "total":         {"$sum": 1},
            "total_billing": {"$sum": "$billing_amount"},
            "avg_time":      {"$avg": "$time_to_fill"},
        }}
    ]))
    by_recruiter = list(mongo.db.placements.aggregate([
        {"$group": {"_id": "$recruiter", "count": {"$sum": 1}, "revenue": {"$sum": "$billing_amount"}}},
        {"$sort": {"revenue": -1}},
    ]))
    by_client = list(mongo.db.placements.aggregate([
        {"$group": {"_id": "$client_name", "count": {"$sum": 1}, "revenue": {"$sum": "$billing_amount"}}},
        {"$sort": {"revenue": -1}},
    ]))
    return jsonify(success=True, data={
        "overall":     overall[0] if overall else {},
        "by_recruiter": by_recruiter,
        "by_client":    by_client,
    }), 200


# ── GET /api/placements/:id ───────────────────────────────────────────────────
@placement_bp.route("/<pid>", methods=["GET"])
@jwt_required()
def get_one(pid):
    doc, err = _find(pid)
    if err: return err
    return jsonify(success=True, data=serialize_placement(doc)), 200


# ── POST /api/placements/ ─────────────────────────────────────────────────────
@placement_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    required = ["resume_id", "candidate_name", "job_id", "client_name",
                "job_title", "recruiter", "joining_date", "final_ctc", "billing_amount"]
    for f in required:
        if not data.get(f) and data.get(f) != 0:
            return jsonify(success=False, message=f"'{f}' is required"), 400
    try:
        doc = placement_schema(
            resume_id             = data["resume_id"],
            candidate_name        = data["candidate_name"],
            job_id                = data["job_id"],
            client_name           = data["client_name"],
            job_title             = data["job_title"],
            recruiter             = data["recruiter"],
            offer_date            = datetime.fromisoformat(data["offer_date"]) if data.get("offer_date") else datetime.utcnow(),
            joining_date          = datetime.fromisoformat(data["joining_date"]),
            final_ctc             = float(data["final_ctc"]),
            billing_amount        = float(data["billing_amount"]),
            billing_percentage    = float(data.get("billing_percentage", 0)),
            invoice_number        = _next_invoice_number(),
            payment_status        = data.get("payment_status", "Pending"),
            account_manager       = data.get("account_manager", ""),
            candidate_status      = data.get("candidate_status", "Active"),
            guarantee_period      = int(data.get("guarantee_period", 90)),
            notes                 = data.get("notes", ""),
            time_to_fill          = int(data.get("time_to_fill", 0)),
        )
        # Add placement ID
        doc["placement_id"] = _next_placement_id()
        result = mongo.db.placements.insert_one(doc)
        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Placement created", data=serialize_placement(doc)), 201
    except (ValueError, KeyError) as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message="Failed to create", error=str(e)), 500


# ── PUT /api/placements/:id ───────────────────────────────────────────────────
@placement_bp.route("/<pid>", methods=["PUT"])
@jwt_required()
def update(pid):
    doc, err = _find(pid)
    if err: return err

    data = request.get_json(silent=True) or {}
    allowed = [
        "candidate_status", "payment_status", "payment_received_date",
        "payment_due_date", "invoice_number", "invoice_date",
        "account_manager", "recruiter", "notes",
        "replacement_required", "final_ctc", "billing_amount",
        "billing_percentage", "joining_date", "offer_date",
        "guarantee_period",
    ]
    upd = {k: data[k] for k in allowed if k in data}

    if "payment_status" in upd and upd["payment_status"] not in PAYMENT_STATUSES:
        return jsonify(success=False, message="Invalid payment_status"), 400
    if "candidate_status" in upd and upd["candidate_status"] not in CANDIDATE_STATUSES:
        return jsonify(success=False, message="Invalid candidate_status"), 400

    # Recalculate guarantee_end_date if joining_date or guarantee_period changes
    joining = doc.get("joining_date", datetime.utcnow())
    if "joining_date" in upd:
        joining = datetime.fromisoformat(upd["joining_date"]) if isinstance(upd["joining_date"], str) else upd["joining_date"]
    gp = int(upd.get("guarantee_period", doc.get("guarantee_period", 90)))
    upd["guarantee_end_date"] = joining + timedelta(days=gp)
    upd["updated_at"] = datetime.utcnow()

    mongo.db.placements.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.placements.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_placement(updated)), 200


# ── DELETE /api/placements/:id ────────────────────────────────────────────────
@placement_bp.route("/<pid>", methods=["DELETE"])
@jwt_required()
def delete(pid):
    doc, err = _find(pid)
    if err: return err
    mongo.db.placements.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Placement deleted"), 200