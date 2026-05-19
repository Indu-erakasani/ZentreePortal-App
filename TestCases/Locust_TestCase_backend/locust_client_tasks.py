

from locust import TaskSet, task
import random
import logging
import uuid


class ClientTasks(TaskSet):
    """
    Load tests for Client_routes.py
    prefix: /api/clients
    """

    def on_start(self):
        self.headers  = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.client_id_db = None  # MongoDB _id of created client

        unique_suffix        = str(uuid.uuid4())[:8].upper()
        self.dummy_client_id = f"CLI{unique_suffix}"
        self.dummy_email     = f"client_{unique_suffix.lower()}@example.com"

    # ================= 1. CREATE =================

    @task
    def create_client(self):
        """POST /api/clients/"""
        payload = {
            "client_id":           self.dummy_client_id,
            "company_name":        f"Locust Corp {str(uuid.uuid4())[:4]}",
            "industry":            "Information Technology",
            "company_size":        "100-500",
            "location":            "Hyderabad",
            "primary_contact":     "Locust Contact",
            "contact_title":       "HR Manager",
            "email":               self.dummy_email,
            "phone":               str(random.randint(6000000000, 9999999999)),
            "relationship_status": "Active",
        }
        with self.client.post("/api/clients/", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 201:
                self.client_id_db = response.json().get("data", {}).get("_id")
                logging.info(f"✅ Client Created: {self.client_id_db}")
            elif response.status_code == 409:
                response.success()  # already exists
            else:
                response.failure(f"Create Client failed: {response.text}")

    # ================= 2. READ =================

    @task
    def get_clients(self):
        """GET /api/clients/"""
        params = {"page": 1, "per_page": 10, "status": "Active"}
        with self.client.get("/api/clients/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                records = response.json().get("data", [])
                if records and not self.client_id_db:
                    self.client_id_db = records[0].get("_id")
            else:
                response.failure(f"Get Clients failed: {response.text}")

    @task
    def search_clients(self):
        """GET /api/clients/?q=Locust"""
        params = {"q": "Locust Corp", "page": 1, "per_page": 10}
        with self.client.get("/api/clients/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search Clients failed: {response.text}")

    @task
    def filter_by_industry(self):
        """GET /api/clients/?industry=Information+Technology"""
        params = {"industry": "Information Technology", "page": 1, "per_page": 10}
        with self.client.get("/api/clients/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Industry failed: {response.text}")

    @task
    def filter_by_status(self):
        """GET /api/clients/?status=Active"""
        params = {"status": "Active", "page": 1, "per_page": 10}
        with self.client.get("/api/clients/", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter by Status failed: {response.text}")

    @task
    def get_single_client(self):
        """GET /api/clients/<id>"""
        if not self.client_id_db:
            return
        with self.client.get(f"/api/clients/{self.client_id_db}", headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get Single Client failed: {response.text}")

    @task
    def get_meta_options(self):
        """GET /api/clients/meta/options"""
        with self.client.get("/api/clients/meta/options", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Meta Options failed: {response.text}")

    # ================= 3. UPDATE =================

    @task
    def update_client(self):
        """PUT /api/clients/<id>"""
        if not self.client_id_db:
            return
        payload = {
            "relationship_status": random.choice(["Active", "Inactive", "Prospect"]),
            "notes":               "Updated by Locust",
            "billing_rate":        round(random.uniform(50, 250), 2),
        }
        with self.client.put(f"/api/clients/{self.client_id_db}", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Client failed: {response.text}")

    # ================= 4. DELETE =================

    @task
    def delete_client(self):
        """DELETE /api/clients/<id>"""
        if not self.client_id_db:
            return
        with self.client.delete(f"/api/clients/{self.client_id_db}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Client Deleted: {self.client_id_db}")
                self.client_id_db = None
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Delete Client failed: {response.text}")

    @task
    def stop(self):
        return