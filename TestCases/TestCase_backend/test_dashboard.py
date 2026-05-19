"""
Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_dashboard.py -v
"""
import pytest
from bson import ObjectId
from datetime import datetime


# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────────────────

def _register_user(client, email, role="recruiter", password="Test@1234"):
    client.post("/api/auth/register", json={
        "first_name": "Test",
        "last_name":  "User",
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
def admin_headers(client):
    _register_user(client, "dash_admin@test.com", role="admin")
    return _login(client, "dash_admin@test.com")


@pytest.fixture(scope="module")
def recruiter_headers(client):
    _register_user(client, "dash_recruiter@test.com", role="recruiter")
    return _login(client, "dash_recruiter@test.com")


@pytest.fixture(scope="module")
def manager_headers(client):
    _register_user(client, "dash_manager@test.com", role="manager")
    return _login(client, "dash_manager@test.com")


# ═════════════════════════════════════════════════════════════════════════════
# 1.  GET /api/dashboard/  — Admin / Manager dashboard
# ═════════════════════════════════════════════════════════════════════════════

class TestGetDashboard:

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_returns_200_for_admin(self, client, admin_headers):
        res = client.get("/api/dashboard/", headers=admin_headers)
        assert res.status_code == 200

    def test_returns_200_for_manager(self, client, manager_headers):
        res = client.get("/api/dashboard/", headers=manager_headers)
        assert res.status_code == 200

    def test_returns_200_for_recruiter(self, client, recruiter_headers):
        res = client.get("/api/dashboard/", headers=recruiter_headers)
        assert res.status_code == 200

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/dashboard/").status_code == 401

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, admin_headers):
        body = client.get("/api/dashboard/", headers=admin_headers).get_json()
        assert body["success"] is True

    def test_dashboard_key_present(self, client, admin_headers):
        body = client.get("/api/dashboard/", headers=admin_headers).get_json()
        assert "dashboard" in body

    # ── KPIs ──────────────────────────────────────────────────────────────────

    def test_kpis_key_present(self, client, admin_headers):
        dashboard = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]
        assert "kpis" in dashboard

    def test_kpis_active_clients(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "active_clients" in kpis
        assert isinstance(kpis["active_clients"], int)

    def test_kpis_total_clients(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "total_clients" in kpis
        assert isinstance(kpis["total_clients"], int)

    def test_kpis_open_jobs(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "open_jobs" in kpis
        assert isinstance(kpis["open_jobs"], int)

    def test_kpis_total_jobs(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "total_jobs" in kpis
        assert isinstance(kpis["total_jobs"], int)

    def test_kpis_total_candidates(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "total_candidates" in kpis
        assert isinstance(kpis["total_candidates"], int)

    def test_kpis_placements_mtd(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "placements_mtd" in kpis
        assert isinstance(kpis["placements_mtd"], int)

    def test_kpis_placements_total(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "placements_total" in kpis
        assert isinstance(kpis["placements_total"], int)

    def test_kpis_revenue_mtd(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "revenue_mtd" in kpis
        assert isinstance(kpis["revenue_mtd"], (int, float))

    def test_kpis_fill_rate(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "fill_rate" in kpis
        assert isinstance(kpis["fill_rate"], (int, float))

    def test_kpis_fill_rate_non_negative(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert kpis["fill_rate"] >= 0

    def test_kpis_avg_days_to_fill(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert "avg_days_to_fill" in kpis
        assert isinstance(kpis["avg_days_to_fill"], (int, float))

    def test_kpis_avg_days_non_negative(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert kpis["avg_days_to_fill"] >= 0

    def test_active_clients_lte_total_clients(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert kpis["active_clients"] <= kpis["total_clients"]

    def test_open_jobs_lte_total_jobs(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert kpis["open_jobs"] <= kpis["total_jobs"]

    def test_placements_mtd_lte_placements_total(self, client, admin_headers):
        kpis = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["kpis"]
        assert kpis["placements_mtd"] <= kpis["placements_total"]

    # ── Pipeline ──────────────────────────────────────────────────────────────

    def test_pipeline_key_present(self, client, admin_headers):
        dashboard = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]
        assert "pipeline" in dashboard

    def test_pipeline_is_dict(self, client, admin_headers):
        pipeline = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["pipeline"]
        assert isinstance(pipeline, dict)

    def test_pipeline_values_are_ints(self, client, admin_headers):
        pipeline = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["pipeline"]
        for v in pipeline.values():
            assert isinstance(v, int)

    # ── Stage counts ──────────────────────────────────────────────────────────

    def test_stage_counts_key_present(self, client, admin_headers):
        dashboard = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]
        assert "stage_counts" in dashboard

    def test_stage_counts_is_list(self, client, admin_headers):
        stage_counts = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["stage_counts"]
        assert isinstance(stage_counts, list)

    def test_stage_counts_items_have_stage_and_count(self, client, admin_headers):
        stage_counts = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["stage_counts"]
        for item in stage_counts:
            assert "stage" in item
            assert "count" in item
            assert isinstance(item["count"], int)

    # ── High priority jobs ────────────────────────────────────────────────────

    def test_high_priority_jobs_key_present(self, client, admin_headers):
        dashboard = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]
        assert "high_priority_jobs" in dashboard

    def test_high_priority_jobs_is_list(self, client, admin_headers):
        hp_jobs = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["high_priority_jobs"]
        assert isinstance(hp_jobs, list)

    def test_high_priority_jobs_max_6(self, client, admin_headers):
        hp_jobs = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["high_priority_jobs"]
        assert len(hp_jobs) <= 6

    def test_high_priority_jobs_ids_are_strings(self, client, admin_headers):
        hp_jobs = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["high_priority_jobs"]
        for j in hp_jobs:
            assert isinstance(j["_id"], str)

    def test_high_priority_jobs_have_required_fields(self, client, admin_headers):
        hp_jobs = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["high_priority_jobs"]
        for j in hp_jobs:
            assert "title"       in j
            assert "client_name" in j
            assert "priority"    in j

    def test_high_priority_jobs_priority_is_high_or_critical(self, client, admin_headers):
        hp_jobs = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["high_priority_jobs"]
        for j in hp_jobs:
            assert j["priority"] in ("High", "Critical")

    # ── Recruiter performance ─────────────────────────────────────────────────

    def test_recruiter_perf_key_present(self, client, admin_headers):
        dashboard = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]
        assert "recruiter_perf" in dashboard

    def test_recruiter_perf_is_list(self, client, admin_headers):
        perf = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["recruiter_perf"]
        assert isinstance(perf, list)

    def test_recruiter_perf_items_have_required_fields(self, client, admin_headers):
        perf = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["recruiter_perf"]
        for item in perf:
            assert "name"            in item
            assert "jobs_posted"     in item
            assert "interviews"      in item
            assert "offers"          in item
            assert "placements"      in item
            assert "revenue"         in item
            assert "conversion_rate" in item

    def test_recruiter_perf_conversion_rate_non_negative(self, client, admin_headers):
        perf = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["recruiter_perf"]
        for item in perf:
            assert item["conversion_rate"] >= 0

    def test_recruiter_perf_placements_non_negative(self, client, admin_headers):
        perf = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["recruiter_perf"]
        for item in perf:
            assert item["placements"] >= 0

    # ── Client revenue ────────────────────────────────────────────────────────

    def test_client_revenue_key_present(self, client, admin_headers):
        dashboard = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]
        assert "client_revenue" in dashboard

    def test_client_revenue_is_list(self, client, admin_headers):
        client_revenue = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["client_revenue"]
        assert isinstance(client_revenue, list)

    def test_client_revenue_max_6(self, client, admin_headers):
        client_revenue = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["client_revenue"]
        assert len(client_revenue) <= 6

    def test_client_revenue_items_have_required_fields(self, client, admin_headers):
        client_revenue = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["client_revenue"]
        for item in client_revenue:
            assert "client"     in item
            assert "placements" in item
            assert "revenue"    in item

    def test_client_revenue_non_negative(self, client, admin_headers):
        client_revenue = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["client_revenue"]
        for item in client_revenue:
            assert item["revenue"] >= 0

    # ── Recent activity ───────────────────────────────────────────────────────

    def test_recent_activity_key_present(self, client, admin_headers):
        dashboard = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]
        assert "recent_activity" in dashboard

    def test_recent_activity_is_list(self, client, admin_headers):
        activity = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["recent_activity"]
        assert isinstance(activity, list)

    def test_recent_activity_items_have_required_fields(self, client, admin_headers):
        activity = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["recent_activity"]
        for item in activity:
            assert "type"    in item
            assert "message" in item
            assert "time"    in item

    def test_recent_activity_type_is_valid(self, client, admin_headers):
        activity = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["recent_activity"]
        for item in activity:
            assert item["type"] in ("placement", "candidate")

    def test_recent_activity_message_is_string(self, client, admin_headers):
        activity = client.get("/api/dashboard/", headers=admin_headers).get_json()["dashboard"]["recent_activity"]
        for item in activity:
            assert isinstance(item["message"], str)


# ═════════════════════════════════════════════════════════════════════════════
# 2.  GET /api/dashboard/recruiter  — Recruiter-scoped dashboard
# ═════════════════════════════════════════════════════════════════════════════

class TestGetRecruiterDashboard:

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_returns_200_for_recruiter(self, client, recruiter_headers):
        res = client.get("/api/dashboard/recruiter", headers=recruiter_headers)
        assert res.status_code == 200

    def test_returns_200_for_admin(self, client, admin_headers):
        res = client.get("/api/dashboard/recruiter", headers=admin_headers)
        assert res.status_code == 200

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/dashboard/recruiter").status_code == 401

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, recruiter_headers):
        body = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()
        assert body["success"] is True

    def test_dashboard_key_present(self, client, recruiter_headers):
        body = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()
        assert "dashboard" in body

    def test_recruiter_name_present(self, client, recruiter_headers):
        dashboard = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]
        assert "recruiter_name" in dashboard
        assert isinstance(dashboard["recruiter_name"], str)

    def test_recruiter_name_not_empty(self, client, recruiter_headers):
        dashboard = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]
        assert dashboard["recruiter_name"] != ""

    # ── Stats ─────────────────────────────────────────────────────────────────

    def test_stats_key_present(self, client, recruiter_headers):
        dashboard = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]
        assert "stats" in dashboard

    def test_stats_my_open_jobs(self, client, recruiter_headers):
        stats = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["stats"]
        assert "my_open_jobs" in stats
        assert isinstance(stats["my_open_jobs"], int)

    def test_stats_my_total_jobs(self, client, recruiter_headers):
        stats = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["stats"]
        assert "my_total_jobs" in stats
        assert isinstance(stats["my_total_jobs"], int)

    def test_stats_active_pipeline(self, client, recruiter_headers):
        stats = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["stats"]
        assert "active_pipeline" in stats
        assert isinstance(stats["active_pipeline"], int)

    def test_stats_placements_mtd(self, client, recruiter_headers):
        stats = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["stats"]
        assert "placements_mtd" in stats
        assert isinstance(stats["placements_mtd"], int)

    def test_stats_revenue_mtd(self, client, recruiter_headers):
        stats = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["stats"]
        assert "revenue_mtd" in stats
        assert isinstance(stats["revenue_mtd"], (int, float))

    def test_stats_my_open_jobs_lte_my_total_jobs(self, client, recruiter_headers):
        stats = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["stats"]
        assert stats["my_open_jobs"] <= stats["my_total_jobs"]

    def test_stats_all_values_non_negative(self, client, recruiter_headers):
        stats = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["stats"]
        for key, val in stats.items():
            assert val >= 0, f"Expected non-negative for {key}, got {val}"

    # ── My Jobs ───────────────────────────────────────────────────────────────

    def test_my_jobs_key_present(self, client, recruiter_headers):
        dashboard = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]
        assert "my_jobs" in dashboard

    def test_my_jobs_is_list(self, client, recruiter_headers):
        my_jobs = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_jobs"]
        assert isinstance(my_jobs, list)

    def test_my_jobs_max_10(self, client, recruiter_headers):
        my_jobs = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_jobs"]
        assert len(my_jobs) <= 10

    def test_my_jobs_ids_are_strings(self, client, recruiter_headers):
        my_jobs = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_jobs"]
        for j in my_jobs:
            assert isinstance(j["_id"], str)

    def test_my_jobs_have_required_fields(self, client, recruiter_headers):
        my_jobs = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_jobs"]
        for j in my_jobs:
            assert "title"  in j
            assert "status" in j

    # ── My Pipeline ───────────────────────────────────────────────────────────

    def test_my_pipeline_key_present(self, client, recruiter_headers):
        dashboard = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]
        assert "my_pipeline" in dashboard

    def test_my_pipeline_is_list(self, client, recruiter_headers):
        my_pipeline = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_pipeline"]
        assert isinstance(my_pipeline, list)

    def test_my_pipeline_items_have_stage_and_count(self, client, recruiter_headers):
        my_pipeline = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_pipeline"]
        for item in my_pipeline:
            assert "stage" in item
            assert "count" in item
            assert isinstance(item["count"], int)

    def test_my_pipeline_counts_sum_equals_active_pipeline(self, client, recruiter_headers):
        body      = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]
        pipeline_sum = sum(item["count"] for item in body["my_pipeline"])
        assert pipeline_sum == body["stats"]["active_pipeline"]

    # ── My Candidates ─────────────────────────────────────────────────────────

    def test_my_candidates_key_present(self, client, recruiter_headers):
        dashboard = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]
        assert "my_candidates" in dashboard

    def test_my_candidates_is_list(self, client, recruiter_headers):
        my_candidates = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_candidates"]
        assert isinstance(my_candidates, list)

    def test_my_candidates_max_8(self, client, recruiter_headers):
        my_candidates = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_candidates"]
        assert len(my_candidates) <= 8

    def test_my_candidates_ids_are_strings(self, client, recruiter_headers):
        my_candidates = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_candidates"]
        for c in my_candidates:
            assert isinstance(c["_id"], str)

    def test_my_candidates_have_name(self, client, recruiter_headers):
        my_candidates = client.get("/api/dashboard/recruiter", headers=recruiter_headers).get_json()["dashboard"]["my_candidates"]
        for c in my_candidates:
            assert "name" in c


