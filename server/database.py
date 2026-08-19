import json
from contextlib import contextmanager
from pathlib import Path
import sqlite3

DB_PATH = Path(__file__).parent / "data" / "smarthome_lab.db"

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_code TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    lesson_no INTEGER NOT NULL CHECK (lesson_no BETWEEN 1 AND 48),
    status TEXT NOT NULL CHECK (status IN ('not_started','in_progress','completed')),
    started_at TEXT,
    completed_at TEXT,
    UNIQUE(student_id, lesson_no),
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    lesson_no INTEGER NOT NULL CHECK (lesson_no BETWEEN 1 AND 48),
    user_message TEXT NOT NULL,
    gemini_response TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    lesson_no INTEGER NOT NULL CHECK (lesson_no BETWEEN 1 AND 48),
    source TEXT NOT NULL CHECK (source IN ('wireshark','tshark')),
    evidence_text TEXT NOT NULL,
    packet_no TEXT,
    filter_used TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS judgements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    lesson_no INTEGER NOT NULL CHECK (lesson_no BETWEEN 1 AND 48),
    initial_judgement TEXT NOT NULL,
    gemini_hypotheses TEXT,
    final_judgement TEXT,
    adopted_hypothesis TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(student_id, lesson_no),
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS student_memory (
    student_id INTEGER PRIMARY KEY,
    strengths TEXT NOT NULL DEFAULT '[]',
    difficulties TEXT NOT NULL DEFAULT '[]',
    recent_errors TEXT NOT NULL DEFAULT '[]',
    guidance_rules TEXT NOT NULL DEFAULT '[]',
    last_lesson_summary TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_progress_student ON lesson_progress(student_id, lesson_no);
CREATE INDEX IF NOT EXISTS idx_chat_student ON chat_logs(student_id, lesson_no);
CREATE INDEX IF NOT EXISTS idx_evidence_student ON evidence(student_id, lesson_no);
"""


@contextmanager
def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db() -> None:
    with connect() as connection:
        connection.executescript(SCHEMA)


def rows_to_dicts(rows) -> list[dict]:
    return [dict(row) for row in rows]


def json_list(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []
