import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Household(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "households"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    household_name: Mapped[str] = mapped_column(String(120))
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(120))
    number_of_residents: Mapped[int | None] = mapped_column(Integer, nullable=True)

    owner: Mapped["User"] = relationship(back_populates="households")
    audit_sessions: Mapped[list["AuditSession"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )
