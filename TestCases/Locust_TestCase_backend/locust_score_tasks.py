"""
Locust load test for ZentreePortal backend.
Covers: /api/dashboard/ , /api/dashboard/recruiter , and all /api/score/* endpoints.

Install:
    pip install locust

Run (headless, 20 users, spawn 5/s, 60 s):
    locust -f locustfile.py --headless -u 20 -r 5 -t 60s \
           --host http://localhost:5000

Run (with web UI on http://localhost:8089):
    locust -f locustfile.py --host http://localhost:5000

Environment variables (optional overrides):
    LOCUST_EMAIL     – base e-mail stem   (default: loadtest)
    LOCUST_PASSWORD  – shared password    (default: Test@1234)
"""

import os
import random
import string
import logging
from locust import HttpUser, TaskSet, task, between, events

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

BASE_EMAIL    = os.getenv("LOCUST_EMAIL",    "loadtest")
BASE_PASSWORD = os.getenv("LOCUST_PASSWORD", "Test@1234")

# Seed data — must exist in the target DB before the run.
# Override via env-vars when running against staging/prod.
# SEED_RESUME_ID = os.getenv("LOCUST_RESUME_ID", "RES_TEST_001")
# SEED_JOB_ID    = os.getenv("LOCUST_JOB_ID",    "JOB_TEST_001")

# SEED_RESUME_ID = "LOCUST_RES_001"
# SEED_JOB_ID    = "LOCUST_JOB_001"

logger = logging.getLogger("locust.zentree")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _rand_suffix(n: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def _register_and_login(client, role: str = "recruiter") -> str | None:
    """
    Register a fresh user and return the JWT access token.
    Returns None if either step fails (the task will skip protected calls).
    """
    suffix = _rand_suffix()
    email  = f"{BASE_EMAIL}_{suffix}@zentree.test"

    reg = client.post(
        "/api/auth/register",
        json={
            "first_name": "Load",
            "last_name":  "Tester",
            "email":      email,
            "password":   BASE_PASSWORD,
            "role":       role,
        },
        name="/api/auth/register",
    )

    if reg.status_code not in (200, 201):
        logger.warning(f"[auth] register failed: {reg.status_code}")
        return None

    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": BASE_PASSWORD},
        name="/api/auth/login",
    )

    if login.status_code != 200:
        logger.warning(f"[auth] login failed: {login.status_code}")
        return None

    data = login.json()
    return data.get("access_token")


# ─────────────────────────────────────────────────────────────────────────────
# Task sets
# ─────────────────────────────────────────────────────────────────────────────

