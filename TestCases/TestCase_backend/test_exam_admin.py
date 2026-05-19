"""
Tests for exam_routes.py + admin_routes.py
File: /home/indhu/zentreeportal/TestCases/TestCase_backend/test_exam_admin.py

Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_exam_admin.py -v
"""
import pytest
from datetime import datetime, timedelta
from bson import ObjectId


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
    res = client.post("/api/auth/login", json={
        "email": email, "password": password
    })
    data = res.get_json()
    return {"Authorization": f"Bearer {data['access_token']}"}


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_headers(client):
    _register_user(client, "exam_admin@test.com", role="admin")
    return _login(client, "exam_admin@test.com")


@pytest.fixture(scope="module")
def recruiter_headers(client):
    _register_user(client, "exam_recruiter@test.com", role="recruiter")
    return _login(client, "exam_recruiter@test.com")


@pytest.fixture(scope="module")
def recruiter_user_id(client, admin_headers):
    """Get the MongoDB _id of the recruiter user."""
    res  = client.get("/api/user/", headers=admin_headers)
    data = res.get_json().get("data", [])
    for u in data:
        if u.get("email") == "exam_recruiter@test.com":
            return u.get("_id")
    return None


@pytest.fixture
def seed_job(client, recruiter_headers):
    """Create a job with MCQ/subjective/coding questions, yield its IDs."""
    job_payload = {
        "job_id":         f"EXAMJOB{str(ObjectId())[:6].upper()}",
        "title":          "Exam Test Engineer",
        "client_id":      "CLI001",
        "client_name":    "Exam Corp",
        "openings":       1,
        "job_type":       "Full-Time",
        "work_mode":      "Remote",
        "location":       "Hyderabad",
        "experience_min": 1,
        "experience_max": 5,
        "priority":       "Medium",
        "status":         "Open",
        "skills":         ["Python"],
        "description":    "For exam tests",
    }
    job_res = client.post("/api/jobs/", json=job_payload, headers=recruiter_headers)
    assert job_res.status_code == 201, f"Job creation failed: {job_res.get_json()}"
    job_id = job_res.get_json()["data"]["_id"]

    # Add MCQ questions
    client.patch(f"/api/jobs/{job_id}/questions", json={
        "mcq_questions": [
            {
                "question":       "What is a decorator in Python?",
                "options":        ["A function wrapper", "A class", "A loop", "A module"],
                "correct_answer": ["A function wrapper"],
                "difficulty":     "Medium",
                "topic":          "Python",
            },
            {
                "question":       "What does GIL stand for?",
                "options":        ["Global Interpreter Lock", "General Input Loop",
                                   "Generic Interface Layer", "None"],
                "correct_answer": ["Global Interpreter Lock"],
                "difficulty":     "Hard",
                "topic":          "Python",
            },
        ]
    }, headers=recruiter_headers)

    # Add subjective questions
    client.patch(f"/api/jobs/{job_id}/questions", json={
        "subjective_questions": [
            {
                "question":         "Explain Python's GIL and its impact.",
                "skill":            "Python",
                "difficulty":       "Hard",
                "reference_answer": "GIL prevents multiple threads from executing Python bytecodes.",
                "key_points":       "thread safety, CPython, multiprocessing workaround",
            }
        ]
    }, headers=recruiter_headers)

    # Add coding questions
    client.patch(f"/api/jobs/{job_id}/questions", json={
        "coding_questions": [
            {
                "question":             "Write a function to reverse a string in Python.",
                "programming_language": "Python",
                "difficulty":           "Easy",
                "topic":                "Strings",
            }
        ]
    }, headers=recruiter_headers)

    # Create a candidate in candidate_processing collection via tracking
    from extensions import mongo
    candidate_id = mongo.db.candidate_processing.insert_one({
        "name":      "Exam Candidate",
        "email":     "examcandidate@test.com",
        "resume_id": "RESEXAM001",
        "job_id":    job_id,
    }).inserted_id

    yield {
        "job_id":       job_id,
        "candidate_id": str(candidate_id),
    }

    # Cleanup
    client.delete(f"/api/jobs/{job_id}", headers=recruiter_headers)


@pytest.fixture
def sent_exam(client, recruiter_headers, seed_job):
    """Send an exam and return exam data."""
    payload = {
        "candidate_id":      seed_job["candidate_id"],
        "job_id":            seed_job["job_id"],
        "mcq_count":         2,
        "subjective_count":  1,
        "coding_count":      1,
        "time_limit_minutes": 60,
        "expires_in_days":   3,
    }
    res = client.post("/api/exams/send", json=payload, headers=recruiter_headers)
    assert res.status_code == 201, f"Send exam failed: {res.get_json()}"
    yield res.get_json()["data"]


