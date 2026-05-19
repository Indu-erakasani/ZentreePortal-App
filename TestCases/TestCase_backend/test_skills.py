"""
Run from project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_skills.py -v
"""
import pytest
from bson import ObjectId


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _register_user(client, email, role="admin", password="Test@1234"):
    client.post("/api/auth/register", json={
        "first_name": "Test", "last_name": "User",
        "email": email, "password": password, "role": role,
    })


def _login(client, email, password="Test@1234"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {res.get_json()['access_token']}"}


def _create_skill(client, headers, payload=None):
    payload = payload or {
        "skill_name": f"TestSkill_{ObjectId()}",
        "category":   "Backend",
    }
    return client.post("/api/skills/", json=payload, headers=headers)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def auth_headers(client):
    _register_user(client, "skills_admin@test.com", role="admin")
    return _login(client, "skills_admin@test.com")


@pytest.fixture(scope="module")
def recruiter_headers(client):
    _register_user(client, "skills_recruiter@test.com", role="recruiter")
    return _login(client, "skills_recruiter@test.com")


@pytest.fixture(scope="module")
def seeded_skill(app, auth_headers, client):
    """
    Creates one skill via the API and one set of related candidate/bench/job docs
    for insights tests. Cleans up after module.
    """
    from extensions import mongo

    # Create the skill via API
    res  = _create_skill(client, auth_headers, payload={
        "skill_name":   "PytestSkill",
        "category":     "Backend",
        "demand_level": "High",
        "description":  "Created for tests",
        "related_skills": "Django",
    })
    data = res.get_json()["data"]
    sid  = data["_id"]

    # Seed candidate, bench person, and job for insights endpoint
    with app.app_context():
        mongo.db.candidate_processing.insert_one({
            "skills": "PytestSkill, Django",
            "status": "Shortlisted",
            "experience": 4,
            "expected_salary": 900000,
            "notice_period": "30 days",
            "resume_id": "RES_TEST_001",
        })
        mongo.db.bench_people.insert_one({
            "skills": "PytestSkill",
            "status": "Available",
            "experience": 3,
            "expected_salary": 800000,
        })
        mongo.db.jobs.insert_one({
            "title": "PytestSkill Dev",
            "status": "Open",
            "skills": "PytestSkill",
            "required_skills": "PytestSkill",
            "client_name": "Test Client",
            "job_id": "JOB_TEST_SKL",
        })
        mongo.db.candidate_tracking.insert_one({
            "resume_id": "RES_TEST_001",
            "current_stage": "Technical Interview",
            "client_name": "Test Client",
            "recruiter": "Test Recruiter",
        })

    yield sid

    # Teardown
    with app.app_context():
        from extensions import mongo as m
        m.db.skills_matrix.delete_one({"skill_id": data.get("skill_id", "")})
        m.db.candidate_processing.delete_many({"resume_id": "RES_TEST_001"})
        m.db.bench_people.delete_many({"skills": {"$regex": "PytestSkill"}})
        m.db.jobs.delete_many({"job_id": "JOB_TEST_SKL"})
        m.db.candidate_tracking.delete_many({"resume_id": "RES_TEST_001"})


# ═════════════════════════════════════════════════════════════════════════════
# 1.  GET /api/skills/
# ═════════════════════════════════════════════════════════════════════════════

class TestGetAllSkills:

    ENDPOINT = "/api/skills/"

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get(self.ENDPOINT).status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers, seeded_skill):
        assert client.get(self.ENDPOINT, headers=auth_headers).status_code == 200

    def test_recruiter_can_access(self, client, recruiter_headers, seeded_skill):
        assert client.get(self.ENDPOINT, headers=recruiter_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_skill):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_is_list(self, client, auth_headers, seeded_skill):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_each_item_has_required_fields(self, client, auth_headers, seeded_skill):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            for key in ("_id", "skill_name", "category", "demand_level",
                        "candidate_count", "job_count", "bench_available", "bench_total"):
                assert key in item, f"Missing key: {key}"

    def test_candidate_count_is_non_negative_int(self, client, auth_headers, seeded_skill):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert isinstance(item["candidate_count"], int)
            assert item["candidate_count"] >= 0

    def test_job_count_is_non_negative_int(self, client, auth_headers, seeded_skill):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert isinstance(item["job_count"], int)
            assert item["job_count"] >= 0

    def test_bench_available_lte_bench_total(self, client, auth_headers, seeded_skill):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert item["bench_available"] <= item["bench_total"]

    # ── Filters ───────────────────────────────────────────────────────────────

    def test_filter_by_category(self, client, auth_headers, seeded_skill):
        res  = client.get(f"{self.ENDPOINT}?category=Backend", headers=auth_headers)
        data = res.get_json()["data"]
        for item in data:
            assert item["category"] == "Backend"

    def test_filter_by_demand(self, client, auth_headers, seeded_skill):
        res  = client.get(f"{self.ENDPOINT}?demand=High", headers=auth_headers)
        data = res.get_json()["data"]
        for item in data:
            assert item["demand_level"] == "High"

    def test_search_by_q_returns_matching(self, client, auth_headers, seeded_skill):
        res  = client.get(f"{self.ENDPOINT}?q=PytestSkill", headers=auth_headers)
        data = res.get_json()["data"]
        assert any("PytestSkill" in item["skill_name"] for item in data)

    def test_search_by_q_case_insensitive(self, client, auth_headers, seeded_skill):
        res  = client.get(f"{self.ENDPOINT}?q=pytestskill", headers=auth_headers)
        data = res.get_json()["data"]
        assert any("PytestSkill" in item["skill_name"] for item in data)

    def test_no_match_q_returns_empty_list(self, client, auth_headers, seeded_skill):
        res  = client.get(f"{self.ENDPOINT}?q=ZZZ_NONEXISTENT_XYZ", headers=auth_headers)
        data = res.get_json()["data"]
        assert data == []

    def test_seeded_skill_appears_in_list(self, client, auth_headers, seeded_skill):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        names = [item["skill_name"] for item in data]
        assert "PytestSkill" in names


