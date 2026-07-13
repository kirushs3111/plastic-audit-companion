import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import PhotoSlot
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin, pg_enum


class Photo(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "photos"

    plastic_entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plastic_entries.id", ondelete="CASCADE")
    )
    slot: Mapped[PhotoSlot] = mapped_column(pg_enum(PhotoSlot, name="photo_slot"))
    # Local disk path today (served at /uploads/...); swap for a
    # Cloudinary/Firebase URL later without changing this column's shape.
    storage_url: Mapped[str] = mapped_column(String(500))
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    plastic_entry: Mapped["PlasticEntry"] = relationship(back_populates="photos")
