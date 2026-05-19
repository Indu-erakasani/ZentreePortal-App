

"""
Tests for auth routes + user routes.
File: /home/indhu/zentreeportal/TestCases/TestCase_backend/test_auth_user.py
"""
import pytest

# ── Check real registered URL prefixes from main.py ──────────────────────────
# user_bp  → /api/user   (NOT /api/users)
# auth_bp  → /api/auth
# ─────────────────────────────────────────────────────────────────────────────

USER_API   = "/api/user"    # matches: app.register_blueprint(user_bp, url_prefix="/api/user")
AUTH_API   = "/api/auth"


def _register(client, overrides=None):
    payload = {
        "first_name": "Test",
        "last_name":  "User",
        "email":      "testuser@example.com",
        "password":   "Test@1234",
        "role":       "recruiter",
    }
    if overrides:
        payload.update(overrides)
    return client.post(f"{AUTH_API}/register", json=payload)


def _login(client, email, password="Test@1234"):
    return client.post(f"{AUTH_API}/login", json={"email": email, "password": password})


# ═════════════════════════════════════════════════════════════════════════════
# 1. Register
# ═════════════════════════════════════════════════════════════════════════════
class TestRegister:

    def test_valid_registration_returns_201(self, client):
        res = _register(client, {"email": "reg_valid@example.com"})
        assert res.status_code == 201
        assert res.get_json()["success"] is True

    def test_registration_returns_user_data(self, client):
        res = _register(client, {"email": "reg_data@example.com"})
        user = res.get_json().get("user", {})
        assert user.get("email") == "reg_data@example.com"

    def test_duplicate_email_returns_409(self, client):
        _register(client, {"email": "reg_dup@example.com"})
        res = _register(client, {"email": "reg_dup@example.com"})
        assert res.status_code == 409

    def test_invalid_email_format_returns_400(self, client):
        res = _register(client, {"email": "not-an-email"})
        assert res.status_code == 400

    def test_weak_password_returns_400(self, client):
        res = _register(client, {"email": "reg_weak@example.com", "password": "123"})
        assert res.status_code == 400

    def test_invalid_role_returns_400(self, client):
        res = _register(client, {"email": "reg_role@example.com", "role": "superuser"})
        assert res.status_code == 400

    def test_missing_first_name_returns_400(self, client):
        res = client.post(f"{AUTH_API}/register", json={
            "last_name": "User", "email": "x@x.com",
            "password": "Test@1234", "role": "recruiter"
        })
        assert res.status_code == 400

    def test_optional_phone_accepted(self, client):
        res = _register(client, {"email": "reg_phone@example.com", "phone": "+919876543210"})
        assert res.status_code == 201

    def test_invalid_phone_returns_400(self, client):
        res = _register(client, {"email": "reg_badphone@example.com", "phone": "123"})
        assert res.status_code == 400

    def test_all_valid_roles_accepted(self, client):
        for i, role in enumerate(["admin", "recruiter", "manager", "hr"]):
            res = _register(client, {"email": f"reg_role_{i}@example.com", "role": role})
            assert res.status_code == 201, f"Role '{role}' should be accepted"


# ═════════════════════════════════════════════════════════════════════════════
# 2. Login
# ═════════════════════════════════════════════════════════════════════════════
class TestLogin:

    @pytest.fixture(autouse=True)
    def _seed(self, client):
        _register(client, {"email": "login_user@example.com", "password": "Login@123"})

    def test_valid_login_returns_200(self, client):
        res = _login(client, "login_user@example.com", "Login@123")
        assert res.status_code == 200

    def test_login_returns_access_token(self, client):
        res = _login(client, "login_user@example.com", "Login@123")
        assert "access_token" in res.get_json()

    def test_login_returns_refresh_token(self, client):
        res = _login(client, "login_user@example.com", "Login@123")
        assert "refresh_token" in res.get_json()

    def test_wrong_password_returns_401(self, client):
        res = _login(client, "login_user@example.com", "Wrong@123")
        assert res.status_code == 401

    def test_nonexistent_email_returns_401(self, client):
        res = _login(client, "nobody@example.com", "Test@1234")
        assert res.status_code == 401

    def test_missing_password_returns_400(self, client):
        res = client.post(f"{AUTH_API}/login", json={"email": "login_user@example.com"})
        assert res.status_code == 400

    def test_missing_email_returns_400(self, client):
        res = client.post(f"{AUTH_API}/login", json={"password": "Login@123"})
        assert res.status_code == 400


# ═════════════════════════════════════════════════════════════════════════════
# 3. Refresh token
# ═════════════════════════════════════════════════════════════════════════════
class TestRefreshToken:

    @pytest.fixture
    def tokens(self, client):
        _register(client, {"email": "refresh_u@example.com", "password": "Refresh@1"})
        res = _login(client, "refresh_u@example.com", "Refresh@1")
        return res.get_json()

    def test_valid_refresh_returns_new_access_token(self, client, tokens):
        res = client.post(f"{AUTH_API}/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert res.status_code == 200
        assert "access_token" in res.get_json()

    def test_missing_refresh_token_returns_400(self, client):
        res = client.post(f"{AUTH_API}/refresh", json={})
        assert res.status_code == 400

    def test_invalid_refresh_token_returns_401(self, client):
        res = client.post(f"{AUTH_API}/refresh", json={"refresh_token": "badtoken"})
        assert res.status_code == 401

    def test_access_token_rejected_as_refresh(self, client, tokens):
        res = client.post(f"{AUTH_API}/refresh", json={"refresh_token": tokens["access_token"]})
        assert res.status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 4. /me endpoint
# ═════════════════════════════════════════════════════════════════════════════
class TestGetMe:

    @pytest.fixture
    def headers(self, client):
        _register(client, {"email": "me_user@example.com", "password": "Me@12345"})
        res = _login(client, "me_user@example.com", "Me@12345")
        return {"Authorization": f"Bearer {res.get_json()['access_token']}"}

    def test_get_me_returns_200(self, client, headers):
        assert client.get(f"{AUTH_API}/me", headers=headers).status_code == 200

    def test_get_me_returns_correct_email(self, client, headers):
        user = client.get(f"{AUTH_API}/me", headers=headers).get_json()["user"]
        assert user["email"] == "me_user@example.com"

    def test_get_me_no_token_returns_401(self, client):
        assert client.get(f"{AUTH_API}/me").status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 5. Change password  — replace the whole class in test_auth_user.py
# ═════════════════════════════════════════════════════════════════════════════
class TestChangePassword:

    # ── helper: create a brand-new user and return auth headers ──────────────
    @staticmethod
    def _make_user(client, suffix: str, password: str = "Old@1234"):
        """Register a unique user and return (headers, password)."""
        email = f"chpw_{suffix}@example.com"
        _register(client, {"email": email, "password": password})
        res = _login(client, email, password)
        data = res.get_json()
        assert "access_token" in data, f"Login failed for {email}: {data}"
        return {"Authorization": f"Bearer {data['access_token']}"}

    def test_valid_change_returns_200(self, client):
        headers = self._make_user(client, "valid")
        res = client.put(f"{AUTH_API}/change-password",
                         json={"current_password": "Old@1234", "new_password": "New@5678"},
                         headers=headers)
        assert res.status_code == 200

    def test_wrong_current_password_returns_401(self, client):
        headers = self._make_user(client, "wrong")
        res = client.put(f"{AUTH_API}/change-password",
                         json={"current_password": "Wrong@1", "new_password": "New@5678"},
                         headers=headers)
        assert res.status_code == 401

    def test_weak_new_password_returns_400(self, client):
        headers = self._make_user(client, "weak")
        res = client.put(f"{AUTH_API}/change-password",
                         json={"current_password": "Old@1234", "new_password": "weak"},
                         headers=headers)
        assert res.status_code == 400

    def test_missing_fields_returns_400(self, client):
        headers = self._make_user(client, "missing")
        res = client.put(f"{AUTH_API}/change-password", json={}, headers=headers)
        assert res.status_code == 400

    def test_no_auth_returns_401(self, client):
        res = client.put(f"{AUTH_API}/change-password",
                         json={"current_password": "Old@1234", "new_password": "New@5678"})
        assert res.status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 6. Update profile  ← fixed URL: /api/user/profile  (not /api/users/profile)
# ═════════════════════════════════════════════════════════════════════════════
class TestUpdateProfile:

    @pytest.fixture
    def headers(self, client):
        _register(client, {"email": "profile_u@example.com", "password": "Prof@1234"})
        res = _login(client, "profile_u@example.com", "Prof@1234")
        data = res.get_json()
        assert "access_token" in data, f"Login failed: {data}"
        return {"Authorization": f"Bearer {data['access_token']}"}

    def test_update_first_name_returns_200(self, client, headers):
        res = client.put(f"{USER_API}/profile", json={"first_name": "Updated"}, headers=headers)
        assert res.status_code == 200
        assert res.get_json()["user"]["first_name"] == "Updated"

    def test_update_phone_returns_200(self, client, headers):
        res = client.put(f"{USER_API}/profile", json={"phone": "+919876543210"}, headers=headers)
        assert res.status_code == 200

    def test_invalid_phone_returns_400(self, client, headers):
        res = client.put(f"{USER_API}/profile", json={"phone": "123"}, headers=headers)
        assert res.status_code == 400

    def test_empty_body_returns_400(self, client, headers):
        res = client.put(f"{USER_API}/profile", json={}, headers=headers)
        assert res.status_code == 400

    def test_no_auth_returns_401(self, client):
        assert client.put(f"{USER_API}/profile", json={"first_name": "X"}).status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 7. Get all users  ← fixed URL: /api/user/  (not /api/users/)
# ═════════════════════════════════════════════════════════════════════════════
class TestGetAllUsers:

    def test_returns_200_with_valid_token(self, client, auth_headers):
        res = client.get(f"{USER_API}/", headers=auth_headers)
        assert res.status_code == 200

    def test_returns_list(self, client, auth_headers):
        data = client.get(f"{USER_API}/", headers=auth_headers).get_json()
        assert isinstance(data.get("data"), list)

    def test_no_auth_returns_401(self, client):
        assert client.get(f"{USER_API}/").status_code == 401









