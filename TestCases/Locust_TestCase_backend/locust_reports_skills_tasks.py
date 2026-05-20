

# import random
# import string
# from bson import ObjectId
# from datetime import datetime, timedelta

# from locust import HttpUser, TaskSet, between, task, events

# try:
#     from pymongo import MongoClient
#     _PYMONGO_AVAILABLE = True
# except ImportError:
#     _PYMONGO_AVAILABLE = False

# # ─────────────────────────────────────────────────────────────────────────────
# # Config — adjust to match your environment
# # ─────────────────────────────────────────────────────────────────────────────

# MONGO_URI = "mongodb://localhost:27017/"
# MONGO_DB  = "zentreePortal"

# # ─────────────────────────────────────────────────────────────────────────────
# # Shared state populated by test_start
# # ─────────────────────────────────────────────────────────────────────────────

# SEEDED_SKILL_OID: str = ""    # str ObjectId of the seeded skill
# SEEDED_IDS: dict      = {}    # holds all other inserted doc IDs for teardown


# # ─────────────────────────────────────────────────────────────────────────────
# # Seed / teardown
# # ─────────────────────────────────────────────────────────────────────────────

# @events.test_start.add_listener
# def seed_all(environment, **kwargs):
#     global SEEDED_SKILL_OID, SEEDED_IDS
#     if not _PYMONGO_AVAILABLE:
#         print("[locust] pymongo not available — skipping seed.")
#         return

#     client = MongoClient(MONGO_URI)
#     db     = client[MONGO_DB]

#     now   = datetime.utcnow()
#     start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
#     join  = start + timedelta(days=2)

#     # ── Jobs ──────────────────────────────────────────────────────────────────
#     j1 = db.jobs.insert_one({
#         "job_id":"LOCUST_JOB_001",
#         "title": "Locust Dev", "status": "Open",
#         "client_name": "Locust Corp", "client_id": "LC001",
#         "posted_by_name": "Locust Recruiter",
#         "required_skills": "LocustSkill", "skills": "LocustSkill",
#     }).inserted_id
#     j2 = db.jobs.insert_one({
#         "job_id": "LOCUST_JOB_002",
#         "title": "Locust Senior", "status": "Filled",
#         "client_name": "Alpha Ltd", "client_id": "LC002",
#         "posted_by_name": "Locust Recruiter",
#         "required_skills": "LocustSkill", "skills": "LocustSkill",
#     }).inserted_id

#     # ── Candidates ────────────────────────────────────────────────────────────
#     c1 = db.candidate_processing.insert_one({
#         "status": "New", "source": "LinkedIn",
#         "skills": "LocustSkill", "experience": 3,
#         "expected_salary": 800000, "notice_period": "30 days",
#         "resume_id": "LOCUST_RES_001",
#     }).inserted_id
#     c2 = db.candidate_processing.insert_one({
#         "status": "Hired", "source": "Naukri",
#         "skills": "LocustSkill", "experience": 6,
#         "expected_salary": 1200000, "notice_period": "Immediate",
#         "resume_id": "LOCUST_RES_002",
#     }).inserted_id

#     # ── Placements ────────────────────────────────────────────────────────────
#     p1 = db.placements.insert_one({
#         "joining_date":   join,
#         "recruiter":      "Locust Recruiter",
#         "client_name":    "Locust Corp",
#         "billing_amount": 600000,
#         "time_to_fill":   18,
#     }).inserted_id
#     p2 = db.placements.insert_one({
#         "joining_date":   join,
#         "recruiter":      "Locust Recruiter",
#         "client_name":    "Alpha Ltd",
#         "billing_amount": 900000,
#         "time_to_fill":   50,
#     }).inserted_id

#     # ── Tracking ──────────────────────────────────────────────────────────────
#     t1 = db.candidate_tracking.insert_one({
#         "resume_id": "LOCUST_RES_001",
#         "recruiter": "Locust Recruiter",
#         "client_name": "Locust Corp",
#         "current_stage": "Technical Interview",
#         "pipeline_status": "Active",
#     }).inserted_id

#     # ── Skill ─────────────────────────────────────────────────────────────────
#     db.skills_matrix.delete_many({"skill_name": "LocustSkill"})
#     skill_oid = db.skills_matrix.insert_one({
#         "skill_name":        "LocustSkill",
#         "category":          "Backend",
#         "demand_level":      "High",
#         "description":       "Load test skill",
#         "related_skills":    "LocustRelated",
#         "proficiency_levels": "",
#         "skill_id":          "SKL_LOCUST",
#         "created_at":        now,
#         "updated_at":        now,
#     }).inserted_id

#     # ── Bench ─────────────────────────────────────────────────────────────────
#     b1 = db.bench_people.insert_one({
#         "skills": "LocustSkill", "status": "Available",
#         "experience": 4, "expected_salary": 900000,
#     }).inserted_id

#     client.close()

#     SEEDED_SKILL_OID = str(skill_oid)
#     SEEDED_IDS = {
#         "jobs":       [j1, j2],
#         "candidates": [c1, c2],
#         "placements": [p1, p2],
#         "tracking":   [t1],
#         "skill":      skill_oid,
#         "bench":      [b1],
#     }
#     print(f"[locust] Seeded skill OID: {SEEDED_SKILL_OID}")


# @events.test_stop.add_listener
# def teardown_all(environment, **kwargs):
#     if not _PYMONGO_AVAILABLE or not SEEDED_IDS:
#         return
#     client = MongoClient(MONGO_URI)
#     db     = client[MONGO_DB]
#     db.jobs.delete_many({"_id": {"$in": SEEDED_IDS.get("jobs", [])}})
#     db.candidate_processing.delete_many({"_id": {"$in": SEEDED_IDS.get("candidates", [])}})
#     db.placements.delete_many({"_id": {"$in": SEEDED_IDS.get("placements", [])}})
#     db.candidate_tracking.delete_many({"_id": {"$in": SEEDED_IDS.get("tracking", [])}})
#     db.skills_matrix.delete_many({"skill_name": "LocustSkill"})
#     db.bench_people.delete_many({"_id": {"$in": SEEDED_IDS.get("bench", [])}})
#     client.close()
#     print("[locust] Cleaned up seeded data.")


# # ─────────────────────────────────────────────────────────────────────────────
# # Helpers
# # ─────────────────────────────────────────────────────────────────────────────

# def _random_email(prefix="locust"):
#     suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
#     return f"{prefix}_{suffix}@loadtest.com"


# def _register_and_login(client, role="admin"):
#     email = _random_email(role)
#     client.post("/api/auth/register", json={
#         "first_name": "Locust", "last_name": "User",
#         "email": email, "password": "Test@1234", "role": role,
#     }, name="/api/auth/register [setup]")
#     res = client.post("/api/auth/login",
#                       json={"email": email, "password": "Test@1234"},
#                       name="/api/auth/login [setup]")
#     return {"Authorization": f"Bearer {res.json().get('access_token', '')}"}


# PERIODS = ["thisMonth", "thisWeek", "lastMonth", "thisQuarter", "thisYear"]


# # ═════════════════════════════════════════════════════════════════════════════
# # ── REPORTS TASK SETS ────────────────────────────────────────────────────────
# # ═════════════════════════════════════════════════════════════════════════════

