# routes/onboarding_routes.py

import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from datetime import datetime
from werkzeug.utils import secure_filename
from extensions import mongo,resourcing_db
from models.Onboarding_model import *

onboarding_bp = Blueprint("onboarding", __name__)

UPLOAD_FOLDER      = os.path.join(os.path.dirname(__file__), "..", "uploads", "onboarding")
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx", "txt"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _get_or_create(employee_id: str) -> dict:
    doc = mongo.db.onboarding.find_one({"employee_id": employee_id})
    if not doc:
        schema = onboarding_schema(employee_id)
        result = mongo.db.onboarding.insert_one(schema)
        schema["_id"] = result.inserted_id
        doc = schema
    return doc


# ── GET /api/onboarding/meta ─────────────────────────────────────────────────
@onboarding_bp.route("/meta", methods=["GET"])
@jwt_required()
def meta():
    return jsonify(
        success=True,
        document_categories=DOCUMENT_CATEGORIES,
        document_statuses=DOCUMENT_STATUSES,
        bgv_statuses=BGV_STATUSES,
        checklist_items=ONBOARDING_CHECKLIST_ITEMS,
    ), 200


# ── GET /api/onboarding/<employee_id> ────────────────────────────────────────
@onboarding_bp.route("/<employee_id>", methods=["GET"])
@jwt_required()
def get_onboarding(employee_id):
    doc = _get_or_create(employee_id)
    return jsonify(success=True, data=serialize_onboarding(doc)), 200


# ── PUT /api/onboarding/<employee_id> ────────────────────────────────────────
@onboarding_bp.route("/<employee_id>", methods=["PUT"])
@jwt_required()
def update_onboarding(employee_id):
    _get_or_create(employee_id)
    data    = request.get_json(silent=True) or {}
    allowed = [
        "blood_group", "personal_email", "referred_by",
        "bgv_status", "bgv_agency", "bgv_remarks",
        "laptop_serial", "laptop_make_model", "access_card_number", "email_id_created",
        "bank_details", "emergency_contact", "hr_notes", "it_notes",
    ]
    upd = {k: data[k] for k in allowed if k in data}
    if "probation_end_date" in data:
        try:
            upd["probation_end_date"] = (
                datetime.fromisoformat(data["probation_end_date"].replace("Z", "+00:00"))
                if data["probation_end_date"] else None
            )
        except Exception:
            pass
    upd["updated_at"] = datetime.utcnow()
    mongo.db.onboarding.update_one({"employee_id": employee_id}, {"$set": upd})
    updated = mongo.db.onboarding.find_one({"employee_id": employee_id})
    return jsonify(success=True, message="Onboarding updated", data=serialize_onboarding(updated)), 200


# ── PUT /api/onboarding/<employee_id>/checklist/<idx> ────────────────────────
@onboarding_bp.route("/<employee_id>/checklist/<int:idx>", methods=["PUT"])
@jwt_required()
def update_checklist_item(employee_id, idx):
    doc = mongo.db.onboarding.find_one({"employee_id": employee_id})
    if not doc:
        return jsonify(success=False, message="Onboarding record not found"), 404
    if idx >= len(doc.get("checklist", [])):
        return jsonify(success=False, message="Index out of range"), 400
    data = request.get_json(silent=True) or {}
    mongo.db.onboarding.update_one(
        {"employee_id": employee_id},
        {"$set": {
            f"checklist.{idx}.done":       data.get("done", False),
            f"checklist.{idx}.remarks":    data.get("remarks", ""),
            f"checklist.{idx}.updated_at": datetime.utcnow(),
            "updated_at":                  datetime.utcnow(),
        }},
    )
    updated = mongo.db.onboarding.find_one({"employee_id": employee_id})
    return jsonify(success=True, data=serialize_onboarding(updated)), 200


