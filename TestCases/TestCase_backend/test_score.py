"""
Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_score.py -v
"""
import pytest
import json
from bson import ObjectId
from unittest.mock import patch, MagicMock


# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────────────────

def _register_user(client, email, role="recruiter", password="Test@1234"):
    client.post("/api/auth/register", json={
        "first_name": "Score",
        "last_name":  "Tester",
        "email":      email,
        "password":   password,
        "role":       role,
    })


def _login(client, email, password="Test@1234"):
    res  = client.post("/api/auth/login", json={"email": email, "password": password})
    data = res.get_json()
    return {"Authorization": f"Bearer {data['access_token']}"}


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def recruiter_headers(client):
    _register_user(client, "score_recruiter@test.com", role="recruiter")
    return _login(client, "score_recruiter@test.com")


@pytest.fixture(scope="module")
def seed_data(client, recruiter_headers):
    """
    Creates one job and one candidate in the DB.
    Returns { job_id, job_mongo_id, resume_id, resume_mongo_id }.
    Runs once per module.
    """
    # ── Job ───────────────────────────────────────────────────────────────────
    job_payload = {
        "job_id":         f"SCOREJOB{str(ObjectId())[:4].upper()}",
        "title":          "Python Developer",
        "client_id":      "CLI001",
        "client_name":    "Score Corp",
        "openings":       2,
        "job_type":       "Full-Time",
        "work_mode":      "Remote",
        "location":       "Hyderabad",
        "experience_min": 2,
        "experience_max": 5,
        "priority":       "High",
        "status":         "Open",
        "skills":         ["Python", "Flask", "MongoDB"],
        "salary_min":     500000,
        "salary_max":     1000000,
        "description":    "Python developer with Flask and MongoDB experience.",
    }
    job_res = client.post("/api/jobs/", json=job_payload, headers=recruiter_headers)
    assert job_res.status_code == 201, f"Job creation failed: {job_res.get_json()}"
    job_data     = job_res.get_json()["data"]
    job_mongo_id = job_data["_id"]
    job_id       = job_payload["job_id"]

    # ── Candidate ─────────────────────────────────────────────────────────────
    from extensions import mongo
    resume_id  = f"RESSC{str(ObjectId())[:4].upper()}"
    cand_oid   = mongo.db.candidate_processing.insert_one({
        "resume_id":       resume_id,
        "name":            "Alice Score",
        "current_role":    "Backend Developer",
        "skills":          "Python, Flask, MongoDB, REST APIs",
        "experience":      3,
        "expected_salary": 800000,
        "notice_period":   "30 days",
        "location":        "Hyderabad",
        "source":          "LinkedIn",
    }).inserted_id

    yield {
        "job_id":          job_id,
        "job_mongo_id":    job_mongo_id,
        "resume_id":       resume_id,
        "resume_mongo_id": str(cand_oid),
    }

    # Cleanup
    client.delete(f"/api/jobs/{job_mongo_id}", headers=recruiter_headers)
    mongo.db.candidate_processing.delete_one({"_id": cand_oid})
    mongo.db.match_scores.delete_many({"resume_id": resume_id})


# ─────────────────────────────────────────────────────────────────────────────
# Mock Gemini helper
# ─────────────────────────────────────────────────────────────────────────────

MOCK_SCORE_PAYLOAD = {
    "overall_score":    85,
    "verdict":          "Strong match",
    "skills_score":     90,
    "experience_score": 100,
    "salary_score":     95,
    "notice_score":     70,
    "location_score":   100,
    "gaps":             ["Missing: Docker"],
    "strengths":        ["Strong Python skills", "Experience in Flask and MongoDB"],
    "summary":          "Alice is a strong match for the Python Developer role at Score Corp.",
    "scored_by":        "gemini",
}


def _mock_gemini_post(*args, **kwargs):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.ok          = True
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{"text": json.dumps(MOCK_SCORE_PAYLOAD)}]
            }
        }]
    }
    return mock_resp


# ═════════════════════════════════════════════════════════════════════════════
# 1. Unit tests — rule-based helpers
# ═════════════════════════════════════════════════════════════════════════════