# class ReportsOverviewTaskSet(TaskSet):

#     @task(6)
#     def get_overview_default(self):
#         self.client.get("/api/reports/overview",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/overview")

#     @task(4)
#     def get_overview_with_period(self):
#         period = random.choice(PERIODS)
#         self.client.get(f"/api/reports/overview?period={period}",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/overview?period=*")

#     @task(1)
#     def get_overview_no_auth(self):
#         with self.client.get("/api/reports/overview",
#                              name="GET /api/reports/overview [no auth → 401]",
#                              catch_response=True) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class ReportsFunnelTaskSet(TaskSet):

#     @task(8)
#     def get_funnel(self):
#         self.client.get("/api/reports/funnel",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/funnel")

#     @task(2)
#     def get_funnel_validate_stages(self):
#         with self.client.get("/api/reports/funnel",
#                              headers=self.user.client.headers,
#                              name="GET /api/reports/funnel [stage count check]",
#                              catch_response=True) as res:
#             if res.status_code != 200:
#                 res.failure(f"Status {res.status_code}")
#                 return
#             data = res.json().get("data", [])
#             if len(data) == 6:
#                 res.success()
#             else:
#                 res.failure(f"Expected 6 stages, got {len(data)}")

#     @task(1)
#     def get_funnel_no_auth(self):
#         with self.client.get("/api/reports/funnel",
#                              name="GET /api/reports/funnel [no auth → 401]",
#                              catch_response=True) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class ReportsRecruiterPerformanceTaskSet(TaskSet):

#     @task(5)
#     def get_recruiter_performance_default(self):
#         self.client.get("/api/reports/recruiter-performance",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/recruiter-performance")

#     @task(4)
#     def get_recruiter_performance_with_period(self):
#         period = random.choice(PERIODS)
#         self.client.get(f"/api/reports/recruiter-performance?period={period}",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/recruiter-performance?period=*")

#     @task(1)
#     def get_recruiter_performance_no_auth(self):
#         with self.client.get(
#             "/api/reports/recruiter-performance",
#             headers={"Authorization": ""},          # ← override global token
#             name="GET /api/reports/recruiter-performance [no auth → 401]",
#             catch_response=True,
#         ) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class ReportsClientWiseTaskSet(TaskSet):

#     @task(5)
#     def get_client_wise_default(self):
#         self.client.get("/api/reports/client-wise",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/client-wise")

#     @task(4)
#     def get_client_wise_with_period(self):
#         period = random.choice(PERIODS)
#         self.client.get(f"/api/reports/client-wise?period={period}",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/client-wise?period=*")

#     @task(1)
#     def get_client_wise_no_auth(self):
#         with self.client.get("/api/reports/client-wise",
#                              name="GET /api/reports/client-wise [no auth → 401]",
#                              catch_response=True) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class ReportsTimeToFillTaskSet(TaskSet):

#     @task(8)
#     def get_time_to_fill(self):
#         self.client.get("/api/reports/time-to-fill",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/time-to-fill")

#     @task(2)
#     def get_time_to_fill_validate_buckets(self):
#         with self.client.get("/api/reports/time-to-fill",
#                              headers=self.user.client.headers,
#                              name="GET /api/reports/time-to-fill [bucket count check]",
#                              catch_response=True) as res:
#             if res.status_code != 200:
#                 res.failure(f"Status {res.status_code}")
#                 return
#             dist = res.json().get("data", {}).get("distribution", [])
#             if len(dist) == 5:
#                 res.success()
#             else:
#                 res.failure(f"Expected 5 buckets, got {len(dist)}")

#     @task(1)
#     def get_time_to_fill_no_auth(self):
#         with self.client.get("/api/reports/time-to-fill",
#                              name="GET /api/reports/time-to-fill [no auth → 401]",
#                              catch_response=True) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class ReportsSourceEffectivenessTaskSet(TaskSet):

#     @task(8)
#     def get_source_effectiveness(self):
#         self.client.get("/api/reports/source-effectiveness",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/source-effectiveness")

#     @task(2)
#     def get_source_validate_shape(self):
#         with self.client.get("/api/reports/source-effectiveness",
#                              headers=self.user.client.headers,
#                              name="GET /api/reports/source-effectiveness [shape check]",
#                              catch_response=True) as res:
#             if res.status_code != 200:
#                 res.failure(f"Status {res.status_code}")
#                 return
#             items = res.json().get("data", [])
#             for item in items:
#                 for key in ("source", "candidates", "hires", "efficiency"):
#                     if key not in item:
#                         res.failure(f"Missing key: {key}")
#                         return
#             res.success()

#     @task(1)
#     def get_source_effectiveness_no_auth(self):
#         with self.client.get("/api/reports/source-effectiveness",
#                              name="GET /api/reports/source-effectiveness [no auth → 401]",
#                              catch_response=True) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class ReportsJourneyTaskSet(TaskSet):
#     """Full dashboard journey: hits every report endpoint in sequence."""

#     @task(3)
#     def full_reports_journey(self):
#         period = random.choice(PERIODS)
#         for path in (
#             f"/api/reports/overview?period={period}",
#             "/api/reports/funnel",
#             f"/api/reports/recruiter-performance?period={period}",
#             f"/api/reports/client-wise?period={period}",
#             "/api/reports/time-to-fill",
#             "/api/reports/source-effectiveness",
#         ):
#             name = "GET " + path.split("?")[0] + " [journey]"
#             self.client.get(path, headers=self.user.client.headers, name=name)

#     @task(2)
#     def overview_only(self):
#         self.client.get("/api/reports/overview",
#                         headers=self.user.client.headers,
#                         name="GET /api/reports/overview [journey-only]")


# # ═════════════════════════════════════════════════════════════════════════════
# # ── SKILLS TASK SETS ─────────────────────────────────────────────────────────
# # ═════════════════════════════════════════════════════════════════════════════

# class SkillsGetAllTaskSet(TaskSet):

#     @task(5)
#     def get_all_skills(self):
#         self.client.get("/api/skills/",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/")

#     @task(3)
#     def get_skills_filter_category(self):
#         cat = random.choice(["Backend", "Frontend", "DevOps", "Other"])
#         self.client.get(f"/api/skills/?category={cat}",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/?category=*")

#     @task(3)
#     def get_skills_filter_demand(self):
#         demand = random.choice(["High", "Medium", "Low"])
#         self.client.get(f"/api/skills/?demand={demand}",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/?demand=*")

#     @task(2)
#     def get_skills_search_q(self):
#         self.client.get("/api/skills/?q=LocustSkill",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/?q=*")

#     @task(1)
#     def get_skills_no_auth(self):
#         with self.client.get("/api/skills/",
#                              name="GET /api/skills/ [no auth → 401]",
#                              catch_response=True) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class SkillsGetOneTaskSet(TaskSet):

#     @task(5)
#     def get_one_skill_valid(self):
#         if not SEEDED_SKILL_OID:
#             return
#         self.client.get(f"/api/skills/{SEEDED_SKILL_OID}",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/<id> [valid]")

