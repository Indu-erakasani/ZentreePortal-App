from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import uuid, os, base64

from extensions import mongo
from models.JdBenchReview_model import jd_review_schema, serialize_review

from utils.email_service import *
jd_review_bp = Blueprint("jd_review", __name__)

UPLOAD_DIR   = os.environ.get("UPLOAD_FOLDER", "uploads")
REVIEW_DIR   = os.path.join(UPLOAD_DIR, "jd_review_resumes")
os.makedirs(REVIEW_DIR, exist_ok=True)

FRONTEND_BASE = os.environ.get("FRONTEND_URL")


# ── POST /api/jd-review/assign ───────────────────────────────────────────────
# Recruiter assigns a senior reviewer to a bench person + JD
@jd_review_bp.route("/assign", methods=["POST"])
@jwt_required()
def assign_review():
    data = request.get_json(silent=True) or {}
    required = ["bench_id", "job_id", "senior_reviewer_email", "senior_reviewer_name"]
    for f in required:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    # Fetch bench person
    bench = mongo.db.bench_people.find_one({"bench_id": data["bench_id"]})
    if not bench:
        return jsonify(success=False, message="Bench person not found"), 404

    # Fetch job
    job = mongo.db.jobs.find_one({"_id": ObjectId(data["job_id"])})
    if not job:
        return jsonify(success=False, message="Job not found"), 404

    # Check no active review already exists for this bench+job combo
    existing = mongo.db.jd_reviews.find_one({
        "bench_id": data["bench_id"],
        "job_id":   data["job_id"],
        "status":   {"$in": ["Pending Upload", "Pending Review"]},
    })
    if existing:
        return jsonify(success=False, message="An active review already exists for this candidate + JD"), 409

    upload_token = str(uuid.uuid4())
    review_token = str(uuid.uuid4())

    doc = jd_review_schema(
        bench_id              = data["bench_id"],
        bench_person_name     = bench["name"],
        candidate_email       = bench["email"],
        job_id                = data["job_id"],
        job_title             = job.get("title", ""),
        client_name           = job.get("client_name", ""),
        senior_reviewer_email = data["senior_reviewer_email"],
        senior_reviewer_name  = data["senior_reviewer_name"],
        assigned_by           = data.get("assigned_by", ""),
    )
    doc["upload_token"] = upload_token
    doc["review_token"] = review_token

    result = mongo.db.jd_reviews.insert_one(doc)

    # Email candidate with JD + upload link
    upload_url = f"{FRONTEND_BASE}/jd-resume-upload/{upload_token}"
    send_candidate_jd_email(
        to_email      = bench["email"],
        candidate_name= bench["name"],
        job_title     = job.get("title", ""),
        client_name   = job.get("client_name", ""),
        job_description= job.get("description", ""),
        skills_required= job.get("skills", ""),
        upload_url    = upload_url,
    )

    return jsonify(
        success=True,
        message="Assigned and email sent to candidate",
        review_id=str(result.inserted_id),
        upload_token=upload_token,
    ), 201


# ── GET /api/jd-review/ ──────────────────────────────────────────────────────
# Recruiter views all reviews
@jd_review_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    bench_id = request.args.get("bench_id", "")
    job_id   = request.args.get("job_id", "")
    status   = request.args.get("status", "")
    query = {}
    if bench_id: query["bench_id"] = bench_id
    if job_id:   query["job_id"]   = job_id
    if status:   query["status"]   = status
    docs = list(mongo.db.jd_reviews.find(query).sort("created_at", -1))
    return jsonify(success=True, data=[serialize_review(d) for d in docs]), 200


# ── GET /api/jd-review/<review_id> ──────────────────────────────────────────
@jd_review_bp.route("/<review_id>", methods=["GET"])
@jwt_required()
def get_one(review_id):
    doc = mongo.db.jd_reviews.find_one({"_id": ObjectId(review_id)})
    if not doc:
        return jsonify(success=False, message="Review not found"), 404
    return jsonify(success=True, data=serialize_review(doc)), 200


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC — Candidate Resume Upload (no JWT, token-gated)
# ══════════════════════════════════════════════════════════════════════════════

