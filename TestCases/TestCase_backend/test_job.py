"""


Run:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_job.py -v
"""
import pytest
from datetime import datetime
from bson import ObjectId

from zentreeportal_backend.models.Job_model import (
    job_schema,
    serialize_job,
    mcq_question,
    subjective_question,
    coding_question,
    PRIORITIES,
    STATUSES,
    JOB_TYPES,
    WORK_MODES,
)

# ─────────────────────────────────────────────────────────────────────────────
# Shared test data
# ─────────────────────────────────────────────────────────────────────────────
VALID_JOB = {
    "job_id":      "JOB001",
    "title":       "Python Developer",
    "client_id":   "CLI001",
    "client_name": "Test Corp",
}

VALID_JOB_PAYLOAD = {
    **VALID_JOB,
    "openings":       2,
    "job_type":       "Full-Time",
    "work_mode":      "Remote",
    "location":       "Hyderabad",
    "experience_min": 2,
    "experience_max": 5,
    "priority":       "High",
    "status":         "Open",
    "skills":         ["Python", "Flask"],
    "description":    "We need a Python dev",
}


# ═════════════════════════════════════════════════════════════════════════════
# 1.  Unit tests – job_schema()
# ═════════════════════════════════════════════════════════════════════════════
class TestJobSchema:

    def test_valid_job_returns_dict(self):
        doc = job_schema(**VALID_JOB)
        assert isinstance(doc, dict)

    def test_job_id_is_uppercased(self):
        doc = job_schema(**{**VALID_JOB, "job_id": "job001"})
        assert doc["job_id"] == "JOB001"

    def test_title_is_stripped(self):
        doc = job_schema(**{**VALID_JOB, "title": "  Python Dev  "})
        assert doc["title"] == "Python Dev"

    def test_default_openings_is_one(self):
        assert job_schema(**VALID_JOB)["openings"] == 1

    def test_default_filled_is_zero(self):
        assert job_schema(**VALID_JOB)["filled"] == 0

    def test_default_applications_is_zero(self):
        assert job_schema(**VALID_JOB)["applications"] == 0

    def test_default_status_is_open(self):
        assert job_schema(**VALID_JOB)["status"] == "Open"

    def test_default_priority_is_medium(self):
        assert job_schema(**VALID_JOB)["priority"] == "Medium"

    def test_default_job_type_is_fulltime(self):
        assert job_schema(**VALID_JOB)["job_type"] == "Full-Time"

    def test_default_work_mode_is_onsite(self):
        assert job_schema(**VALID_JOB)["work_mode"] == "On-site"

    def test_created_at_is_datetime(self):
        assert isinstance(job_schema(**VALID_JOB)["created_at"], datetime)

    def test_updated_at_is_datetime(self):
        assert isinstance(job_schema(**VALID_JOB)["updated_at"], datetime)

    def test_skills_defaults_to_empty_list(self):
        assert job_schema(**VALID_JOB)["skills"] == []

    def test_secondary_skills_defaults_to_empty_list(self):
        assert job_schema(**VALID_JOB)["secondary_skills"] == []

    def test_mcq_questions_defaults_to_empty_list(self):
        assert job_schema(**VALID_JOB)["mcq_questions"] == []

    def test_invalid_priority_raises_valueerror(self):
        with pytest.raises(ValueError, match="priority must be one of"):
            job_schema(**{**VALID_JOB, "priority": "Extreme"})

    def test_invalid_status_raises_valueerror(self):
        with pytest.raises(ValueError, match="status must be one of"):
            job_schema(**{**VALID_JOB, "status": "Pending"})

    def test_invalid_job_type_raises_valueerror(self):
        with pytest.raises(ValueError, match="job_type must be one of"):
            job_schema(**{**VALID_JOB, "job_type": "Freelance"})

    def test_invalid_work_mode_raises_valueerror(self):
        with pytest.raises(ValueError, match="work_mode must be one of"):
            job_schema(**{**VALID_JOB, "work_mode": "Anywhere"})

    def test_openings_less_than_one_raises_valueerror(self):
        with pytest.raises(ValueError, match="openings must be >= 1"):
            job_schema(**{**VALID_JOB, "openings": 0})

    def test_all_priorities_accepted(self):
        for p in PRIORITIES:
            doc = job_schema(**{**VALID_JOB, "priority": p})
            assert doc["priority"] == p

    def test_all_statuses_accepted(self):
        for s in STATUSES:
            doc = job_schema(**{**VALID_JOB, "status": s})
            assert doc["status"] == s

    def test_all_job_types_accepted(self):
        for jt in JOB_TYPES:
            doc = job_schema(**{**VALID_JOB, "job_type": jt})
            assert doc["job_type"] == jt

    def test_all_work_modes_accepted(self):
        for wm in WORK_MODES:
            doc = job_schema(**{**VALID_JOB, "work_mode": wm})
            assert doc["work_mode"] == wm

    def test_custom_openings(self):
        doc = job_schema(**{**VALID_JOB, "openings": 5})
        assert doc["openings"] == 5

    def test_skills_list_stored(self):
        doc = job_schema(**{**VALID_JOB, "skills": ["Python", "Django"]})
        assert doc["skills"] == ["Python", "Django"]


