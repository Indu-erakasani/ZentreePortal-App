"""
Locust load test for export_routes.py
File: LoadTests/locustfile_export.py

Run from project root:
    locust -f LoadTests/locustfile_export.py --host=http://localhost:5000

Then open http://localhost:8089 in your browser.

Or headless:
    locust -f LoadTests/locustfile_export.py \
           --host=http://localhost:5000 \
           --headless -u 30 -r 3 --run-time 2m

NOTE:  The seeded employee (EXP_EMP_LOAD_001) is inserted once during the
       Locust test_start event and removed on test_stop.  All users share
       the same employee ObjectId via the module-level SHARED_EMP_OID variable.
"""

import io
import random
import string

from bson import ObjectId
from locust import HttpUser, TaskSet, between, task, events

try:
    from pymongo import MongoClient
    _PYMONGO_AVAILABLE = True
except ImportError:
    _PYMONGO_AVAILABLE = False


# ─────────────────────────────────────────────────────────────────────────────
# Shared state — populated by the test_start event hook
# ─────────────────────────────────────────────────────────────────────────────

SHARED_EMP_OID: str = ""          # str(ObjectId) of the seeded employee
SHARED_EMP_ID:  str = "EXP_EMP_LOAD_001"

# Update this to match your app's MongoDB URI / DB name
MONGO_URI = "mongodb://localhost:27017/"
MONGO_DB  = "zentreeportal"


# ─────────────────────────────────────────────────────────────────────────────
# Seed / teardown via Locust events
# ─────────────────────────────────────────────────────────────────────────────

@events.test_start.add_listener
def seed_employee(environment, **kwargs):
    """Insert one employee + onboarding record before the swarm starts."""
    global SHARED_EMP_OID
    if not _PYMONGO_AVAILABLE:
        print("[locust-export] pymongo not available — skipping seed.")
        return

    client = MongoClient(MONGO_URI)
    db     = client[MONGO_DB]

    # Remove any leftover from a previous run
    db.employees.delete_many({"emp_id": SHARED_EMP_ID})

    emp_oid = db.employees.insert_one({
        "emp_id":              SHARED_EMP_ID,
        "name":                "Locust Tester",
        "email":               "locust.tester@acme.com",
        "phone":               "9876543210",
        "designation":         "Load Test Engineer",
        "department":          "QA",
        "employment_type":     "Full-Time",
        "date_of_joining":     "2023-01-15T00:00:00",
        "experience":          2,
        "location":            "Hyderabad",
        "reporting_manager":   "Manager Locust",
        "status":              "Active",
        "skills":              "Python, Locust",
        "current_client":      "Load Corp",
        "current_project":     "Perf Portal",
        "current_billing_rate": 5000,
        "billing_currency":    "INR",
        "salary":              700000,
        "notes":               "Inserted by Locust load test",
        "client_history": [
            {
                "client_name":      "Old Load Corp",
                "project_name":     "Legacy Load",
                "role":             "Tester",
                "start_date":       "2021-06-01",
                "end_date":         "2022-12-31",
                "billing_rate":     4000,
                "billing_currency": "INR",
                "work_location":    "Remote",
                "technology":       "Python",
            }
        ],
    }).inserted_id

    db.onboarding.insert_one({
        "employee_id":    str(emp_oid),
        "blood_group":    "B+",
        "personal_email": "locust.personal@gmail.com",
        "referred_by":    "Locust HR",
        "bgv_status":     "Completed",
        "bgv_agency":     "LoadCheck",
        "bgv_remarks":    "Clear",
        "laptop_serial":  "LSLT-001",
        "laptop_make_model": "ThinkPad X1",
        "access_card_number": "AC-LOC-001",
        "email_id_created":   "locust.tester@company.com",
        "probation_end_date": "2023-04-15",
        "bank_details": {
            "account_holder_name": "Locust Tester",
            "account_number":      "9876543210",
            "ifsc_code":           "ICIC0001234",
            "bank_name":           "ICICI Bank",
            "branch":              "Hyderabad",
            "account_type":        "Savings",
        },
        "emergency_contact": {
            "name":         "Locust Emergency",
            "relationship": "Spouse",
            "phone":        "9000000099",
            "email":        "emergency.locust@gmail.com",
            "address":      "Hyderabad",
        },
        "checklist": [
            {"label": "ID Proof",    "done": True,  "remarks": "Verified", "updated_at": "2023-01-16"},
            {"label": "Offer Letter","done": True,  "remarks": "Signed",   "updated_at": "2023-01-16"},
            {"label": "Laptop Issue","done": False, "remarks": "",          "updated_at": ""},
        ],
        "documents": [
            {"name": "Aadhar Card","category": "ID Proof","status": "Verified","remarks": "OK",     "file_name": "aadhar.pdf","updated_at": "2023-01-17"},
            {"name": "PAN Card",   "category": "Tax",     "status": "Pending", "remarks": "Awaited","file_name": None,         "updated_at": ""},
        ],
        "hr_notes": "Load test employee",
        "it_notes": "Laptop issued for load test",
    })

    client.close()
    SHARED_EMP_OID = str(emp_oid)
    print(f"[locust-export] Seeded employee OID: {SHARED_EMP_OID}")


