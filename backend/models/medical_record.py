from config.settings import db
import uuid

class MedicalRecord(db.Model):
    __tablename__ = "medical_records"

    id_record = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_patient = db.Column(db.String(36), db.ForeignKey('patients.id_patient'), unique=True, nullable=False)
    
    blood_group = db.Column(db.String(10), nullable=True)
    allergies = db.Column(db.Text, nullable=True)
    antecedents = db.Column(db.Text, nullable=True)

    def __init__(self, id_patient, blood_group=None, allergies=None, antecedents=None):
        self.id_patient = id_patient
        self.blood_group = blood_group
        self.allergies = allergies
        self.antecedents = antecedents

    def to_json(self):
        return {
            "id_record": self.id_record,
            "id_patient": self.id_patient,
            "blood_group": self.blood_group,
            "allergies": self.allergies,
            "antecedents": self.antecedents}