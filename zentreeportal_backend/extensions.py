


# from flask_pymongo import PyMongo
# from flask_jwt_extended import JWTManager

# mongo = PyMongo()
# jwt   = JWTManager()




from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from pymongo import MongoClient

mongo = PyMongo()
jwt   = JWTManager()

# ── Direct client for 10.10.1.46 ─────────────────────────────────────────────
resourcing_client = MongoClient("mongodb://10.10.1.46:27017/")
resourcing_db     = resourcing_client["resourcing_bot_db"]