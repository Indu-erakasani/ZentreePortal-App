"""
Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_employee.py -v
"""
import pytest
from datetime import datetime
from bson import ObjectId

# These imports work because conftest.py adds zentreeportal_backend/ to sys.path
from zentreeportal_backend.models.Employee_model import (
    employee_schema,
    engagement_schema,
    serialize_employee,
    EMPLOYEE_STATUSES,
    EMPLOYMENT_TYPES,
    BILLING_CURRENCIES,
    DEPARTMENTS,
)


# ─────────────────────────────────────────────────────────────────────────────
# Shared test data
# ─────────────────────────────────────────────────────────────────────────────
VALID_PAYLOAD = {
    "name":                 "David Kumar",
    "email":                "david@zentree.com",
    "emp_id":               "EMP901",
    "phone":                "9876543210",
    "designation":          "Senior Developer",
    "department":           "Engineering",
    "employment_type":      "Permanent",
    "skills":               "Python, Django, PostgreSQL",
    "experience":           7,
    "location":             "Hyderabad",
    "reporting_manager":    "Alice",
    "status":               "Active",
    "current_client":       "Acme Corp",
    "current_project":      "Portal V2",
    "current_billing_rate": 120.0,
    "billing_currency":     "INR",
    "salary":               1500000,
    "notes":                "Key resource",
}

VALID_ENGAGEMENT = {
    "client_name":      "Globex Inc",
    "project_name":     "Data Platform",
    "role":             "Lead Engineer",
    "start_date":       "2024-01-01T00:00:00",
    "billing_rate":     150.0,
    "billing_currency": "USD",
    "work_location":    "Remote",
    "technology":       "Python, Spark",
    "notes":            "Long-term engagement",
}


