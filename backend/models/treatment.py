from config.settings import db
import uuid

class Treatment(db.Model):
    __tablename__ = "treatments"

    id_treatment = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Vinculado a la consulta (que a su vez está vinculada al paciente y al médico)
    id_consultation = db.Column(db.String(36), db.ForeignKey('medical_consultations.id_consultation'), nullable=False)
    
    medication = db.Column(db.String(100), nullable=False)
    dose = db.Column(db.String(50), nullable=False)
    frequency_hours = db.Column(db.Integer, nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    
    # Campo extra (opcional) para indicaciones manuales
    instructions = db.Column(db.String(255), nullable=True) 

    intakes = db.relationship("MedicationIntake", backref="treatment", cascade="all, delete-orphan")

    def __init__(self, id_consultation, medication, dose, frequency_hours, duration_days, instructions=None):
        self.id_consultation = id_consultation
        self.medication = medication
        self.dose = dose
        self.frequency_hours = frequency_hours
        self.duration_days = duration_days
        self.instructions = instructions

    def to_json(self):
        return {
            "id_treatment": self.id_treatment,
            "id_consultation": self.id_consultation,
            "medication": self.medication,
            "dose": self.dose,
            "frequency_hours": self.frequency_hours,
            "duration_days": self.duration_days,
            "instructions": self.instructions,
            "compliance": self.calculate_compliance() # Devolvemos el porcentaje directamente a React
        }
        
    def calculate_compliance(self):
        total_intakes = len(self.intakes)
        if total_intakes == 0:
            return 0
        taken_intakes = sum(1 for intake in self.intakes if intake.status == "Tomado")
        return round((taken_intakes / total_intakes) * 100, 2)