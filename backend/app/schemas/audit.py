from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, computed_field, model_validator

from app.models.enums import IdentificationMethod, ItemCategoryId, PhotoSlot, RoomId


# --- Household ---


class HouseholdCreate(BaseModel):
    household_name: str = Field(min_length=1, max_length=120)
    address: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=120)
    number_of_residents: int | None = Field(default=None, ge=1, le=50)


class HouseholdResponse(BaseModel):
    id: UUID
    household_name: str
    address: str
    city: str
    number_of_residents: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Photo ---


class PhotoCreate(BaseModel):
    slot: PhotoSlot
    storage_url: str = Field(max_length=500)
    original_filename: str | None = None


class PhotoResponse(BaseModel):
    id: UUID
    slot: PhotoSlot
    original_filename: str | None

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def storage_url(self) -> str:
        """
        Always the authenticated serving endpoint, never the raw internal
        disk path - GET /api/photos/{id}/file checks the requester owns
        this photo (or is an admin) before returning any bytes. There is
        no public URL that serves a photo without that check.
        """
        return f"/api/photos/{self.id}/file"


class PhotoUploadResponse(BaseModel):
    """Returned by POST /api/photos/upload - pass storage_url straight into
    a PhotoCreate when creating the plastic entry."""

    storage_url: str
    original_filename: str


# --- Plastic Entry ---


class PlasticEntryCreate(BaseModel):
    room: RoomId
    item: ItemCategoryId
    identification_method: IdentificationMethod
    plastic_code: int | None = Field(default=None, ge=1, le=7)
    quantity: int = Field(ge=1, le=999)
    photos: list[PhotoCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def check_code_matches_method(self) -> "PlasticEntryCreate":
        if self.identification_method == IdentificationMethod.KNOWN:
            if self.plastic_code is None:
                raise ValueError("plastic_code is required when identification_method is 'known'")
        else:  # pending-review
            if self.plastic_code is not None:
                raise ValueError("plastic_code must be omitted for 'pending-review' entries")
            if not self.photos:
                raise ValueError("at least one photo is required for 'pending-review' entries")
        return self


class PlasticEntryResponse(BaseModel):
    id: UUID
    room: RoomId
    item: ItemCategoryId
    plastic_code: int | None
    quantity: int
    identification_method: IdentificationMethod
    needs_review: bool
    user_confirmed: bool
    created_at: datetime
    photos: list[PhotoResponse] = []

    model_config = {"from_attributes": True}


class PlasticEntryReviewAssign(BaseModel):
    plastic_code: int = Field(ge=1, le=7)


# --- Audit Session ---


class AuditSessionCreate(BaseModel):
    household_id: UUID


class AuditSessionResponse(BaseModel):
    id: UUID
    household_id: UUID
    submitted_at: datetime | None
    created_at: datetime
    updated_at: datetime
    entries: list[PlasticEntryResponse] = []

    model_config = {"from_attributes": True}


class AuditSessionSummary(BaseModel):
    """Lightweight version for list views (dashboard's "Previous Audits")."""

    id: UUID
    household_id: UUID
    submitted_at: datetime | None
    updated_at: datetime
    entry_count: int
    total_items: int

    model_config = {"from_attributes": True}
