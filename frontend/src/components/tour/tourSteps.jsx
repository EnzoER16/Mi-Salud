import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import { Box, Typography } from '@mui/material';

// Recorrido guiado. Cada paso puede tener:
//  - target:  valor de data-tour del elemento real que se resalta (si falta, el paso se muestra en el centro)
//  - try:     { hint, demo } → el usuario puede "probar" tocando el elemento resaltado. Ese toque NO hace la
//             acción de verdad (no navega ni abre nada): muestra una vista previa de lo que pasaría.
//  - passThrough: el elemento resaltado se puede usar de verdad mientras dura el paso (ej. escribir un DNI)
//  - mock:    dibujito explicativo para pasos que hablan de pantallas que todavía no están a la vista
// Los textos son cortos y sin términos técnicos a propósito, para que los entienda cualquier persona.

// ---- Mini vistas previas ----
const Row = ({ icon, title, sub, color = 'primary.main' }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider', textAlign: 'left' }}>
        <Box sx={{ color, display: 'grid', placeItems: 'center', fontSize: 22 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.25 }}>{title}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
    </Box>
);

const Stack = ({ children }) => <Box sx={{ display: 'grid', gap: 1, width: '100%' }}>{children}</Box>;

const Pill = ({ children, tone = '#E6F5F7', color = '#0A6F80' }) => (
    <Box component="span" sx={{ px: 1.25, py: 0.35, borderRadius: 5, bgcolor: tone, color, fontSize: '0.78rem', fontWeight: 700 }}>{children}</Box>
);

const mocks = {
    ficha: (
        <Stack>
            <Row icon={<AssignmentOutlinedIcon fontSize="inherit" />} title="Ficha del paciente" sub="Grupo sanguíneo · Alergias · Antecedentes" />
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                <Pill>0 +</Pill><Pill tone="#FFF4DD" color="#9A6200">Alergia: penicilina</Pill><Pill tone="#E8F1FD" color="#1A5FB4">Vacunas al día</Pill>
            </Box>
        </Stack>
    ),
    consulta: (
        <Stack>
            <Row icon={<NoteAddOutlinedIcon fontSize="inherit" />} title="Registrar nueva consulta" sub="Diagnóstico + lugar de atención" />
            <Row icon={<MedicationOutlinedIcon fontSize="inherit" />} title="Ibuprofeno 400 mg" sub="Cada 8 hs · durante 5 días" color="success.main" />
        </Stack>
    ),
    tratamiento: (
        <Stack>
            <Row icon={<EditNoteOutlinedIcon fontSize="inherit" />} title="Dosis cambiada de 400 mg a 600 mg" sub="Queda en el historial de cambios" />
            <Row icon={<NotificationsNoneRoundedIcon fontSize="inherit" />} title="El paciente recibe un aviso" sub="Y sus recordatorios se actualizan" color="warning.main" />
        </Stack>
    ),
};

export const PATIENT_STEPS = [
    {
        icon: <FavoriteBorderRoundedIcon fontSize="inherit" />, tone: 'teal',
        title: '¡Gracias por completar tus datos!',
        text: 'Ahora sí, te mostramos en un minuto cómo se usa MiSalud+. Vamos a ir marcando las partes reales de la pantalla. Podés omitir el recorrido cuando quieras y volver a verlo con el botón «?».',
    },
    {
        target: 'qr', icon: <QrCode2RoundedIcon fontSize="inherit" />, tone: 'blue',
        title: 'Tu credencial de salud',
        text: 'Este es tu código QR. Mostráselo al médico y podrá ver tu ficha sin que tengas que explicar todo de nuevo.',
        try: {
            hint: 'Probá tocar el código QR',
            demo: <Row icon={<AssignmentOutlinedIcon fontSize="inherit" />} title="El médico lo escanea…" sub="…y ve tu ficha médica al instante" />,
        },
    },
    {
        target: 'meds', icon: <MedicationOutlinedIcon fontSize="inherit" />, tone: 'green',
        title: 'Tu medicación de hoy',
        text: 'Cuando un médico te receta un tratamiento, acá ves qué tenés que tomar y a qué hora. Apretá «Marcar tomado» cada vez que tomes una dosis.',
    },
    {
        target: 'bell', icon: <NotificationsNoneRoundedIcon fontSize="inherit" />, tone: 'amber',
        title: 'Avisos de tu médico',
        text: 'La campanita te avisa cuando un médico te agrega o cambia un tratamiento. Si tiene un número rojo, tenés algo nuevo para leer.',
        try: {
            hint: 'Probá tocar la campanita',
            demo: <Row icon={<NotificationsNoneRoundedIcon fontSize="inherit" />} title="Dr. Pérez te recetó un nuevo tratamiento" sub="Ibuprofeno · cada 8 hs durante 5 días" color="warning.main" />,
        },
    },
    {
        target: 'nav-turnos', icon: <CalendarMonthOutlinedIcon fontSize="inherit" />, tone: 'teal',
        title: 'Mis turnos',
        text: 'Guardá tus turnos y, en cada uno, tus estudios, fotos, documentos y notas. Así los tenés siempre a mano.',
        try: {
            hint: 'Probá tocar «Mis turnos»',
            demo: <Row icon={<CalendarMonthOutlinedIcon fontSize="inherit" />} title="Turno con Cardiología" sub="2 archivos · 1 nota" />,
        },
    },
    {
        target: 'user-menu', icon: <ManageAccountsOutlinedIcon fontSize="inherit" />, tone: 'blue',
        title: 'Tus datos, ficha y vacunas',
        text: 'Desde tu nombre completás tus datos personales (con contactos de emergencia), tu ficha médica y tus vacunas. Cuanto más completo, mejor te atienden.',
        try: {
            hint: 'Probá tocar tu nombre',
            demo: (
                <Stack>
                    <Row icon={<ManageAccountsOutlinedIcon fontSize="inherit" />} title="Datos personales" />
                    <Row icon={<AssignmentOutlinedIcon fontSize="inherit" />} title="Mi ficha médica" />
                    <Row icon={<VaccinesOutlinedIcon fontSize="inherit" />} title="Mis vacunas" />
                </Stack>
            ),
        },
    },
    {
        icon: <CheckCircleOutlineRoundedIcon fontSize="inherit" />, tone: 'green',
        title: '¡Listo, ya podés empezar!',
        text: 'Si necesitás repasar algo, tocá el botón «?» de arriba o elegí «Ver tutorial» en el menú de tu nombre.',
    },
];