# ═════════════════════════════════════════════════════════════════════════════
# 2.  Unit tests – sub-document builders
# ═════════════════════════════════════════════════════════════════════════════
class TestMcqQuestion:

    def test_valid_mcq_returns_dict(self):
        q = mcq_question("What is Python?", ["A", "B", "C"], ["A"])
        assert isinstance(q, dict)

    def test_question_is_stored(self):
        q = mcq_question("Q?", ["A", "B"], ["A"])
        assert q["question"] == "Q?"

    def test_options_are_stored(self):
        q = mcq_question("Q?", ["A", "B", "C"], ["B"])
        assert q["options"] == ["A", "B", "C"]

    def test_correct_answer_stored(self):
        q = mcq_question("Q?", ["A", "B"], ["A"])
        assert q["correct_answer"] == ["A"]

    def test_empty_question_raises(self):
        with pytest.raises(ValueError):
            mcq_question("", ["A", "B"], ["A"])

    def test_empty_options_raises(self):
        with pytest.raises(ValueError):
            mcq_question("Q?", [], ["A"])

    def test_empty_correct_answer_raises(self):
        with pytest.raises(ValueError):
            mcq_question("Q?", ["A", "B"], [])


class TestSubjectiveQuestion:

    def test_valid_subjective_returns_dict(self):
        q = subjective_question("Explain OOP")
        assert isinstance(q, dict)

    def test_question_is_stored(self):
        q = subjective_question("What is recursion?")
        assert q["question"] == "What is recursion?"

    def test_optional_fields_default_to_empty(self):
        q = subjective_question("Q?")
        assert q["reference_answer"] == ""
        assert q["key_points"] == ""
        assert q["skill"] == ""
        assert q["difficulty"] == ""

    def test_empty_question_raises(self):
        with pytest.raises(ValueError):
            subjective_question("")


class TestCodingQuestion:

    def test_valid_coding_returns_dict(self):
        q = coding_question("Python", "Write a fibonacci function")
        assert isinstance(q, dict)

    def test_language_is_stored(self):
        q = coding_question("Python", "Write a sort function")
        assert q["programming_language"] == "Python"

    def test_question_is_stored(self):
        q = coding_question("Java", "Reverse a string")
        assert q["question"] == "Reverse a string"

    def test_empty_language_raises(self):
        with pytest.raises(ValueError):
            coding_question("", "Q?")

    def test_empty_question_raises(self):
        with pytest.raises(ValueError):
            coding_question("Python", "")


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Unit tests – serialize_job()
# ═════════════════════════════════════════════════════════════════════════════
class TestSerializeJob:

    def test_objectid_converted_to_string(self):
        doc = {"_id": ObjectId(), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        result = serialize_job(doc)
        assert isinstance(result["_id"], str)

    def test_datetime_fields_converted_to_iso(self):
        now = datetime.utcnow()
        doc = {"_id": "abc", "created_at": now, "updated_at": now, "deadline": now}
        result = serialize_job(doc)
        assert isinstance(result["created_at"], str)
        assert isinstance(result["updated_at"], str)
        assert isinstance(result["deadline"], str)

    def test_none_deadline_stays_none(self):
        doc = {"_id": "abc", "deadline": None, "created_at": datetime.utcnow()}
        result = serialize_job(doc)
        assert result["deadline"] is None

    def test_days_open_calculated(self):
        doc = {"_id": "abc", "created_at": datetime.utcnow()}
        result = serialize_job(doc)
        assert "days_open" in result
        assert result["days_open"] >= 0

    def test_original_dict_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid, "title": "Dev"}
        serialize_job(doc)
        assert doc["_id"] == oid


