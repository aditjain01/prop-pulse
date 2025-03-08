from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class DocumentBase(BaseModel):
    entity_type: str
    entity_id: int
    file_path: str
    document_vector: Optional[str] = None
    metadata: Optional[dict] = None


class DocumentCreate(DocumentBase):
    pass


class Document(DocumentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
