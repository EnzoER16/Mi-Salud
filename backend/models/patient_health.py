from config.settings import db
from validators import iso
import uuid


class PatientHealth(db.Model):
    """Datos de salud adicionales de la ficha médica (el grupo sanguíneo, las alergias y los
    antecedentes siguen en `medical_records`)."""
    __tablename__ = "patient_health"

    id_health = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_patient = db.Column(db.String(36), db.ForeignKey("patients.id_patient"), unique=True, nullable=False)

    weight_kg = db.Column(db.Float)
    height_cm = db.Column(db.Integer)
    conditions = db.Column(db.JSON)            # lista de condiciones crónicas, ej: ["Diabetes", "Asma"]
    intolerances = db.Column(db.Text)
    surgeries = db.Column(db.Text)             # cirugías e internaciones
    family_history = db.Column(db.Text)
    current_medication = db.Column(db.Text)    # medicación habitual (incluye la que no recetó MiSalud+)
    wears_glasses = db.Column(db.Boolean)
    last_checkup = db.Column(db.Date)
    last_dental_checkup = db.Column(db.Date)
    primary_doctor_name = db.Column(db.String(100))
    primary_doctor_phone = db.Column(db.String(25))
    care_center = db.Column(db.String(120))    # hospital o centro de atención habitual

    patient = db.relationship("Patient", backref=db.backref("health", uselist=False, cascade="all, delete-orphan"))

    FIELDS = ("weight_kg", "height_cm", "conditions", "intolerances", "surgeries", "family_history",
              "current_medication", "wears_glasses", "last_checkup", "last_dental_checkup",
              "primary_doctor_name", "primary_doctor_phone", "care_center")

    @property
    def bmi(self):
        if self.weight_kg and self.height_cm:
            return round(self.weight_kg / ((self.height_cm / 100) ** 2), 1)
        return None

    def to_json(self):
        data = {f: getattr(self, f) for f in self.FIELDS}
        data["conditions"] = self.conditions or []
        data["last_checkup"] = iso(self.last_checkup)
        data["last_dental_checkup"] = iso(self.last_dental_checkup)
        data["bmi"] = self.bmi
        return data


def empty_patient_health_json():
    data = {f: None for f in PatientHealth.FIELDS}
    data["conditions"] = []
    data["bmi"] = None
    return data
