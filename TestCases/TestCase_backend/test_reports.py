"""
Run from project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_reports.py -v
"""
import pytest
from datetime import datetime, timedelta
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


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def auth_headers(client):
    _register_user(client, "reports_admin@test.com", role="admin")
    return _login(client, "reports_admin@test.com")


@pytest.fixture(scope="module")
def recruiter_headers(client):
    _register_user(client, "reports_recruiter@test.com", role="recruiter")
    return _login(client, "reports_recruiter@test.com")


@pytest.fixture(scope="module")
def seeded_data(app):
    """
    Inserts a minimal but complete set of documents across all collections
    touched by reports endpoints. Cleans up after the module.
    """
    from extensions import mongo

    now      = datetime.utcnow()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    joining  = this_month_start + timedelta(days=2)

    ids = {}

    with app.app_context():
        # ── Jobs ──────────────────────────────────────────────────────────────
        j1 = mongo.db.jobs.insert_one({
            "title": "Python Developer", "status": "Open",
            "client_name": "Acme Corp", "client_id": "CLI001",
            "posted_by_name": "Alice Recruiter",
            "required_skills": "Python, Django",
            "skills": "Python, Django",
        }).inserted_id
        j2 = mongo.db.jobs.insert_one({
            "title": "Java Developer", "status": "Filled",
            "client_name": "Beta Ltd", "client_id": "CLI002",
            "posted_by_name": "Alice Recruiter",
            "required_skills": "Java, Spring",
            "skills": "Java, Spring",
        }).inserted_id
        ids["job_open"]   = j1
        ids["job_filled"] = j2

        # ── Candidate Processing ───────────────────────────────────────────────
        c1 = mongo.db.candidate_processing.insert_one({
            "status": "New", "source": "LinkedIn",
            "skills": "Python, Django",
            "experience": 3, "expected_salary": 800000,
            "notice_period": "30 days",
        }).inserted_id
        c2 = mongo.db.candidate_processing.insert_one({
            "status": "Shortlisted", "source": "Naukri",
            "skills": "Python, Flask",
            "experience": 5, "expected_salary": 1200000,
            "notice_period": "60 days",
        }).inserted_id
        c3 = mongo.db.candidate_processing.insert_one({
            "status": "Hired", "source": "LinkedIn",
            "skills": "Java, Spring",
            "experience": 7, "expected_salary": 1500000,
            "notice_period": "Immediate",
        }).inserted_id
        ids["candidate_new"]        = c1
        ids["candidate_shortlisted"] = c2
        ids["candidate_hired"]      = c3

        # ── Placements ────────────────────────────────────────────────────────
        p1 = mongo.db.placements.insert_one({
            "joining_date":    joining,
            "recruiter":       "Alice Recruiter",
            "client_name":     "Acme Corp",
            "billing_amount":  500000,
            "time_to_fill":    20,
        }).inserted_id
        p2 = mongo.db.placements.insert_one({
            "joining_date":    joining,
            "recruiter":       "Bob Recruiter",
            "client_name":     "Beta Ltd",
            "billing_amount":  750000,
            "time_to_fill":    45,
        }).inserted_id
        ids["placement_1"] = p1
        ids["placement_2"] = p2

        # ── Candidate Tracking ────────────────────────────────────────────────
        t1 = mongo.db.candidate_tracking.insert_one({
            "resume_id":      str(c1),
            "recruiter":      "Alice Recruiter",
            "client_name":    "Acme Corp",
            "current_stage":  "Technical Interview",
            "pipeline_status": "Active",
        }).inserted_id
        t2 = mongo.db.candidate_tracking.insert_one({
            "resume_id":      str(c2),
            "recruiter":      "Alice Recruiter",
            "client_name":    "Acme Corp",
            "current_stage":  "Offer",
            "pipeline_status": "Active",
        }).inserted_id
        ids["tracking_1"] = t1
        ids["tracking_2"] = t2

    yield ids

    # Teardown
    with app.app_context():
        from extensions import mongo as m
        m.db.jobs.delete_many({"_id": {"$in": [ids["job_open"], ids["job_filled"]]}})
        m.db.candidate_processing.delete_many({"_id": {"$in": [
            ids["candidate_new"], ids["candidate_shortlisted"], ids["candidate_hired"]
        ]}})
        m.db.placements.delete_many({"_id": {"$in": [ids["placement_1"], ids["placement_2"]]}})
        m.db.candidate_tracking.delete_many({"_id": {"$in": [ids["tracking_1"], ids["tracking_2"]]}})


# ═════════════════════════════════════════════════════════════════════════════
# 1.  GET /api/reports/overview
# ═════════════════════════════════════════════════════════════════════════════