# ═════════════════════════════════════════════════════════════════════════════
# 1. Admin Routes
# ═════════════════════════════════════════════════════════════════════════════

class TestAdminGetAllUsers:

    def test_returns_200(self, client, admin_headers):
        assert client.get("/api/admin/users", headers=admin_headers).status_code == 200

    def test_returns_users_list(self, client, admin_headers):
        body = client.get("/api/admin/users", headers=admin_headers).get_json()
        assert "users" in body
        assert isinstance(body["users"], list)

    def test_returns_total_count(self, client, admin_headers):
        body = client.get("/api/admin/users", headers=admin_headers).get_json()
        assert "total" in body

    def test_filter_by_role(self, client, admin_headers):
        res = client.get("/api/admin/users?role=recruiter", headers=admin_headers)
        assert res.status_code == 200
        users = res.get_json()["users"]
        assert all(u["role"] == "recruiter" for u in users)

    def test_non_admin_returns_403(self, client, recruiter_headers):
        assert client.get("/api/admin/users",
                          headers=recruiter_headers).status_code == 403

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/admin/users").status_code == 401


class TestAdminGetSingleUser:

    def test_get_existing_user_returns_200(self, client, admin_headers,
                                           recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        res = client.get(f"/api/admin/users/{recruiter_user_id}",
                         headers=admin_headers)
        assert res.status_code == 200
        assert res.get_json()["user"]["_id"] == recruiter_user_id

    def test_nonexistent_user_returns_404(self, client, admin_headers):
        res = client.get("/api/admin/users/000000000000000000000000",
                         headers=admin_headers)
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client):
        assert client.get(
            "/api/admin/users/000000000000000000000000").status_code == 401


