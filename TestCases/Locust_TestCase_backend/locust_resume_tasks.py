


from locust import TaskSet, task
import base64
import random
import logging
import uuid


# Minimal valid PDF bytes encoded as base64 — avoids real file I/O
_MINIMAL_PDF_B64 = base64.b64encode(
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
    b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF"
).decode()


class ResumeTasks(TaskSet):
    """
    Validates endpoints in resume_routes.py
    prefix: /api/resumes
    """

    def on_start(self):
        self.headers = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.resume_id = None
        self.raw_id = None

        # Generate unique data per user session
        unique_suffix = str(uuid.uuid4())[:8]
        self.dummy_email = f"resume_{unique_suffix}@example.com"

    # ================= 1. CREATE =================

    @task
    def create_resume(self):
        """POST /api/resumes/"""
        url = "/api/resumes/"

        payload = {
            "name":             f"Locust Candidate {str(uuid.uuid4())[:5]}",
            "email":            self.dummy_email,
            "phone":            str(random.randint(6000000000, 9999999999)),
            "current_role":     "Software Engineer",
            "current_company":  "Acme Corp",
            "experience":       round(random.uniform(1, 12), 1),
            "skills":           "Python, Flask, MongoDB",
            "location":         "Hyderabad",
            "current_salary":   random.randint(400000, 1500000),
            "expected_salary":  random.randint(600000, 2000000),
            "notice_period":    random.choice(["Immediate", "15 days", "30 days", "60 days", "90 days"]),
            "source":           random.choice(["LinkedIn", "Naukri", "Indeed", "Referral"]),
            "status":           "New",
            "linked_job_id":    "",
            "linked_job_title": "",
            "notes":            "Created by Locust load test",
        }

        with self.client.post(url, json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 201:
                data = response.json()
                self.resume_id = data.get("data", {}).get("_id")
                logging.info(f"✅ Resume Created: {self.resume_id}")
            elif response.status_code == 409 and "already exists" in response.text:
                logging.warning("⚠️ Resume conflict, fetching existing list...")
                self.get_resumes()
            else:
                response.failure(f"Create Resume failed: {response.text}")

    # ================= 2. READ =================

    @task
    def get_resumes(self):
        """GET /api/resumes/"""
        params = {
            "page":     1,
            "per_page": 10,
            "status":   "New",
            "source":   "LinkedIn",
        }
        with self.client.get("/api/resumes/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                resumes = data.get("data", [])
                if resumes and not self.resume_id:
                    self.resume_id = resumes[0].get("_id")
            else:
                response.failure(f"Get Resumes failed: {response.text}")

    @task
    def search_resumes(self):
        """GET /api/resumes/?q=<query>"""
        params = {"q": "Python", "page": 1, "per_page": 10}
        with self.client.get("/api/resumes/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search Resumes failed: {response.text}")

    @task
    def filter_by_experience(self):
        """GET /api/resumes/?min_exp=2&max_exp=8"""
        params = {"min_exp": 2, "max_exp": 8, "page": 1, "per_page": 10}
        with self.client.get("/api/resumes/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Experience failed: {response.text}")

    @task
    def get_single_resume(self):
        """GET /api/resumes/<id>"""
        if not self.resume_id:
            return
        with self.client.get(f"/api/resumes/{self.resume_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Single Resume failed: {response.text}")

    @task
    def get_meta_options(self):
        """GET /api/resumes/meta/options"""
        with self.client.get("/api/resumes/meta/options", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Meta Options failed: {response.text}")

    @task
    def get_stats(self):
        """GET /api/resumes/stats"""
        with self.client.get("/api/resumes/stats", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Stats failed: {response.text}")

    @task
    def get_by_skill(self):
        """GET /api/resumes/by-skill/<skill_name>"""
        skill = random.choice(["Python", "Flask", "MongoDB", "React"])
        with self.client.get(f"/api/resumes/by-skill/{skill}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get By Skill failed: {response.text}")

    @task
    def talent_search(self):
        """GET /api/resumes/talent-search?q=<skills>"""
        params = {"q": "Python,Flask"}
        with self.client.get("/api/resumes/talent-search", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Talent Search failed: {response.text}")

    # ================= 3. UPDATE =================

    @task
    def update_resume(self):
        """PUT /api/resumes/<id>"""
        if not self.resume_id:
            return

        payload = {
            "status":     random.choice(["New", "Shortlisted", "In Review"]),
            "experience": round(random.uniform(1, 12), 1),
            "skills":     "Go, Kubernetes, Docker",
            "notes":      "Updated by Locust",
        }
        with self.client.put(f"/api/resumes/{self.resume_id}", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Resume failed: {response.text}")

    # ================= 4. RAW RESUME OPERATIONS =================

    @task
    def upload_raw_resume(self):
        """POST /api/resumes/raw/upload"""
        payload = {
            "file_b64":  _MINIMAL_PDF_B64,
            "file_name": f"locust_resume_{str(uuid.uuid4())[:5]}.pdf",
        }
        with self.client.post("/api/resumes/raw/upload", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 201:
                data = response.json()
                self.raw_id = data.get("data", {}).get("_id")
                logging.info(f"✅ Raw Resume Uploaded: {self.raw_id}")
            else:
                response.failure(f"Upload Raw Resume failed: {response.text}")

    @task
    def get_raw_resumes(self):
        """GET /api/resumes/raw/"""
        params = {"page": 1, "per_page": 10, "status": "Stored"}
        with self.client.get("/api/resumes/raw/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                raws = data.get("data", [])
                if raws and not self.raw_id:
                    self.raw_id = raws[0].get("_id")
            else:
                response.failure(f"Get Raw Resumes failed: {response.text}")

    @task
    def assign_raw_to_job(self):
        """PUT /api/resumes/raw/<id>/assign-job"""
        if not self.raw_id:
            return
        payload = {
            "job_id":      "JOB001",
            "job_title":   "Backend Developer",
            "client_name": "Acme Corp",
        }
        with self.client.put(
            f"/api/resumes/raw/{self.raw_id}/assign-job",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Assign Raw to Job failed: {response.text}")

    @task
    def manual_raw_entry(self):
        """POST /api/resumes/raw/manual"""
        unique_suffix = str(uuid.uuid4())[:6]
        payload = {
            "name":  f"Manual User {unique_suffix}",
            "email": f"manual_{unique_suffix}@example.com",
            "phone": str(random.randint(6000000000, 9999999999)),
        }
        with self.client.post("/api/resumes/raw/manual", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f"Manual Raw Entry failed: {response.text}")

    @task
    def delete_raw_resume(self):
        """DELETE /api/resumes/raw/<id>"""
        if not self.raw_id:
            return
        with self.client.delete(f"/api/resumes/raw/{self.raw_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Raw Resume Deleted: {self.raw_id}")
                self.raw_id = None
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Delete Raw Resume failed: {response.text}")

    # ================= 5. DELETE =================

    @task
    def delete_resume(self):
        """DELETE /api/resumes/<id>"""
        if not self.resume_id:
            return
        with self.client.delete(f"/api/resumes/{self.resume_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Resume Deleted: {self.resume_id}")
                self.resume_id = None
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Delete Resume failed: {response.text}")

    @task
    def stop(self):
        return