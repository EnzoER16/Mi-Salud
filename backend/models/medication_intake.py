from config.settings import db
from sqlalchemy import Enum
import uuid

class MedicationIntake(db.Model):
    __tablename__ = "medication_intakes"

    id_intake = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_treatment = db.Column(db.String(36), db.ForeignKey('treatments.id_treatment'), nullable=False)
    
    scheduled_time = db.Column(db.DateTime, nullable=False)
    taken_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(Enum("Pendiente", "Tomado", "Omitido", name="intake_status"), default="Pendiente", nullable=False)

    def __init__(self, id_treatment, scheduled_time):
        self.id_treatment = id_treatment
        self.scheduled_time = scheduled_time

    def to_json(self):
        return {
            "id_intake": self.id_intake,
            "id_treatment": self.id_treatment,
            "scheduled_time": self.scheduled_time.isoformat() if self.scheduled_time else None,
            "taken_time": self.taken_time.isoformat() if self.taken_time else None,
            "status": self.status}