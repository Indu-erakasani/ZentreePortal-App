"""
Locust load test for Placement_routes.py
File: /home/indhu/zentreeportal/TestCases/TestCase_backend/locust_placement_tasks.py
"""
from locust import TaskSet, task
import random
import logging
import uuid


class PlacementTasks(TaskSet):
    """
    Load tests for Placement_routes.py
    prefix: /api/placements
    """

    def on_start(self):
        self.headers      = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.placement_id = None

        unique_suffix      = str(uuid.uuid4())[:8].upper()
        self.dummy_resume_id = f"RES{unique_suffix}"
        self.dummy_job_id    = f"JOB{unique_suffix}"

    # ================= 1. CREATE =================

    @task
    def create_placement(self):
        """POST /api/placements/"""
        payload = {
            "resume_id":          self.dummy_resume_id,
            "candidate_name":     f"Locust Candidate {str(uuid.uuid4())[:5]}",
            "job_id":             self.dummy_job_id,
            "client_name":        random.choice(["Acme Corp", "TechSoft", "GlobalIT"]),
            "job_title":          random.choice(["Backend Engineer", "DevOps Lead", "QA Engineer"]),
            "recruiter":          random.choice(["Alice", "Bob", "Carol"]),
            "offer_date":         "2025-05-15T00:00:00",
            "joining_date":       "2025-06-01T00:00:00",
            "final_ctc":          random.randint(600000, 2500000),
            "billing_amount":     random.randint(80000, 300000),
            "billing_percentage": round(random.uniform(8, 15), 2),
            "payment_status":     "Pending",
            "candidate_status":   "Active",
            "guarantee_period":   random.choice([60, 90, 180]),
            "notes":              "Created by Locust load test",
            "time_to_fill":       random.randint(10, 60),
        }
        with self.client.post(
            "/api/placements/",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 201:
                self.placement_id = response.json().get("data", {}).get("_id")
                logging.info(f"✅ Placement Created: {self.placement_id}")
            else:
                response.failure(f"Create Placement failed: {response.text}")

    # ================= 2. READ =================

    @task
    def get_placements(self):
        """GET /api/placements/"""
        params = {"page": 1, "per_page": 10}
        with self.client.get(
            "/api/placements/",
            params=params,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                records = response.json().get("data", [])
                if records and not self.placement_id:
                    self.placement_id = records[0].get("_id")
            else:
                response.failure(f"Get Placements failed: {response.text}")

    @task
    def search_placements(self):
        """GET /api/placements/?q=Locust"""
        params = {"q": "Locust Candidate", "page": 1, "per_page": 10}
        with self.client.get(
            "/api/placements/",
            params=params,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search Placements failed: {response.text}")

    @task
    def filter_by_client(self):
        """GET /api/placements/?client_name=Acme+Corp"""
        params = {"client_name": "Acme Corp", "page": 1, "per_page": 10}
        with self.client.get(
            "/api/placements/",
            params=params,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Client failed: {response.text}")

    @task
    def filter_by_payment_status(self):
        """GET /api/placements/?payment_status=Pending"""
        params = {
            "payment_status": random.choice(["Pending", "Paid", "Partial", "Overdue"]),
            "page": 1,
            "per_page": 10,
        }
        with self.client.get(
            "/api/placements/",
            params=params,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Payment Status failed: {response.text}")

    @task
    def filter_by_job_id(self):
        """GET /api/placements/?job_id=<id>"""
        params = {"job_id": self.dummy_job_id, "page": 1, "per_page": 10}
        with self.client.get(
            "/api/placements/",
            params=params,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Job ID failed: {response.text}")

    @task
    def get_single_placement(self):
        """GET /api/placements/<id>"""
        if not self.placement_id:
            return
        with self.client.get(
            f"/api/placements/{self.placement_id}",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Single Placement failed: {response.text}")

    @task
    def get_stats(self):
        """GET /api/placements/stats"""
        with self.client.get(
            "/api/placements/stats",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Stats failed: {response.text}")

    @task
    def get_pending_from_tracking(self):
        """GET /api/placements/pending-from-tracking"""
        with self.client.get(
            "/api/placements/pending-from-tracking",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Pending From Tracking failed: {response.text}")

    # ================= 3. UPDATE =================

    @task
    def update_placement(self):
        """PUT /api/placements/<id>"""
        if not self.placement_id:
            return
        payload = {
            "payment_status":   random.choice(["Pending", "Partial", "Paid", "Overdue"]),
            "candidate_status": random.choice(["Active", "Probation", "Confirmed"]),
            "notes":            "Updated by Locust",
            "account_manager":  "Locust Manager",
        }
        with self.client.put(
            f"/api/placements/{self.placement_id}",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Placement failed: {response.text}")

    # ================= 4. DELETE =================

    @task
    def delete_placement(self):
        """DELETE /api/placements/<id>"""
        if not self.placement_id:
            return
        with self.client.delete(
            f"/api/placements/{self.placement_id}",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Placement Deleted: {self.placement_id}")
                self.placement_id = None
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Delete Placement failed: {response.text}")

    @task
    def stop(self):
        return