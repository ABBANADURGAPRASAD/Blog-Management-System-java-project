from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ContentType(str, Enum):
    POST = "POST"
    COMMENT = "COMMENT"
    USER_PROFILE = "USER_PROFILE"
    USER_BIO = "USER_BIO"
    USER_AVATAR = "USER_AVATAR"
    USER_MEDIA = "USER_MEDIA"


class FinalStatus(str, Enum):
    APPROVED = "APPROVED"
    WARNING = "WARNING"
    BLOCKED = "BLOCKED"


class CommentClass(str, Enum):
    SAFE = "SAFE"
    WARNING = "WARNING"
    BLOCKED = "BLOCKED"


class MediaItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    url: str
    media_type: str = Field(alias="mediaType")
    presigned: bool = False


class ModerationPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    title: Optional[str] = None
    text: Optional[str] = None
    hashtags: list[str] = []
    mentioned_user_ids: list[int] = Field(default_factory=list, alias="mentionedUserIds")
    media: list[MediaItem] = []
    user_name: Optional[str] = Field(None, alias="userName")
    full_name: Optional[str] = Field(None, alias="fullName")
    bio: Optional[str] = None


class LabelScore(BaseModel):
    label: str
    score: float
    model: str
    language: Optional[str] = None


class ModerationResult(BaseModel):
    final_status: FinalStatus
    comment_class: Optional[CommentClass] = None
    confidence: float
    needs_human_review: bool = False
    detected_language: Optional[str] = None
    degraded_mode: bool = False
    processing_ms: int = 0
    scores: list[LabelScore] = []


class SyncModerationRequest(BaseModel):
    content_type: ContentType
    text: str
    user_name: Optional[str] = None
    language_hint: Optional[str] = None


class AnalyzeRequest(BaseModel):
    request_id: UUID
    content_type: ContentType
    content_id: int
    user_id: int
    payload: ModerationPayload


class ModerationEvent(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    event_type: str = Field(alias="eventType")
    request_id: UUID = Field(alias="requestId")
    idempotency_key: str = Field(alias="idempotencyKey")
    content_type: ContentType = Field(alias="contentType")
    content_id: int = Field(alias="contentId")
    user_id: int = Field(alias="userId")
    priority: int = 5
    timestamp: str
    trace_id: Optional[str] = Field(None, alias="traceId")
    payload: ModerationPayload
    result: Optional[dict[str, Any]] = None
    error: Optional[dict[str, str]] = None
