import enum
import uuid
from datetime import datetime
from typing import TypeVar

from sqlalchemy import DateTime, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

E = TypeVar("E", bound=enum.Enum)


def pg_enum(enum_cls: type[E], name: str) -> Enum:
    """
    Build a Postgres ENUM column type whose on-disk labels are the enum's
    *values* (e.g. "pending-review"), not its Python member names (e.g.
    "PENDING_REVIEW"). Without values_callable, SQLAlchemy defaults to
    member names, which then mismatches any raw-SQL CHECK constraint or
    manual query that compares against the string value.
    """
    return Enum(enum_cls, name=name, values_callable=lambda cls: [e.value for e in cls])


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
