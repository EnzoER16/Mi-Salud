// Helpers de formato para la sección "Mis turnos".
// El backend manda las fechas en UTC con "Z"; el navegador las muestra en hora local.

export const MAX_FILE_MB = 10;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
export const ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export const parseDate = (iso) => new Date(iso);

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const time = (date) =>
    date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

// "22 oct 2026"
export const formatShortDate = (iso) => {
    const date = parseDate(iso);
    const month = date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
    return `${date.getDate()} ${month} ${date.getFullYear()}`;
};

// "22 oct 2026 · 10:30 hs"
export const formatShortDateTime = (iso) => `${formatShortDate(iso)} · ${time(parseDate(iso))} hs`;

// "Jueves 22 de octubre · 10:30 hs"
export const formatLongDateTime = (iso) => {
    const date = parseDate(iso);
    const weekday = capitalize(date.toLocaleDateString('es-AR', { weekday: 'long' }));
    const month = date.toLocaleDateString('es-AR', { month: 'long' });
    return `${weekday} ${date.getDate()} de ${month} · ${time(date)} hs`;
};

// "22 de octubre de 2026 · 10:30 hs"
export const formatFullDateTime = (iso) => {
    const date = parseDate(iso);
    const month = date.toLocaleDateString('es-AR', { month: 'long' });
    return `${date.getDate()} de ${month} de ${date.getFullYear()} · ${time(date)} hs`;
};

export const monthBadge = (iso) =>
    parseDate(iso).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase();

export const dayBadge = (iso) => parseDate(iso).getDate();

// "1,2 MB", "480 KB"
export const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export const fileKind = (mimeType) => (mimeType === 'application/pdf' ? 'PDF' : mimeType === 'image/png' ? 'PNG' : 'JPG');

export const pluralFiles = (n) => (n === 0 ? 'Sin archivos' : n === 1 ? '1 archivo' : `${n} archivos`);

// "Dr. Juan Pérez · Consultorio 1 · Presencial" (se omiten los datos que falten)
export const appointmentSubtitle = (appointment) =>
    [appointment.doctor_name, appointment.location, appointment.modality].filter(Boolean).join(' · ');

// Valor para <input type="datetime-local"> en hora local: "2026-10-22T10:30"
export const toLocalInputValue = (iso) => {
    const date = parseDate(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Valida un archivo antes de subirlo. Devuelve un mensaje de error o null si está bien.
export const validateFile = (file) => {
    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (!ACCEPTED_EXTENSIONS.includes(extension)) return 'Formato no permitido. Solo PDF, JPG o PNG.';
    if (file.size === 0) return 'El archivo está vacío.';
    if (file.size > MAX_FILE_BYTES) return `Supera el máximo de ${MAX_FILE_MB} MB.`;
    return null;
};
