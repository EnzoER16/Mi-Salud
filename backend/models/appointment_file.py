from config.settings import db
import uuid
from datetime import datetime, timezone


class AppointmentFile(db.Model):
    """Archivo o foto que el paciente adjunta a un turno (PDF, JPG o PNG)."""
    __tablename__ = "appointment_files"

    id_file = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_appointment = db.Column(db.String(36), db.ForeignKey('appointments.id_appointment'), nullable=False)

    original_name = db.Column(db.String(255), nullable=False)   # Nombre que ve el usuario
    stored_name = db.Column(db.String(80), nullable=False)      # Nombre real en disco (uuid, nunca el del usuario)
    mime_type = db.Column(db.String(50), nullable=False)
    size_bytes = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __init__(self, id_appointment, original_name, stored_name, mime_type, size_bytes):
        self.id_appointment = id_appointment
        self.original_name = original_name
        self.stored_name = stored_name
        self.mime_type = mime_type
        self.size_bytes = size_bytes

    def to_json(self):
        return {
            "id_file": self.id_file,
            "id_appointment": self.id_appointment,
            "name": self.original_name,
            "mime_type": self.mime_type,
            "size_bytes": self.size_bytes,
            "created_at": self.created_at.isoformat() + "Z"}
