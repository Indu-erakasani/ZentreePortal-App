"""
Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_bench.py -v
"""
import pytest
import base64
from datetime import datetime
from bson import ObjectId

# These imports work because conftest.py adds zentreeportal_backend/ to sys.path
from zentreeportal_backend.models.Benchpeople_model import (
    bench_schema,
    serialize_bench,
    BENCH_STATUSES,
    EMPLOYMENT_TYPES,
)


# ─────────────────────────────────────────────────────────────────────────────
# Shared test data
# ─────────────────────────────────────────────────────────────────────────────
VALID_PAYLOAD = {
    "name":            "Carol White",
    "email":           "carol@example.com",
    "phone":           "9876543210",
    "current_role":    "Java Developer",
    "skills":          "Java, Spring Boot, Kubernetes",
    "experience":      6,
    "location":        "Bangalore",
    "current_salary":  900000,
    "expected_salary": 1300000,
    "notice_period":   "Immediate",
    "last_client":     "TCS",
    "last_project":    "Banking Portal",
    "status":          "Available",
    "employment_type": "Permanent",
    "notes":           "Ready to join immediately",
}

# Minimal valid PDF bytes encoded as base64
_MINIMAL_PDF_B64 = base64.b64encode(
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
    b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF"
).decode()


# ═════════════════════════════════════════════════════════════════════════════
# 1.  Unit tests – bench_schema()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestBenchSchema:

    def test_valid_bench_returns_dict(self):
        doc = bench_schema(**VALID_PAYLOAD)
        assert isinstance(doc, dict)

    def test_email_is_lowercased(self):
        doc = bench_schema(**{**VALID_PAYLOAD, "email": "CAROL@EXAMPLE.COM"})
        assert doc["email"] == "carol@example.com"

    def test_name_is_stripped(self):
        doc = bench_schema(**{**VALID_PAYLOAD, "name": "  Carol White  "})
        assert doc["name"] == "Carol White"

    def test_experience_is_float(self):
        doc = bench_schema(**VALID_PAYLOAD)
        assert isinstance(doc["experience"], float)

    def test_current_salary_is_float(self):
        doc = bench_schema(**VALID_PAYLOAD)
        assert isinstance(doc["current_salary"], float)

    def test_expected_salary_is_float(self):
        doc = bench_schema(**VALID_PAYLOAD)
        assert isinstance(doc["expected_salary"], float)

    def test_default_status_is_available(self):
        doc = bench_schema(name="A", email="a@b.com")
        assert doc["status"] == "Available"

    def test_default_employment_type_is_permanent(self):
        doc = bench_schema(name="A", email="a@b.com")
        assert doc["employment_type"] == "Permanent"

    def test_default_notice_period_is_immediate(self):
        doc = bench_schema(name="A", email="a@b.com")
        assert doc["notice_period"] == "Immediate"

    def test_default_experience_is_zero(self):
        doc = bench_schema(name="A", email="a@b.com")
        assert doc["experience"] == 0.0

    def test_availability_date_defaults_to_datetime(self):
        doc = bench_schema(name="A", email="a@b.com")
        assert isinstance(doc["availability_date"], datetime)

    def test_bench_since_defaults_to_datetime(self):
        doc = bench_schema(name="A", email="a@b.com")
        assert isinstance(doc["bench_since"], datetime)

    def test_created_at_is_datetime(self):
        doc = bench_schema(**VALID_PAYLOAD)
        assert isinstance(doc["created_at"], datetime)

    def test_updated_at_is_datetime(self):
        doc = bench_schema(**VALID_PAYLOAD)
        assert isinstance(doc["updated_at"], datetime)

    def test_resume_file_defaults_to_empty_string(self):
        doc = bench_schema(name="A", email="a@b.com")
        assert doc["resume_file"] == ""

    def test_optional_fields_default_to_empty_string(self):
        doc = bench_schema(name="A", email="a@b.com")
        for field in ("phone", "current_role", "skills", "location",
                      "last_client", "last_project", "added_by", "notes"):
            assert doc[field] == "", f"Expected empty string for {field}"

    def test_invalid_status_raises_valueerror(self):
        with pytest.raises(ValueError, match="status must be one of"):
            bench_schema(**{**VALID_PAYLOAD, "status": "FakeStatus"})

    def test_all_bench_statuses_accepted(self):
        for status in BENCH_STATUSES:
            doc = bench_schema(**{**VALID_PAYLOAD, "status": status})
            assert doc["status"] == status

    def test_all_employment_types_accepted(self):
        for emp_type in EMPLOYMENT_TYPES:
            doc = bench_schema(**{**VALID_PAYLOAD, "employment_type": emp_type})
            assert doc["employment_type"] == emp_type

    def test_custom_skills_stored_as_is(self):
        doc = bench_schema(**{**VALID_PAYLOAD, "skills": "React, TypeScript, AWS"})
        assert doc["skills"] == "React, TypeScript, AWS"

    def test_salary_zero_defaults(self):
        doc = bench_schema(name="A", email="a@b.com")
        assert doc["current_salary"]  == 0.0
        assert doc["expected_salary"] == 0.0


