
import re
from datetime import datetime
from bson import ObjectId
from database import get_db, get_resourcingbot_db
import bcrypt

VALID_ROLES = ["admin", "recruiter", "manager", "hr"]


def is_valid_phone(phone: str) -> bool:
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
    # ── Password helpers ─────────────────────────────────────────────────────
    @staticmethod
    def hash_password(plain: str) -> str:
        return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

    @staticmethod
    def check_password(plain: str, hashed: str) -> bool:
        return bcrypt.checkpw(plain.encode(), hashed.encode())

    # ── Local finders ────────────────────────────────────────────────────────
    @staticmethod
    def find_by_email(email: str):
        return get_db().users.find_one({"email": email.lower().strip()})

    @staticmethod
    def find_by_id(user_id: str):
        try:
            return get_db().users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return None

    # ── ResourcingBot finders ────────────────────────────────────────────────
    @staticmethod
    def find_in_resourcingbot_by_email(email: str):
        """Find any recruiter in ResourcingBot DB regardless of approval."""
        return get_resourcingbot_db().users.find_one({
            "email": email.lower().strip(),
            "userType": "recruiter"
        })

    @staticmethod
    def find_approved_in_resourcingbot(email: str):
        """Only approved+active recruiters can log in from ResourcingBot."""
        return get_resourcingbot_db().users.find_one({
            "email": email.lower().strip(),
            "userType": "recruiter",
            "Approval_status": "approved",
            "isActive": True
        })

    # ── Dual-write CREATE (recruiter registration) ───────────────────────────
    @staticmethod
    def create(first_name, last_name, email, password, role, phone=None):
        db = get_db()
        if role not in VALID_ROLES:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

        email = email.lower().strip()
        hashed = User.hash_password(password)
        now = datetime.utcnow()

        # ── Write to ZentreePortal ───────────────────────────────────────────
        local_doc = {
            "first_name": first_name.strip(),
            "last_name": last_name.strip(),
            "email": email,
            "password": hashed,
            "role": role,
            "phone": phone,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            "last_login": None,
        }
        result = db.users.insert_one(local_doc)
        local_doc["_id"] = result.inserted_id

        # ── Dual-write to ResourcingBot only for recruiters ──────────────────
        if role == "recruiter":
            User._sync_to_resourcingbot(
                email=email,
                name=f"{first_name.strip()} {last_name.strip()}",
                hashed_password=hashed,
                phone=phone,
            )

        return local_doc

    @staticmethod
    def _sync_to_resourcingbot(email, name, hashed_password, phone=None):
        """
        Upsert a recruiter record into ResourcingBot DB.
        Uses upsert so it's safe to call on re-registration or sync.
        ResourcingBot schema: name, email, password, phone,
                              userType, Approval_status, isActive
        """
        rb_db = get_resourcingbot_db()
        rb_db.users.update_one(
            {"email": email},
            {"$set": {
                "name": name,
                "email": email,
                "password": hashed_password,
                "phone": phone,
                "userType": "recruiter",
                "Approval_status": "approved",   # already vetted by ZentreePortal
                "isActive": True,
                "updatedAt": datetime.utcnow(),
            },
            "$setOnInsert": {
                "createdAt": datetime.utcnow(),
            }},
            upsert=True
        )

    # ── Dual-write PASSWORD UPDATE ────────────────────────────────────────────
    @staticmethod
    def update_password(user_id: str, new_plain_password: str):
        hashed = User.hash_password(new_plain_password)
        db = get_db()

        # Update local
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed, "updated_at": datetime.utcnow()}}
        )

        # Sync to ResourcingBot if recruiter
        local_user = User.find_by_id(user_id)
        if local_user and local_user.get("role") == "recruiter":
            get_resourcingbot_db().users.update_one(
                {"email": local_user["email"]},
                {"$set": {"password": hashed, "updatedAt": datetime.utcnow()}}
            )

    # ── Dual-write PROFILE UPDATE ─────────────────────────────────────────────
    @staticmethod
    def update_user(user_id: str, update_data: dict):
        db = get_db()
        update_data["updated_at"] = datetime.utcnow()

        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

        # Sync name/phone to ResourcingBot if recruiter
        local_user = User.find_by_id(user_id)
        if local_user and local_user.get("role") == "recruiter":
            rb_update = {}
            if "first_name" in update_data or "last_name" in update_data:
                first = update_data.get("first_name", local_user.get("first_name", ""))
                last = update_data.get("last_name", local_user.get("last_name", ""))
                rb_update["name"] = f"{first} {last}".strip()
            if "phone" in update_data:
                rb_update["phone"] = update_data["phone"]
            if rb_update:
                rb_update["updatedAt"] = datetime.utcnow()
                get_resourcingbot_db().users.update_one(
                    {"email": local_user["email"]},
                    {"$set": rb_update}
                )

        return True

    # ── Other existing methods (unchanged) ────────────────────────────────────
    @staticmethod
    def update_last_login(user_id: str):
        get_db().users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_login": datetime.utcnow(), "updated_at": datetime.utcnow()}}
        )

    @staticmethod
    def get_all_users():
        return list(get_db().users.find({}, {"password": 0}))

    @staticmethod
    def delete_user(user_id: str):
        result = get_db().users.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0

    # ── Serializers ───────────────────────────────────────────────────────────
    @staticmethod
    def serialize(doc):
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "first_name": doc.get("first_name", ""),
            "last_name": doc.get("last_name", ""),
            "email": doc.get("email", ""),
            "role": doc.get("role", ""),
            "phone": doc.get("phone", None),
            "is_active": doc.get("is_active", True),
            "source": doc.get("source", "local"),
            "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
            "last_login": doc["last_login"].isoformat() if doc.get("last_login") else None,
        }

    @staticmethod
    def serialize_from_resourcingbot(doc):
        """Normalize a ResourcingBot doc into ZentreePortal shape."""
        if not doc:
            return None
        name_parts = doc.get("name", "").split(" ", 1)
        return {
            "id": str(doc["_id"]),
            "first_name": name_parts[0],
            "last_name": name_parts[1] if len(name_parts) > 1 else "",
            "email": doc.get("email", ""),
            "role": "recruiter",
            "phone": doc.get("phone", None),
            "is_active": doc.get("isActive", True),
            "source": "resourcingbot",
            "created_at": None,
            "last_login": None,
        }