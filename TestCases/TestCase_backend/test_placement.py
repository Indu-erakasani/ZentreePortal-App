"""
Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_placement.py -v
"""
import pytest
from datetime import datetime, timedelta
from bson import ObjectId

from zentreeportal_backend.models.Placement_model import (
    placement_schema,
    serialize_placement,
    PAYMENT_STATUSES,
    CANDIDATE_STATUSES,
)


# ─────────────────────────────────────────────────────────────────────────────
# Shared test data
# ─────────────────────────────────────────────────────────────────────────────
VALID_PAYLOAD = {
    "resume_id":          "RES001",
    "candidate_name":     "Alice Johnson",
    "job_id":             "JOB001",
    "client_name":        "Acme Corp",
    "job_title":          "Backend Engineer",
    "recruiter":          "Bob Smith",
    "joining_date":       "2025-06-01T00:00:00",
    "offer_date":         "2025-05-15T00:00:00",
    "final_ctc":          1200000,
    "billing_amount":     150000,
    "billing_percentage": 12.5,
    "payment_status":     "Pending",
    "candidate_status":   "Active",
    "guarantee_period":   90,
    "notes":              "Created by pytest",
}


# ═════════════════════════════════════════════════════════════════════════════
# 1.  Unit tests – placement_schema()
# ═════════════════════════════════════════════════════════════════════════════
class TestPlacementSchema:

    def test_returns_dict(self):
        doc = placement_schema(**{k: v for k, v in VALID_PAYLOAD.items()
                                  if k in placement_schema.__code__.co_varnames})
        assert isinstance(doc, dict)

    def _make(self, **overrides):
        base = dict(
            resume_id         = VALID_PAYLOAD["resume_id"],
            candidate_name    = VALID_PAYLOAD["candidate_name"],
            job_id            = VALID_PAYLOAD["job_id"],
            client_name       = VALID_PAYLOAD["client_name"],
            job_title         = VALID_PAYLOAD["job_title"],
            recruiter         = VALID_PAYLOAD["recruiter"],
            offer_date        = datetime(2025, 5, 15),
            joining_date      = datetime(2025, 6, 1),
            final_ctc         = 1200000.0,
            billing_amount    = 150000.0,
        )
        base.update(overrides)
        return placement_schema(**base)

    def test_resume_id_stored(self):
        assert self._make()["resume_id"] == "RES001"

    def test_candidate_name_stored(self):
        assert self._make()["candidate_name"] == "Alice Johnson"

    def test_joining_date_stored_as_datetime(self):
        doc = self._make()
        assert isinstance(doc["joining_date"], datetime)

    def test_joining_date_from_string(self):
        doc = self._make(joining_date="2025-06-01T00:00:00")
        assert isinstance(doc["joining_date"], datetime)

    def test_guarantee_end_date_computed(self):
        doc = self._make(joining_date=datetime(2025, 6, 1), guarantee_period=90)
        expected = datetime(2025, 6, 1) + timedelta(days=90)
        assert doc["guarantee_end_date"] == expected

    def test_default_guarantee_period_is_90(self):
        doc = self._make()
        assert doc["guarantee_period"] == 90

    def test_default_payment_status_is_pending(self):
        doc = self._make()
        assert doc["payment_status"] == "Pending"

    def test_default_candidate_status_is_active(self):
        doc = self._make()
        assert doc["candidate_status"] == "Active"

    def test_default_replacement_required_is_false(self):
        doc = self._make()
        assert doc["replacement_required"] is False

    def test_milestones_defaults_to_empty_list(self):
        doc = self._make()
        assert doc["milestones"] == []

    def test_invoice_date_defaults_to_none(self):
        doc = self._make()
        assert doc["invoice_date"] is None

    def test_payment_due_date_defaults_to_none(self):
        doc = self._make()
        assert doc["payment_due_date"] is None

    def test_payment_received_date_defaults_to_none(self):
        doc = self._make()
        assert doc["payment_received_date"] is None

    def test_created_at_is_datetime(self):
        assert isinstance(self._make()["created_at"], datetime)

    def test_updated_at_is_datetime(self):
        assert isinstance(self._make()["updated_at"], datetime)

    def test_billing_percentage_stored(self):
        doc = self._make(billing_percentage=12.5)
        assert doc["billing_percentage"] == 12.5

    def test_time_to_fill_defaults_to_zero(self):
        assert self._make()["time_to_fill"] == 0

    def test_notes_stored(self):
        doc = self._make(notes="Test note")
        assert doc["notes"] == "Test note"

    def test_account_manager_defaults_to_empty(self):
        assert self._make()["account_manager"] == ""