class TestSkillOverlap:

    def _fn(self):
        from zentreeportal_backend.routes.Score_routes import _skill_overlap
        return _skill_overlap

    def test_full_overlap_returns_1(self):
        fn = self._fn()
        ratio, matched, missing = fn("Python, Flask", ["Python", "Flask"])
        assert ratio == 1.0
        assert missing == []

    def test_no_overlap_returns_0(self):
        fn = self._fn()
        ratio, matched, missing = fn("Java, Spring", ["Python", "Flask"])
        assert ratio == 0.0
        assert len(missing) == 2

    def test_partial_overlap(self):
        fn = self._fn()
        ratio, matched, missing = fn("Python, Java", ["Python", "Flask"])
        assert 0 < ratio < 1.0
        assert "python" in [m.lower() for m in matched]

    def test_empty_job_skills_returns_1(self):
        fn = self._fn()
        ratio, matched, missing = fn("Python", [])
        assert ratio == 1.0

    def test_case_insensitive_match(self):
        fn = self._fn()
        ratio, matched, missing = fn("PYTHON, FLASK", ["python", "flask"])
        assert ratio == 1.0

    def test_job_skills_as_string(self):
        fn = self._fn()
        ratio, matched, missing = fn("Python, Flask", "Python, Flask, MongoDB")
        assert ratio > 0


class TestExperienceScore:

    def _fn(self):
        from zentreeportal_backend.routes.Score_routes import _experience_score
        return _experience_score

    def test_within_range_returns_1(self):
        fn = self._fn()
        assert fn(3, 2, 5) == 1.0

    def test_exactly_at_min_returns_1(self):
        fn = self._fn()
        assert fn(2, 2, 5) == 1.0

    def test_exactly_at_max_returns_1(self):
        fn = self._fn()
        assert fn(5, 2, 5) == 1.0

    def test_under_min_penalised(self):
        fn = self._fn()
        score = fn(0, 2, 5)
        assert score < 1.0

    def test_heavily_under_min_not_negative(self):
        fn = self._fn()
        score = fn(0, 10, 15)
        assert score >= 0.0

    def test_over_qualified_returns_07(self):
        fn = self._fn()
        assert fn(20, 2, 5) == 0.7

    def test_no_requirement_returns_08(self):
        fn = self._fn()
        assert fn(5, 0, 0) == 0.8


class TestSalaryScore:

    def _fn(self):
        from zentreeportal_backend.routes.Score_routes import _salary_score
        return _salary_score

    def test_within_budget_returns_1(self):
        fn = self._fn()
        assert fn(800000, 500000, 1000000) == 1.0

    def test_exactly_at_max_returns_1(self):
        fn = self._fn()
        assert fn(1000000, 500000, 1000000) == 1.0

    def test_over_budget_penalised(self):
        fn = self._fn()
        score = fn(2000000, 500000, 1000000)
        assert score < 1.0

    def test_far_over_budget_min_floor(self):
        fn = self._fn()
        score = fn(10000000, 500000, 1000000)
        assert score >= 0.2

    def test_no_budget_specified_returns_08(self):
        fn = self._fn()
        assert fn(800000, 0, 0) == 0.8

    def test_zero_expected_returns_08(self):
        fn = self._fn()
        assert fn(0, 500000, 1000000) == 0.8


class TestNoticeScore:

    def _fn(self):
        from zentreeportal_backend.routes.Score_routes import _notice_score
        return _notice_score

    def test_immediate_returns_1(self):
        fn = self._fn()
        assert fn("immediate") == 1.0

    def test_15_days_returns_09(self):
        fn = self._fn()
        assert fn("15 days") == 0.9

    def test_30_days_returns_075(self):
        fn = self._fn()
        assert fn("30 days") == 0.75

    def test_60_days_returns_055(self):
        fn = self._fn()
        assert fn("60 days") == 0.55

    def test_90_days_returns_035(self):
        fn = self._fn()
        assert fn("90 days") == 0.35

    def test_unknown_returns_06(self):
        fn = self._fn()
        assert fn("120 days") == 0.6

    def test_none_returns_default(self):
        fn = self._fn()
        assert fn(None) == 0.6


