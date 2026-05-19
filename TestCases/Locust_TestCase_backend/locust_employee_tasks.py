



from locust import TaskSet, task
import json
import random
import logging
import uuid


class EmployeeTasks(TaskSet):
    """
    Validates endpoints in employee_routes.py
    prefix: /api/employees
    """

    def on_start(self):
        self.headers = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.employee_id = None

        # Generate unique data per user session
        unique_suffix = str(uuid.uuid4())[:8]
        self.dummy_emp_id = f"EMP{unique_suffix.upper()}"
        self.dummy_email = f"emp_{unique_suffix}@example.com"

    # ================= 1. CREATE =================

    @task
    def create_employee(self):
        """POST /api/employees/"""
        url = "/api/employees/"

        payload = {
            "name": f"Locust User {str(uuid.uuid4())[:5]}",
            "email": self.dummy_email,
            "emp_id": self.dummy_emp_id,
            "phone": str(random.randint(6000000000, 9999999999)),
            "designation": "Senior Developer",
            "department": "Engineering",
            "employment_type": "Permanent",
            "skills": "Python, Django, PostgreSQL",
            "experience": round(random.uniform(1, 15), 1),
            "location": "Hyderabad",
            "reporting_manager": "Alice",
            "status": "Active",
            "current_client": "Acme Corp",
            "current_project": "Portal V2",
            "current_billing_rate": round(random.uniform(50, 200), 2),
            "billing_currency": "INR",
            "salary": random.randint(500000, 3000000),
            "notes": "Created by Locust load test",
        }

        with self.client.post(url, json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 201:
                data = response.json()
                self.employee_id = data.get("data", {}).get("_id")
                logging.info(f"✅ Employee Created: {self.employee_id}")
            elif response.status_code == 409 and "already exists" in response.text:
                logging.warning("⚠️ Employee conflict, fetching existing list...")
                self.get_employees()
            else:
                response.failure(f"Create Employee failed: {response.text}")

    # ================= 2. READ =================

    @task
    def get_employees(self):
        """GET /api/employees/"""
        params = {
            "page": 1,
            "per_page": 10,
            "status": "Active",
            "department": "Engineering",
        }
        with self.client.get("/api/employees/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                employees = data.get("data", [])
                if employees and not self.employee_id:
                    self.employee_id = employees[0].get("_id")
            else:
                response.failure(f"Get Employees failed: {response.text}")

    @task
    def search_employees(self):
        """GET /api/employees/?q=<query>"""
        params = {"q": "Python", "page": 1, "per_page": 10}
        with self.client.get("/api/employees/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search Employees failed: {response.text}")

    @task
    def get_single_employee(self):
        """GET /api/employees/<id>"""
        if not self.employee_id:
            return
        with self.client.get(f"/api/employees/{self.employee_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Single Employee failed: {response.text}")

    @task
    def get_meta_options(self):
        """GET /api/employees/meta/options"""
        with self.client.get("/api/employees/meta/options", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Meta Options failed: {response.text}")

    @task
    def get_stats(self):
        """GET /api/employees/stats"""
        with self.client.get("/api/employees/stats", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Stats failed: {response.text}")

    # ================= 3. UPDATE =================

    @task
    def update_employee(self):
        """PUT /api/employees/<id>"""
        if not self.employee_id:
            return

        payload = {
            "designation": "Principal Engineer",
            "skills": "Go, Kubernetes, Terraform",
            "salary": random.randint(1000000, 4000000),
            "notes": "Updated by Locust",
        }
        with self.client.put(f"/api/employees/{self.employee_id}", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Employee failed: {response.text}")

    @task
    def update_status(self):
        """PUT /api/employees/<id> - status update"""
        if not self.employee_id:
            return

        status = random.choice(["Active", "On Bench", "Inactive"])
        with self.client.put(
            f"/api/employees/{self.employee_id}",
            json={"status": status},
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Status failed: {response.text}")

    # ================= 4. ENGAGEMENT OPERATIONS =================

    @task
    def add_engagement(self):
        """POST /api/employees/<id>/engagement"""
        if not self.employee_id:
            return

        payload = {
            "client_name": f"Client_{str(uuid.uuid4())[:5]}",
            "project_name": "Data Platform",
            "role": "Lead Engineer",
            "start_date": "2024-01-01T00:00:00",
            "billing_rate": round(random.uniform(100, 300), 2),
            "billing_currency": "INR",
            "work_location": "Remote",
            "technology": "Python, Spark",
            "notes": "Added by Locust",
        }
        with self.client.post(
            f"/api/employees/{self.employee_id}/engagement",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Add Engagement failed: {response.text}")

    @task
    def end_engagement(self):
        """PUT /api/employees/<id>/engagement/0"""
        if not self.employee_id:
            return

        payload = {"end_date": "2025-03-31T00:00:00"}
        with self.client.put(
            f"/api/employees/{self.employee_id}/engagement/0",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 400, 404]:
                response.success()
            else:
                response.failure(f"End Engagement failed: {response.text}")

    # ================= 5. DELETE =================

    @task
    def delete_employee(self):
        """DELETE /api/employees/<id>"""
        if not self.employee_id:
            return

        with self.client.delete(f"/api/employees/{self.employee_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Employee Deleted: {self.employee_id}")
                self.employee_id = None
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Delete Employee failed: {response.text}")

    @task
    def stop(self):
        return