from flask import Blueprint, request, jsonify
from models.user_model import User, VALID_ROLES, is_valid_phone
from middleware.auth_middleware import generate_tokens, decode_token, token_required
import re

auth_bp = Blueprint("auth", __name__)


def is_valid_email(email: str) -> bool:
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
    return re.match(pattern, email) is not None


def is_strong_password(password: str) -> bool:
    return (
        len(password) >= 8
        and any(c.isupper() for c in password)
        and any(c.islower() for c in password)
        and any(c.isdigit() for c in password)
    )


# ─── REGISTER ────────────────────────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    required_fields = ["first_name", "last_name", "email", "password", "role"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"success": False, "message": f"Missing fields: {', '.join(missing)}"}), 400

    first_name = data["first_name"].strip()
    last_name  = data["last_name"].strip()
    email      = data["email"].strip().lower()
    password   = data["password"]
    role       = data["role"].lower().strip()
    phone      = data.get("phone", "").strip() or None   # ← optional

    if not is_valid_email(email):
        return jsonify({"success": False, "message": "Invalid email format"}), 400

    if not is_strong_password(password):
        return jsonify({
            "success": False,
            "message": "Password must be at least 8 characters with uppercase, lowercase, and a digit"
        }), 400

    if role not in VALID_ROLES:
        return jsonify({"success": False, "message": f"Invalid role. Choose from: {', '.join(VALID_ROLES)}"}), 400

    # ── phone validation (only if provided) ──────────────────────────────────
    if phone and not is_valid_phone(phone):
        return jsonify({"success": False, "message": "Invalid phone number format"}), 400

    existing = User.find_by_email(email)
    if existing:
        return jsonify({"success": False, "message": "Email is already registered"}), 409

    try:
        user = User.create(first_name, last_name, email, password, role, phone=phone)
        return jsonify({
            "success": True,
            "message": "Account created successfully",
            "user": User.serialize(user)
        }), 201
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception:
        return jsonify({"success": False, "message": "Registration failed. Please try again."}), 500


# ─── LOGIN ─────────────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    user = User.find_by_email(email)
    if not user:
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    if not user.get("is_active"):
        return jsonify({"success": False, "message": "Your account has been deactivated. Contact admin."}), 403

    if not User.check_password(password, user["password"]):
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    user_id = str(user["_id"])
    User.update_last_login(user_id)

    access_token, refresh_token = generate_tokens(user_id, user["role"])
    return jsonify({
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": User.serialize(user)
    }), 200


# ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    data = request.get_json()
    refresh_token = data.get("refresh_token") if data else None
    if not refresh_token:
        return jsonify({"success": False, "message": "Refresh token is required"}), 400

    payload, error = decode_token(refresh_token)
    if error:
        return jsonify({"success": False, "message": error}), 401
    if payload.get("type") != "refresh":
        return jsonify({"success": False, "message": "Invalid token type"}), 401

    user = User.find_by_id(payload["sub"])
    if not user or not user.get("is_active"):
        return jsonify({"success": False, "message": "User not found or deactivated"}), 401

    access_token, new_refresh = generate_tokens(str(user["_id"]), user["role"])
    return jsonify({
        "success": True,
        "access_token": access_token,
        "refresh_token": new_refresh
    }), 200


# ─── ME ───────────────────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    return jsonify({"success": True, "user": User.serialize(request.current_user)}), 200


# ─── LOGOUT ───────────────────────────────────────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    return jsonify({"success": True, "message": "Logged out successfully"}), 200


# ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
@auth_bp.route("/change-password", methods=["PUT"])
@token_required
def change_password():
    data = request.get_json()
    current_password = data.get("current_password", "")
    new_password     = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({"success": False, "message": "Both current and new passwords are required"}), 400

    user = request.current_user
    if not User.check_password(current_password, user["password"]):
        return jsonify({"success": False, "message": "Current password is incorrect"}), 401

    if not is_strong_password(new_password):
        return jsonify({"success": False, "message": "New password must be at least 8 chars with upper, lower, digit"}), 400

    User.update_user(str(user["_id"]), {"password": User.hash_password(new_password)})
    return jsonify({"success": True, "message": "Password updated successfully"}), 200