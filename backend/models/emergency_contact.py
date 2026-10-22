from config.settings import db
from datetime import datetime, timezone
import uuid


class EmergencyContact(db.Model):
    """Persona a la que llamar en caso de emergencia (un paciente puede cargar varias)."""
    __tablename__ = "emergency_contacts"

    id_contact = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_patient = db.Column(db.String(36), db.ForeignKey("patients.id_patient"), nullable=False, index=True)

    name = db.Column(db.String(80), nullable=False)
    relationship_label = db.Column("relationship", db.String(40))
    phone = db.Column(db.String(25), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    patient = db.relationship("Patient", backref=db.backref("emergency_contacts", cascade="all, delete-orphan"))

    def to_json(self):
        return {
            "id_contact": self.id_contact,
            "name": self.name,
            "relationship": self.relationship_label,
            "phone": self.phone,
        }
