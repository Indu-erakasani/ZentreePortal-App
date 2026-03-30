from flask import Blueprint, request, jsonify
from models.user_model import *
from middleware.auth_middleware import role_required
from bson import ObjectId

admin_bp = Blueprint("admin", __name__)


# ─── GET ALL USERS ────────────────────────────────────────────────────────────
@admin_bp.route("/users", methods=["GET"])
@role_required("admin")
def get_all_users():
    role_filter = request.args.get("role")
    users = User.get_all_users()
    if role_filter and role_filter in VALID_ROLES:
        users = [u for u in users if u.get("role") == role_filter]
    serialized = [User.serialize(u) for u in users]
    return jsonify({"success": True, "users": serialized, "total": len(serialized)}), 200


# ─── GET SINGLE USER ──────────────────────────────────────────────────────────
@admin_bp.route("/users/<user_id>", methods=["GET"])
@role_required("admin")
def get_user(user_id):
    user = User.find_by_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    return jsonify({"success": True, "user": User.serialize(user)}), 200

# ─── UPDATE USER ──────────────────────────────────────────────────────────────
@admin_bp.route("/users/<user_id>", methods=["PUT"])
@role_required("admin")
def update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    allowed_fields = ["first_name", "last_name", "role", "is_active", "phone"]  # ← phone added
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if "role" in update_data and update_data["role"] not in VALID_ROLES:
        return jsonify({"success": False, "message": f"Invalid role. Must be: {', '.join(VALID_ROLES)}"}), 400

    # ── validate phone if provided ────────────────────────────────────────────
    if "phone" in update_data and update_data["phone"]:
        if not is_valid_phone(update_data["phone"]):
            return jsonify({"success": False, "message": "Invalid phone number format"}), 400

    if not update_data:
        return jsonify({"success": False, "message": "No valid fields to update"}), 400

    user = User.find_by_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    success = User.update_user(user_id, update_data)
    if success:
        updated_user = User.find_by_id(user_id)
        return jsonify({"success": True, "message": "User updated", "user": User.serialize(updated_user)}), 200
    return jsonify({"success": False, "message": "Update failed"}), 500

# ─── TOGGLE USER STATUS ───────────────────────────────────────────────────────
@admin_bp.route("/users/<user_id>/toggle-status", methods=["PATCH"])
@role_required("admin")
def toggle_user_status(user_id):
    # Prevent admin from deactivating themselves
    if user_id == request.current_user_id:
        return jsonify({"success": False, "message": "Cannot change your own status"}), 400

    user = User.find_by_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    new_status = not user.get("is_active", True)
    User.update_user(user_id, {"is_active": new_status})
    status_str = "activated" if new_status else "deactivated"
    return jsonify({"success": True, "message": f"User {status_str} successfully", "is_active": new_status}), 200


# ─── DELETE USER ──────────────────────────────────────────────────────────────
@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@role_required("admin")
def delete_user(user_id):
    if user_id == request.current_user_id:
        return jsonify({"success": False, "message": "Cannot delete your own account"}), 400

    user = User.find_by_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    success = User.delete_user(user_id)
    if success:
        return jsonify({"success": True, "message": "User deleted successfully"}), 200
    return jsonify({"success": False, "message": "Delete failed"}), 500


# ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
@admin_bp.route("/stats", methods=["GET"])
@role_required("admin")
def get_stats():
    all_users = User.get_all_users()
    stats = {
        "total_users": len(all_users),
        "active_users": sum(1 for u in all_users if u.get("is_active")),
        "inactive_users": sum(1 for u in all_users if not u.get("is_active")),
        "by_role": {
            "admin": sum(1 for u in all_users if u.get("role") == "admin"),
            "recruiter": sum(1 for u in all_users if u.get("role") == "recruiter"),
            "manager": sum(1 for u in all_users if u.get("role") == "manager"),
        }
    }
    return jsonify({"success": True, "stats": stats}), 200
