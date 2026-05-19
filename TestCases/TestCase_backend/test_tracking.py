"""
Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_tracking.py -v
"""
import pytest
from datetime import datetime
from bson import ObjectId

# These imports work because conftest.py adds zentreeportal_backend/ to sys.path
from zentreeportal_backend.models.Tracking_model import (
    tracking_schema,
    serialize_tracking,
    STAGES,
    PIPELINE_STATUSES,
    INTERVIEW_TYPES,
    RECOMMENDATIONS,
    OFFER_STATUSES,
)


# ─────────────────────────────────────────────────────────────────────────────
# Shared test data
# ─────────────────────────────────────────────────────────────────────────────
VALID_PAYLOAD = {
    "resume_id":      "RES001",
    "candidate_name": "Alice Johnson",
    "job_id":         "JOB001",
    "client_name":    "Acme Corp",
    "job_title":      "Backend Engineer",
    "current_stage":  "Screening",
    "pipeline_status": "Active",
    "recruiter":      "Bob",
    "notes":          "Strong candidate",
}

VALID_SCHEDULE_PAYLOAD = {
    "interviewer_name":  "Dr. Smith",
    "interviewer_email": "smith@acme.com",
    "candidate_email":   "alice@example.com",
    "interview_date":    "2099-12-01",
    "interview_time":    "10:00",
    "duration_minutes":  60,
    "interview_type":    "Video",
    "stage":             "Screening",
    "notes":             "First round",
}


