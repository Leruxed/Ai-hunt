from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    metadata_json: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class NotificationCountResponse(BaseModel):
    unread_count: int
