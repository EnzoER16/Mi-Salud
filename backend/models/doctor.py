from config.settings import db
import uuid

class Doctor(db.Model):
    __tablename__ = "doctors"

    id_doctor = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_user = db.Column(db.String(36), db.ForeignKey('users.id_user'), unique=True, nullable=False)

    specialty = db.Column(db.String(50), nullable=False)
    license_number = db.Column(db.String(20), nullable=False)

    consultations = db.relationship("MedicalConsultation", backref="doctor", cascade="all, delete-orphan")

    def __init__(self, id_user, specialty, license_number):
        self.id_user = id_user
        self.specialty = specialty
        self.license_number = license_number

    def to_json(self):
        return {
            "id_doctor": self.id_doctor,
            "id_user": self.id_user,
            "specialty": self.specialty,
            "license_number": self.license_number}