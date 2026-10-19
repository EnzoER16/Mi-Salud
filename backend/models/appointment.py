from config.settings import db
import uuid
from datetime import datetime, timezone


class Appointment(db.Model):
    """Turno personal del paciente (su agenda). Solo lo ve el paciente que lo creó."""
    __tablename__ = "appointments"

    id_appointment = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_patient = db.Column(db.String(36), db.ForeignKey('patients.id_patient'), nullable=False)

    title = db.Column(db.String(100), nullable=False)          # Ej: "Clínica médica"
    scheduled_at = db.Column(db.DateTime, nullable=False)      # Guardado en UTC (sin zona, como el resto del proyecto)
    doctor_name = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(100), nullable=True)
    modality = db.Column(db.String(20), nullable=False, default="Presencial")  # "Presencial" o "Virtual"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    patient = db.relationship("Patient", backref=db.backref("appointments", cascade="all, delete-orphan"))
    files = db.relationship("AppointmentFile", backref="appointment", cascade="all, delete-orphan",
                            order_by="AppointmentFile.created_at.desc()")
    notes = db.relationship("AppointmentNote", backref="appointment", cascade="all, delete-orphan",
                            order_by="AppointmentNote.created_at.desc()")

    def __init__(self, id_patient, title, scheduled_at, doctor_name=None, location=None, modality="Presencial"):
        self.id_patient = id_patient
        self.title = title
        self.scheduled_at = scheduled_at
        self.doctor_name = doctor_name
        self.location = location
        self.modality = modality

    def to_json(self, detail=False):
        data = {
            "id_appointment": self.id_appointment,
            "title": self.title,
            "scheduled_at": self.scheduled_at.isoformat() + "Z",   # Z = UTC, el frontend lo convierte a hora local
            "doctor_name": self.doctor_name,
            "location": self.location,
            "modality": self.modality,
            "file_count": len(self.files),
            "note_count": len(self.notes)}
        if detail:
            data["files"] = [f.to_json() for f in self.files]
            data["notes"] = [n.to_json() for n in self.notes]
        return data
