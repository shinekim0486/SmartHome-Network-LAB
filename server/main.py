from datetime import datetime, timezone
import json
from pathlib import Path
import re
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from server.database import connect, init_db, json_list, rows_to_dicts

app = FastAPI(title="SmartHome Network LAB API", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "null"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
DATA_FILE = Path(__file__).parent / "data" / "submissions.json"
GITHUB_REPO_PATTERN = re.compile(r"^https://github\.com/(?P<owner>[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))/(?P<repo>[A-Za-z0-9._-]+?)(?:\.git)?/?$")


class Progress(BaseModel):
    lesson: int = Field(ge=1, le=48)
    step: Literal["mission", "code", "observe", "evidence", "tshark", "hint", "judge", "retest"]
    note: str = Field(default="", max_length=500)


class DeviceCommand(BaseModel):
    state: Literal["on", "off", "open", "closed"]


class SubmissionCreate(BaseModel):
    student_name: str = Field(min_length=2, max_length=40)
    student_id: str = Field(min_length=1, max_length=30)
    lesson: int = Field(ge=1, le=48)
    repository_url: str = Field(max_length=200)
    reflection: str = Field(default="", max_length=1000)


class Feedback(BaseModel):
    feedback: str = Field(min_length=1, max_length=1000)
    status: Literal["submitted", "revision_requested", "approved"]


progress_log: list[dict] = []
devices = {"light": "off", "door": "closed"}
init_db()


class StudentLogin(BaseModel):
    student_code: str = Field(min_length=1, max_length=30)
    nickname: str = Field(min_length=1, max_length=40)


class LessonProgressUpdate(BaseModel):
    lesson_no: int = Field(ge=1, le=48)
    status: Literal["not_started", "in_progress", "completed"]


class ChatLogCreate(BaseModel):
    lesson_no: int = Field(ge=1, le=48)
    user_message: str = Field(min_length=1, max_length=4000)
    gemini_response: str = Field(min_length=1, max_length=8000)


class EvidenceCreate(BaseModel):
    lesson_no: int = Field(ge=1, le=48)
    source: Literal["wireshark", "tshark"]
    evidence_text: str = Field(min_length=1, max_length=5000)
    packet_no: str = Field(default="", max_length=100)
    filter_used: str = Field(default="", max_length=500)


class InitialJudgementCreate(BaseModel):
    lesson_no: int = Field(ge=1, le=48)
    initial_judgement: str = Field(min_length=1, max_length=4000)


class FinalJudgementUpdate(BaseModel):
    gemini_hypotheses: str = Field(default="", max_length=4000)
    final_judgement: str = Field(min_length=1, max_length=4000)
    adopted_hypothesis: str = Field(default="", max_length=2000)


class MemoryUpdate(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    difficulties: list[str] = Field(default_factory=list)
    recent_errors: list[str] = Field(default_factory=list)
    guidance_rules: list[str] = Field(default_factory=lambda: ["학생에게 정답을 먼저 제시하지 마세요.", "먼저 관찰 결과와 패킷 증거를 요구하세요."])
    last_lesson_summary: str = Field(default="", max_length=4000)


class PromptRequest(BaseModel):
    lesson_no: int = Field(ge=1, le=48)
    current_mission: str = Field(default="", max_length=2000)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def require_student(connection, student_id: int) -> dict:
    row = connection.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")
    return dict(row)


def load_submissions() -> list[dict]:
    if not DATA_FILE.exists():
        return []
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def save_submissions(items: list[dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_repository_url(url: str) -> tuple[str, str]:
    match = GITHUB_REPO_PATTERN.fullmatch(url.strip())
    if not match:
        raise HTTPException(status_code=422, detail="github.com의 저장소 주소를 입력하세요.")
    return match.group("owner"), match.group("repo")


async def inspect_github_repository(owner: str, repo: str, lesson: int) -> dict:
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "SmartHome-Network-LAB"}
    async with httpx.AsyncClient(base_url="https://api.github.com", headers=headers, timeout=8) as client:
        response = await client.get(f"/repos/{owner}/{repo}")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="공개 저장소를 찾을 수 없습니다. 주소와 공개 설정을 확인하세요.")
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="GitHub 확인이 지연되고 있습니다. 잠시 후 다시 시도하세요.")
        metadata = response.json()
        branch = metadata["default_branch"]
        checks = {}
        for path in ["README.md", f"labs/{lesson:02d}"]:
            file_response = await client.get(f"/repos/{owner}/{repo}/contents/{path}", params={"ref": branch})
            checks[path] = file_response.status_code == 200
        commit_response = await client.get(f"/repos/{owner}/{repo}/commits/{branch}")
        commit_sha = commit_response.json().get("sha", "") if commit_response.status_code == 200 else ""
    return {"repository": f"{owner}/{repo}", "default_branch": branch, "latest_commit": commit_sha, "required_files": checks, "requirements_passed": all(checks.values()), "repository_updated_at": metadata.get("pushed_at")}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "smarthome-network-lab"}


