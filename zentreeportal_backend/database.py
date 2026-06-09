



from extensions import mongo          # existing shared instance (ZentreePortal)
from pymongo import MongoClient

_rb_client = None

def init_db(app):
    pass   # mongo.init_app(app) already called in app.py

def get_db():
    return mongo.db                   # ZentreePortal

def get_resourcingbot_db():
    global _rb_client
    if _rb_client is None:
        _rb_client = MongoClient("mongodb://10.10.1.46:27017")
    return _rb_client["resourcing_bot_db"]