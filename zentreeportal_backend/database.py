# from flask_pymongo import PyMongo

# mongo = PyMongo()

# def init_db(app):
#     mongo.init_app(app)
#     return mongo

# def get_db():
#     return mongo.db



from extensions import mongo   # use the single shared instance

def init_db(app):
    pass   # mongo.init_app(app) already called in app.py

def get_db():
    return mongo.db