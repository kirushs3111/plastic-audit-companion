import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class LearningProgress(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "learning_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    # Which of the 7 plastic types this progress row is for.
    plastic_code: Mapped[int] = mapped_column(Integer)
    quiz_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="learning_progress")

    __table_args__ = (
        CheckConstraint(
            "plastic_code >= 1 AND plastic_code <= 7", name="ck_learning_plastic_code_range"
        ),
        UniqueConstraint("user_id", "plastic_code", name="uq_user_plastic_progress"),
    )