# ═════════════════════════════════════════════════════════════════════════════
# 4.  Integration tests – Job API routes
# ═════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def created_job(client, auth_headers):
    """Create a job and yield its data; delete after test."""
    res = client.post("/api/jobs/", json=VALID_JOB_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201, f"Job creation failed: {res.get_json()}"
    data = res.get_json()["data"]
    yield data
    client.delete(f"/api/jobs/{data['_id']}", headers=auth_headers)


# ── POST /api/jobs/ ──────────────────────────────────────────────────────────
class TestCreateJob:

    def test_create_valid_job_returns_201(self, client, auth_headers, created_job):
        assert created_job["title"] == "Python Developer"

    def test_create_job_returns_correct_data(self, client, auth_headers, created_job):
        assert created_job["job_id"] == "JOB001"
        assert created_job["client_name"] == "Test Corp"

    def test_duplicate_job_id_returns_409(self, client, auth_headers, created_job):
        res = client.post("/api/jobs/", json=VALID_JOB_PAYLOAD, headers=auth_headers)
        assert res.status_code == 409
        assert "already exists" in res.get_json()["message"]

    def test_missing_title_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_JOB_PAYLOAD.items() if k != "title"}
        payload["job_id"] = "JOB_MISSING_TITLE"
        res = client.post("/api/jobs/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_missing_job_id_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_JOB_PAYLOAD.items() if k != "job_id"}
        res = client.post("/api/jobs/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_missing_client_id_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_JOB_PAYLOAD.items() if k != "client_id"}
        payload["job_id"] = "JOB_NO_CLIENT"
        res = client.post("/api/jobs/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_invalid_priority_returns_400(self, client, auth_headers):
        payload = {**VALID_JOB_PAYLOAD, "job_id": "JOB_BAD_PRI", "priority": "Extreme"}
        res = client.post("/api/jobs/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_invalid_status_returns_400(self, client, auth_headers):
        payload = {**VALID_JOB_PAYLOAD, "job_id": "JOB_BAD_STAT", "status": "Unknown"}
        res = client.post("/api/jobs/", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_returns_401(self, client):
        res = client.post("/api/jobs/", json=VALID_JOB_PAYLOAD)
        assert res.status_code == 401


# ── GET /api/jobs/ ───────────────────────────────────────────────────────────
class TestGetJobs:

    def test_list_returns_200(self, client, auth_headers):
        res = client.get("/api/jobs/", headers=auth_headers)
        assert res.status_code == 200

    def test_list_data_is_array(self, client, auth_headers):
        data = client.get("/api/jobs/", headers=auth_headers).get_json()
        assert isinstance(data["data"], list)

    def test_list_has_pagination_fields(self, client, auth_headers):
        body = client.get("/api/jobs/?page=1&per_page=5", headers=auth_headers).get_json()
        assert "page" in body and "total" in body and "pages" in body

    def test_search_by_title(self, client, auth_headers, created_job):
        res = client.get("/api/jobs/?q=Python+Developer", headers=auth_headers)
        titles = [j["title"] for j in res.get_json()["data"]]
        assert "Python Developer" in titles

    def test_filter_by_status(self, client, auth_headers, created_job):
        res = client.get("/api/jobs/?status=Open", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(j["status"] == "Open" for j in data)

    def test_filter_by_priority(self, client, auth_headers, created_job):
        res = client.get("/api/jobs/?priority=High", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(j["priority"] == "High" for j in data)

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/jobs/").status_code == 401


# ── GET /api/jobs/<id> ───────────────────────────────────────────────────────
class TestGetSingleJob:

    def test_get_existing_job_returns_200(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        res = client.get(f"/api/jobs/{jid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["_id"] == jid

    def test_get_nonexistent_job_returns_404(self, client, auth_headers):
        res = client.get("/api/jobs/000000000000000000000000", headers=auth_headers)
        assert res.status_code == 404

    def test_invalid_id_returns_400(self, client, auth_headers):
        res = client.get("/api/jobs/not-valid-id", headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/jobs/000000000000000000000000").status_code == 401


# ── PUT /api/jobs/<id> ───────────────────────────────────────────────────────
class TestUpdateJob:

    def test_update_title(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        res = client.put(f"/api/jobs/{jid}", json={"title": "Senior Python Dev"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["title"] == "Senior Python Dev"

    def test_update_status(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        res = client.put(f"/api/jobs/{jid}", json={"status": "On Hold"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["status"] == "On Hold"

    def test_update_priority(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        res = client.put(f"/api/jobs/{jid}", json={"priority": "Critical"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["priority"] == "Critical"

    def test_update_invalid_priority_returns_400(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        res = client.put(f"/api/jobs/{jid}", json={"priority": "Extreme"}, headers=auth_headers)
        assert res.status_code == 400

    def test_update_invalid_status_returns_400(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        res = client.put(f"/api/jobs/{jid}", json={"status": "Unknown"}, headers=auth_headers)
        assert res.status_code == 400

    def test_empty_body_returns_400(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        res = client.put(f"/api/jobs/{jid}", json={}, headers=auth_headers)
        assert res.status_code == 400

    def test_update_nonexistent_returns_404(self, client, auth_headers):
        res = client.put("/api/jobs/000000000000000000000000",
                         json={"title": "X"}, headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client, created_job):
        jid = created_job["_id"]
        assert client.put(f"/api/jobs/{jid}", json={"title": "X"}).status_code == 401


# ── PATCH /api/jobs/<id>/questions ───────────────────────────────────────────
class TestUpdateQuestions:

    def test_patch_mcq_questions(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        payload = {"mcq_questions": [{"question": "Q1", "options": ["A", "B"], "correct_answer": ["A"]}]}
        res = client.patch(f"/api/jobs/{jid}/questions", json=payload, headers=auth_headers)
        assert res.status_code == 200
        assert len(res.get_json()["data"]["mcq_questions"]) == 1

    def test_patch_coding_questions(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        payload = {"coding_questions": [{"programming_language": "Python", "question": "FizzBuzz"}]}
        res = client.patch(f"/api/jobs/{jid}/questions", json=payload, headers=auth_headers)
        assert res.status_code == 200

    def test_empty_patch_returns_400(self, client, auth_headers, created_job):
        jid = created_job["_id"]
        res = client.patch(f"/api/jobs/{jid}/questions", json={}, headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_returns_401(self, client, created_job):
        jid = created_job["_id"]
        assert client.patch(f"/api/jobs/{jid}/questions",
                            json={"mcq_questions": []}).status_code == 401


# ── DELETE /api/jobs/<id> ────────────────────────────────────────────────────
class TestDeleteJob:

    def test_delete_existing_returns_200(self, client, auth_headers):
        # Create a dedicated job to delete (don't use created_job fixture — it would double-delete)
        payload = {**VALID_JOB_PAYLOAD, "job_id": "JOB_DELETE_ME"}
        res = client.post("/api/jobs/", json=payload, headers=auth_headers)
        assert res.status_code == 201
        jid = res.get_json()["data"]["_id"]

        del_res = client.delete(f"/api/jobs/{jid}", headers=auth_headers)
        assert del_res.status_code == 200
        assert del_res.get_json()["success"] is True

    def test_deleted_job_not_found(self, client, auth_headers):
        payload = {**VALID_JOB_PAYLOAD, "job_id": "JOB_GONE"}
        res = client.post("/api/jobs/", json=payload, headers=auth_headers)
        jid = res.get_json()["data"]["_id"]
        client.delete(f"/api/jobs/{jid}", headers=auth_headers)
        assert client.get(f"/api/jobs/{jid}", headers=auth_headers).status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        assert client.delete("/api/jobs/000000000000000000000000",
                             headers=auth_headers).status_code == 404

    def test_unauthenticated_returns_401(self, client, created_job):
        jid = created_job["_id"]
        assert client.delete(f"/api/jobs/{jid}").status_code == 401


# ── GET /api/jobs/meta/options ───────────────────────────────────────────────
class TestJobMetaOptions:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/jobs/meta/options", headers=auth_headers).status_code == 200

    def test_returns_priorities(self, client, auth_headers):
        body = client.get("/api/jobs/meta/options", headers=auth_headers).get_json()
        assert "priorities" in body and isinstance(body["priorities"], list)

    def test_returns_statuses(self, client, auth_headers):
        body = client.get("/api/jobs/meta/options", headers=auth_headers).get_json()
        assert "statuses" in body and isinstance(body["statuses"], list)

    def test_returns_job_types(self, client, auth_headers):
        body = client.get("/api/jobs/meta/options", headers=auth_headers).get_json()
        assert "job_types" in body

    def test_returns_work_modes(self, client, auth_headers):
        body = client.get("/api/jobs/meta/options", headers=auth_headers).get_json()
        assert "work_modes" in body

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/jobs/meta/options").status_code == 401