@events.test_stop.add_listener
def teardown_employee(environment, **kwargs):
    """Remove the seeded employee + onboarding record after the swarm ends."""
    if not _PYMONGO_AVAILABLE or not SHARED_EMP_OID:
        return

    client = MongoClient(MONGO_URI)
    db     = client[MONGO_DB]
    db.employees.delete_one({"emp_id": SHARED_EMP_ID})
    db.onboarding.delete_one({"employee_id": SHARED_EMP_OID})
    client.close()
    print(f"[locust-export] Cleaned up employee OID: {SHARED_EMP_OID}")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _random_email(prefix="locust_exp"):
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}_{suffix}@loadtest.com"


def _register_and_login(client, role="admin"):
    email = _random_email(role)
    client.post(
        "/api/auth/register",
        json={
            "first_name": "Locust",
            "last_name":  "Exporter",
            "email":      email,
            "password":   "Test@1234",
            "role":       role,
        },
        name="/api/auth/register [setup]",
    )
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": "Test@1234"},
        name="/api/auth/login [setup]",
    )
    token = res.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


# ─────────────────────────────────────────────────────────────────────────────
# Task sets
# ─────────────────────────────────────────────────────────────────────────────

class ExportCSVTaskSet(TaskSet):
    """
    Exercises GET /api/export/employees/csv
    """

    @task(8)
    def export_csv_authenticated(self):
        self.client.get(
            "/api/export/employees/csv",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/csv",
        )

    @task(1)
    def export_csv_no_auth(self):
        """Expect 401."""
        with self.client.get(
            "/api/export/employees/csv",
            name="GET /api/export/employees/csv [no auth → 401]",
            catch_response=True,
        ) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")

    @task(3)
    def export_csv_validate_content_type(self):
        """Check that the response is text/csv."""
        with self.client.get(
            "/api/export/employees/csv",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/csv [content-type check]",
            catch_response=True,
        ) as res:
            if res.status_code == 200 and "text/csv" in res.headers.get("Content-Type", ""):
                res.success()
            elif res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
            else:
                res.failure("Content-Type is not text/csv")

    @task(3)
    def export_csv_validate_attachment_header(self):
        """Check Content-Disposition has attachment + .csv."""
        with self.client.get(
            "/api/export/employees/csv",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/csv [disposition check]",
            catch_response=True,
        ) as res:
            cd = res.headers.get("Content-Disposition", "")
            if res.status_code == 200 and "attachment" in cd and ".csv" in cd:
                res.success()
            elif res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
            else:
                res.failure(f"Bad Content-Disposition: {cd}")


class ExportExcelAllTaskSet(TaskSet):
    """
    Exercises GET /api/export/employees/excel  (bulk export)
    """

    @task(8)
    def export_excel_authenticated(self):
        self.client.get(
            "/api/export/employees/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/excel",
        )

    @task(1)
    def export_excel_no_auth(self):
        """Expect 401."""
        with self.client.get(
            "/api/export/employees/excel",
            name="GET /api/export/employees/excel [no auth → 401]",
            catch_response=True,
        ) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")

    @task(3)
    def export_excel_validate_content_type(self):
        """Verify XLSX MIME type."""
        xlsx_mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        with self.client.get(
            "/api/export/employees/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/excel [content-type check]",
            catch_response=True,
        ) as res:
            if res.status_code == 200 and xlsx_mime in res.headers.get("Content-Type", ""):
                res.success()
            elif res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
            else:
                res.failure("Wrong Content-Type for Excel export")

    @task(2)
    def export_excel_validate_attachment_header(self):
        """Check Content-Disposition has attachment + .xlsx."""
        with self.client.get(
            "/api/export/employees/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/excel [disposition check]",
            catch_response=True,
        ) as res:
            cd = res.headers.get("Content-Disposition", "")
            if res.status_code == 200 and "attachment" in cd and ".xlsx" in cd:
                res.success()
            elif res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
            else:
                res.failure(f"Bad Content-Disposition: {cd}")

    @task(2)
    def export_excel_non_empty_body(self):
        """Ensure the response body is non-empty bytes."""
        with self.client.get(
            "/api/export/employees/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/excel [non-empty body]",
            catch_response=True,
        ) as res:
            if res.status_code == 200 and len(res.content) > 0:
                res.success()
            elif res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
            else:
                res.failure("Response body is empty")


