"""
Import every model here so Base.metadata sees them all - this is what
Alembic's autogenerate and Base.metadata.create_all() rely on.
"""

from app.models.user import User
from app.models.household import Household
from app.models.audit_session import AuditSession
from app.models.plastic_entry import PlasticEntry
from app.models.photo import Photo
from app.models.learning_progress import LearningProgress
from app.models.report import Report

__all__ = [
    "User",
    "Household",
    "AuditSession",
    "PlasticEntry",
    "Photo",
    "LearningProgress",
    "Report",
]