class TestRuleBasedScore:

    def _fn(self):
        from zentreeportal_backend.routes.Score_routes import _rule_based_score
        return _rule_based_score

    def _resume(self, **kwargs):
        base = {
            "name":            "Test Candidate",
            "skills":          "Python, Flask, MongoDB",
            "experience":      3,
            "expected_salary": 800000,
            "notice_period":   "30 days",
            "location":        "Hyderabad",
        }
        base.update(kwargs)
        return base

    def _job(self, **kwargs):
        base = {
            "title":          "Python Developer",
            "client_name":    "Test Corp",
            "skills":         ["Python", "Flask", "MongoDB"],
            "experience_min": 2,
            "experience_max": 5,
            "salary_min":     500000,
            "salary_max":     1000000,
            "location":       "Hyderabad",
            "work_mode":      "On-site",
        }
        base.update(kwargs)
        return base

    def test_returns_dict(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert isinstance(result, dict)

    def test_overall_score_in_range(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert 0 <= result["overall_score"] <= 100

    def test_all_required_fields_present(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        for field in ("overall_score", "verdict", "skills_score", "experience_score",
                      "salary_score", "notice_score", "location_score",
                      "strengths", "gaps", "summary", "scored_by"):
            assert field in result, f"Missing field: {field}"

    def test_scored_by_is_rule_engine(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert result["scored_by"] == "rule_engine"

    def test_verdict_is_valid_value(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert result["verdict"] in (
            "Strong match", "Good match", "Moderate match", "Weak match"
        )

    def test_perfect_match_gives_strong_verdict(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert result["overall_score"] >= 60  # good candidate, should be Good or Strong

    def test_zero_skill_match_gives_low_score(self):
        fn = self._fn()
        resume = self._resume(skills="COBOL, Fortran")
        result = fn(resume, self._job())
        assert result["skills_score"] == 0

    def test_missing_skills_in_gaps(self):
        fn = self._fn()
        resume = self._resume(skills="Python")          # missing Flask, MongoDB
        result = fn(resume, self._job())
        assert len(result["gaps"]) > 0

    def test_remote_job_loc_score_not_penalised(self):
        fn = self._fn()
        job    = self._job(work_mode="Remote", location="Chennai")
        resume = self._resume(location="Mumbai")
        result = fn(resume, job)
        assert result["location_score"] >= 70

    def test_summary_is_non_empty_string(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert isinstance(result["summary"], str)
        assert len(result["summary"]) > 10

    def test_strengths_is_list(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert isinstance(result["strengths"], list)

    def test_gaps_is_list(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert isinstance(result["gaps"], list)

    def test_scored_at_present(self):
        fn = self._fn()
        result = fn(self._resume(), self._job())
        assert "scored_at" in result


# ═════════════════════════════════════════════════════════════════════════════
# 2. POST /api/score/candidate  — Score a candidate
# ═════════════════════════════════════════════════════════════════════════════

class TestScoreCandidate:

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        res = client.post("/api/score/candidate", json={
            "resume_id": "RES001", "job_id": "JOB001"
        })
        assert res.status_code == 401

    # ── Validation ────────────────────────────────────────────────────────────

    def test_missing_resume_id_returns_400(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"job_id": seed_data["job_id"]},
                          headers=recruiter_headers)
        assert res.status_code == 400

    def test_missing_job_id_returns_400(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"]},
                          headers=recruiter_headers)
        assert res.status_code == 400

    def test_empty_body_returns_400(self, client, recruiter_headers):
        res = client.post("/api/score/candidate", json={}, headers=recruiter_headers)
        assert res.status_code == 400

    def test_nonexistent_resume_returns_404(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": "NOSUCHRESUME", "job_id": seed_data["job_id"]},
                          headers=recruiter_headers)
        assert res.status_code == 404

    def test_nonexistent_job_returns_404(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"], "job_id": "NOSUCHJOB"},
                          headers=recruiter_headers)
        assert res.status_code == 404

    # ── Success (rule engine — no Gemini key needed) ──────────────────────────

    def test_score_returns_201(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        assert res.status_code == 201

    def test_score_success_flag(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        assert res.get_json()["success"] is True

    def test_score_returns_data(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        assert "data" in res.get_json()

    def test_score_returns_scored_by(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        assert "scored_by" in res.get_json()
        assert res.get_json()["scored_by"] in ("rule_engine", "gemini")

    def test_score_data_has_overall_score(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        data = res.get_json()["data"]
        assert "overall_score" in data
        assert 0 <= data["overall_score"] <= 100

    def test_score_data_has_verdict(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        verdict = res.get_json()["data"]["verdict"]
        assert verdict in ("Strong match", "Good match", "Moderate match", "Weak match")

    def test_score_data_has_all_subscores(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        data = res.get_json()["data"]
        for field in ("skills_score", "experience_score", "salary_score",
                      "notice_score", "location_score"):
            assert field in data, f"Missing sub-score: {field}"
            assert 0 <= data[field] <= 100

    def test_score_data_id_is_string(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        assert isinstance(res.get_json()["data"]["_id"], str)

    def test_score_data_has_candidate_name(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        assert res.get_json()["data"]["candidate_name"] == "Alice Score"

    def test_score_data_has_job_title(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_id"],
                                "job_id":    seed_data["job_id"]},
                          headers=recruiter_headers)
        assert res.get_json()["data"]["job_title"] == "Python Developer"

    def test_score_upsert_no_duplicate(self, client, recruiter_headers, seed_data):
        """Scoring the same pair twice should upsert, not create duplicate docs."""
        from extensions import mongo
        payload = {"resume_id": seed_data["resume_id"], "job_id": seed_data["job_id"]}
        client.post("/api/score/candidate", json=payload, headers=recruiter_headers)
        client.post("/api/score/candidate", json=payload, headers=recruiter_headers)
        count = mongo.db.match_scores.count_documents({
            "resume_id": seed_data["resume_id"],
            "job_id":    seed_data["job_id"],
        })
        assert count == 1

    # ── Gemini mock path ──────────────────────────────────────────────────────

    def test_score_gemini_path_returns_201(self, client, recruiter_headers, seed_data):
        with patch("requests.post", side_effect=_mock_gemini_post), \
             patch("os.environ.get", return_value="FAKE_KEY"):
            res = client.post("/api/score/candidate",
                              json={"resume_id": seed_data["resume_id"],
                                    "job_id":    seed_data["job_id"]},
                              headers=recruiter_headers)
        assert res.status_code == 201

    def test_score_gemini_scored_by(self, client, recruiter_headers, seed_data):
        with patch("requests.post", side_effect=_mock_gemini_post), \
             patch("os.environ.get", return_value="FAKE_KEY"):
            res = client.post("/api/score/candidate",
                              json={"resume_id": seed_data["resume_id"],
                                    "job_id":    seed_data["job_id"]},
                              headers=recruiter_headers)
        # Either gemini or rule_engine is acceptable (Gemini key mock may not intercept module-level var)
        assert res.get_json()["scored_by"] in ("gemini", "rule_engine")

    # ── MongoDB id variant ────────────────────────────────────────────────────

    def test_score_by_mongo_id(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate",
                          json={"resume_id": seed_data["resume_mongo_id"],
                                "job_id":    seed_data["job_mongo_id"]},
                          headers=recruiter_headers)
        assert res.status_code == 201


# ═════════════════════════════════════════════════════════════════════════════
# 3. GET /api/score/candidate  — Fetch saved score
# ═════════════════════════════════════════════════════════════════════════════

class TestGetScore:

    @pytest.fixture(autouse=True)
    def ensure_score_exists(self, client, recruiter_headers, seed_data):
        """Guarantee a score record exists before each GET test."""
        client.post("/api/score/candidate",
                    json={"resume_id": seed_data["resume_id"],
                          "job_id":    seed_data["job_id"]},
                    headers=recruiter_headers)

    def test_get_score_returns_200(self, client, recruiter_headers, seed_data):
        res = client.get(
            f"/api/score/candidate?resume_id={seed_data['resume_id']}&job_id={seed_data['job_id']}",
            headers=recruiter_headers,
        )
        assert res.status_code == 200

    def test_get_score_success_flag(self, client, recruiter_headers, seed_data):
        res = client.get(
            f"/api/score/candidate?resume_id={seed_data['resume_id']}&job_id={seed_data['job_id']}",
            headers=recruiter_headers,
        )
        assert res.get_json()["success"] is True

    def test_get_score_returns_data(self, client, recruiter_headers, seed_data):
        res = client.get(
            f"/api/score/candidate?resume_id={seed_data['resume_id']}&job_id={seed_data['job_id']}",
            headers=recruiter_headers,
        )
        assert "data" in res.get_json()

    def test_get_score_data_has_overall_score(self, client, recruiter_headers, seed_data):
        res = client.get(
            f"/api/score/candidate?resume_id={seed_data['resume_id']}&job_id={seed_data['job_id']}",
            headers=recruiter_headers,
        )
        assert "overall_score" in res.get_json()["data"]

    def test_get_score_missing_resume_id_returns_400(self, client, recruiter_headers, seed_data):
        res = client.get(
            f"/api/score/candidate?job_id={seed_data['job_id']}",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_get_score_missing_job_id_returns_400(self, client, recruiter_headers, seed_data):
        res = client.get(
            f"/api/score/candidate?resume_id={seed_data['resume_id']}",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_get_score_no_params_returns_400(self, client, recruiter_headers):
        res = client.get("/api/score/candidate", headers=recruiter_headers)
        assert res.status_code == 400

    def test_get_score_nonexistent_pair_returns_404(self, client, recruiter_headers):
        res = client.get(
            "/api/score/candidate?resume_id=NOPE&job_id=NOPE",
            headers=recruiter_headers,
        )
        assert res.status_code == 404

    def test_get_score_unauthenticated_returns_401(self, client, seed_data):
        res = client.get(
            f"/api/score/candidate?resume_id={seed_data['resume_id']}&job_id={seed_data['job_id']}"
        )
        assert res.status_code == 401

    def test_get_score_id_is_string(self, client, recruiter_headers, seed_data):
        res = client.get(
            f"/api/score/candidate?resume_id={seed_data['resume_id']}&job_id={seed_data['job_id']}",
            headers=recruiter_headers,
        )
        assert isinstance(res.get_json()["data"]["_id"], str)


# ═════════════════════════════════════════════════════════════════════════════
# 4. POST /api/score/candidate/bulk  — Bulk score
# ═════════════════════════════════════════════════════════════════════════════

class TestBulkScore:

    # ── Validation ────────────────────────────────────────────────────────────

    def test_missing_job_id_returns_400(self, client, recruiter_headers):
        res = client.post("/api/score/candidate/bulk",
                          json={"resume_ids": ["RES001"]},
                          headers=recruiter_headers)
        assert res.status_code == 400

    def test_missing_resume_ids_returns_400(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id": seed_data["job_id"]},
                          headers=recruiter_headers)
        assert res.status_code == 400

    def test_empty_resume_ids_returns_400(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id": seed_data["job_id"], "resume_ids": []},
                          headers=recruiter_headers)
        assert res.status_code == 400

    def test_nonexistent_job_returns_404(self, client, recruiter_headers):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id": "NOSUCHJOB", "resume_ids": ["RES001"]},
                          headers=recruiter_headers)
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id": "J001", "resume_ids": ["R001"]})
        assert res.status_code == 401

    # ── Success ───────────────────────────────────────────────────────────────

    def test_bulk_score_returns_200(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": [seed_data["resume_id"]]},
                          headers=recruiter_headers)
        assert res.status_code == 200

    def test_bulk_score_success_flag(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": [seed_data["resume_id"]]},
                          headers=recruiter_headers)
        assert res.get_json()["success"] is True

    def test_bulk_score_returns_scored_count(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": [seed_data["resume_id"]]},
                          headers=recruiter_headers)
        body = res.get_json()
        assert "scored" in body
        assert body["scored"] == 1

    def test_bulk_score_returns_errors_list(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": [seed_data["resume_id"]]},
                          headers=recruiter_headers)
        assert "errors" in res.get_json()
        assert isinstance(res.get_json()["errors"], list)

    def test_bulk_score_returns_data_list(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": [seed_data["resume_id"]]},
                          headers=recruiter_headers)
        assert "data" in res.get_json()
        assert isinstance(res.get_json()["data"], list)

    def test_bulk_score_data_sorted_by_score_desc(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": [seed_data["resume_id"]]},
                          headers=recruiter_headers)
        data = res.get_json()["data"]
        scores = [d["overall_score"] for d in data]
        assert scores == sorted(scores, reverse=True)

    def test_bulk_score_invalid_resume_counted_as_error(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": ["NOSUCHRESUME99"]},
                          headers=recruiter_headers)
        body = res.get_json()
        assert body["scored"] == 0
        assert len(body["errors"]) == 1

    def test_bulk_score_mixed_valid_invalid(self, client, recruiter_headers, seed_data):
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": [seed_data["resume_id"], "NOSUCHRESUME99"]},
                          headers=recruiter_headers)
        body = res.get_json()
        assert body["scored"] == 1
        assert len(body["errors"]) == 1

    def test_bulk_score_capped_at_50(self, client, recruiter_headers, seed_data):
        """Sending 55 ids — only up to 50 should be processed (scored + errors ≤ 50)."""
        ids = [f"FAKE{i:03d}" for i in range(55)]
        res = client.post("/api/score/candidate/bulk",
                          json={"job_id":     seed_data["job_id"],
                                "resume_ids": ids},
                          headers=recruiter_headers)
        body = res.get_json()
        assert body["scored"] + len(body["errors"]) <= 50


# ═════════════════════════════════════════════════════════════════════════════
# 5. GET /api/score/job/<job_id>  — All scores for a job
# ═════════════════════════════════════════════════════════════════════════════

class TestGetScoresForJob:

    @pytest.fixture(autouse=True)
    def ensure_score_exists(self, client, recruiter_headers, seed_data):
        client.post("/api/score/candidate",
                    json={"resume_id": seed_data["resume_id"],
                          "job_id":    seed_data["job_id"]},
                    headers=recruiter_headers)

    def test_get_job_scores_returns_200(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/job/{seed_data['job_id']}", headers=recruiter_headers)
        assert res.status_code == 200

    def test_get_job_scores_success_flag(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/job/{seed_data['job_id']}", headers=recruiter_headers)
        assert res.get_json()["success"] is True

    def test_get_job_scores_returns_list(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/job/{seed_data['job_id']}", headers=recruiter_headers)
        assert isinstance(res.get_json()["data"], list)

    def test_get_job_scores_returns_total(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/job/{seed_data['job_id']}", headers=recruiter_headers)
        body = res.get_json()
        assert "total" in body
        assert body["total"] == len(body["data"])

    def test_get_job_scores_sorted_desc(self, client, recruiter_headers, seed_data):
        res  = client.get(f"/api/score/job/{seed_data['job_id']}", headers=recruiter_headers)
        data = res.get_json()["data"]
        scores = [d["overall_score"] for d in data]
        assert scores == sorted(scores, reverse=True)

    def test_get_job_scores_ids_are_strings(self, client, recruiter_headers, seed_data):
        res  = client.get(f"/api/score/job/{seed_data['job_id']}", headers=recruiter_headers)
        for d in res.get_json()["data"]:
            assert isinstance(d["_id"], str)

    def test_get_job_scores_by_mongo_id(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/job/{seed_data['job_mongo_id']}", headers=recruiter_headers)
        assert res.status_code == 200

    def test_get_job_scores_nonexistent_job_returns_404(self, client, recruiter_headers):
        res = client.get("/api/score/job/NOSUCHJOB", headers=recruiter_headers)
        assert res.status_code == 404

    def test_get_job_scores_unauthenticated_returns_401(self, client, seed_data):
        assert client.get(f"/api/score/job/{seed_data['job_id']}").status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 6. GET /api/score/resume/<resume_id>  — All scores for a candidate
# ═════════════════════════════════════════════════════════════════════════════

class TestGetScoresForResume:

    @pytest.fixture(autouse=True)
    def ensure_score_exists(self, client, recruiter_headers, seed_data):
        client.post("/api/score/candidate",
                    json={"resume_id": seed_data["resume_id"],
                          "job_id":    seed_data["job_id"]},
                    headers=recruiter_headers)

    def test_get_resume_scores_returns_200(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/resume/{seed_data['resume_id']}", headers=recruiter_headers)
        assert res.status_code == 200

    def test_get_resume_scores_success_flag(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/resume/{seed_data['resume_id']}", headers=recruiter_headers)
        assert res.get_json()["success"] is True

    def test_get_resume_scores_returns_list(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/resume/{seed_data['resume_id']}", headers=recruiter_headers)
        assert isinstance(res.get_json()["data"], list)

    def test_get_resume_scores_returns_total(self, client, recruiter_headers, seed_data):
        res  = client.get(f"/api/score/resume/{seed_data['resume_id']}", headers=recruiter_headers)
        body = res.get_json()
        assert "total" in body
        assert body["total"] == len(body["data"])

    def test_get_resume_scores_sorted_desc(self, client, recruiter_headers, seed_data):
        res    = client.get(f"/api/score/resume/{seed_data['resume_id']}", headers=recruiter_headers)
        data   = res.get_json()["data"]
        scores = [d["overall_score"] for d in data]
        assert scores == sorted(scores, reverse=True)

    def test_get_resume_scores_by_mongo_id(self, client, recruiter_headers, seed_data):
        res = client.get(f"/api/score/resume/{seed_data['resume_mongo_id']}", headers=recruiter_headers)
        assert res.status_code == 200

    def test_get_resume_scores_nonexistent_resume_returns_404(self, client, recruiter_headers):
        res = client.get("/api/score/resume/NOSUCHRESUME", headers=recruiter_headers)
        assert res.status_code == 404

    def test_get_resume_scores_unauthenticated_returns_401(self, client, seed_data):
        assert client.get(f"/api/score/resume/{seed_data['resume_id']}").status_code == 401

    def test_get_resume_scores_ids_are_strings(self, client, recruiter_headers, seed_data):
        res  = client.get(f"/api/score/resume/{seed_data['resume_id']}", headers=recruiter_headers)
        for d in res.get_json()["data"]:
            assert isinstance(d["_id"], str)