"""
Tests for zentreeportal_backend.routes.question_routes.py
File: TestCases/TestCase_backend/test_question.py

Run from the project root:
    cd /home/indhu/zentreeportal
    pytest TestCases/TestCase_backend/test_question.py -v
"""
import pytest
from bson import ObjectId
import json
from unittest.mock import patch, MagicMock
 


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
def recruiter_headers(client):
    _register_user(client, "q_recruiter@test.com", role="recruiter")
    return _login(client, "q_recruiter@test.com")


@pytest.fixture
def seed_job(client, recruiter_headers):
    """Creates a job with a description and yields its _id. Cleans up after."""
    payload = {
        "job_id":         f"QJOB{str(ObjectId())[:6].upper()}",
        "title":          "Python Backend Engineer",
        "client_id":      "CLI001",
        "client_name":    "Question Corp",
        "openings":       2,
        "job_type":       "Full-Time",
        "work_mode":      "Remote",
        "location":       "Hyderabad",
        "experience_min": 2,
        "experience_max": 5,
        "priority":       "High",
        "status":         "Open",
        "skills":         ["Python", "Flask", "MongoDB"],
        "description":    (
            "We are looking for a Python Backend Engineer experienced in "
            "Flask, MongoDB, REST APIs, JWT authentication, and system design. "
            "The candidate should be comfortable writing clean, testable code "
            "and understanding asynchronous programming models."
        ),
    }
    res = client.post("/api/jobs/", json=payload, headers=recruiter_headers)
    assert res.status_code == 201, f"Job creation failed: {res.get_json()}"
    job_id = res.get_json()["data"]["_id"]
    yield job_id
    client.delete(f"/api/jobs/{job_id}", headers=recruiter_headers)


@pytest.fixture
def job_with_questions(client, recruiter_headers, seed_job):
    """Job that already has manually added questions of all three types."""
    jid = seed_job

    # MCQ
    client.post(f"/api/questions/jobs/{jid}/manual", json={
        "type": "mcq",
        "question": {
            "question":       "What is a Python decorator?",
            "options":        ["A function wrapper", "A class", "A loop", "A module"],
            "correct_answer": ["A function wrapper"],
            "difficulty":     "Medium",
            "topic":          "Python",
        }
    }, headers=recruiter_headers)

    # Subjective
    client.post(f"/api/questions/jobs/{jid}/manual", json={
        "type": "subjective",
        "question": {
            "question":         "Describe how you would design a REST API for a job portal.",
            "reference_answer": "Use resource-based URLs, HTTP verbs, JWT auth...",
            "key_points":       "• REST principles\n• Auth\n• Error handling",
            "skill":            "System Design",
            "difficulty":       "Hard",
        }
    }, headers=recruiter_headers)

    # Coding
    client.post(f"/api/questions/jobs/{jid}/manual", json={
        "type": "coding",
        "question": {
            "question":             "Write a function to find duplicates in a list.\n\nInput: list of ints\nOutput: list of duplicates\n\nExample:\nInput: [1,2,2,3]\nOutput: [2]\n\nConstraints:\n- O(n) time",
            "programming_language": "Python",
            "difficulty":           "Medium",
            "topic":                "Arrays",
        }
    }, headers=recruiter_headers)

    return jid


# ── Shared mock Gemini response ───────────────────────────────────────────────
 
