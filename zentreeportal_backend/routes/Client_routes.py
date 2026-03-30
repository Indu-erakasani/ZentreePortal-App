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
            agreement_type  = data.get("agreement_type", ""),
            agreement_start = data.get("agreement_start"),
            agreement_end   = data.get("agreement_end"),
            payment_terms   = data.get("payment_terms", "Net 30"),
            relationship_status = data.get("relationship_status", "Active"),
            account_manager = data.get("account_manager", ""),
            billing_rate    = float(data.get("billing_rate", 0)),
            notes           = data.get("notes", ""),
        )
        result = mongo.db.clients.insert_one(doc)
        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Client created successfully", data=serialize_client(doc)), 201
    except ValueError as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message="Failed to create client", error=str(e)), 500


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


# ── GET /api/clients/meta/options ─────────────────────────────────────────
@client_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def get_options():
    return jsonify(
        success=True,
        industries=INDUSTRIES,
        statuses=RELATIONSHIP_STATUSES,
    ), 200