@app.get("/api/devices")
def list_devices() -> dict:
    return devices


@app.put("/api/devices/{device}")
def update_device(device: Literal["light", "door"], command: DeviceCommand) -> dict:
    allowed = {"light": {"on", "off"}, "door": {"open", "closed"}}
    if command.state not in allowed[device]:
        raise HTTPException(status_code=422, detail=f"invalid state for {device}")
    devices[device] = command.state
    return {"device": device, "state": command.state}


@app.post("/api/progress", status_code=201)
def save_progress(progress: Progress) -> dict:
    record = {**progress.model_dump(), "saved_at": datetime.now(timezone.utc).isoformat()}
    progress_log.append(record)
    return record


@app.get("/api/progress")
def get_progress() -> list[dict]:
    return progress_log


@app.post("/api/submissions", status_code=201)
async def create_submission(submission: SubmissionCreate) -> dict:
    owner, repo = parse_repository_url(submission.repository_url)
    inspection = await inspect_github_repository(owner, repo, submission.lesson)
    items = load_submissions()
    record = {"id": max((item["id"] for item in items), default=0) + 1, **submission.model_dump(), **inspection, "status": "submitted", "feedback": "", "submitted_at": datetime.now(timezone.utc).isoformat()}
    items.append(record)
    save_submissions(items)
    return record


@app.get("/api/submissions")
def get_submissions(student_id: str | None = None) -> list[dict]:
    items = load_submissions()
    return [item for item in items if item["student_id"] == student_id] if student_id else items


@app.put("/api/submissions/{submission_id}/feedback")
def update_feedback(submission_id: int, feedback: Feedback) -> dict:
    items = load_submissions()
    for item in items:
        if item["id"] == submission_id:
            item.update(feedback.model_dump())
            item["reviewed_at"] = datetime.now(timezone.utc).isoformat()
            save_submissions(items)
            return item
    raise HTTPException(status_code=404, detail="제출 기록을 찾을 수 없습니다.")


@app.post("/api/students/login")
def student_login(login: StudentLogin) -> dict:
    with connect() as connection:
        row = connection.execute("SELECT * FROM students WHERE student_code = ?", (login.student_code,)).fetchone()
        if row:
            connection.execute("UPDATE students SET nickname = ? WHERE id = ?", (login.nickname, row["id"]))
            student_id = row["id"]
        else:
            cursor = connection.execute("INSERT INTO students(student_code, nickname, created_at) VALUES (?, ?, ?)", (login.student_code, login.nickname, now_iso()))
            student_id = cursor.lastrowid
            connection.execute("INSERT INTO student_memory(student_id, guidance_rules, updated_at) VALUES (?, ?, ?)", (student_id, json.dumps(["학생에게 정답을 먼저 제시하지 마세요.", "먼저 관찰 결과와 패킷 증거를 요구하세요."], ensure_ascii=False), now_iso()))
        return dict(connection.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone())


@app.put("/api/students/{student_id}/progress")
def update_lesson_progress(student_id: int, progress: LessonProgressUpdate) -> dict:
    timestamp = now_iso()
    with connect() as connection:
        require_student(connection, student_id)
        existing = connection.execute("SELECT * FROM lesson_progress WHERE student_id = ? AND lesson_no = ?", (student_id, progress.lesson_no)).fetchone()
        started_at = existing["started_at"] if existing else None
        if progress.status in {"in_progress", "completed"} and not started_at:
            started_at = timestamp
        completed_at = timestamp if progress.status == "completed" else None
        connection.execute("""INSERT INTO lesson_progress(student_id, lesson_no, status, started_at, completed_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(student_id, lesson_no) DO UPDATE SET status=excluded.status, started_at=excluded.started_at, completed_at=excluded.completed_at""", (student_id, progress.lesson_no, progress.status, started_at, completed_at))
        return dict(connection.execute("SELECT * FROM lesson_progress WHERE student_id = ? AND lesson_no = ?", (student_id, progress.lesson_no)).fetchone())


