from pydantic import BaseModel


class PlasticTypeCount(BaseModel):
    plastic_code: int
    count: int
    total_quantity: int


class RoomCount(BaseModel):
    room: str
    count: int
    total_quantity: int


class AdminOverview(BaseModel):
    total_users: int
    total_households: int
    total_audit_sessions: int
    submitted_audit_sessions: int
    total_entries: int
    total_items: int
    pending_review_count: int
    by_plastic_type: list[PlasticTypeCount]
    by_room: list[RoomCount]
