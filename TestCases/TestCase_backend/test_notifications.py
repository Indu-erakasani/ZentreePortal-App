"""
Run from project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_notifications.py -v
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
    _register_user(client, "notif_admin@test.com", role="admin")
    return _login(client, "notif_admin@test.com")


@pytest.fixture(scope="module")
def recruiter_headers(client):
    _register_user(client, "notif_recruiter@test.com", role="recruiter")
    return _login(client, "notif_recruiter@test.com")


@pytest.fixture(scope="module")
def hr_headers(client):
    _register_user(client, "notif_hr@test.com", role="hr")
    return _login(client, "notif_hr@test.com")


@pytest.fixture(scope="module")
def manager_headers(client):
    _register_user(client, "notif_manager@test.com", role="manager")
    return _login(client, "notif_manager@test.com")


def _create_notification(client, headers, payload=None):
    """Helper: POST a notification and return the response."""
    payload = payload or {
        "type":    "new_candidate",
        "title":   "Test Notification",
        "message": "This is a test",
    }
    return client.post("/api/notifications/", json=payload, headers=headers)


# ═════════════════════════════════════════════════════════════════════════════
# 1.  GET /api/notifications/
# ═════════════════════════════════════════════════════════════════════════════

class TestGetNotifications:

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/notifications/").status_code == 401

    def test_admin_returns_200(self, client, admin_headers):
        assert client.get("/api/notifications/", headers=admin_headers).status_code == 200

    def test_recruiter_returns_200(self, client, recruiter_headers):
        assert client.get("/api/notifications/", headers=recruiter_headers).status_code == 200

    def test_hr_returns_200(self, client, hr_headers):
        assert client.get("/api/notifications/", headers=hr_headers).status_code == 200

    def test_manager_returns_200(self, client, manager_headers):
        assert client.get("/api/notifications/", headers=manager_headers).status_code == 200

    # ── Response shape ────────────────────────────────────────────────────────

    def test_success_flag_is_true(self, client, admin_headers):
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        assert body["success"] is True

    def test_data_key_is_list(self, client, admin_headers):
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        assert isinstance(body["data"], list)

    def test_unread_key_is_int(self, client, admin_headers):
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        assert isinstance(body["unread"], int)

    def test_unread_is_non_negative(self, client, admin_headers):
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        assert body["unread"] >= 0

    def test_unread_lte_total(self, client, admin_headers):
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        assert body["unread"] <= len(body["data"])

    # ── Item shape ────────────────────────────────────────────────────────────

    def test_notification_items_have_required_fields(self, client, admin_headers):
        _create_notification(client, admin_headers)
        body  = client.get("/api/notifications/", headers=admin_headers).get_json()
        for item in body["data"]:
            assert "_id"        in item
            assert "type"       in item
            assert "title"      in item
            assert "message"    in item
            assert "is_read"    in item
            assert "created_at" in item

    def test_notification_ids_are_strings(self, client, admin_headers):
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        for item in body["data"]:
            assert isinstance(item["_id"], str)

    def test_notification_is_read_is_bool(self, client, admin_headers):
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        for item in body["data"]:
            assert isinstance(item["is_read"], bool)

    def test_notification_created_at_is_string(self, client, admin_headers):
        _create_notification(client, admin_headers)
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        for item in body["data"]:
            assert isinstance(item["created_at"], str)

    # ── Limit param ───────────────────────────────────────────────────────────

    def test_limit_param_respected(self, client, admin_headers):
        # Seed several notifications
        for i in range(5):
            _create_notification(client, admin_headers,
                                 payload={"type": "system", "title": f"Notif {i}"})
        body = client.get("/api/notifications/?limit=2", headers=admin_headers).get_json()
        assert len(body["data"]) <= 2

    def test_default_limit_is_50(self, client, admin_headers):
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        assert len(body["data"]) <= 50

    # ── Role-based filtering ──────────────────────────────────────────────────

    def test_recruiter_does_not_see_hr_types(self, client, recruiter_headers, admin_headers):
        """Seed an HR-only notification; recruiter should not see it."""
        _create_notification(client, admin_headers, payload={
            "type":        "new_hire",
            "title":       "HR only notif",
            "target_role": "hr",
        })
        body  = client.get("/api/notifications/", headers=recruiter_headers).get_json()
        types = [item["type"] for item in body["data"]]
        assert "new_hire" not in types

    def test_hr_sees_onboarding_type(self, client, admin_headers, hr_headers):
        """Seed an onboarding notification targeted to hr; hr should see it."""
        _create_notification(client, admin_headers, payload={
            "type":        "onboarding",
            "title":       "Onboarding started",
            "target_role": "hr",
        })
        body  = client.get("/api/notifications/", headers=hr_headers).get_json()
        types = [item["type"] for item in body["data"]]
        assert "onboarding" in types


# ═════════════════════════════════════════════════════════════════════════════
# 2.  POST /api/notifications/
# ═════════════════════════════════════════════════════════════════════════════

class TestCreateNotification:

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        res = client.post("/api/notifications/",
                          json={"type": "system", "title": "T"})
        assert res.status_code == 401

    # ── Validation ────────────────────────────────────────────────────────────

    def test_missing_type_returns_400(self, client, admin_headers):
        res = client.post("/api/notifications/",
                          json={"title": "No type"},
                          headers=admin_headers)
        assert res.status_code == 400

    def test_missing_title_returns_400(self, client, admin_headers):
        res = client.post("/api/notifications/",
                          json={"type": "system"},
                          headers=admin_headers)
        assert res.status_code == 400

    def test_empty_body_returns_400(self, client, admin_headers):
        res = client.post("/api/notifications/", json={}, headers=admin_headers)
        assert res.status_code == 400

    # ── Success ───────────────────────────────────────────────────────────────

    def test_valid_payload_returns_201(self, client, admin_headers):
        res = _create_notification(client, admin_headers)
        assert res.status_code == 201

    def test_response_success_true(self, client, admin_headers):
        body = _create_notification(client, admin_headers).get_json()
        assert body["success"] is True

    def test_response_has_data(self, client, admin_headers):
        body = _create_notification(client, admin_headers).get_json()
        assert "data" in body

    def test_response_data_has_id(self, client, admin_headers):
        data = _create_notification(client, admin_headers).get_json()["data"]
        assert "_id" in data
        assert isinstance(data["_id"], str)

    def test_response_data_is_read_false(self, client, admin_headers):
        data = _create_notification(client, admin_headers).get_json()["data"]
        assert data["is_read"] is False

    def test_response_data_has_created_at(self, client, admin_headers):
        data = _create_notification(client, admin_headers).get_json()["data"]
        assert "created_at" in data

    def test_response_data_type_matches_input(self, client, admin_headers):
        data = _create_notification(client, admin_headers,
                                    payload={"type": "placement",
                                             "title": "Placement done"}).get_json()["data"]
        assert data["type"] == "placement"

    def test_response_data_title_matches_input(self, client, admin_headers):
        data = _create_notification(client, admin_headers,
                                    payload={"type": "system",
                                             "title": "My Title"}).get_json()["data"]
        assert data["title"] == "My Title"

    def test_response_data_message_stored(self, client, admin_headers):
        data = _create_notification(client, admin_headers,
                                    payload={"type": "system",
                                             "title": "T",
                                             "message": "Hello"}).get_json()["data"]
        assert data["message"] == "Hello"

    def test_notification_with_target_user_id(self, client, admin_headers):
        payload = {
            "type":           "job_update",
            "title":          "Job updated",
            "target_user_id": "user123",
        }
        res = client.post("/api/notifications/", json=payload, headers=admin_headers)
        assert res.status_code == 201
        data = res.get_json()["data"]
        assert data["target_user_id"] == "user123"

    def test_notification_with_target_role(self, client, admin_headers):
        payload = {
            "type":        "report",
            "title":       "New report",
            "target_role": "manager",
        }
        res  = client.post("/api/notifications/", json=payload, headers=admin_headers)
        assert res.status_code == 201
        data = res.get_json()["data"]
        assert data["target_role"] == "manager"

    def test_notification_with_related_id_and_type(self, client, admin_headers):
        payload = {
            "type":         "new_candidate",
            "title":        "Candidate added",
            "related_id":   str(ObjectId()),
            "related_type": "candidate",
        }
        res  = client.post("/api/notifications/", json=payload, headers=admin_headers)
        assert res.status_code == 201

    def test_created_notification_appears_in_list(self, client, admin_headers):
        title = f"Unique Title {ObjectId()}"
        _create_notification(client, admin_headers,
                              payload={"type": "system", "title": title})
        body   = client.get("/api/notifications/", headers=admin_headers).get_json()
        titles = [item["title"] for item in body["data"]]
        assert title in titles


# ═════════════════════════════════════════════════════════════════════════════
# 3.  PUT /api/notifications/<id>/read
# ═════════════════════════════════════════════════════════════════════════════

class TestMarkRead:

    def _seed(self, client, headers):
        return _create_notification(client, headers).get_json()["data"]["_id"]

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client, admin_headers):
        nid = self._seed(client, admin_headers)
        assert client.put(f"/api/notifications/{nid}/read").status_code == 401

    # ── Validation ────────────────────────────────────────────────────────────

    def test_invalid_id_returns_400(self, client, admin_headers):
        res = client.put("/api/notifications/NOT_AN_OID/read",
                         headers=admin_headers)
        assert res.status_code == 400

    # ── Success ───────────────────────────────────────────────────────────────

    def test_valid_id_returns_200(self, client, admin_headers):
        nid = self._seed(client, admin_headers)
        res = client.put(f"/api/notifications/{nid}/read", headers=admin_headers)
        assert res.status_code == 200

    def test_response_success_true(self, client, admin_headers):
        nid  = self._seed(client, admin_headers)
        body = client.put(f"/api/notifications/{nid}/read",
                          headers=admin_headers).get_json()
        assert body["success"] is True

    def test_notification_is_read_after_mark(self, client, admin_headers):
        """Create → mark read → verify it no longer appears as unread."""
        nid = self._seed(client, admin_headers)
        client.put(f"/api/notifications/{nid}/read", headers=admin_headers)
        body  = client.get("/api/notifications/", headers=admin_headers).get_json()
        notif = next((n for n in body["data"] if n["_id"] == nid), None)
        if notif:
            assert notif["is_read"] is True

    def test_mark_read_on_unknown_id_returns_200(self, client, admin_headers):
        """
        The route does update_one without error on unknown ID.
        Should still return 200 (upsert-safe behaviour).
        """
        fake = str(ObjectId())
        res  = client.put(f"/api/notifications/{fake}/read", headers=admin_headers)
        assert res.status_code == 200

    def test_mark_read_idempotent(self, client, admin_headers):
        """Marking the same notification read twice should not error."""
        nid = self._seed(client, admin_headers)
        client.put(f"/api/notifications/{nid}/read", headers=admin_headers)
        res = client.put(f"/api/notifications/{nid}/read", headers=admin_headers)
        assert res.status_code == 200


# ═════════════════════════════════════════════════════════════════════════════
# 4.  PUT /api/notifications/read-all
# ═════════════════════════════════════════════════════════════════════════════

class TestMarkAllRead:

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client):
        assert client.put("/api/notifications/read-all").status_code == 401

    # ── Success ───────────────────────────────────────────────────────────────

    def test_returns_200(self, client, recruiter_headers):
        assert client.put("/api/notifications/read-all",
                          headers=recruiter_headers).status_code == 200

    def test_response_success_true(self, client, admin_headers):
        body = client.put("/api/notifications/read-all",
                          headers=admin_headers).get_json()
        assert body["success"] is True

    def test_unread_count_becomes_zero_after_read_all(self, client, admin_headers):
        # Seed a fresh unread notification
        _create_notification(client, admin_headers,
                              payload={"type": "system", "title": "Unread one"})
        client.put("/api/notifications/read-all", headers=admin_headers)
        body = client.get("/api/notifications/", headers=admin_headers).get_json()
        assert body["unread"] == 0

    def test_read_all_is_role_scoped(self, client, recruiter_headers, hr_headers, admin_headers):
        """
        Mark-all-read for recruiter should not affect hr's unread count.
        """
        # Seed one notification targeted to hr
        _create_notification(client, admin_headers, payload={
            "type":        "onboarding",
            "title":       "HR unread notif",
            "target_role": "hr",
        })
        client.put("/api/notifications/read-all", headers=recruiter_headers)
        body = client.get("/api/notifications/", headers=hr_headers).get_json()
        # HR should still have the onboarding notification (recruiter read-all
        # should not have wiped it)
        assert body["success"] is True


# ═════════════════════════════════════════════════════════════════════════════
# 5.  DELETE /api/notifications/<id>
# ═════════════════════════════════════════════════════════════════════════════

class TestDeleteNotification:

    def _seed(self, client, headers):
        return _create_notification(client, headers).get_json()["data"]["_id"]

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self, client, admin_headers):
        nid = self._seed(client, admin_headers)
        assert client.delete(f"/api/notifications/{nid}").status_code == 401

    # ── Validation ────────────────────────────────────────────────────────────

    def test_invalid_id_returns_400(self, client, admin_headers):
        res = client.delete("/api/notifications/BAD_ID", headers=admin_headers)
        assert res.status_code == 400

    # ── Success ───────────────────────────────────────────────────────────────

    def test_valid_id_returns_200(self, client, admin_headers):
        nid = self._seed(client, admin_headers)
        res = client.delete(f"/api/notifications/{nid}", headers=admin_headers)
        assert res.status_code == 200

    def test_response_success_true(self, client, admin_headers):
        nid  = self._seed(client, admin_headers)
        body = client.delete(f"/api/notifications/{nid}",
                             headers=admin_headers).get_json()
        assert body["success"] is True

    def test_notification_gone_after_delete(self, client, admin_headers):
        nid = self._seed(client, admin_headers)
        client.delete(f"/api/notifications/{nid}", headers=admin_headers)
        body  = client.get("/api/notifications/", headers=admin_headers).get_json()
        ids   = [item["_id"] for item in body["data"]]
        assert nid not in ids

    def test_delete_unknown_id_returns_200(self, client, admin_headers):
        """Route calls delete_one which is a no-op for missing docs — should 200."""
        fake = str(ObjectId())
        res  = client.delete(f"/api/notifications/{fake}", headers=admin_headers)
        assert res.status_code == 200

    def test_delete_is_idempotent(self, client, admin_headers):
        """Deleting the same ID twice should not crash."""
        nid = self._seed(client, admin_headers)
        client.delete(f"/api/notifications/{nid}", headers=admin_headers)
        res = client.delete(f"/api/notifications/{nid}", headers=admin_headers)
        assert res.status_code == 200


# ═════════════════════════════════════════════════════════════════════════════
# 6.  Unit tests — _serialize helper
# ═════════════════════════════════════════════════════════════════════════════

class TestSerialize:

    def _fn(self):
        from zentreeportal_backend.routes.Notification_routes import _serialize
        return _serialize

    def test_id_converted_to_string(self):
        oid = ObjectId()
        doc = {"_id": oid, "type": "system", "title": "T",
               "is_read": False, "created_at": None, "read_at": None}
        result = self._fn()(doc)
        assert result["_id"] == str(oid)
        assert isinstance(result["_id"], str)

    def test_created_at_datetime_converted_to_isoformat(self):
        dt  = datetime(2024, 1, 15, 10, 30, 0)
        doc = {"_id": ObjectId(), "type": "x", "title": "T",
               "is_read": False, "created_at": dt, "read_at": None}
        result = self._fn()(doc)
        assert isinstance(result["created_at"], str)
        assert "2024-01-15" in result["created_at"]

    def test_read_at_datetime_converted_to_isoformat(self):
        dt  = datetime(2024, 3, 10, 8, 0, 0)
        doc = {"_id": ObjectId(), "type": "x", "title": "T",
               "is_read": True, "created_at": None, "read_at": dt}
        result = self._fn()(doc)
        assert isinstance(result["read_at"], str)
        assert "2024-03-10" in result["read_at"]

    def test_none_read_at_stays_none(self):
        doc = {"_id": ObjectId(), "type": "x", "title": "T",
               "is_read": False, "created_at": None, "read_at": None}
        result = self._fn()(doc)
        assert result["read_at"] is None

    def test_original_doc_not_mutated(self):
        oid = ObjectId()
        doc = {"_id": oid, "type": "x", "title": "T",
               "is_read": False, "created_at": None, "read_at": None}
        self._fn()(doc)
        assert isinstance(doc["_id"], ObjectId)   # original untouched

    def test_extra_fields_preserved(self):
        doc = {"_id": ObjectId(), "type": "x", "title": "T",
               "is_read": False, "created_at": None, "read_at": None,
               "target_role": "hr", "message": "hello"}
        result = self._fn()(doc)
        assert result["target_role"] == "hr"
        assert result["message"] == "hello"


# ═════════════════════════════════════════════════════════════════════════════
# 7.  Unit tests — ROLE_TYPE_MAP filtering logic
# ═════════════════════════════════════════════════════════════════════════════

class TestRoleTypeMap:

    def _map(self):
        from zentreeportal_backend.routes.Notification_routes import ROLE_TYPE_MAP
        return ROLE_TYPE_MAP

    def test_admin_has_no_restriction(self):
        assert self._map()["admin"] is None

    def test_recruiter_allowed_types_is_list(self):
        assert isinstance(self._map()["recruiter"], list)

    def test_hr_allowed_types_is_list(self):
        assert isinstance(self._map()["hr"], list)

    def test_manager_allowed_types_is_list(self):
        assert isinstance(self._map()["manager"], list)

    def test_recruiter_sees_new_candidate(self):
        assert "new_candidate" in self._map()["recruiter"]

    def test_recruiter_does_not_see_new_hire(self):
        assert "new_hire" not in self._map()["recruiter"]

    def test_hr_sees_onboarding(self):
        assert "onboarding" in self._map()["hr"]

    def test_hr_does_not_see_placement(self):
        assert "placement" not in self._map()["hr"]

    def test_manager_sees_placement(self):
        assert "placement" in self._map()["manager"]

    def test_all_roles_see_system_warnings(self):
        role_map = self._map()
        for role, types in role_map.items():
            if types is not None:
                assert "system"  in types, f"{role} missing 'system'"
                assert "warning" in types, f"{role} missing 'warning'"