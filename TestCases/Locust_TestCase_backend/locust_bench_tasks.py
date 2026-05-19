
from locust import TaskSet, task
import base64
import random
import logging
import uuid


_MINIMAL_PDF_B64 = base64.b64encode(
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
    b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF"
).decode()


class BenchTasks(TaskSet):
    """
    Load tests for Bench_routes.py
    prefix: /api/bench
    """

    def on_start(self):
        self.headers  = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.bench_id = None

        unique_suffix     = str(uuid.uuid4())[:8]
        self.dummy_email  = f"bench_{unique_suffix}@example.com"

    # ================= 1. CREATE =================

    @task
    def create_bench(self):
        """POST /api/bench/"""
        payload = {
            "name":            f"Locust Bench {str(uuid.uuid4())[:5]}",
            "email":           self.dummy_email,
            "phone":           str(random.randint(6000000000, 9999999999)),
            "current_role":    "Java Developer",
            "skills":          random.choice(["Python, Flask", "Java, Spring Boot", "React, Node.js"]),
            "experience":      round(random.uniform(1, 12), 1),
            "location":        "Hyderabad",
            "current_salary":  random.randint(400000, 1500000),
            "expected_salary": random.randint(600000, 2000000),
            "notice_period":   random.choice(["Immediate", "15 days", "30 days", "60 days"]),
            "last_client":     "Acme Corp",
            "last_project":    "Portal V2",
            "status":          "Available",
            "employment_type": "Permanent",
            "notes":           "Created by Locust",
        }
        with self.client.post("/api/bench/", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 201:
                self.bench_id = response.json().get("data", {}).get("_id")
                logging.info(f"✅ Bench Person Created: {self.bench_id}")
            elif response.status_code == 409:
                response.success()
            else:
                response.failure(f"Create Bench failed: {response.text}")

    # ================= 2. READ =================

    @task
    def get_bench_list(self):
        """GET /api/bench/"""
        params = {"page": 1, "per_page": 10, "status": "Available"}
        with self.client.get("/api/bench/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                records = response.json().get("data", [])
                if records and not self.bench_id:
                    self.bench_id = records[0].get("_id")
            else:
                response.failure(f"Get Bench List failed: {response.text}")

    @task
    def search_bench(self):
        """GET /api/bench/?q=Locust"""
        params = {"q": "Locust Bench", "page": 1, "per_page": 10}
        with self.client.get("/api/bench/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search Bench failed: {response.text}")

    @task
    def filter_by_status(self):
        """GET /api/bench/?status=Available"""
        params = {"status": random.choice(["Available", "In Interview", "Placed"]), "page": 1, "per_page": 10}
        with self.client.get("/api/bench/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Status failed: {response.text}")

    @task
    def get_single_bench(self):
        """GET /api/bench/<id>"""
        if not self.bench_id:
            return
        with self.client.get(f"/api/bench/{self.bench_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Single Bench failed: {response.text}")

    @task
    def get_meta_options(self):
        """GET /api/bench/meta/options"""
        with self.client.get("/api/bench/meta/options", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Meta Options failed: {response.text}")

    @task
    def get_stats(self):
        """GET /api/bench/stats"""
        with self.client.get("/api/bench/stats", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Stats failed: {response.text}")

    @task
    def get_by_skill(self):
        """GET /api/bench/by-skill/<skill>"""
        skill = random.choice(["Python", "Java", "React", "Flask"])
        with self.client.get(f"/api/bench/by-skill/{skill}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get By Skill failed: {response.text}")

    @task
    def talent_search(self):
        """GET /api/bench/talent-search?q=<skills>"""
        params = {"q": random.choice(["Python,Flask", "Java,Kubernetes", "React,Node.js"])}
        with self.client.get("/api/bench/talent-search", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Talent Search failed: {response.text}")

    # ================= 3. UPDATE =================

    @task
    def update_bench(self):
        """PUT /api/bench/<id>"""
        if not self.bench_id:
            return
        payload = {
            "status":     random.choice(["Available", "In Interview", "On Hold"]),
            "skills":     "Go, Docker, AWS",
            "experience": round(random.uniform(1, 15), 1),
            "notes":      "Updated by Locust",
        }
        with self.client.put(f"/api/bench/{self.bench_id}", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Bench failed: {response.text}")

    # ================= 4. FILE OPERATIONS =================

    @task
    def upload_file(self):
        """POST /api/bench/<id>/upload-file"""
        if not self.bench_id:
            return
        with self.client.post(
            f"/api/bench/{self.bench_id}/upload-file",
            json={"file_b64": _MINIMAL_PDF_B64},
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Upload File failed: {response.text}")

    @task
    def get_file(self):
        """GET /api/bench/<id>/file"""
        if not self.bench_id:
            return
        with self.client.get(f"/api/bench/{self.bench_id}/file", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get File failed: {response.text}")

    # ================= 5. DELETE =================

    @task
    def delete_bench(self):
        """DELETE /api/bench/<id>"""
        if not self.bench_id:
            return
        with self.client.delete(f"/api/bench/{self.bench_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Bench Person Deleted: {self.bench_id}")
                self.bench_id = None
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Delete Bench failed: {response.text}")

    @task
    def stop(self):
        return