# GET /api/jd-review/public/upload/<upload_token>  → fetch JD details for display
@jd_review_bp.route("/public/upload/<token>", methods=["GET"])
def get_upload_meta(token):
    doc = mongo.db.jd_reviews.find_one({"upload_token": token})
    if not doc:
        return jsonify(success=False, message="Invalid or expired link"), 404
    if doc["status"] not in ("Pending Upload", "Rejected"):
        return jsonify(success=False, message="This upload link is no longer active"), 410

    job = mongo.db.jobs.find_one({"_id": ObjectId(doc["job_id"])})
    return jsonify(
        success=True,
        candidate_name = doc["bench_person_name"],
        job_title      = doc["job_title"],
        client_name    = doc["client_name"],
        job_description= job.get("description", "") if job else "",
        skills_required= job.get("skills", "") if job else "",
        feedback       = doc.get("feedback", ""),        # shown on re-upload after rejection
        rejection_count= doc.get("rejection_count", 0),
    ), 200


# POST /api/jd-review/public/upload/<upload_token>  → candidate uploads resume
@jd_review_bp.route("/public/upload/<token>", methods=["POST"])
def candidate_upload(token):
    doc = mongo.db.jd_reviews.find_one({"upload_token": token})
    if not doc:
        return jsonify(success=False, message="Invalid link"), 404
    if doc["status"] not in ("Pending Upload", "Rejected"):
        return jsonify(success=False, message="Upload not allowed at this stage"), 410

    data     = request.get_json(silent=True) or {}
    file_b64 = data.get("file_b64", "")
    if not file_b64:
        return jsonify(success=False, message="'file_b64' required"), 400

    # Save file
    filename  = f"jd_review_{doc['bench_id']}_{doc['job_id']}_{uuid.uuid4().hex[:6]}.pdf"
    file_path = os.path.join(REVIEW_DIR, filename)
    try:
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(file_b64))
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

    # Update review status → Pending Review
    history_entry = {
        "status":    "Pending Review",
        "feedback":  "",
        "timestamp": datetime.utcnow().isoformat(),
        "action":    "Candidate uploaded resume",
    }
    mongo.db.jd_reviews.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "status":      "Pending Review",
            "resume_file": filename,
            "feedback":    "",
            "updated_at":  datetime.utcnow(),
        },
         "$push": {"history": history_entry}},
    )

    # Email senior reviewer with review link
    review_url = f"{FRONTEND_BASE}/jd-resume-review/{doc['review_token']}"
    send_senior_review_email(
        to_email       = doc["senior_reviewer_email"],
        reviewer_name  = doc["senior_reviewer_name"],
        candidate_name = doc["bench_person_name"],
        job_title      = doc["job_title"],
        review_url     = review_url,
    )

    return jsonify(success=True, message="Resume uploaded. Senior reviewer has been notified."), 200


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC — Senior Review Page (no JWT, token-gated)
# ══════════════════════════════════════════════════════════════════════════════

# GET /api/jd-review/public/review/<review_token>  → fetch resume + JD for senior
@jd_review_bp.route("/public/review/<token>", methods=["GET"])
def get_review_meta(token):
    doc = mongo.db.jd_reviews.find_one({"review_token": token})
    if not doc:
        return jsonify(success=False, message="Invalid review link"), 404
    job = mongo.db.jobs.find_one({"_id": ObjectId(doc["job_id"])})
    return jsonify(
        success=True,
        review_id      = str(doc["_id"]),
        candidate_name = doc["bench_person_name"],
        job_title      = doc["job_title"],
        client_name    = doc["client_name"],
        job_description= job.get("description", "") if job else "",
        skills_required= job.get("skills", "") if job else "",
        status         = doc["status"],
        history        = doc.get("history", []),
    ), 200