class ExportSingleJSONTaskSet(TaskSet):
    """
    Exercises GET /api/export/employee/<emp_id>  (single employee JSON)
    """

    @task(8)
    def export_single_json_valid(self):
        if not SHARED_EMP_OID:
            return
        self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid> [valid]",
        )

    @task(2)
    def export_single_json_validate_shape(self):
        """Verify success flag and key fields in the JSON response."""
        if not SHARED_EMP_OID:
            return
        with self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid> [shape check]",
            catch_response=True,
        ) as res:
            if res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
                return
            body = res.json()
            if not body.get("success"):
                res.failure("success flag is not True")
                return
            data = body.get("data", {})
            for key in ("emp_id", "name", "onboarding"):
                if key not in data:
                    res.failure(f"Missing key in data: {key}")
                    return
            res.success()

    @task(2)
    def export_single_json_onboarding_structure(self):
        """Check that onboarding has bank_details, emergency_contact, checklist, documents."""
        if not SHARED_EMP_OID:
            return
        with self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid> [onboarding structure]",
            catch_response=True,
        ) as res:
            if res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
                return
            ob = res.json().get("data", {}).get("onboarding", {})
            for key in ("bank_details", "emergency_contact", "checklist", "documents"):
                if key not in ob:
                    res.failure(f"Missing onboarding key: {key}")
                    return
            res.success()

    @task(1)
    def export_single_json_invalid_id(self):
        """Expect 400."""
        with self.client.get(
            "/api/export/employee/NOT_AN_OID",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid> [bad id → 400]",
            catch_response=True,
        ) as res:
            if res.status_code == 400:
                res.success()
            else:
                res.failure(f"Expected 400, got {res.status_code}")

    @task(1)
    def export_single_json_unknown_id(self):
        """Expect 404."""
        fake = str(ObjectId())
        with self.client.get(
            f"/api/export/employee/{fake}",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid> [unknown → 404]",
            catch_response=True,
        ) as res:
            if res.status_code == 404:
                res.success()
            else:
                res.failure(f"Expected 404, got {res.status_code}")

    @task(1)
    def export_single_json_no_auth(self):
        """Expect 401."""
        if not SHARED_EMP_OID:
            return
        with self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}",
            name="GET /api/export/employee/<oid> [no auth → 401]",
            catch_response=True,
        ) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class ExportSingleExcelTaskSet(TaskSet):
    """
    Exercises GET /api/export/employee/<emp_id>/excel  (single employee Excel)
    """

    XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    @task(8)
    def export_single_excel_valid(self):
        if not SHARED_EMP_OID:
            return
        self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid>/excel [valid]",
        )

    @task(3)
    def export_single_excel_validate_content_type(self):
        if not SHARED_EMP_OID:
            return
        with self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid>/excel [content-type]",
            catch_response=True,
        ) as res:
            if res.status_code == 200 and self.XLSX_MIME in res.headers.get("Content-Type", ""):
                res.success()
            elif res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
            else:
                res.failure("Wrong Content-Type for single Excel export")

    @task(3)
    def export_single_excel_validate_disposition(self):
        if not SHARED_EMP_OID:
            return
        with self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid>/excel [disposition]",
            catch_response=True,
        ) as res:
            cd = res.headers.get("Content-Disposition", "")
            if res.status_code == 200 and "attachment" in cd and ".xlsx" in cd:
                res.success()
            elif res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
            else:
                res.failure(f"Bad Content-Disposition: {cd}")

    @task(2)
    def export_single_excel_validate_emp_id_in_filename(self):
        """Check that the filename contains the emp_id."""
        if not SHARED_EMP_OID:
            return
        with self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid>/excel [filename has emp_id]",
            catch_response=True,
        ) as res:
            cd = res.headers.get("Content-Disposition", "")
            if res.status_code == 200 and SHARED_EMP_ID in cd:
                res.success()
            elif res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")
            else:
                res.failure(f"Emp ID not in filename. CD: {cd}")

    @task(1)
    def export_single_excel_invalid_id(self):
        """Expect 400."""
        with self.client.get(
            "/api/export/employee/BAD_ID/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid>/excel [bad id → 400]",
            catch_response=True,
        ) as res:
            if res.status_code == 400:
                res.success()
            else:
                res.failure(f"Expected 400, got {res.status_code}")

    @task(1)
    def export_single_excel_unknown_id(self):
        """Expect 404."""
        fake = str(ObjectId())
        with self.client.get(
            f"/api/export/employee/{fake}/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid>/excel [unknown → 404]",
            catch_response=True,
        ) as res:
            if res.status_code == 404:
                res.success()
            else:
                res.failure(f"Expected 404, got {res.status_code}")

    @task(1)
    def export_single_excel_no_auth(self):
        """Expect 401."""
        if not SHARED_EMP_OID:
            return
        with self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}/excel",
            name="GET /api/export/employee/<oid>/excel [no auth → 401]",
            catch_response=True,
        ) as res:
            if res.status_code == 401:
                res.success()
            else:
                res.failure(f"Expected 401, got {res.status_code}")