# ═════════════════════════════════════════════════════════════════════════════
# 3.  Helper unit tests — _fmt_currency
# ═════════════════════════════════════════════════════════════════════════════

class TestFmtCurrency:
    """
    Import and test the private helper directly to verify formatting logic.
    These tests are decoupled from HTTP — they test the pure function.
    """

    def _get_fmt(self):
        from zentreeportal_backend.routes.dashboard_routes import _fmt_currency
        return _fmt_currency

    def test_zero_returns_zero_rupee(self):
        fmt = self._get_fmt()
        assert fmt(0) == "₹0"

    def test_none_returns_zero_rupee(self):
        fmt = self._get_fmt()
        assert fmt(None) == "₹0"

    def test_below_lakh_formatted_with_commas(self):
        fmt = self._get_fmt()
        result = fmt(50000)
        assert "₹" in result
        assert "L" not in result

    def test_lakh_and_above_uses_L_suffix(self):
        fmt = self._get_fmt()
        result = fmt(100000)
        assert "L" in result
        assert "₹" in result

    def test_lakh_value_correct(self):
        fmt = self._get_fmt()
        assert fmt(150000) == "₹1.5L"

    def test_half_lakh_no_L(self):
        fmt = self._get_fmt()
        result = fmt(99999)
        assert "L" not in result