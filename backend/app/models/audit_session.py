import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class AuditSession(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "audit_sessions"

    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE")
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    household: Mapped["Household"] = relationship(back_populates="audit_sessions")
    entries: Mapped[list["PlasticEntry"]] = relationship(
        back_populates="audit_session", cascade="all, delete-orphan"
    )

    @property
    def is_submitted(self) -> bool:
        return self.submitted_at is not None
