import jwt
import os
from functools import wraps
from datetime import datetime, timedelta
from flask import request, jsonify, current_app
from models.user_model import User


def generate_tokens(user_id: str, role: str):
    secret = current_app.config["JWT_SECRET_KEY"]

    access_payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    refresh_payload = {
        "sub": user_id,
        "role": role,
        "type": "refresh",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=30),
    }

    access_token = jwt.encode(access_payload, secret, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, secret, algorithm="HS256")
    return access_token, refresh_token


def decode_token(token: str):
    secret = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token has expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        if not token:
            return jsonify({"success": False, "message": "Authentication token is missing"}), 401

        payload, error = decode_token(token)
        if error:
            return jsonify({"success": False, "message": error}), 401
        if payload.get("type") != "access":
            return jsonify({"success": False, "message": "Invalid token type"}), 401

        user = User.find_by_id(payload["sub"])
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 401
        if not user.get("is_active"):
            return jsonify({"success": False, "message": "Account is deactivated"}), 403

        request.current_user = user
        request.current_user_id = payload["sub"]
        request.current_role = payload["role"]
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if request.current_role not in roles:
                return jsonify({
                    "success": False,
                    "message": f"Access denied. Required roles: {', '.join(roles)}"
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
