# from app import create_app
# from config.settings import db
# from models.user import User
# from models.patient import Patient
# from models.doctor import Doctor
# from models.medical_record import MedicalRecord
# from models.medical_consultation import MedicalConsultation
# from models.treatment import Treatment
# from models.medication_intake import MedicationIntake
# from datetime import datetime, timedelta, timezone

# # Iniciamos la app de Flask para tener el contexto de la base de datos
# app = create_app()

# with app.app_context():
#     print("🧹 Limpiando la base de datos...")
#     db.drop_all()  # Borra todas las tablas
#     db.create_all() # Las vuelve a crear vacías

#     print("👤 Creando usuarios...")
#     # Creamos 1 Doctor y 2 Pacientes (La contraseña para todos será '123456')
#     doc_user = User(username="Juan Pérez", email="juan@gmail.com", password="juan", role="Doctor")
#     pat_user1 = User(username="Maria Gómez", email="maria@gmail.com", password="maria", role="Paciente")
#     pat_user2 = User(username="Esteban González", email="esteban@gmail.com", password="esteban", role="Paciente")
    
#     db.session.add_all([doc_user, pat_user1, pat_user2])
#     db.session.commit()

#     print("🏥 Creando perfiles profesionales y personales...")
#     doc_profile = Doctor(id_user=doc_user.id_user, specialty="Cardiología", license_number="MP-12345")
    
#     pat_profile1 = Patient(id_user=pat_user1.id_user, dni="11222333", health_insurance="OSDE", plan="210", member_number="123456789", address="Av. San Martín 123")
#     pat_profile2 = Patient(id_user=pat_user2.id_user, dni="44555666", health_insurance="Swiss Medical", plan="SMG20", member_number="987654321", address="Calle Belgrano 456")
    
#     db.session.add_all([doc_profile, pat_profile1, pat_profile2])
#     db.session.commit()

#     print("📋 Creando fichas médicas...")
#     record1 = MedicalRecord(id_patient=pat_profile1.id_patient, blood_group="O+", allergies="Penicilina", antecedents="Hipertensión controlada")
#     record2 = MedicalRecord(id_patient=pat_profile2.id_patient, blood_group="A-", allergies="Ninguna", antecedents="Asma leve")
#     db.session.add_all([record1, record2])
#     db.session.commit()

#     print("🗓️ Generando consultas previas (Historial Médico)...")
#     now = datetime.now(timezone.utc)
    
#     # Consulta hace 5 días para Juan
#     cons1 = MedicalConsultation(id_patient=pat_profile1.id_patient, id_doctor=doc_profile.id_doctor, location="Consultorio 1", diagnosis="Pico de presión. Se receta medicación.")
#     cons1.date = now - timedelta(days=5) 
    
#     # Consulta de hoy para María
#     cons2 = MedicalConsultation(id_patient=pat_profile2.id_patient, id_doctor=doc_profile.id_doctor, location="Consultorio 2", diagnosis="Control de rutina. Todo en orden.")
#     cons2.date = now - timedelta(hours=2)

#     db.session.add_all([cons1, cons2])
#     db.session.commit()

#     print("💊 Recetando tratamientos y armando tomas...")
#     # Tratamiento para Juan derivado de la consulta 1
#     treat1 = Treatment(id_consultation=cons1.id_consultation, medication="Losartán", dose="50mg", frequency_hours=12, duration_days=30, instructions="Tomar con el desayuno y la cena")
#     db.session.add(treat1)
#     db.session.commit()

#     # Le creamos algunas pastillas (tomas) para que ya tenga progreso
#     start_time = now - timedelta(days=2) # Empezó hace 2 días
#     for i in range(6): # 6 tomas (3 días)
#         intake = MedicationIntake(id_treatment=treat1.id_treatment, scheduled_time=start_time + timedelta(hours=12*i))
#         if i < 4: 
#             # Simulamos que las primeras 4 ya las tomó
#             intake.status = "Tomado"
#             intake.taken_time = intake.scheduled_time + timedelta(minutes=15)
#         db.session.add(intake)
        
#     db.session.commit()
#     print("✅ ¡Base de datos poblada con éxito! Ya puedes mostrar la app a tu profesora.")




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

app = create_app()