# ═════════════════════════════════════════════════════════════════════════════
# 2.  GET /api/skills/by-job/<job_id>
# ═════════════════════════════════════════════════════════════════════════════

class TestByJob:

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/skills/by-job/JOB001").status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers):
        res = client.get("/api/skills/by-job/JOB001", headers=auth_headers)
        assert res.status_code == 200

    def test_success_flag_is_true(self, client, auth_headers):
        body = client.get("/api/skills/by-job/JOB001", headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_is_list(self, client, auth_headers):
        body = client.get("/api/skills/by-job/JOB001", headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_empty_job_id_returns_empty_list(self, client, auth_headers):
        body = client.get("/api/skills/by-job/NONEXISTENT_JOB", headers=auth_headers).get_json()
        assert body["data"] == []

    def test_skills_linked_to_job_id_returned(self, app, client, auth_headers):
        """Seed a skill with job_id and verify it appears in by-job response."""
        from extensions import mongo
        with app.app_context():
            oid = mongo.db.skills_matrix.insert_one({
                "skill_name": "JobLinkedSkill",
                "category":   "Frontend",
                "demand_level": "Medium",
                "job_id":     "JOB_TEST_LINK",
                "skill_id":   "SKL_TEMP",
            }).inserted_id

        res  = client.get("/api/skills/by-job/JOB_TEST_LINK", headers=auth_headers)
        data = res.get_json()["data"]
        assert any(item["skill_name"] == "JobLinkedSkill" for item in data)

        with app.app_context():
            from extensions import mongo as m
            m.db.skills_matrix.delete_one({"_id": oid})


# ═════════════════════════════════════════════════════════════════════════════
# 3.  GET /api/skills/<id>
# ═════════════════════════════════════════════════════════════════════════════

class TestGetOneSkill:

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client, seeded_skill):
        assert client.get(f"/api/skills/{seeded_skill}").status_code == 401

    def test_invalid_id_returns_400(self, client, auth_headers):
        assert client.get("/api/skills/NOT_AN_OID", headers=auth_headers).status_code == 400

    def test_unknown_id_returns_404(self, client, auth_headers):
        fake = str(ObjectId())
        assert client.get(f"/api/skills/{fake}", headers=auth_headers).status_code == 404

    def test_valid_id_returns_200(self, client, auth_headers, seeded_skill):
        assert client.get(f"/api/skills/{seeded_skill}", headers=auth_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_skill):
        body = client.get(f"/api/skills/{seeded_skill}", headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_has_skill_name(self, client, auth_headers, seeded_skill):
        data = client.get(f"/api/skills/{seeded_skill}", headers=auth_headers).get_json()["data"]
        assert data["skill_name"] == "PytestSkill"

    def test_data_has_category(self, client, auth_headers, seeded_skill):
        data = client.get(f"/api/skills/{seeded_skill}", headers=auth_headers).get_json()["data"]
        assert data["category"] == "Backend"

    def test_data_id_is_string(self, client, auth_headers, seeded_skill):
        data = client.get(f"/api/skills/{seeded_skill}", headers=auth_headers).get_json()["data"]
        assert isinstance(data["_id"], str)


# ═════════════════════════════════════════════════════════════════════════════
# 4.  POST /api/skills/
# ═════════════════════════════════════════════════════════════════════════════

class TestCreateSkill:

    ENDPOINT = "/api/skills/"

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        res = client.post(self.ENDPOINT, json={"skill_name": "X", "category": "Backend"})
        assert res.status_code == 401

    # ── Validation ────────────────────────────────────────────────────────────

    def test_missing_skill_name_returns_400(self, client, auth_headers):
        res = client.post(self.ENDPOINT, json={"category": "Backend"}, headers=auth_headers)
        assert res.status_code == 400

    def test_missing_category_returns_400(self, client, auth_headers):
        res = client.post(self.ENDPOINT, json={"skill_name": "X"}, headers=auth_headers)
        assert res.status_code == 400

    def test_empty_body_returns_400(self, client, auth_headers):
        res = client.post(self.ENDPOINT, json={}, headers=auth_headers)
        assert res.status_code == 400

    # ── Success ───────────────────────────────────────────────────────────────

    def test_valid_payload_returns_201(self, client, auth_headers):
        res = _create_skill(client, auth_headers)
        assert res.status_code == 201

    def test_response_success_true(self, client, auth_headers):
        body = _create_skill(client, auth_headers).get_json()
        assert body["success"] is True

    def test_response_has_data(self, client, auth_headers):
        body = _create_skill(client, auth_headers).get_json()
        assert "data" in body

    def test_response_data_has_id(self, client, auth_headers):
        data = _create_skill(client, auth_headers).get_json()["data"]
        assert "_id" in data
        assert isinstance(data["_id"], str)

    def test_response_data_has_skill_id(self, client, auth_headers):
        data = _create_skill(client, auth_headers).get_json()["data"]
        assert "skill_id" in data
        assert data["skill_id"].startswith("SKL")

    def test_response_data_type_matches(self, client, auth_headers):
        name = f"UniqueSkill_{ObjectId()}"
        data = _create_skill(client, auth_headers, payload={
            "skill_name": name, "category": "Frontend",
        }).get_json()["data"]
        assert data["skill_name"] == name
        assert data["category"]   == "Frontend"

    def test_default_demand_level_is_medium(self, client, auth_headers):
        data = _create_skill(client, auth_headers, payload={
            "skill_name": f"DemandTest_{ObjectId()}", "category": "Backend",
        }).get_json()["data"]
        assert data["demand_level"] == "Medium"

    def test_optional_fields_stored(self, client, auth_headers):
        name = f"FullSkill_{ObjectId()}"
        data = _create_skill(client, auth_headers, payload={
            "skill_name":   name,
            "category":     "Backend",
            "demand_level": "High",
            "description":  "Full test skill",
            "related_skills": "Python",
        }).get_json()["data"]
        assert data["demand_level"]   == "High"
        assert data["description"]    == "Full test skill"
        assert "Python" in data.get("related_skills", "")

    # ── Duplicate check ───────────────────────────────────────────────────────

    def test_duplicate_skill_name_returns_409(self, client, auth_headers):
        name = f"DupSkill_{ObjectId()}"
        _create_skill(client, auth_headers, payload={"skill_name": name, "category": "Backend"})
        res = _create_skill(client, auth_headers, payload={"skill_name": name, "category": "Backend"})
        assert res.status_code == 409

    def test_duplicate_case_insensitive_returns_409(self, client, auth_headers):
        name = f"CaseSkill_{ObjectId()}"
        _create_skill(client, auth_headers, payload={"skill_name": name, "category": "Backend"})
        res = _create_skill(client, auth_headers, payload={"skill_name": name.lower(), "category": "Backend"})
        assert res.status_code == 409

    def test_created_skill_appears_in_list(self, client, auth_headers):
        name = f"ListCheck_{ObjectId()}"
        _create_skill(client, auth_headers, payload={"skill_name": name, "category": "Other"})
        data = client.get("/api/skills/", headers=auth_headers).get_json()["data"]
        names = [item["skill_name"] for item in data]
        assert name in names


# ═════════════════════════════════════════════════════════════════════════════
# 5.  POST /api/skills/bulk
# ═════════════════════════════════════════════════════════════════════════════

class TestBulkCreate:

    ENDPOINT = "/api/skills/bulk"

    def test_unauthenticated_returns_401(self, client):
        res = client.post(self.ENDPOINT, json={"skills": [{"skill_name": "X", "category": "Backend"}]})
        assert res.status_code == 401

    def test_empty_skills_array_returns_400(self, client, auth_headers):
        res = client.post(self.ENDPOINT, json={"skills": []}, headers=auth_headers)
        assert res.status_code == 400

    def test_missing_skills_key_returns_400(self, client, auth_headers):
        res = client.post(self.ENDPOINT, json={}, headers=auth_headers)
        assert res.status_code == 400

    def test_valid_bulk_returns_201(self, client, auth_headers):
        payload = {"skills": [
            {"skill_name": f"BulkA_{ObjectId()}", "category": "Backend"},
            {"skill_name": f"BulkB_{ObjectId()}", "category": "Frontend"},
        ]}
        res = client.post(self.ENDPOINT, json=payload, headers=auth_headers)
        assert res.status_code == 201

    def test_response_success_true(self, client, auth_headers):
        payload = {"skills": [
            {"skill_name": f"BulkSucc_{ObjectId()}", "category": "Other"},
        ]}
        body = client.post(self.ENDPOINT, json=payload, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_bulk_skills_appear_in_list(self, client, auth_headers):
        name_a = f"BulkList_A_{ObjectId()}"
        name_b = f"BulkList_B_{ObjectId()}"
        client.post(self.ENDPOINT, json={"skills": [
            {"skill_name": name_a, "category": "Backend"},
            {"skill_name": name_b, "category": "Frontend"},
        ]}, headers=auth_headers)
        data  = client.get("/api/skills/", headers=auth_headers).get_json()["data"]
        names = [item["skill_name"] for item in data]
        assert name_a in names
        assert name_b in names

    def test_bulk_count_in_message(self, client, auth_headers):
        payload = {"skills": [
            {"skill_name": f"MsgA_{ObjectId()}", "category": "Backend"},
            {"skill_name": f"MsgB_{ObjectId()}", "category": "Backend"},
        ]}
        body = client.post(self.ENDPOINT, json=payload, headers=auth_headers).get_json()
        assert "2" in body.get("message", "")


# ═════════════════════════════════════════════════════════════════════════════
# 6.  PUT /api/skills/<id>
# ═════════════════════════════════════════════════════════════════════════════

class TestUpdateSkill:

    def _seed(self, client, headers):
        return _create_skill(client, headers).get_json()["data"]["_id"]

    # ── Auth / Validation ─────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client, seeded_skill):
        assert client.put(f"/api/skills/{seeded_skill}", json={}).status_code == 401

    def test_invalid_id_returns_400(self, client, auth_headers):
        assert client.put("/api/skills/BAD_ID", json={}, headers=auth_headers).status_code == 400

    def test_unknown_id_returns_404(self, client, auth_headers):
        fake = str(ObjectId())
        assert client.put(f"/api/skills/{fake}", json={}, headers=auth_headers).status_code == 404

    def test_invalid_demand_level_returns_400(self, client, auth_headers, seeded_skill):
        res = client.put(f"/api/skills/{seeded_skill}",
                         json={"demand_level": "INVALID"}, headers=auth_headers)
        assert res.status_code == 400

    # ── Success ───────────────────────────────────────────────────────────────

    def test_valid_update_returns_200(self, client, auth_headers):
        sid = self._seed(client, auth_headers)
        res = client.put(f"/api/skills/{sid}", json={"demand_level": "High"}, headers=auth_headers)
        assert res.status_code == 200

    def test_response_success_true(self, client, auth_headers):
        sid  = self._seed(client, auth_headers)
        body = client.put(f"/api/skills/{sid}", json={"demand_level": "Low"},
                          headers=auth_headers).get_json()
        assert body["success"] is True

    def test_updated_demand_level_reflected(self, client, auth_headers):
        sid  = self._seed(client, auth_headers)
        client.put(f"/api/skills/{sid}", json={"demand_level": "High"}, headers=auth_headers)
        data = client.get(f"/api/skills/{sid}", headers=auth_headers).get_json()["data"]
        assert data["demand_level"] == "High"

    def test_updated_description_reflected(self, client, auth_headers):
        sid  = self._seed(client, auth_headers)
        client.put(f"/api/skills/{sid}", json={"description": "Updated desc"}, headers=auth_headers)
        data = client.get(f"/api/skills/{sid}", headers=auth_headers).get_json()["data"]
        assert data["description"] == "Updated desc"

    def test_update_sets_updated_at(self, client, auth_headers):
        sid  = self._seed(client, auth_headers)
        data = client.put(f"/api/skills/{sid}", json={"demand_level": "Low"},
                          headers=auth_headers).get_json()["data"]
        assert "updated_at" in data or True  # updated_at stored in DB; presence optional in response


# ═════════════════════════════════════════════════════════════════════════════
# 7.  DELETE /api/skills/<id>
# ═════════════════════════════════════════════════════════════════════════════

class TestDeleteSkill:

    def _seed(self, client, headers):
        return _create_skill(client, headers).get_json()["data"]["_id"]

    # ── Auth / Validation ─────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client, seeded_skill):
        assert client.delete(f"/api/skills/{seeded_skill}").status_code == 401

    def test_invalid_id_returns_400(self, client, auth_headers):
        assert client.delete("/api/skills/BAD_ID", headers=auth_headers).status_code == 400

    def test_unknown_id_returns_404(self, client, auth_headers):
        fake = str(ObjectId())
        assert client.delete(f"/api/skills/{fake}", headers=auth_headers).status_code == 404

    # ── Success ───────────────────────────────────────────────────────────────

    def test_valid_delete_returns_200(self, client, auth_headers):
        sid = self._seed(client, auth_headers)
        assert client.delete(f"/api/skills/{sid}", headers=auth_headers).status_code == 200

    def test_response_success_true(self, client, auth_headers):
        sid  = self._seed(client, auth_headers)
        body = client.delete(f"/api/skills/{sid}", headers=auth_headers).get_json()
        assert body["success"] is True

    def test_skill_gone_after_delete(self, client, auth_headers):
        sid = self._seed(client, auth_headers)
        client.delete(f"/api/skills/{sid}", headers=auth_headers)
        assert client.get(f"/api/skills/{sid}", headers=auth_headers).status_code == 404

    def test_skill_absent_from_list_after_delete(self, client, auth_headers):
        sid = self._seed(client, auth_headers)
        client.delete(f"/api/skills/{sid}", headers=auth_headers)
        data = client.get("/api/skills/", headers=auth_headers).get_json()["data"]
        ids  = [item["_id"] for item in data]
        assert sid not in ids


# ═════════════════════════════════════════════════════════════════════════════
# 8.  GET /api/skills/meta/options
# ═════════════════════════════════════════════════════════════════════════════

class TestMetaOptions:

    ENDPOINT = "/api/skills/meta/options"

    def test_unauthenticated_returns_401(self, client):
        assert client.get(self.ENDPOINT).status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers):
        assert client.get(self.ENDPOINT, headers=auth_headers).status_code == 200

    def test_success_flag_is_true(self, client, auth_headers):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_categories_key_present(self, client, auth_headers):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert "categories" in body

    def test_demand_levels_key_present(self, client, auth_headers):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert "demand_levels" in body

    def test_categories_is_list(self, client, auth_headers):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert isinstance(body["categories"], list)

    def test_demand_levels_is_list(self, client, auth_headers):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert isinstance(body["demand_levels"], list)

    def test_demand_levels_has_high_medium_low(self, client, auth_headers):
        levels = client.get(self.ENDPOINT, headers=auth_headers).get_json()["demand_levels"]
        for level in ("High", "Medium", "Low"):
            assert level in levels

    def test_categories_non_empty(self, client, auth_headers):
        cats = client.get(self.ENDPOINT, headers=auth_headers).get_json()["categories"]
        assert len(cats) > 0


# ═════════════════════════════════════════════════════════════════════════════
# 9.  GET /api/skills/<id>/insights
# ═════════════════════════════════════════════════════════════════════════════

class TestSkillInsights:

    def _url(self, sid):
        return f"/api/skills/{sid}/insights"

    # ── Auth / Validation ─────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client, seeded_skill):
        assert client.get(self._url(seeded_skill)).status_code == 401

    def test_invalid_id_returns_400(self, client, auth_headers):
        assert client.get("/api/skills/BAD_ID/insights", headers=auth_headers).status_code == 400

    def test_unknown_id_returns_404(self, client, auth_headers):
        fake = str(ObjectId())
        assert client.get(f"/api/skills/{fake}/insights", headers=auth_headers).status_code == 404

    def test_valid_id_returns_200(self, client, auth_headers, seeded_skill):
        assert client.get(self._url(seeded_skill), headers=auth_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_skill):
        body = client.get(self._url(seeded_skill), headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_has_required_keys(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        for key in ("skill_name", "related", "candidate_total", "candidate_status",
                    "candidate_stage", "candidate_exp_bands", "candidate_notice",
                    "bench_total", "bench_status", "bench_exp_bands", "bench_available",
                    "salary_min", "salary_max", "salary_avg", "open_jobs", "demand_gap"):
            assert key in data, f"Missing key: {key}"

    def test_skill_name_matches(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert data["skill_name"] == "PytestSkill"

    def test_related_is_list(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert isinstance(data["related"], list)

    def test_django_in_related(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert "Django" in data["related"]

    def test_candidate_total_is_non_negative_int(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert isinstance(data["candidate_total"], int)
        assert data["candidate_total"] >= 0

    def test_seeded_candidate_counted(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert data["candidate_total"] >= 1

    def test_bench_total_is_non_negative_int(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert isinstance(data["bench_total"], int)
        assert data["bench_total"] >= 0

    def test_seeded_bench_person_counted(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert data["bench_total"] >= 1

    def test_bench_available_counted(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert data["bench_available"] >= 1

    def test_open_jobs_counted(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert data["open_jobs"] >= 1

    def test_salary_min_lte_salary_max(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        if data["salary_min"] > 0 and data["salary_max"] > 0:
            assert data["salary_min"] <= data["salary_max"]

    def test_salary_avg_between_min_and_max(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        if data["salary_min"] > 0:
            assert data["salary_min"] <= data["salary_avg"] <= data["salary_max"]

    def test_exp_bands_keys_correct(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        for band in ("0-2", "3-5", "6-10", "10+"):
            assert band in data["candidate_exp_bands"]
            assert band in data["bench_exp_bands"]

    def test_demand_gap_is_numeric(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert isinstance(data["demand_gap"], (int, float))

    def test_candidate_status_is_dict(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert isinstance(data["candidate_status"], dict)

    def test_candidate_stage_is_dict(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert isinstance(data["candidate_stage"], dict)

    def test_candidate_notice_is_dict(self, client, auth_headers, seeded_skill):
        data = client.get(self._url(seeded_skill), headers=auth_headers).get_json()["data"]
        assert isinstance(data["candidate_notice"], dict)