# ═════════════════════════════════════════════════════════════════════════════
# 1.  Unit tests – tracking_schema()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestTrackingSchema:

    def test_valid_tracking_returns_dict(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert isinstance(doc, dict)

    def test_default_stage_is_screening(self):
        doc = tracking_schema(resume_id="R1", candidate_name="A", job_id="J1")
        assert doc["current_stage"] == "Screening"

    def test_default_pipeline_status_is_active(self):
        doc = tracking_schema(resume_id="R1", candidate_name="A", job_id="J1")
        assert doc["pipeline_status"] == "Active"

    def test_stage_date_is_datetime(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert isinstance(doc["stage_date"], datetime)

    def test_days_in_stage_defaults_to_zero(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert doc["days_in_stage"] == 0

    def test_interviews_defaults_to_empty_list(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert doc["interviews"] == []

    def test_stage_history_initialized_with_first_stage(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert len(doc["stage_history"]) == 1
        assert doc["stage_history"][0]["stage"] == "Screening"

    def test_stage_history_entry_has_entered_at(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert isinstance(doc["stage_history"][0]["entered_at"], datetime)

    def test_created_at_is_datetime(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert isinstance(doc["created_at"], datetime)

    def test_updated_at_is_datetime(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert isinstance(doc["updated_at"], datetime)

    def test_salary_offered_defaults_to_zero(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert doc["salary_offered"] == 0

    def test_offer_status_defaults_to_pending(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert doc["offer_status"] == "Pending"

    def test_optional_date_fields_default_to_none(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        for field in ("next_date", "offer_date", "joining_date"):
            assert doc[field] is None, f"Expected None for {field}"

    def test_invalid_stage_raises_valueerror(self):
        with pytest.raises(ValueError, match="current_stage must be one of"):
            tracking_schema(resume_id="R1", candidate_name="A", job_id="J1",
                            current_stage="FakeStage")

    def test_all_stages_accepted(self):
        for stage in STAGES:
            doc = tracking_schema(resume_id="R1", candidate_name="A", job_id="J1",
                                  current_stage=stage)
            assert doc["current_stage"] == stage

    def test_rejection_reason_defaults_to_empty_string(self):
        doc = tracking_schema(**VALID_PAYLOAD)
        assert doc["rejection_reason"] == ""

    def test_custom_salary_stored(self):
        doc = tracking_schema(**{**VALID_PAYLOAD, "salary_offered": 1200000})
        assert doc["salary_offered"] == 1200000


# ═════════════════════════════════════════════════════════════════════════════
# 2.  Unit tests – serialize_tracking()   (no DB, no Flask app needed)
# ═════════════════════════════════════════════════════════════════════════════
class TestSerializeTracking:

    def test_objectid_converted_to_string(self):
        doc = {"_id": ObjectId(), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        result = serialize_tracking(doc)
        assert isinstance(result["_id"], str)

    def test_datetime_fields_converted_to_iso(self):
        now = datetime.utcnow()
        doc = {
            "_id": "abc",
            "stage_date":  now,
            "created_at":  now,
            "updated_at":  now,
            "next_date":   now,
            "offer_date":  now,
            "joining_date": now,
        }
        result = serialize_tracking(doc)
        for field in ("stage_date", "created_at", "updated_at",
                      "next_date", "offer_date", "joining_date"):
            assert isinstance(result[field], str), f"{field} should be ISO string"

    def test_none_date_fields_stay_none(self):
        doc = {"_id": "abc", "next_date": None, "offer_date": None, "joining_date": None}
        result = serialize_tracking(doc)
        assert result["next_date"]   is None
        assert result["offer_date"]  is None
        assert result["joining_date"] is None

    def test_stage_history_dates_serialized(self):
        now = datetime.utcnow()
        doc = {
            "_id": "abc",
            "stage_history": [{"entered_at": now, "exited_at": None}],
        }
        result = serialize_tracking(doc)
        assert isinstance(result["stage_history"][0]["entered_at"], str)
        assert result["stage_history"][0]["exited_at"] is None

    def test_interview_dates_serialized(self):
        now = datetime.utcnow()
        doc = {
            "_id": "abc",
            "interviews": [{"interview_date": now, "feedback_summary": "Good"}],
        }
        result = serialize_tracking(doc)
        assert isinstance(result["interviews"][0]["interview_date"], str)

    def test_original_dict_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid, "candidate_name": "Alice"}
        serialize_tracking(doc)
        assert doc["_id"] == oid

    def test_missing_id_defaults_to_empty_string(self):
        result = serialize_tracking({})
        assert result["_id"] == ""


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Integration tests – Tracking API routes
# ═════════════════════════════════════════════════════════════════════════════

# ── helper fixture: create one tracking record, yield its data, clean up ─────
@pytest.fixture
def created_tracking(client, auth_headers):
    res = client.post("/api/tracking/", json=VALID_PAYLOAD, headers=auth_headers)
    assert res.status_code in (200, 201), f"Setup failed: {res.get_json()}"
    data = res.get_json()["data"]
    yield data
    client.delete(f"/api/tracking/{data['_id']}", headers=auth_headers)


# ── helper fixture: create tracking + schedule an interview, clean up ─────────
@pytest.fixture
def tracking_with_schedule(client, auth_headers, created_tracking):
    tid = created_tracking["_id"]
    res = client.post(
        f"/api/tracking/{tid}/schedule",
        json=VALID_SCHEDULE_PAYLOAD,
        headers=auth_headers,
    )
    assert res.status_code == 201, f"Schedule setup failed: {res.get_json()}"
    schedule_id = res.get_json()["schedule_id"]
    yield created_tracking, schedule_id


# ── POST /api/tracking/ ───────────────────────────────────────────────────────
class TestCreateTracking:

    def test_create_valid_tracking_returns_201(self, client, auth_headers, created_tracking):
        assert created_tracking["candidate_name"] == "Alice Johnson"

    def test_create_returns_correct_job_id(self, client, auth_headers, created_tracking):
        assert created_tracking["job_id"] == "JOB001"

    def test_create_sets_default_stage(self, client, auth_headers, created_tracking):
        assert created_tracking["current_stage"] == "Screening"

    def test_create_initializes_stage_history(self, client, auth_headers, created_tracking):
        assert len(created_tracking["stage_history"]) >= 1

    def test_create_missing_resume_id_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "resume_id"}
        res = client.post("/api/tracking/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "resume_id" in res.get_json()["message"]

    def test_create_missing_candidate_name_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "candidate_name"}
        res = client.post("/api/tracking/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "candidate_name" in res.get_json()["message"]

    def test_create_missing_job_id_returns_400(self, client, auth_headers):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "job_id"}
        res = client.post("/api/tracking/", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "job_id" in res.get_json()["message"]

    def test_duplicate_resume_job_updates_existing(self, client, auth_headers, created_tracking):
        # Same resume_id + job_id → update (returns 200, was_updated=True)
        res = client.post("/api/tracking/", json=VALID_PAYLOAD, headers=auth_headers)
        body = res.get_json()
        assert res.status_code == 200
        assert body["was_updated"] is True

    def test_unauthenticated_request_returns_401(self, client):
        res = client.post("/api/tracking/", json=VALID_PAYLOAD)
        assert res.status_code == 401


# ── GET /api/tracking/ ────────────────────────────────────────────────────────
class TestGetTracking:

    def test_list_returns_200(self, client, auth_headers):
        res = client.get("/api/tracking/", headers=auth_headers)
        assert res.status_code == 200

    def test_list_data_is_array(self, client, auth_headers):
        body = client.get("/api/tracking/", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_pagination_fields_present(self, client, auth_headers):
        body = client.get("/api/tracking/?page=1&per_page=5", headers=auth_headers).get_json()
        assert "page" in body and "total" in body and "per_page" in body

    def test_filter_by_stage(self, client, auth_headers, created_tracking):
        res = client.get("/api/tracking/?stage=Screening", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["current_stage"] == "Screening" for d in data)

    def test_filter_by_status(self, client, auth_headers, created_tracking):
        res = client.get("/api/tracking/?status=Active", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["pipeline_status"] == "Active" for d in data)

    def test_search_by_candidate_name(self, client, auth_headers, created_tracking):
        res = client.get("/api/tracking/?q=Alice+Johnson", headers=auth_headers)
        names = [d["candidate_name"] for d in res.get_json()["data"]]
        assert "Alice Johnson" in names

    def test_filter_by_job_id(self, client, auth_headers, created_tracking):
        res = client.get("/api/tracking/?job_id=JOB001", headers=auth_headers)
        data = res.get_json()["data"]
        assert all(d["job_id"] == "JOB001" for d in data)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/tracking/").status_code == 401


# ── GET /api/tracking/<id> ────────────────────────────────────────────────────
class TestGetSingleTracking:

    def test_get_existing_tracking_returns_200(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.get(f"/api/tracking/{tid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["_id"] == tid

    def test_get_nonexistent_tracking_returns_404(self, client, auth_headers):
        res = client.get("/api/tracking/000000000000000000000000", headers=auth_headers)
        assert res.status_code == 404

    def test_invalid_id_format_returns_400(self, client, auth_headers):
        res = client.get("/api/tracking/not-an-id", headers=auth_headers)
        assert res.status_code == 400

    def test_unauthenticated_request_returns_401(self, client, created_tracking):
        tid = created_tracking["_id"]
        assert client.get(f"/api/tracking/{tid}").status_code == 401


# ── PUT /api/tracking/<id> ────────────────────────────────────────────────────
class TestUpdateTracking:

    def test_update_stage(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.put(f"/api/tracking/{tid}",
                         json={"current_stage": "Technical Round 1"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["current_stage"] == "Technical Round 1"

    def test_stage_change_adds_to_stage_history(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        client.put(f"/api/tracking/{tid}",
                   json={"current_stage": "Technical Round 1"},
                   headers=auth_headers)
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        stages = [h["stage"] for h in data["stage_history"]]
        assert "Technical Round 1" in stages

    def test_update_pipeline_status(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.put(f"/api/tracking/{tid}",
                         json={"pipeline_status": "On Hold"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["pipeline_status"] == "On Hold"

    def test_update_invalid_stage_returns_400(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.put(f"/api/tracking/{tid}",
                         json={"current_stage": "FakeStage"},
                         headers=auth_headers)
        assert res.status_code == 400

    def test_update_notes(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.put(f"/api/tracking/{tid}",
                         json={"notes": "Updated notes"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["data"]["notes"] == "Updated notes"

    def test_update_nonexistent_returns_404(self, client, auth_headers):
        res = client.put("/api/tracking/000000000000000000000000",
                         json={"notes": "x"}, headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_tracking):
        tid = created_tracking["_id"]
        assert client.put(f"/api/tracking/{tid}", json={"notes": "x"}).status_code == 401


# ── DELETE /api/tracking/<id> ─────────────────────────────────────────────────
class TestDeleteTracking:

    def test_delete_existing_tracking_returns_200(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.delete(f"/api/tracking/{tid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["success"] is True

    def test_deleted_tracking_not_found_afterwards(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        client.delete(f"/api/tracking/{tid}", headers=auth_headers)
        assert client.get(f"/api/tracking/{tid}", headers=auth_headers).status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        assert client.delete("/api/tracking/000000000000000000000000",
                             headers=auth_headers).status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_tracking):
        tid = created_tracking["_id"]
        assert client.delete(f"/api/tracking/{tid}").status_code == 401


# ── GET /api/tracking/meta/options ────────────────────────────────────────────
class TestMetaOptions:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/tracking/meta/options", headers=auth_headers).status_code == 200

    def test_returns_stages_list(self, client, auth_headers):
        body = client.get("/api/tracking/meta/options", headers=auth_headers).get_json()
        assert "stages" in body and isinstance(body["stages"], list)

    def test_returns_pipeline_statuses_list(self, client, auth_headers):
        body = client.get("/api/tracking/meta/options", headers=auth_headers).get_json()
        assert "pipeline_statuses" in body and isinstance(body["pipeline_statuses"], list)

    def test_stages_match_constants(self, client, auth_headers):
        body = client.get("/api/tracking/meta/options", headers=auth_headers).get_json()
        assert set(body["stages"]) == set(STAGES)

    def test_pipeline_statuses_match_constants(self, client, auth_headers):
        body = client.get("/api/tracking/meta/options", headers=auth_headers).get_json()
        assert set(body["pipeline_statuses"]) == set(PIPELINE_STATUSES)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/tracking/meta/options").status_code == 401


# ── GET /api/tracking/pipeline ────────────────────────────────────────────────
class TestPipelineView:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/tracking/pipeline", headers=auth_headers).status_code == 200

    def test_returns_data_list(self, client, auth_headers):
        body = client.get("/api/tracking/pipeline", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_pipeline_entry_has_count(self, client, auth_headers, created_tracking):
        body = client.get("/api/tracking/pipeline", headers=auth_headers).get_json()
        # At least one Active tracking record exists; each entry has a count
        for entry in body["data"]:
            assert "count" in entry

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/tracking/pipeline").status_code == 401


# ── GET /api/tracking/by-resume/<resume_id> ───────────────────────────────────
class TestByResume:

    def test_by_resume_returns_200(self, client, auth_headers, created_tracking):
        res = client.get("/api/tracking/by-resume/RES001", headers=auth_headers)
        assert res.status_code == 200

    def test_by_resume_data_is_array(self, client, auth_headers):
        body = client.get("/api/tracking/by-resume/RES001", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_by_resume_finds_correct_candidate(self, client, auth_headers, created_tracking):
        res = client.get("/api/tracking/by-resume/RES001", headers=auth_headers)
        names = [d["candidate_name"] for d in res.get_json()["data"]]
        assert "Alice Johnson" in names

    def test_by_resume_unknown_id_returns_empty(self, client, auth_headers):
        body = client.get("/api/tracking/by-resume/NOTEXIST999",
                          headers=auth_headers).get_json()
        assert body["data"] == []

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/tracking/by-resume/RES001").status_code == 401


# ── GET /api/tracking/upcoming ────────────────────────────────────────────────
class TestUpcoming:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/tracking/upcoming", headers=auth_headers).status_code == 200

    def test_returns_data_list(self, client, auth_headers):
        body = client.get("/api/tracking/upcoming", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/tracking/upcoming").status_code == 401


# ── GET /api/tracking/calendar ────────────────────────────────────────────────
class TestCalendar:

    def test_returns_200(self, client, auth_headers):
        assert client.get("/api/tracking/calendar", headers=auth_headers).status_code == 200

    def test_returns_data_list(self, client, auth_headers):
        body = client.get("/api/tracking/calendar", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_accepts_year_month_params(self, client, auth_headers):
        res = client.get("/api/tracking/calendar?year=2099&month=12", headers=auth_headers)
        assert res.status_code == 200

    def test_unauthenticated_request_returns_401(self, client):
        assert client.get("/api/tracking/calendar").status_code == 401


# ── POST /api/tracking/<id>/schedule ─────────────────────────────────────────
class TestScheduleInterview:

    def test_schedule_returns_201(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        assert schedule_id is not None

    def test_schedule_id_is_uppercase_string(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        assert isinstance(schedule_id, str)
        assert schedule_id == schedule_id.upper()

    def test_schedule_appears_in_tracking_record(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        sids = [s["schedule_id"] for s in data.get("scheduled_interviews", [])]
        assert schedule_id in sids

    def test_schedule_default_status_is_scheduled(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        sched = next(s for s in data["scheduled_interviews"] if s["schedule_id"] == schedule_id)
        assert sched["status"] == "Scheduled"

    def test_schedule_default_rsvp_is_pending(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        sched = next(s for s in data["scheduled_interviews"] if s["schedule_id"] == schedule_id)
        assert sched["candidate_rsvp"] == "Pending"

    def test_schedule_missing_interviewer_name_returns_400(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        payload = {k: v for k, v in VALID_SCHEDULE_PAYLOAD.items() if k != "interviewer_name"}
        res = client.post(f"/api/tracking/{tid}/schedule", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_schedule_missing_interview_date_returns_400(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        payload = {k: v for k, v in VALID_SCHEDULE_PAYLOAD.items() if k != "interview_date"}
        res = client.post(f"/api/tracking/{tid}/schedule", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_schedule_invalid_date_format_returns_400(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        payload = {**VALID_SCHEDULE_PAYLOAD, "interview_date": "01-12-2099"}  # wrong format
        res = client.post(f"/api/tracking/{tid}/schedule", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_schedule_nonexistent_tracking_returns_404(self, client, auth_headers):
        res = client.post("/api/tracking/000000000000000000000000/schedule",
                          json=VALID_SCHEDULE_PAYLOAD, headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_tracking):
        tid = created_tracking["_id"]
        assert client.post(f"/api/tracking/{tid}/schedule",
                           json=VALID_SCHEDULE_PAYLOAD).status_code == 401


# ── PUT /api/tracking/<id>/schedule/<schedule_id> ─────────────────────────────
class TestUpdateSchedule:

    def test_update_schedule_status(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.put(
            f"/api/tracking/{tid}/schedule/{schedule_id}",
            json={"status": "Completed"},
            headers=auth_headers,
        )
        assert res.status_code == 200

    def test_update_schedule_notes(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.put(
            f"/api/tracking/{tid}/schedule/{schedule_id}",
            json={"notes": "Rescheduled due to conflict"},
            headers=auth_headers,
        )
        assert res.status_code == 200

    def test_reschedule_sets_status_to_rescheduled(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.put(
            f"/api/tracking/{tid}/schedule/{schedule_id}",
            json={"interview_date": "2099-12-15", "interview_time": "14:00"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.get_json()["data"]
        sched = next(s for s in data["scheduled_interviews"] if s["schedule_id"] == schedule_id)
        assert sched["status"] == "Rescheduled"

    def test_update_nonexistent_schedule_returns_404(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.put(f"/api/tracking/{tid}/schedule/NOTEXIST",
                         json={"status": "Completed"}, headers=auth_headers)
        assert res.status_code == 404

    def test_update_nonexistent_tracking_returns_404(self, client, auth_headers):
        res = client.put("/api/tracking/000000000000000000000000/schedule/ABCD1234",
                         json={"status": "Completed"}, headers=auth_headers)
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        assert client.put(f"/api/tracking/{tid}/schedule/{schedule_id}",
                          json={"status": "Completed"}).status_code == 401


# ── POST /api/tracking/<id>/schedule/<schedule_id>/feedback ───────────────────
class TestSubmitScheduleFeedback:

    def test_submit_feedback_returns_200(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.post(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback",
            json={
                "feedback_summary": "Strong technical skills",
                "feedback_score":   4,
                "recommendation":   "Hire",
                "strengths":        ["Python", "System Design"],
                "weaknesses":       ["Communication"],
            },
            headers=auth_headers,
        )
        assert res.status_code == 200

    def test_submit_feedback_marks_schedule_completed(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        client.post(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback",
            json={"feedback_summary": "Good"},
            headers=auth_headers,
        )
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        sched = next(s for s in data["scheduled_interviews"] if s["schedule_id"] == schedule_id)
        assert sched["status"] == "Completed"
        assert sched["feedback_submitted"] is True

    def test_submit_feedback_adds_to_interviews_list(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        client.post(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback",
            json={"feedback_summary": "Good candidate"},
            headers=auth_headers,
        )
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        assert len(data["interviews"]) >= 1

    def test_submit_feedback_missing_summary_returns_400(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.post(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback",
            json={"feedback_score": 4},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_submit_feedback_nonexistent_schedule_returns_404(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.post(
            f"/api/tracking/{tid}/schedule/NOTEXIST/feedback",
            json={"feedback_summary": "Good"},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        assert client.post(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback",
            json={"feedback_summary": "Good"},
        ).status_code == 401


# ── POST /api/tracking/<id>/interview ─────────────────────────────────────────
class TestAddInterview:

    def test_add_interview_returns_200(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.post(
            f"/api/tracking/{tid}/interview",
            json={
                "interviewer":      "Dr. Jones",
                "feedback_score":   4,
                "feedback_summary": "Excellent",
                "recommendation":   "Strong Hire",
            },
            headers=auth_headers,
        )
        assert res.status_code == 200

    def test_add_interview_appends_to_interviews(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        client.post(
            f"/api/tracking/{tid}/interview",
            json={"interviewer": "Dr. Jones", "feedback_summary": "Good"},
            headers=auth_headers,
        )
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        assert len(data["interviews"]) >= 1

    def test_add_interview_missing_interviewer_returns_400(self, client, auth_headers, created_tracking):
        tid = created_tracking["_id"]
        res = client.post(
            f"/api/tracking/{tid}/interview",
            json={"feedback_summary": "Good"},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_add_interview_nonexistent_tracking_returns_404(self, client, auth_headers):
        res = client.post(
            "/api/tracking/000000000000000000000000/interview",
            json={"interviewer": "Dr. Jones"},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_unauthenticated_request_returns_401(self, client, created_tracking):
        tid = created_tracking["_id"]
        assert client.post(f"/api/tracking/{tid}/interview",
                           json={"interviewer": "Dr. Jones"}).status_code == 401


# ── GET /api/tracking/<id>/schedule/<schedule_id>/feedback-form  (public) ─────
class TestFeedbackForm:

    def test_get_feedback_form_returns_200(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        # No auth — public endpoint
        res = client.get(f"/api/tracking/{tid}/schedule/{schedule_id}/feedback-form")
        assert res.status_code == 200

    def test_feedback_form_returns_candidate_name(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        data = client.get(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback-form"
        ).get_json()["data"]
        assert data["candidate_name"] == "Alice Johnson"

    def test_feedback_form_nonexistent_schedule_returns_404(self, client, created_tracking):
        tid = created_tracking["_id"]
        res = client.get(f"/api/tracking/{tid}/schedule/NOTEXIST/feedback-form")
        assert res.status_code == 404

    def test_submit_feedback_form_returns_200(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.post(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback-form",
            json={
                "feedback_summary": "Very good",
                "feedback_score":   4,
                "recommendation":   "Hire",
            },
        )
        assert res.status_code == 200

    def test_submit_feedback_form_duplicate_returns_409(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        payload = {"feedback_summary": "Good", "recommendation": "Hire"}
        client.post(f"/api/tracking/{tid}/schedule/{schedule_id}/feedback-form", json=payload)
        res = client.post(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback-form", json=payload
        )
        assert res.status_code == 409

    def test_submit_feedback_form_missing_summary_returns_400(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.post(
            f"/api/tracking/{tid}/schedule/{schedule_id}/feedback-form",
            json={"feedback_score": 3},
        )
        assert res.status_code == 400


# ── GET /api/tracking/<id>/schedule/<schedule_id>/respond/<response>  (public) ─
class TestCandidateRSVP:

    def test_accept_rsvp_returns_200(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.get(f"/api/tracking/{tid}/schedule/{schedule_id}/respond/accept")
        assert res.status_code == 200

    def test_decline_rsvp_returns_200(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.get(f"/api/tracking/{tid}/schedule/{schedule_id}/respond/decline")
        assert res.status_code == 200

    def test_invalid_response_returns_400(self, client, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        res = client.get(f"/api/tracking/{tid}/schedule/{schedule_id}/respond/maybe")
        assert res.status_code == 400

    def test_accept_sets_rsvp_to_accepted(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        client.get(f"/api/tracking/{tid}/schedule/{schedule_id}/respond/accept")
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        sched = next(s for s in data["scheduled_interviews"] if s["schedule_id"] == schedule_id)
        assert sched["candidate_rsvp"] == "Accepted"

    def test_decline_sets_rsvp_to_declined(self, client, auth_headers, tracking_with_schedule):
        tracking, schedule_id = tracking_with_schedule
        tid = tracking["_id"]
        client.get(f"/api/tracking/{tid}/schedule/{schedule_id}/respond/decline")
        data = client.get(f"/api/tracking/{tid}", headers=auth_headers).get_json()["data"]
        sched = next(s for s in data["scheduled_interviews"] if s["schedule_id"] == schedule_id)
        assert sched["candidate_rsvp"] == "Declined"

    def test_rsvp_nonexistent_tracking_returns_404_html(self, client):
        res = client.get("/api/tracking/000000000000000000000000/schedule/ABCD/respond/accept")
        assert res.status_code == 404

    def test_rsvp_nonexistent_schedule_returns_404_html(self, client, created_tracking):
        tid = created_tracking["_id"]
        res = client.get(f"/api/tracking/{tid}/schedule/NOTEXIST/respond/accept")
        assert res.status_code == 404








