

from locust import TaskSet, task
import random
import logging
import uuid


class AuthUserTasks(TaskSet):
    """
    Load tests for auth_routes + user_routes
    prefix: /api/auth  and  /api/user
    """

    def on_start(self):
        self.headers = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.access_token  = None
        self.refresh_token = None

        unique_suffix = str(uuid.uuid4())[:8]
        self.dummy_email    = f"locust_{unique_suffix}@example.com"
        self.dummy_password = "Locust@1234"

    # ================= 1. REGISTER =================

    @task
    def register_user(self):
        """POST /api/auth/register"""
        payload = {
            "first_name": "Locust",
            "last_name":  "User",
            "email":      self.dummy_email,
            "password":   self.dummy_password,
            "role":       random.choice(["recruiter", "hr", "manager"]),
        }
        with self.client.post("/api/auth/register", json=payload, catch_response=True) as response:
            if response.status_code == 201:
                logging.info(f"✅ Registered: {self.dummy_email}")
            elif response.status_code == 409:
                response.success()  # already exists — that's fine
            else:
                response.failure(f"Register failed: {response.text}")

    # ================= 2. LOGIN =================

    @task
    def login_user(self):
        """POST /api/auth/login"""
        with self.client.post(
            "/api/auth/login",
            json={"email": self.dummy_email, "password": self.dummy_password},
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.access_token  = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                logging.info("✅ Login successful")
            elif response.status_code == 401:
                response.success()  # user may not be registered yet
            else:
                response.failure(f"Login failed: {response.text}")

    # ================= 3. GET ME =================

    @task
    def get_me(self):
        """GET /api/auth/me"""
        with self.client.get("/api/auth/me", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Get Me failed: {response.text}")

    # ================= 4. REFRESH TOKEN =================

    @task
    def refresh_token(self):
        """POST /api/auth/refresh"""
        if not self.refresh_token:
            return
        with self.client.post(
            "/api/auth/refresh",
            json={"refresh_token": self.refresh_token},
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                self.access_token = response.json().get("access_token")
            elif response.status_code in [400, 401]:
                response.success()
            else:
                response.failure(f"Refresh Token failed: {response.text}")

    # ================= 5. CHANGE PASSWORD =================

    @task
    def change_password(self):
        """PUT /api/auth/change-password"""
        with self.client.put(
            "/api/auth/change-password",
            json={
                "current_password": self.dummy_password,
                "new_password":     "NewLocust@5678",
            },
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 400, 401]:
                response.success()
            else:
                response.failure(f"Change Password failed: {response.text}")

    # ================= 6. UPDATE PROFILE =================

    @task
    def update_profile(self):
        """PUT /api/user/profile"""
        with self.client.put(
            "/api/user/profile",
            json={"first_name": f"Locust_{str(uuid.uuid4())[:4]}"},
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 400, 401]:
                response.success()
            else:
                response.failure(f"Update Profile failed: {response.text}")

    # ================= 7. GET ALL USERS =================

    @task
    def get_all_users(self):
        """GET /api/user/"""
        with self.client.get("/api/user/", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Get All Users failed: {response.text}")

    @task
    def stop(self):
        return