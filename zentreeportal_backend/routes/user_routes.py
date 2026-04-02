from flask import Blueprint, request, jsonify
from models.user_model import User, is_valid_phone
from middleware.auth_middleware import token_required, role_required
from flask_jwt_extended import jwt_required
user_bp = Blueprint("user", __name__)


# ─── UPDATE OWN PROFILE ───────────────────────────────────────────────────────
@user_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    allowed = ["first_name", "last_name", "phone"]          # ← phone added
    update_data = {}

    for k in allowed:
        if k in data:
            val = data[k].strip() if isinstance(data[k], str) else data[k]
            update_data[k] = val if val else None            # allow clearing phone with ""

    if not update_data:
        return jsonify({"success": False, "message": "Nothing to update"}), 400

    # ── validate phone if being updated ──────────────────────────────────────
    if "phone" in update_data and update_data["phone"]:
        if not is_valid_phone(update_data["phone"]):
            return jsonify({"success": False, "message": "Invalid phone number format"}), 400

    user_id = request.current_user_id
    User.update_user(user_id, update_data)
    updated = User.find_by_id(user_id)
    return jsonify({"success": True, "message": "Profile updated", "user": User.serialize(updated)}), 200


# ─── RECRUITER DASHBOARD ──────────────────────────────────────────────────────
@user_bp.route("/recruiter/dashboard", methods=["GET"])
@role_required("recruiter", "admin")
def recruiter_dashboard():
    return jsonify({
        "success": True,
        "role": "recruiter",
        "dashboard": {
            "title": "Recruiter Dashboard",
            "stats": {
                "active_jobs": 12,
                "applications_received": 84,
                "interviews_scheduled": 9,
                "offers_made": 3,
            },
            "message": "Welcome to the Recruiter Portal"
        }
    }), 200


# ─── MANAGER DASHBOARD ────────────────────────────────────────────────────────
@user_bp.route("/manager/dashboard", methods=["GET"])
@role_required("manager", "admin")
def manager_dashboard():
    return jsonify({
        "success": True,
        "role": "manager",
        "dashboard": {
            "title": "Manager Dashboard",
            "stats": {
                "team_members": 8,
                "pending_approvals": 5,
                "open_requisitions": 3,
                "hires_this_month": 2,
            },
            "message": "Welcome to the Manager Portal"
        }
    }), 200
    
    
# In user_routes.py — change to match your other routes
@user_bp.route("/", methods=["GET"])
@token_required          # ← use same as other endpoints, not jwt_required()
def get_all_users():
    users = User.get_all_users()
    return jsonify(success=True, data=[User.serialize(u) for u in users]), 200