class ExportJourneyTaskSet(TaskSet):
    """
    Realistic export journey:
      1. Export all employees as CSV
      2. Export all employees as Excel
      3. Fetch single employee JSON
      4. Download single employee Excel
    """

    @task(2)
    def full_export_journey(self):
        # Step 1: CSV
        self.client.get(
            "/api/export/employees/csv",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/csv [journey]",
        )
        # Step 2: Excel
        self.client.get(
            "/api/export/employees/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/excel [journey]",
        )
        if not SHARED_EMP_OID:
            return
        # Step 3: JSON
        self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid> [journey]",
        )
        # Step 4: Single Excel
        self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}/excel",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid>/excel [journey]",
        )

    @task(3)
    def csv_only(self):
        self.client.get(
            "/api/export/employees/csv",
            headers=self.user.auth_headers,
            name="GET /api/export/employees/csv [journey-csv]",
        )

    @task(2)
    def single_json_only(self):
        if not SHARED_EMP_OID:
            return
        self.client.get(
            f"/api/export/employee/{SHARED_EMP_OID}",
            headers=self.user.auth_headers,
            name="GET /api/export/employee/<oid> [journey-json]",
        )


# ─────────────────────────────────────────────────────────────────────────────
# User classes
# ─────────────────────────────────────────────────────────────────────────────

class AdminExportUser(HttpUser):
    """
    Admin: runs all export endpoints.
    Weight 3 → spawned most frequently.
    """
    weight    = 3
    wait_time = between(1, 3)
    tasks     = {
        ExportCSVTaskSet:          4,
        ExportExcelAllTaskSet:     4,
        ExportSingleJSONTaskSet:   4,
        ExportSingleExcelTaskSet:  4,
        ExportJourneyTaskSet:      3,
    }

    def on_start(self):
        self.auth_headers = _register_and_login(self.client, role="admin")


class RecruiterExportUser(HttpUser):
    """
    Recruiter: primarily uses CSV and single JSON export.
    """
    weight    = 2
    wait_time = between(1, 4)
    tasks     = {
        ExportCSVTaskSet:         6,
        ExportSingleJSONTaskSet:  4,
        ExportJourneyTaskSet:     2,
    }

    def on_start(self):
        self.auth_headers = _register_and_login(self.client, role="recruiter")


class HeavyExcelUser(HttpUser):
    """
    Simulates a power user who downloads Excel reports frequently.
    Lower wait time to stress the Excel generation path.
    """
    weight    = 1
    wait_time = between(0.5, 2)
    tasks     = {
        ExportExcelAllTaskSet:    5,
        ExportSingleExcelTaskSet: 5,
        ExportJourneyTaskSet:     2,
    }

    def on_start(self):
        self.auth_headers = _register_and_login(self.client, role="admin")