@app.get("/api/students/{student_id}/progress")
def get_lesson_progress(student_id: int) -> list[dict]:
    with connect() as connection:
        require_student(connection, student_id)
        return rows_to_dicts(connection.execute("SELECT * FROM lesson_progress WHERE student_id = ? ORDER BY lesson_no", (student_id,)).fetchall())


@app.post("/api/students/{student_id}/judgements/initial", status_code=201)
def save_initial_judgement(student_id: int, judgement: InitialJudgementCreate) -> dict:
    timestamp = now_iso()
    with connect() as connection:
        require_student(connection, student_id)
        connection.execute("""INSERT INTO judgements(student_id, lesson_no, initial_judgement, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(student_id, lesson_no) DO UPDATE SET initial_judgement=excluded.initial_judgement, updated_at=excluded.updated_at""", (student_id, judgement.lesson_no, judgement.initial_judgement, timestamp, timestamp))
        return dict(connection.execute("SELECT * FROM judgements WHERE student_id = ? AND lesson_no = ?", (student_id, judgement.lesson_no)).fetchone())


@app.put("/api/students/{student_id}/judgements/{lesson_no}")
def save_final_judgement(student_id: int, lesson_no: int, judgement: FinalJudgementUpdate) -> dict:
    with connect() as connection:
        require_student(connection, student_id)
        existing = connection.execute("SELECT * FROM judgements WHERE student_id = ? AND lesson_no = ?", (student_id, lesson_no)).fetchone()
        if not existing:
            raise HTTPException(status_code=409, detail="Gemini 사용 전에 최초 판단을 먼저 저장하세요.")
        connection.execute("UPDATE judgements SET gemini_hypotheses=?, final_judgement=?, adopted_hypothesis=?, updated_at=? WHERE student_id=? AND lesson_no=?", (judgement.gemini_hypotheses, judgement.final_judgement, judgement.adopted_hypothesis, now_iso(), student_id, lesson_no))
        return dict(connection.execute("SELECT * FROM judgements WHERE student_id = ? AND lesson_no = ?", (student_id, lesson_no)).fetchone())


@app.post("/api/students/{student_id}/evidence", status_code=201)
def save_evidence(student_id: int, evidence: EvidenceCreate) -> dict:
    with connect() as connection:
        require_student(connection, student_id)
        cursor = connection.execute("INSERT INTO evidence(student_id, lesson_no, source, evidence_text, packet_no, filter_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", (student_id, evidence.lesson_no, evidence.source, evidence.evidence_text, evidence.packet_no, evidence.filter_used, now_iso()))
        return dict(connection.execute("SELECT * FROM evidence WHERE id = ?", (cursor.lastrowid,)).fetchone())


@app.post("/api/students/{student_id}/chat-logs", status_code=201)
def save_chat_log(student_id: int, chat: ChatLogCreate) -> dict:
    with connect() as connection:
        require_student(connection, student_id)
        initial = connection.execute("SELECT initial_judgement FROM judgements WHERE student_id = ? AND lesson_no = ?", (student_id, chat.lesson_no)).fetchone()
        if not initial or not initial["initial_judgement"].strip():
            raise HTTPException(status_code=409, detail="Gemini 사용 전에 최초 판단을 먼저 저장하세요.")
        cursor = connection.execute("INSERT INTO chat_logs(student_id, lesson_no, user_message, gemini_response, created_at) VALUES (?, ?, ?, ?, ?)", (student_id, chat.lesson_no, chat.user_message, chat.gemini_response, now_iso()))
        return dict(connection.execute("SELECT * FROM chat_logs WHERE id = ?", (cursor.lastrowid,)).fetchone())


