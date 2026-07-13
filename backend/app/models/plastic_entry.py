import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import IdentificationMethod, ItemCategoryId, RoomId
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin, pg_enum


class PlasticEntry(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    The core row of the audit.

    Two ways an entry gets created:
    - identification_method="known": the person told us the type directly.
      plastic_code is always set, needs_review is always False.
    - identification_method="pending-review": nobody knew the type. It's
      logged with photos only - plastic_code is NULL and needs_review is
      True until a reviewer assigns a type via the Photo Review queue
      (Module 6). There is no AI guess in between; a human either knows
      the type or someone reviews the photo later.
    """

    __tablename__ = "plastic_entries"

    audit_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audit_sessions.id", ondelete="CASCADE")
    )
    room: Mapped[RoomId] = mapped_column(pg_enum(RoomId, name="room_id"))
    item: Mapped[ItemCategoryId] = mapped_column(
        pg_enum(ItemCategoryId, name="item_category_id")
    )
    # Resin identification code, 1-7. NULL while pending review.
    plastic_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    identification_method: Mapped[IdentificationMethod] = mapped_column(
        pg_enum(IdentificationMethod, name="identification_method")
    )
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False)
    user_confirmed: Mapped[bool] = mapped_column(Boolean, default=True)

    audit_session: Mapped["AuditSession"] = relationship(back_populates="entries")
    photos: Mapped[list["Photo"]] = relationship(
        back_populates="plastic_entry", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "plastic_code IS NULL OR (plastic_code >= 1 AND plastic_code <= 7)",
            name="ck_plastic_code_range",
        ),
        CheckConstraint(
            "(identification_method = 'known' AND plastic_code IS NOT NULL) OR "
            "(identification_method = 'pending-review')",
            name="ck_known_requires_code",
        ),
    )
