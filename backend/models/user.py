from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Enum
from config.settings import db
import uuid

class User(db.Model):
    __tablename__ = "users"

    id_user = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(Enum("Doctor", "Paciente", name="user_role"), nullable=False)

    patient_profile = db.relationship("Patient", backref="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = db.relationship("Doctor", backref="user", uselist=False, cascade="all, delete-orphan")

    def __init__(self, username, email, password, role):
        self.username = username
        self.email = email
        self.set_password(password)
        self.role = role

    def set_password(self, plain_password):
        self.password_hash = generate_password_hash(plain_password)

    def check_password(self, plain_password):
        return check_password_hash(self.password_hash, plain_password)

    def to_json(self):
        return {
            "id_user": self.id_user,
            "username": self.username,
            "email": self.email,
            "role": self.role}