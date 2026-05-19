

from locust import TaskSet, task
import random
import logging
import uuid


class JobTasks(TaskSet):
    """
    Validates endpoints in job_routes.py
    prefix: /api/jobs
    """

    def on_start(self):
        self.headers = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.job_id = None

        # Generate unique data per user session
        unique_suffix = str(uuid.uuid4())[:8].upper()
        self.dummy_job_id = f"JOB{unique_suffix}"

    # ================= 1. CREATE =================

    @task
    def create_job(self):
        """POST /api/jobs/"""
        url = "/api/jobs/"

        payload = {
            "job_id":         self.dummy_job_id,
            "title":          f"Python Developer {str(uuid.uuid4())[:4]}",
            "client_id":      "CLI001",
            "client_name":    "Test Corp",
            "openings":       random.randint(1, 5),
            "job_type":       random.choice(["Full-Time", "Part-Time", "Contract"]),
            "work_mode":      random.choice(["Remote", "On-site", "Hybrid"]),
            "location":       "Hyderabad",
            "experience_min": random.randint(1, 3),
            "experience_max": random.randint(4, 10),
            "priority":       random.choice(["Low", "Medium", "High", "Critical"]),
            "status":         "Open",
            "skills":         ["Python", "Flask", "MongoDB"],
            "description":    "Created by Locust load test",
        }

        with self.client.post(url, json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 201:
                data = response.json()
                self.job_id = data.get("data", {}).get("_id")
                logging.info(f"✅ Job Created: {self.job_id}")
            elif response.status_code == 409 and "already exists" in response.text:
                logging.warning("⚠️ Job conflict, fetching existing list...")
                self.get_jobs()
            else:
                response.failure(f"Create Job failed: {response.text}")

    # ================= 2. READ =================

    @task
    def get_jobs(self):
        """GET /api/jobs/"""
        params = {
            "page":     1,
            "per_page": 10,
            "status":   "Open",
        }
        with self.client.get("/api/jobs/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                jobs = data.get("data", [])
                if jobs and not self.job_id:
                    self.job_id = jobs[0].get("_id")
            else:
                response.failure(f"Get Jobs failed: {response.text}")

    @task
    def search_jobs(self):
        """GET /api/jobs/?q=<query>"""
        params = {"q": "Python Developer", "page": 1, "per_page": 10}
        with self.client.get("/api/jobs/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search Jobs failed: {response.text}")

    @task
    def filter_by_priority(self):
        """GET /api/jobs/?priority=High"""
        params = {"priority": "High", "page": 1, "per_page": 10}
        with self.client.get("/api/jobs/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Priority failed: {response.text}")

    @task
    def get_single_job(self):
        """GET /api/jobs/<id>"""
        if not self.job_id:
            return
        with self.client.get(f"/api/jobs/{self.job_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Single Job failed: {response.text}")

    @task
    def get_meta_options(self):
        """GET /api/jobs/meta/options"""
        with self.client.get("/api/jobs/meta/options", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Meta Options failed: {response.text}")

    # ================= 3. UPDATE =================

    @task
    def update_job(self):
        """PUT /api/jobs/<id>"""
        if not self.job_id:
            return

        payload = {
            "title":    "Senior Python Developer",
            "priority": random.choice(["Low", "Medium", "High", "Critical"]),
            "status":   random.choice(["Open", "On Hold", "Closed"]),
        }
        with self.client.put(f"/api/jobs/{self.job_id}", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Job failed: {response.text}")

    # ================= 4. QUESTIONS =================

    @task
    def patch_mcq_questions(self):
        """PATCH /api/jobs/<id>/questions"""
        if not self.job_id:
            return

        payload = {
            "mcq_questions": [
                {
                    "question":       "What is Python?",
                    "options":        ["A language", "A snake", "A tool", "An OS"],
                    "correct_answer": ["A language"],
                }
            ]
        }
        with self.client.patch(
            f"/api/jobs/{self.job_id}/questions",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Patch MCQ Questions failed: {response.text}")

    @task
    def patch_coding_questions(self):
        """PATCH /api/jobs/<id>/questions"""
        if not self.job_id:
            return

        payload = {
            "coding_questions": [
                {
                    "programming_language": "Python",
                    "question":             "Write a FizzBuzz function",
                }
            ]
        }
        with self.client.patch(
            f"/api/jobs/{self.job_id}/questions",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Patch Coding Questions failed: {response.text}")

    # ================= 5. DELETE =================

    @task
    def delete_job(self):
        """DELETE /api/jobs/<id>"""
        if not self.job_id:
            return

        with self.client.delete(f"/api/jobs/{self.job_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Job Deleted: {self.job_id}")
                self.job_id = None
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Delete Job failed: {response.text}")

    @task
    def stop(self):
        return