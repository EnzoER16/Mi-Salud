from app import create_app
from config.settings import db
from models.user import User
from models.patient import Patient
from models.doctor import Doctor
from models.medical_record import MedicalRecord
from models.medical_consultation import MedicalConsultation
from models.treatment import Treatment
from models.medication_intake import MedicationIntake
from datetime import datetime, timedelta, timezone

# Iniciamos la app de Flask para tener el contexto de la base de datos
app = create_app()

with app.app_context():
    print("🧹 Limpiando la base de datos...")
    db.drop_all()  # Borra todas las tablas
    db.create_all() # Las vuelve a crear vacías

    print("👤 Creando usuarios...")
    # Creamos 1 Doctor y 2 Pacientes (La contraseña para todos será '123456')
    doc_user = User(username="Juan Pérez", email="juan@gmail.com", password="juan", role="Doctor")
    pat_user1 = User(username="Maria Gómez", email="maria@gmail.com", password="maria", role="Paciente")
    pat_user2 = User(username="Esteban González", email="esteban@gmail.com", password="esteban", role="Paciente")
    
    db.session.add_all([doc_user, pat_user1, pat_user2])
    db.session.commit()

    print("🏥 Creando perfiles profesionales y personales...")
    doc_profile = Doctor(id_user=doc_user.id_user, specialty="Cardiología", license_number="MP-12345")
    
    pat_profile1 = Patient(id_user=pat_user1.id_user, dni="11222333", health_insurance="OSDE", plan="210", member_number="123456789", address="Av. San Martín 123")
    pat_profile2 = Patient(id_user=pat_user2.id_user, dni="44555666", health_insurance="Swiss Medical", plan="SMG20", member_number="987654321", address="Calle Belgrano 456")
    
    db.session.add_all([doc_profile, pat_profile1, pat_profile2])
    db.session.commit()

    print("📋 Creando fichas médicas...")
    record1 = MedicalRecord(id_patient=pat_profile1.id_patient, blood_group="O+", allergies="Penicilina", antecedents="Hipertensión controlada")
    record2 = MedicalRecord(id_patient=pat_profile2.id_patient, blood_group="A-", allergies="Ninguna", antecedents="Asma leve")
    db.session.add_all([record1, record2])
    db.session.commit()

    print("🗓️ Generando consultas previas (Historial Médico)...")
    now = datetime.now(timezone.utc)
    
    # Consulta hace 5 días para Juan
    cons1 = MedicalConsultation(id_patient=pat_profile1.id_patient, id_doctor=doc_profile.id_doctor, location="Consultorio 1", diagnosis="Pico de presión. Se receta medicación.")
    cons1.date = now - timedelta(days=5) 
    
    # Consulta de hoy para María
    cons2 = MedicalConsultation(id_patient=pat_profile2.id_patient, id_doctor=doc_profile.id_doctor, location="Consultorio 2", diagnosis="Control de rutina. Todo en orden.")
    cons2.date = now - timedelta(hours=2)

    db.session.add_all([cons1, cons2])
    db.session.commit()

    print("💊 Recetando tratamientos y armando tomas...")
    # Tratamiento para Juan derivado de la consulta 1
    treat1 = Treatment(id_consultation=cons1.id_consultation, medication="Losartán", dose="50mg", frequency_hours=12, duration_days=30, instructions="Tomar con el desayuno y la cena")
    db.session.add(treat1)
    db.session.commit()

    # Le creamos algunas pastillas (tomas) para que ya tenga progreso
    start_time = now - timedelta(days=2) # Empezó hace 2 días
    for i in range(6): # 6 tomas (3 días)
        intake = MedicationIntake(id_treatment=treat1.id_treatment, scheduled_time=start_time + timedelta(hours=12*i))
        if i < 4: 
            # Simulamos que las primeras 4 ya las tomó
            intake.status = "Tomado"
            intake.taken_time = intake.scheduled_time + timedelta(minutes=15)
        db.session.add(intake)
        
    db.session.commit()
    print("✅ ¡Base de datos poblada con éxito! Ya puedes mostrar la app a tu profesora.")