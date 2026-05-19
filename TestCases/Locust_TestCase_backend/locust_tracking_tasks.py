

from locust import TaskSet, task
import random
import logging
import uuid


class TrackingTasks(TaskSet):
    """
    Validates endpoints in tracking_routes.py
    prefix: /api/tracking
    """

    def on_start(self):
        self.headers = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.tracking_id = None
        self.schedule_id = None

        # Generate unique data per user session
        unique_suffix = str(uuid.uuid4())[:8]
        self.dummy_resume_id  = f"RES{unique_suffix.upper()}"
        self.dummy_job_id     = f"JOB{unique_suffix.upper()}"

    # ================= 1. CREATE =================

    @task
    def create_tracking(self):
        """POST /api/tracking/"""
        url = "/api/tracking/"

        payload = {
            "resume_id":       self.dummy_resume_id,
            "candidate_name":  f"Locust Candidate {str(uuid.uuid4())[:5]}",
            "job_id":          self.dummy_job_id,
            "client_name":     "Acme Corp",
            "job_title":       "Backend Engineer",
            "current_stage":   "Screening",
            "pipeline_status": "Active",
            "recruiter":       "Bob",
            "notes":           "Created by Locust load test",
        }

        with self.client.post(url, json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 201]:
                data = response.json()
                self.tracking_id = data.get("data", {}).get("_id")
                logging.info(f"✅ Tracking Created/Updated: {self.tracking_id}")
            else:
                response.failure(f"Create Tracking failed: {response.text}")

    # ================= 2. READ =================

    @task
    def get_tracking(self):
        """GET /api/tracking/"""
        params = {
            "page":     1,
            "per_page": 10,
            "stage":    "Screening",
            "status":   "Active",
        }
        with self.client.get("/api/tracking/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                records = data.get("data", [])
                if records and not self.tracking_id:
                    self.tracking_id = records[0].get("_id")
            else:
                response.failure(f"Get Tracking failed: {response.text}")

    @task
    def search_tracking(self):
        """GET /api/tracking/?q=<query>"""
        params = {"q": "Locust Candidate", "page": 1, "per_page": 10}
        with self.client.get("/api/tracking/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search Tracking failed: {response.text}")

    @task
    def filter_by_job_id(self):
        """GET /api/tracking/?job_id=<id>"""
        params = {"job_id": self.dummy_job_id, "page": 1, "per_page": 10}
        with self.client.get("/api/tracking/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Job ID failed: {response.text}")

    @task
    def get_single_tracking(self):
        """GET /api/tracking/<id>"""
        if not self.tracking_id:
            return
        with self.client.get(f"/api/tracking/{self.tracking_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Single Tracking failed: {response.text}")

    @task
    def get_meta_options(self):
        """GET /api/tracking/meta/options"""
        with self.client.get("/api/tracking/meta/options", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Meta Options failed: {response.text}")

    @task
    def get_pipeline_view(self):
        """GET /api/tracking/pipeline"""
        with self.client.get("/api/tracking/pipeline", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Pipeline View failed: {response.text}")

    @task
    def get_by_resume(self):
        """GET /api/tracking/by-resume/<resume_id>"""
        with self.client.get(
            f"/api/tracking/by-resume/{self.dummy_resume_id}",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get By Resume failed: {response.text}")

    @task
    def get_upcoming(self):
        """GET /api/tracking/upcoming"""
        with self.client.get("/api/tracking/upcoming", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Upcoming failed: {response.text}")

    @task
    def get_calendar(self):
        """GET /api/tracking/calendar"""
        params = {"year": 2099, "month": 12}
        with self.client.get("/api/tracking/calendar", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Calendar failed: {response.text}")

    # ================= 3. UPDATE =================

    @task
    def update_tracking(self):
        """PUT /api/tracking/<id>"""
        if not self.tracking_id:
            return

        payload = {
            "current_stage":   random.choice(["Screening", "Technical Round 1", "HR Round"]),
            "pipeline_status": random.choice(["Active", "On Hold"]),
            "notes":           "Updated by Locust",
        }
        with self.client.put(f"/api/tracking/{self.tracking_id}", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Tracking failed: {response.text}")

    # ================= 4. SCHEDULE OPERATIONS =================

    @task
    def schedule_interview(self):
        """POST /api/tracking/<id>/schedule"""
        if not self.tracking_id:
            return

        payload = {
            "interviewer_name":  "Dr. Smith",
            "interviewer_email": "smith@acme.com",
            "candidate_email":   "candidate@example.com",
            "interview_date":    "2099-12-01",
            "interview_time":    f"{random.randint(9, 17):02d}:00",
            "duration_minutes":  random.choice([30, 45, 60, 90]),
            "interview_type":    random.choice(["Video", "Phone", "In-Person", "Technical"]),
            "stage":             "Screening",
            "notes":             "Scheduled by Locust",
        }
        with self.client.post(
            f"/api/tracking/{self.tracking_id}/schedule",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 201:
                self.schedule_id = response.json().get("schedule_id")
                logging.info(f"✅ Interview Scheduled: {self.schedule_id}")
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Schedule Interview failed: {response.text}")

    @task
    def update_schedule(self):
        """PUT /api/tracking/<id>/schedule/<schedule_id>"""
        if not self.tracking_id or not self.schedule_id:
            return

        payload = {
            "status": random.choice(["Completed", "Rescheduled", "Cancelled"]),
            "notes":  "Updated by Locust",
        }
        with self.client.put(
            f"/api/tracking/{self.tracking_id}/schedule/{self.schedule_id}",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Schedule failed: {response.text}")

    @task
    def submit_schedule_feedback(self):
        """POST /api/tracking/<id>/schedule/<schedule_id>/feedback"""
        if not self.tracking_id or not self.schedule_id:
            return

        payload = {
            "feedback_summary": "Candidate performed well in Locust test",
            "feedback_score":   random.randint(1, 5),
            "recommendation":   random.choice(["Hire", "Strong Hire", "No Hire", "On Hold"]),
            "strengths":        ["Python", "System Design"],
            "weaknesses":       ["Communication"],
        }
        with self.client.post(
            f"/api/tracking/{self.tracking_id}/schedule/{self.schedule_id}/feedback",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Submit Schedule Feedback failed: {response.text}")

    # ================= 5. INTERVIEW (DIRECT) =================

    @task
    def add_interview(self):
        """POST /api/tracking/<id>/interview"""
        if not self.tracking_id:
            return

        payload = {
            "interviewer":      "Dr. Jones",
            "feedback_score":   random.randint(1, 5),
            "feedback_summary": "Good technical knowledge",
            "recommendation":   random.choice(["Hire", "No Hire", "On Hold"]),
        }
        with self.client.post(
            f"/api/tracking/{self.tracking_id}/interview",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Add Interview failed: {response.text}")

    # ================= 6. PUBLIC ENDPOINTS (no auth) =================

    @task
    def candidate_rsvp_accept(self):
        """GET /api/tracking/<id>/schedule/<schedule_id>/respond/accept (public)"""
        if not self.tracking_id or not self.schedule_id:
            return
        with self.client.get(
            f"/api/tracking/{self.tracking_id}/schedule/{self.schedule_id}/respond/accept",
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Candidate RSVP Accept failed: {response.text}")

    @task
    def candidate_rsvp_decline(self):
        """GET /api/tracking/<id>/schedule/<schedule_id>/respond/decline (public)"""
        if not self.tracking_id or not self.schedule_id:
            return
        with self.client.get(
            f"/api/tracking/{self.tracking_id}/schedule/{self.schedule_id}/respond/decline",
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Candidate RSVP Decline failed: {response.text}")

    @task
    def get_feedback_form(self):
        """GET /api/tracking/<id>/schedule/<schedule_id>/feedback-form (public)"""
        if not self.tracking_id or not self.schedule_id:
            return
        with self.client.get(
            f"/api/tracking/{self.tracking_id}/schedule/{self.schedule_id}/feedback-form",
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Feedback Form failed: {response.text}")

    # ================= 7. DELETE =================

    @task
    def delete_tracking(self):
        """DELETE /api/tracking/<id>"""
        if not self.tracking_id:
            return
        with self.client.delete(f"/api/tracking/{self.tracking_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Tracking Deleted: {self.tracking_id}")
                self.tracking_id = None
                self.schedule_id = None
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Delete Tracking failed: {response.text}")

    @task
    def stop(self):
        return