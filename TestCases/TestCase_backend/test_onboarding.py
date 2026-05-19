"""
Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_onboarding.py -v
"""
import pytest
from datetime import datetime
from bson import ObjectId

from zentreeportal_backend.models.Onboarding_model import (
    onboarding_schema,
    serialize_onboarding,
    checklist_item,
    document_entry,
    bank_details_schema,
    emergency_contact_schema,
    DOCUMENT_STATUSES,
    BGV_STATUSES,
    DOCUMENT_CATEGORIES,
    ONBOARDING_CHECKLIST_ITEMS,
)


# ─────────────────────────────────────────────────────────────────────────────
# Shared test data
# ─────────────────────────────────────────────────────────────────────────────
DUMMY_EMP_ID = "EMP001TEST"

VALID_DOCUMENT = {
    "name":     "Aadhar Card",
    "category": "Identity",
    "status":   "Pending",
    "remarks":  "Please upload a clear scan",
}

VALID_BANK_DETAILS = {
    "account_holder_name": "Carol White",
    "account_number":      "1234567890",
    "ifsc_code":           "hdfc0001234",
    "bank_name":           "HDFC Bank",
    "branch":              "Hyderabad",
    "account_type":        "Savings",
}

VALID_EMERGENCY_CONTACT = {
    "name":         "John White",
    "relationship": "Father",
    "phone":        "9876543210",
    "email":        "john@example.com",
    "address":      "Hyderabad",
}


# ═════════════════════════════════════════════════════════════════════════════
# 1.  Unit tests – onboarding_schema()
# ═════════════════════════════════════════════════════════════════════════════
class TestOnboardingSchema:

    def test_returns_dict(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert isinstance(doc, dict)

    def test_employee_id_stored(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert doc["employee_id"] == DUMMY_EMP_ID

    def test_joining_date_defaults_to_datetime(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert isinstance(doc["joining_date"], datetime)

    def test_probation_end_date_defaults_to_none(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert doc["probation_end_date"] is None

    def test_bgv_status_defaults_to_not_initiated(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert doc["bgv_status"] == "Not Initiated"

    def test_checklist_length_matches_constants(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert len(doc["checklist"]) == len(ONBOARDING_CHECKLIST_ITEMS)

    def test_checklist_items_default_to_not_done(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert all(item["done"] is False for item in doc["checklist"])

    def test_documents_defaults_to_empty_list(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert doc["documents"] == []

    def test_bank_details_is_dict(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert isinstance(doc["bank_details"], dict)

    def test_emergency_contact_is_dict(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert isinstance(doc["emergency_contact"], dict)

    def test_created_at_is_datetime(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert isinstance(doc["created_at"], datetime)

    def test_updated_at_is_datetime(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        assert isinstance(doc["updated_at"], datetime)

    def test_optional_string_fields_default_to_empty(self):
        doc = onboarding_schema(DUMMY_EMP_ID)
        for field in ("blood_group", "personal_email", "referred_by",
                      "bgv_agency", "bgv_remarks", "laptop_serial",
                      "laptop_make_model", "access_card_number",
                      "email_id_created", "hr_notes", "it_notes"):
            assert doc[field] == "", f"Expected empty string for {field}"

    def test_custom_joining_date_accepted(self):
        custom_date = datetime(2025, 1, 15)
        doc = onboarding_schema(DUMMY_EMP_ID, joining_date=custom_date)
        assert doc["joining_date"] == custom_date


# ═════════════════════════════════════════════════════════════════════════════
# 2.  Unit tests – checklist_item()
# ═════════════════════════════════════════════════════════════════════════════
class TestChecklistItem:

    def test_returns_dict(self):
        item = checklist_item("Offer Letter Signed")
        assert isinstance(item, dict)

    def test_label_stored(self):
        item = checklist_item("Offer Letter Signed")
        assert item["label"] == "Offer Letter Signed"

    def test_done_defaults_to_false(self):
        item = checklist_item("Offer Letter Signed")
        assert item["done"] is False

    def test_done_can_be_set_true(self):
        item = checklist_item("Offer Letter Signed", done=True)
        assert item["done"] is True

    def test_remarks_defaults_to_empty(self):
        item = checklist_item("Offer Letter Signed")
        assert item["remarks"] == ""

    def test_updated_at_is_datetime(self):
        item = checklist_item("Offer Letter Signed")
        assert isinstance(item["updated_at"], datetime)


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Unit tests – document_entry()
# ═════════════════════════════════════════════════════════════════════════════
class TestDocumentEntry:

    def test_returns_dict(self):
        entry = document_entry("Aadhar Card", "Identity")
        assert isinstance(entry, dict)

    def test_name_stored(self):
        entry = document_entry("Aadhar Card", "Identity")
        assert entry["name"] == "Aadhar Card"

    def test_category_stored(self):
        entry = document_entry("Aadhar Card", "Identity")
        assert entry["category"] == "Identity"

    def test_status_defaults_to_pending(self):
        entry = document_entry("Aadhar Card", "Identity")
        assert entry["status"] == "Pending"

    def test_custom_status_accepted(self):
        entry = document_entry("Aadhar Card", "Identity", status="Received")
        assert entry["status"] == "Received"

    def test_file_name_defaults_to_none(self):
        entry = document_entry("Aadhar Card", "Identity")
        assert entry["file_name"] is None

    def test_file_path_defaults_to_none(self):
        entry = document_entry("Aadhar Card", "Identity")
        assert entry["file_path"] is None

    def test_updated_at_is_datetime(self):
        entry = document_entry("Aadhar Card", "Identity")
        assert isinstance(entry["updated_at"], datetime)


# ═════════════════════════════════════════════════════════════════════════════
# 4.  Unit tests – bank_details_schema()
# ═════════════════════════════════════════════════════════════════════════════
class TestBankDetailsSchema:

    def test_returns_dict(self):
        assert isinstance(bank_details_schema(), dict)

    def test_ifsc_code_uppercased(self):
        result = bank_details_schema(ifsc_code="hdfc0001234")
        assert result["ifsc_code"] == "HDFC0001234"

    def test_ifsc_code_stripped(self):
        result = bank_details_schema(ifsc_code="  HDFC0001234  ")
        assert result["ifsc_code"] == "HDFC0001234"

    def test_account_type_defaults_to_savings(self):
        result = bank_details_schema()
        assert result["account_type"] == "Savings"

    def test_empty_ifsc_stays_empty(self):
        result = bank_details_schema(ifsc_code="")
        assert result["ifsc_code"] == ""

    def test_all_fields_stored(self):
        result = bank_details_schema(**VALID_BANK_DETAILS)
        assert result["account_holder_name"] == "Carol White"
        assert result["bank_name"] == "HDFC Bank"


# ═════════════════════════════════════════════════════════════════════════════
# 5.  Unit tests – emergency_contact_schema()
# ═════════════════════════════════════════════════════════════════════════════
class TestEmergencyContactSchema:

    def test_returns_dict(self):
        assert isinstance(emergency_contact_schema(), dict)

    def test_all_fields_default_to_empty(self):
        result = emergency_contact_schema()
        for field in ("name", "relationship", "phone", "email", "address"):
            assert result[field] == "", f"Expected empty string for {field}"

    def test_custom_values_stored(self):
        result = emergency_contact_schema(**VALID_EMERGENCY_CONTACT)
        assert result["name"] == "John White"
        assert result["relationship"] == "Father"


# ═════════════════════════════════════════════════════════════════════════════
# 6.  Unit tests – serialize_onboarding()
# ═════════════════════════════════════════════════════════════════════════════
class TestSerializeOnboarding:

    def test_objectid_converted_to_string(self):
        doc = {"_id": ObjectId(), "checklist": [], "documents": []}
        result = serialize_onboarding(doc)
        assert isinstance(result["_id"], str)

    def test_datetime_fields_converted_to_iso(self):
        now = datetime.utcnow()
        doc = {
            "_id":        "abc",
            "joining_date":       now,
            "probation_end_date": now,
            "created_at":         now,
            "updated_at":         now,
            "checklist":          [],
            "documents":          [],
        }
        result = serialize_onboarding(doc)
        for field in ("joining_date", "probation_end_date", "created_at", "updated_at"):
            assert isinstance(result[field], str), f"{field} should be ISO string"

    def test_none_probation_date_stays_none(self):
        doc = {"_id": "abc", "probation_end_date": None, "checklist": [], "documents": []}
        result = serialize_onboarding(doc)
        assert result["probation_end_date"] is None

    def test_file_path_not_exposed_in_documents(self):
        doc = {
            "_id": "abc",
            "checklist": [],
            "documents": [{"name": "Aadhar", "file_path": "/server/path/file.pdf",
                           "updated_at": datetime.utcnow()}],
        }
        result = serialize_onboarding(doc)
        assert "file_path" not in result["documents"][0]

    def test_checklist_updated_at_converted_to_iso(self):
        doc = {
            "_id": "abc",
            "checklist": [{"label": "NDA Signed", "done": False,
                           "updated_at": datetime.utcnow()}],
            "documents": [],
        }
        result = serialize_onboarding(doc)
        assert isinstance(result["checklist"][0]["updated_at"], str)

    def test_empty_doc_returns_empty_dict(self):
        assert serialize_onboarding({}) == {}

    def test_original_dict_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid, "checklist": [], "documents": []}
        serialize_onboarding(doc)
        assert doc["_id"] == oid


# ═════════════════════════════════════════════════════════════════════════════
# 7.  Integration tests – Onboarding API routes
# ═════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def onboarding_record(client, auth_headers):
    """Ensure an onboarding record exists for DUMMY_EMP_ID."""
    res = client.get(f"/api/onboarding/{DUMMY_EMP_ID}", headers=auth_headers)
    assert res.status_code == 200
    yield res.get_json()["data"]


@pytest.fixture
def with_document(client, auth_headers, onboarding_record):
    """Add a document and return its index (always 0 for fresh record)."""
    res = client.post(
        f"/api/onboarding/{DUMMY_EMP_ID}/document",
        json=VALID_DOCUMENT,
        headers=auth_headers,
    )
    assert res.status_code == 200
    docs = res.get_json()["data"]["documents"]
    yield len(docs) - 1  # index of the newly added document


# ── GET /api/onboarding/meta ─────────────────────────────────────────────────
class TestOnboardingMeta:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/onboarding/meta", headers=auth_headers).status_code == 200

    def test_returns_document_categories(self, client, auth_headers):
        body = client.get("/api/onboarding/meta", headers=auth_headers).get_json()
        assert "document_categories" in body
        assert isinstance(body["document_categories"], dict)

    def test_returns_document_statuses(self, client, auth_headers):
        body = client.get("/api/onboarding/meta", headers=auth_headers).get_json()
        assert "document_statuses" in body
        assert isinstance(body["document_statuses"], list)

    def test_returns_bgv_statuses(self, client, auth_headers):
        body = client.get("/api/onboarding/meta", headers=auth_headers).get_json()
        assert "bgv_statuses" in body
        assert isinstance(body["bgv_statuses"], list)

    def test_returns_checklist_items(self, client, auth_headers):
        body = client.get("/api/onboarding/meta", headers=auth_headers).get_json()
        assert "checklist_items" in body
        assert isinstance(body["checklist_items"], list)

    def test_bgv_statuses_match_constants(self, client, auth_headers):
        body = client.get("/api/onboarding/meta", headers=auth_headers).get_json()
        assert set(body["bgv_statuses"]) == set(BGV_STATUSES)

    def test_document_statuses_match_constants(self, client, auth_headers):
        body = client.get("/api/onboarding/meta", headers=auth_headers).get_json()
        assert set(body["document_statuses"]) == set(DOCUMENT_STATUSES)

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/onboarding/meta").status_code == 401


# ── GET /api/onboarding/<employee_id> ────────────────────────────────────────
class TestGetOnboarding:

    def test_get_creates_record_if_not_exists(self, client, auth_headers):
        res = client.get(f"/api/onboarding/{DUMMY_EMP_ID}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["employee_id"] == DUMMY_EMP_ID

    def test_get_returns_checklist(self, client, auth_headers):
        body = client.get(f"/api/onboarding/{DUMMY_EMP_ID}", headers=auth_headers).get_json()
        assert isinstance(body["data"]["checklist"], list)
        assert len(body["data"]["checklist"]) == len(ONBOARDING_CHECKLIST_ITEMS)

    def test_get_returns_documents_list(self, client, auth_headers):
        body = client.get(f"/api/onboarding/{DUMMY_EMP_ID}", headers=auth_headers).get_json()
        assert isinstance(body["data"]["documents"], list)

    def test_file_path_not_in_response(self, client, auth_headers, with_document):
        body = client.get(f"/api/onboarding/{DUMMY_EMP_ID}", headers=auth_headers).get_json()
        for doc in body["data"]["documents"]:
            assert "file_path" not in doc

    def test_unauthenticated_returns_401(self, client):
        assert client.get(f"/api/onboarding/{DUMMY_EMP_ID}").status_code == 401


# ── PUT /api/onboarding/<employee_id> ────────────────────────────────────────
class TestUpdateOnboarding:

    def test_update_blood_group(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"blood_group": "O+"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["blood_group"] == "O+"

    def test_update_bgv_status(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"bgv_status": "Initiated"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["bgv_status"] == "Initiated"

    def test_update_bank_details(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"bank_details": VALID_BANK_DETAILS},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["bank_details"]["bank_name"] == "HDFC Bank"

    def test_update_emergency_contact(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"emergency_contact": VALID_EMERGENCY_CONTACT},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["emergency_contact"]["name"] == "John White"

    def test_update_laptop_serial(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"laptop_serial": "SN123456"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["laptop_serial"] == "SN123456"

    def test_update_hr_notes(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"hr_notes": "All docs verified"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["hr_notes"] == "All docs verified"

    def test_update_probation_end_date(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"probation_end_date": "2025-06-30T00:00:00"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert "2025-06-30" in res.get_json()["data"]["probation_end_date"]

    def test_unknown_fields_ignored(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"unknown_field": "should be ignored"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert "unknown_field" not in res.get_json()["data"]

    def test_unauthenticated_returns_401(self, client):
        assert client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}",
            json={"blood_group": "A+"},
        ).status_code == 401


# ── PUT /api/onboarding/<employee_id>/checklist/<idx> ────────────────────────
class TestUpdateChecklistItem:

    def test_mark_item_done(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}/checklist/0",
            json={"done": True, "remarks": "Signed and submitted"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["checklist"][0]["done"] is True

    def test_mark_item_with_remarks(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}/checklist/0",
            json={"done": True, "remarks": "Done on day 1"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["checklist"][0]["remarks"] == "Done on day 1"

    def test_out_of_range_index_returns_400(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}/checklist/9999",
            json={"done": True},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_nonexistent_employee_returns_404(self, client, auth_headers):
        res = client.put(
            "/api/onboarding/EMPNOTEXIST/checklist/0",
            json={"done": True},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client):
        assert client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}/checklist/0",
            json={"done": True},
        ).status_code == 401


# ── POST /api/onboarding/<employee_id>/document ──────────────────────────────
class TestAddDocument:

    def test_add_valid_document_returns_200(self, client, auth_headers, onboarding_record):
        res = client.post(
            f"/api/onboarding/{DUMMY_EMP_ID}/document",
            json=VALID_DOCUMENT,
            headers=auth_headers,
        )
        assert res.status_code == 200
        names = [d["name"] for d in res.get_json()["data"]["documents"]]
        assert "Aadhar Card" in names

    def test_missing_name_returns_400(self, client, auth_headers, onboarding_record):
        res = client.post(
            f"/api/onboarding/{DUMMY_EMP_ID}/document",
            json={"category": "Identity"},
            headers=auth_headers,
        )
        assert res.status_code == 400
        assert "name" in res.get_json()["message"]

    def test_document_category_stored(self, client, auth_headers, onboarding_record):
        res = client.post(
            f"/api/onboarding/{DUMMY_EMP_ID}/document",
            json=VALID_DOCUMENT,
            headers=auth_headers,
        )
        docs = res.get_json()["data"]["documents"]
        added = next((d for d in docs if d["name"] == "Aadhar Card"), None)
        assert added is not None
        assert added["category"] == "Identity"

    def test_document_status_defaults_to_pending(self, client, auth_headers, onboarding_record):
        res = client.post(
            f"/api/onboarding/{DUMMY_EMP_ID}/document",
            json={"name": "PAN Card", "category": "Identity"},
            headers=auth_headers,
        )
        docs = res.get_json()["data"]["documents"]
        added = next((d for d in docs if d["name"] == "PAN Card"), None)
        assert added["status"] == "Pending"

    def test_unauthenticated_returns_401(self, client):
        assert client.post(
            f"/api/onboarding/{DUMMY_EMP_ID}/document",
            json=VALID_DOCUMENT,
        ).status_code == 401


# ── PUT /api/onboarding/<employee_id>/document/<idx> ─────────────────────────
class TestUpdateDocument:

    def test_update_document_status(self, client, auth_headers, with_document):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}/document/{with_document}",
            json={"status": "Received"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        doc = res.get_json()["data"]["documents"][with_document]
        assert doc["status"] == "Received"

    def test_update_document_remarks(self, client, auth_headers, with_document):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}/document/{with_document}",
            json={"remarks": "Original copy received"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        doc = res.get_json()["data"]["documents"][with_document]
        assert doc["remarks"] == "Original copy received"

    def test_out_of_range_index_returns_400(self, client, auth_headers, onboarding_record):
        res = client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}/document/9999",
            json={"status": "Received"},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_nonexistent_employee_returns_404(self, client, auth_headers):
        res = client.put(
            "/api/onboarding/EMPNOTEXIST/document/0",
            json={"status": "Received"},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client, with_document):
        assert client.put(
            f"/api/onboarding/{DUMMY_EMP_ID}/document/{with_document}",
            json={"status": "Received"},
        ).status_code == 401


# ── DELETE /api/onboarding/<employee_id>/document/<idx> ──────────────────────

class TestDeleteDocument:

    def test_delete_document_returns_200(self, client, auth_headers, with_document):
        res = client.delete(
            f"/api/onboarding/{DUMMY_EMP_ID}/document/{with_document}",
            headers=auth_headers,
        )
        assert res.status_code == 200

    def test_deleted_document_not_in_list(self, client, auth_headers, with_document):
        # Snapshot the list BEFORE delete so we know exactly which index was ours
        before = client.get(
            f"/api/onboarding/{DUMMY_EMP_ID}", headers=auth_headers
        ).get_json()["data"]["documents"]
        total_before = len(before)

        client.delete(
            f"/api/onboarding/{DUMMY_EMP_ID}/document/{with_document}",
            headers=auth_headers,
        )

        after = client.get(
            f"/api/onboarding/{DUMMY_EMP_ID}", headers=auth_headers
        ).get_json()["data"]["documents"]

        # One document was removed
        assert len(after) == total_before - 1
        # The specific index no longer points to the same document
        if with_document < len(after):
            assert after[with_document]["name"] != before[with_document]["name"]

    def test_out_of_range_index_returns_400(self, client, auth_headers, onboarding_record):
        assert client.delete(
            f"/api/onboarding/{DUMMY_EMP_ID}/document/9999",
            headers=auth_headers,
        ).status_code == 400

    def test_nonexistent_employee_returns_404(self, client, auth_headers):
        assert client.delete(
            "/api/onboarding/EMPNOTEXIST/document/0",
            headers=auth_headers,
        ).status_code == 404

    def test_unauthenticated_returns_401(self, client, with_document):
        assert client.delete(
            f"/api/onboarding/{DUMMY_EMP_ID}/document/{with_document}",
        ).status_code == 401