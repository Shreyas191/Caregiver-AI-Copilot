import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import EpisodeStatus, UrgencyLevel


class EpisodeResponse(BaseModel):
    id: uuid.UUID
    care_recipient_id: uuid.UUID
    started_at: datetime
    caregiver_description: str
    symptoms: list[dict[str, Any]]
    agent_assessment: str | None
    urgency_level: UrgencyLevel
    recommended_actions: list[dict[str, Any]]
    citations: list[dict[str, Any]]
    status: EpisodeStatus
    resolved_at: datetime | None
    resolution_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("symptoms", "recommended_actions", "citations", mode="before")
    @classmethod
    def coerce_legacy_strings(cls, v: Any) -> list[dict[str, Any]]:
        """Coerce legacy string entries (old seed data) to {\"name\": str} dicts."""
        if not v:
            return []
        return [item if isinstance(item, dict) else {"name": str(item)} for item in v]