@app.put("/api/students/{student_id}/memory")
def update_student_memory(student_id: int, memory: MemoryUpdate) -> dict:
    with connect() as connection:
        require_student(connection, student_id)
        connection.execute("""INSERT INTO student_memory(student_id, strengths, difficulties, recent_errors, guidance_rules, last_lesson_summary, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(student_id) DO UPDATE SET strengths=excluded.strengths, difficulties=excluded.difficulties, recent_errors=excluded.recent_errors, guidance_rules=excluded.guidance_rules, last_lesson_summary=excluded.last_lesson_summary, updated_at=excluded.updated_at""", (student_id, json.dumps(memory.strengths, ensure_ascii=False), json.dumps(memory.difficulties, ensure_ascii=False), json.dumps(memory.recent_errors, ensure_ascii=False), json.dumps(memory.guidance_rules, ensure_ascii=False), memory.last_lesson_summary, now_iso()))
    return get_student_memory(student_id)


@app.get("/api/students/{student_id}/memory")
def get_student_memory(student_id: int) -> dict:
    with connect() as connection:
        student = require_student(connection, student_id)
        row = connection.execute("SELECT * FROM student_memory WHERE student_id = ?", (student_id,)).fetchone()
        completed = [item["lesson_no"] for item in connection.execute("SELECT lesson_no FROM lesson_progress WHERE student_id=? AND status='completed' ORDER BY lesson_no", (student_id,)).fetchall()]
        memory = dict(row) if row else {"strengths": "[]", "difficulties": "[]", "recent_errors": "[]", "guidance_rules": "[]", "last_lesson_summary": ""}
        return {"student": student, "completed_lessons": completed, "strengths": json_list(memory.get("strengths")), "difficulties": json_list(memory.get("difficulties")), "recent_errors": json_list(memory.get("recent_errors")), "guidance_rules": json_list(memory.get("guidance_rules")), "last_lesson_summary": memory.get("last_lesson_summary", "")}


@app.post("/api/students/{student_id}/gemini-prompt")
def build_gemini_prompt(student_id: int, request: PromptRequest) -> dict:
    memory = get_student_memory(student_id)
    completed = ", ".join(map(str, memory["completed_lessons"])) or "없음"
    bullets = lambda values: "\n".join(f"- {value}" for value in values) or "- 기록 없음"
    prompt = f"""[학생 학습 기억]\n\n완료 차시: {completed}\n\n잘하는 부분:\n{bullets(memory['strengths'])}\n\n어려워하는 부분:\n{bullets(memory['difficulties'])}\n\n최근 실수:\n{bullets(memory['recent_errors'])}\n\n지난 차시:\n{memory['last_lesson_summary'] or '기록 없음'}\n\n지도 규칙:\n{bullets(memory['guidance_rules'])}\n\n[현재 {request.lesson_no}차시 미션]\n{request.current_mission}\n\n학생의 최초 판단과 패킷 증거를 먼저 요구하고, 정답 대신 검증 가능한 가설과 다음 관찰 질문을 제시하세요."""
    return {"student_id": student_id, "lesson_no": request.lesson_no, "prompt": prompt}


@app.get("/api/teacher/dashboard")
def teacher_dashboard() -> list[dict]:
    with connect() as connection:
        students = connection.execute("SELECT * FROM students ORDER BY student_code").fetchall()
        result = []
        for student in students:
            sid = student["id"]
            progress = rows_to_dicts(connection.execute("SELECT lesson_no, status FROM lesson_progress WHERE student_id=? ORDER BY lesson_no", (sid,)).fetchall())
            completed = [item["lesson_no"] for item in progress if item["status"] == "completed"]
            memory = connection.execute("SELECT * FROM student_memory WHERE student_id=?", (sid,)).fetchone()
            latest_judgement = connection.execute("SELECT * FROM judgements WHERE student_id=? ORDER BY lesson_no DESC LIMIT 1", (sid,)).fetchone()
            counts = connection.execute("SELECT (SELECT COUNT(*) FROM chat_logs WHERE student_id=?) chat_count, (SELECT COUNT(*) FROM evidence WHERE student_id=? AND source='wireshark') wireshark_count, (SELECT COUNT(*) FROM evidence WHERE student_id=? AND source='tshark') tshark_count", (sid, sid, sid)).fetchone()
            result.append({"student": dict(student), "progress": progress, "completed_count": len(completed), "progress_percent": round(len(completed) / 48 * 100, 1), "current_lesson": max([item["lesson_no"] for item in progress], default=1), **dict(counts), "latest_judgement": dict(latest_judgement) if latest_judgement else None, "strengths": json_list(memory["strengths"]) if memory else [], "difficulties": json_list(memory["difficulties"]) if memory else [], "recent_errors": json_list(memory["recent_errors"]) if memory else []})
        return result