class DashboardTasks(TaskSet):
    """
    Simulates a user repeatedly hitting dashboard endpoints.
    Weights reflect real-world usage patterns:
      - admin/manager dashboard loaded more often than recruiter view.
    """

    def on_start(self):
        # self.token = self.user.token
        token = self.user.resident_session.get("headers", {}).get("Authorization", "")
        self.token = token.replace("Bearer ", "") if token else ""

    def _hdr(self):
        return {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def get_main_dashboard(self):
        with self.client.get(
            "/api/dashboard/",
            headers=self._hdr(),
            name="/api/dashboard/ [GET]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 401:
                resp.failure("Unauthenticated — token may have expired")
            elif resp.status_code != 200:
                resp.failure(f"Unexpected {resp.status_code}")
            else:
                body = resp.json()
                if not body.get("success"):
                    resp.failure("success=False in body")
                elif "dashboard" not in body:
                    resp.failure("Missing 'dashboard' key")

    @task(2)
    def get_recruiter_dashboard(self):
        with self.client.get(
            "/api/dashboard/recruiter",
            headers=self._hdr(),
            name="/api/dashboard/recruiter [GET]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 401:
                resp.failure("Unauthenticated")
            elif resp.status_code != 200:
                resp.failure(f"Unexpected {resp.status_code}")
            else:
                body = resp.json()
                if not body.get("success"):
                    resp.failure("success=False")

    @task(1)
    def get_dashboard_unauthenticated(self):
        """Verify that unauthenticated requests are rejected (expected 401)."""
        with self.client.get(
            "/api/dashboard/",
            name="/api/dashboard/ [GET-unauth]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 401:
                resp.success()
            else:
                resp.failure(f"Expected 401, got {resp.status_code}")


class ScoreReadTasks(TaskSet):
    """
    Read-heavy: fetch existing scores for a candidate, job, and resume.
    Heavier weight than write tasks — production APIs are usually read-heavy.
    """

    # def on_start(self):
    #     token = self.user.resident_session.get("headers", {}).get("Authorization", "")
    #     self.token = token.replace("Bearer ", "") if token else ""
    #     self.rid   = SEED_RESUME_ID
    #     self.jid   = SEED_JOB_ID
    
    # def on_start(self):
    #     token = self.user.resident_session.get("headers", {}).get("Authorization", "")
    #     self.token = token.replace("Bearer ", "") if token else ""

    #     # Fetch a real resume_id from the DB
    #     r = self.client.get("/api/resumes/?page=1&per_page=1",
    #                         headers=self._hdr(), name="[setup] fetch resume id")
    #     self.rid = None
    #     if r.status_code == 200:
    #         items = r.json().get("data", [])
    #         if items:
    #             self.rid = items[0].get("_id") or items[0].get("resume_id")

    #     # Fetch a real job_id from the DB
    #     j = self.client.get("/api/jobs/?page=1&per_page=1",
    #                         headers=self._hdr(), name="[setup] fetch job id")
    #     self.jid = None
    #     if j.status_code == 200:
    #         items = j.json().get("data", [])
    #         if items:
    #             self.jid = items[0].get("_id") or items[0].get("job_id")
    def on_start(self):
        token = self.user.resident_session.get("headers", {}).get("Authorization", "")
        self.token = token.replace("Bearer ", "") if token else ""

        self.rid = None
        self.jid = None

        r = self.client.get("/api/resumes/?page=1&per_page=1",
                            headers=self._hdr(), name="[setup] fetch resume id")
        if r.status_code == 200:
            body = r.json()
            logging.info(f"[SCORE SETUP] resume response keys: {list(body.keys())}")
            # Try all common response structures:
            items = body.get("data") or body.get("resumes") or body.get("results") or []
            if items:
                self.rid = items[0].get("resume_id") or items[0].get("_id")
                logging.info(f"[SCORE SETUP] Got rid: {self.rid}")

        j = self.client.get("/api/jobs/?page=1&per_page=1",
                            headers=self._hdr(), name="[setup] fetch job id")
        if j.status_code == 200:
            body = j.json()
            logging.info(f"[SCORE SETUP] job response keys: {list(body.keys())}")
            items = body.get("data") or body.get("jobs") or body.get("results") or []
            if items:
                self.jid = items[0].get("job_id") or items[0].get("_id")
                logging.info(f"[SCORE SETUP] Got jid: {self.jid}")
            
            
            
    def _hdr(self):
        return {"Authorization": f"Bearer {self.token}"}

    @task(4)
    def get_score_for_pair(self):
        if not self.rid or not self.jid: 
            return
        with self.client.get(
            f"/api/score/candidate?resume_id={self.rid}&job_id={self.jid}",
            headers=self._hdr(),
            name="/api/score/candidate [GET]",
            catch_response=True,
        ) as resp:
            # 200 (score exists) and 404 (not yet scored) are both valid
            if resp.status_code not in (200, 404):
                resp.failure(f"Unexpected {resp.status_code}")

    @task(3)
    def get_scores_for_job(self):
        with self.client.get(
            f"/api/score/job/{self.jid}",
            headers=self._hdr(),
            name="/api/score/job/<id> [GET]",
            catch_response=True,
        ) as resp:
            if resp.status_code not in (200, 404):
                resp.failure(f"Unexpected {resp.status_code}")
            elif resp.status_code == 200:
                body = resp.json()
                if not body.get("success"):
                    resp.failure("success=False")

    @task(3)
    def get_scores_for_resume(self):
        with self.client.get(
            f"/api/score/resume/{self.rid}",
            headers=self._hdr(),
            name="/api/score/resume/<id> [GET]",
            catch_response=True,
        ) as resp:
            if resp.status_code not in (200, 404):
                resp.failure(f"Unexpected {resp.status_code}")
            elif resp.status_code == 200:
                body = resp.json()
                if not body.get("success"):
                    resp.failure("success=False")

    @task(1)
    def get_score_missing_params(self):
        """Missing params → must return 400."""
        with self.client.get(
            "/api/score/candidate",
            headers=self._hdr(),
            name="/api/score/candidate [GET-no-params]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 400:
                resp.success()
            else:
                resp.failure(f"Expected 400, got {resp.status_code}")

    @task(1)
    def get_score_unauthenticated(self):
        with self.client.get(
            f"/api/score/candidate?resume_id={self.rid}&job_id={self.jid}",
            name="/api/score/candidate [GET-unauth]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 401:
                resp.success()
            else:
                resp.failure(f"Expected 401, got {resp.status_code}")


class ScoreWriteTasks(TaskSet):
    """
    Write tasks: score and bulk-score operations.
    Lower weight — scoring uses Gemini/rule engine and is more expensive.
    """

    def on_start(self):
        # self.token = self.user.token
        token = self.user.resident_session.get("headers", {}).get("Authorization", "")
        self.token = token.replace("Bearer ", "") if token else ""
        self.rid   = SEED_RESUME_ID
        self.jid   = SEED_JOB_ID

    def _hdr(self):
        return {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def post_score_candidate(self):
        with self.client.post(
            "/api/score/candidate",
            json={"resume_id": self.rid, "job_id": self.jid},
            headers=self._hdr(),
            name="/api/score/candidate [POST]",
            catch_response=True,
        ) as resp:
            if resp.status_code != 201:
                resp.failure(f"Expected 201, got {resp.status_code}")
            else:
                body = resp.json()
                if not body.get("success"):
                    resp.failure("success=False")
                elif "data" not in body:
                    resp.failure("Missing 'data' key")

    @task(1)
    def post_score_candidate_missing_job(self):
        with self.client.post(
            "/api/score/candidate",
            json={"resume_id": self.rid},
            headers=self._hdr(),
            name="/api/score/candidate [POST-no-job]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 400:
                resp.success()
            else:
                resp.failure(f"Expected 400, got {resp.status_code}")

    @task(1)
    def post_score_candidate_unknown_resume(self):
        with self.client.post(
            "/api/score/candidate",
            json={"resume_id": "NO_SUCH_RESUME_XYZ", "job_id": self.jid},
            headers=self._hdr(),
            name="/api/score/candidate [POST-unknown-resume]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 404:
                resp.success()
            else:
                resp.failure(f"Expected 404, got {resp.status_code}")

    @task(2)
    def post_bulk_score(self):
        with self.client.post(
            "/api/score/candidate/bulk",
            json={"job_id": self.jid, "resume_ids": [self.rid]},
            headers=self._hdr(),
            name="/api/score/candidate/bulk [POST]",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"Expected 200, got {resp.status_code}")
            else:
                body = resp.json()
                if not body.get("success"):
                    resp.failure("success=False")

    @task(1)
    def post_bulk_score_empty_list(self):
        with self.client.post(
            "/api/score/candidate/bulk",
            json={"job_id": self.jid, "resume_ids": []},
            headers=self._hdr(),
            name="/api/score/candidate/bulk [POST-empty]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 400:
                resp.success()
            else:
                resp.failure(f"Expected 400, got {resp.status_code}")

    @task(1)
    def post_bulk_score_over_50(self):
        """Sending 55 IDs should be capped at 50 and return 200."""
        ids = [f"NONEXIST_{i}" for i in range(55)]
        with self.client.post(
            "/api/score/candidate/bulk",
            json={"job_id": self.jid, "resume_ids": ids},
            headers=self._hdr(),
            name="/api/score/candidate/bulk [POST-over-50]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Expected 200, got {resp.status_code}")

    @task(1)
    def post_bulk_score_unauthenticated(self):
        with self.client.post(
            "/api/score/candidate/bulk",
            json={"job_id": self.jid, "resume_ids": [self.rid]},
            name="/api/score/candidate/bulk [POST-unauth]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 401:
                resp.success()
            else:
                resp.failure(f"Expected 401, got {resp.status_code}")


# ─────────────────────────────────────────────────────────────────────────────
# User classes
# ─────────────────────────────────────────────────────────────────────────────



class AdminUser(HttpUser):
    """
    Simulates an admin browsing the main dashboard and scoring candidates.
    wait_time: think-time between tasks (1–3 s).
    """
    wait_time = between(1, 3)
    weight    = 1
    tasks     = {ScoreReadTasks: 3, ScoreWriteTasks: 1}   # ← dict, not a class

    def on_start(self):
        self.token = _register_and_login(self.client, role="admin") or ""
        
        
        
        
class RecruiterUser(HttpUser):
    """
    Simulates a recruiter: reads their dashboard, scores candidates,
    and browses score results.
    """
    wait_time = between(1, 4)
    weight    = 3

    def on_start(self):
        self.token = _register_and_login(self.client, role="recruiter") or ""

    # Mix dashboard + score tasks with relative weights:
    #   60 % reads, 25 % writes, 15 % dashboard
    tasks = {
        ScoreReadTasks:  6,
        ScoreWriteTasks: 2,
        DashboardTasks:  2,
    }


class ManagerUser(HttpUser):
    """
    Managers mainly view the dashboard and read score reports.
    """
    wait_time = between(2, 5)
    weight    = 1

    def on_start(self):
        self.token = _register_and_login(self.client, role="manager") or ""

    tasks = {
        DashboardTasks:  7,
        ScoreReadTasks:  3,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Custom event hooks — print a summary line on each request failure
# ─────────────────────────────────────────────────────────────────────────────

@events.request.add_listener
def on_request(request_type, name, response_time, response_length,
               exception, **kwargs):
    if exception:
        logger.error(
            f"[FAIL] {request_type} {name} | "
            f"time={response_time:.0f}ms | err={exception}"
        )