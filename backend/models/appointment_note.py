from config.settings import db
import uuid
from datetime import datetime, timezone


class AppointmentNote(db.Model):
    """Nota personal del paciente sobre un turno ("Para conversar en la consulta", etc.)."""
    __tablename__ = "appointment_notes"

    id_note = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_appointment = db.Column(db.String(36), db.ForeignKey('appointments.id_appointment'), nullable=False)

    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def __init__(self, id_appointment, title, content):
        self.id_appointment = id_appointment
        self.title = title
        self.content = content

    def to_json(self):
        return {
            "id_note": self.id_note,
            "id_appointment": self.id_appointment,
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at.isoformat() + "Z",
            "updated_at": self.updated_at.isoformat() + "Z"}
