from config.settings import db
from validators import age_from, iso
import uuid


class DoctorDetails(db.Model):
    """Datos personales y de atención del médico (la especialidad y la matrícula siguen en `doctors`)."""
    __tablename__ = "doctor_details"

    id_details = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_doctor = db.Column(db.String(36), db.ForeignKey("doctors.id_doctor"), unique=True, nullable=False)

    # Personales
    first_name = db.Column(db.String(60))
    last_name = db.Column(db.String(60))
    birth_date = db.Column(db.Date)
    phone = db.Column(db.String(25))
    locality = db.Column(db.String(80))
    # Profesionales
    workplace = db.Column(db.String(120))            # lugar de atención (consultorio, clínica, hospital)
    office_address = db.Column(db.String(150))
    attention_hours = db.Column(db.String(150))
    accepted_insurances = db.Column(db.String(255))  # obras sociales que atiende
    bio = db.Column(db.String(500))

    doctor = db.relationship("Doctor", backref=db.backref("details", uselist=False, cascade="all, delete-orphan"))

    FIELDS = ("first_name", "last_name", "birth_date", "phone", "locality",
              "workplace", "office_address", "attention_hours", "accepted_insurances", "bio")

    def to_json(self):
        data = {f: getattr(self, f) for f in self.FIELDS}
        data["birth_date"] = iso(self.birth_date)
        data["age"] = age_from(self.birth_date)
        return data


def empty_doctor_details_json():
    data = {f: None for f in DoctorDetails.FIELDS}
    data["age"] = None
    return data
