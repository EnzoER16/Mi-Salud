import { useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, Chip, Tabs, Tab, IconButton, Tooltip, Alert, CircularProgress,
    Snackbar, Breadcrumbs, Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { AuthContext } from '../context/AuthContext';
import { getAppointments, getAppointment, deleteAppointment } from '../services/api';
import PageHeader from '../components/PageHeader';
import SectionTitle from '../components/SectionTitle';
import IconBadge from '../components/IconBadge';
import AppointmentList from '../components/appointments/AppointmentList';
import AppointmentFiles from '../components/appointments/AppointmentFiles';
import AppointmentNotes from '../components/appointments/AppointmentNotes';
import AppointmentFormDialog from '../components/appointments/AppointmentFormDialog';
import FilePreviewDialog from '../components/appointments/FilePreviewDialog';
import ConfirmDialog from '../components/appointments/ConfirmDialog';
import {
    formatLongDateTime, formatFullDateTime, monthBadge, dayBadge, appointmentSubtitle,
} from '../components/appointments/format';
import { colors, cardSx } from '../theme';

import { APPOINTMENTS_NAME } from '../constants/sections';
// Elige qué turno mostrar: el que se pidió, o si no el próximo, o si no el más reciente
const pickSelection = (appointments, wantedId, now) => {
    if (wantedId && appointments.some((a) => a.id_appointment === wantedId)) return wantedId;
    const sorted = [...appointments].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const next = sorted.find((a) => new Date(a.scheduled_at).getTime() >= now);
    if (next) return next.id_appointment;
    return sorted.length ? sorted[sorted.length - 1].id_appointment : null;
};

const CountLabel = ({ text, count }) => (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        {text}
        <Box component="span" sx={{ px: 0.75, borderRadius: 1, bgcolor: 'primary.light', color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>
            {count}
        </Box>
    </Box>
);

const Appointments = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailError, setDetailError] = useState('');
    const [tab, setTab] = useState(0);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);       // turno en edición (null = turno nuevo)
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [preview, setPreview] = useState(null);
    const [feedback, setFeedback] = useState('');

    const detailRef = useRef(null);
    const requestId = useRef(0);

    const isPatient = user?.role === 'Paciente';

    // Turnos separados en próximos (el más cercano primero) y anteriores (el más reciente primero)
    const { upcoming, past } = useMemo(() => {
        const now = Date.now();
        const sorted = [...appointments].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
        return {
            upcoming: sorted.filter((a) => new Date(a.scheduled_at).getTime() >= now),
            past: sorted.filter((a) => new Date(a.scheduled_at).getTime() < now).reverse(),
        };
    }, [appointments]);

    const selected = appointments.find((a) => a.id_appointment === selectedId) || null;
    const nextAppointment = upcoming[0] || null;

    // ---- Carga de la lista ----
    useEffect(() => {
        if (!isPatient) return;
        getAppointments()
            .then((data) => {
                setAppointments(data);
                setSelectedId(pickSelection(data, null, Date.now()));
            })
            .catch((err) => setLoadError(err.message))
            .finally(() => setLoading(false));
    }, [isPatient]);

    // ---- Carga del detalle (archivos y notas) del turno elegido ----
    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            return;
        }
        const currentRequest = ++requestId.current;
        setDetail(null);
        setDetailError('');
        getAppointment(selectedId)
            .then((data) => { if (currentRequest === requestId.current) setDetail(data); })
            .catch((err) => { if (currentRequest === requestId.current) setDetailError(err.message); });
    }, [selectedId]);

    // Vuelve a pedir el turno elegido (sin spinner) y actualiza los contadores de la lista
    const refreshDetail = useCallback(async () => {
        if (!selectedId) return;
        try {
            const data = await getAppointment(selectedId);
            setDetail(data);
            setAppointments((list) => list.map((a) => (
                a.id_appointment === data.id_appointment
                    ? { ...a, file_count: data.file_count, note_count: data.note_count }
                    : a
            )));
        } catch (err) {
            setDetailError(err.message);
        }
    }, [selectedId]);

    if (user && !isPatient) return <Navigate to="/dashboard" replace />;

    const handleSelect = (id) => {
        if (id === selectedId) return;
        setSelectedId(id);
        setTab(0);
        // En pantallas chicas la lista está arriba del detalle: bajamos al detalle
        if (window.matchMedia?.('(max-width: 899px)').matches) {
            detailRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        }
    };

    const openNew = () => { setEditing(null); setFormOpen(true); };
    const openEdit = () => { setEditing(selected); setFormOpen(true); };

    const handleSaved = (saved) => {
        setFormOpen(false);
        setAppointments((list) => {
            const exists = list.some((a) => a.id_appointment === saved.id_appointment);
            return exists
                ? list.map((a) => (a.id_appointment === saved.id_appointment ? saved : a))
                : [...list, saved];
        });
        setSelectedId(saved.id_appointment);
        setDetail(saved);
        if (!editing) setTab(0);
        setFeedback(editing ? 'Turno actualizado.' : 'Turno guardado.');
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteAppointment(selected.id_appointment);
            const remaining = appointments.filter((a) => a.id_appointment !== selected.id_appointment);
            setAppointments(remaining);
            setSelectedId(pickSelection(remaining, null, Date.now()));
            setConfirmDelete(false);
            setFeedback('Turno eliminado.');
        } catch (err) {
            setConfirmDelete(false);
            setDetailError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Breadcrumbs aria-label="Ubicación" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                <MuiLink component={RouterLink} to="/dashboard" underline="hover" color="text.secondary">Inicio</MuiLink>
                <Typography sx={{ fontSize: '0.8rem', color: colors.teal, fontWeight: 600 }}>{APPOINTMENTS_NAME}</Typography>
            </Breadcrumbs>

            <PageHeader
                title={APPOINTMENTS_NAME}
                subtitle="Tus visitas y la documentación que querés llevar, en un mismo lugar."
                action={
                    <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNew}>
                        Nuevo turno
                    </Button>
                }
            />

            {loadError && (
                <Alert
                    severity="warning"
                    sx={{ mb: 3 }}
                    action={loadError.includes('Perfil de paciente') && (
                        <Button color="inherit" size="small" onClick={() => navigate('/complete-profile')}>Completar perfil</Button>
                    )}
                >
                    {loadError}
                </Alert>
            )}

            {!loadError && appointments.length === 0 && (
                <Paper elevation={0} sx={{ ...cardSx, p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <IconBadge tone="teal" size={56}><EventAvailableOutlinedIcon fontSize="large" /></IconBadge>
                    </Box>
                    <Typography variant="h6">Todavía no cargaste turnos</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mt: 0.5, mb: 3 }}>
                        Agendá tus visitas y guardá en cada una tus estudios, órdenes, fotos y notas, para tenerlos siempre a mano.
                    </Typography>
                    <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNew}>Agregar mi primer turno</Button>
                </Paper>
            )}

            {appointments.length > 0 && (
                <>
                    {/* ===== Próximo turno ===== */}
                    <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, sm: 2.5 }, mb: 3, display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                        {nextAppointment ? (
                            <>
                                <Box sx={{ width: 64, py: 1, textAlign: 'center', borderRadius: 3, bgcolor: 'primary.light', color: colors.teal, flexShrink: 0 }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', lineHeight: 1 }}>
                                        {monthBadge(nextAppointment.scheduled_at)}
                                    </Typography>
                                    <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.1 }}>
                                        {dayBadge(nextAppointment.scheduled_at)}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 220 }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: colors.teal, textTransform: 'uppercase' }}>
                                        Tu próximo turno
                                    </Typography>
                                    <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
                                        {formatLongDateTime(nextAppointment.scheduled_at)} · {nextAppointment.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {appointmentSubtitle(nextAppointment)}
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <>
                                <IconBadge tone="amber" size={52}><CalendarMonthOutlinedIcon /></IconBadge>
                                <Box sx={{ flex: 1, minWidth: 220 }}>
                                    <Typography variant="h6">No tenés turnos próximos</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Agendá tu próxima visita para preparar con tiempo tus archivos y notas.
                                    </Typography>
                                </Box>
                                <Button variant="outlined" onClick={openNew}>Agendar turno</Button>
                            </>
                        )}
                    </Paper>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
                        {/* ===== Lista ===== */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <SectionTitle>Tus turnos</SectionTitle>
                                <Typography variant="caption" color="text.secondary">
                                    {appointments.length === 1 ? '1 turno' : `${appointments.length} turnos`}
                                </Typography>
                            </Box>
                            <AppointmentList upcoming={upcoming} past={past} selectedId={selectedId} onSelect={handleSelect} />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Elegí un turno para ver o agregar su documentación.
                            </Typography>
                        </Box>

                        {/* ===== Detalle ===== */}
                        <Paper ref={detailRef} elevation={0} sx={{ ...cardSx, scrollMarginTop: 96, overflow: 'hidden' }}>
                            {selected && (
                                <>
                                    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: colors.teal, textTransform: 'uppercase' }}>
                                                Turno seleccionado
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: -0.5 }}>
                                                <Chip size="small" label={selected.modality} />
                                                <Tooltip title="Editar turno">
                                                    <IconButton size="small" aria-label="Editar turno" onClick={openEdit}>
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar turno">
                                                    <IconButton size="small" aria-label="Eliminar turno" onClick={() => setConfirmDelete(true)}>
                                                        <DeleteOutlineOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                        <Typography variant="h5" sx={{ mt: 0.5 }}>{selected.title}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'text.secondary' }}>
                                            <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: colors.teal }} />
                                            <Typography variant="body2">{formatFullDateTime(selected.scheduled_at)}</Typography>
                                        </Box>
                                        {(selected.doctor_name || selected.location) && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, color: 'text.secondary' }}>
                                                <PersonOutlineIcon sx={{ fontSize: 18, color: colors.teal }} />
                                                <Typography variant="body2">
                                                    {[selected.doctor_name, selected.location].filter(Boolean).join(' · ')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Tabs
                                        value={tab}
                                        onChange={(e, value) => setTab(value)}
                                        sx={{ px: { xs: 1, sm: 2 }, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', minHeight: 44 }}
                                    >
                                        <Tab sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }}
                                            label={<CountLabel text="Archivos y fotos" count={selected.file_count} />} />
                                        <Tab sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }}
                                            label={<CountLabel text="Revisiones y notas" count={selected.note_count} />} />
                                    </Tabs>

                                    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                                        {detailError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDetailError('')}>{detailError}</Alert>}
                                        {!detail || detail.id_appointment !== selected.id_appointment ? (
                                            !detailError && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
                                        ) : tab === 0 ? (
                                            <AppointmentFiles
                                                appointment={detail}
                                                onChanged={refreshDetail}
                                                onFeedback={setFeedback}
                                                onPreview={setPreview}
                                            />
                                        ) : (
                                            <AppointmentNotes appointment={detail} onChanged={refreshDetail} onFeedback={setFeedback} />
                                        )}
                                    </Box>
                                </>
                            )}
                        </Paper>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, color: 'text.secondary' }}>
                        <LockOutlinedIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption">
                            Tus turnos, archivos y notas son privados: solo vos podés verlos.
                        </Typography>
                    </Box>
                </>
            )}

            <AppointmentFormDialog open={formOpen} appointment={editing} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

            <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />

            <ConfirmDialog
                open={confirmDelete}
                title="¿Eliminar este turno?"
                message="Se van a eliminar también sus archivos y notas. Esta acción no se puede deshacer."
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => setConfirmDelete(false)}
            />

            <Snackbar
                open={Boolean(feedback)}
                autoHideDuration={3500}
                onClose={() => setFeedback('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled" onClose={() => setFeedback('')} sx={{ width: '100%' }}>
                    {feedback}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Appointments;
