from app import create_app
from config.settings import db
from datetime import datetime, timedelta, timezone
import random
import os

random.seed(2026)

# Modelos
from models.user import User
from models.patient import Patient
from models.patient_details import PatientDetails
from models.patient_health import PatientHealth
from models.emergency_contact import EmergencyContact
from models.patient_vaccine import PatientVaccine
from models.doctor import Doctor
from models.doctor_details import DoctorDetails
from models.medical_record import MedicalRecord
from models.medical_consultation import MedicalConsultation
from models.treatment import Treatment
from models.treatment_history import TreatmentHistory
from models.medication_intake import MedicationIntake
from models.medication import seed_medications
from models.appointment import Appointment
from models.appointment_note import AppointmentNote
from models.care_member import CareMember
from models.notification import Notification

app = create_app()

with app.app_context():
    print("🧹 Limpiando y recreando la base de datos...")
    db.drop_all()  
    db.create_all() 
    
    print("💊 Cargando catálogo de medicamentos...")
    seed_medications()

    # Base de tiempo (UTC sin zona)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    def at(days, hour=12, minute=0):
        return (now + timedelta(days=days)).replace(hour=hour, minute=minute, second=0, microsecond=0)

    # Función auxiliar para generar tomas masivas con distintos niveles de cumplimiento
    def generar_tomas(treatment, start_time, adherencia="alta"):
        intakes = []
        total_doses = int((treatment.duration_days * 24) / treatment.frequency_hours)
        for i in range(total_doses):
            intake_time = start_time + timedelta(hours=treatment.frequency_hours * i)
            intake = MedicationIntake(id_treatment=treatment.id_treatment, scheduled_time=intake_time)
            
            if intake_time < now:
                if adherencia == "perfecta":
                    estado = "Tomado"
                elif adherencia == "alta":
                    estado = "Omitido" if random.random() < 0.05 else "Tomado"
                elif adherencia == "media":
                    estado = "Omitido" if random.random() < 0.30 else "Tomado"
                else: 
                    estado = "Omitido" if random.random() < 0.60 else "Tomado"

                intake.status = estado
                if estado == "Tomado":
                    desfase = random.randint(-5, 45)
                    intake.taken_time = intake_time + timedelta(minutes=desfase)
            intakes.append(intake)
        db.session.add_all(intakes)


    print("👨‍⚕️ Creando perfiles de MÉDICOS al 100%...")
    docs_data = [
        {
            "u": ("Dr. Carlos Mendoza", "carlos@misalud.com", "Cardiología", "MP-10293"),
            "d": ("Carlos", "Mendoza", at(-18000).date(), "2614556677", "Mendoza", "Hospital Central", "Alem 123, Cons. 5", "Lun a Vie 08:00 a 14:00", "OSDE, OSEP, Swiss Medical", "Especialista en hipertensión y riesgo cardiovascular. Jefe de área.")
        },
        {
            "u": ("Dra. Laura Torres", "laura@misalud.com", "Clínica Médica", "MP-44512"),
            "d": ("Laura", "Torres", at(-15000).date(), "2619988776", "Godoy Cruz", "Clínica de Cuyo", "San Martín 444", "Mar y Jue 15:00 a 20:00", "Todas las prepagas", "Atención integral del adulto. Prevención y chequeos anuales exhaustivos.")
        },
        {
            "u": ("Dr. Jorge Medina", "jorge@misalud.com", "Traumatología", "MP-33211"),
            "d": ("Jorge", "Medina", at(-16000).date(), "2614443322", "Luján de Cuyo", "Centro Traumatológico Mendoza", "Sarmiento 900", "Lun a Sab 09:00 a 13:00", "OSDE, Medifé", "Cirugía artroscópica y medicina deportiva.")
        },
        {
            "u": ("Dra. Ana Soler", "ana@misalud.com", "Pediatría", "MP-55900"),
            "d": ("Ana", "Soler", at(-14000).date(), "2617778899", "Guaymallén", "Hospital Notti", "Bandera de los Andes 2600", "Lun a Vie 07:00 a 12:00", "Público general y OSEP", "Especialista en desarrollo infantil y neonatología.")
        },
        {
            "u": ("Dr. Roberto Fernández", "roberto@misalud.com", "Psiquiatría", "MP-11288"),
            "d": ("Roberto", "Fernández", at(-20000).date(), "2612221111", "Maipú", "Consultorio Privado", "Maza 400, Piso 2", "Mie y Vie 16:00 a 21:00", "Particular", "Abordaje integral de trastornos de ansiedad y estado de ánimo.")
        }
    ]

    doc_profiles = {}
    for i, data in enumerate(docs_data):
        nombre, email, esp, mat = data["u"]
        u = User(username=nombre, email=email, password="password123", role="Doctor")
        db.session.add(u)
        db.session.flush()
        
        doc = Doctor(id_user=u.id_user, specialty=esp, license_number=mat)
        db.session.add(doc)
        db.session.flush()
        doc_profiles[i] = doc

        fn, ln, bd, ph, loc, wp, oa, ah, ai, bio = data["d"]
        db.session.add(DoctorDetails(id_doctor=doc.id_doctor, first_name=fn, last_name=ln, birth_date=bd, phone=ph, locality=loc, workplace=wp, office_address=oa, attention_hours=ah, accepted_insurances=ai, bio=bio))
    db.session.commit()


    print("🧑‍⚕️ Creando perfiles de PACIENTES y CUIDADORES al 100%...")
    pats_data = [
        # [0] Enzo (Deportista)
        {
            "u": ("Enzo Rojas", "enzo@gmail.com"),
            "p": ("44123456", "OSDE", "210", "AFI-44123456", "Calle Falsa 123, Depto 4"),
            "pd": ("Enzo", "Rojas", at(-8000).date(), "Masculino", "Soltero/a", "Estudiante de Programación", "2615554433", "Maipú", "Mendoza", "5515"),
            "mr": ("O+", "Ninguna", "Deportista, lesión de rodilla recurrente por fútbol."),
            "ph": (78.5, 180, [], "Gluten (Leve)", "Operación de meniscos (2024)", "Padre hipertenso, madre sana.", "Ibuprofeno condicional al dolor", False, at(-30).date(), at(-180).date(), "Dr. Jorge Medina", "2614443322", "Centro CIAC"),
            "ec": [("María (Madre)", "Madre", "2610001111"), ("Lucas (Amigo)", "Amigo/a", "2610002222")],
            "vac": [("COVID-19", "3ª dosis", -400, None, "Vacunatorio Central", "Sin síntomas"), ("Antitetánica", "Refuerzo", -100, 3550, "Hospital Paroissien", "Por herida cortante")]
        },
        # [1] Marta (Adulta Mayor Crónica)
        {
            "u": ("Marta Silva", "marta@gmail.com"),
            "p": ("12345678", "PAMI", "Básico", "AFI-12345678", "San Martín 1500, PB"),
            "pd": ("Marta", "Silva", at(-26000).date(), "Femenino", "Viudo/a", "Jubilada Docente", "2613332211", "Guaymallén", "Mendoza", "5519"),
            "mr": ("A-", "Penicilina, Yodo", "Hipertensión crónica severa, diabetes tipo 2, artrosis generalizada."),
            "ph": (82.0, 155, ["Hipertensión", "Diabetes", "Enfermedad cardíaca"], "Lactosa", "Operación de cataratas (2020), Colecistectomía (2015)", "Antecedentes familiares de ACV.", "Metformina, Losartán, Aspirina, Calcio", True, at(-15).date(), at(-400).date(), "Dra. Laura Torres", "2619988776", "Hospital Central"),
            "ec": [("Diego Silva", "Hijo/a", "2619998888"), ("Vecina Norma", "Otro", "2615551122")],
            "vac": [("Gripe (antigripal)", "Dosis anual", -180, 180, "PAMI", ""), ("Neumococo conjugada", "Dosis única", -500, None, "Centro de Salud 15", ""), ("COVID-19", "5ª dosis", -300, None, "Polideportivo", "")]
        },
        # [2] Luis (Asmático)
        {
            "u": ("Luis Gómez", "luis@gmail.com"),
            "p": ("38555444", "Swiss Medical", "SMG30", "AFI-38555444", "Belgrano 34, Piso 2"),
            "pd": ("Luis", "Gómez", at(-12000).date(), "Masculino", "Casado/a", "Contador Público", "2616667788", "Ciudad", "Mendoza", "5500"),
            "mr": ("AB+", "Polvo, Ácaros, Pelo de gato", "Asma crónico desde la infancia. Episodios invernales recurrentes."),
            "ph": (70.0, 175, ["Asma"], "Ninguna", "Apendicectomía (2010)", "Padre asmático.", "Budesonida diario", False, at(-60).date(), at(-20).date(), "Dr. Neumonólogo", "2611110000", "Clínica de Cuyo"),
            "ec": [("Esposa", "Pareja", "2612223344"), ("Hermano", "Hermano/a", "2613334455")],
            "vac": [("Gripe (antigripal)", "Anual", -150, 215, "Vacunatorio Privado", "Indicada por neumonólogo")]
        },
        # [3] Sofía (Gastro)
        {
            "u": ("Sofía Ríos", "sofia@gmail.com"),
            "p": ("41222333", "Sancor Salud", "1000", "AFI-41222333", "Aristides 500, Torre B"),
            "pd": ("Sofía", "Ríos", at(-9500).date(), "Femenino", "Unión convivencial", "Diseñadora Gráfica", "2614445566", "Ciudad", "Mendoza", "5500"),
            "mr": ("B+", "Ninguna", "Gastritis crónica, colon irritable por estrés."),
            "ph": (60.0, 165, [], "Comidas muy picantes, Frituras", "Ninguna", "Madre con problemas gástricos.", "Pantoprazol a demanda", True, at(-90).date(), at(-30).date(), "Dra. Laura Torres", "2619988776", "Clínica de Cuyo"),
            "ec": [("Novio", "Pareja", "2619990000"), ("Madre", "Madre", "2618887766")],
            "vac": [("COVID-19", "4ª dosis", -500, None, "Hospital Clínicas", ""), ("Hepatitis B", "Completa", -1000, None, "Centro de Salud", "")]
        },
        # [4] Valentín (Niño)
        {
            "u": ("Valentín Martínez", "valentin@gmail.com"),
            "p": ("55111222", "OSDE", "210", "AFI-55111222", "Barrio Dalvian Mza A"),
            "pd": ("Valentín", "Martínez", at(-2500).date(), "Masculino", "Soltero/a", "Estudiante Primaria", "2611112233", "Ciudad", "Mendoza", "5500"),
            "mr": ("O+", "Amoxicilina", "Parto prematuro. Otitis recurrente en etapa escolar."),
            "ph": (22.0, 115, [], "Ninguna", "Colocación de diábolos (2023)", "Sin antecedentes familiares graves.", "Ninguna", False, at(-5).date(), at(-100).date(), "Dra. Ana Soler", "2617778899", "Hospital Notti"),
            "ec": [("Lucía (Madre)", "Madre", "2613330011"), ("Padre", "Padre", "2614440022")],
            "vac": [("BCG", "Dosis única", -2450, None, "Hospital Lagomaggiore", ""), ("Rotavirus", "1ª dosis", -2400, -2370, "Vacunatorio Notti", ""), ("Quíntuple (pentavalente)", "1ª dosis", -2400, -2370, "Vacunatorio Notti", "")]
        },
        # [5] Héctor (Post-operatorio)
        {
            "u": ("Héctor Quinteros", "hector@gmail.com"),
            "p": ("14888999", "OSEP", "Jubilados", "AFI-14888999", "Paso de los Andes 150"),
            "pd": ("Héctor", "Quinteros", at(-24000).date(), "Masculino", "Casado/a", "Jubilado Ferroviario", "2612223344", "Godoy Cruz", "Mendoza", "5501"),
            "mr": ("A+", "Ibuprofeno", "Reemplazo de cadera reciente. Obesidad leve."),
            "ph": (90.0, 170, ["Colesterol alto"], "Ninguna", "Reemplazo cadera derecha (Hace 2 meses), Apendicectomía (1980)", "Padre falleció por IAM.", "Rosuvastatina, Diclofenac", True, at(-1).date(), at(-1000).date(), "Dr. Jorge Medina", "2614443322", "Centro Traumatológico"),
            "ec": [("Marcos (Hijo)", "Hijo/a", "2616665544"), ("Esposa", "Pareja", "2612223344")],
            "vac": [("Antitetánica", "Pre-quirúrgica", -70, 3580, "OSEP Godoy Cruz", ""), ("COVID-19", "3ª dosis", -600, None, "Polideportivo", "")]
        },
        # [6] Carmen (Psiquiátrica)
        {
            "u": ("Carmen López", "carmen@gmail.com"),
            "p": ("22555666", "Medifé", "Plata", "AFI-22555666", "San Juan 1200"),
            "pd": ("Carmen", "López", at(-18000).date(), "Femenino", "Divorciado/a", "Comerciante", "2610009988", "Ciudad", "Mendoza", "5500"),
            "mr": ("O-", "Ninguna", "Trastorno de ansiedad generalizada severo, insomnio crónico."),
            "ph": (65.0, 160, ["Enfermedad cardíaca (Leve)"], "Ninguna", "Cesárea x2", "Madre con depresión.", "Clonazepam, Sertralina", False, at(-15).date(), at(-200).date(), "Dr. Roberto Fernández", "2612221111", "Consultorio Privado"),
            "ec": [("Hermana", "Hermano/a", "2615554433"), ("Hijo Mayor", "Hijo/a", "2613337766")],
            "vac": [("Gripe (antigripal)", "Dosis anual", -100, 265, "Farmacia del Centro", "")]
        },
        # [7] Diego (Cuidador de Marta - TAMBIÉN TIENE TODO COMPLETO)
        {
            "u": ("Diego Silva", "diego@gmail.com"),
            "p": ("28999888", "OSDE", "310", "AFI-28999888", "San Martín 1500, Piso 1"),
            "pd": ("Diego", "Silva", at(-14000).date(), "Masculino", "Casado/a", "Ingeniero", "2619998888", "Guaymallén", "Mendoza", "5519"),
            "mr": ("A+", "Ninguna", "Sano, deportista de fin de semana."),
            "ph": (80.0, 178, [], "Ninguna", "Ninguna", "Madre con hipertensión y diabetes (Marta).", "Vitaminas", False, at(-100).date(), at(-30).date(), "Dra. Laura Torres", "2619988776", "Clínica de Cuyo"),
            "ec": [("Marta (Madre)", "Madre", "2613332211"), ("Esposa", "Pareja", "2614445555")],
            "vac": [("COVID-19", "4ª dosis", -200, None, "Hospital Central", "")]
        },
        # [8] Lucía (Cuidadora de Valentín)
        {
            "u": ("Lucía Martínez", "lucia@gmail.com"),
            "p": ("30111222", "OSDE", "210", "AFI-30111222", "Barrio Dalvian Mza A"),
            "pd": ("Lucía", "Martínez", at(-13000).date(), "Femenino", "Soltero/a", "Arquitecta", "2613330011", "Ciudad", "Mendoza", "5500"),
            "mr": ("O+", "Polvo", "Asma leve en la adolescencia, actualmente sin síntomas."),
            "ph": (62.0, 168, [], "Ninguna", "Ninguna", "Ninguno de relevancia.", "Anticonceptivos orales", True, at(-50).date(), at(-150).date(), "Ginecología Integral", "2610000000", "Hospital Español"),
            "ec": [("Padre de Valentín", "Otro", "2614440022"), ("Amiga íntima", "Amigo/a", "2615556677")],
            "vac": [("Hepatitis B", "Completa", -5000, None, "Centro de Salud", "")]
        },
        # [9] Marcos (Cuidador de Héctor)
        {
            "u": ("Marcos Quinteros", "marcos@gmail.com"),
            "p": ("32555666", "OSEP", "Afiliado Directo", "AFI-32555666", "Paso de los Andes 180"),
            "pd": ("Marcos", "Quinteros", at(-12000).date(), "Masculino", "Unión convivencial", "Empleado de Comercio", "2616665544", "Godoy Cruz", "Mendoza", "5501"),
            "mr": ("A+", "Ninguna", "Colesterol alto por genética familiar."),
            "ph": (85.0, 175, ["Colesterol alto"], "Ninguna", "Ninguna", "Padre con problemas cardíacos.", "Atorvastatina", False, at(-10).date(), at(-200).date(), "Clínica Médica", "2610000000", "OSEP Central"),
            "ec": [("Héctor (Padre)", "Padre", "2612223344"), ("Pareja", "Pareja", "2617778899")],
            "vac": [("Gripe (antigripal)", "Anual", -180, 185, "Vacunatorio OSEP", "")]
        }
    ]

    pat_profiles = {}
    for i, data in enumerate(pats_data):
        nombre, email = data["u"]
        u = User(username=nombre, email=email, password="password123", role="Paciente")
        db.session.add(u)
        db.session.flush()

        dni, os, plan, mem_num, addr = data["p"]
        p = Patient(id_user=u.id_user, dni=dni, health_insurance=os, plan=plan, member_number=mem_num, address=addr)
        db.session.add(p)
        db.session.flush()
        pat_profiles[i] = p

        fn, ln, bd, sx, ms, occ, ph, loc, prov, cp = data["pd"]
        db.session.add(PatientDetails(id_patient=p.id_patient, first_name=fn, last_name=ln, birth_date=bd, sex=sx, marital_status=ms, occupation=occ, phone=ph, locality=loc, province=prov, postal_code=cp))

        bg, allg, ant = data["mr"]
        db.session.add(MedicalRecord(id_patient=p.id_patient, blood_group=bg, allergies=allg, antecedents=ant))

        w, h, cond, intol, sur, fam, c_med, glass, lc, ldc, pdn, pdp, cc = data["ph"]
        db.session.add(PatientHealth(id_patient=p.id_patient, weight_kg=w, height_cm=h, conditions=cond, intolerances=intol, surgeries=sur, family_history=fam, current_medication=c_med, wears_glasses=glass, last_checkup=lc, last_dental_checkup=ldc, primary_doctor_name=pdn, primary_doctor_phone=pdp, care_center=cc))

        for n, rel, phone in data["ec"]:
            db.session.add(EmergencyContact(id_patient=p.id_patient, name=n, relationship_label=rel, phone=phone))

        for vn, dose, d_app, d_next, place, notes in data["vac"]:
            db.session.add(PatientVaccine(id_patient=p.id_patient, name=vn, dose=dose, applied_on=at(d_app).date() if d_app else None, next_dose_on=at(d_next).date() if d_next else None, place=place, notes=notes))
            
    db.session.commit()

    print("🤝 Estableciendo Grupos de Cuidado Avanzados...")
    # Diego -> Marta (Hijo cuidando madre mayor, control total)
    db.session.add(CareMember(id_patient=pat_profiles[1].id_patient, id_user=pat_profiles[7].id_user, relationship="Familiar", status="Activo", can_view_medication=True, can_record_intakes=True, can_view_record=True, accepted_at=at(-100)))
    
    # Lucía -> Valentín (Madre cuidando hijo, control total)
    db.session.add(CareMember(id_patient=pat_profiles[4].id_patient, id_user=pat_profiles[8].id_user, relationship="Familiar", status="Activo", can_view_medication=True, can_record_intakes=True, can_view_record=True, accepted_at=at(-300)))
    
    # Marcos -> Héctor (Hijo cuidando padre post-operatorio, solo ve medicación y registra tomas, no ve ficha clínica)
    db.session.add(CareMember(id_patient=pat_profiles[5].id_patient, id_user=pat_profiles[9].id_user, relationship="Cuidador", status="Activo", can_view_medication=True, can_record_intakes=True, can_view_record=False, accepted_at=at(-60)))
    db.session.commit()

    print("🩺 Generando Historial de Consultas Masivo (Más de 20 consultas)...")
    consultas = []
    
    # 0, 1, 2: Enzo
    consultas.append(MedicalConsultation(id_patient=pat_profiles[0].id_patient, id_doctor=doc_profiles[2].id_doctor, location="Consultorio Traumatología", diagnosis="Esguince de tobillo grado 2"))
    consultas[-1].date = at(-45, 10, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[0].id_patient, id_doctor=doc_profiles[2].id_doctor, location="Consultorio Traumatología", diagnosis="Control de esguince"))
    consultas[-1].date = at(-15, 11, 30)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[0].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Guardia", diagnosis="Faringoamigdalitis purulenta"))
    consultas[-1].date = at(-3, 19, 0)

    # 3, 4, 5, 6: Marta
    consultas.append(MedicalConsultation(id_patient=pat_profiles[1].id_patient, id_doctor=doc_profiles[0].id_doctor, location="Hospital Central", diagnosis="Hipertensión arterial"))
    consultas[-1].date = at(-60, 9, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[1].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Clínica Médica", diagnosis="Diabetes Tipo 2"))
    consultas[-1].date = at(-55, 16, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[1].id_patient, id_doctor=doc_profiles[0].id_doctor, location="Hospital Central", diagnosis="Hipertensión arterial"))
    consultas[-1].date = at(-30, 9, 15)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[1].id_patient, id_doctor=doc_profiles[0].id_doctor, location="Hospital Central", diagnosis="Hipertensión arterial"))
    consultas[-1].date = at(-5, 10, 0)

    # 7, 8, 9, 10: Luis (Asma, recurrencia exacta para alertas)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[2].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Guardia", diagnosis="Crisis asmática moderada"))
    consultas[-1].date = at(-80, 22, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[2].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Guardia", diagnosis="Crisis asmática leve"))
    consultas[-1].date = at(-50, 20, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[2].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Guardia", diagnosis="Crisis asmática moderada"))
    consultas[-1].date = at(-20, 23, 30)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[2].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Consultorio", diagnosis="Control de asma"))
    consultas[-1].date = at(-2, 17, 0)

    # 11, 12, 13, 14: Sofía (Gastritis - Tratamientos finalizados y diagnóstico exacto para la IA)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[3].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Clínica de Cuyo", diagnosis="Gastritis aguda"))
    consultas[-1].date = at(-120, 11, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[3].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Clínica de Cuyo", diagnosis="Control clínico"))
    consultas[-1].date = at(-90, 11, 30)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[3].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Clínica de Cuyo", diagnosis="Gastritis aguda"))
    consultas[-1].date = at(-50, 15, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[3].id_patient, id_doctor=doc_profiles[1].id_doctor, location="Guardia", diagnosis="Gastritis aguda"))
    consultas[-1].date = at(-10, 15, 0)

    # 15, 16, 17: Valentín (Pediátrico)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[4].id_patient, id_doctor=doc_profiles[3].id_doctor, location="Hospital Notti", diagnosis="Otitis media aguda"))
    consultas[-1].date = at(-120, 9, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[4].id_patient, id_doctor=doc_profiles[3].id_doctor, location="Hospital Notti", diagnosis="Otitis media aguda"))
    consultas[-1].date = at(-40, 10, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[4].id_patient, id_doctor=doc_profiles[3].id_doctor, location="Hospital Notti", diagnosis="Control niño sano"))
    consultas[-1].date = at(-5, 11, 0)

    # 18, 19: Héctor (Traumatología)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[5].id_patient, id_doctor=doc_profiles[2].id_doctor, location="Centro Traumatológico", diagnosis="Post-operatorio reemplazo cadera"))
    consultas[-1].date = at(-45, 16, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[5].id_patient, id_doctor=doc_profiles[2].id_doctor, location="Centro Traumatológico", diagnosis="Control post-operatorio"))
    consultas[-1].date = at(-1, 15, 30)

    # 20, 21: Carmen (Psiquiatría)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[6].id_patient, id_doctor=doc_profiles[4].id_doctor, location="Consultorio Privado", diagnosis="Trastorno de ansiedad"))
    consultas[-1].date = at(-150, 18, 0)
    consultas.append(MedicalConsultation(id_patient=pat_profiles[6].id_patient, id_doctor=doc_profiles[4].id_doctor, location="Consultorio Privado", diagnosis="Trastorno de ansiedad"))
    consultas[-1].date = at(-15, 18, 30)

    db.session.add_all(consultas)
    db.session.commit()

    print("💊 Generando Tratamientos y Miles de Tomas...")
    # --- TRATAMIENTOS DE ENZO ---
    t_enzo_1 = Treatment(id_consultation=consultas[0].id_consultation, medication="Ibuprofeno", dose="600mg", frequency_hours=8, duration_days=10)
    db.session.add(t_enzo_1)
    t_enzo_2 = Treatment(id_consultation=consultas[2].id_consultation, medication="Amoxicilina", dose="875mg", frequency_hours=12, duration_days=7)
    db.session.add(t_enzo_2)
    db.session.commit()
    generar_tomas(t_enzo_1, consultas[0].date + timedelta(hours=2), adherencia="media") 
    generar_tomas(t_enzo_2, consultas[2].date + timedelta(hours=2), adherencia="perfecta")

    # --- TRATAMIENTOS DE MARTA (Polimedicada crónica) ---
    t_marta_1 = Treatment(id_consultation=consultas[6].id_consultation, medication="Losartán", dose="100mg", frequency_hours=24, duration_days=90)
    t_marta_2 = Treatment(id_consultation=consultas[4].id_consultation, medication="Metformina", dose="850mg", frequency_hours=12, duration_days=90)
    t_marta_3 = Treatment(id_consultation=consultas[6].id_consultation, medication="Ácido acetilsalicílico (Aspirina)", dose="100mg", frequency_hours=24, duration_days=90)
    db.session.add_all([t_marta_1, t_marta_2, t_marta_3])
    db.session.commit()
    generar_tomas(t_marta_1, at(-5, 8, 0), adherencia="alta")
    generar_tomas(t_marta_2, at(-55, 9, 0), adherencia="alta")
    generar_tomas(t_marta_3, at(-5, 13, 0), adherencia="perfecta")

    # --- TRATAMIENTOS DE LUIS (Rescate y Preventivo) ---
    t_luis_1 = Treatment(id_consultation=consultas[7].id_consultation, medication="Meprednisona", dose="40mg", frequency_hours=24, duration_days=5) 
    t_luis_2 = Treatment(id_consultation=consultas[10].id_consultation, medication="Budesonida", dose="2 paf", frequency_hours=12, duration_days=60) 
    db.session.add_all([t_luis_1, t_luis_2])
    db.session.commit()
    generar_tomas(t_luis_1, consultas[7].date, adherencia="perfecta")
    generar_tomas(t_luis_2, consultas[10].date + timedelta(hours=1), adherencia="media") 

    # --- TRATAMIENTOS DE SOFÍA (IDEALES PARA PROBAR LA IA) ---
    t_sofia_1 = Treatment(id_consultation=consultas[11].id_consultation, medication="Pantoprazol", dose="40mg", frequency_hours=24, duration_days=14)
    t_sofia_2 = Treatment(id_consultation=consultas[13].id_consultation, medication="Omeprazol", dose="20mg", frequency_hours=24, duration_days=21)
    db.session.add_all([t_sofia_1, t_sofia_2])
    db.session.commit()
    generar_tomas(t_sofia_1, consultas[11].date, adherencia="perfecta")
    generar_tomas(t_sofia_2, consultas[13].date, adherencia="baja") 

    # --- TRATAMIENTOS VALENTÍN (Pediátricos) ---
    t_valentin_1 = Treatment(id_consultation=consultas[15].id_consultation, medication="Azitromicina", dose="5ml", frequency_hours=24, duration_days=3)
    t_valentin_2 = Treatment(id_consultation=consultas[16].id_consultation, medication="Amoxicilina + Ácido clavulánico", dose="5ml", frequency_hours=8, duration_days=7)
    db.session.add_all([t_valentin_1, t_valentin_2])
    db.session.commit()
    generar_tomas(t_valentin_1, consultas[15].date, adherencia="perfecta")
    generar_tomas(t_valentin_2, consultas[16].date, adherencia="perfecta")

    # --- TRATAMIENTOS HÉCTOR ---
    t_hector_1 = Treatment(id_consultation=consultas[18].id_consultation, medication="Diclofenac", dose="75mg", frequency_hours=12, duration_days=30)
    t_hector_2 = Treatment(id_consultation=consultas[19].id_consultation, medication="Rosuvastatina", dose="10mg", frequency_hours=24, duration_days=90)
    db.session.add_all([t_hector_1, t_hector_2])
    db.session.commit()
    generar_tomas(t_hector_1, consultas[18].date, adherencia="alta")
    generar_tomas(t_hector_2, consultas[19].date, adherencia="media")

    # --- TRATAMIENTOS CARMEN ---
    t_carmen_1 = Treatment(id_consultation=consultas[20].id_consultation, medication="Sertralina", dose="50mg", frequency_hours=24, duration_days=180)
    t_carmen_2 = Treatment(id_consultation=consultas[21].id_consultation, medication="Clonazepam", dose="0.5mg", frequency_hours=24, duration_days=30, instructions="Solo si no puede dormir.")
    db.session.add_all([t_carmen_1, t_carmen_2])
    db.session.commit()
    generar_tomas(t_carmen_1, consultas[20].date, adherencia="alta")
    generar_tomas(t_carmen_2, consultas[21].date, adherencia="baja") 

    print("📅 Llenando Agenda de Turnos y Notas...")
    appt1 = Appointment(id_patient=pat_profiles[0].id_patient, title="Revisión de rodilla - Kinesiología", scheduled_at=at(2, 16, 0), doctor_name="Lic. Kinesiólogo", location="Centro CIAC", modality="Presencial")
    appt2 = Appointment(id_patient=pat_profiles[0].id_patient, title="Control final antibiótico", scheduled_at=at(4, 10, 0), doctor_name="Dra. Laura Torres", location="Guardia", modality="Presencial")
    appt3 = Appointment(id_patient=pat_profiles[0].id_patient, title="Chequeo cardiológico deportivo", scheduled_at=at(15, 11, 30), doctor_name="Dr. Carlos Mendoza", location="Hospital Central", modality="Presencial")
    db.session.add_all([appt1, appt2, appt3])
    db.session.commit()

    db.session.add(AppointmentNote(id_appointment=appt1.id_appointment, title="Preguntas rodilla", content="Consultar cuándo puedo volver a entrenar normal sin vendaje."))
    db.session.add(AppointmentNote(id_appointment=appt3.id_appointment, title="Estudios previos", content="Llevar el electro del año pasado para comparar."))
    
    appt4 = Appointment(id_patient=pat_profiles[1].id_patient, title="Extracción de sangre", scheduled_at=at(1, 7, 30), location="Laboratorio Central", modality="Presencial")
    appt5 = Appointment(id_patient=pat_profiles[1].id_patient, title="Renovación de recetas PAMI", scheduled_at=at(7, 9, 0), doctor_name="Médico de cabecera", modality="Presencial")
    db.session.add_all([appt4, appt5])
    db.session.commit()
    db.session.add(AppointmentNote(id_appointment=appt4.id_appointment, title="Preparación", content="12 horas de ayuno estricto. Cenar liviano hoy."))

    print("🔔 Generando Notificaciones...")
    notifs = [
        Notification(id_user=pat_profiles[0].id_user, message="Toma omitida", details="Olvidaste registrar la toma de Amoxicilina de hoy a la mañana."),
        Notification(id_user=pat_profiles[0].id_user, message="Nuevo turno agendado", details="Chequeo cardiológico deportivo confirmado."),
        Notification(id_user=pat_profiles[1].id_user, message="Dr. Carlos Mendoza actualizó tu tratamiento.", details="Losartán cambiado a 100mg."),
        Notification(id_user=pat_profiles[1].id_user, message="Tu hijo Diego Silva aceptó la invitación.", details="Ahora Diego puede ayudarte a gestionar tu medicación.")
    ]
    db.session.add_all(notifs)
    db.session.commit()


    # ===============================================================
    # AMPLIACIÓN DE DATOS PARA DEMOSTRACIÓN (casos ficticios)
    # ===============================================================
    print("🧪 Agregando escenarios clínicos adicionales...")
    extras = [
        dict(name="Paula Benítez", email="paula@demo.misalud.test", dni="90001001", birth="1992-04-11", sex="Femenino", city="Maipú", blood="B+", allergies="Ninguna conocida", history="Hipotiroidismo controlado.", conditions=["Hipotiroidismo"], meds="Levotiroxina", doctor=1, diagnosis="Control de hipotiroidismo", medication="Levotiroxina", dose="50 mcg", freq=24, duration=90, start=-12, adherence="alta"),
        dict(name="Ricardo Núñez", email="ricardo@demo.misalud.test", dni="90001002", birth="1958-08-19", sex="Masculino", city="Godoy Cruz", blood="O-", allergies="Ninguna conocida", history="Dislipidemia y seguimiento cardiológico.", conditions=["Colesterol alto"], meds="Atorvastatina", doctor=0, diagnosis="Control de dislipidemia", medication="Atorvastatina", dose="20 mg", freq=24, duration=90, start=-20, adherence="media"),
        dict(name="Natalia Pérez", email="natalia@demo.misalud.test", dni="90001003", birth="1987-12-02", sex="Femenino", city="Guaymallén", blood="A+", allergies="Penicilina", history="Migraña episódica. Alergia medicamentosa registrada.", conditions=["Migraña"], meds="Sin medicación habitual", doctor=1, diagnosis="Seguimiento de migraña episódica", medication="Paracetamol", dose="500 mg", freq=8, duration=3, start=-15, adherence="perfecta"),
        dict(name="Tomás Herrera", email="tomas@demo.misalud.test", dni="90001004", birth="2000-06-23", sex="Masculino", city="Luján de Cuyo", blood="AB+", allergies="Ninguna conocida", history="Esguince de tobillo en rehabilitación.", conditions=[], meds="Ninguna", doctor=2, diagnosis="Control de esguince de tobillo", medication="Paracetamol", dose="500 mg", freq=12, duration=5, start=-2, adherence="media"),
        dict(name="Elena Castro", email="elena@demo.misalud.test", dni="90001005", birth="1949-02-14", sex="Femenino", city="Maipú", blood="A-", allergies="Ninguna conocida", history="Hipertensión arterial. Seguimiento por medicina clínica.", conditions=["Hipertensión"], meds="Losartán", doctor=0, diagnosis="Control de presión arterial", medication="Losartán", dose="50 mg", freq=24, duration=90, start=-8, adherence="baja"),
        dict(name="Gabriel Molina", email="gabriel@demo.misalud.test", dni="90001006", birth="1995-09-30", sex="Masculino", city="San Rafael", blood="O+", allergies="Ácaros", history="Rinitis alérgica estacional.", conditions=["Rinitis alérgica"], meds="Loratadina", doctor=1, diagnosis="Rinitis alérgica estacional", medication="Loratadina", dose="10 mg", freq=24, duration=14, start=-25, adherence="perfecta"),
        dict(name="Florencia Vega", email="florencia@demo.misalud.test", dni="90001007", birth="1998-03-17", sex="Femenino", city="Tunuyán", blood="B-", allergies="Ninguna conocida", history="Controles clínicos preventivos.", conditions=[], meds="Ninguna", doctor=1, diagnosis="Chequeo preventivo general", medication="Paracetamol", dose="500 mg", freq=24, duration=3, start=-35, adherence="alta"),
        dict(name="Pedro Acosta", email="pedro@demo.misalud.test", dni="90001008", birth="1966-11-07", sex="Masculino", city="Las Heras", blood="O+", allergies="Ninguna conocida", history="Diabetes tipo 2 en seguimiento.", conditions=["Diabetes"], meds="Metformina", doctor=1, diagnosis="Control de diabetes tipo 2", medication="Metformina", dose="500 mg", freq=12, duration=90, start=-10, adherence="media"),
    ]

    for index, info in enumerate(extras):
        first, last = info["name"].split(" ", 1)
        user = User(username=info["name"], email=info["email"], password="Demo2026!", role="Paciente")
        db.session.add(user)
        db.session.flush()
        patient = Patient(id_user=user.id_user, dni=info["dni"], health_insurance="OSEP", plan="General", member_number="DEMO-" + info["dni"], address="Domicilio ficticio para demostración")
        db.session.add(patient)
        db.session.flush()
        db.session.add(PatientDetails(id_patient=patient.id_patient, first_name=first, last_name=last, birth_date=datetime.strptime(info["birth"], "%Y-%m-%d").date(), sex=info["sex"], marital_status="Soltero/a", occupation="No especificada", phone="2610000000", locality=info["city"], province="Mendoza", postal_code="5500"))
        db.session.add(MedicalRecord(id_patient=patient.id_patient, blood_group=info["blood"], allergies=info["allergies"], antecedents=info["history"]))
        db.session.add(PatientHealth(id_patient=patient.id_patient, weight_kg=round(60 + index * 3.2, 1), height_cm=160 + index * 2, conditions=info["conditions"], intolerances="No refiere", surgeries="No refiere", family_history="Sin datos de relevancia", current_medication=info["meds"], wears_glasses=index % 2 == 0, last_checkup=at(-30-index*8).date(), last_dental_checkup=at(-120-index*12).date(), primary_doctor_name="Dra. Laura Torres", primary_doctor_phone="2619988776", care_center="Centro de salud de referencia"))
        db.session.add(EmergencyContact(id_patient=patient.id_patient, name="Contacto de emergencia (demo)", relationship_label="Familiar", phone="2610000000"))
        for vaccine, days in [("COVID-19", -450-index*10), ("Gripe (antigripal)", -90-index*5)]:
            db.session.add(PatientVaccine(id_patient=patient.id_patient, name=vaccine, dose="Registro de demostración", applied_on=at(days).date(), place="Vacunatorio (demo)", notes="Dato sintético"))
        db.session.flush()
        doc = doc_profiles[info["doctor"]]
        for offset, diagnosis in [(-95, "Consulta de seguimiento clínico"), (-35, info["diagnosis"]), (-4, info["diagnosis"])]:
            consultation = MedicalConsultation(id_patient=patient.id_patient, id_doctor=doc.id_doctor, location="Consultorio de demostración", diagnosis=diagnosis)
            consultation.date = at(offset, 10 + index % 5)
            db.session.add(consultation)
            db.session.flush()
        treatment = Treatment(id_consultation=consultation.id_consultation, medication=info["medication"], dose=info["dose"], frequency_hours=info["freq"], duration_days=info["duration"], instructions="Tratamiento ficticio para demostración; no constituye indicación médica")
        db.session.add(treatment)
        db.session.flush()
        generar_tomas(treatment, at(info["start"], 9), info["adherence"])
        db.session.add(TreatmentHistory(id_treatment=treatment.id_treatment, changes_details="Tratamiento registrado en el entorno de demostración"))
        for days, title in [(-12, "Control anterior"), (3 + index, "Próximo control"), (20 + index, "Seguimiento")]:
            appointment = Appointment(id_patient=patient.id_patient, title=title, scheduled_at=at(days, 9 + index % 7), doctor_name="Profesional de referencia", location="Consultorio (demo)", modality="Virtual" if index % 3 == 0 else "Presencial")
            db.session.add(appointment)
            db.session.flush()
            db.session.add(AppointmentNote(id_appointment=appointment.id_appointment, title="Recordatorio personal", content="Llevar estudios y consultar evolución de síntomas."))
        db.session.add(Notification(id_user=user.id_user, message="Bienvenido a MiSalud+", details="Tu perfil de demostración tiene datos clínicos, turnos y tratamientos cargados."))
        db.session.add(Notification(id_user=user.id_user, message="Recordatorio de próximo control", details="Revisá tu agenda para consultar el próximo turno."))

    # Agregar datos faltantes a pacientes originales sin duplicar fichas.
    for i, patient in pat_profiles.items():
        db.session.add(Notification(id_user=patient.id_user, message="Resumen de salud disponible", details="Consultá tu historial clínico y tus tratamientos en MiSalud+."))
        appointment = Appointment(id_patient=patient.id_patient, title="Control de seguimiento", scheduled_at=at(8+i, 10+i%6), doctor_name="Profesional de referencia", location="Centro médico (demo)", modality="Presencial")
        db.session.add(appointment)
        db.session.flush()
        db.session.add(AppointmentNote(id_appointment=appointment.id_appointment, title="Temas para consultar", content="Revisar medicación actual, estudios pendientes y evolución."))
    db.session.commit()
    print(f"📊 Total de pacientes: {Patient.query.count()}")
    print(f"📊 Consultas: {MedicalConsultation.query.count()}")
    print(f"📊 Tratamientos: {Treatment.query.count()}")
    print(f"📊 Tomas: {MedicationIntake.query.count()}")
    print(f"📊 Turnos: {Appointment.query.count()}")
    print("🔑 Nuevos pacientes: correo @demo.misalud.test / contraseña Demo2026!")

    print("✅ ¡BASE DE DATOS DE DEMOSTRACIÓN LISTA!")