class TestOverview:

    ENDPOINT = "/api/reports/overview"
    PERIODS  = ["thisMonth", "thisWeek", "lastMonth", "thisQuarter", "thisYear"]

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get(self.ENDPOINT).status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers, seeded_data):
        assert client.get(self.ENDPOINT, headers=auth_headers).status_code == 200

    def test_recruiter_can_access(self, client, recruiter_headers, seeded_data):
        assert client.get(self.ENDPOINT, headers=recruiter_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_key_present(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert "data" in body

    def test_required_keys_present(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for key in ("total_jobs", "open_jobs", "total_candidates", "total_placements",
                    "fill_rate", "avg_time_to_fill", "revenue",
                    "job_status_counts", "candidate_counts"):
            assert key in data, f"Missing key: {key}"

    def test_total_jobs_is_int(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["total_jobs"], int)

    def test_open_jobs_is_int(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["open_jobs"], int)

    def test_total_candidates_is_int(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["total_candidates"], int)

    def test_total_placements_is_int(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["total_placements"], int)

    def test_fill_rate_is_float_or_int(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["fill_rate"], (int, float))

    def test_fill_rate_between_0_and_100(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert 0 <= data["fill_rate"] <= 100

    def test_avg_time_to_fill_is_numeric(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["avg_time_to_fill"], (int, float))

    def test_revenue_is_numeric(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["revenue"], (int, float))

    def test_job_status_counts_is_dict(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["job_status_counts"], dict)

    def test_candidate_counts_is_dict(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["candidate_counts"], dict)

    def test_open_jobs_lte_total_jobs(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert data["open_jobs"] <= data["total_jobs"]

    # ── Period filter ─────────────────────────────────────────────────────────

    @pytest.mark.parametrize("period", ["thisMonth", "thisWeek", "lastMonth", "thisQuarter", "thisYear"])
    def test_period_param_returns_200(self, client, auth_headers, seeded_data, period):
        res = client.get(f"{self.ENDPOINT}?period={period}", headers=auth_headers)
        assert res.status_code == 200

    @pytest.mark.parametrize("period", ["thisMonth", "thisWeek", "lastMonth", "thisQuarter", "thisYear"])
    def test_period_param_returns_valid_data(self, client, auth_headers, seeded_data, period):
        body = client.get(f"{self.ENDPOINT}?period={period}", headers=auth_headers).get_json()
        assert body["success"] is True
        assert "data" in body

    def test_unknown_period_defaults_gracefully(self, client, auth_headers, seeded_data):
        res = client.get(f"{self.ENDPOINT}?period=badperiod", headers=auth_headers)
        assert res.status_code == 200

    def test_seeded_total_jobs_counted(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert data["total_jobs"] >= 2

    def test_seeded_candidates_counted(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert data["total_candidates"] >= 3


# ═════════════════════════════════════════════════════════════════════════════
# 2.  GET /api/reports/funnel
# ═════════════════════════════════════════════════════════════════════════════

class TestFunnel:

    ENDPOINT      = "/api/reports/funnel"
    FUNNEL_STAGES = ["New", "In Review", "Shortlisted", "Interviewed", "Offered", "Hired"]

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get(self.ENDPOINT).status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers, seeded_data):
        assert client.get(self.ENDPOINT, headers=auth_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_is_list(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_data_has_six_stages(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert len(data) == 6

    def test_stage_order_is_correct(self, client, auth_headers, seeded_data):
        data   = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        stages = [item["stage"] for item in data]
        assert stages == self.FUNNEL_STAGES

    def test_each_item_has_required_keys(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert "stage"      in item
            assert "count"      in item
            assert "conversion" in item

    def test_count_is_non_negative_int(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert isinstance(item["count"], int)
            assert item["count"] >= 0

    def test_conversion_is_string_percentage(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert isinstance(item["conversion"], str)
            assert "%" in item["conversion"]

    def test_first_stage_is_new_with_100_pct(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        first = data[0]
        assert first["stage"]      == "New"
        assert first["conversion"] == "100%"

    def test_new_stage_count_matches_seeded(self, client, auth_headers, seeded_data):
        data  = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        new_item = next(d for d in data if d["stage"] == "New")
        assert new_item["count"] >= 1

    def test_hired_stage_count_matches_seeded(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        hired = next(d for d in data if d["stage"] == "Hired")
        assert hired["count"] >= 1


# ═════════════════════════════════════════════════════════════════════════════
# 3.  GET /api/reports/recruiter-performance
# ═════════════════════════════════════════════════════════════════════════════

class TestRecruiterPerformance:

    ENDPOINT = "/api/reports/recruiter-performance"

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get(self.ENDPOINT).status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers, seeded_data):
        assert client.get(self.ENDPOINT, headers=auth_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_is_list(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_each_item_has_required_keys(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            for key in ("name", "jobs_posted", "interviews", "offers",
                        "placements", "revenue", "conversion_rate"):
                assert key in item, f"Missing key: {key}"

    def test_numeric_fields_are_numeric(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert isinstance(item["jobs_posted"],    int)
            assert isinstance(item["interviews"],     int)
            assert isinstance(item["offers"],         int)
            assert isinstance(item["placements"],     int)
            assert isinstance(item["revenue"],        (int, float))
            assert isinstance(item["conversion_rate"],(int, float))

    def test_conversion_rate_between_0_and_100(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert 0 <= item["conversion_rate"] <= 100

    def test_sorted_by_placements_desc(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        if len(data) >= 2:
            assert data[0]["placements"] >= data[-1]["placements"]

    def test_seeded_recruiter_alice_present(self, client, auth_headers, seeded_data):
        data  = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        names = [item["name"] for item in data]
        assert "Alice Recruiter" in names

    def test_seeded_recruiter_bob_present(self, client, auth_headers, seeded_data):
        data  = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        names = [item["name"] for item in data]
        assert "Bob Recruiter" in names

    # ── Period filter ─────────────────────────────────────────────────────────

    @pytest.mark.parametrize("period", ["thisMonth", "thisWeek", "lastMonth", "thisQuarter", "thisYear"])
    def test_period_param_returns_200(self, client, auth_headers, seeded_data, period):
        res = client.get(f"{self.ENDPOINT}?period={period}", headers=auth_headers)
        assert res.status_code == 200


# ═════════════════════════════════════════════════════════════════════════════
# 4.  GET /api/reports/client-wise
# ═════════════════════════════════════════════════════════════════════════════

class TestClientWise:

    ENDPOINT = "/api/reports/client-wise"

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get(self.ENDPOINT).status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers, seeded_data):
        assert client.get(self.ENDPOINT, headers=auth_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_is_list(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_each_item_has_required_keys(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            for key in ("name", "client_id", "jobs", "open_jobs", "filled_jobs",
                        "active_pipeline", "placements", "revenue", "fill_rate"):
                assert key in item, f"Missing key: {key}"

    def test_numeric_fields_are_numeric(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert isinstance(item["jobs"],            int)
            assert isinstance(item["open_jobs"],       int)
            assert isinstance(item["filled_jobs"],     int)
            assert isinstance(item["active_pipeline"], int)
            assert isinstance(item["placements"],      int)
            assert isinstance(item["revenue"],         (int, float))
            assert isinstance(item["fill_rate"],       (int, float))

    def test_fill_rate_between_0_and_100(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert 0 <= item["fill_rate"] <= 100

    def test_open_plus_filled_lte_total_jobs(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert item["open_jobs"] + item["filled_jobs"] <= item["jobs"]

    def test_sorted_by_revenue_desc(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        if len(data) >= 2:
            assert data[0]["revenue"] >= data[-1]["revenue"]

    def test_seeded_clients_present(self, client, auth_headers, seeded_data):
        data  = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        names = [item["name"] for item in data]
        assert "Acme Corp" in names
        assert "Beta Ltd"  in names

    @pytest.mark.parametrize("period", ["thisMonth", "thisWeek", "lastMonth", "thisQuarter", "thisYear"])
    def test_period_param_returns_200(self, client, auth_headers, seeded_data, period):
        res = client.get(f"{self.ENDPOINT}?period={period}", headers=auth_headers)
        assert res.status_code == 200


# ═════════════════════════════════════════════════════════════════════════════
# 5.  GET /api/reports/time-to-fill
# ═════════════════════════════════════════════════════════════════════════════

class TestTimeToFill:

    ENDPOINT = "/api/reports/time-to-fill"
    LABELS   = ["<2 weeks", "2–4 weeks", "1–2 months", "2–3 months", ">3 months"]

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get(self.ENDPOINT).status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers, seeded_data):
        assert client.get(self.ENDPOINT, headers=auth_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_has_distribution_and_by_client(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert "distribution" in data
        assert "by_client"    in data

    def test_distribution_is_list(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["distribution"], list)

    def test_distribution_has_five_buckets(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert len(data["distribution"]) == 5

    def test_distribution_labels_correct(self, client, auth_headers, seeded_data):
        data   = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        labels = [b["label"] for b in data["distribution"]]
        assert labels == self.LABELS

    def test_distribution_counts_are_non_negative_ints(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for b in data["distribution"]:
            assert isinstance(b["count"], int)
            assert b["count"] >= 0

    def test_by_client_is_list(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert isinstance(data["by_client"], list)

    def test_by_client_max_8_items(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        assert len(data["by_client"]) <= 8

    def test_by_client_items_have_required_keys(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data["by_client"]:
            assert "name"     in item
            assert "avg_days" in item
            assert "count"    in item

    def test_by_client_avg_days_is_numeric(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data["by_client"]:
            assert isinstance(item["avg_days"], (int, float))
            assert item["avg_days"] > 0

    def test_seeded_placement_appears_in_bucket(self, client, auth_headers, seeded_data):
        """placement_1 has time_to_fill=20 → should land in '2-4 weeks' bucket."""
        data   = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        bucket = next(b for b in data["distribution"] if b["label"] == "2–4 weeks")
        assert bucket["count"] >= 1

    def test_seeded_placement_sorted_by_avg_days_asc(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        by_client = data["by_client"]
        if len(by_client) >= 2:
            assert by_client[0]["avg_days"] <= by_client[-1]["avg_days"]


# ═════════════════════════════════════════════════════════════════════════════
# 6.  GET /api/reports/source-effectiveness
# ═════════════════════════════════════════════════════════════════════════════

class TestSourceEffectiveness:

    ENDPOINT = "/api/reports/source-effectiveness"

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get(self.ENDPOINT).status_code == 401

    def test_authenticated_returns_200(self, client, auth_headers, seeded_data):
        assert client.get(self.ENDPOINT, headers=auth_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert body["success"] is True

    def test_data_is_list(self, client, auth_headers, seeded_data):
        body = client.get(self.ENDPOINT, headers=auth_headers).get_json()
        assert isinstance(body["data"], list)

    def test_each_item_has_required_keys(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            for key in ("source", "candidates", "shortlisted",
                        "interviewed", "offered", "hires", "efficiency"):
                assert key in item, f"Missing key: {key}"

    def test_counts_are_non_negative_ints(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            for key in ("candidates", "shortlisted", "interviewed", "offered", "hires"):
                assert isinstance(item[key], int)
                assert item[key] >= 0

    def test_efficiency_between_0_and_100(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert 0 <= item["efficiency"] <= 100

    def test_hires_lte_candidates(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert item["hires"] <= item["candidates"]

    def test_shortlisted_gte_interviewed(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert item["shortlisted"] >= item["interviewed"]

    def test_interviewed_gte_offered(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert item["interviewed"] >= item["offered"]

    def test_sorted_by_candidates_desc(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        if len(data) >= 2:
            assert data[0]["candidates"] >= data[-1]["candidates"]

    def test_seeded_sources_present(self, client, auth_headers, seeded_data):
        data    = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        sources = [item["source"] for item in data]
        assert "LinkedIn" in sources
        assert "Naukri"   in sources

    def test_linkedin_has_hired_candidate(self, client, auth_headers, seeded_data):
        data  = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        li    = next((d for d in data if d["source"] == "LinkedIn"), None)
        assert li is not None
        assert li["hires"] >= 1

    def test_no_null_sources_in_data(self, client, auth_headers, seeded_data):
        data = client.get(self.ENDPOINT, headers=auth_headers).get_json()["data"]
        for item in data:
            assert item["source"] is not None
            assert item["source"] != ""


# ═════════════════════════════════════════════════════════════════════════════
# 7.  Unit tests — _date_range helper
# ═════════════════════════════════════════════════════════════════════════════

class TestDateRange:

    def _fn(self):
        from zentreeportal_backend.routes.Reports_routes import _date_range
        return _date_range

    def test_this_month_start_is_first_of_month(self):
        start, _ = self._fn()("thisMonth")
        assert start.day == 1

    def test_this_month_end_is_close_to_now(self):
        _, end = self._fn()("thisMonth")
        assert (datetime.utcnow() - end).total_seconds() < 5

    def test_this_week_start_is_monday(self):
        start, _ = self._fn()("thisWeek")
        assert start.weekday() == 0

    def test_this_week_start_has_zero_time(self):
        start, _ = self._fn()("thisWeek")
        assert start.hour == 0 and start.minute == 0 and start.second == 0

    def test_last_month_start_is_first_of_prev_month(self):
        start, end = self._fn()("lastMonth")
        assert start.day == 1
        assert end.day   == 1

    def test_last_month_end_is_first_of_current_month(self):
        _, end = self._fn()("lastMonth")
        assert end.day == 1

    def test_this_quarter_start_month_is_valid(self):
        start, _ = self._fn()("thisQuarter")
        assert start.month in (1, 4, 7, 10)

    def test_this_quarter_start_day_is_1(self):
        start, _ = self._fn()("thisQuarter")
        assert start.day == 1

    def test_this_year_start_is_jan_1(self):
        start, _ = self._fn()("thisYear")
        assert start.month == 1
        assert start.day   == 1

    def test_start_is_before_end_for_all_periods(self):
        fn = self._fn()
        for period in ("thisMonth", "thisWeek", "lastMonth", "thisQuarter", "thisYear"):
            start, end = fn(period)
            assert start < end, f"start >= end for period: {period}"

    def test_unknown_period_defaults_to_this_month(self):
        start, _ = self._fn()("unknownPeriod")
        assert start.day == 1