from config.settings import db
import uuid

class Patient(db.Model):
    __tablename__ = "patients"

    id_patient = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_user = db.Column(db.String(36), db.ForeignKey('users.id_user'), unique=True, nullable=False)

    dni = db.Column(db.String(15), unique=True, nullable=False)
    health_insurance = db.Column(db.String(50))
    plan = db.Column(db.String(10))
    member_number = db.Column(db.String(20), unique=True)
    address = db.Column(db.String(100))

    medical_record = db.relationship("MedicalRecord", backref="patient", uselist=False, cascade="all, delete-orphan")
    consultations = db.relationship("MedicalConsultation", backref="patient", cascade="all, delete-orphan")

    def __init__(self, id_user, dni, health_insurance, plan, member_number, address):
        self.id_user = id_user
        self.dni = dni
        self.health_insurance = health_insurance
        self.plan = plan
        self.member_number = member_number
        self.address = address

    def to_json(self):
        return {
            "id_patient": self.id_patient,
            "id_user": self.id_user,
            "dni": self.dni,
            "health_insurance": self.health_insurance,
            "plan": self.plan,
            "member_number": self.member_number,
            "address": self.address}