# ── POST /api/onboarding/<employee_id>/document ──────────────────────────────
@onboarding_bp.route("/<employee_id>/document", methods=["POST"])
@jwt_required()
def add_document(employee_id):
    _get_or_create(employee_id)
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify(success=False, message="'name' is required"), 400
    entry = document_entry(
        name     = data["name"],
        category = data.get("category", "Other"),
        status   = data.get("status", "Pending"),
        remarks  = data.get("remarks", ""),
    )
    mongo.db.onboarding.update_one(
        {"employee_id": employee_id},
        {"$push": {"documents": entry}, "$set": {"updated_at": datetime.utcnow()}},
    )
    updated = mongo.db.onboarding.find_one({"employee_id": employee_id})
    return jsonify(success=True, message="Document added", data=serialize_onboarding(updated)), 200


# ── PUT /api/onboarding/<employee_id>/document/<idx> ─────────────────────────
@onboarding_bp.route("/<employee_id>/document/<int:idx>", methods=["PUT"])
@jwt_required()
def update_document(employee_id, idx):
    doc = mongo.db.onboarding.find_one({"employee_id": employee_id})
    if not doc:
        return jsonify(success=False, message="Onboarding record not found"), 404
    if idx >= len(doc.get("documents", [])):
        return jsonify(success=False, message="Index out of range"), 400
    data = request.get_json(silent=True) or {}
    upd  = {}
    if "status"  in data: upd[f"documents.{idx}.status"]  = data["status"]
    if "remarks" in data: upd[f"documents.{idx}.remarks"] = data["remarks"]
    upd[f"documents.{idx}.updated_at"] = datetime.utcnow()
    upd["updated_at"]                  = datetime.utcnow()
    mongo.db.onboarding.update_one({"employee_id": employee_id}, {"$set": upd})
    updated = mongo.db.onboarding.find_one({"employee_id": employee_id})
    return jsonify(success=True, data=serialize_onboarding(updated)), 200


# ── DELETE /api/onboarding/<employee_id>/document/<idx> ──────────────────────
@onboarding_bp.route("/<employee_id>/document/<int:idx>", methods=["DELETE"])
@jwt_required()
def delete_document(employee_id, idx):
    doc = mongo.db.onboarding.find_one({"employee_id": employee_id})
    if not doc:
        return jsonify(success=False, message="Onboarding record not found"), 404
    documents = doc.get("documents", [])
    if idx >= len(documents):
        return jsonify(success=False, message="Index out of range"), 400
    # Remove physical file from disk if it exists
    file_path = documents[idx].get("file_path")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
    documents.pop(idx)
    mongo.db.onboarding.update_one(
        {"employee_id": employee_id},
        {"$set": {"documents": documents, "updated_at": datetime.utcnow()}},
    )
    updated = mongo.db.onboarding.find_one({"employee_id": employee_id})
    return jsonify(success=True, data=serialize_onboarding(updated)), 200


