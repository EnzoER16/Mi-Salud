// Helpers para las pantallas de datos personales, ficha médica y vacunas.
// El backend manda las fechas "solo día" como AAAA-MM-DD: se interpretan como fecha local
// (si se usara new Date("2026-03-10") directamente, en Argentina se mostraría el día anterior).

export const parseDay = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// "10 mar 2026"
export const formatDay = (iso) => {
    const date = parseDay(iso);
    if (!date) return '';
    const month = date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
    return `${date.getDate()} ${month} ${date.getFullYear()}`;
};

// Fecha de hoy como AAAA-MM-DD en hora local (para el atributo max de los <input type="date">)
export const todayInput = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const ageFromDay = (iso) => {
    const birth = parseDay(iso);
    if (!birth) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
    return age >= 0 ? age : null;
};

// Índice de masa corporal y su lectura en palabras
export const bmiValue = (weightKg, heightCm) => {
    const w = parseFloat(String(weightKg).replace(',', '.'));
    const h = parseFloat(heightCm);
    if (!w || !h) return null;
    return Math.round((w / ((h / 100) ** 2)) * 10) / 10;
};

export const bmiLabel = (bmi) => {
    if (bmi === null || bmi === undefined) return '';
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
};

// null/undefined -> '' para los inputs controlados
export const str = (value) => (value === null || value === undefined ? '' : String(value));

// Datos del formulario -> payload (los vacíos se mandan como null para que el backend los borre)
export const orNullValue = (value) => {
    const text = typeof value === 'string' ? value.trim() : value;
    return text === '' ? null : text;
};

export const SEX_OPTIONS = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo'];
export const MARITAL_OPTIONS = ['Soltero/a', 'Casado/a', 'Unión convivencial', 'Divorciado/a', 'Viudo/a'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido'];
export const RELATIONSHIPS = ['Madre', 'Padre', 'Pareja', 'Hijo/a', 'Hermano/a', 'Amigo/a', 'Otro'];

export const CONDITIONS = [
    'Diabetes', 'Hipertensión', 'Asma', 'Enfermedad cardíaca', 'EPOC', 'Epilepsia',
    'Enfermedad renal crónica', 'Problemas de tiroides', 'Celiaquía', 'Colesterol alto', 'Cáncer',
];

// Vacunas más comunes del Calendario Nacional de Vacunación de Argentina (se puede escribir cualquier otra)
export const VACCINE_CATALOG = [
    'BCG', 'Hepatitis B', 'Rotavirus', 'Neumococo conjugada', 'Quíntuple (pentavalente)', 'Polio (IPV)',
    'Triple viral (sarampión, rubéola y paperas)', 'Hepatitis A', 'Varicela', 'Triple bacteriana celular (DPT)',
    'Triple bacteriana acelular (dTpa)', 'Doble bacteriana (dT)', 'Meningococo', 'VPH', 'Fiebre amarilla',
    'Fiebre hemorrágica argentina', 'Gripe (antigripal)', 'COVID-19', 'Antitetánica', 'VSR', 'Herpes zóster',
];
export const DOSE_OPTIONS = ['Dosis única', '1ª dosis', '2ª dosis', '3ª dosis', 'Refuerzo', 'Dosis anual'];
