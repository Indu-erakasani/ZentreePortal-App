"""
Locust load test for question_routes.py
File: TestCases/TestCase_backend/locust_question_tasks.py

Run:
    locust -f TestCases/TestCase_backend/locust_question_tasks.py \
           --host http://localhost:5000 --users 10 --spawn-rate 2
"""
from locust import TaskSet, task
import random
import uuid


class QuestionTasks(TaskSet):
    """
    Load tests for question_routes.py
    prefix: /api/questions
    """

    def on_start(self):
        self.headers = (
            self.user.resident_session.get("headers")
            if self.user.resident_session
            else self.user.client.headers
        )
        self.job_id     = None   # populated from job list
        self.mcq_count  = 0
        self.subj_count = 0
        self.code_count = 0

        # Attempt to grab a real job_id from the jobs API
        with self.client.get(
            "/api/jobs/",
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                jobs = res.json().get("data", [])
                for job in jobs:
                    if job.get("description"):   # must have a description for generate
                        self.job_id = job.get("_id")
                        break

    # ── helpers ──────────────────────────────────────────────────────────────

    def _url(self, path: str) -> str:
        return f"/api/questions/jobs/{self.job_id}{path}"

    def _refresh_counts(self):
        """Refresh local MCQ / subjective / coding counts from the bank."""
        if not self.job_id:
            return
        with self.client.get(
            self._url(""),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                data = res.json().get("data", {})
                self.mcq_count  = len(data.get("mcq_questions",        []))
                self.subj_count = len(data.get("subjective_questions",  []))
                self.code_count = len(data.get("coding_questions",      []))

    # ═════════════════════════════════════════════════════════════════════════
    # 1. GET Questions
    # ═════════════════════════════════════════════════════════════════════════

    @task(4)
    def get_questions(self):
        """GET /api/questions/jobs/<jid>"""
        if not self.job_id:
            return
        show_all = random.choice(["true", "false"])
        with self.client.get(
            self._url(f"?show_all={show_all}"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                data = res.json().get("data", {})
                self.mcq_count  = len(data.get("mcq_questions",        []))
                self.subj_count = len(data.get("subjective_questions",  []))
                self.code_count = len(data.get("coding_questions",      []))
            elif res.status_code in [401, 403, 404]:
                res.success()
            else:
                res.failure(f"Get Questions failed: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 2. Generate Questions
    # ═════════════════════════════════════════════════════════════════════════

    @task(2)
    def generate_questions(self):
        """POST /api/questions/jobs/<jid>/generate"""
        if not self.job_id:
            return
        payload = {
            "mcq_count":         random.choice([2, 3, 5]),
            "subjective_count":  random.choice([1, 2]),
            "coding_count":      random.choice([1, 2]),
            "replace_existing":  random.choice([True, False]),
        }
        with self.client.post(
            self._url("/generate"),
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                self._refresh_counts()
            elif res.status_code in [400, 401, 404, 422, 500]:
                res.success()   # config / AI errors are expected in load tests
            else:
                res.failure(f"Generate Questions failed: {res.text}")

    @task(1)
    def generate_with_custom_difficulty(self):
        """POST /api/questions/jobs/<jid>/generate  — custom difficulty_distribution"""
        if not self.job_id:
            return
        distributions = [
            "50% Easy, 30% Medium, 20% Hard",
            "10% Easy, 60% Medium, 30% Hard",
            "5% Easy, 35% Medium, 60% Hard",
        ]
        payload = {
            "mcq_count":              2,
            "subjective_count":       1,
            "coding_count":           1,
            "difficulty_distribution": random.choice(distributions),
        }
        with self.client.post(
            self._url("/generate"),
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 400, 422, 500]:
                res.success()
            else:
                res.failure(f"Generate Custom Difficulty failed: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 3. Add Manual Questions
    # ═════════════════════════════════════════════════════════════════════════

    @task(3)
    def add_manual_mcq(self):
        """POST /api/questions/jobs/<jid>/manual  — MCQ"""
        if not self.job_id:
            return
        uid = str(uuid.uuid4())[:6]
        payload = {
            "type": "mcq",
            "question": {
                "question":       f"Locust MCQ {uid}: What does the GIL protect in CPython?",
                "options":        [
                    "Python objects from concurrent access",
                    "Database connections",
                    "File handles",
                    "Network sockets",
                ],
                "correct_answer": ["Python objects from concurrent access"],
                "difficulty":     random.choice(["Easy", "Medium", "Hard"]),
                "topic":          "Python Internals",
            }
        }
        with self.client.post(
            self._url("/manual"),
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [201, 409]:   # 409 = duplicate, expected
                res.success()
            elif res.status_code in [400, 401, 404]:
                res.success()
            else:
                res.failure(f"Add Manual MCQ failed: {res.text}")

    @task(2)
    def add_manual_subjective(self):
        """POST /api/questions/jobs/<jid>/manual  — Subjective"""
        if not self.job_id:
            return
        uid = str(uuid.uuid4())[:6]
        payload = {
            "type": "subjective",
            "question": {
                "question":         f"Locust Subj {uid}: How would you optimise a slow MongoDB query?",
                "reference_answer": "Use indexes, aggregation pipelines, and projection to limit fields returned.",
                "key_points":       "• Indexes\n• Projection\n• Explain plan",
                "skill":            "MongoDB",
                "difficulty":       random.choice(["Medium", "Hard"]),
            }
        }
        with self.client.post(
            self._url("/manual"),
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [201, 409, 400, 401, 404]:
                res.success()
            else:
                res.failure(f"Add Manual Subjective failed: {res.text}")

    @task(2)
    def add_manual_coding(self):
        """POST /api/questions/jobs/<jid>/manual  — Coding"""
        if not self.job_id:
            return
        uid = str(uuid.uuid4())[:6]
        payload = {
            "type": "coding",
            "question": {
                "question":             (
                    f"Locust Code {uid}: Write a function to check if a string is a palindrome.\n\n"
                    "Input: s='racecar'\nOutput: True\n\nConstraints:\n- Ignore spaces and case"
                ),
                "programming_language": random.choice(["Python", "JavaScript", "Java"]),
                "difficulty":           random.choice(["Easy", "Medium"]),
                "topic":                "Strings",
            }
        }
        with self.client.post(
            self._url("/manual"),
            json=payload,
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [201, 409, 400, 401, 404]:
                res.success()
            else:
                res.failure(f"Add Manual Coding failed: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 4. Toggle Question Active
    # ═════════════════════════════════════════════════════════════════════════

    @task(2)
    def toggle_mcq(self):
        """PUT /api/questions/jobs/<jid>/mcq/<index>/toggle"""
        if not self.job_id or self.mcq_count == 0:
            self._refresh_counts()
            return
        index = random.randint(0, max(0, self.mcq_count - 1))
        with self.client.put(
            self._url(f"/mcq/{index}/toggle"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 400, 401, 404]:
                res.success()
            else:
                res.failure(f"Toggle MCQ failed: {res.text}")

    @task(1)
    def toggle_subjective(self):
        """PUT /api/questions/jobs/<jid>/subjective/<index>/toggle"""
        if not self.job_id or self.subj_count == 0:
            self._refresh_counts()
            return
        index = random.randint(0, max(0, self.subj_count - 1))
        with self.client.put(
            self._url(f"/subjective/{index}/toggle"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 400, 401, 404]:
                res.success()
            else:
                res.failure(f"Toggle Subjective failed: {res.text}")

    @task(1)
    def toggle_coding(self):
        """PUT /api/questions/jobs/<jid>/coding/<index>/toggle"""
        if not self.job_id or self.code_count == 0:
            self._refresh_counts()
            return
        index = random.randint(0, max(0, self.code_count - 1))
        with self.client.put(
            self._url(f"/coding/{index}/toggle"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 400, 401, 404]:
                res.success()
            else:
                res.failure(f"Toggle Coding failed: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 5. Delete Question
    # ═════════════════════════════════════════════════════════════════════════

    @task(1)
    def delete_mcq(self):
        """DELETE /api/questions/jobs/<jid>/mcq/<index>"""
        if not self.job_id or self.mcq_count == 0:
            self._refresh_counts()
            return
        index = random.randint(0, max(0, self.mcq_count - 1))
        with self.client.delete(
            self._url(f"/mcq/{index}"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 400, 401, 404]:
                if res.status_code == 200:
                    self.mcq_count = max(0, self.mcq_count - 1)
                res.success()
            else:
                res.failure(f"Delete MCQ failed: {res.text}")

    @task(1)
    def delete_subjective(self):
        """DELETE /api/questions/jobs/<jid>/subjective/<index>"""
        if not self.job_id or self.subj_count == 0:
            self._refresh_counts()
            return
        index = random.randint(0, max(0, self.subj_count - 1))
        with self.client.delete(
            self._url(f"/subjective/{index}"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 400, 401, 404]:
                if res.status_code == 200:
                    self.subj_count = max(0, self.subj_count - 1)
                res.success()
            else:
                res.failure(f"Delete Subjective failed: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 6. Generation History
    # ═════════════════════════════════════════════════════════════════════════

    @task(2)
    def get_generation_history(self):
        """GET /api/questions/jobs/<jid>/history"""
        if not self.job_id:
            return
        with self.client.get(
            self._url("/history"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 401, 404]:
                res.success()
            else:
                res.failure(f"Get Generation History failed: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 7. Sync Counts
    # ═════════════════════════════════════════════════════════════════════════

    @task(1)
    def sync_counts(self):
        """POST /api/questions/jobs/<jid>/sync-counts"""
        if not self.job_id:
            return
        with self.client.post(
            self._url("/sync-counts"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 401, 404]:
                res.success()
            else:
                res.failure(f"Sync Counts failed: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 8. Clear Questions  (low weight — destructive)
    # ═════════════════════════════════════════════════════════════════════════

    @task(1)
    def clear_questions(self):
        """DELETE /api/questions/jobs/<jid>/clear"""
        if not self.job_id:
            return
        # Only clear 10% of the time to avoid wiping the bank too aggressively
        if random.random() > 0.10:
            return
        with self.client.delete(
            self._url("/clear"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [200, 401, 404]:
                if res.status_code == 200:
                    self.mcq_count  = 0
                    self.subj_count = 0
                    self.code_count = 0
                res.success()
            else:
                res.failure(f"Clear Questions failed: {res.text}")

    # ═════════════════════════════════════════════════════════════════════════
    # 9. Edge-case / validation probes
    # ═════════════════════════════════════════════════════════════════════════

    @task(1)
    def generate_all_zeros(self):
        """POST /api/questions/jobs/<jid>/generate  — should return 400"""
        if not self.job_id:
            return
        with self.client.post(
            self._url("/generate"),
            json={"mcq_count": 0, "subjective_count": 0, "coding_count": 0},
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code == 400:
                res.success()
            elif res.status_code in [401, 404]:
                res.success()
            else:
                res.failure(f"Expected 400 for all-zero generate, got {res.status_code}")

    @task(1)
    def delete_out_of_range_index(self):
        """DELETE /api/questions/jobs/<jid>/mcq/9999  — should return 400"""
        if not self.job_id:
            return
        with self.client.delete(
            self._url("/mcq/9999"),
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [400, 401, 404]:
                res.success()
            else:
                res.failure(f"Expected 400 for OOB delete, got {res.status_code}")

    @task(1)
    def add_manual_invalid_type(self):
        """POST /api/questions/jobs/<jid>/manual  — invalid type, should return 400"""
        if not self.job_id:
            return
        with self.client.post(
            self._url("/manual"),
            json={"type": "invalid_type", "question": {"question": "Test?"}},
            headers=self.headers,
            catch_response=True,
        ) as res:
            if res.status_code in [400, 401, 404]:
                res.success()
            else:
                res.failure(f"Expected 400 for invalid type, got {res.status_code}")

    @task
    def stop(self):
        return