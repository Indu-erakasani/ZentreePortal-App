"""
Locust load test for dashboard_routes.py
File: TestCases/TestCase_backend/locust_dashboard_tasks.py

Run:
    locust -f TestCases/TestCase_backend/locust_dashboard_tasks.py \
           --host http://localhost:5000 --users 20 --spawn-rate 4
"""
from locust import TaskSet, task


class DashboardTasks(TaskSet):
    """
    Load tests for dashboard_routes.py
    prefix: /api/dashboard
    """

    def on_start(self):
        self.headers = (
            self.user.resident_session.get("headers")
            if self.user.resident_session
            else self.user.client.headers
        )

    # ═════════════════════════════════════════════════════════════════════════
    # 1. Admin / Manager Dashboard  —  GET /api/dashboard/
    # ═════════════════════════════════════════════════════════════════════════

    @task(3)
    def get_dashboard(self):
        """GET /api/dashboard/  — full org-wide dashboard"""
        with self.client.get(
            "/api/dashboard/",
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                body = res.json()
                if not body.get("success"):
                    res.failure(f"success=False: {res.text}")
                    return
                dashboard = body.get("dashboard", {})
                if "kpis" not in dashboard:
                    res.failure("Missing 'kpis' in dashboard response")
            elif res.status_code == 401:
                res.success()   # expected for unauthenticated virtual users
            else:
                res.failure(f"Get Dashboard failed [{res.status_code}]: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 2. Recruiter Dashboard  —  GET /api/dashboard/recruiter
    # ═════════════════════════════════════════════════════════════════════════

    @task(4)
    def get_recruiter_dashboard(self):
        """GET /api/dashboard/recruiter  — recruiter-scoped dashboard"""
        with self.client.get(
            "/api/dashboard/recruiter",
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                body = res.json()
                if not body.get("success"):
                    res.failure(f"success=False: {res.text}")
                    return
                dashboard = body.get("dashboard", {})
                if "stats" not in dashboard:
                    res.failure("Missing 'stats' in recruiter dashboard response")
            elif res.status_code == 401:
                res.success()
            else:
                res.failure(f"Get Recruiter Dashboard failed [{res.status_code}]: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 3. Rapid-fire polling  — simulates a browser refreshing every 30s
    # ═════════════════════════════════════════════════════════════════════════

    @task(2)
    def poll_main_dashboard(self):
        """Back-to-back GET /api/dashboard/ — simulates live auto-refresh"""
        with self.client.get(
            "/api/dashboard/",
            headers=self.headers,
            name="/api/dashboard/ [poll]",
            catch_response=True,
        ) as res:
            if res.status_code in [200, 401]:
                res.success()
            else:
                res.failure(f"Poll Dashboard failed [{res.status_code}]")

    @task(2)
    def poll_recruiter_dashboard(self):
        """Back-to-back GET /api/dashboard/recruiter — simulates live auto-refresh"""
        with self.client.get(
            "/api/dashboard/recruiter",
            headers=self.headers,
            name="/api/dashboard/recruiter [poll]",
            catch_response=True,
        ) as res:
            if res.status_code in [200, 401]:
                res.success()
            else:
                res.failure(f"Poll Recruiter Dashboard failed [{res.status_code}]")

    # ═════════════════════════════════════════════════════════════════════════
    # 4. Unauthenticated probes — verify 401 guards hold under load
    # ═════════════════════════════════════════════════════════════════════════

    @task(1)
    def probe_main_dashboard_no_auth(self):
        """GET /api/dashboard/ without token — must return 401"""
        with self.client.get(
            "/api/dashboard/",
            name="/api/dashboard/ [no-auth]",
            catch_response=True,
        ) as res:
            if res.status_code == 401:
                res.success()
            elif res.status_code == 200:
                res.failure("Expected 401 for unauthenticated request, got 200")
            else:
                res.failure(f"Unexpected status {res.status_code} for no-auth probe")

    @task(1)
    def probe_recruiter_dashboard_no_auth(self):
        """GET /api/dashboard/recruiter without token — must return 401"""
        with self.client.get(
            "/api/dashboard/recruiter",
            name="/api/dashboard/recruiter [no-auth]",
            catch_response=True,
        ) as res:
            if res.status_code == 401:
                res.success()
            elif res.status_code == 200:
                res.failure("Expected 401 for unauthenticated request, got 200")
            else:
                res.failure(f"Unexpected status {res.status_code} for no-auth probe")

    @task
    def stop(self):
        return