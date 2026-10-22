from config.settings import db
from validators import iso
from datetime import datetime, timezone
import uuid


class PatientVaccine(db.Model):
    """Una dosis de vacuna que el paciente se aplicó (carnet de vacunación personal)."""
    __tablename__ = "patient_vaccines"

    id_vaccine = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_patient = db.Column(db.String(36), db.ForeignKey("patients.id_patient"), nullable=False, index=True)

    name = db.Column(db.String(100), nullable=False)
    dose = db.Column(db.String(40))
    applied_on = db.Column(db.Date)            # opcional: a veces no se recuerda la fecha exacta
    next_dose_on = db.Column(db.Date)          # próxima dosis o refuerzo
    place = db.Column(db.String(100))
    notes = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    patient = db.relationship("Patient", backref=db.backref("vaccines", cascade="all, delete-orphan"))

    def to_json(self):
        return {
            "id_vaccine": self.id_vaccine,
            "name": self.name,
            "dose": self.dose,
            "applied_on": iso(self.applied_on),
            "next_dose_on": iso(self.next_dose_on),
            "place": self.place,
            "notes": self.notes,
        }
