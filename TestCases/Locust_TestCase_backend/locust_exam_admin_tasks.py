"""
Locust load test for exam_routes.py + admin_routes.py
File: /home/indhu/zentreeportal/TestCases/TestCase_backend/locust_exam_admin_tasks.py
"""
from locust import TaskSet, task
import random
import logging
import uuid


class AdminTasks(TaskSet):
    """
    Load tests for admin_routes.py
    prefix: /api/admin
    """

    def on_start(self):
        self.headers = (
            self.user.resident_session.get("headers")
            if self.user.resident_session
            else self.user.client.headers
        )
        self.target_user_id = None

    # ================= 1. READ =================

    @task
    def get_all_users(self):
        """GET /api/admin/users"""
        with self.client.get(
            "/api/admin/users",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                users = response.json().get("users", [])
                if users and not self.target_user_id:
                    self.target_user_id = users[0].get("_id")
            elif response.status_code == 403:
                response.success()  # non-admin gets 403 — expected
            else:
                response.failure(f"Get All Users failed: {response.text}")

    @task
    def filter_users_by_role(self):
        """GET /api/admin/users?role=recruiter"""
        params = {"role": random.choice(["recruiter", "manager", "hr", "admin"])}
        with self.client.get(
            "/api/admin/users",
            params=params,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 403]:
                response.success()
            else:
                response.failure(f"Filter Users failed: {response.text}")

    @task
    def get_single_user(self):
        """GET /api/admin/users/<id>"""
        if not self.target_user_id:
            return
        with self.client.get(
            f"/api/admin/users/{self.target_user_id}",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 403, 404]:
                response.success()
            else:
                response.failure(f"Get Single User failed: {response.text}")

    @task
    def get_admin_stats(self):
        """GET /api/admin/stats"""
        with self.client.get(
            "/api/admin/stats",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 403]:
                response.success()
            else:
                response.failure(f"Get Admin Stats failed: {response.text}")

    # ================= 2. UPDATE =================

    @task
    def update_user(self):
        """PUT /api/admin/users/<id>"""
        if not self.target_user_id:
            return
        payload = {
            "first_name": f"Locust_{str(uuid.uuid4())[:4]}",
        }
        with self.client.put(
            f"/api/admin/users/{self.target_user_id}",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 400, 403, 404]:
                response.success()
            else:
                response.failure(f"Update User failed: {response.text}")

    @task
    def toggle_user_status(self):
        """PATCH /api/admin/users/<id>/toggle-status"""
        if not self.target_user_id:
            return
        with self.client.patch(
            f"/api/admin/users/{self.target_user_id}/toggle-status",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 400, 403, 404]:
                response.success()
            else:
                response.failure(f"Toggle Status failed: {response.text}")

    @task
    def stop(self):
        return


class ExamTasks(TaskSet):
    """
    Load tests for exam_routes.py
    prefix: /api/exams
    """

    def on_start(self):
        self.headers      = (
            self.user.resident_session.get("headers")
            if self.user.resident_session
            else self.user.client.headers
        )
        self.exam_token   = None
        self.exam_mongo_id = None
        self.notif_id     = None

    # ================= 1. GET EXAMS =================

    @task
    def get_all_exams(self):
        """GET /api/exams/"""
        params = {"status": random.choice(["Sent", "In Progress", "Completed", ""])}
        with self.client.get(
            "/api/exams/",
            params=params,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                exams = response.json().get("data", [])
                if exams and not self.exam_token:
                    self.exam_token    = exams[0].get("token")
                    self.exam_mongo_id = exams[0].get("_id")
            else:
                response.failure(f"Get All Exams failed: {response.text}")

    @task
    def get_single_exam(self):
        """GET /api/exams/<id>"""
        if not self.exam_mongo_id:
            return
        with self.client.get(
            f"/api/exams/{self.exam_mongo_id}",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Single Exam failed: {response.text}")

    # ================= 2. TAKE EXAM (public) =================

    @task
    def take_exam(self):
        """GET /api/exams/take/<token>  (public)"""
        if not self.exam_token:
            return
        with self.client.get(
            f"/api/exams/take/{self.exam_token}",
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404, 409, 410]:
                response.success()
            else:
                response.failure(f"Take Exam failed: {response.text}")

    # ================= 3. SUBMIT EXAM (public) =================

    @task
    def submit_exam(self):
        """POST /api/exams/submit/<token>  (public)"""
        if not self.exam_token:
            return

        payload = {
            "mcq": [
                {"question_index": 0, "selected_option": "A function wrapper"},
                {"question_index": 1, "selected_option": "Global Interpreter Lock"},
            ],
            "subjective": [
                {
                    "question_index": 0,
                    "answer": "The GIL is a mutex that protects access to Python objects.",
                }
            ],
            "coding": [
                {
                    "question_index": 0,
                    "code":        "def reverse_string(s):\n    return s[::-1]",
                    "run_output":  "dlrow olleh",
                    "run_stderr":  "",
                    "run_status":  "Accepted",
                }
            ],
            "proctoring": {
                "events":    [],
                "snapshots": [],
            },
        }
        with self.client.post(
            f"/api/exams/submit/{self.exam_token}",
            json=payload,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 409, 410, 404]:
                response.success()
            else:
                response.failure(f"Submit Exam failed: {response.text}")

    # ================= 4. COMPILE CODE (public) =================

    @task
    def compile_code(self):
        """POST /api/exams/compile  (public)"""
        snippets = [
            ("print('hello locust')", "Python"),
            ("console.log('hello')",  "JavaScript"),
            ("System.out.println(\"Hi\");", "Java"),
        ]
        code, language = random.choice(snippets)
        with self.client.post(
            "/api/exams/compile",
            json={"code": code, "language": language, "stdin": ""},
            catch_response=True,
        ) as response:
            if response.status_code in [200, 504]:
                response.success()
            else:
                response.failure(f"Compile Code failed: {response.text}")

    # ================= 5. PROCTORING =================

    @task
    def store_proctor_event(self):
        """POST /api/exams/proctor/<token>/event  (public)"""
        if not self.exam_token:
            return
        payload = {
            "type": random.choice(["warning", "alert", "info"]),
            "msg":  random.choice([
                "Looking away from screen",
                "Phone detected",
                "Multiple faces detected",
                "Tab switch suspected",
            ]),
        }
        with self.client.post(
            f"/api/exams/proctor/{self.exam_token}/event",
            json=payload,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Store Proctor Event failed: {response.text}")

    @task
    def get_proctoring_report(self):
        """GET /api/exams/<exam_id>/proctoring"""
        if not self.exam_mongo_id:
            return
        with self.client.get(
            f"/api/exams/{self.exam_mongo_id}/proctoring",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 403, 404]:
                response.success()
            else:
                response.failure(f"Get Proctoring Report failed: {response.text}")

    # ================= 6. NOTIFICATIONS =================

    @task
    def get_notifications(self):
        """GET /api/exams/notifications/"""
        with self.client.get(
            "/api/exams/notifications/",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                notifs = response.json().get("data", [])
                if notifs and not self.notif_id:
                    self.notif_id = notifs[0].get("_id")
            else:
                response.failure(f"Get Notifications failed: {response.text}")

    @task
    def mark_notification_read(self):
        """PUT /api/exams/notifications/<id>/read"""
        if not self.notif_id:
            return
        with self.client.put(
            f"/api/exams/notifications/{self.notif_id}/read",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Mark Notification Read failed: {response.text}")

    @task
    def mark_all_notifications_read(self):
        """PUT /api/exams/notifications/read-all"""
        with self.client.put(
            "/api/exams/notifications/read-all",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Mark All Read failed: {response.text}")

    @task
    def stop(self):
        return