#     @task(2)
#     def get_one_skill_invalid_id(self):
#         with self.client.get("/api/skills/NOT_AN_OID",
#                              headers=self.user.client.headers,
#                              name="GET /api/skills/<id> [bad id → 400]",
#                              catch_response=True) as res:
#             if res.status_code == 400:
#                 res.success()
#             else:
#                 res.failure(f"Expected 400, got {res.status_code}")

#     @task(1)
#     def get_one_skill_unknown_id(self):
#         fake = str(ObjectId())
#         with self.client.get(f"/api/skills/{fake}",
#                              headers=self.user.client.headers,
#                              name="GET /api/skills/<id> [unknown → 404]",
#                              catch_response=True) as res:
#             if res.status_code == 404:
#                 res.success()
#             else:
#                 res.failure(f"Expected 404, got {res.status_code}")


# class SkillsByJobTaskSet(TaskSet):

#     @task(5)
#     def get_by_job(self):
#         self.client.get("/api/skills/by-job/JOB_TEST_001",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/by-job/<job_id>")

#     @task(2)
#     def get_by_job_no_match(self):
#         self.client.get(f"/api/skills/by-job/NOJOB_{ObjectId()}",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/by-job/<job_id> [no match]")


# class SkillsCreateTaskSet(TaskSet):
#     """Creates real skills — cleaned up between runs via teardown."""

#     @task(5)
#     def create_valid_skill(self):
#         name = f"LS_{ObjectId()}"
#         self.client.post("/api/skills/", json={
#             "skill_name":   name,
#             "category":     random.choice(["Backend", "Frontend", "DevOps", "Other"]),
#             "demand_level": random.choice(["High", "Medium", "Low"]),
#         }, headers=self.user.client.headers,
#            name="POST /api/skills/ [valid]")

#     @task(2)
#     def create_skill_with_all_fields(self):
#         name = f"LSFull_{ObjectId()}"
#         self.client.post("/api/skills/", json={
#             "skill_name":   name,
#             "category":     "Backend",
#             "demand_level": "High",
#             "description":  "Load test full skill",
#             "related_skills": "Python, Django",
#         }, headers=self.user.client.headers,
#            name="POST /api/skills/ [all fields]")

#     @task(1)
#     def create_skill_missing_category(self):
#         with self.client.post("/api/skills/", json={"skill_name": f"NoCat_{ObjectId()}"},
#                               headers=self.user.client.headers,
#                               name="POST /api/skills/ [missing category → 400]",
#                               catch_response=True) as res:
#             if res.status_code == 400:
#                 res.success()
#             else:
#                 res.failure(f"Expected 400, got {res.status_code}")

#     @task(1)
#     def create_skill_no_auth(self):
#         with self.client.post(
#             "/api/skills/",
#             json={"skill_name": "X", "category": "Other"},
#             headers={"Authorization": ""},        # ← override global token
#             name="POST /api/skills/ [no auth → 401]",
#             catch_response=True,
#         ) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class SkillsBulkCreateTaskSet(TaskSet):

#     @task(4)
#     def bulk_create_skills(self):
#         skills = [
#             {"skill_name": f"BLK_{ObjectId()}", "category": "Backend"},
#             {"skill_name": f"BLK_{ObjectId()}", "category": "Frontend"},
#         ]
#         self.client.post("/api/skills/bulk", json={"skills": skills},
#                          headers=self.user.client.headers,
#                          name="POST /api/skills/bulk")

#     @task(1)
#     def bulk_create_empty_returns_400(self):
#         with self.client.post("/api/skills/bulk", json={"skills": []},
#                               headers=self.user.client.headers,
#                               name="POST /api/skills/bulk [empty → 400]",
#                               catch_response=True) as res:
#             if res.status_code == 400:
#                 res.success()
#             else:
#                 res.failure(f"Expected 400, got {res.status_code}")


# class SkillsUpdateTaskSet(TaskSet):
#     """Creates a skill, then updates it."""

#     def _create_and_get_id(self):
#         res = self.client.post("/api/skills/", json={
#             "skill_name": f"UPD_{ObjectId()}",
#             "category":   "Backend",
#         }, headers=self.user.client.headers, name="POST /api/skills/ [setup for update]")
#         if res.status_code == 201:
#             return res.json().get("data", {}).get("_id")
#         return None

#     @task(5)
#     def update_demand_level(self):
#         sid = self._create_and_get_id()
#         if not sid:
#             return
#         self.client.put(f"/api/skills/{sid}",
#                         json={"demand_level": random.choice(["High", "Medium", "Low"])},
#                         headers=self.user.client.headers,
#                         name="PUT /api/skills/<id> [demand_level]")

#     @task(2)
#     def update_description(self):
#         sid = self._create_and_get_id()
#         if not sid:
#             return
#         self.client.put(f"/api/skills/{sid}",
#                         json={"description": f"Updated at {datetime.utcnow().isoformat()}"},
#                         headers=self.user.client.headers,
#                         name="PUT /api/skills/<id> [description]")

#     @task(1)
#     def update_invalid_demand_returns_400(self):
#         sid = self._create_and_get_id()
#         if not sid:
#             return
#         with self.client.put(f"/api/skills/{sid}",
#                              json={"demand_level": "INVALID"},
#                              headers=self.user.client.headers,
#                              name="PUT /api/skills/<id> [bad demand → 400]",
#                              catch_response=True) as res:
#             if res.status_code == 400:
#                 res.success()
#             else:
#                 res.failure(f"Expected 400, got {res.status_code}")


# class SkillsDeleteTaskSet(TaskSet):

#     def _create_and_get_id(self):
#         res = self.client.post("/api/skills/", json={
#             "skill_name": f"DEL_{ObjectId()}",
#             "category":   "Other",
#         }, headers=self.user.client.headers, name="POST /api/skills/ [setup for delete]")
#         if res.status_code == 201:
#             return res.json().get("data", {}).get("_id")
#         return None

#     @task(5)
#     def delete_skill(self):
#         sid = self._create_and_get_id()
#         if not sid:
#             return
#         self.client.delete(f"/api/skills/{sid}",
#                            headers=self.user.client.headers,
#                            name="DELETE /api/skills/<id>")

#     @task(1)
#     def delete_invalid_id_returns_400(self):
#         with self.client.delete("/api/skills/BAD_ID",
#                                 headers=self.user.client.headers,
#                                 name="DELETE /api/skills/<id> [bad id → 400]",
#                                 catch_response=True) as res:
#             if res.status_code == 400:
#                 res.success()
#             else:
#                 res.failure(f"Expected 400, got {res.status_code}")

#     @task(1)
#     def delete_unknown_id_returns_404(self):
#         fake = str(ObjectId())
#         with self.client.delete(f"/api/skills/{fake}",
#                                 headers=self.user.client.headers,
#                                 name="DELETE /api/skills/<id> [unknown → 404]",
#                                 catch_response=True) as res:
#             if res.status_code == 404:
#                 res.success()
#             else:
#                 res.failure(f"Expected 404, got {res.status_code}")


# class SkillsMetaTaskSet(TaskSet):

#     @task(8)
#     def get_meta_options(self):
#         self.client.get("/api/skills/meta/options",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/meta/options")

