from pydantic import BaseModel, ConfigDict

class ConstructionStatusBase(BaseModel):
    name: str

class ConstructionStatus(ConstructionStatusBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