# ═════════════════════════════════════════════════════════════════════════════
# 1.  Unit tests – employee_schema()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestEmployeeSchema:

    def test_valid_employee_returns_dict(self):
        doc = employee_schema(**VALID_PAYLOAD)
        assert isinstance(doc, dict)

    def test_emp_id_is_uppercased(self):
        doc = employee_schema(**{**VALID_PAYLOAD, "emp_id": "emp901"})
        assert doc["emp_id"] == "EMP901"

    def test_emp_id_is_stripped(self):
        doc = employee_schema(**{**VALID_PAYLOAD, "emp_id": "  EMP901  "})
        assert doc["emp_id"] == "EMP901"

    def test_email_is_lowercased(self):
        doc = employee_schema(**{**VALID_PAYLOAD, "email": "DAVID@ZENTREE.COM"})
        assert doc["email"] == "david@zentree.com"

    def test_name_is_stripped(self):
        doc = employee_schema(**{**VALID_PAYLOAD, "name": "  David Kumar  "})
        assert doc["name"] == "David Kumar"

    def test_experience_is_float(self):
        doc = employee_schema(**VALID_PAYLOAD)
        assert isinstance(doc["experience"], float)

    def test_salary_is_float(self):
        doc = employee_schema(**VALID_PAYLOAD)
        assert isinstance(doc["salary"], float)

    def test_billing_rate_is_float(self):
        doc = employee_schema(**VALID_PAYLOAD)
        assert isinstance(doc["current_billing_rate"], float)

    def test_default_status_is_active(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        assert doc["status"] == "Active"

    def test_default_department_is_engineering(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        assert doc["department"] == "Engineering"

    def test_default_employment_type_is_permanent(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        assert doc["employment_type"] == "Permanent"

    def test_default_billing_currency_is_inr(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        assert doc["billing_currency"] == "INR"

    def test_date_of_joining_defaults_to_datetime(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        assert isinstance(doc["date_of_joining"], datetime)

    def test_client_history_defaults_to_empty_list(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        assert doc["client_history"] == []

    def test_created_at_is_datetime(self):
        doc = employee_schema(**VALID_PAYLOAD)
        assert isinstance(doc["created_at"], datetime)

    def test_updated_at_is_datetime(self):
        doc = employee_schema(**VALID_PAYLOAD)
        assert isinstance(doc["updated_at"], datetime)

    def test_optional_fields_default_to_empty_string(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        for field in ("phone", "designation", "skills", "location",
                      "reporting_manager", "current_client", "current_project", "notes"):
            assert doc[field] == "", f"Expected empty string for {field}"

    def test_invalid_status_raises_valueerror(self):
        with pytest.raises(ValueError, match="status must be one of"):
            employee_schema(**{**VALID_PAYLOAD, "status": "FakeStatus"})

    def test_all_statuses_accepted(self):
        for status in EMPLOYEE_STATUSES:
            doc = employee_schema(**{**VALID_PAYLOAD, "status": status})
            assert doc["status"] == status

    def test_salary_zero_default(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        assert doc["salary"] == 0.0

    def test_billing_rate_zero_default(self):
        doc = employee_schema(name="A", email="a@b.com", emp_id="EMP000")
        assert doc["current_billing_rate"] == 0.0


# ═════════════════════════════════════════════════════════════════════════════
# 2.  Unit tests – engagement_schema()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestEngagementSchema:

    def test_valid_engagement_returns_dict(self):
        eng = engagement_schema(client_name="Globex")
        assert isinstance(eng, dict)

    def test_client_name_is_stripped(self):
        eng = engagement_schema(client_name="  Globex  ")
        assert eng["client_name"] == "Globex"

    def test_billing_rate_is_float(self):
        eng = engagement_schema(client_name="Globex", billing_rate=150)
        assert isinstance(eng["billing_rate"], float)

    def test_default_billing_currency_is_inr(self):
        eng = engagement_schema(client_name="Globex")
        assert eng["billing_currency"] == "INR"

    def test_start_date_defaults_to_datetime(self):
        eng = engagement_schema(client_name="Globex")
        assert isinstance(eng["start_date"], datetime)

    def test_end_date_defaults_to_none(self):
        eng = engagement_schema(client_name="Globex")
        assert eng["end_date"] is None

    def test_added_at_is_datetime(self):
        eng = engagement_schema(client_name="Globex")
        assert isinstance(eng["added_at"], datetime)

    def test_optional_text_fields_default_to_empty(self):
        eng = engagement_schema(client_name="Globex")
        for field in ("project_name", "role", "work_location", "technology", "notes"):
            assert eng[field] == "", f"Expected empty string for {field}"

    def test_billing_rate_zero_default(self):
        eng = engagement_schema(client_name="Globex")
        assert eng["billing_rate"] == 0.0


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Unit tests – serialize_employee()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestSerializeEmployee:

    def test_objectid_converted_to_string(self):
        doc = {"_id": ObjectId(), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        result = serialize_employee(doc)
        assert isinstance(result["_id"], str)

    def test_datetime_fields_converted_to_iso(self):
        now = datetime.utcnow()
        doc = {
            "_id": "abc",
            "date_of_joining": now,
            "created_at":      now,
            "updated_at":      now,
        }
        result = serialize_employee(doc)
        for field in ("date_of_joining", "created_at", "updated_at"):
            assert isinstance(result[field], str), f"{field} should be ISO string"

    def test_client_history_dates_serialized(self):
        now = datetime.utcnow()
        doc = {
            "_id": "abc",
            "client_history": [
                {"start_date": now, "end_date": None, "added_at": now}
            ],
        }
        result = serialize_employee(doc)
        ch = result["client_history"][0]
        assert isinstance(ch["start_date"], str)
        assert isinstance(ch["added_at"], str)
        assert ch["end_date"] is None

    def test_original_dict_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid, "name": "David"}
        serialize_employee(doc)
        assert doc["_id"] == oid

    def test_missing_id_defaults_to_empty_string(self):
        result = serialize_employee({})
        assert result["_id"] == ""


# ═════════════════════════════════════════════════════════════════════════════
# 4.  Integration tests – Employee API routes
# ═════════════════════════════════════════════════════════════════════════════

# ── helper fixture: create one employee, yield its data, then clean up ────────
@pytest.fixture
def created_employee(client, auth_headers):
    res = client.post("/api/employees/", json=VALID_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201, f"Setup failed: {res.get_json()}"
    data = res.get_json()["data"]
    yield data
    client.delete(f"/api/employees/{data['_id']}", headers=auth_headers)


# ── helper fixture: employee with one engagement added ────────────────────────
@pytest.fixture
def employee_with_engagement(client, auth_headers, created_employee):
    eid = created_employee["_id"]
    res = client.post(
        f"/api/employees/{eid}/engagement",
        json=VALID_ENGAGEMENT,
        headers=auth_headers,
    )
    assert res.status_code == 200, f"Engagement setup failed: {res.get_json()}"
    yield res.get_json()["data"]


# ── POST /api/employees/ ──────────────────────────────────────────────────────
class TestCreateEmployee:

    def test_create_valid_employee_returns_201(self, client, auth_headers, created_employee):
        assert created_employee["name"] == "David Kumar"

    def test_create_returns_correct_email(self, client, auth_headers, created_employee):
        assert created_employee["email"] == "david@zentree.com"

    def test_email_stored_lowercased(self, client, auth_headers, created_employee):
        assert created_employee["email"] == created_employee["email"].lower()

    def test_emp_id_stored_uppercased(self, client, auth_headers, created_employee):
        assert created_employee["emp_id"] == "EMP901"

    def test_response_contains_emp_id(self, client, auth_headers, created_employee):
        assert "emp_id" in created_employee
        assert created_employee["emp_id"].startswith("EMP")

    def test_client_history_initialized_empty(self, client, auth_headers, created_employee):
        assert created_employee["client_history"] == []

    def test_missing_name_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "name"}
        res = client.post("/api/employees/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "name" in res.get_json()["message"]

    def test_missing_email_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "email"}
        res = client.post("/api/employees/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "email" in res.get_json()["message"]

    def test_duplicate_email_returns_409(self, client, auth_headers, created_employee):
        payload = {**VALID_PAYLOAD, "emp_id": "EMP999"}
        res = client.post("/api/employees/", json=payload, headers=auth_headers)
        assert res.status_code == 409
        assert "already exists" in res.get_json()["message"]

    def test_duplicate_emp_id_returns_409(self, client, auth_headers, created_employee):
        payload = {**VALID_PAYLOAD, "email": "other@zentree.com"}
        res = client.post("/api/employees/", json=payload, headers=auth_headers)
        assert res.status_code == 409
        assert "already in use" in res.get_json()["message"]

    def test_invalid_status_returns_400(self, client, auth_headers):
        payload = {**VALID_PAYLOAD, "email": "new@zentree.com",
                   "emp_id": "EMP902", "status": "FakeStatus"}
        res = client.post("/api/employees/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_request_returns_401(self, client):
        res = client.post("/api/employees/", json=VALID_PAYLOAD)
        assert res.status_code == 401


# ── GET /api/employees/ ───────────────────────────────────────────────────────
class TestGetEmployees:

    def test_list_returns_200(self, client, auth_headers):
        res = client.get("/api/employees/", headers=auth_headers)
        assert res.status_code == 200

    def test_list_data_is_array(self, client, auth_headers):
        body = client.get("/api/employees/", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_pagination_fields_present(self, client, auth_headers):
        body = client.get("/api/employees/?page=1&per_page=5", headers=auth_headers).get_json()
        assert "page" in body and "total" in body and "per_page" in body

    def test_search_by_name(self, client, auth_headers, created_employee):
        res = client.get("/api/employees/?q=David+Kumar", headers=auth_headers)
        names = [d["name"] for d in res.get_json()["data"]]
        assert "David Kumar" in names

    def test_search_by_skill(self, client, auth_headers, created_employee):
        res = client.get("/api/employees/?q=Python", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.get_json()["data"], list)

    def test_filter_by_status(self, client, auth_headers, created_employee):
        res = client.get("/api/employees/?status=Active", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["status"] == "Active" for d in data)

    def test_filter_by_department(self, client, auth_headers, created_employee):
        res = client.get("/api/employees/?department=Engineering", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["department"] == "Engineering" for d in data)

    def test_filter_by_client(self, client, auth_headers, created_employee):
        res = client.get("/api/employees/?client=Acme", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.get_json()["data"], list)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/employees/").status_code == 401


# ── GET /api/employees/<id> ───────────────────────────────────────────────────
class TestGetSingleEmployee:

    def test_get_existing_employee_returns_200(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.get(f"/api/employees/{eid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["_id"] == eid

    def test_get_nonexistent_employee_returns_404(self, client, auth_headers):
        res = client.get("/api/employees/000000000000000000000000", headers=auth_headers)
        assert res.status_code == 404

    def test_invalid_id_format_returns_400(self, client, auth_headers):
        res = client.get("/api/employees/not-an-id", headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_request_returns_401(self, client, created_employee):
        eid = created_employee["_id"]
        assert client.get(f"/api/employees/{eid}").status_code == 401


# ── PUT /api/employees/<id> ───────────────────────────────────────────────────
class TestUpdateEmployee:

    def test_update_designation(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.put(f"/api/employees/{eid}",
                         json={"designation": "Principal Engineer"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["designation"] == "Principal Engineer"

    def test_update_status(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.put(f"/api/employees/{eid}",
                         json={"status": "On Bench"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["status"] == "On Bench"

    def test_update_invalid_status_returns_400(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.put(f"/api/employees/{eid}",
                         json={"status": "FakeStatus"},
                         headers=auth_headers)
        assert res.status_code == 400

    def test_update_skills(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.put(f"/api/employees/{eid}",
                         json={"skills": "Go, Kubernetes, Terraform"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["skills"] == "Go, Kubernetes, Terraform"

    def test_update_department(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.put(f"/api/employees/{eid}",
                         json={"department": "DevOps & Cloud"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["department"] == "DevOps & Cloud"

    def test_update_salary(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.put(f"/api/employees/{eid}",
                         json={"salary": 2000000},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["salary"] == 2000000.0

    def test_update_notes(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.put(f"/api/employees/{eid}",
                         json={"notes": "Updated note"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["notes"] == "Updated note"

    def test_update_date_of_joining_iso_string(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.put(f"/api/employees/{eid}",
                         json={"date_of_joining": "2023-06-01T00:00:00"},
                         headers=auth_headers)
        assert res.status_code == 200

    def test_update_nonexistent_employee_returns_404(self, client, auth_headers):
        res = client.put("/api/employees/000000000000000000000000",
                         json={"notes": "x"}, headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_employee):
        eid = created_employee["_id"]
        assert client.put(f"/api/employees/{eid}", json={"notes": "x"}).status_code == 401


# ── DELETE /api/employees/<id> ────────────────────────────────────────────────
class TestDeleteEmployee:

    def test_delete_existing_employee_returns_200(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        res = client.delete(f"/api/employees/{eid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["success"] is True

    def test_deleted_employee_not_found_afterwards(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        client.delete(f"/api/employees/{eid}", headers=auth_headers)
        assert client.get(f"/api/employees/{eid}", headers=auth_headers).status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        assert client.delete("/api/employees/000000000000000000000000",
                             headers=auth_headers).status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_employee):
        eid = created_employee["_id"]
        assert client.delete(f"/api/employees/{eid}").status_code == 401


# ── GET /api/employees/meta/options ──────────────────────────────────────────
class TestMetaOptions:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/employees/meta/options", headers=auth_headers).status_code == 200

    def test_returns_statuses_list(self, client, auth_headers):
        body = client.get("/api/employees/meta/options", headers=auth_headers).get_json()
        assert "statuses" in body and isinstance(body["statuses"], list)

    def test_returns_employment_types_list(self, client, auth_headers):
        body = client.get("/api/employees/meta/options", headers=auth_headers).get_json()
        assert "employment_types" in body and isinstance(body["employment_types"], list)

    def test_returns_billing_currencies_list(self, client, auth_headers):
        body = client.get("/api/employees/meta/options", headers=auth_headers).get_json()
        assert "billing_currencies" in body and isinstance(body["billing_currencies"], list)

    def test_returns_departments_list(self, client, auth_headers):
        body = client.get("/api/employees/meta/options", headers=auth_headers).get_json()
        assert "departments" in body and isinstance(body["departments"], list)

    def test_statuses_match_constants(self, client, auth_headers):
        body = client.get("/api/employees/meta/options", headers=auth_headers).get_json()
        assert set(body["statuses"]) == set(EMPLOYEE_STATUSES)

    def test_employment_types_match_constants(self, client, auth_headers):
        body = client.get("/api/employees/meta/options", headers=auth_headers).get_json()
        assert set(body["employment_types"]) == set(EMPLOYMENT_TYPES)

    def test_billing_currencies_match_constants(self, client, auth_headers):
        body = client.get("/api/employees/meta/options", headers=auth_headers).get_json()
        assert set(body["billing_currencies"]) == set(BILLING_CURRENCIES)

    def test_departments_match_constants(self, client, auth_headers):
        body = client.get("/api/employees/meta/options", headers=auth_headers).get_json()
        assert set(body["departments"]) == set(DEPARTMENTS)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/employees/meta/options").status_code == 401


# ── GET /api/employees/stats ──────────────────────────────────────────────────
class TestEmployeeStats:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/employees/stats", headers=auth_headers).status_code == 200

    def test_returns_by_status(self, client, auth_headers):
        body = client.get("/api/employees/stats", headers=auth_headers).get_json()
        assert "by_status" in body["data"]

    def test_returns_by_department(self, client, auth_headers):
        body = client.get("/api/employees/stats", headers=auth_headers).get_json()
        assert "by_department" in body["data"]

    def test_returns_active_clients_count(self, client, auth_headers):
        body = client.get("/api/employees/stats", headers=auth_headers).get_json()
        assert "active_clients" in body["data"]
        assert isinstance(body["data"]["active_clients"], int)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/employees/stats").status_code == 401


# ── POST /api/employees/<id>/engagement ──────────────────────────────────────
class TestAddEngagement:

    def test_add_engagement_returns_200(self, client, auth_headers, employee_with_engagement):
        assert "client_history" in employee_with_engagement
        assert len(employee_with_engagement["client_history"]) >= 1

    def test_engagement_stored_in_client_history(self, client, auth_headers, employee_with_engagement):
        latest = employee_with_engagement["client_history"][-1]
        assert latest["client_name"] == "Globex Inc"

    def test_engagement_updates_current_client(self, client, auth_headers, employee_with_engagement):
        assert employee_with_engagement["current_client"] == "Globex Inc"

    def test_engagement_updates_current_project(self, client, auth_headers, employee_with_engagement):
        assert employee_with_engagement["current_project"] == "Data Platform"

    def test_engagement_updates_billing_rate(self, client, auth_headers, employee_with_engagement):
        assert employee_with_engagement["current_billing_rate"] == 150.0

    def test_add_engagement_missing_client_name_returns_400(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        payload = {k: v for k, v in VALID_ENGAGEMENT.items() if k != "client_name"}
        res = client.post(f"/api/employees/{eid}/engagement", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "client_name" in res.get_json()["message"]

    def test_add_multiple_engagements_appends_history(self, client, auth_headers, created_employee):
        eid = created_employee["_id"]
        client.post(f"/api/employees/{eid}/engagement",
                    json={**VALID_ENGAGEMENT, "client_name": "ClientA"},
                    headers=auth_headers)
        client.post(f"/api/employees/{eid}/engagement",
                    json={**VALID_ENGAGEMENT, "client_name": "ClientB"},
                    headers=auth_headers)
        data = client.get(f"/api/employees/{eid}", headers=auth_headers).get_json()["data"]
        assert len(data["client_history"]) == 2

    def test_add_engagement_nonexistent_employee_returns_404(self, client, auth_headers):
        res = client.post("/api/employees/000000000000000000000000/engagement",
                          json=VALID_ENGAGEMENT, headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_employee):
        eid = created_employee["_id"]
        assert client.post(f"/api/employees/{eid}/engagement",
                           json=VALID_ENGAGEMENT).status_code == 401


# ── PUT /api/employees/<id>/engagement/<idx> ──────────────────────────────────
class TestEndEngagement:

    def test_end_engagement_returns_200(self, client, auth_headers, employee_with_engagement):
        # employee_with_engagement fixture already has one engagement at index 0
        eid = employee_with_engagement["_id"]
        res = client.put(f"/api/employees/{eid}/engagement/0",
                         json={"end_date": "2025-03-31T00:00:00"},
                         headers=auth_headers)
        assert res.status_code == 200

    def test_end_engagement_sets_end_date(self, client, auth_headers, employee_with_engagement):
        eid = employee_with_engagement["_id"]
        client.put(f"/api/employees/{eid}/engagement/0",
                   json={"end_date": "2025-03-31T00:00:00"},
                   headers=auth_headers)
        data = client.get(f"/api/employees/{eid}", headers=auth_headers).get_json()["data"]
        assert data["client_history"][0]["end_date"] is not None

    def test_end_engagement_without_date_uses_utcnow(self, client, auth_headers, employee_with_engagement):
        eid = employee_with_engagement["_id"]
        res = client.put(f"/api/employees/{eid}/engagement/0",
                         json={}, headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()["data"]
        assert data["client_history"][0]["end_date"] is not None

    def test_end_engagement_out_of_range_returns_400(self, client, auth_headers, employee_with_engagement):
        eid = employee_with_engagement["_id"]
        res = client.put(f"/api/employees/{eid}/engagement/99",
                         json={"end_date": "2025-03-31T00:00:00"},
                         headers=auth_headers)
        assert res.status_code == 400

    def test_end_engagement_nonexistent_employee_returns_404(self, client, auth_headers):
        res = client.put("/api/employees/000000000000000000000000/engagement/0",
                         json={"end_date": "2025-03-31T00:00:00"},
                         headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, employee_with_engagement):
        eid = employee_with_engagement["_id"]
        assert client.put(f"/api/employees/{eid}/engagement/0",
                          json={"end_date": "2025-03-31T00:00:00"}).status_code == 401