#     @task(2)
#     def validate_meta_options_shape(self):
#         with self.client.get("/api/skills/meta/options",
#                              headers=self.user.client.headers,
#                              name="GET /api/skills/meta/options [shape check]",
#                              catch_response=True) as res:
#             if res.status_code != 200:
#                 res.failure(f"Status {res.status_code}")
#                 return
#             body = res.json()
#             if "categories" in body and "demand_levels" in body:
#                 res.success()
#             else:
#                 res.failure("Missing categories or demand_levels")

#     @task(1)
#     def get_meta_no_auth(self):
#         with self.client.get("/api/skills/meta/options",
#                              name="GET /api/skills/meta/options [no auth → 401]",
#                              catch_response=True) as res:
#             if res.status_code == 401:
#                 res.success()
#             else:
#                 res.failure(f"Expected 401, got {res.status_code}")


# class SkillsInsightsTaskSet(TaskSet):

#     @task(6)
#     def get_insights_valid(self):
#         if not SEEDED_SKILL_OID:
#             return
#         self.client.get(f"/api/skills/{SEEDED_SKILL_OID}/insights",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/<id>/insights [valid]")

#     @task(2)
#     def get_insights_validate_shape(self):
#         if not SEEDED_SKILL_OID:
#             return
#         with self.client.get(f"/api/skills/{SEEDED_SKILL_OID}/insights",
#                              headers=self.user.client.headers,
#                              name="GET /api/skills/<id>/insights [shape check]",
#                              catch_response=True) as res:
#             if res.status_code != 200:
#                 res.failure(f"Status {res.status_code}")
#                 return
#             data = res.json().get("data", {})
#             required = ("candidate_total", "bench_total", "open_jobs",
#                         "salary_avg", "demand_gap")
#             for key in required:
#                 if key not in data:
#                     res.failure(f"Missing key: {key}")
#                     return
#             res.success()

#     @task(1)
#     def get_insights_invalid_id(self):
#         with self.client.get("/api/skills/BAD_OID/insights",
#                              headers=self.user.client.headers,
#                              name="GET /api/skills/<id>/insights [bad id → 400]",
#                              catch_response=True) as res:
#             if res.status_code == 400:
#                 res.success()
#             else:
#                 res.failure(f"Expected 400, got {res.status_code}")

#     @task(1)
#     def get_insights_unknown_id(self):
#         fake = str(ObjectId())
#         with self.client.get(f"/api/skills/{fake}/insights",
#                              headers=self.user.client.headers,
#                              name="GET /api/skills/<id>/insights [unknown → 404]",
#                              catch_response=True) as res:
#             if res.status_code == 404:
#                 res.success()
#             else:
#                 res.failure(f"Expected 404, got {res.status_code}")


# class SkillsJourneyTaskSet(TaskSet):
#     """Realistic skill management session: list → create → update → get insights → delete."""

#     @task(2)
#     def full_skill_journey(self):
#         # 1. List
#         self.client.get("/api/skills/",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/ [journey]")
#         # 2. Create
#         name = f"JRN_{ObjectId()}"
#         res  = self.client.post("/api/skills/", json={
#             "skill_name": name, "category": "Backend", "demand_level": "Medium",
#         }, headers=self.user.client.headers, name="POST /api/skills/ [journey]")
#         if res.status_code != 201:
#             return
#         sid = res.json().get("data", {}).get("_id")
#         if not sid:
#             return
#         # 3. Update
#         self.client.put(f"/api/skills/{sid}",
#                         json={"demand_level": "High"},
#                         headers=self.user.client.headers,
#                         name="PUT /api/skills/<id> [journey]")
#         # 4. Meta options
#         self.client.get("/api/skills/meta/options",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/meta/options [journey]")
#         # 5. Delete
#         self.client.delete(f"/api/skills/{sid}",
#                            headers=self.user.client.headers,
#                            name="DELETE /api/skills/<id> [journey]")

#     @task(3)
#     def list_and_insights(self):
#         self.client.get("/api/skills/",
#                         headers=self.user.client.headers,
#                         name="GET /api/skills/ [journey-list]")
#         if SEEDED_SKILL_OID:
#             self.client.get(f"/api/skills/{SEEDED_SKILL_OID}/insights",
#                             headers=self.user.client.headers,
#                             name="GET /api/skills/<id>/insights [journey]")


# # ═════════════════════════════════════════════════════════════════════════════
# # ── USER CLASSES ─────────────────────────────────────────────────────────────
# # ═════════════════════════════════════════════════════════════════════════════

# class ReportsAdminUser(HttpUser):
#     """
#     Admin hitting all report endpoints.
#     Reports are read-only and heavy on aggregations — moderate wait.
#     """
#     weight    = 3
#     wait_time = between(1, 3)
#     tasks     = {
#         ReportsOverviewTaskSet:             4,
#         ReportsFunnelTaskSet:               3,
#         ReportsRecruiterPerformanceTaskSet: 3,
#         ReportsClientWiseTaskSet:           3,
#         ReportsTimeToFillTaskSet:           3,
#         ReportsSourceEffectivenessTaskSet:  3,
#         ReportsJourneyTaskSet:              4,
#     }

#     def on_start(self):
#         self.auth_headers = _register_and_login(self.client, role="admin")


# class ReportsRecruiterUser(HttpUser):
#     """
#     Recruiter: primarily checks overview, funnel, and source reports.
#     """
#     weight    = 2
#     wait_time = between(2, 5)
#     tasks     = {
#         ReportsOverviewTaskSet:            5,
#         ReportsFunnelTaskSet:              4,
#         ReportsSourceEffectivenessTaskSet: 3,
#         ReportsJourneyTaskSet:             2,
#     }

#     def on_start(self):
#         self.auth_headers = _register_and_login(self.client, role="recruiter")


# class SkillsAdminUser(HttpUser):
#     """
#     Admin managing the skills matrix — full CRUD + insights.
#     """
#     weight    = 2
#     wait_time = between(1, 3)
#     tasks     = {
#         SkillsGetAllTaskSet:    4,
#         SkillsGetOneTaskSet:    3,
#         SkillsByJobTaskSet:     2,
#         SkillsCreateTaskSet:    3,
#         SkillsBulkCreateTaskSet: 1,
#         SkillsUpdateTaskSet:    2,
#         SkillsDeleteTaskSet:    2,
#         SkillsMetaTaskSet:      3,
#         SkillsInsightsTaskSet:  4,
#         SkillsJourneyTaskSet:   3,
#     }

#     def on_start(self):
#         self.auth_headers = _register_and_login(self.client, role="admin")


# class SkillsReadOnlyUser(HttpUser):
#     """
#     Recruiter browsing skills and checking insights — no writes.
#     """
#     weight    = 2
#     wait_time = between(2, 5)
#     tasks     = {
#         SkillsGetAllTaskSet:   6,
#         SkillsGetOneTaskSet:   4,
#         SkillsByJobTaskSet:    3,
#         SkillsMetaTaskSet:     4,
#         SkillsInsightsTaskSet: 5,
#     }

#     def on_start(self):
#         self.auth_headers = _register_and_login(self.client, role="recruiter")


