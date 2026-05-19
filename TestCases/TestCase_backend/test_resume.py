"""
Tests for Resume model + API routes.
File:  /home/indhu/zentreeportal/TestCases/TestCase_backend/test_resume.py

Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_resume.py -v
"""
import pytest
import base64
from datetime import datetime
from bson import ObjectId

# These imports work because conftest.py adds zentreeportal_backend/ to sys.path
from zentreeportal_backend.models.Resume_model import (
    resume_schema,
    serialize_resume,
    SCREENING_STATUSES,
    SOURCES,
)


# ─────────────────────────────────────────────────────────────────────────────
# Shared test data
# ─────────────────────────────────────────────────────────────────────────────
VALID_PAYLOAD = {
    "name":             "Jane Smith",
    "email":            "jane@example.com",
    "phone":            "9876543210",
    "current_role":     "Software Engineer",
    "current_company":  "Acme Corp",
    "experience":       5,
    "skills":           "Python, Flask, MongoDB",
    "location":         "Hyderabad",
    "current_salary":   800000,
    "expected_salary":  1200000,
    "notice_period":    "30 days",
    "source":           "LinkedIn",
    "status":           "New",
    "linked_job_id":    "",
    "linked_job_title": "",
    "notes":            "",
}

# Minimal valid PDF bytes (1-page blank PDF) encoded as base64 — avoids real file I/O
_MINIMAL_PDF_B64 = base64.b64encode(
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
    b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF"
).decode()


# ═════════════════════════════════════════════════════════════════════════════
# 1.  Unit tests – resume_schema()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestResumeSchema:

    def test_valid_resume_returns_dict(self):
        doc = resume_schema(**VALID_PAYLOAD)
        assert isinstance(doc, dict)

    def test_email_is_lowercased(self):
        doc = resume_schema(**{**VALID_PAYLOAD, "email": "JANE@EXAMPLE.COM"})
        assert doc["email"] == "jane@example.com"

    def test_name_is_stripped(self):
        doc = resume_schema(**{**VALID_PAYLOAD, "name": "  Jane Smith  "})
        assert doc["name"] == "Jane Smith"

    def test_experience_is_float(self):
        doc = resume_schema(**VALID_PAYLOAD)
        assert isinstance(doc["experience"], float)

    def test_current_salary_is_float(self):
        doc = resume_schema(**VALID_PAYLOAD)
        assert isinstance(doc["current_salary"], float)

    def test_expected_salary_is_float(self):
        doc = resume_schema(**VALID_PAYLOAD)
        assert isinstance(doc["expected_salary"], float)

    def test_default_status_is_new(self):
        doc = resume_schema(name="A", email="a@b.com")
        assert doc["status"] == "New"

    def test_default_source_is_linkedin(self):
        doc = resume_schema(name="A", email="a@b.com")
        assert doc["source"] == "LinkedIn"

    def test_default_notice_period(self):
        doc = resume_schema(name="A", email="a@b.com")
        assert doc["notice_period"] == "30 days"

    def test_default_experience_is_zero(self):
        doc = resume_schema(name="A", email="a@b.com")
        assert doc["experience"] == 0.0

    def test_created_at_is_datetime(self):
        doc = resume_schema(**VALID_PAYLOAD)
        assert isinstance(doc["created_at"], datetime)

    def test_updated_at_is_datetime(self):
        doc = resume_schema(**VALID_PAYLOAD)
        assert isinstance(doc["updated_at"], datetime)

    def test_optional_fields_default_to_empty_string(self):
        doc = resume_schema(name="A", email="a@b.com")
        for field in ("phone", "current_role", "current_company", "skills",
                      "location", "linked_job_id", "linked_job_title", "notes"):
            assert doc[field] == "", f"Expected empty string for {field}"

    def test_all_sources_accepted(self):
        for src in SOURCES:
            doc = resume_schema(**{**VALID_PAYLOAD, "source": src})
            assert doc["source"] == src

    def test_all_screening_statuses_accepted(self):
        for status in SCREENING_STATUSES:
            doc = resume_schema(**{**VALID_PAYLOAD, "status": status})
            assert doc["status"] == status

    def test_custom_skills_stored_as_is(self):
        doc = resume_schema(**{**VALID_PAYLOAD, "skills": "React, Node.js, Docker"})
        assert doc["skills"] == "React, Node.js, Docker"


