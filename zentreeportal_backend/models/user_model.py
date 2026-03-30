import re
from datetime import datetime
from bson import ObjectId
from database import get_db
import bcrypt

VALID_ROLES = ["admin", "recruiter", "manager"]


def is_valid_phone(phone: str) -> bool:
    """E.164-style: optional leading +, 7–15 digits. e.g. +919876543210"""
    return bool(re.match(r"^\+?[1-9]\d{6,14}$", phone))


class User:
    def __init__(self, data):
        self._id = data.get("_id")
        self.first_name = data.get("first_name", "")
        self.last_name = data.get("last_name", "")
        self.email = data.get("email", "")
        self.password = data.get("password", "")
        self.role = data.get("role", "recruiter")
        self.phone = data.get("phone", None)          # ← new (optional)
        self.is_active = data.get("is_active", True)
        self.created_at = data.get("created_at", datetime.utcnow())
        self.updated_at = data.get("updated_at", datetime.utcnow())
        self.last_login = data.get("last_login")

    # ── password helpers ─────────────────────────────────────────────────────
    @staticmethod
    def hash_password(plain_password: str) -> str:
        return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def check_password(plain_password: str, hashed: str) -> bool:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed.encode("utf-8"))

    # ── finders ──────────────────────────────────────────────────────────────
    @staticmethod
    def find_by_email(email: str):
        db = get_db()
        return db.users.find_one({"email": email.lower().strip()})

    @staticmethod
    def find_by_id(user_id: str):
        db = get_db()
        try:
            return db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return None

    # ── create ───────────────────────────────────────────────────────────────
    @staticmethod
    def create(first_name, last_name, email, password, role, phone=None):  # ← phone param
        db = get_db()
        if role not in VALID_ROLES:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

        user_doc = {
            "first_name": first_name.strip(),
            "last_name": last_name.strip(),
            "email": email.lower().strip(),
            "password": User.hash_password(password),
            "role": role,
            "phone": phone,                           # ← new (None by default)
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None,
        }
        result = db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return user_doc

    # ── updates ──────────────────────────────────────────────────────────────
    @staticmethod
    def update_last_login(user_id):
        db = get_db()
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_login": datetime.utcnow(), "updated_at": datetime.utcnow()}}
        )

    @staticmethod
    def get_all_users():
        db = get_db()
        return list(db.users.find({}, {"password": 0}))

    @staticmethod
    def update_user(user_id, update_data):
        db = get_db()
        update_data["updated_at"] = datetime.utcnow()
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_user(user_id):
        db = get_db()
        result = db.users.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0

    # ── serializer ───────────────────────────────────────────────────────────
    @staticmethod
    def serialize(user_doc):
        if not user_doc:
            return None
        return {
            "id": str(user_doc["_id"]),
            "first_name": user_doc.get("first_name", ""),
            "last_name": user_doc.get("last_name", ""),
            "email": user_doc.get("email", ""),
            "role": user_doc.get("role", ""),
            "phone": user_doc.get("phone", None),     # ← new
            "is_active": user_doc.get("is_active", True),
            "created_at": user_doc.get("created_at", "").isoformat() if user_doc.get("created_at") else None,
            "last_login": user_doc.get("last_login", "").isoformat() if user_doc.get("last_login") else None,
        }