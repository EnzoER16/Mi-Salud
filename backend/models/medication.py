from config.settings import db
import uuid


class Medication(db.Model):
    """Catálogo de medicamentos que el médico puede elegir al recetar."""
    __tablename__ = "medications"

    id_medication = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(50), nullable=False)

    def __init__(self, name, category):
        self.name = name
        self.category = category

    def to_json(self):
        return {
            "id_medication": self.id_medication,
            "name": self.name,
            "category": self.category}


# Catálogo inicial (nombres genéricos de uso frecuente).
# Para agregar más medicamentos, sumalos acá y reiniciá el backend: solo se cargan los que faltan.
CATALOG = {
    "Analgésicos y antiinflamatorios": [
        "Paracetamol", "Ibuprofeno", "Diclofenac", "Naproxeno", "Ketorolac",
        "Ácido acetilsalicílico (Aspirina)",
    ],
    "Antibióticos": [
        "Amoxicilina", "Amoxicilina + Ácido clavulánico", "Azitromicina", "Cefalexina",
        "Ciprofloxacina", "Claritromicina", "Levofloxacina", "Metronidazol",
        "Trimetoprima + Sulfametoxazol",
    ],
    "Cardiovasculares": [
        "Losartán", "Enalapril", "Amlodipina", "Atenolol", "Bisoprolol", "Carvedilol",
        "Hidroclorotiazida", "Furosemida", "Espironolactona", "Atorvastatina",
        "Rosuvastatina", "Simvastatina", "Clopidogrel",
    ],
    "Digestivos": [
        "Omeprazol", "Pantoprazol", "Domperidona", "Ondansetrón", "Loperamida",
    ],
    "Antidiabéticos": [
        "Metformina", "Glibenclamida", "Glimepirida", "Sitagliptina",
    ],
    "Respiratorios y antialérgicos": [
        "Salbutamol", "Budesonida", "Montelukast", "Ambroxol",
        "Loratadina", "Cetirizina", "Desloratadina",
    ],
    "Corticoides": [
        "Prednisona", "Dexametasona", "Betametasona", "Hidrocortisona",
    ],
    "Neurológicos y salud mental": [
        "Sertralina", "Escitalopram", "Clonazepam", "Alprazolam", "Carbamazepina",
    ],
    "Hormonas, vitaminas y suplementos": [
        "Levotiroxina", "Ácido fólico", "Colecalciferol (Vitamina D)",
    ],
}


def seed_medications():
    """Carga el catálogo. Es seguro llamarla muchas veces: solo agrega los que faltan."""
    existing = {m.name for m in Medication.query.all()}
    missing = [
        Medication(name, category)
        for category, names in CATALOG.items()
        for name in names
        if name not in existing
    ]
    if missing:
        db.session.add_all(missing)
        db.session.commit()