export const DOCTOR_STEPS = [
    {
        icon: <FavoriteBorderRoundedIcon fontSize="inherit" />, tone: 'teal',
        title: '¡Gracias por completar tus datos!',
        text: 'Ahora sí, te mostramos en un minuto cómo se usa MiSalud+. Vamos a ir marcando las partes reales de la pantalla. Podés omitir el recorrido cuando quieras y volver a verlo con el botón «?».',
    },
    {
        target: 'doctor-search', passThrough: true, icon: <PersonSearchOutlinedIcon fontSize="inherit" />, tone: 'blue',
        title: 'Buscar un paciente',
        text: 'Escribí el DNI del paciente o escaneá su código QR (lo tiene en su inicio). Se abre su ficha al instante. Podés probarlo ahora mismo.',
    },
    {
        icon: <AssignmentOutlinedIcon fontSize="inherit" />, tone: 'amber', mock: 'ficha',
        title: 'La ficha del paciente',
        text: 'Debajo de la búsqueda ves su grupo sanguíneo, alergias y antecedentes. Si el paciente los completó, también sus enfermedades, medicación, contactos de emergencia y vacunas.',
    },
    {
        icon: <NoteAddOutlinedIcon fontSize="inherit" />, tone: 'green', mock: 'consulta',
        title: 'Registrar una consulta y recetar',
        text: 'Al final de la ficha tocá «Registrar nueva consulta», escribí el diagnóstico y agregá los medicamentos (podés elegirlos de una lista). El paciente recibe un aviso y sus recordatorios.',
    },
    {
        icon: <EditNoteOutlinedIcon fontSize="inherit" />, tone: 'teal', mock: 'tratamiento',
        title: 'Cambiar un tratamiento',
        text: 'En «Tratamientos» de la ficha podés editar las indicaciones. Queda un historial de cambios y el paciente recibe un aviso.',
    },
    {
        target: 'doctor-history', icon: <HistoryRoundedIcon fontSize="inherit" />, tone: 'blue',
        title: 'Tu historial de consultas',
        text: 'Todas las consultas que registraste quedan en esta lista, con fecha, lugar y diagnóstico.',
    },
    {
        target: 'user-menu', icon: <ManageAccountsOutlinedIcon fontSize="inherit" />, tone: 'amber',
        title: 'Tus datos',
        text: 'Desde tu nombre completás tus datos personales y profesionales: especialidad, matrícula, lugar y horarios de atención.',
        try: {
            hint: 'Probá tocar tu nombre',
            demo: (
                <Stack>
                    <Row icon={<ManageAccountsOutlinedIcon fontSize="inherit" />} title="Datos personales" />
                    <Row icon={<AssignmentOutlinedIcon fontSize="inherit" />} title="Datos profesionales" />
                </Stack>
            ),
        },
    },
    {
        icon: <CheckCircleOutlineRoundedIcon fontSize="inherit" />, tone: 'green',
        title: '¡Listo, ya podés empezar!',
        text: 'Si necesitás repasar algo, tocá el botón «?» de arriba o elegí «Ver tutorial» en el menú de tu nombre.',
    },
];

export const getMock = (name) => mocks[name] || null;
