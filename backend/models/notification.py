from config.settings import db
import uuid
from datetime import datetime, timezone


class Notification(db.Model):
    __tablename__ = "notifications"

    id_notification = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_user = db.Column(db.String(36), db.ForeignKey('users.id_user'), nullable=False)

    message = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text, nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __init__(self, id_user, message, details=None):
        self.id_user = id_user
        self.message = message
        self.details = details

    def to_json(self):
        return {
            "id_notification": self.id_notification,
            "message": self.message,
            "details": self.details,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat()}