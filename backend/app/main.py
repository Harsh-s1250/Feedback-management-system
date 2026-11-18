
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Literal
from pathlib import Path
from datetime import datetime, timezone
import json
import threading
import uuid

app = FastAPI(
    title="Feedback Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "feedback.json"
LOCK = threading.Lock()


class FeedbackCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5)
    category: Literal[
        "Bug", "Feature Request", "Improvement", "Other"
    ] = "Other"
    priority: Literal["Low", "Medium", "High"] = "Medium"


class FeedbackUpdate(BaseModel):
    status: Literal["Open", "In Progress", "Resolved"] | None = None
    priority: Literal["Low", "Medium", "High"] | None = None


def read_data():
    if not DATA_FILE.exists():
        return []

    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(500, "Feedback storage file is invalid")


def write_data(data):
    temp_file = DATA_FILE.with_suffix(".tmp")
    temp_file.write_text(
        json.dumps(data, indent=4),
        encoding="utf-8"
    )
    temp_file.replace(DATA_FILE)


@app.get("/")
def home():
    return {"message": "Feedback Management API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/feedback", status_code=201)
def create_feedback(feedback: FeedbackCreate):
    with LOCK:
        records = read_data()

        new_feedback = feedback.model_dump()
        new_feedback.update({
            "id": str(uuid.uuid4()),
            "status": "Open",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        records.append(new_feedback)
        write_data(records)

    return new_feedback


@app.get("/api/feedback")
def get_feedback(
    search: str = "",
    status: str = "",
    category: str = ""
):
    with LOCK:
        records = read_data()

    if search:
        term = search.lower()
        records = [
            item for item in records
            if term in item["title"].lower()
            or term in item["description"].lower()
            or term in item["name"].lower()
        ]

    if status:
        records = [
            item for item in records
            if item["status"] == status
        ]

    if category:
        records = [
            item for item in records
            if item["category"] == category
        ]

    return sorted(
        records,
        key=lambda x: x["created_at"],
        reverse=True
    )


@app.get("/api/feedback/{feedback_id}")
def get_feedback_by_id(feedback_id: str):
    with LOCK:
        records = read_data()

    for item in records:
        if item["id"] == feedback_id:
            return item

    raise HTTPException(404, "Feedback not found")


@app.patch("/api/feedback/{feedback_id}")
def update_feedback(feedback_id: str, update: FeedbackUpdate):
    with LOCK:
        records = read_data()

        for item in records:
            if item["id"] == feedback_id:
                changes = update.model_dump(exclude_unset=True)

                for key, value in changes.items():
                    if value is not None:
                        item[key] = value

                write_data(records)
                return item

    raise HTTPException(404, "Feedback not found")


@app.delete("/api/feedback/{feedback_id}")
def delete_feedback(feedback_id: str):
    with LOCK:
        records = read_data()

        updated = [
            item for item in records
            if item["id"] != feedback_id
        ]

        if len(records) == len(updated):
            raise HTTPException(404, "Feedback not found")

        write_data(updated)

    return {"message": "Feedback deleted successfully"}


@app.get("/api/dashboard")
def dashboard():
    with LOCK:
        records = read_data()

    return {
        "total": len(records),
        "open": sum(x["status"] == "Open" for x in records),
        "in_progress": sum(
            x["status"] == "In Progress" for x in records
        ),
        "resolved": sum(
            x["status"] == "Resolved" for x in records
        )
    }