# class MixedDashboardUser(HttpUser):
#     """
#     Power user who checks reports and manages skills in the same session.
#     """
#     weight    = 1
#     wait_time = between(1, 4)
#     tasks     = {
#         ReportsOverviewTaskSet:  3,
#         ReportsFunnelTaskSet:    2,
#         SkillsGetAllTaskSet:     3,
#         SkillsInsightsTaskSet:   3,
#         SkillsJourneyTaskSet:    2,
#         ReportsJourneyTaskSet:   2,
#     }

#     def on_start(self):
#         self.auth_headers = _register_and_login(self.client, role="admin")




import random
import string
from bson import ObjectId
from datetime import datetime, timedelta

from locust import HttpUser, TaskSet, between, task, events

try:
    from pymongo import MongoClient
    _PYMONGO_AVAILABLE = True
except ImportError:
    _PYMONGO_AVAILABLE = False

# ─────────────────────────────────────────────────────────────────────────────
# Config — adjust to match your environment
# ─────────────────────────────────────────────────────────────────────────────

MONGO_URI = "mongodb://localhost:27017/"
MONGO_DB  = "zentreePortal"

# ─────────────────────────────────────────────────────────────────────────────
# Shared state populated by test_start
# ─────────────────────────────────────────────────────────────────────────────

SEEDED_SKILL_OID: str = ""
SEEDED_IDS: dict      = {}


# ─────────────────────────────────────────────────────────────────────────────
# Seed / teardown
# ─────────────────────────────────────────────────────────────────────────────

@events.test_start.add_listener
def seed_all(environment, **kwargs):
    global SEEDED_SKILL_OID, SEEDED_IDS
    if not _PYMONGO_AVAILABLE:
        print("[locust] pymongo not available — skipping seed.")
        return

    client = MongoClient(MONGO_URI)
    db     = client[MONGO_DB]

    now   = datetime.utcnow()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    join  = start + timedelta(days=2)

    # ── Jobs ──────────────────────────────────────────────────────────────────
    j1 = db.jobs.insert_one({
        "job_id":          "LOCUST_JOB_001",
        "title":           "Locust Dev",
        "status":          "Open",
        "client_name":     "Locust Corp",
        "client_id":       "LC001",
        "posted_by_name":  "Locust Recruiter",
        "required_skills": "LocustSkill",
        "skills":          "LocustSkill",
        "experience_min":  0,
        "experience_max":  10,
        "salary_min":      0,
        "salary_max":      0,
        "location":        "Hyderabad",
        "work_mode":       "Remote",
    }).inserted_id
    j2 = db.jobs.insert_one({
        "job_id":          "LOCUST_JOB_002",
        "title":           "Locust Senior",
        "status":          "Filled",
        "client_name":     "Alpha Ltd",
        "client_id":       "LC002",
        "posted_by_name":  "Locust Recruiter",
        "required_skills": "LocustSkill",
        "skills":          "LocustSkill",
    }).inserted_id

    # ── Candidates ────────────────────────────────────────────────────────────
    c1 = db.candidate_processing.insert_one({
        "resume_id":       "LOCUST_RES_001",
        "name":            "Locust Candidate",
        "current_role":    "Backend Developer",
        "location":        "Hyderabad",
        "status":          "New",
        "source":          "LinkedIn",
        "skills":          "LocustSkill",
        "experience":      3,
        "expected_salary": 800000,
        "notice_period":   "30 days",
    }).inserted_id
    c2 = db.candidate_processing.insert_one({
        "resume_id":       "LOCUST_RES_002",
        "name":            "Locust Candidate 2",
        "current_role":    "Senior Developer",
        "location":        "Hyderabad",
        "status":          "Hired",
        "source":          "Naukri",
        "skills":          "LocustSkill",
        "experience":      6,
        "expected_salary": 1200000,
        "notice_period":   "Immediate",
    }).inserted_id

    # ── Placements ────────────────────────────────────────────────────────────
    p1 = db.placements.insert_one({
        "joining_date":   join,
        "recruiter":      "Locust Recruiter",
        "client_name":    "Locust Corp",
        "billing_amount": 600000,
        "time_to_fill":   18,
    }).inserted_id
    p2 = db.placements.insert_one({
        "joining_date":   join,
        "recruiter":      "Locust Recruiter",
        "client_name":    "Alpha Ltd",
        "billing_amount": 900000,
        "time_to_fill":   50,
    }).inserted_id

    # ── Tracking ──────────────────────────────────────────────────────────────
    t1 = db.candidate_tracking.insert_one({
        "resume_id":       "LOCUST_RES_001",
        "recruiter":       "Locust Recruiter",
        "client_name":     "Locust Corp",
        "current_stage":   "Technical Interview",
        "pipeline_status": "Active",
    }).inserted_id

    # ── Skill ─────────────────────────────────────────────────────────────────
    db.skills_matrix.delete_many({"skill_name": "LocustSkill"})
    skill_oid = db.skills_matrix.insert_one({
        "skill_name":         "LocustSkill",
        "category":           "Backend",
        "demand_level":       "High",
        "description":        "Load test skill",
        "related_skills":     "LocustRelated",
        "proficiency_levels": "",
        "skill_id":           "SKL_LOCUST",
        "created_at":         now,
        "updated_at":         now,
    }).inserted_id

    # ── Bench ─────────────────────────────────────────────────────────────────
    b1 = db.bench_people.insert_one({
        "skills":          "LocustSkill",
        "status":          "Available",
        "experience":      4,
        "expected_salary": 900000,
    }).inserted_id

    client.close()

    SEEDED_SKILL_OID = str(skill_oid)
    SEEDED_IDS = {
        "jobs":       [j1, j2],
        "candidates": [c1, c2],
        "placements": [p1, p2],
        "tracking":   [t1],
        "skill":      skill_oid,
        "bench":      [b1],
    }
    print(f"[locust] Seeded skill OID: {SEEDED_SKILL_OID}")


@events.test_stop.add_listener
def teardown_all(environment, **kwargs):
    if not _PYMONGO_AVAILABLE or not SEEDED_IDS:
        return
    client = MongoClient(MONGO_URI)
    db     = client[MONGO_DB]
    db.jobs.delete_many({"_id": {"$in": SEEDED_IDS.get("jobs", [])}})
    db.jobs.delete_many({"job_id": {"$in": ["LOCUST_JOB_001", "LOCUST_JOB_002"]}})
    db.candidate_processing.delete_many({"_id": {"$in": SEEDED_IDS.get("candidates", [])}})
    db.candidate_processing.delete_many({"resume_id": {"$in": ["LOCUST_RES_001", "LOCUST_RES_002"]}})
    db.placements.delete_many({"_id": {"$in": SEEDED_IDS.get("placements", [])}})
    db.candidate_tracking.delete_many({"_id": {"$in": SEEDED_IDS.get("tracking", [])}})
    db.skills_matrix.delete_many({"skill_name": "LocustSkill"})
    db.bench_people.delete_many({"_id": {"$in": SEEDED_IDS.get("bench", [])}})
    client.close()
    print("[locust] Cleaned up seeded data.")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _random_email(prefix="locust"):
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}_{suffix}@loadtest.com"


def _register_and_login(client, role="admin"):
    email = _random_email(role)
    client.post("/api/auth/register", json={
        "first_name": "Locust", "last_name": "User",
        "email": email, "password": "Test@1234", "role": role,
    }, name="/api/auth/register [setup]")
    res = client.post("/api/auth/login",
                      json={"email": email, "password": "Test@1234"},
                      name="/api/auth/login [setup]")
    return {"Authorization": f"Bearer {res.json().get('access_token', '')}"}


PERIODS = ["thisMonth", "thisWeek", "lastMonth", "thisQuarter", "thisYear"]


# ═════════════════════════════════════════════════════════════════════════════
# ── REPORTS TASK SETS ────────────────────────────────────────────────────────
# ═════════════════════════════════════════════════════════════════════════════

class ReportsOverviewTaskSet(TaskSet):

    @task(6)
    def get_overview_default(self):
        self.client.get("/api/reports/overview",
                        headers=self.user.client.headers,
                        name="GET /api/reports/overview")

    @task(4)
    def get_overview_with_period(self):
        period = random.choice(PERIODS)
        self.client.get(f"/api/reports/overview?period={period}",
                        headers=self.user.client.headers,
                        name="GET /api/reports/overview?period=*")

    @task(1)
    def get_overview_no_auth(self):
        with self.client.get("/api/reports/overview",
                             headers={"Authorization": ""},
                             name="GET /api/reports/overview [no auth → 401]",
                             catch_response=True) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class ReportsFunnelTaskSet(TaskSet):

    @task(8)
    def get_funnel(self):
        self.client.get("/api/reports/funnel",
                        headers=self.user.client.headers,
                        name="GET /api/reports/funnel")

    @task(2)
    def get_funnel_validate_stages(self):
        with self.client.get("/api/reports/funnel",
                             headers=self.user.client.headers,
                             name="GET /api/reports/funnel [stage count check]",
                             catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"Status {res.status_code}")
                return
            data = res.json().get("data", [])
            if len(data) == 6:
                res.success()
            else:
                res.failure(f"Expected 6 stages, got {len(data)}")

    @task(1)
    def get_funnel_no_auth(self):
        with self.client.get("/api/reports/funnel",
                             headers={"Authorization": ""},
                             name="GET /api/reports/funnel [no auth → 401]",
                             catch_response=True) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class ReportsRecruiterPerformanceTaskSet(TaskSet):

    @task(5)
    def get_recruiter_performance_default(self):
        self.client.get("/api/reports/recruiter-performance",
                        headers=self.user.client.headers,
                        name="GET /api/reports/recruiter-performance")

    @task(4)
    def get_recruiter_performance_with_period(self):
        period = random.choice(PERIODS)
        self.client.get(f"/api/reports/recruiter-performance?period={period}",
                        headers=self.user.client.headers,
                        name="GET /api/reports/recruiter-performance?period=*")

    @task(1)
    def get_recruiter_performance_no_auth(self):
        with self.client.get(
            "/api/reports/recruiter-performance",
            headers={"Authorization": ""},
            name="GET /api/reports/recruiter-performance [no auth → 401]",
            catch_response=True,
        ) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class ReportsClientWiseTaskSet(TaskSet):

    @task(5)
    def get_client_wise_default(self):
        self.client.get("/api/reports/client-wise",
                        headers=self.user.client.headers,
                        name="GET /api/reports/client-wise")

    @task(4)
    def get_client_wise_with_period(self):
        period = random.choice(PERIODS)
        self.client.get(f"/api/reports/client-wise?period={period}",
                        headers=self.user.client.headers,
                        name="GET /api/reports/client-wise?period=*")

    @task(1)
    def get_client_wise_no_auth(self):
        with self.client.get("/api/reports/client-wise",
                             headers={"Authorization": ""},
                             name="GET /api/reports/client-wise [no auth → 401]",
                             catch_response=True) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class ReportsTimeToFillTaskSet(TaskSet):

    @task(8)
    def get_time_to_fill(self):
        self.client.get("/api/reports/time-to-fill",
                        headers=self.user.client.headers,
                        name="GET /api/reports/time-to-fill")

    @task(2)
    def get_time_to_fill_validate_buckets(self):
        with self.client.get("/api/reports/time-to-fill",
                             headers=self.user.client.headers,
                             name="GET /api/reports/time-to-fill [bucket count check]",
                             catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"Status {res.status_code}")
                return
            dist = res.json().get("data", {}).get("distribution", [])
            if len(dist) == 5:
                res.success()
            else:
                res.failure(f"Expected 5 buckets, got {len(dist)}")

    @task(1)
    def get_time_to_fill_no_auth(self):
        with self.client.get("/api/reports/time-to-fill",
                             headers={"Authorization": ""},
                             name="GET /api/reports/time-to-fill [no auth → 401]",
                             catch_response=True) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class ReportsSourceEffectivenessTaskSet(TaskSet):

    @task(8)
    def get_source_effectiveness(self):
        self.client.get("/api/reports/source-effectiveness",
                        headers=self.user.client.headers,
                        name="GET /api/reports/source-effectiveness")

    @task(2)
    def get_source_validate_shape(self):
        with self.client.get("/api/reports/source-effectiveness",
                             headers=self.user.client.headers,
                             name="GET /api/reports/source-effectiveness [shape check]",
                             catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"Status {res.status_code}")
                return
            items = res.json().get("data", [])
            for item in items:
                for key in ("source", "candidates", "hires", "efficiency"):
                    if key not in item:
                        res.failure(f"Missing key: {key}")
                        return
            res.success()

    @task(1)
    def get_source_effectiveness_no_auth(self):
        with self.client.get("/api/reports/source-effectiveness",
                             headers={"Authorization": ""},
                             name="GET /api/reports/source-effectiveness [no auth → 401]",
                             catch_response=True) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class ReportsJourneyTaskSet(TaskSet):
    """Full dashboard journey: hits every report endpoint in sequence."""

    @task(3)
    def full_reports_journey(self):
        period = random.choice(PERIODS)
        for path in (
            f"/api/reports/overview?period={period}",
            "/api/reports/funnel",
            f"/api/reports/recruiter-performance?period={period}",
            f"/api/reports/client-wise?period={period}",
            "/api/reports/time-to-fill",
            "/api/reports/source-effectiveness",
        ):
            name = "GET " + path.split("?")[0] + " [journey]"
            self.client.get(path, headers=self.user.client.headers, name=name)

    @task(2)
    def overview_only(self):
        self.client.get("/api/reports/overview",
                        headers=self.user.client.headers,
                        name="GET /api/reports/overview [journey-only]")


# ═════════════════════════════════════════════════════════════════════════════
# ── SKILLS TASK SETS ─────────────────────────────────────────────────────────
# ═════════════════════════════════════════════════════════════════════════════

