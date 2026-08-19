import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from server.main import app
from server.database import init_db


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.test_data_file = Path(__file__).parent / "_test_submissions.json"
        self.test_db_file = Path(__file__).parent / "_test_lab.db"
        self.test_data_file.unlink(missing_ok=True)
        self.test_db_file.unlink(missing_ok=True)
        self.data_patch = patch("server.main.DATA_FILE", self.test_data_file)
        self.db_patch = patch("server.database.DB_PATH", self.test_db_file)
        self.data_patch.start()
        self.db_patch.start()
        init_db()
        self.client = TestClient(app)

    def tearDown(self):
        self.data_patch.stop()
        self.db_patch.stop()
        self.test_data_file.unlink(missing_ok=True)
        self.test_db_file.unlink(missing_ok=True)

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_device_round_trip(self):
        response = self.client.put("/api/devices/light", json={"state": "on"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], "on")

    def test_progress_validation(self):
        response = self.client.post("/api/progress", json={"lesson": 49, "step": "mission"})
        self.assertEqual(response.status_code, 422)

    def test_rejects_non_github_submission_url(self):
        response = self.client.post("/api/submissions", json={"student_name": "김학생", "student_id": "101", "lesson": 1, "repository_url": "https://example.com/project"})
        self.assertEqual(response.status_code, 422)

    def test_submission_and_feedback_flow(self):
        inspection = {"repository": "student/lab", "default_branch": "main", "latest_commit": "abc1234", "required_files": {"README.md": True, "labs/01": True}, "requirements_passed": True, "repository_updated_at": "2026-01-01T00:00:00Z"}
        with patch("server.main.inspect_github_repository", new=AsyncMock(return_value=inspection)):
            response = self.client.post("/api/submissions", json={"student_name": "김학생", "student_id": "101", "lesson": 1, "repository_url": "https://github.com/student/lab", "reflection": "TCP를 관찰함"})
        self.assertEqual(response.status_code, 201)
        submission_id = response.json()["id"]
        review = self.client.put(f"/api/submissions/{submission_id}/feedback", json={"feedback": "증거가 명확합니다.", "status": "approved"})
        self.assertEqual(review.status_code, 200)
        self.assertEqual(review.json()["status"], "approved")

    def test_student_memory_requires_initial_judgement_before_chat(self):
        student = self.client.post("/api/students/login", json={"student_code": "101", "nickname": "네트워크왕"}).json()
        blocked = self.client.post(f"/api/students/{student['id']}/chat-logs", json={"lesson_no": 1, "user_message": "원인이 뭐야?", "gemini_response": "증거를 확인해보자."})
        self.assertEqual(blocked.status_code, 409)
        initial = self.client.post(f"/api/students/{student['id']}/judgements/initial", json={"lesson_no": 1, "initial_judgement": "포트가 잘못되었다고 생각한다."})
        self.assertEqual(initial.status_code, 201)
        chat = self.client.post(f"/api/students/{student['id']}/chat-logs", json={"lesson_no": 1, "user_message": "증거를 어떻게 확인할까?", "gemini_response": "SYN과 응답 패킷을 비교해보자."})
        self.assertEqual(chat.status_code, 201)

    def test_memory_prompt_and_teacher_dashboard(self):
        student = self.client.post("/api/students/login", json={"student_code": "102", "nickname": "패킷탐정"}).json()
        self.client.put(f"/api/students/{student['id']}/progress", json={"lesson_no": 1, "status": "completed"})
        self.client.put(f"/api/students/{student['id']}/memory", json={"strengths": ["Display Filter 사용"], "difficulties": ["SYN/ACK 의미"], "recent_errors": ["포트 8080 설정"], "last_lesson_summary": "포트 오류를 찾아 해결함"})
        prompt = self.client.post(f"/api/students/{student['id']}/gemini-prompt", json={"lesson_no": 2, "current_mission": "TCP 데이터를 관찰한다."})
        self.assertEqual(prompt.status_code, 200)
        self.assertIn("포트 오류를 찾아 해결함", prompt.json()["prompt"])
        dashboard = self.client.get("/api/teacher/dashboard").json()
        self.assertEqual(dashboard[0]["completed_count"], 1)
        self.assertEqual(dashboard[0]["difficulties"], ["SYN/ACK 의미"])


if __name__ == "__main__":
    unittest.main()