with app.app_context():
    db.drop_all()  
    db.create_all() 

    # 1. Usuarios
    doc_user = User(username="Juan Ruiz", email="juan@gmail.com", password="12345", role="Doctor")
    pat_user1 = User(username="Maria Silva", email="maria@gmail.com", password="12345", role="Paciente")
    pat_user2 = User(username="Luis Gómez", email="luis@gmail.com", password="12345", role="Paciente")
    pat_user3 = User(username="Sofía Ríos", email="sofia@gmail.com", password="12345", role="Paciente")
    
    db.session.add_all([doc_user, pat_user1, pat_user2, pat_user3])
    db.session.commit()

    # 2. Perfiles
    doc_profile = Doctor(id_user=doc_user.id_user, specialty="Clínica Médica", license_number="MP-9876")
    
    pat_profile1 = Patient(id_user=pat_user1.id_user, dni="33444555", health_insurance="OSDE", plan="310", member_number="112233", address="Av. San Martín 1050, Mendoza")
    pat_profile2 = Patient(id_user=pat_user2.id_user, dni="40111222", health_insurance="Swiss Medical", plan="SMG20", member_number="445566", address="Calle Arístides Villanueva 240, Mendoza")
    pat_profile3 = Patient(id_user=pat_user3.id_user, dni="42888999", health_insurance="Sancor Salud", plan="1000", member_number="778899", address="Godoy Cruz 15, Mendoza")
    
    db.session.add_all([doc_profile, pat_profile1, pat_profile2, pat_profile3])
    db.session.commit()

    # 3. Fichas Médicas
    record1 = MedicalRecord(id_patient=pat_profile1.id_patient, blood_group="A+", allergies="Penicilina", antecedents="Asma leve")
    record2 = MedicalRecord(id_patient=pat_profile2.id_patient, blood_group="O+", allergies="Ninguna", antecedents="Hipertensión")
    record3 = MedicalRecord(id_patient=pat_profile3.id_patient, blood_group="B-", allergies="Polvo", antecedents="Ninguno")
    db.session.add_all([record1, record2, record3])
    db.session.commit()

    # 4. Consultas
    now = datetime.now(timezone.utc)
    
    cons1 = MedicalConsultation(id_patient=pat_profile1.id_patient, id_doctor=doc_profile.id_doctor, location="Hospital Central - Consultorio 3", diagnosis="Cuadro de bronquitis aguda. Se receta antibiótico.")
    cons1.date = now - timedelta(days=3) 
    
    cons2 = MedicalConsultation(id_patient=pat_profile2.id_patient, id_doctor=doc_profile.id_doctor, location="Clínica de Cuyo", diagnosis="Presión arterial elevada. Se ajusta medicación.")
    cons2.date = now - timedelta(days=1)

    cons3 = MedicalConsultation(id_patient=pat_profile3.id_patient, id_doctor=doc_profile.id_doctor, location="Guardia", diagnosis="Reacción alérgica cutánea. Se indica antihistamínico.")
    cons3.date = now - timedelta(hours=5)

    db.session.add_all([cons1, cons2, cons3])
    db.session.commit()

    # 5. Tratamientos y Tomas (Diferentes niveles de cumplimiento para la UI)
    
    # Tratamiento 1: Ana (Cumplimiento perfecto)
    treat1 = Treatment(id_consultation=cons1.id_consultation, medication="Amoxicilina", dose="500mg", frequency_hours=8, duration_days=7)
    db.session.add(treat1)
    db.session.commit()
    
    start_time_1 = now - timedelta(days=3)
    for i in range(21):
        intake_time = start_time_1 + timedelta(hours=8*i)
        intake = MedicationIntake(id_treatment=treat1.id_treatment, scheduled_time=intake_time)
        if intake_time < now: 
            intake.status = "Tomado"
            intake.taken_time = intake.scheduled_time + timedelta(minutes=10)
        db.session.add(intake)

    # Tratamiento 2: Luis (Cumplimiento a medias - Olvidó algunas)
    treat2 = Treatment(id_consultation=cons2.id_consultation, medication="Enalapril", dose="10mg", frequency_hours=12, duration_days=30)
    db.session.add(treat2)
    db.session.commit()

    start_time_2 = now - timedelta(days=1)
    for i in range(60):
        intake_time = start_time_2 + timedelta(hours=12*i)
        intake = MedicationIntake(id_treatment=treat2.id_treatment, scheduled_time=intake_time)
        if intake_time < now:
            # Alterna entre tomado y omitido/pendiente para que el % baje
            if i % 2 == 0:
                intake.status = "Tomado"
                intake.taken_time = intake.scheduled_time + timedelta(minutes=5)
            else:
                intake.status = "Pendiente"
        db.session.add(intake)

    # Tratamiento 3: Sofía (Recién iniciado - 0% cumplimiento)
    treat3 = Treatment(id_consultation=cons3.id_consultation, medication="Loratadina", dose="10mg", frequency_hours=24, duration_days=5)
    db.session.add(treat3)
    db.session.commit()

    start_time_3 = now + timedelta(hours=1) # Su primera toma es en 1 hora
    for i in range(5):
        intake = MedicationIntake(id_treatment=treat3.id_treatment, scheduled_time=start_time_3 + timedelta(hours=24*i))
        db.session.add(intake)
        
    db.session.commit()