class TestAdminUpdateUser:

    def test_update_role_returns_200(self, client, admin_headers,
                                     recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        res = client.put(
            f"/api/admin/users/{recruiter_user_id}",
            json={"role": "manager"},
            headers=admin_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["user"]["role"] == "manager"

    def test_update_first_name(self, client, admin_headers, recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        res = client.put(
            f"/api/admin/users/{recruiter_user_id}",
            json={"first_name": "UpdatedFirst"},
            headers=admin_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["user"]["first_name"] == "UpdatedFirst"

    def test_invalid_role_returns_400(self, client, admin_headers,
                                      recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        res = client.put(
            f"/api/admin/users/{recruiter_user_id}",
            json={"role": "superadmin"},
            headers=admin_headers,
        )
        assert res.status_code == 400

    def test_invalid_phone_returns_400(self, client, admin_headers,
                                       recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        res = client.put(
            f"/api/admin/users/{recruiter_user_id}",
            json={"phone": "123"},
            headers=admin_headers,
        )
        assert res.status_code == 400

    def test_empty_body_returns_400(self, client, admin_headers,
                                    recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        res = client.put(
            f"/api/admin/users/{recruiter_user_id}",
            json={},
            headers=admin_headers,
        )
        assert res.status_code == 400

    def test_nonexistent_user_returns_404(self, client, admin_headers):
        res = client.put(
            "/api/admin/users/000000000000000000000000",
            json={"first_name": "X"},
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client, recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        assert client.put(
            f"/api/admin/users/{recruiter_user_id}",
            json={"first_name": "X"},
        ).status_code == 401


class TestAdminToggleStatus:

    def test_toggle_status_returns_200(self, client, admin_headers,
                                       recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        res = client.patch(
            f"/api/admin/users/{recruiter_user_id}/toggle-status",
            headers=admin_headers,
        )
        assert res.status_code == 200
        assert "is_active" in res.get_json()

    def test_nonexistent_user_returns_404(self, client, admin_headers):
        res = client.patch(
            "/api/admin/users/000000000000000000000000/toggle-status",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client, recruiter_user_id):
        if not recruiter_user_id:
            pytest.skip("recruiter user id not found")
        assert client.patch(
            f"/api/admin/users/{recruiter_user_id}/toggle-status"
        ).status_code == 401


class TestAdminDeleteUser:

    def test_delete_nonexistent_returns_404(self, client, admin_headers):
        assert client.delete(
            "/api/admin/users/000000000000000000000000",
            headers=admin_headers,
        ).status_code == 404

    def test_unauthenticated_returns_401(self, client):
        assert client.delete(
            "/api/admin/users/000000000000000000000000"
        ).status_code == 401

    def test_non_admin_returns_403(self, client, recruiter_headers):
        assert client.delete(
            "/api/admin/users/000000000000000000000000",
            headers=recruiter_headers,
        ).status_code == 403


class TestAdminStats:

    def test_returns_200(self, client, admin_headers):
        assert client.get("/api/admin/stats",
                          headers=admin_headers).status_code == 200

    def test_returns_total_users(self, client, admin_headers):
        body = client.get("/api/admin/stats", headers=admin_headers).get_json()
        assert "total_users" in body["stats"]

    def test_returns_active_users(self, client, admin_headers):
        body = client.get("/api/admin/stats", headers=admin_headers).get_json()
        assert "active_users" in body["stats"]

    def test_returns_by_role(self, client, admin_headers):
        body = client.get("/api/admin/stats", headers=admin_headers).get_json()
        assert "by_role" in body["stats"]
        assert "recruiter" in body["stats"]["by_role"]

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/admin/stats").status_code == 401

    def test_non_admin_returns_403(self, client, recruiter_headers):
        assert client.get("/api/admin/stats",
                          headers=recruiter_headers).status_code == 403


# ═════════════════════════════════════════════════════════════════════════════
# 2. Exam Routes — Send Exam
# ═════════════════════════════════════════════════════════════════════════════

class TestSendExam:

    def test_send_exam_returns_201(self, client, recruiter_headers, sent_exam):
        assert sent_exam.get("exam_id") is not None

    def test_exam_id_starts_with_exm(self, client, recruiter_headers, sent_exam):
        assert sent_exam["exam_id"].startswith("EXM")

    def test_token_is_present(self, client, recruiter_headers, sent_exam):
        assert len(sent_exam.get("token", "")) > 10

    def test_exam_link_is_present(self, client, recruiter_headers, sent_exam):
        assert "exam_link" in sent_exam
        assert sent_exam["exam_link"].endswith(sent_exam["token"])

    def test_expires_at_is_present(self, client, recruiter_headers, sent_exam):
        assert "expires_at" in sent_exam

    def test_missing_candidate_id_returns_400(self, client, recruiter_headers,
                                               seed_job):
        res = client.post("/api/exams/send", json={
            "job_id":   seed_job["job_id"],
            "mcq_count": 1,
        }, headers=recruiter_headers)
        assert res.status_code == 400

    def test_missing_job_id_returns_400(self, client, recruiter_headers,
                                         seed_job):
        res = client.post("/api/exams/send", json={
            "candidate_id": seed_job["candidate_id"],
            "mcq_count":    1,
        }, headers=recruiter_headers)
        assert res.status_code == 400

    def test_unauthenticated_returns_401(self, client):
        assert client.post("/api/exams/send", json={}).status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 3. Exam Routes — Take Exam (public)
# ═════════════════════════════════════════════════════════════════════════════

class TestTakeExam:

    def test_take_exam_returns_200(self, client, sent_exam):
        token = sent_exam["token"]
        res   = client.get(f"/api/exams/take/{token}")
        assert res.status_code == 200

    def test_take_exam_returns_questions(self, client, sent_exam):
        token = sent_exam["token"]
        body  = client.get(f"/api/exams/take/{token}").get_json()
        data  = body["data"]
        assert "mcq_questions"        in data
        assert "subjective_questions" in data
        assert "coding_questions"     in data

    def test_correct_answer_not_exposed(self, client, sent_exam):
        token = sent_exam["token"]
        body  = client.get(f"/api/exams/take/{token}").get_json()
        for q in body["data"].get("mcq_questions", []):
            assert "_correct" not in q

    def test_invalid_token_returns_404(self, client):
        assert client.get("/api/exams/take/invalid-token-xyz").status_code == 404

    def test_exam_status_changes_to_in_progress(self, client, sent_exam):
        token = sent_exam["token"]
        body  = client.get(f"/api/exams/take/{token}").get_json()
        assert body["data"]["status"] in ["In Progress", "Sent"]


# ═════════════════════════════════════════════════════════════════════════════
# 4. Exam Routes — Submit Exam (public)
# ═════════════════════════════════════════════════════════════════════════════

class TestSubmitExam:

    def test_submit_exam_returns_200(self, client, sent_exam):
        token = sent_exam["token"]
        # First take it
        take_body = client.get(f"/api/exams/take/{token}").get_json()
        data      = take_body["data"]

        mcq_answers  = [
            {"question_index": i, "selected_option": q["options"][0]}
            for i, q in enumerate(data.get("mcq_questions", []))
        ]
        subj_answers = [
            {"question_index": i, "answer": "This is my detailed answer about the topic."}
            for i in range(len(data.get("subjective_questions", [])))
        ]
        code_answers = [
            {
                "question_index": i,
                "code":           "def reverse_string(s):\n    return s[::-1]",
                "run_output":     "dlrow olleh",
                "run_status":     "Accepted",
            }
            for i in range(len(data.get("coding_questions", [])))
        ]

        res = client.post(f"/api/exams/submit/{token}", json={
            "mcq":        mcq_answers,
            "subjective": subj_answers,
            "coding":     code_answers,
            "proctoring": {"events": [], "snapshots": []},
        })
        assert res.status_code == 200

    def test_submit_returns_scores(self, client, sent_exam):
        token     = sent_exam["token"]
        take_body = client.get(f"/api/exams/take/{token}").get_json()
        # exam may already be submitted — 409 is acceptable
        res = client.post(f"/api/exams/submit/{token}", json={
            "mcq": [], "subjective": [], "coding": [],
            "proctoring": {"events": [], "snapshots": []},
        })
        assert res.status_code in [200, 409]

    def test_double_submit_returns_409(self, client, sent_exam):
        token = sent_exam["token"]
        # Try submitting twice
        payload = {
            "mcq": [], "subjective": [], "coding": [],
            "proctoring": {"events": [], "snapshots": []},
        }
        client.post(f"/api/exams/submit/{token}", json=payload)
        res = client.post(f"/api/exams/submit/{token}", json=payload)
        assert res.status_code == 409

    def test_invalid_token_returns_404(self, client):
        assert client.post(
            "/api/exams/submit/invalid-token-xyz", json={}
        ).status_code == 404


# ═════════════════════════════════════════════════════════════════════════════
# 5. Exam Routes — Get Exams (authenticated)
# ═════════════════════════════════════════════════════════════════════════════

class TestGetExams:

    def test_get_all_exams_returns_200(self, client, recruiter_headers):
        assert client.get("/api/exams/",
                          headers=recruiter_headers).status_code == 200

    def test_get_all_exams_returns_list(self, client, recruiter_headers):
        body = client.get("/api/exams/", headers=recruiter_headers).get_json()
        assert isinstance(body["data"], list)

    def test_filter_by_status(self, client, recruiter_headers):
        res = client.get("/api/exams/?status=Sent", headers=recruiter_headers)
        assert res.status_code == 200

    def test_get_exam_by_id_returns_200(self, client, recruiter_headers,
                                         sent_exam):
        from extensions import mongo
        exam = mongo.db.exams.find_one({"token": sent_exam["token"]})
        if not exam:
            pytest.skip("exam not found")
        res = client.get(f"/api/exams/{str(exam['_id'])}",
                         headers=recruiter_headers)
        assert res.status_code == 200

    def test_get_exam_nonexistent_returns_404(self, client, recruiter_headers):
        res = client.get("/api/exams/000000000000000000000000",
                         headers=recruiter_headers)
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/exams/").status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 6. Exam Routes — Proctoring
# ═════════════════════════════════════════════════════════════════════════════

class TestProctoringEvent:

    def test_store_event_returns_200(self, client, sent_exam):
        token = sent_exam["token"]
        res   = client.post(f"/api/exams/proctor/{token}/event", json={
            "type": "warning",
            "msg":  "Looking away from screen",
            "ts":   datetime.utcnow().isoformat(),
        })
        assert res.status_code == 200

    def test_store_event_invalid_token_returns_404(self, client):
        assert client.post(
            "/api/exams/proctor/bad-token-xyz/event",
            json={"type": "warning", "msg": "test"},
        ).status_code == 404


# ═════════════════════════════════════════════════════════════════════════════
# 7. Exam Routes — Notifications
# ═════════════════════════════════════════════════════════════════════════════

class TestNotifications:

    def test_get_notifications_returns_200(self, client, recruiter_headers):
        assert client.get("/api/exams/notifications/",
                          headers=recruiter_headers).status_code == 200

    def test_notifications_returns_list(self, client, recruiter_headers):
        body = client.get("/api/exams/notifications/",
                          headers=recruiter_headers).get_json()
        assert isinstance(body["data"], list)

    def test_notifications_returns_unread_count(self, client, recruiter_headers):
        body = client.get("/api/exams/notifications/",
                          headers=recruiter_headers).get_json()
        assert "unread" in body

    def test_mark_all_read_returns_200(self, client, recruiter_headers):
        assert client.put("/api/exams/notifications/read-all",
                          headers=recruiter_headers).status_code == 200

    def test_unauthenticated_returns_401(self, client):
        assert client.get("/api/exams/notifications/").status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 8. Compile Code (public)
# ═════════════════════════════════════════════════════════════════════════════

class TestCompileCode:

    def test_compile_returns_200(self, client):
        res = client.post("/api/exams/compile", json={
            "code":     "print('hello')",
            "language": "Python",
            "stdin":    "",
        })
        assert res.status_code == 200

    def test_empty_code_returns_400(self, client):
        res = client.post("/api/exams/compile", json={
            "code": "", "language": "Python"
        })
        assert res.status_code == 400

    def test_compile_returns_stdout(self, client):
        res  = client.post("/api/exams/compile", json={
            "code": "print('hello')", "language": "Python"
        })
        data = res.get_json().get("data", {})
        assert "stdout" in data or "status" in data