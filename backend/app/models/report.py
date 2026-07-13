import enum
import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin, pg_enum


class ReportType(str, enum.Enum):
    CSV = "csv"
    EXCEL = "excel"
    PDF = "pdf"


class Report(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reports"

    generated_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    report_type: Mapped[ReportType] = mapped_column(pg_enum(ReportType, name="report_type"))
    storage_url: Mapped[str] = mapped_column(String(500))
    title: Mapped[str] = mapped_column(String(200))

    generated_by: Mapped["User | None"] = relationship()