# ═════════════════════════════════════════════════════════════════════════════
# 2.  Unit tests – serialize_bench()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestSerializeBench:

    def test_objectid_converted_to_string(self):
        doc = {"_id": ObjectId(), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        result = serialize_bench(doc)
        assert isinstance(result["_id"], str)

    def test_datetime_fields_converted_to_iso(self):
        now = datetime.utcnow()
        doc = {
            "_id": "abc",
            "availability_date": now,
            "bench_since":       now,
            "created_at":        now,
            "updated_at":        now,
        }
        result = serialize_bench(doc)
        for field in ("availability_date", "bench_since", "created_at", "updated_at"):
            assert isinstance(result[field], str), f"{field} should be ISO string"

    def test_none_date_fields_stay_none(self):
        doc = {"_id": "abc", "availability_date": None, "bench_since": None}
        result = serialize_bench(doc)
        assert result["availability_date"] is None
        assert result["bench_since"]       is None

    def test_original_dict_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid, "name": "Carol"}
        serialize_bench(doc)
        assert doc["_id"] == oid

    def test_missing_id_defaults_to_empty_string(self):
        result = serialize_bench({})
        assert result["_id"] == ""


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Integration tests – Bench API routes
# ═════════════════════════════════════════════════════════════════════════════

# ── helper fixture: create one bench person, yield its data, then clean up ───
@pytest.fixture
def created_bench(client, auth_headers):
    res = client.post("/api/bench/", json=VALID_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201, f"Setup failed: {res.get_json()}"
    data = res.get_json()["data"]
    yield data
    client.delete(f"/api/bench/{data['_id']}", headers=auth_headers)


# ── POST /api/bench/ ─────────────────────────────────────────────────────────
class TestCreateBench:

    def test_create_valid_bench_returns_201(self, client, auth_headers, created_bench):
        assert created_bench["name"] == "Carol White"

    def test_create_returns_correct_email(self, client, auth_headers, created_bench):
        assert created_bench["email"] == "carol@example.com"

    def test_email_stored_lowercased(self, client, auth_headers, created_bench):
        assert created_bench["email"] == created_bench["email"].lower()

    def test_response_contains_bench_id(self, client, auth_headers, created_bench):
        assert "bench_id" in created_bench
        assert created_bench["bench_id"].startswith("BCH")

    def test_missing_name_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "name"}
        res = client.post("/api/bench/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "name" in res.get_json()["message"]

    def test_missing_email_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "email"}
        res = client.post("/api/bench/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "email" in res.get_json()["message"]

    def test_duplicate_email_returns_409(self, client, auth_headers, created_bench):
        res = client.post("/api/bench/", json=VALID_PAYLOAD, headers=auth_headers)
        assert res.status_code == 409
        assert "already exists" in res.get_json()["message"]

    def test_duplicate_email_different_case_returns_409(self, client, auth_headers, created_bench):
        payload = {**VALID_PAYLOAD, "email": "CAROL@EXAMPLE.COM"}
        res = client.post("/api/bench/", json=payload, headers=auth_headers)
        assert res.status_code == 409

    def test_invalid_status_returns_500(self, client, auth_headers):
        payload = {**VALID_PAYLOAD, "email": "new@example.com", "status": "FakeStatus"}
        res = client.post("/api/bench/", json=payload, headers=auth_headers)
        assert res.status_code in (400, 500)

    def test_unauthenticated_request_returns_401(self, client):
        res = client.post("/api/bench/", json=VALID_PAYLOAD)
        assert res.status_code == 401


# ── GET /api/bench/ ──────────────────────────────────────────────────────────
class TestGetBench:

    def test_list_returns_200(self, client, auth_headers):
        res = client.get("/api/bench/", headers=auth_headers)
        assert res.status_code == 200

    def test_list_data_is_array(self, client, auth_headers):
        body = client.get("/api/bench/", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_pagination_fields_present(self, client, auth_headers):
        body = client.get("/api/bench/?page=1&per_page=5", headers=auth_headers).get_json()
        assert "page" in body and "total" in body and "per_page" in body

    def test_search_by_name(self, client, auth_headers, created_bench):
        res = client.get("/api/bench/?q=Carol+White", headers=auth_headers)
        names = [d["name"] for d in res.get_json()["data"]]
        assert "Carol White" in names

    def test_search_by_skill(self, client, auth_headers, created_bench):
        res = client.get("/api/bench/?q=Java", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.get_json()["data"], list)

    def test_filter_by_status(self, client, auth_headers, created_bench):
        res = client.get("/api/bench/?status=Available", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["status"] == "Available" for d in data)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/bench/").status_code == 401


# ── GET /api/bench/<id> ──────────────────────────────────────────────────────
class TestGetSingleBench:

    def test_get_existing_bench_returns_200(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.get(f"/api/bench/{bid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["_id"] == bid

    def test_get_nonexistent_bench_returns_404(self, client, auth_headers):
        res = client.get("/api/bench/000000000000000000000000", headers=auth_headers)
        assert res.status_code == 404

    def test_invalid_id_format_returns_400(self, client, auth_headers):
        res = client.get("/api/bench/not-an-id", headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_request_returns_401(self, client, created_bench):
        bid = created_bench["_id"]
        assert client.get(f"/api/bench/{bid}").status_code == 401


# ── PUT /api/bench/<id> ──────────────────────────────────────────────────────
class TestUpdateBench:

    def test_update_name(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.put(f"/api/bench/{bid}",
                         json={"name": "Carol Updated"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["name"] == "Carol Updated"

    def test_update_status(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.put(f"/api/bench/{bid}",
                         json={"status": "In Interview"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["status"] == "In Interview"

    def test_update_invalid_status_returns_400(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.put(f"/api/bench/{bid}",
                         json={"status": "FakeStatus"},
                         headers=auth_headers)
        assert res.status_code == 400

    def test_update_skills(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.put(f"/api/bench/{bid}",
                         json={"skills": "Go, Docker, AWS"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["skills"] == "Go, Docker, AWS"

    def test_update_experience(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.put(f"/api/bench/{bid}",
                         json={"experience": 8},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["experience"] == 8.0

    def test_update_notes(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.put(f"/api/bench/{bid}",
                         json={"notes": "Updated notes"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["notes"] == "Updated notes"

    def test_update_nonexistent_bench_returns_404(self, client, auth_headers):
        res = client.put("/api/bench/000000000000000000000000",
                         json={"name": "X"}, headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_bench):
        bid = created_bench["_id"]
        assert client.put(f"/api/bench/{bid}", json={"name": "X"}).status_code == 401


# ── DELETE /api/bench/<id> ───────────────────────────────────────────────────
class TestDeleteBench:

    def test_delete_existing_bench_returns_200(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.delete(f"/api/bench/{bid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["success"] is True

    def test_deleted_bench_not_found_afterwards(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        client.delete(f"/api/bench/{bid}", headers=auth_headers)
        assert client.get(f"/api/bench/{bid}", headers=auth_headers).status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        assert client.delete("/api/bench/000000000000000000000000",
                             headers=auth_headers).status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_bench):
        bid = created_bench["_id"]
        assert client.delete(f"/api/bench/{bid}").status_code == 401


# ── GET /api/bench/meta/options ──────────────────────────────────────────────
class TestMetaOptions:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/bench/meta/options", headers=auth_headers).status_code == 200

    def test_returns_statuses_list(self, client, auth_headers):
        body = client.get("/api/bench/meta/options", headers=auth_headers).get_json()
        assert "statuses" in body and isinstance(body["statuses"], list)

    def test_returns_employment_types_list(self, client, auth_headers):
        body = client.get("/api/bench/meta/options", headers=auth_headers).get_json()
        assert "employment_types" in body and isinstance(body["employment_types"], list)

    def test_statuses_match_constants(self, client, auth_headers):
        body = client.get("/api/bench/meta/options", headers=auth_headers).get_json()
        assert set(body["statuses"]) == set(BENCH_STATUSES)

    def test_employment_types_match_constants(self, client, auth_headers):
        body = client.get("/api/bench/meta/options", headers=auth_headers).get_json()
        assert set(body["employment_types"]) == set(EMPLOYMENT_TYPES)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/bench/meta/options").status_code == 401


# ── GET /api/bench/stats ─────────────────────────────────────────────────────
class TestBenchStats:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/bench/stats", headers=auth_headers).status_code == 200

    def test_returns_by_status(self, client, auth_headers):
        body = client.get("/api/bench/stats", headers=auth_headers).get_json()
        assert "by_status" in body["data"]

    def test_by_status_is_list(self, client, auth_headers):
        body = client.get("/api/bench/stats", headers=auth_headers).get_json()
        assert isinstance(body["data"]["by_status"], list)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/bench/stats").status_code == 401


# ── GET /api/bench/by-skill/<skill_name> ─────────────────────────────────────
class TestBySkill:

    def test_by_skill_returns_200(self, client, auth_headers, created_bench):
        res = client.get("/api/bench/by-skill/Java", headers=auth_headers)
        assert res.status_code == 200

    def test_by_skill_data_is_array(self, client, auth_headers):
        body = client.get("/api/bench/by-skill/Python", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_by_skill_filters_correctly(self, client, auth_headers, created_bench):
        res = client.get("/api/bench/by-skill/Java", headers=auth_headers)
        names = [d["name"] for d in res.get_json()["data"]]
        assert "Carol White" in names

    def test_by_skill_unknown_skill_returns_empty(self, client, auth_headers):
        body = client.get("/api/bench/by-skill/NOTASKILL999",
                          headers=auth_headers).get_json()
        assert body["data"] == []

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/bench/by-skill/Java").status_code == 401


# ── GET /api/bench/talent-search ─────────────────────────────────────────────
class TestTalentSearch:

    def test_talent_search_returns_200(self, client, auth_headers):
        res = client.get("/api/bench/talent-search?q=Java", headers=auth_headers)
        assert res.status_code == 200

    def test_talent_search_empty_query_returns_empty_list(self, client, auth_headers):
        body = client.get("/api/bench/talent-search", headers=auth_headers).get_json()
        assert body["data"] == []

    def test_talent_search_finds_bench_person_by_skill(self, client, auth_headers, created_bench):
        res = client.get("/api/bench/talent-search?q=Java", headers=auth_headers)
        names = [d["name"] for d in res.get_json()["data"]]
        assert "Carol White" in names

    def test_talent_search_multi_skill_query(self, client, auth_headers, created_bench):
        res = client.get("/api/bench/talent-search?q=Java,Kubernetes", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.get_json()["data"], list)

    def test_talent_search_short_token_ignored(self, client, auth_headers):
        # Single char query — tokens < 2 chars are filtered out → empty result
        body = client.get("/api/bench/talent-search?q=a", headers=auth_headers).get_json()
        assert body["data"] == []

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/bench/talent-search?q=Java").status_code == 401


# ── POST /api/bench/<id>/upload-file ─────────────────────────────────────────
class TestUploadFile:

    def test_upload_file_returns_200(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.post(
            f"/api/bench/{bid}/upload-file",
            json={"file_b64": _MINIMAL_PDF_B64},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert "resume_file" in res.get_json()

    def test_upload_file_missing_b64_returns_400(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        res = client.post(f"/api/bench/{bid}/upload-file", json={}, headers=auth_headers)
        assert res.status_code == 400
        assert "file_b64" in res.get_json()["message"]

    def test_upload_file_nonexistent_bench_returns_404(self, client, auth_headers):
        res = client.post(
            "/api/bench/000000000000000000000000/upload-file",
            json={"file_b64": _MINIMAL_PDF_B64},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_unauthenticated_upload_returns_401(self, client, created_bench):
        bid = created_bench["_id"]
        assert client.post(f"/api/bench/{bid}/upload-file",
                           json={"file_b64": _MINIMAL_PDF_B64}).status_code == 401


# ── GET /api/bench/<id>/file ─────────────────────────────────────────────────
class TestGetFile:

    def test_get_file_no_upload_returns_404(self, client, auth_headers, created_bench):
        # Freshly created bench person has no file yet
        bid = created_bench["_id"]
        res = client.get(f"/api/bench/{bid}/file", headers=auth_headers)
        assert res.status_code == 404

    def test_get_file_after_upload_returns_200(self, client, auth_headers, created_bench):
        bid = created_bench["_id"]
        client.post(f"/api/bench/{bid}/upload-file",
                    json={"file_b64": _MINIMAL_PDF_B64},
                    headers=auth_headers)
        res = client.get(f"/api/bench/{bid}/file", headers=auth_headers)
        assert res.status_code == 200
        assert res.content_type == "application/pdf"

    def test_get_file_nonexistent_bench_returns_404(self, client, auth_headers):
        res = client.get("/api/bench/000000000000000000000000/file", headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_bench):
        bid = created_bench["_id"]
        assert client.get(f"/api/bench/{bid}/file").status_code == 401









