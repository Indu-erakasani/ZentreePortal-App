# import sys
# import os

# # ── Add the parent folder so TestCases is findable ───────────────────────────
# sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# from locust import HttpUser, between
# import logging

# # ── Import your TaskSets ──────────────────────────────────────────────────────
# from TestCases.TestCase_backend.test_employee  import EmployeeTasks
# from TestCases.TestCase_backend.test_resume    import ResumeTasks
# from TestCases.TestCase_backend.test_job       import JobTasks
# from TestCases.TestCase_backend.test_tracking  import TrackingTasks


# # ── Auth helper ───────────────────────────────────────────────────────────────
# def login(client):
#     response = client.post(
#         "/api/auth/login",
#         json={
#             "email":    "erakasaniindhu@gmail.com",  
#             "password": "Password@123"                   
#         },
#         name="[AUTH] Login",
#     )

#     if response.status_code == 200:
#         data = response.json()
#         token = data.get("access_token") or data.get("token")
#         if token:
#             logging.info("✅ Login successful.")
#             return {
#                 "Content-Type":  "application/json",
#                 "Authorization": f"Bearer {token}",
#             }

#     logging.error(f"❌ Login failed: {response.status_code} - {response.text}")
#     return {"Content-Type": "application/json"}


# # ── Main Locust User ──────────────────────────────────────────────────────────
# class RecruitmentPortalUser(HttpUser):
#     wait_time = between(1, 3)

#     tasks = {
#         EmployeeTasks: 1,
#         ResumeTasks:   2,
#         JobTasks:      2,
#         TrackingTasks: 2,
#     }

#     resident_session = {}

#     def on_start(self):
#         headers = login(self.client)
#         self.resident_session = {"headers": headers}
#         self.client.headers.update(headers)

#     def on_stop(self):
#         logging.info("🛑 User session ended.")





import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from locust import HttpUser, between
import logging

from TestCases.Locust_TestCase_backend.locust_employee_tasks         import EmployeeTasks
from TestCases.Locust_TestCase_backend.locust_resume_tasks           import ResumeTasks
from TestCases.Locust_TestCase_backend.locust_job_tasks              import JobTasks
from TestCases.Locust_TestCase_backend.locust_tracking_tasks         import TrackingTasks
from TestCases.Locust_TestCase_backend.locust_auth_user_tasks        import AuthUserTasks
from TestCases.Locust_TestCase_backend.locust_client_tasks           import ClientTasks
from TestCases.Locust_TestCase_backend.locust_bench_tasks            import BenchTasks
from TestCases.Locust_TestCase_backend.locust_onboarding_tasks       import OnboardingTasks
from TestCases.Locust_TestCase_backend.locust_placement_tasks        import PlacementTasks
from TestCases.Locust_TestCase_backend.locust_exam_admin_tasks       import AdminTasks, ExamTasks
from TestCases.Locust_TestCase_backend.locust_question_tasks         import QuestionTasks
from TestCases.Locust_TestCase_backend.locust_dashboard_tasks        import DashboardTasks
from TestCases.Locust_TestCase_backend.locust_score_tasks            import ScoreReadTasks, ScoreWriteTasks
from TestCases.Locust_TestCase_backend.locust_notifications_tasks    import NotificationJourneyTaskSet
from TestCases.Locust_TestCase_backend.locust_export_tasks           import ExportJourneyTaskSet
from TestCases.Locust_TestCase_backend.locust_reports_skills_tasks import (
    # ── Skills ──────────────────────────────────────────────────────────────
    SkillsGetAllTaskSet,
    SkillsGetOneTaskSet,
    SkillsByJobTaskSet,
    SkillsCreateTaskSet,
    SkillsBulkCreateTaskSet,
    SkillsUpdateTaskSet,
    SkillsDeleteTaskSet,
    SkillsMetaTaskSet,
    SkillsInsightsTaskSet,
    SkillsJourneyTaskSet,
    # ── Reports ─────────────────────────────────────────────────────────────
    ReportsOverviewTaskSet,
    ReportsFunnelTaskSet,
    ReportsRecruiterPerformanceTaskSet,
    ReportsClientWiseTaskSet,
    ReportsTimeToFillTaskSet,
    ReportsSourceEffectivenessTaskSet,
    ReportsJourneyTaskSet,
)



def login(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email":    "erakasaniindhu@gmail.com",
            "password": "Password@123"
        },
        name="[AUTH] Login",
    )
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token") or data.get("token")
        if token:
            logging.info("✅ Login successful.")
            return {
                "Content-Type":  "application/json",
                "Authorization": f"Bearer {token}",
            }
    logging.error(f"❌ Login failed: {response.status_code} - {response.text}")
    return {"Content-Type": "application/json"}


class RecruitmentPortalUser(HttpUser):
    wait_time = between(1, 3)

    tasks = {
        EmployeeTasks:  1,
        ResumeTasks:    2,
        JobTasks:       2,
        TrackingTasks:  2,
        AuthUserTasks:  1,
        ClientTasks:    2,
        BenchTasks:     2,
        OnboardingTasks: 2, 
        PlacementTasks:  2,
        AdminTasks:      1,
        ExamTasks:       2,
        QuestionTasks:   2,
        DashboardTasks:  2,   
        ScoreReadTasks:  3,  
        ScoreWriteTasks: 1,
        NotificationJourneyTaskSet: 2,
        ExportJourneyTaskSet:       2,
        SkillsGetAllTaskSet:                4,
        SkillsGetOneTaskSet:                3,
        SkillsByJobTaskSet:                 2,
        SkillsCreateTaskSet:                3,
        SkillsBulkCreateTaskSet:            1,
        SkillsUpdateTaskSet:                2,
        SkillsDeleteTaskSet:                2,
        SkillsMetaTaskSet:                  3,
        SkillsInsightsTaskSet:              4,
        SkillsJourneyTaskSet:               3,

        # ── Reports (from locustfile_reports_skills.py) ──────────────────────────
        ReportsOverviewTaskSet:             4,
        ReportsFunnelTaskSet:               3,
        ReportsRecruiterPerformanceTaskSet: 3,
        ReportsClientWiseTaskSet:           3,
        ReportsTimeToFillTaskSet:           3,
        ReportsSourceEffectivenessTaskSet:  3,
        ReportsJourneyTaskSet:              4,
        
    }

    resident_session = {}

    def on_start(self):
        headers = login(self.client)
        self.resident_session = {"headers": headers}
        self.client.headers.update(headers)

    def on_stop(self):
        logging.info("🛑 User session ended.")