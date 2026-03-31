
# from flask import Flask
# from flask_cors import CORS
# from config import Config
# from database import init_db

# # ── Import shared extensions (mongo, jwt) ────────────────────────────────────
# from extensions import mongo, jwt

# # ── Import blueprints ─────────────────────────────────────────────────────────
# from routes.auth_routes      import auth_bp
# from routes.admin_routes     import admin_bp
# from routes.user_routes      import user_bp
# from routes.Client_routes    import client_bp
# from routes.Job_routes       import job_bp
# from routes.dashboard_routes import dashboard_bp

# app = Flask(__name__)
# app.config.from_object(Config)

# # ── Bind extensions to this app ───────────────────────────────────────────────
# mongo.init_app(app)
# jwt.init_app(app)

# # ── CORS — allow all common React dev ports ───────────────────────────────────
# CORS(app, resources={
#     r"/api/*": {
#         "origins": [
#             "http://localhost:3000",
#             "http://localhost:3001",
#             "http://localhost:3002",
#             "http://localhost:3003",
#         ],
#         "methods":       ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
#         "allow_headers": ["Content-Type", "Authorization"],
#     }
# }, supports_credentials=True)

# # ── MongoDB (your existing init_db wiring) ────────────────────────────────────
# init_db(app)

# # ── Blueprints ────────────────────────────────────────────────────────────────
# app.register_blueprint(auth_bp,      url_prefix="/api/auth")
# app.register_blueprint(admin_bp,     url_prefix="/api/admin")
# app.register_blueprint(user_bp,      url_prefix="/api/user")
# app.register_blueprint(client_bp,    url_prefix="/api/clients")
# app.register_blueprint(job_bp,       url_prefix="/api/jobs")
# app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

# # ── Health check ──────────────────────────────────────────────────────────────
# @app.route("/api/health")
# def health():
#     return {"status": "ok", "message": "ZentreeLabs Recruitment API running"}


# if __name__ == "__main__":
#     app.run(debug=True, port=5000)







# main.py
from flask import Flask
from flask_cors import CORS
from config import Config
from database import init_db

# ── Import shared extensions (mongo, jwt) ────────────────────────────────────
from extensions import mongo, jwt

# ── Import blueprints ─────────────────────────────────────────────────────────
from routes.auth_routes      import auth_bp
from routes.admin_routes     import admin_bp
from routes.user_routes      import user_bp
from routes.Client_routes    import client_bp
from routes.Job_routes       import job_bp
from routes.dashboard_routes import dashboard_bp
from routes.Tracking_routes  import tracking_bp   
from routes.Placement_routes import placement_bp  
from routes.Resume_routes    import resume_bp   
from routes.Skills_routes    import skills_bp   
from routes.Reports_routes import reports_bp
from routes.Bench_routes import bench_bp
from routes.Employee_routes import employee_bp
app = Flask(__name__)
app.config.from_object(Config)

# ── Bind extensions to this app ───────────────────────────────────────────────
mongo.init_app(app)
jwt.init_app(app)

# ── CORS — allow all common React dev ports ───────────────────────────────────
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
        ],
        "methods":       ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
    }
}, supports_credentials=True)

# ── MongoDB (your existing init_db wiring) ────────────────────────────────────
init_db(app)

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp,      url_prefix="/api/auth")
app.register_blueprint(admin_bp,     url_prefix="/api/admin")
app.register_blueprint(user_bp,      url_prefix="/api/user")
app.register_blueprint(client_bp,    url_prefix="/api/clients")
app.register_blueprint(job_bp,       url_prefix="/api/jobs")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(tracking_bp,  url_prefix="/api/tracking")  
app.register_blueprint(placement_bp, url_prefix="/api/placements")
app.register_blueprint(resume_bp,    url_prefix="/api/resumes")  
app.register_blueprint(skills_bp,    url_prefix="/api/skills")  
app.register_blueprint(reports_bp,   url_prefix="/api/reports")
app.register_blueprint(bench_bp,     url_prefix="/api/bench")
app.register_blueprint(employee_bp,  url_prefix="/api/employees")
 

# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return {"status": "ok", "message": "ZentreeLabs Recruitment API running"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)