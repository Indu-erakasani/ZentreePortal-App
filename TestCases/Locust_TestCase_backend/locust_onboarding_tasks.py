"""
Locust load test for onboarding_routes.py
File: /home/indhu/zentreeportal/TestCases/TestCase_backend/locust_onboarding_tasks.py
"""
from locust import TaskSet, task
import base64
import random
import logging
import uuid


# Minimal valid PDF as base64
_MINIMAL_PDF_B64 = base64.b64encode(
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
    b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF"
).decode()


class OnboardingTasks(TaskSet):
    """
    Load tests for onboarding_routes.py
    prefix: /api/onboarding
    """

    def on_start(self):
        self.headers      = self.user.resident_session.get("headers") if self.user.resident_session else self.user.client.headers
        self.employee_id  = f"EMP{str(uuid.uuid4())[:6].upper()}"
        self.doc_index    = None  # index of last added document

    # ================= 1. META =================

    @task
    def get_meta(self):
        """GET /api/onboarding/meta"""
        with self.client.get("/api/onboarding/meta", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get Meta failed: {response.text}")

    # ================= 2. GET / CREATE ONBOARDING =================

    @task
    def get_onboarding(self):
        """GET /api/onboarding/<employee_id> — creates if not exists"""
        with self.client.get(
            f"/api/onboarding/{self.employee_id}",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                logging.info(f"✅ Onboarding record fetched: {self.employee_id}")
            else:
                response.failure(f"Get Onboarding failed: {response.text}")

    # ================= 3. UPDATE ONBOARDING =================

    @task
    def update_onboarding(self):
        """PUT /api/onboarding/<employee_id>"""
        payload = {
            "blood_group":        random.choice(["A+", "B+", "O+", "AB+", "A-", "B-"]),
            "bgv_status":         random.choice(["Not Initiated", "Initiated", "In Progress"]),
            "laptop_serial":      f"SN{str(uuid.uuid4())[:6].upper()}",
            "laptop_make_model":  random.choice(["Dell Latitude 5520", "HP EliteBook 840", "Lenovo ThinkPad X1"]),
            "access_card_number": f"AC{random.randint(1000, 9999)}",
            "hr_notes":           "Updated by Locust load test",
            "it_notes":           "System access granted by Locust",
            "bank_details": {
                "account_holder_name": "Locust User",
                "account_number":      str(random.randint(100000000000, 999999999999)),
                "ifsc_code":           "HDFC0001234",
                "bank_name":           "HDFC Bank",
                "branch":              "Hyderabad",
                "account_type":        "Savings",
            },
            "emergency_contact": {
                "name":         "Locust Contact",
                "relationship": "Father",
                "phone":        str(random.randint(6000000000, 9999999999)),
                "email":        f"contact_{str(uuid.uuid4())[:5]}@example.com",
                "address":      "Hyderabad",
            },
        }
        with self.client.put(
            f"/api/onboarding/{self.employee_id}",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Update Onboarding failed: {response.text}")

    # ================= 4. CHECKLIST =================

    @task
    def update_checklist_item(self):
        """PUT /api/onboarding/<employee_id>/checklist/<idx>"""
        idx = random.randint(0, 16)  # 17 checklist items (0–16)
        payload = {
            "done":    random.choice([True, False]),
            "remarks": random.choice(["Completed", "Pending review", "In progress", ""]),
        }
        with self.client.put(
            f"/api/onboarding/{self.employee_id}/checklist/{idx}",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 400, 404]:
                response.success()
            else:
                response.failure(f"Update Checklist failed: {response.text}")

    # ================= 5. DOCUMENTS =================

    @task
    def add_document(self):
        """POST /api/onboarding/<employee_id>/document"""
        category = random.choice(list({
            "Identity": [], "Address": [], "Education": [],
            "Professional": [], "Medical": [], "Other": []
        }.keys()))

        doc_names = {
            "Identity":     ["Aadhar Card", "PAN Card", "Passport"],
            "Address":      ["Utility Bill", "Rental Agreement"],
            "Education":    ["10th Marksheet", "Graduation Certificate"],
            "Professional": ["Relieving Letter", "Experience Letter"],
            "Medical":      ["Medical Fitness Certificate"],
            "Other":        ["Photograph", "Signed Offer Letter"],
        }

        payload = {
            "name":     random.choice(doc_names[category]),
            "category": category,
            "status":   "Pending",
            "remarks":  "Added by Locust",
        }
        with self.client.post(
            f"/api/onboarding/{self.employee_id}/document",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                docs = response.json().get("data", {}).get("documents", [])
                if docs:
                    self.doc_index = len(docs) - 1
                    logging.info(f"✅ Document added at index {self.doc_index}")
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"Add Document failed: {response.text}")

    @task
    def update_document(self):
        """PUT /api/onboarding/<employee_id>/document/<idx>"""
        if self.doc_index is None:
            return
        payload = {
            "status":  random.choice(["Pending", "Received", "Verified", "Waived"]),
            "remarks": "Reviewed by Locust",
        }
        with self.client.put(
            f"/api/onboarding/{self.employee_id}/document/{self.doc_index}",
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code in [200, 400, 404]:
                response.success()
            else:
                response.failure(f"Update Document failed: {response.text}")

    @task
    def delete_document(self):
        """DELETE /api/onboarding/<employee_id>/document/<idx>"""
        if self.doc_index is None:
            return
        with self.client.delete(
            f"/api/onboarding/{self.employee_id}/document/{self.doc_index}",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                logging.info(f"🗑️ Document deleted at index {self.doc_index}")
                self.doc_index = None
            elif response.status_code in [400, 404]:
                response.success()
            else:
                response.failure(f"Delete Document failed: {response.text}")

    @task
    def stop(self):
        return