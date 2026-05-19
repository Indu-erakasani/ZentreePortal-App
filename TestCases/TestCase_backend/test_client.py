

"""
Tests for Client model + API routes.
File:  /home/indhu/zentreeportal/TestCases/TestCase_backend/test_client.py

Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_client.py -v
"""
import pytest
from datetime import datetime
from bson import ObjectId

# These imports work because conftest.py adds zentreeportal_backend/ to sys.path
from zentreeportal_backend.models.Client_model import (
    client_schema,
    serialize_client,
    INDUSTRIES,
    RELATIONSHIP_STATUSES,
)


# ─────────────────────────────────────────────────────────────────────────────
# Shared test data
# ─────────────────────────────────────────────────────────────────────────────
VALID_PAYLOAD = {
    "client_id":           "TC001",
    "company_name":        "Test Corp",
    "industry":            "Information Technology",
    "company_size":        "100-500",
    "location":            "Hyderabad",
    "primary_contact":     "John Doe",
    "contact_title":       "HR Manager",
    "email":               "john@testcorp.com",
    "phone":               "9876543210",
    "relationship_status": "Active",
}


# ═════════════════════════════════════════════════════════════════════════════
# 1.  Unit tests – client_schema()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestClientSchema:

    def test_valid_client_returns_dict(self):
        doc = client_schema(**VALID_PAYLOAD)
        assert isinstance(doc, dict)

    def test_client_id_is_uppercased(self):
        doc = client_schema(**{**VALID_PAYLOAD, "client_id": "tc001"})
        assert doc["client_id"] == "TC001"

    def test_email_is_lowercased(self):
        doc = client_schema(**{**VALID_PAYLOAD, "email": "JOHN@TESTCORP.COM"})
        assert doc["email"] == "john@testcorp.com"

    def test_default_country_is_india(self):
        assert client_schema(**VALID_PAYLOAD)["country"] == "India"

    def test_default_payment_terms(self):
        assert client_schema(**VALID_PAYLOAD)["payment_terms"] == "Net 30"

    def test_default_active_jobs_is_zero(self):
        assert client_schema(**VALID_PAYLOAD)["active_jobs"] == 0

    def test_default_total_placements_is_zero(self):
        assert client_schema(**VALID_PAYLOAD)["total_placements"] == 0

    def test_created_at_is_datetime(self):
        assert isinstance(client_schema(**VALID_PAYLOAD)["created_at"], datetime)

    def test_invalid_industry_raises_valueerror(self):
        with pytest.raises(ValueError, match="industry must be one of"):
            client_schema(**{**VALID_PAYLOAD, "industry": "FakeIndustry"})

    def test_invalid_relationship_status_raises_valueerror(self):
        with pytest.raises(ValueError, match="relationship_status must be one of"):
            client_schema(**{**VALID_PAYLOAD, "relationship_status": "Unknown"})

    def test_all_industries_accepted(self):
        for ind in INDUSTRIES:
            doc = client_schema(**{**VALID_PAYLOAD, "industry": ind})
            assert doc["industry"] == ind

    def test_all_relationship_statuses_accepted(self):
        for status in RELATIONSHIP_STATUSES:
            doc = client_schema(**{**VALID_PAYLOAD, "relationship_status": status})
            assert doc["relationship_status"] == status

    def test_optional_fields_default_to_empty_string(self):
        doc = client_schema(**VALID_PAYLOAD)
        for field in ("city", "state", "address", "website", "notes"):
            assert doc[field] == "", f"Expected empty string for {field}"

    def test_billing_rate_defaults_to_zero(self):
        assert client_schema(**VALID_PAYLOAD)["billing_rate"] == 0.0

    def test_custom_billing_rate(self):
        doc = client_schema(**{**VALID_PAYLOAD, "billing_rate": 150.0})
        assert doc["billing_rate"] == 150.0


