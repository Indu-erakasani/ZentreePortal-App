
# """
# TestCases/conftest.py
# Place at: /home/indhu/zentreeportal/TestCases/conftest.py
# """
# import sys
# import os
# import pytest

# # ── 1. Add zentreeportal_backend/ to Python path ─────────────────────────────
# BACKEND_DIR = os.path.abspath(
#     os.path.join(os.path.dirname(__file__), "..", "zentreeportal_backend")
# )
# sys.path.insert(0, BACKEND_DIR)


# # ── 2. App fixture ────────────────────────────────────────────────────────────
# @pytest.fixture(scope="session")
# def app():
#     os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest")

#     from main import app as flask_app          # ← your file is main.py

#     flask_app.config.update({
#         "TESTING":                   True,
#         "JWT_SECRET_KEY":            "test-secret-key-for-pytest",
#         "JWT_ACCESS_TOKEN_EXPIRES":  False,
#         "JWT_REFRESH_TOKEN_EXPIRES": False,
#     })

#     yield flask_app


# # ── 3. HTTP test client ───────────────────────────────────────────────────────
# @pytest.fixture(scope="session")
# def client(app):
#     return app.test_client()


# # ── 4. Seed admin + return auth headers ──────────────────────────────────────
# @pytest.fixture(scope="session")
# def auth_headers(client):
#     # Register admin (ignore 409 if already exists)
#     client.post("/api/auth/register", json={
#         "first_name": "Admin",
#         "last_name":  "User",
#         "email":      "admin@test.com",
#         "password":   "Admin@123",
#         "role":       "admin",
#     })

#     res = client.post("/api/auth/login", json={
#         "email":    "admin@test.com",
#         "password": "Admin@123",
#     })
#     data = res.get_json()

#     assert data and data.get("access_token"), (
#         f"Login failed. Status: {res.status_code}  Body: {data}"
#     )
#     return {"Authorization": f"Bearer {data['access_token']}"}





import sys
import os
import pytest
import mongomock

# ── 1. Add zentreeportal_backend/ to Python path ─────────────────────────────
BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "zentreeportal_backend")
)
sys.path.insert(0, BACKEND_DIR)

# ── 2. Set env variables BEFORE importing anything from the app ───────────────
os.environ["SECRET_KEY"]     = "ZentreeLabs@SuperSecret#2025"
os.environ["JWT_SECRET_KEY"] = "ZentreeLabs@JWT#Secret2025$Key!"
os.environ["MONGO_URI"]      = "mongodb://localhost:27017/zentreePortal"

# ── 3. Create the fake in-memory MongoDB ONCE at module level ─────────────────
_mock_client = mongomock.MongoClient()
_mock_db     = _mock_client["zentreetest"]


# ── 4. App fixture ────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def app():

    # ── Patch database.py BEFORE importing main ───────────────────────────────
    import database
    database.get_db  = lambda: _mock_db
    database.init_db = lambda flask_app: None

    # ── Now safe to import main ───────────────────────────────────────────────
    from zentreeportal_backend.main import app as flask_app

    flask_app.config.update({
        "TESTING":                   True,
        "SECRET_KEY":                "ZentreeLabs@SuperSecret#2025",
        "JWT_SECRET_KEY":            "ZentreeLabs@JWT#Secret2025$Key!",
        "JWT_ACCESS_TOKEN_EXPIRES":  False,   # tokens never expire during tests
        "JWT_REFRESH_TOKEN_EXPIRES": False,
    })

    # ── Patch flask_pymongo's mongo.db ────────────────────────────────────────
    try:
        import extensions
        extensions.mongo.db = _mock_db
    except Exception:
        pass

    yield flask_app


# ── 5. HTTP test client ───────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


# ── 6. Seed admin + return auth headers ──────────────────────────────────────
@pytest.fixture(scope="session")
def auth_headers(client):
    # Register admin — ignore 409 if already exists
    client.post("/api/auth/register", json={
        "first_name": "Admin",
        "last_name":  "User",
        "email":      "admin@test.com",
        "password":   "Admin@123",
        "role":       "admin",
    })

    res = client.post("/api/auth/login", json={
        "email":    "admin@test.com",
        "password": "Admin@123",
    })
    data = res.get_json()

    assert data and data.get("access_token"), (
        f"Login failed. Status: {res.status_code}  Body: {data}"
    )
    return {"Authorization": f"Bearer {data['access_token']}"}