class SkillsGetAllTaskSet(TaskSet):

    @task(5)
    def get_all_skills(self):
        self.client.get("/api/skills/",
                        headers=self.user.client.headers,
                        name="GET /api/skills/")

    @task(3)
    def get_skills_filter_category(self):
        cat = random.choice(["Backend", "Frontend", "DevOps", "Other"])
        self.client.get(f"/api/skills/?category={cat}",
                        headers=self.user.client.headers,
                        name="GET /api/skills/?category=*")

    @task(3)
    def get_skills_filter_demand(self):
        demand = random.choice(["High", "Medium", "Low"])
        self.client.get(f"/api/skills/?demand={demand}",
                        headers=self.user.client.headers,
                        name="GET /api/skills/?demand=*")

    @task(2)
    def get_skills_search_q(self):
        self.client.get("/api/skills/?q=LocustSkill",
                        headers=self.user.client.headers,
                        name="GET /api/skills/?q=*")

    @task(1)
    def get_skills_no_auth(self):
        with self.client.get("/api/skills/",
                             headers={"Authorization": ""},
                             name="GET /api/skills/ [no auth → 401]",
                             catch_response=True) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class SkillsGetOneTaskSet(TaskSet):

    @task(5)
    def get_one_skill_valid(self):
        if not SEEDED_SKILL_OID:
            return
        self.client.get(f"/api/skills/{SEEDED_SKILL_OID}",
                        headers=self.user.client.headers,
                        name="GET /api/skills/<id> [valid]")

    @task(2)
    def get_one_skill_invalid_id(self):
        with self.client.get("/api/skills/NOT_AN_OID",
                             headers=self.user.client.headers,
                             name="GET /api/skills/<id> [bad id → 400]",
                             catch_response=True) as res:
            if res.status_code == 400:
                res.success()
            else:
                res.failure(f"Expected 400, got {res.status_code}")

    @task(1)
    def get_one_skill_unknown_id(self):
        fake = str(ObjectId())
        with self.client.get(f"/api/skills/{fake}",
                             headers=self.user.client.headers,
                             name="GET /api/skills/<id> [unknown → 404]",
                             catch_response=True) as res:
            if res.status_code == 404:
                res.success()
            else:
                res.failure(f"Expected 404, got {res.status_code}")


class SkillsByJobTaskSet(TaskSet):

    @task(5)
    def get_by_job(self):
        self.client.get("/api/skills/by-job/LOCUST_JOB_001",
                        headers=self.user.client.headers,
                        name="GET /api/skills/by-job/<job_id>")

    @task(2)
    def get_by_job_no_match(self):
        self.client.get(f"/api/skills/by-job/NOJOB_{ObjectId()}",
                        headers=self.user.client.headers,
                        name="GET /api/skills/by-job/<job_id> [no match]")


class SkillsCreateTaskSet(TaskSet):

    @task(5)
    def create_valid_skill(self):
        name = f"LS_{ObjectId()}"
        self.client.post("/api/skills/", json={
            "skill_name":   name,
            "category":     random.choice(["Backend", "Frontend", "DevOps", "Other"]),
            "demand_level": random.choice(["High", "Medium", "Low"]),
        }, headers=self.user.client.headers,
           name="POST /api/skills/ [valid]")

    @task(2)
    def create_skill_with_all_fields(self):
        name = f"LSFull_{ObjectId()}"
        self.client.post("/api/skills/", json={
            "skill_name":     name,
            "category":       "Backend",
            "demand_level":   "High",
            "description":    "Load test full skill",
            "related_skills": "Python, Django",
        }, headers=self.user.client.headers,
           name="POST /api/skills/ [all fields]")

    @task(1)
    def create_skill_missing_category(self):
        with self.client.post("/api/skills/",
                              json={"skill_name": f"NoCat_{ObjectId()}"},
                              headers=self.user.client.headers,
                              name="POST /api/skills/ [missing category → 400]",
                              catch_response=True) as res:
            if res.status_code == 400:
                res.success()
            else:
                res.failure(f"Expected 400, got {res.status_code}")

    @task(1)
    def create_skill_no_auth(self):
        with self.client.post(
            "/api/skills/",
            json={"skill_name": "X", "category": "Other"},
            headers={"Authorization": ""},
            name="POST /api/skills/ [no auth → 401]",
            catch_response=True,
        ) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class SkillsBulkCreateTaskSet(TaskSet):

    @task(4)
    def bulk_create_skills(self):
        skills = [
            {"skill_name": f"BLK_{ObjectId()}", "category": "Backend"},
            {"skill_name": f"BLK_{ObjectId()}", "category": "Frontend"},
        ]
        self.client.post("/api/skills/bulk", json={"skills": skills},
                         headers=self.user.client.headers,
                         name="POST /api/skills/bulk")

    @task(1)
    def bulk_create_empty_returns_400(self):
        with self.client.post("/api/skills/bulk", json={"skills": []},
                              headers=self.user.client.headers,
                              name="POST /api/skills/bulk [empty → 400]",
                              catch_response=True) as res:
            if res.status_code == 400:
                res.success()
            else:
                res.failure(f"Expected 400, got {res.status_code}")


class SkillsUpdateTaskSet(TaskSet):

    def _create_and_get_id(self):
        res = self.client.post("/api/skills/", json={
            "skill_name": f"UPD_{ObjectId()}",
            "category":   "Backend",
        }, headers=self.user.client.headers, name="POST /api/skills/ [setup for update]")
        if res.status_code == 201:
            return res.json().get("data", {}).get("_id")
        return None

    @task(5)
    def update_demand_level(self):
        sid = self._create_and_get_id()
        if not sid:
            return
        self.client.put(f"/api/skills/{sid}",
                        json={"demand_level": random.choice(["High", "Medium", "Low"])},
                        headers=self.user.client.headers,
                        name="PUT /api/skills/<id> [demand_level]")

    @task(2)
    def update_description(self):
        sid = self._create_and_get_id()
        if not sid:
            return
        self.client.put(f"/api/skills/{sid}",
                        json={"description": f"Updated at {datetime.utcnow().isoformat()}"},
                        headers=self.user.client.headers,
                        name="PUT /api/skills/<id> [description]")

    @task(1)
    def update_invalid_demand_returns_400(self):
        sid = self._create_and_get_id()
        if not sid:
            return
        with self.client.put(f"/api/skills/{sid}",
                             json={"demand_level": "INVALID"},
                             headers=self.user.client.headers,
                             name="PUT /api/skills/<id> [bad demand → 400]",
                             catch_response=True) as res:
            if res.status_code == 400:
                res.success()
            else:
                res.failure(f"Expected 400, got {res.status_code}")


class SkillsDeleteTaskSet(TaskSet):

    def _create_and_get_id(self):
        res = self.client.post("/api/skills/", json={
            "skill_name": f"DEL_{ObjectId()}",
            "category":   "Other",
        }, headers=self.user.client.headers, name="POST /api/skills/ [setup for delete]")
        if res.status_code == 201:
            return res.json().get("data", {}).get("_id")
        return None

    @task(5)
    def delete_skill(self):
        sid = self._create_and_get_id()
        if not sid:
            return
        self.client.delete(f"/api/skills/{sid}",
                           headers=self.user.client.headers,
                           name="DELETE /api/skills/<id>")

    @task(1)
    def delete_invalid_id_returns_400(self):
        with self.client.delete("/api/skills/BAD_ID",
                                headers=self.user.client.headers,
                                name="DELETE /api/skills/<id> [bad id → 400]",
                                catch_response=True) as res:
            if res.status_code == 400:
                res.success()
            else:
                res.failure(f"Expected 400, got {res.status_code}")

    @task(1)
    def delete_unknown_id_returns_404(self):
        fake = str(ObjectId())
        with self.client.delete(f"/api/skills/{fake}",
                                headers=self.user.client.headers,
                                name="DELETE /api/skills/<id> [unknown → 404]",
                                catch_response=True) as res:
            if res.status_code == 404:
                res.success()
            else:
                res.failure(f"Expected 404, got {res.status_code}")