# ═════════════════════════════════════════════════════════════════════════════
# 2.  Unit tests – serialize_client()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestSerializeClient:

    def test_objectid_converted_to_string(self):
        doc = {"_id": ObjectId(), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        result = serialize_client(doc)
        assert isinstance(result["_id"], str)

    def test_datetime_fields_converted_to_iso(self):
        now = datetime.utcnow()
        doc = {
            "_id": "abc",
            "created_at":      now,
            "updated_at":      now,
            "agreement_start": now,
            "agreement_end":   now,
        }
        result = serialize_client(doc)
        for field in ("created_at", "updated_at", "agreement_start", "agreement_end"):
            assert isinstance(result[field], str), f"{field} should be ISO string"

    def test_none_datetime_fields_stay_none(self):
        doc = {"_id": "abc", "agreement_start": None, "agreement_end": None}
        result = serialize_client(doc)
        assert result["agreement_start"] is None
        assert result["agreement_end"]   is None

    def test_original_dict_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid, "company_name": "X"}
        serialize_client(doc)
        assert doc["_id"] == oid   # original ObjectId untouched


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Integration tests – Client API routes
#     These use the `client` and `auth_headers` fixtures from conftest.py
# ═════════════════════════════════════════════════════════════════════════════

# ── helper fixture: create one client, yield its data, then clean up ─────────
@pytest.fixture
def created_client(client, auth_headers):
    res = client.post("/api/clients/", json=VALID_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201, f"Setup failed: {res.get_json()}"
    data = res.get_json()["data"]
    yield data
    # Teardown – delete so tests don't bleed into each other
    client.delete(f"/api/clients/{data['_id']}", headers=auth_headers)


# ── POST /api/clients/ ────────────────────────────────────────────────────────
class TestCreateClient:

    def test_create_valid_client_returns_201(self, client, auth_headers, created_client):
        # created_client fixture already verified the 201; just check success flag
        assert created_client["company_name"] == "Test Corp"

    def test_create_client_returns_correct_data(self, client, auth_headers, created_client):
        assert created_client["email"] == "john@testcorp.com"

    def test_duplicate_client_id_returns_409(self, client, auth_headers, created_client):
        res = client.post("/api/clients/", json=VALID_PAYLOAD, headers=auth_headers)
        assert res.status_code == 409
        assert "already exists" in res.get_json()["message"]

    def test_duplicate_email_returns_409(self, client, auth_headers, created_client):
        payload = {**VALID_PAYLOAD, "client_id": "TC002"}
        res = client.post("/api/clients/", json=payload, headers=auth_headers)
        assert res.status_code == 409

    def test_missing_required_field_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "company_name"}
        res = client.post("/api/clients/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "company_name" in res.get_json()["message"]

    def test_invalid_industry_returns_400_or_500(self, client, auth_headers):
        payload = {**VALID_PAYLOAD, "industry": "FakeIndustry"}
        res = client.post("/api/clients/", json=payload, headers=auth_headers)
        assert res.status_code in (400, 500)

    def test_unauthenticated_request_returns_401(self, client):
        res = client.post("/api/clients/", json=VALID_PAYLOAD)
        assert res.status_code == 401


# ── GET /api/clients/ ─────────────────────────────────────────────────────────
class TestGetClients:

    def test_list_returns_200(self, client, auth_headers):
        res = client.get("/api/clients/", headers=auth_headers)
        assert res.status_code == 200

    def test_list_data_is_array(self, client, auth_headers):
        assert isinstance(client.get("/api/clients/", headers=auth_headers).get_json()["data"], list)

    def test_search_by_company_name(self, client, auth_headers, created_client):
        res = client.get("/api/clients/?q=Test+Corp", headers=auth_headers)
        names = [c["company_name"] for c in res.get_json()["data"]]
        assert "Test Corp" in names

    def test_filter_by_industry(self, client, auth_headers, created_client):
        res = client.get("/api/clients/?industry=Information+Technology", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(c["industry"] == "Information Technology" for c in data)

    def test_filter_by_status(self, client, auth_headers, created_client):
        res = client.get("/api/clients/?status=Active", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(c["relationship_status"] == "Active" for c in data)

    def test_pagination_fields_present(self, client, auth_headers):
        body = client.get("/api/clients/?page=1&per_page=5", headers=auth_headers).get_json()
        assert "page" in body and "total" in body and "pages" in body

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/clients/").status_code == 401


# ── GET /api/clients/<id> ─────────────────────────────────────────────────────
class TestGetSingleClient:

    def test_get_existing_client_returns_200(self, client, auth_headers, created_client):
        cid = created_client["_id"]
        res = client.get(f"/api/clients/{cid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["_id"] == cid

    def test_get_nonexistent_client_returns_404(self, client, auth_headers):
        res = client.get("/api/clients/000000000000000000000000", headers=auth_headers)
        assert res.status_code == 404

    def test_invalid_id_format_returns_400(self, client, auth_headers):
        res = client.get("/api/clients/not-an-id", headers=auth_headers)
        assert res.status_code == 400


# ── PUT /api/clients/<id> ─────────────────────────────────────────────────────
class TestUpdateClient:

    def test_update_company_name(self, client, auth_headers, created_client):
        cid = created_client["_id"]
        res = client.put(f"/api/clients/{cid}", json={"company_name": "Updated Corp"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["company_name"] == "Updated Corp"

    def test_update_relationship_status(self, client, auth_headers, created_client):
        cid = created_client["_id"]
        res = client.put(f"/api/clients/{cid}", json={"relationship_status": "Inactive"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["relationship_status"] == "Inactive"

    def test_update_invalid_industry_returns_400(self, client, auth_headers, created_client):
        cid = created_client["_id"]
        res = client.put(f"/api/clients/{cid}", json={"industry": "FakeIndustry"}, headers=auth_headers)
        assert res.status_code == 400

    def test_update_nonexistent_client_returns_404(self, client, auth_headers):
        res = client.put("/api/clients/000000000000000000000000", json={"company_name": "X"}, headers=auth_headers)
        assert res.status_code == 404

    def test_empty_body_returns_400(self, client, auth_headers, created_client):
        cid = created_client["_id"]
        res = client.put(f"/api/clients/{cid}", json={}, headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_request_returns_401(self, client, created_client):
        cid = created_client["_id"]
        assert client.put(f"/api/clients/{cid}", json={"company_name": "X"}).status_code == 401


# ── DELETE /api/clients/<id> ──────────────────────────────────────────────────
class TestDeleteClient:

    def test_delete_existing_client_returns_200(self, client, auth_headers, created_client):
        cid = created_client["_id"]
        # Delete manually here (fixture teardown won't find it)
        res = client.delete(f"/api/clients/{cid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["success"] is True

    def test_deleted_client_not_found_afterwards(self, client, auth_headers, created_client):
        cid = created_client["_id"]
        client.delete(f"/api/clients/{cid}", headers=auth_headers)
        assert client.get(f"/api/clients/{cid}", headers=auth_headers).status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        assert client.delete("/api/clients/000000000000000000000000", headers=auth_headers).status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_client):
        cid = created_client["_id"]
        assert client.delete(f"/api/clients/{cid}").status_code == 401


# ── GET /api/clients/meta/options ─────────────────────────────────────────────
class TestMetaOptions:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/clients/meta/options", headers=auth_headers).status_code == 200

    def test_returns_industries_list(self, client, auth_headers):
        body = client.get("/api/clients/meta/options", headers=auth_headers).get_json()
        assert "industries" in body and isinstance(body["industries"], list)

    def test_returns_statuses_list(self, client, auth_headers):
        body = client.get("/api/clients/meta/options", headers=auth_headers).get_json()
        assert "statuses" in body and isinstance(body["statuses"], list)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/clients/meta/options").status_code == 401