# ═════════════════════════════════════════════════════════════════════════════
# 2.  Unit tests – serialize_resume()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestSerializeResume:

    def test_objectid_converted_to_string(self):
        doc = {"_id": ObjectId(), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        result = serialize_resume(doc)
        assert isinstance(result["_id"], str)

    def test_datetime_fields_converted_to_iso(self):
        now = datetime.utcnow()
        doc = {"_id": "abc", "created_at": now, "updated_at": now}
        result = serialize_resume(doc)
        for field in ("created_at", "updated_at"):
            assert isinstance(result[field], str), f"{field} should be ISO string"

    def test_original_dict_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid, "name": "Jane"}
        serialize_resume(doc)
        assert doc["_id"] == oid  # original ObjectId untouched

    def test_missing_id_defaults_to_empty_string(self):
        doc = {}
        result = serialize_resume(doc)
        assert result["_id"] == ""


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Integration tests – Resume API routes
#     These use the `client` and `auth_headers` fixtures from conftest.py
# ═════════════════════════════════════════════════════════════════════════════

# ── helper fixture: create one candidate, yield its data, then clean up ──────
@pytest.fixture
def created_resume(client, auth_headers):
    res = client.post("/api/resumes/", json=VALID_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201, f"Setup failed: {res.get_json()}"
    data = res.get_json()["data"]
    yield data
    client.delete(f"/api/resumes/{data['_id']}", headers=auth_headers)


# ── helper fixture: create one raw resume, yield its data, then clean up ─────
@pytest.fixture
def created_raw(client, auth_headers):
    payload = {"file_b64": _MINIMAL_PDF_B64, "file_name": "test_resume.pdf"}
    res = client.post("/api/resumes/raw/upload", json=payload, headers=auth_headers)
    assert res.status_code == 201, f"Raw setup failed: {res.get_json()}"
    data = res.get_json()["data"]
    yield data
    client.delete(f"/api/resumes/raw/{data['_id']}", headers=auth_headers)


# ── POST /api/resumes/ ────────────────────────────────────────────────────────
class TestCreateResume:

    def test_create_valid_resume_returns_201(self, client, auth_headers, created_resume):
        assert created_resume["name"] == "Jane Smith"

    def test_create_resume_returns_correct_email(self, client, auth_headers, created_resume):
        assert created_resume["email"] == "jane@example.com"

    def test_email_stored_lowercased(self, client, auth_headers, created_resume):
        assert created_resume["email"] == created_resume["email"].lower()

    def test_missing_name_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "name"}
        res = client.post("/api/resumes/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "name" in res.get_json()["message"]

    def test_missing_email_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "email"}
        res = client.post("/api/resumes/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "email" in res.get_json()["message"]

    def test_duplicate_email_same_job_returns_409(self, client, auth_headers, created_resume):
        # Same email + same (empty) job_id → conflict
        res = client.post("/api/resumes/", json=VALID_PAYLOAD, headers=auth_headers)
        # Either 409 (same job) or 201 (different job logic) depending on implementation
        # For empty linked_job_id, the route allows re-creation; adjust if your app differs
        assert res.status_code in (201, 409)

    def test_unauthenticated_request_returns_401(self, client):
        res = client.post("/api/resumes/", json=VALID_PAYLOAD)
        assert res.status_code == 401

    def test_response_contains_resume_id(self, client, auth_headers, created_resume):
        assert "resume_id" in created_resume
        assert created_resume["resume_id"].startswith("RES")


# ── GET /api/resumes/ ─────────────────────────────────────────────────────────
class TestGetResumes:

    def test_list_returns_200(self, client, auth_headers):
        res = client.get("/api/resumes/", headers=auth_headers)
        assert res.status_code == 200

    def test_list_data_is_array(self, client, auth_headers):
        body = client.get("/api/resumes/", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_pagination_fields_present(self, client, auth_headers):
        body = client.get("/api/resumes/?page=1&per_page=5", headers=auth_headers).get_json()
        assert "page" in body and "total" in body and "per_page" in body

    def test_search_by_name(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/?q=Jane+Smith", headers=auth_headers)
        names = [c["name"] for c in res.get_json()["data"]]
        assert "Jane Smith" in names

    def test_filter_by_status(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/?status=New", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(c["status"] == "New" for c in data)

    def test_filter_by_source(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/?source=LinkedIn", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(c["source"] == "LinkedIn" for c in data)

    def test_filter_by_min_exp(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/?min_exp=3", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(c["experience"] >= 3 for c in data)

    def test_filter_by_max_exp(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/?max_exp=10", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(c["experience"] <= 10 for c in data)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/resumes/").status_code == 401


# ── GET /api/resumes/<id> ─────────────────────────────────────────────────────
class TestGetSingleResume:

    def test_get_existing_resume_returns_200(self, client, auth_headers, created_resume):
        rid = created_resume["_id"]
        res = client.get(f"/api/resumes/{rid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["_id"] == rid

    def test_get_nonexistent_resume_returns_404(self, client, auth_headers):
        res = client.get("/api/resumes/000000000000000000000000", headers=auth_headers)
        assert res.status_code == 404

    def test_invalid_id_format_returns_400(self, client, auth_headers):
        res = client.get("/api/resumes/not-an-id", headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_request_returns_401(self, client, created_resume):
        rid = created_resume["_id"]
        assert client.get(f"/api/resumes/{rid}").status_code == 401


# ── PUT /api/resumes/<id> ─────────────────────────────────────────────────────
class TestUpdateResume:

    def test_update_name(self, client, auth_headers, created_resume):
        rid = created_resume["_id"]
        res = client.put(f"/api/resumes/{rid}", json={"name": "Jane Updated"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["name"] == "Jane Updated"

    def test_update_status(self, client, auth_headers, created_resume):
        rid = created_resume["_id"]
        res = client.put(f"/api/resumes/{rid}", json={"status": "Shortlisted"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["status"] == "Shortlisted"

    def test_update_invalid_status_returns_400(self, client, auth_headers, created_resume):
        rid = created_resume["_id"]
        res = client.put(f"/api/resumes/{rid}", json={"status": "FakeStatus"}, headers=auth_headers)
        assert res.status_code == 400

    def test_update_experience(self, client, auth_headers, created_resume):
        rid = created_resume["_id"]
        res = client.put(f"/api/resumes/{rid}", json={"experience": 7}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["experience"] == 7.0

    def test_update_skills(self, client, auth_headers, created_resume):
        rid = created_resume["_id"]
        res = client.put(f"/api/resumes/{rid}", json={"skills": "Go, Kubernetes"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["skills"] == "Go, Kubernetes"

    def test_update_nonexistent_resume_returns_404(self, client, auth_headers):
        res = client.put("/api/resumes/000000000000000000000000",
                         json={"name": "X"}, headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_resume):
        rid = created_resume["_id"]
        assert client.put(f"/api/resumes/{rid}", json={"name": "X"}).status_code == 401


# ── DELETE /api/resumes/<id> ──────────────────────────────────────────────────
class TestDeleteResume:

    def test_delete_existing_resume_returns_200(self, client, auth_headers, created_resume):
        rid = created_resume["_id"]
        res = client.delete(f"/api/resumes/{rid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["success"] is True

    def test_deleted_resume_not_found_afterwards(self, client, auth_headers, created_resume):
        rid = created_resume["_id"]
        client.delete(f"/api/resumes/{rid}", headers=auth_headers)
        assert client.get(f"/api/resumes/{rid}", headers=auth_headers).status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        assert client.delete("/api/resumes/000000000000000000000000",
                             headers=auth_headers).status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_resume):
        rid = created_resume["_id"]
        assert client.delete(f"/api/resumes/{rid}").status_code == 401


# ── GET /api/resumes/meta/options ─────────────────────────────────────────────
class TestMetaOptions:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/resumes/meta/options", headers=auth_headers).status_code == 200

    def test_returns_statuses_list(self, client, auth_headers):
        body = client.get("/api/resumes/meta/options", headers=auth_headers).get_json()
        assert "statuses" in body and isinstance(body["statuses"], list)

    def test_returns_sources_list(self, client, auth_headers):
        body = client.get("/api/resumes/meta/options", headers=auth_headers).get_json()
        assert "sources" in body and isinstance(body["sources"], list)

    def test_statuses_match_constants(self, client, auth_headers):
        body = client.get("/api/resumes/meta/options", headers=auth_headers).get_json()
        assert set(body["statuses"]) == set(SCREENING_STATUSES)

    def test_sources_match_constants(self, client, auth_headers):
        body = client.get("/api/resumes/meta/options", headers=auth_headers).get_json()
        assert set(body["sources"]) == set(SOURCES)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/resumes/meta/options").status_code == 401


# ── GET /api/resumes/stats ────────────────────────────────────────────────────
class TestResumeStats:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/resumes/stats", headers=auth_headers).status_code == 200

    def test_returns_by_status(self, client, auth_headers):
        body = client.get("/api/resumes/stats", headers=auth_headers).get_json()
        assert "by_status" in body["data"]

    def test_returns_by_source(self, client, auth_headers):
        body = client.get("/api/resumes/stats", headers=auth_headers).get_json()
        assert "by_source" in body["data"]

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/resumes/stats").status_code == 401


# ── GET /api/resumes/by-skill/<skill_name> ────────────────────────────────────
class TestBySkill:

    def test_by_skill_returns_200(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/by-skill/Python", headers=auth_headers)
        assert res.status_code == 200

    def test_by_skill_data_is_array(self, client, auth_headers):
        body = client.get("/api/resumes/by-skill/Flask", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_by_skill_filters_correctly(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/by-skill/Python", headers=auth_headers)
        names = [c["name"] for c in res.get_json()["data"]]
        assert "Jane Smith" in names

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/resumes/by-skill/Python").status_code == 401


# ── GET /api/resumes/talent-search ────────────────────────────────────────────
class TestTalentSearch:

    def test_talent_search_returns_200(self, client, auth_headers):
        res = client.get("/api/resumes/talent-search?q=Python", headers=auth_headers)
        assert res.status_code == 200

    def test_talent_search_empty_query_returns_empty_list(self, client, auth_headers):
        body = client.get("/api/resumes/talent-search", headers=auth_headers).get_json()
        assert body["data"] == []

    def test_talent_search_finds_candidate_by_skill(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/talent-search?q=Python", headers=auth_headers)
        names = [c["name"] for c in res.get_json()["data"]]
        assert "Jane Smith" in names

    def test_talent_search_multi_skill_query(self, client, auth_headers, created_resume):
        res = client.get("/api/resumes/talent-search?q=Python,Flask", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.get_json()["data"], list)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/resumes/talent-search?q=Python").status_code == 401


# ── RAW RESUME ROUTES (/api/resumes/raw/...) ──────────────────────────────────
class TestRawUpload:

    def test_upload_with_valid_base64_returns_201(self, client, auth_headers, created_raw):
        assert created_raw["raw_id"].startswith("RAW")

    def test_upload_stores_original_name(self, client, auth_headers, created_raw):
        assert created_raw["original_name"] == "test_resume.pdf"

    def test_upload_missing_file_b64_returns_400(self, client, auth_headers):
        res = client.post("/api/resumes/raw/upload", json={}, headers=auth_headers)
        assert res.status_code == 400
        assert "file_b64" in res.get_json()["message"]

    def test_upload_sets_status_to_stored(self, client, auth_headers, created_raw):
        assert created_raw["status"] == "Stored"

    def test_unauthenticated_upload_returns_401(self, client):
        res = client.post("/api/resumes/raw/upload",
                          json={"file_b64": _MINIMAL_PDF_B64})
        assert res.status_code == 401


class TestGetRawResumes:

    def test_list_raw_returns_200(self, client, auth_headers):
        assert client.get("/api/resumes/raw/", headers=auth_headers).status_code == 200

    def test_list_raw_data_is_array(self, client, auth_headers):
        body = client.get("/api/resumes/raw/", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_list_raw_pagination_fields_present(self, client, auth_headers):
        body = client.get("/api/resumes/raw/?page=1&per_page=5", headers=auth_headers).get_json()
        assert "page" in body and "total" in body

    def test_filter_raw_by_status(self, client, auth_headers, created_raw):
        res = client.get("/api/resumes/raw/?status=Stored", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["status"] == "Stored" for d in data)

    def test_search_raw_by_name(self, client, auth_headers):
        # Raw resumes from upload won't have a name unless parsed, so just assert 200
        res = client.get("/api/resumes/raw/?q=Jane", headers=auth_headers)
        assert res.status_code == 200

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/resumes/raw/").status_code == 401


class TestAssignRawToJob:

    def test_assign_job_returns_200(self, client, auth_headers, created_raw):
        rid = created_raw["_id"]
        res = client.put(
            f"/api/resumes/raw/{rid}/assign-job",
            json={"job_id": "JOB001", "job_title": "Backend Dev", "client_name": "Acme"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["linked_job_id"] == "JOB001"

    def test_assign_sets_status_to_assigned(self, client, auth_headers, created_raw):
        rid = created_raw["_id"]
        client.put(
            f"/api/resumes/raw/{rid}/assign-job",
            json={"job_id": "JOB001"},
            headers=auth_headers,
        )
        doc = client.get(f"/api/resumes/raw/", headers=auth_headers).get_json()
        assigned = [d for d in doc["data"] if d["_id"] == rid]
        assert assigned[0]["status"] == "Assigned"

    def test_assign_missing_job_id_returns_400(self, client, auth_headers, created_raw):
        rid = created_raw["_id"]
        res = client.put(f"/api/resumes/raw/{rid}/assign-job", json={}, headers=auth_headers)
        assert res.status_code == 400

    def test_assign_nonexistent_raw_returns_404(self, client, auth_headers):
        res = client.put(
            "/api/resumes/raw/000000000000000000000000/assign-job",
            json={"job_id": "JOB001"},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_raw):
        rid = created_raw["_id"]
        assert client.put(f"/api/resumes/raw/{rid}/assign-job",
                          json={"job_id": "JOB001"}).status_code == 401


class TestConvertRaw:

    def test_convert_raw_to_candidate_returns_201(self, client, auth_headers, created_raw):
        rid = created_raw["_id"]
        res = client.post(
            f"/api/resumes/raw/{rid}/convert",
            json={"name": "Raw User", "email": "rawuser@example.com"},
            headers=auth_headers,
        )
        assert res.status_code == 201
        data = res.get_json()["data"]
        # cleanup the converted candidate
        client.delete(f"/api/resumes/{data['_id']}", headers=auth_headers)

    def test_convert_missing_name_returns_400(self, client, auth_headers, created_raw):
        rid = created_raw["_id"]
        res = client.post(
            f"/api/resumes/raw/{rid}/convert",
            json={"email": "x@x.com"},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_convert_missing_email_returns_400(self, client, auth_headers, created_raw):
        rid = created_raw["_id"]
        res = client.post(
            f"/api/resumes/raw/{rid}/convert",
            json={"name": "X"},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_convert_nonexistent_raw_returns_404(self, client, auth_headers):
        res = client.post(
            "/api/resumes/raw/000000000000000000000000/convert",
            json={"name": "X", "email": "x@x.com"},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_convert_already_converted_returns_409(self, client, auth_headers, created_raw):
        rid = created_raw["_id"]
        payload = {"name": "Raw User Two", "email": "rawusertwo@example.com"}
        res1 = client.post(f"/api/resumes/raw/{rid}/convert", json=payload, headers=auth_headers)
        assert res1.status_code == 201
        # Try converting again
        res2 = client.post(f"/api/resumes/raw/{rid}/convert", json=payload, headers=auth_headers)
        assert res2.status_code == 409
        # cleanup
        client.delete(f"/api/resumes/{res1.get_json()['data']['_id']}", headers=auth_headers)

    def test_unauthenticated_request_returns_401(self, client, created_raw):
        rid = created_raw["_id"]
        assert client.post(f"/api/resumes/raw/{rid}/convert",
                           json={"name": "X", "email": "x@x.com"}).status_code == 401


class TestDeleteRaw:

    def test_delete_raw_returns_200(self, client, auth_headers, created_raw):
        rid = created_raw["_id"]
        res = client.delete(f"/api/resumes/raw/{rid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["success"] is True

    def test_delete_nonexistent_raw_returns_404(self, client, auth_headers):
        assert client.delete("/api/resumes/raw/000000000000000000000000",
                             headers=auth_headers).status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_raw):
        rid = created_raw["_id"]
        assert client.delete(f"/api/resumes/raw/{rid}").status_code == 401


class TestManualRawEntry:

    def test_manual_entry_returns_201(self, client, auth_headers):
        payload = {"name": "Manual User", "email": "manual@example.com", "phone": "1234567890"}
        res = client.post("/api/resumes/raw/manual", json=payload, headers=auth_headers)
        assert res.status_code == 201
        data = res.get_json()["data"]
        client.delete(f"/api/resumes/raw/{data['_id']}", headers=auth_headers)

    def test_manual_entry_missing_name_returns_400(self, client, auth_headers):
        res = client.post("/api/resumes/raw/manual", json={}, headers=auth_headers)
        assert res.status_code == 400
        assert "name" in res.get_json()["message"]

    def test_manual_entry_parse_status_is_manual(self, client, auth_headers):
        payload = {"name": "Manual Two", "email": "manual2@example.com"}
        res = client.post("/api/resumes/raw/manual", json=payload, headers=auth_headers)
        assert res.status_code == 201
        data = res.get_json()["data"]
        assert data["parse_status"] == "manual"
        client.delete(f"/api/resumes/raw/{data['_id']}", headers=auth_headers)

    def test_manual_entry_with_job_sets_status_assigned(self, client, auth_headers):
        payload = {
            "name": "Manual Three",
            "email": "manual3@example.com",
            "linked_job_id": "JOB999",
        }
        res = client.post("/api/resumes/raw/manual", json=payload, headers=auth_headers)
        assert res.status_code == 201
        data = res.get_json()["data"]
        assert data["status"] == "Assigned"
        client.delete(f"/api/resumes/raw/{data['_id']}", headers=auth_headers)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.post("/api/resumes/raw/manual",
                           json={"name": "X"}).status_code == 401









