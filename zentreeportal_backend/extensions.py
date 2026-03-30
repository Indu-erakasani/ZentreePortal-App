# extensions.py
# ─────────────────────────────────────────────────────────────────────────────
# Single source of truth for shared Flask extensions.
# Import `mongo` from here in ALL route files instead of `from app import mongo`
# ─────────────────────────────────────────────────────────────────────────────
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager

mongo = PyMongo()
jwt   = JWTManager()