class SkillsMetaTaskSet(TaskSet):

    @task(8)
    def get_meta_options(self):
        self.client.get("/api/skills/meta/options",
                        headers=self.user.client.headers,
                        name="GET /api/skills/meta/options")

    @task(2)
    def validate_meta_options_shape(self):
        with self.client.get("/api/skills/meta/options",
                             headers=self.user.client.headers,
                             name="GET /api/skills/meta/options [shape check]",
                             catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"Status {res.status_code}")
                return
            body = res.json()
            if "categories" in body and "demand_levels" in body:
                res.success()
            else:
                res.failure("Missing categories or demand_levels")

    @task(1)
    def get_meta_no_auth(self):
        with self.client.get("/api/skills/meta/options",
                             headers={"Authorization": ""},
                             name="GET /api/skills/meta/options [no auth → 401]",
                             catch_response=True) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class SkillsInsightsTaskSet(TaskSet):

    @task(6)
    def get_insights_valid(self):
        if not SEEDED_SKILL_OID:
            return
        self.client.get(f"/api/skills/{SEEDED_SKILL_OID}/insights",
                        headers=self.user.client.headers,
                        name="GET /api/skills/<id>/insights [valid]")

    @task(2)
    def get_insights_validate_shape(self):
        if not SEEDED_SKILL_OID:
            return
        with self.client.get(f"/api/skills/{SEEDED_SKILL_OID}/insights",
                             headers=self.user.client.headers,
                             name="GET /api/skills/<id>/insights [shape check]",
                             catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"Status {res.status_code}")
                return
            data = res.json().get("data", {})
            required = ("candidate_total", "bench_total", "open_jobs",
                        "salary_avg", "demand_gap")
            for key in required:
                if key not in data:
                    res.failure(f"Missing key: {key}")
                    return
            res.success()

    @task(1)
    def get_insights_invalid_id(self):
        with self.client.get("/api/skills/BAD_OID/insights",
                             headers=self.user.client.headers,
                             name="GET /api/skills/<id>/insights [bad id → 400]",
                             catch_response=True) as res:
            if res.status_code == 400:
                res.success()
            else:
                res.failure(f"Expected 400, got {res.status_code}")

    @task(1)
    def get_insights_unknown_id(self):
        fake = str(ObjectId())
        with self.client.get(f"/api/skills/{fake}/insights",
                             headers=self.user.client.headers,
                             name="GET /api/skills/<id>/insights [unknown → 404]",
                             catch_response=True) as res:
            if res.status_code == 404:
                res.success()
            else:
                res.failure(f"Expected 404, got {res.status_code}")


class SkillsJourneyTaskSet(TaskSet):
    """Realistic skill management session: list → create → update → get insights → delete."""

    @task(2)
    def full_skill_journey(self):
        self.client.get("/api/skills/",
                        headers=self.user.client.headers,
                        name="GET /api/skills/ [journey]")
        name = f"JRN_{ObjectId()}"
        res  = self.client.post("/api/skills/", json={
            "skill_name": name, "category": "Backend", "demand_level": "Medium",
        }, headers=self.user.client.headers, name="POST /api/skills/ [journey]")
        if res.status_code != 201:
            return
        sid = res.json().get("data", {}).get("_id")
        if not sid:
            return
        self.client.put(f"/api/skills/{sid}",
                        json={"demand_level": "High"},
                        headers=self.user.client.headers,
                        name="PUT /api/skills/<id> [journey]")
        self.client.get("/api/skills/meta/options",
                        headers=self.user.client.headers,
                        name="GET /api/skills/meta/options [journey]")
        self.client.delete(f"/api/skills/{sid}",
                           headers=self.user.client.headers,
                           name="DELETE /api/skills/<id> [journey]")

    @task(3)
    def list_and_insights(self):
        self.client.get("/api/skills/",
                        headers=self.user.client.headers,
                        name="GET /api/skills/ [journey-list]")
        if SEEDED_SKILL_OID:
            self.client.get(f"/api/skills/{SEEDED_SKILL_OID}/insights",
                            headers=self.user.client.headers,
                            name="GET /api/skills/<id>/insights [journey]")


# ═════════════════════════════════════════════════════════════════════════════
# ── USER CLASSES (used when running this file standalone) ────────────────────
# ═════════════════════════════════════════════════════════════════════════════

class ReportsAdminUser(HttpUser):
    weight    = 3
    wait_time = between(1, 3)
    tasks     = {
        ReportsOverviewTaskSet:             4,
        ReportsFunnelTaskSet:               3,
        ReportsRecruiterPerformanceTaskSet: 3,
        ReportsClientWiseTaskSet:           3,
        ReportsTimeToFillTaskSet:           3,
        ReportsSourceEffectivenessTaskSet:  3,
        ReportsJourneyTaskSet:              4,
    }

    def on_start(self):
        self.auth_headers = _register_and_login(self.client, role="admin")


class ReportsRecruiterUser(HttpUser):
    weight    = 2
    wait_time = between(2, 5)
    tasks     = {
        ReportsOverviewTaskSet:            5,
        ReportsFunnelTaskSet:              4,
        ReportsSourceEffectivenessTaskSet: 3,
        ReportsJourneyTaskSet:             2,
    }

    def on_start(self):
        self.auth_headers = _register_and_login(self.client, role="recruiter")


class SkillsAdminUser(HttpUser):
    weight    = 2
    wait_time = between(1, 3)
    tasks     = {
        SkillsGetAllTaskSet:     4,
        SkillsGetOneTaskSet:     3,
        SkillsByJobTaskSet:      2,
        SkillsCreateTaskSet:     3,
        SkillsBulkCreateTaskSet: 1,
        SkillsUpdateTaskSet:     2,
        SkillsDeleteTaskSet:     2,
        SkillsMetaTaskSet:       3,
        SkillsInsightsTaskSet:   4,
        SkillsJourneyTaskSet:    3,
    }

    def on_start(self):
        self.auth_headers = _register_and_login(self.client, role="admin")


class SkillsReadOnlyUser(HttpUser):
    weight    = 2
    wait_time = between(2, 5)
    tasks     = {
        SkillsGetAllTaskSet:   6,
        SkillsGetOneTaskSet:   4,
        SkillsByJobTaskSet:    3,
        SkillsMetaTaskSet:     4,
        SkillsInsightsTaskSet: 5,
    }

    def on_start(self):
        self.auth_headers = _register_and_login(self.client, role="recruiter")


class MixedDashboardUser(HttpUser):
    weight    = 1
    wait_time = between(1, 4)
    tasks     = {
        ReportsOverviewTaskSet: 3,
        ReportsFunnelTaskSet:   2,
        SkillsGetAllTaskSet:    3,
        SkillsInsightsTaskSet:  3,
        SkillsJourneyTaskSet:   2,
        ReportsJourneyTaskSet:  2,
    }

    def on_start(self):
        self.auth_headers = _register_and_login(self.client, role="admin")