# ═════════════════════════════════════════════════════════════════════════════
# 2.  Unit tests – serialize_placement()
# ═════════════════════════════════════════════════════════════════════════════
class TestSerializePlacement:

    def _sample(self):
        now = datetime.utcnow()
        return {
            "_id":                   ObjectId(),
            "offer_date":            now,
            "joining_date":          now,
            "invoice_date":          now,
            "payment_due_date":      now,
            "payment_received_date": now,
            "guarantee_end_date":    now,
            "created_at":            now,
            "updated_at":            now,
        }

    def test_objectid_converted_to_string(self):
        result = serialize_placement(self._sample())
        assert isinstance(result["_id"], str)

    def test_all_datetime_fields_converted_to_iso(self):
        result = serialize_placement(self._sample())
        for field in ("offer_date", "joining_date", "invoice_date",
                      "payment_due_date", "payment_received_date",
                      "guarantee_end_date", "created_at", "updated_at"):
            assert isinstance(result[field], str), f"{field} should be ISO string"

    def test_none_datetime_fields_stay_none(self):
        doc = {"_id": "abc", "invoice_date": None, "payment_due_date": None,
               "payment_received_date": None}
        result = serialize_placement(doc)
        assert result["invoice_date"] is None
        assert result["payment_due_date"] is None

    def test_original_dict_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid}
        serialize_placement(doc)
        assert doc["_id"] == oid


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Integration tests – Placement API routes
# ═════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def created_placement(client, auth_headers):
    res = client.post("/api/placements/", json=VALID_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201, f"Setup failed: {res.get_json()}"
    data = res.get_json()["data"]
    yield data
    client.delete(f"/api/placements/{data['_id']}", headers=auth_headers)


# ── POST /api/placements/ ─────────────────────────────────────────────────────
class TestCreatePlacement:

    def test_create_valid_placement_returns_201(self, client, auth_headers, created_placement):
        assert created_placement["candidate_name"] == "Alice Johnson"

    def test_placement_id_starts_with_plc(self, client, auth_headers, created_placement):
        assert created_placement["placement_id"].startswith("PLC")

    def test_invoice_number_starts_with_inv(self, client, auth_headers, created_placement):
        assert created_placement["invoice_number"].startswith("INV-")

    def test_guarantee_end_date_present(self, client, auth_headers, created_placement):
        assert "guarantee_end_date" in created_placement
        assert created_placement["guarantee_end_date"] is not None

    def test_missing_resume_id_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "resume_id"}
        res = client.post("/api/placements/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "resume_id" in res.get_json()["message"]

    def test_missing_candidate_name_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "candidate_name"}
        res = client.post("/api/placements/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_missing_joining_date_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "joining_date"}
        res = client.post("/api/placements/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_missing_final_ctc_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "final_ctc"}
        res = client.post("/api/placements/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_missing_billing_amount_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "billing_amount"}
        res = client.post("/api/placements/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_returns_401(self, client):
        res = client.post("/api/placements/", json=VALID_PAYLOAD)
        assert res.status_code == 401


# ── GET /api/placements/ ──────────────────────────────────────────────────────
class TestGetPlacements:

    def test_list_returns_200(self, client, auth_headers):
        assert client.get("/api/placements/", headers=auth_headers).status_code == 200

    def test_list_data_is_array(self, client, auth_headers):
        body = client.get("/api/placements/", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_pagination_fields_present(self, client, auth_headers):
        body = client.get("/api/placements/?page=1&per_page=5",
                          headers=auth_headers).get_json()
        assert "total" in body and "page" in body and "per_page" in body

    def test_filter_by_client_name(self, client, auth_headers, created_placement):
        res = client.get("/api/placements/?client_name=Acme+Corp", headers=auth_headers)
        names = [d["client_name"] for d in res.get_json()["data"]]
        assert "Acme Corp" in names

    def test_filter_by_payment_status(self, client, auth_headers, created_placement):
        res = client.get("/api/placements/?payment_status=Pending", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["payment_status"] == "Pending" for d in data)

    def test_filter_by_recruiter(self, client, auth_headers, created_placement):
        res = client.get("/api/placements/?recruiter=Bob+Smith", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["recruiter"] == "Bob Smith" for d in data)

    def test_filter_by_job_id(self, client, auth_headers, created_placement):
        res = client.get("/api/placements/?job_id=JOB001", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.get_json()["data"], list)

    def test_search_by_candidate_name(self, client, auth_headers, created_placement):
        res = client.get("/api/placements/?q=Alice+Johnson", headers=auth_headers)
        names = [d["candidate_name"] for d in res.get_json()["data"]]
        assert "Alice Johnson" in names

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/placements/").status_code == 401


# ── GET /api/placements/stats ─────────────────────────────────────────────────
class TestGetStats:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/placements/stats", headers=auth_headers).status_code == 200

    def test_returns_overall(self, client, auth_headers):
        body = client.get("/api/placements/stats", headers=auth_headers).get_json()
        assert "overall" in body["data"]

    def test_returns_by_recruiter(self, client, auth_headers):
        body = client.get("/api/placements/stats", headers=auth_headers).get_json()
        assert "by_recruiter" in body["data"]
        assert isinstance(body["data"]["by_recruiter"], list)

    def test_returns_by_client(self, client, auth_headers):
        body = client.get("/api/placements/stats", headers=auth_headers).get_json()
        assert "by_client" in body["data"]
        assert isinstance(body["data"]["by_client"], list)

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/placements/stats").status_code == 401


# ── GET /api/placements/pending-from-tracking ─────────────────────────────────
class TestPendingFromTracking:

    def test_returns_200(self, client, auth_headers):
        res = client.get("/api/placements/pending-from-tracking", headers=auth_headers)
        assert res.status_code == 200

    def test_returns_list(self, client, auth_headers):
        body = client.get("/api/placements/pending-from-tracking",
                          headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/placements/pending-from-tracking").status_code == 401


# ── GET /api/placements/<id> ──────────────────────────────────────────────────
class TestGetSinglePlacement:

    def test_get_existing_returns_200(self, client, auth_headers, created_placement):
        pid = created_placement["_id"]
        res = client.get(f"/api/placements/{pid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["_id"] == pid

    def test_get_nonexistent_returns_404(self, client, auth_headers):
        res = client.get("/api/placements/000000000000000000000000",
                         headers=auth_headers)
        assert res.status_code == 404

    def test_invalid_id_returns_400(self, client, auth_headers):
        res = client.get("/api/placements/not-an-id", headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_returns_401(self, client, created_placement):
        pid = created_placement["_id"]
        assert client.get(f"/api/placements/{pid}").status_code == 401


# ── PUT /api/placements/<id> ──────────────────────────────────────────────────
class TestUpdatePlacement:

    def test_update_payment_status(self, client, auth_headers, created_placement):
        pid = created_placement["_id"]
        res = client.put(f"/api/placements/{pid}",
                         json={"payment_status": "Paid"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["payment_status"] == "Paid"

    def test_update_candidate_status(self, client, auth_headers, created_placement):
        pid = created_placement["_id"]
        res = client.put(f"/api/placements/{pid}",
                         json={"candidate_status": "Confirmed"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["candidate_status"] == "Confirmed"

    def test_update_notes(self, client, auth_headers, created_placement):
        pid = created_placement["_id"]
        res = client.put(f"/api/placements/{pid}",
                         json={"notes": "Updated by pytest"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["notes"] == "Updated by pytest"

    def test_update_guarantee_period_recalculates_end_date(self, client, auth_headers,
                                                            created_placement):
        pid = created_placement["_id"]
        res = client.put(f"/api/placements/{pid}",
                         json={"guarantee_period": 180},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["guarantee_end_date"] is not None

    def test_invalid_payment_status_returns_400(self, client, auth_headers,
                                                created_placement):
        pid = created_placement["_id"]
        res = client.put(f"/api/placements/{pid}",
                         json={"payment_status": "FakeStatus"},
                         headers=auth_headers)
        assert res.status_code == 400

    def test_invalid_candidate_status_returns_400(self, client, auth_headers,
                                                  created_placement):
        pid = created_placement["_id"]
        res = client.put(f"/api/placements/{pid}",
                         json={"candidate_status": "FakeStatus"},
                         headers=auth_headers)
        assert res.status_code == 400

    def test_update_nonexistent_returns_404(self, client, auth_headers):
        res = client.put("/api/placements/000000000000000000000000",
                         json={"notes": "X"}, headers=auth_headers)
        assert res.status_code == 404

    def test_all_payment_statuses_accepted(self, client, auth_headers, created_placement):
        pid = created_placement["_id"]
        for status in PAYMENT_STATUSES:
            res = client.put(f"/api/placements/{pid}",
                             json={"payment_status": status},
                             headers=auth_headers)
            assert res.status_code == 200, f"Payment status '{status}' should be accepted"

    def test_all_candidate_statuses_accepted(self, client, auth_headers, created_placement):
        pid = created_placement["_id"]
        for status in CANDIDATE_STATUSES:
            res = client.put(f"/api/placements/{pid}",
                             json={"candidate_status": status},
                             headers=auth_headers)
            assert res.status_code == 200, f"Candidate status '{status}' should be accepted"

    def test_unauthenticated_returns_401(self, client, created_placement):
        pid = created_placement["_id"]
        assert client.put(f"/api/placements/{pid}",
                          json={"notes": "X"}).status_code == 401


# ── DELETE /api/placements/<id> ───────────────────────────────────────────────
class TestDeletePlacement:

    def test_delete_existing_returns_200(self, client, auth_headers, created_placement):
        pid = created_placement["_id"]
        res = client.delete(f"/api/placements/{pid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["success"] is True

    def test_deleted_placement_not_found_afterwards(self, client, auth_headers,
                                                    created_placement):
        pid = created_placement["_id"]
        client.delete(f"/api/placements/{pid}", headers=auth_headers)
        assert client.get(f"/api/placements/{pid}",
                          headers=auth_headers).status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        assert client.delete("/api/placements/000000000000000000000000",
                             headers=auth_headers).status_code == 404

    def test_unauthenticated_returns_401(self, client, created_placement):
        pid = created_placement["_id"]
        assert client.delete(f"/api/placements/{pid}").status_code == 401