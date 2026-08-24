from config.settings import db
import uuid
from datetime import datetime, timezone

class MedicalConsultation(db.Model):
    __tablename__ = "medical_consultations"

    id_consultation = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    id_patient = db.Column(db.String(36), db.ForeignKey('patients.id_patient'), nullable=False)
    id_doctor = db.Column(db.String(36), db.ForeignKey('doctors.id_doctor'), nullable=False)

    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    diagnosis = db.Column(db.Text, nullable=False)

    def __init__(self, id_patient, id_doctor, location, diagnosis):
        self.id_patient = id_patient
        self.id_doctor = id_doctor
        self.location = location
        self.diagnosis = diagnosis

    def to_json(self):
        return {
            "id_consultation": self.id_consultation,
            "id_patient": self.id_patient,
            "id_doctor": self.id_doctor,
            "date": self.date.isoformat(),
            "location": self.location,
            "diagnosis": self.diagnosis}