# ── POST /api/onboarding/<employee_id>/document/<idx>/upload ─────────────────
@onboarding_bp.route("/<employee_id>/document/<int:idx>/upload", methods=["POST"])
@jwt_required()
def upload_document_file(employee_id, idx):
    doc = mongo.db.onboarding.find_one({"employee_id": employee_id})
    if not doc:
        return jsonify(success=False, message="Onboarding record not found"), 404
    if idx >= len(doc.get("documents", [])):
        return jsonify(success=False, message="Document index out of range"), 400
    if "file" not in request.files:
        return jsonify(success=False, message="No file in request"), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify(success=False, message="No file selected"), 400
    if not allowed_file(file.filename):
        return jsonify(
            success=False,
            message=f"File type not allowed. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        ), 400

    # Remove old file from disk if replacing
    old_path = doc["documents"][idx].get("file_path")
    if old_path and os.path.exists(old_path):
        os.remove(old_path)

    # Save to uploads/onboarding/<employee_id>/doc<idx>_<filename>
    emp_folder = os.path.join(UPLOAD_FOLDER, employee_id)
    os.makedirs(emp_folder, exist_ok=True)
    safe_name = f"doc{idx}_{secure_filename(file.filename)}"
    save_path = os.path.join(emp_folder, safe_name)
    file.save(save_path)

    mongo.db.onboarding.update_one(
        {"employee_id": employee_id},
        {"$set": {
            f"documents.{idx}.file_name": file.filename,
            f"documents.{idx}.file_path": save_path,
            f"documents.{idx}.updated_at": datetime.utcnow(),
            "updated_at":                  datetime.utcnow(),
        }},
    )
    updated = mongo.db.onboarding.find_one({"employee_id": employee_id})
    return jsonify(success=True, message="File uploaded successfully", data=serialize_onboarding(updated)), 200


# ── GET /api/onboarding/<employee_id>/document/<idx>/file ────────────────────
@onboarding_bp.route("/<employee_id>/document/<int:idx>/file", methods=["GET"])
@jwt_required()
def get_document_file(employee_id, idx):
    doc = mongo.db.onboarding.find_one({"employee_id": employee_id})
    if not doc:
        return jsonify(success=False, message="Onboarding record not found"), 404
    documents = doc.get("documents", [])
    if idx >= len(documents):
        return jsonify(success=False, message="Index out of range"), 400

    file_path = documents[idx].get("file_path")
    file_name = documents[idx].get("file_name", "document")

    if not file_path or not os.path.exists(file_path):
        return jsonify(success=False, message="No file uploaded for this document"), 404

    return send_file(
        file_path,
        as_attachment=False,      # inline so browser can render PDFs/images directly
        download_name=file_name,
    )
    
    
    



# ── GET /api/onboarding/selected-candidates ──────────────────────────────────
@onboarding_bp.route("/selected-candidates", methods=["GET"])
@jwt_required()
def selected_candidates():
    """
    Returns candidates from ResourcingBot with overallStatus == 'Selected',
    along with their onboarding status (started / not started) if an
    employee record + onboarding doc already exists for them.
    """
    col = resourcing_db["candidate_profiles"]
    selected = list(col.find({"overallStatus": "Selected"}))

    results = []
    for c in selected:
        candidate_id    = c.get("candidateID", "")
        candidate_email = c.get("candidateEmail", "")
        candidate_name  = c.get("candidatename", "")

        # ── Try to find a matching employee record by email ───────────────
        emp = mongo.db.employees.find_one({"email": candidate_email}) if candidate_email else None

        onboarding_status = "Not Started"
        onboarding_pct    = 0
        employee_id       = None

        if emp:
            employee_id = str(emp["_id"])
            ob = mongo.db.onboarding.find_one({"employee_id": employee_id})
            if ob:
                checklist = ob.get("checklist", [])
                done      = sum(1 for i in checklist if i.get("done"))
                total     = len(checklist)
                onboarding_pct = round((done / total) * 100) if total else 0
                if total and done == total:
                    onboarding_status = "Completed"
                elif done > 0:
                    onboarding_status = "In Progress"
                else:
                    onboarding_status = "Initiated"
            else:
                onboarding_status = "Pending Setup"  # employee exists, no onboarding doc yet

        results.append({
            "_id":              str(c["_id"]),
            "candidateID":      candidate_id,
            "candidatename":    candidate_name,
            "candidateEmail":   candidate_email,
            "phone":            c.get("phone", ""),
            "jobRole":          c.get("jobRole", ""),
            "companyName":      c.get("companyName", ""),
            "jdID":             c.get("jdID", ""),
            "match_score":      c.get("match_score", 0),
            "ScreeningTestScore": c.get("ScreeningTestScore", 0),
            "resumeUrl":        c.get("resumeUrl", ""),
            "uploadedAt":       c["uploadedAt"].isoformat() if isinstance(c.get("uploadedAt"), datetime) else "",
            "employee_id":      employee_id,
            "is_employee":      emp is not None,
            "onboarding_status": onboarding_status,
            "onboarding_pct":   onboarding_pct,
        })

    # # Sort: not-yet-onboarded first, then by upload date desc
    # results.sort(key=lambda x: (
    #     x["onboarding_status"] == "Completed",   # completed last
    #     x["candidatename"],
    # ))
    STATUS_RANK = {
        "Not Started":   0,
        "Pending Setup": 1,
        "Initiated":     2,
        "In Progress":   3,
        "Completed":     4,
    }
    results.sort(key=lambda x: (
        STATUS_RANK.get(x["onboarding_status"], 0),
        x.get("uploadedAt", ""),
    ), reverse=False)

    # Within "Not Started" group, show most recently uploaded first
    not_started = [r for r in results if STATUS_RANK.get(r["onboarding_status"], 0) <= 1]
    rest        = [r for r in results if STATUS_RANK.get(r["onboarding_status"], 0) > 1]
    not_started.sort(key=lambda x: x.get("uploadedAt", ""), reverse=True)
    results = not_started + rest

    not_started_count = sum(1 for r in results if r["onboarding_status"] in ("Not Started", "Pending Setup"))
    in_progress_count = sum(1 for r in results if r["onboarding_status"] in ("Initiated", "In Progress"))
    completed_count   = sum(1 for r in results if r["onboarding_status"] == "Completed")

    return jsonify(
        success=True,
        total=len(results),
        kpis={
            "not_started": not_started_count,
            "in_progress": in_progress_count,
            "completed":   completed_count,
        },
        data=results,
    ), 200
    
    


# ── POST /api/onboarding/selected-candidates/<candidate_id>/start ───────────
@onboarding_bp.route("/selected-candidates/<candidate_id>/start", methods=["POST"])
@jwt_required()
def start_onboarding_for_candidate(candidate_id):
    """
    Given a ResourcingBot candidate_profiles _id (Selected status),
    create an employee record (if not already present) and an
    onboarding record, then return the employee_id so the frontend
    can open the onboarding dialog directly.
    """
    from bson import ObjectId

    col = resourcing_db["candidate_profiles"]
    try:
        candidate = col.find_one({"_id": ObjectId(candidate_id)})
    except Exception:
        return jsonify(success=False, message="Invalid candidate id"), 400

    if not candidate:
        return jsonify(success=False, message="Candidate not found"), 404

    candidate_email = candidate.get("candidateEmail", "")
    candidate_name  = candidate.get("candidatename", "")
    candidate_phone = candidate.get("phone", "")

    # ── Find or create employee record ────────────────────────────────────
    emp = mongo.db.employees.find_one({"email": candidate_email}) if candidate_email else None

    if not emp:
        emp_doc = {
            "name":             candidate_name,
            "email":            candidate_email,
            "phone":            candidate_phone,
            "designation":      candidate.get("jobRole", ""),
            "company_name":     candidate.get("companyName", ""),
            "emp_id":           f"EMP-{candidate.get('candidateID', '')}",
            "date_of_joining":  datetime.utcnow(),
            "source_candidate_id": str(candidate["_id"]),
            "source_jdID":      candidate.get("jdID", ""),
            "status":           "Active",
            "created_at":       datetime.utcnow(),
            "updated_at":       datetime.utcnow(),
        }
        result = mongo.db.employees.insert_one(emp_doc)
        employee_id = str(result.inserted_id)
        emp_doc["_id"] = result.inserted_id
        emp = emp_doc
    else:
        employee_id = str(emp["_id"])

    # ── Ensure onboarding record exists ───────────────────────────────────
    _get_or_create(employee_id)

    # Pre-fill personal_email + referred_by from candidate profile if onboarding is fresh
    ob = mongo.db.onboarding.find_one({"employee_id": employee_id})
    if ob and not ob.get("personal_email"):
        mongo.db.onboarding.update_one(
            {"employee_id": employee_id},
            {"$set": {
                "personal_email": candidate_email,
                "updated_at": datetime.utcnow(),
            }}
        )

    emp["_id"] = str(emp["_id"])
    return jsonify(success=True, message="Onboarding initiated", employee_id=employee_id, employee=emp), 200