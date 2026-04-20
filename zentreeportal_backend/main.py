
from flask import Flask
from flask_cors import CORS
from config import Config
from database import init_db

# ── Import shared extensions (mongo, jwt) ────────────────────────────────────
from extensions import mongo, jwt

# ── APScheduler ─────────────────────────────────────────────────────────────
from apscheduler.schedulers.background import BackgroundScheduler
import atexit

# ── Import blueprints ─────────────────────────────────────────────────────────
from routes.auth_routes      import auth_bp
from routes.admin_routes     import admin_bp
from routes.user_routes      import user_bp
from routes.Client_routes    import client_bp
from routes.Job_routes       import job_bp
from routes.dashboard_routes import dashboard_bp
from routes.Tracking_routes  import tracking_bp   
from routes.Placement_routes import placement_bp  
from routes.Resume_routes    import resume_bp, cleanup_expired_raw_resumes 
from routes.Skills_routes    import skills_bp   
from routes.Reports_routes   import reports_bp
from routes.Bench_routes     import bench_bp
from routes.Employee_routes  import employee_bp
from routes.onboarding_routes import onboarding_bp
from routes.export_routes    import export_bp
from routes.Score_routes     import score_bp
from routes.question_routes  import question_bp
from routes.exam_routes      import exam_bp
from routes.Notification_routes import (
    notification_bp,
    # _generate_interview_notifications,
    # _generate_job_notifications,
    # _generate_resume_expiry_notifications,
)

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
            "https://c6ba-183-82-96-97.ngrok-free.app",
        ],
        "methods":       ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": [
            "Content-Type",
            "Authorization",
            "ngrok-skip-browser-warning",
        ],
    }
}, supports_credentials=True)

# ── MongoDB (your existing init_db wiring) ────────────────────────────────────
init_db(app)

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp,          url_prefix="/api/auth")
app.register_blueprint(admin_bp,         url_prefix="/api/admin")
app.register_blueprint(user_bp,          url_prefix="/api/user")
app.register_blueprint(client_bp,        url_prefix="/api/clients")
app.register_blueprint(job_bp,           url_prefix="/api/jobs")
app.register_blueprint(dashboard_bp,     url_prefix="/api/dashboard")
app.register_blueprint(tracking_bp,      url_prefix="/api/tracking")
app.register_blueprint(placement_bp,     url_prefix="/api/placements")
app.register_blueprint(resume_bp,        url_prefix="/api/resumes")
app.register_blueprint(skills_bp,        url_prefix="/api/skills")
app.register_blueprint(reports_bp,       url_prefix="/api/reports")
app.register_blueprint(bench_bp,         url_prefix="/api/bench")
app.register_blueprint(employee_bp,      url_prefix="/api/employees")
app.register_blueprint(onboarding_bp,    url_prefix="/api/onboarding")
app.register_blueprint(export_bp,        url_prefix="/api/export")
app.register_blueprint(score_bp,         url_prefix="/api/score")
app.register_blueprint(question_bp,      url_prefix="/api/questions")
app.register_blueprint(exam_bp,          url_prefix="/api/exams")
app.register_blueprint(notification_bp,  url_prefix="/api/notifications")

# ── Scheduler — runs cleanup daily at 2:00 AM ─────────────────────────────────
def run_cleanup():
    with app.app_context():
        cleanup_expired_raw_resumes()

# def run_notification_generators():
#     """Refresh all notification types — runs every hour via scheduler."""
#     with app.app_context():
#         try:
#             _generate_interview_notifications()
#             _generate_job_notifications()
#             _generate_resume_expiry_notifications()
#             print("[SCHEDULER] Notification generators refreshed.")
#         except Exception as e:
#             print(f"[SCHEDULER] Notification generator error: {e}")

scheduler = BackgroundScheduler()

scheduler.add_job(
    func=run_cleanup,
    trigger="cron",
    hour=2,
    minute=0,
    id="raw_resume_cleanup",
    replace_existing=True,
)

# scheduler.add_job(
#     func=run_notification_generators,
#     trigger="interval",
#     hours=1,                          # refresh notifications every hour
#     id="notification_refresh",
#     replace_existing=True,
# )

scheduler.start()
atexit.register(lambda: scheduler.shutdown(wait=False))

# ── Run notification generators once at startup ───────────────────────────────
# with app.app_context():
#     try:
#         _generate_interview_notifications()
#         _generate_job_notifications()
#         _generate_resume_expiry_notifications()
#         print("[STARTUP] Notification generators ran successfully.")
#     except Exception as e:
#         print(f"[STARTUP] Notification generator warning: {e}")

# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return {"status": "ok", "message": "ZentreeLabs Recruitment API running"}


if __name__ == "__main__":
    app.run(
        debug=True,
        use_reloader=False,
        host="0.0.0.0",
        port=5000
    )