MOCK_GEMINI_PAYLOAD = {
    "mcq_questions": [
        {
            "question":       "What is a Python decorator?",
            "options":        ["A function wrapper", "A class", "A loop", "A module"],
            "correct_answer": ["A function wrapper"],
            "topic":          "Python",
            "difficulty":     "Medium",
        },
        {
            "question":       "What does GIL stand for in CPython?",
            "options":        ["Global Interpreter Lock", "General Input Loop",
                               "Generic Interface Layer", "None of the above"],
            "correct_answer": ["Global Interpreter Lock"],
            "topic":          "Python Internals",
            "difficulty":     "Hard",
        },
    ],
    "subjective_questions": [
        {
            "question":         "How would you design a REST API for a job portal?",
            "reference_answer": "Use resource-based URLs, HTTP verbs, JWT auth, and versioning.",
            "key_points":       "• REST principles\n• JWT auth\n• Error handling",
            "skill":            "System Design",
            "difficulty":       "Hard",
        }
    ],
    "coding_questions": [
        {
            "programming_language": "Python",
            "question":   "Two Sum\n\nFind two numbers that sum to target.\n\nInput: nums=[2,7,11], target=9\nOutput: [0,1]\n\nConstraints:\n- Exactly one solution\n\nWrite your solution in Python",
            "difficulty": "Easy",
            "topic":      "Hash Map",
        }
    ],
}
 
 
def _mock_gemini_post(*args, **kwargs):
    """Returns a fake requests.Response that mimics Gemini's JSON structure."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{"text": json.dumps(MOCK_GEMINI_PAYLOAD)}]
            }
        }]
    }
    return mock_resp
 
 

# ═════════════════════════════════════════════════════════════════════════════
# 1. Generate Questions  —  POST /api/questions/jobs/<jid>/generate
# ═════════════════════════════════════════════════════════════════════════════
 
class TestGenerateQuestions:
 
    def test_generate_returns_200(self, client, recruiter_headers, seed_job):
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
        assert res.status_code == 200
 
    def test_generate_success_flag(self, client, recruiter_headers, seed_job):
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
        assert res.get_json()["success"] is True
 
    def test_generate_returns_question_lists(self, client, recruiter_headers, seed_job):
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
        data = res.get_json()["data"]
        assert "mcq_questions"        in data
        assert "subjective_questions" in data
        assert "coding_questions"     in data
 
    def test_generate_returns_bank_totals(self, client, recruiter_headers, seed_job):
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
        data = res.get_json()["data"]
        assert "total_mcq_in_bank"  in data
        assert "total_subj_in_bank" in data
        assert "total_code_in_bank" in data
 
    def test_generate_returns_exp_level(self, client, recruiter_headers, seed_job):
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
        assert "exp_level" in res.get_json()["data"]
 
    def test_generate_returns_generation_history(self, client, recruiter_headers, seed_job):
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
        assert isinstance(res.get_json()["data"].get("generation_history"), list)
 
    def test_generate_replace_existing_clears_bank(self, client, recruiter_headers, seed_job):
        # First pass — seed the bank
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
 
        # Second pass — replace_existing=True
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={
                    "mcq_count": 2, "subjective_count": 1, "coding_count": 1,
                    "replace_existing": True,
                },
                headers=recruiter_headers,
            )
        data = res.get_json()["data"]
        # With replace=True, bank total == freshly generated (added) count
        assert data["total_mcq_in_bank"] == data["mcq_added"]
 
    def test_generate_all_zeros_returns_400(self, client, recruiter_headers, seed_job):
        res = client.post(
            f"/api/questions/jobs/{seed_job}/generate",
            json={"mcq_count": 0, "subjective_count": 0, "coding_count": 0},
            headers=recruiter_headers,
        )
        assert res.status_code == 400
 
    def test_generate_invalid_job_id_returns_400(self, client, recruiter_headers):
        res = client.post(
            "/api/questions/jobs/not-a-valid-id/generate",
            json={"mcq_count": 2},
            headers=recruiter_headers,
        )
        assert res.status_code == 400
 
    def test_generate_nonexistent_job_returns_404(self, client, recruiter_headers):
        from bson import ObjectId
        res = client.post(
            f"/api/questions/jobs/{str(ObjectId())}/generate",
            json={"mcq_count": 2},
            headers=recruiter_headers,
        )
        assert res.status_code == 404
 
    def test_generate_unauthenticated_returns_401(self, client, seed_job):
        res = client.post(
            f"/api/questions/jobs/{seed_job}/generate",
            json={"mcq_count": 2},
        )
        assert res.status_code == 401
 
    def test_generate_custom_difficulty_distribution(self, client, recruiter_headers, seed_job):
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={
                    "mcq_count": 2,
                    "subjective_count": 1,
                    "coding_count": 1,
                    "difficulty_distribution": "50% Easy, 30% Medium, 20% Hard",
                },
                headers=recruiter_headers,
            )
        assert res.status_code == 200
        history = res.get_json()["data"]["generation_history"][-1]
        assert history["custom_difficulty"] is True
 
    def test_generate_no_api_key_returns_500(self, client, recruiter_headers, seed_job):
        """Without mocking, missing key must return 500 — confirms the guard works."""
        with patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value=""):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
        assert res.status_code == 500
 
    def test_generate_gemini_bad_json_returns_422(self, client, recruiter_headers, seed_job):
        """Gemini returns non-JSON text → route must return 422."""
        def _bad_json_resp(*args, **kwargs):
            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = {
                "candidates": [{
                    "content": {"parts": [{"text": "not valid json at all!!!"}]}
                }]
            }
            return mock_resp
 
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_bad_json_resp), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            res = client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
        assert res.status_code == 422
 


# ═════════════════════════════════════════════════════════════════════════════
# 2. Get Questions  —  GET /api/questions/jobs/<jid>
# ═════════════════════════════════════════════════════════════════════════════

class TestGetQuestions:

    def test_get_questions_returns_200(self, client, recruiter_headers, job_with_questions):
        res = client.get(
            f"/api/questions/jobs/{job_with_questions}",
            headers=recruiter_headers,
        )
        assert res.status_code == 200

    def test_get_questions_success_flag(self, client, recruiter_headers, job_with_questions):
        res = client.get(
            f"/api/questions/jobs/{job_with_questions}",
            headers=recruiter_headers,
        )
        assert res.get_json()["success"] is True

    def test_get_questions_returns_all_types(self, client, recruiter_headers, job_with_questions):
        body = client.get(
            f"/api/questions/jobs/{job_with_questions}",
            headers=recruiter_headers,
        ).get_json()["data"]
        assert "mcq_questions"        in body
        assert "subjective_questions" in body
        assert "coding_questions"     in body

    def test_get_questions_returns_counts(self, client, recruiter_headers, job_with_questions):
        body = client.get(
            f"/api/questions/jobs/{job_with_questions}",
            headers=recruiter_headers,
        ).get_json()["data"]
        assert "mcq_questions_count"        in body
        assert "subjective_questions_count" in body
        assert "coding_questions_count"     in body

    def test_get_questions_show_all_param(self, client, recruiter_headers, job_with_questions):
        res = client.get(
            f"/api/questions/jobs/{job_with_questions}?show_all=true",
            headers=recruiter_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["show_all"] is True

    def test_get_questions_invalid_job_returns_400(self, client, recruiter_headers):
        res = client.get(
            "/api/questions/jobs/bad-id",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_get_questions_nonexistent_job_returns_404(self, client, recruiter_headers):
        res = client.get(
            f"/api/questions/jobs/{str(ObjectId())}",
            headers=recruiter_headers,
        )
        assert res.status_code == 404

    def test_get_questions_unauthenticated_returns_401(self, client, job_with_questions):
        assert client.get(
            f"/api/questions/jobs/{job_with_questions}"
        ).status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 3. Manual Add Questions  —  POST /api/questions/jobs/<jid>/manual
# ═════════════════════════════════════════════════════════════════════════════

class TestAddManualQuestions:

    # ── MCQ ─────────────────────────────────────────────────────────────────

    def test_add_mcq_returns_201(self, client, recruiter_headers, seed_job):
        res = client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "What does GIL stand for in Python?",
                "options":        ["Global Interpreter Lock", "General Input Loop",
                                   "Generic Interface Layer", "None of the above"],
                "correct_answer": ["Global Interpreter Lock"],
                "difficulty":     "Hard",
                "topic":          "Python Internals",
            }
        }, headers=recruiter_headers)
        assert res.status_code == 201

    def test_add_mcq_returns_question_object(self, client, recruiter_headers, seed_job):
        res = client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "Which Python keyword is used to define a generator?",
                "options":        ["yield", "return", "async", "gen"],
                "correct_answer": ["yield"],
                "difficulty":     "Easy",
                "topic":          "Python",
            }
        }, headers=recruiter_headers)
        data = res.get_json()["data"]
        assert "question" in data
        assert "total"    in data

    def test_add_mcq_image_file_id_is_none_without_image(self, client, recruiter_headers, seed_job):
        res = client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "What is list comprehension in Python?",
                "options":        ["Shorthand for loops", "A data type", "A module", "None"],
                "correct_answer": ["Shorthand for loops"],
                "difficulty":     "Easy",
                "topic":          "Python",
            }
        }, headers=recruiter_headers)
        assert res.get_json()["data"]["image_file_id"] is None

    # ── Subjective ──────────────────────────────────────────────────────────

    def test_add_subjective_returns_201(self, client, recruiter_headers, seed_job):
        res = client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "subjective",
            "question": {
                "question":         "How would you handle database migrations in a Flask app?",
                "reference_answer": "Use Flask-Migrate with Alembic for schema versioning.",
                "key_points":       "• Flask-Migrate\n• Alembic\n• Rollbacks",
                "skill":            "Flask",
                "difficulty":       "Medium",
            }
        }, headers=recruiter_headers)
        assert res.status_code == 201

    def test_add_subjective_increments_count(self, client, recruiter_headers, seed_job):
        before = client.get(
            f"/api/questions/jobs/{seed_job}",
            headers=recruiter_headers,
        ).get_json()["data"]["subjective_questions_count"]

        client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "subjective",
            "question": {
                "question":         "Describe a challenging debugging experience you have had.",
                "reference_answer": "...",
                "key_points":       "• Systematic approach\n• Tools used",
                "skill":            "Debugging",
                "difficulty":       "Medium",
            }
        }, headers=recruiter_headers)

        after = client.get(
            f"/api/questions/jobs/{seed_job}",
            headers=recruiter_headers,
        ).get_json()["data"]["subjective_questions_count"]
        assert after == before + 1

    # ── Coding ──────────────────────────────────────────────────────────────

    def test_add_coding_returns_201(self, client, recruiter_headers, seed_job):
        res = client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "coding",
            "question": {
                "question":             "Given an array, find the two numbers that sum to a target.\n\nInput: nums=[2,7,11], target=9\nOutput: [0,1]\n\nConstraints:\n- Exactly one solution",
                "programming_language": "Python",
                "difficulty":           "Easy",
                "topic":                "Hash Map",
            }
        }, headers=recruiter_headers)
        assert res.status_code == 201

    # ── Validation ──────────────────────────────────────────────────────────

    def test_add_invalid_type_returns_400(self, client, recruiter_headers, seed_job):
        res = client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "unknown_type",
            "question": {"question": "Some question?"}
        }, headers=recruiter_headers)
        assert res.status_code == 400

    def test_add_empty_question_text_returns_400(self, client, recruiter_headers, seed_job):
        res = client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "   ",
                "options":        ["A", "B", "C", "D"],
                "correct_answer": ["A"],
                "difficulty":     "Easy",
                "topic":          "Python",
            }
        }, headers=recruiter_headers)
        assert res.status_code == 400

    def test_add_duplicate_question_returns_409(self, client, recruiter_headers, seed_job):
        payload = {
            "type": "mcq",
            "question": {
                "question":       "What is the difference between a list and a tuple in Python?",
                "options":        ["Mutability", "Size", "Speed", "None"],
                "correct_answer": ["Mutability"],
                "difficulty":     "Easy",
                "topic":          "Python",
            }
        }
        client.post(f"/api/questions/jobs/{seed_job}/manual",
                    json=payload, headers=recruiter_headers)
        res = client.post(f"/api/questions/jobs/{seed_job}/manual",
                          json=payload, headers=recruiter_headers)
        assert res.status_code == 409

    def test_add_question_invalid_job_returns_400(self, client, recruiter_headers):
        res = client.post("/api/questions/jobs/not-valid/manual", json={
            "type": "mcq",
            "question": {"question": "Something?"}
        }, headers=recruiter_headers)
        assert res.status_code == 400

    def test_add_question_nonexistent_job_returns_404(self, client, recruiter_headers):
        res = client.post(f"/api/questions/jobs/{str(ObjectId())}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "Is this reachable?",
                "options":        ["Yes", "No", "Maybe", "Never"],
                "correct_answer": ["No"],
                "difficulty":     "Easy",
                "topic":          "General",
            }
        }, headers=recruiter_headers)
        assert res.status_code == 404

    def test_add_question_unauthenticated_returns_401(self, client, seed_job):
        res = client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "mcq",
            "question": {"question": "Unauthorized?"}
        })
        assert res.status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 4. Delete Question  —  DELETE /api/questions/jobs/<jid>/<q_type>/<index>
# ═════════════════════════════════════════════════════════════════════════════

class TestDeleteQuestion:

    def test_delete_mcq_returns_200(self, client, recruiter_headers, job_with_questions):
        res = client.delete(
            f"/api/questions/jobs/{job_with_questions}/mcq/0",
            headers=recruiter_headers,
        )
        assert res.status_code == 200

    def test_delete_subjective_returns_200(self, client, recruiter_headers, job_with_questions):
        res = client.delete(
            f"/api/questions/jobs/{job_with_questions}/subjective/0",
            headers=recruiter_headers,
        )
        assert res.status_code == 200

    def test_delete_coding_returns_200(self, client, recruiter_headers, job_with_questions):
        res = client.delete(
            f"/api/questions/jobs/{job_with_questions}/coding/0",
            headers=recruiter_headers,
        )
        assert res.status_code == 200

    def test_delete_returns_remaining_count(self, client, recruiter_headers, job_with_questions):
        # Add a question first so there is something to delete
        client.post(f"/api/questions/jobs/{job_with_questions}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "What is monkey patching in Python?",
                "options":        ["Runtime modification", "A test", "A module", "None"],
                "correct_answer": ["Runtime modification"],
                "difficulty":     "Hard",
                "topic":          "Python",
            }
        }, headers=recruiter_headers)
        res = client.delete(
            f"/api/questions/jobs/{job_with_questions}/mcq/0",
            headers=recruiter_headers,
        )
        assert "remaining" in res.get_json()["message"]

    def test_delete_invalid_q_type_returns_400(self, client, recruiter_headers, job_with_questions):
        res = client.delete(
            f"/api/questions/jobs/{job_with_questions}/unknown/0",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_delete_out_of_range_index_returns_400(self, client, recruiter_headers, job_with_questions):
        res = client.delete(
            f"/api/questions/jobs/{job_with_questions}/mcq/9999",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_delete_invalid_job_returns_400(self, client, recruiter_headers):
        res = client.delete(
            "/api/questions/jobs/bad-id/mcq/0",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_delete_nonexistent_job_returns_404(self, client, recruiter_headers):
        res = client.delete(
            f"/api/questions/jobs/{str(ObjectId())}/mcq/0",
            headers=recruiter_headers,
        )
        assert res.status_code == 404

    def test_delete_unauthenticated_returns_401(self, client, job_with_questions):
        assert client.delete(
            f"/api/questions/jobs/{job_with_questions}/mcq/0"
        ).status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 5. Toggle Question Active  —  PUT /api/questions/jobs/<jid>/<q_type>/<index>/toggle
# ═════════════════════════════════════════════════════════════════════════════

class TestToggleQuestionActive:

    def test_toggle_mcq_returns_200(self, client, recruiter_headers, job_with_questions):
        # Ensure at least one MCQ exists
        client.post(f"/api/questions/jobs/{job_with_questions}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "What is a context manager in Python?",
                "options":        ["with statement", "class", "loop", "function"],
                "correct_answer": ["with statement"],
                "difficulty":     "Medium",
                "topic":          "Python",
            }
        }, headers=recruiter_headers)
        res = client.put(
            f"/api/questions/jobs/{job_with_questions}/mcq/0/toggle",
            headers=recruiter_headers,
        )
        assert res.status_code == 200

    def test_toggle_returns_is_active_field(self, client, recruiter_headers, job_with_questions):
        client.post(f"/api/questions/jobs/{job_with_questions}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "Explain Python virtual environments.",
                "options":        ["Isolated env", "Global scope", "Thread", "Process"],
                "correct_answer": ["Isolated env"],
                "difficulty":     "Easy",
                "topic":          "Python",
            }
        }, headers=recruiter_headers)
        res = client.put(
            f"/api/questions/jobs/{job_with_questions}/mcq/0/toggle",
            headers=recruiter_headers,
        )
        data = res.get_json()["data"]
        assert "is_active"    in data
        assert "active_count" in data
        assert "total"        in data

    def test_toggle_flips_state(self, client, recruiter_headers, job_with_questions):
        client.post(f"/api/questions/jobs/{job_with_questions}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "What is the purpose of __init__.py?",
                "options":        ["Package marker", "Class init", "Module alias", "Config"],
                "correct_answer": ["Package marker"],
                "difficulty":     "Easy",
                "topic":          "Python",
            }
        }, headers=recruiter_headers)
        first  = client.put(
            f"/api/questions/jobs/{job_with_questions}/mcq/0/toggle",
            headers=recruiter_headers,
        ).get_json()["data"]["is_active"]
        second = client.put(
            f"/api/questions/jobs/{job_with_questions}/mcq/0/toggle",
            headers=recruiter_headers,
        ).get_json()["data"]["is_active"]
        assert first != second

    def test_toggle_invalid_q_type_returns_400(self, client, recruiter_headers, job_with_questions):
        res = client.put(
            f"/api/questions/jobs/{job_with_questions}/badtype/0/toggle",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_toggle_out_of_range_returns_400(self, client, recruiter_headers, job_with_questions):
        res = client.put(
            f"/api/questions/jobs/{job_with_questions}/mcq/9999/toggle",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_toggle_invalid_job_returns_400(self, client, recruiter_headers):
        res = client.put(
            "/api/questions/jobs/bad-id/mcq/0/toggle",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_toggle_nonexistent_job_returns_404(self, client, recruiter_headers):
        res = client.put(
            f"/api/questions/jobs/{str(ObjectId())}/mcq/0/toggle",
            headers=recruiter_headers,
        )
        assert res.status_code == 404

    def test_toggle_unauthenticated_returns_401(self, client, job_with_questions):
        assert client.put(
            f"/api/questions/jobs/{job_with_questions}/mcq/0/toggle"
        ).status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 6. Clear Questions  —  DELETE /api/questions/jobs/<jid>/clear
# ═════════════════════════════════════════════════════════════════════════════

class TestClearQuestions:

    def test_clear_returns_200(self, client, recruiter_headers, job_with_questions):
        res = client.delete(
            f"/api/questions/jobs/{job_with_questions}/clear",
            headers=recruiter_headers,
        )
        assert res.status_code == 200

    def test_clear_empties_all_banks(self, client, recruiter_headers, seed_job):
        # Seed a question first
        client.post(f"/api/questions/jobs/{seed_job}/manual", json={
            "type": "mcq",
            "question": {
                "question":       "What is asyncio used for in Python?",
                "options":        ["Async I/O", "Threading", "Multiprocessing", "None"],
                "correct_answer": ["Async I/O"],
                "difficulty":     "Hard",
                "topic":          "Python",
            }
        }, headers=recruiter_headers)

        client.delete(
            f"/api/questions/jobs/{seed_job}/clear",
            headers=recruiter_headers,
        )

        body = client.get(
            f"/api/questions/jobs/{seed_job}",
            headers=recruiter_headers,
        ).get_json()["data"]

        assert body["mcq_questions"]        == []
        assert body["subjective_questions"] == []
        assert body["coding_questions"]     == []

    def test_clear_success_message(self, client, recruiter_headers, seed_job):
        res = client.delete(
            f"/api/questions/jobs/{seed_job}/clear",
            headers=recruiter_headers,
        )
        assert "cleared" in res.get_json()["message"].lower()

    def test_clear_invalid_job_returns_400(self, client, recruiter_headers):
        res = client.delete(
            "/api/questions/jobs/bad-id/clear",
            headers=recruiter_headers,
        )
        assert res.status_code == 400

    def test_clear_nonexistent_job_returns_404(self, client, recruiter_headers):
        res = client.delete(
            f"/api/questions/jobs/{str(ObjectId())}/clear",
            headers=recruiter_headers,
        )
        assert res.status_code == 404

    def test_clear_unauthenticated_returns_401(self, client, seed_job):
        assert client.delete(
            f"/api/questions/jobs/{seed_job}/clear"
        ).status_code == 401

 
# ═════════════════════════════════════════════════════════════════════════════
# 7. Generation History  —  GET /api/questions/jobs/<jid>/history
# ═════════════════════════════════════════════════════════════════════════════
 
class TestGenerationHistory:
 
    def test_history_returns_200(self, client, recruiter_headers, seed_job):
        res = client.get(
            f"/api/questions/jobs/{seed_job}/history",
            headers=recruiter_headers,
        )
        assert res.status_code == 200
 
    def test_history_returns_list(self, client, recruiter_headers, seed_job):
        body = client.get(
            f"/api/questions/jobs/{seed_job}/history",
            headers=recruiter_headers,
        ).get_json()
        assert isinstance(body["data"], list)
 
    def test_history_entry_has_required_fields(self, client, recruiter_headers, seed_job):
        # Generate first so history is non-empty
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
 
        entries = client.get(
            f"/api/questions/jobs/{seed_job}/history",
            headers=recruiter_headers,
        ).get_json()["data"]
 
        assert len(entries) > 0
        entry = entries[-1]
        assert "generated_at"       in entry
        assert "exp_level"          in entry
        assert "mcq_requested"      in entry
        assert "duplicates_skipped" in entry
 
    def test_history_grows_after_each_generate(self, client, recruiter_headers, seed_job):
        before = len(client.get(
            f"/api/questions/jobs/{seed_job}/history",
            headers=recruiter_headers,
        ).get_json()["data"])
 
        with patch("zentreeportal_backend.routes.question_routes.http.post", side_effect=_mock_gemini_post), \
             patch("zentreeportal_backend.routes.question_routes.os.environ.get", return_value="FAKE_KEY"):
            client.post(
                f"/api/questions/jobs/{seed_job}/generate",
                json={"mcq_count": 2, "subjective_count": 1, "coding_count": 1},
                headers=recruiter_headers,
            )
 
        after = len(client.get(
            f"/api/questions/jobs/{seed_job}/history",
            headers=recruiter_headers,
        ).get_json()["data"])
 
        assert after == before + 1
 
    def test_history_invalid_job_returns_400(self, client, recruiter_headers):
        res = client.get(
            "/api/questions/jobs/bad-id/history",
            headers=recruiter_headers,
        )
        assert res.status_code == 400
 
    def test_history_nonexistent_job_returns_404(self, client, recruiter_headers):
        from bson import ObjectId
        res = client.get(
            f"/api/questions/jobs/{str(ObjectId())}/history",
            headers=recruiter_headers,
        )
        assert res.status_code == 404
 
    def test_history_unauthenticated_returns_401(self, client, seed_job):
        assert client.get(
            f"/api/questions/jobs/{seed_job}/history"
        ).status_code == 401
 