# GET /api/jd-review/public/review/<review_token>/file  → serve the resume PDF
@jd_review_bp.route("/public/review/<token>/file", methods=["GET"])
def get_review_file(token):
    doc = mongo.db.jd_reviews.find_one({"review_token": token})
    if not doc or not doc.get("resume_file"):
        return jsonify(success=False, message="File not found"), 404
    fp = os.path.join(REVIEW_DIR, doc["resume_file"])
    if not os.path.exists(fp):
        return jsonify(success=False, message="File missing on server"), 404
    return send_file(fp, mimetype="application/pdf", as_attachment=False,
                     download_name=f"{doc['bench_person_name']}_tailored_resume.pdf")


# POST /api/jd-review/public/review/<review_token>/decision  → accept or reject
@jd_review_bp.route("/public/review/<token>/decision", methods=["POST"])
def submit_decision(token):
    doc = mongo.db.jd_reviews.find_one({"review_token": token})
    if not doc:
        return jsonify(success=False, message="Invalid review link"), 404
    if doc["status"] != "Pending Review":
        return jsonify(success=False, message="Review already completed"), 410

    data     = request.get_json(silent=True) or {}
    decision = data.get("decision", "")   # "Accepted" or "Rejected"
    feedback = data.get("feedback", "").strip()

    if decision not in ("Accepted", "Rejected"):
        return jsonify(success=False, message="decision must be 'Accepted' or 'Rejected'"), 400
    if decision == "Rejected" and not feedback:
        return jsonify(success=False, message="Feedback is required when rejecting"), 400

    history_entry = {
        "status":    decision,
        "feedback":  feedback,
        "timestamp": datetime.utcnow().isoformat(),
        "action":    f"Senior reviewer {decision.lower()}",
    }

    update = {
        "$set": {
            "status":     decision,
            "feedback":   feedback,
            "updated_at": datetime.utcnow(),
        },
        "$push": {"history": history_entry},
    }
    if decision == "Rejected":
        update["$inc"] = {"rejection_count": 1}
        # Reset upload slot so candidate can re-upload
        update["$set"]["status"] = "Rejected"

    mongo.db.jd_reviews.update_one({"_id": doc["_id"]}, update)

    if decision == "Accepted":
        # Notify recruiter
        bench = mongo.db.bench_people.find_one({"bench_id": doc["bench_id"]})
        recruiter_email = bench.get("added_by_email") if bench else None
        # fallback: look up recruiter by assigned_by name in users collection
        if not recruiter_email and doc.get("assigned_by"):
            u = mongo.db.users.find_one({"email": doc["assigned_by"]})
            if u:
                recruiter_email = u["email"]

        if recruiter_email:
            review_url = f"{FRONTEND_BASE}/jd-resume-review/{token}"
            send_recruiter_accepted_email(
                to_email       = recruiter_email,
                candidate_name = doc["bench_person_name"],
                job_title      = doc["job_title"],
                reviewer_name  = doc["senior_reviewer_name"],
                review_url     = review_url,
            )

    elif decision == "Rejected":
        # Notify candidate to re-upload
        upload_url = f"{FRONTEND_BASE}/jd-resume-upload/{doc['upload_token']}"
        send_candidate_rejection_email(
            to_email       = doc["candidate_email"],
            candidate_name = doc["bench_person_name"],
            job_title      = doc["job_title"],
            feedback       = feedback,
            upload_url     = upload_url,
        )

    return jsonify(success=True, message=f"Resume {decision}"), 200


# ── GET /api/jd-review/<review_id>/file  (JWT protected, for recruiter) ──────
@jd_review_bp.route("/<review_id>/file", methods=["GET"])
@jwt_required()
def get_file_recruiter(review_id):
    doc = mongo.db.jd_reviews.find_one({"_id": ObjectId(review_id)})
    if not doc or not doc.get("resume_file"):
        return jsonify(success=False, message="File not found"), 404
    fp = os.path.join(REVIEW_DIR, doc["resume_file"])
    if not os.path.exists(fp):
        return jsonify(success=False, message="File missing"), 404
    return send_file(fp, mimetype="application/pdf", as_attachment=False,
                     download_name=f"{doc['bench_person_name']}_tailored_resume.pdf")