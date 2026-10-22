from config.settings import db
from validators import age_from, iso
import uuid


class PatientDetails(db.Model):
    """Datos personales ampliados del paciente (el DNI, la obra social y el domicilio siguen en `patients`)."""
    __tablename__ = "patient_details"

    id_details = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_patient = db.Column(db.String(36), db.ForeignKey("patients.id_patient"), unique=True, nullable=False)

    first_name = db.Column(db.String(60))
    last_name = db.Column(db.String(60))
    birth_date = db.Column(db.Date)
    sex = db.Column(db.String(25))
    marital_status = db.Column(db.String(30))
    occupation = db.Column(db.String(80))
    phone = db.Column(db.String(25))
    locality = db.Column(db.String(80))
    province = db.Column(db.String(60))
    postal_code = db.Column(db.String(10))

    patient = db.relationship("Patient", backref=db.backref("details", uselist=False, cascade="all, delete-orphan"))

    FIELDS = ("first_name", "last_name", "birth_date", "sex", "marital_status", "occupation",
              "phone", "locality", "province", "postal_code")

    @property
    def full_name(self):
        return " ".join(p for p in (self.first_name, self.last_name) if p) or None

    def to_json(self):
        data = {f: getattr(self, f) for f in self.FIELDS}
        data["birth_date"] = iso(self.birth_date)
        data["age"] = age_from(self.birth_date)
        return data


def empty_patient_details_json():
    data = {f: None for f in PatientDetails.FIELDS}
    data["age"] = None
    return data
