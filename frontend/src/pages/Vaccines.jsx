import { useState, useEffect, useContext, useMemo } from 'react';
import {
    Box, Paper, Typography, Button, Chip, IconButton, Tooltip, Alert, CircularProgress, Snackbar, Breadcrumbs, Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { AuthContext } from '../context/AuthContext';
import { getProfile, getVaccines, deleteVaccine } from '../services/api';
import PageHeader from '../components/PageHeader';
import IconBadge from '../components/IconBadge';
import ConfirmDialog from '../components/appointments/ConfirmDialog';
import VaccineFormDialog from '../components/vaccines/VaccineFormDialog';
import { formatDay, parseDay, todayInput, VACCINE_CATALOG } from '../components/profile/format';
import { cardSx } from '../theme';

const QUICK_PICKS = ['Gripe (antigripal)', 'COVID-19', 'Hepatitis B', 'Antitetánica', 'Triple viral (sarampión, rubéola y paperas)'];
const DAY_MS = 24 * 60 * 60 * 1000;

// Estado de una "próxima dosis": vencida, próxima (30 días) o más adelante
const nextDoseStatus = (iso) => {
    const days = Math.round((parseDay(iso) - parseDay(todayInput())) / DAY_MS);
    if (days < 0) return { label: `Vencida hace ${-days} ${-days === 1 ? 'día' : 'días'}`, tone: 'overdue' };
    if (days === 0) return { label: 'Es hoy', tone: 'soon' };
    if (days <= 30) return { label: `En ${days} ${days === 1 ? 'día' : 'días'}`, tone: 'soon' };
    return { label: formatDay(iso), tone: 'later' };
};

const TONES = {
    overdue: { bg: '#FDECEC', fg: '#B3261E' },
    soon: { bg: '#FFF4E0', fg: '#B26A00' },
    later: { bg: '#E6F5F7', fg: '#0A6F80' },
};

const Vaccines = () => {
    const { user } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [needsProfile, setNeedsProfile] = useState(false);
    const [vaccines, setVaccines] = useState([]);
    const [feedback, setFeedback] = useState('');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [initialName, setInitialName] = useState('');
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const isPatient = user?.role === 'Paciente';

    useEffect(() => {
        if (!isPatient) return;
        const load = async () => {
            try {
                const profile = await getProfile('Paciente');
                if (!profile) return setNeedsProfile(true);
                setVaccines(await getVaccines());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isPatient]);

    // Dosis pendientes: tienen fecha de próxima dosis y no hay una aplicación posterior de la misma vacuna
    const upcoming = useMemo(() => vaccines
        .filter((v) => v.next_dose_on)
        .filter((v) => !vaccines.some((o) => o.id_vaccine !== v.id_vaccine && o.name === v.name && o.applied_on && o.applied_on >= v.next_dose_on))
        .sort((a, b) => a.next_dose_on.localeCompare(b.next_dose_on)), [vaccines]);

    if (user && !isPatient) return <Navigate to="/dashboard" replace />;

    const openNew = (name = '') => { setEditing(null); setInitialName(name); setDialogOpen(true); };
    const openEdit = (vaccine) => { setEditing(vaccine); setInitialName(''); setDialogOpen(true); };

    const reload = async () => setVaccines(await getVaccines());   // el backend devuelve la lista ya ordenada

    const handleSaved = async (_saved, wasEdit) => {
        setDialogOpen(false);
        setFeedback(wasEdit ? 'Vacuna actualizada.' : 'Vacuna agregada.');
        try { await reload(); } catch (err) { setError(err.message); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteVaccine(toDelete.id_vaccine);
            setToDelete(null);
            setFeedback('Vacuna eliminada.');
            await reload();
        } catch (err) {
            setError(err.message);
            setToDelete(null);
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
        <Box sx={{ maxWidth: 860, width: '100%', mx: 'auto' }}>
            <Breadcrumbs sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                <MuiLink component={RouterLink} to="/dashboard" underline="hover" color="text.secondary">Inicio</MuiLink>
                <Typography color="primary" sx={{ fontSize: '0.85rem' }}>Mis vacunas</Typography>
            </Breadcrumbs>

            <PageHeader
                title="Mis vacunas"
                subtitle="Tu carnet de vacunación siempre a mano, y avisos de próximas dosis."
                action={!needsProfile && (
                    <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openNew()}>Agregar vacuna</Button>
                )}
            />

            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            {needsProfile ? (
                <Alert severity="info" action={<Button color="inherit" size="small" component={RouterLink} to="/complete-profile">Completar</Button>}>
                    Primero completá tus datos personales (DNI) para poder cargar tus vacunas.
                </Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {upcoming.length > 0 && (
                        <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <IconBadge tone="amber" size={40}><EventRepeatOutlinedIcon /></IconBadge>
                                <Box>
                                    <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>Próximas dosis</Typography>
                                    <Typography variant="body2" color="text.secondary">Las que tenés pendientes de aplicarte.</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {upcoming.map((v) => {
                                    const status = nextDoseStatus(v.next_dose_on);
                                    const tone = TONES[status.tone];
                                    return (
                                        <Box key={v.id_vaccine} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', p: 1.5, borderRadius: 2.5, bgcolor: '#FAFCFD', border: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 700 }}>{v.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDay(v.next_dose_on)}{v.dose ? ` · después de: ${v.dose}` : ''}
                                                </Typography>
                                            </Box>
                                            <Chip size="small" label={status.label} sx={{ bgcolor: tone.bg, color: tone.fg }} />
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>
                    )}

                    <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <IconBadge tone="teal" size={40}><VaccinesOutlinedIcon /></IconBadge>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>Vacunas registradas</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {vaccines.length === 0 ? 'Todavía no cargaste ninguna.' : `${vaccines.length} ${vaccines.length === 1 ? 'dosis registrada' : 'dosis registradas'}`}
                                </Typography>
                            </Box>
                        </Box>

                        {vaccines.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Empezá agregando las que recuerdes. Si no sabés la fecha, podés dejarla vacía.
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Agregar rápido:</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                                    {QUICK_PICKS.filter((q) => VACCINE_CATALOG.includes(q)).map((name) => (
                                        <Chip key={name} label={name} clickable variant="outlined" color="primary" onClick={() => openNew(name)} />
                                    ))}
                                </Box>
                            </Box>
                        ) : (
                            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                                {vaccines.map((v) => (
                                    <Box
                                        component="li" key={v.id_vaccine}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
                                    >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography sx={{ fontWeight: 700 }}>{v.name}</Typography>
                                                {v.dose && <Chip size="small" label={v.dose} sx={{ bgcolor: 'primary.light', color: 'primary.main' }} />}
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {v.applied_on ? `Aplicada el ${formatDay(v.applied_on)}` : 'Fecha no registrada'}
                                                {v.next_dose_on ? ` · Próxima: ${formatDay(v.next_dose_on)}` : ''}
                                            </Typography>
                                            {(v.place || v.notes) && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    {v.place && <><PlaceOutlinedIcon sx={{ fontSize: 14 }} />{v.place}</>}
                                                    {v.place && v.notes ? ' · ' : ''}{v.notes}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Tooltip title="Editar">
                                            <IconButton size="small" aria-label={`Editar ${v.name}`} onClick={() => openEdit(v)}><EditOutlinedIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton size="small" aria-label={`Eliminar ${v.name}`} onClick={() => setToDelete(v)}><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <LockOutlinedIcon sx={{ fontSize: 14 }} />
                        Tu carnet lo ven solo vos y los médicos que te atienden. Este registro es informativo y no reemplaza tu carnet oficial.
                    </Typography>
                </Box>
            )}

            <VaccineFormDialog open={dialogOpen} vaccine={editing} initialName={initialName} onClose={() => setDialogOpen(false)} onSaved={handleSaved} />
            <ConfirmDialog
                open={Boolean(toDelete)} title="Eliminar vacuna" loading={deleting}
                message={toDelete ? `Se va a eliminar "${toDelete.name}"${toDelete.dose ? ` (${toDelete.dose})` : ''} de tu carnet. Esta acción no se puede deshacer.` : ''}
                onConfirm={handleDelete} onClose={() => setToDelete(null)}
            />

            <Snackbar open={Boolean(feedback)} autoHideDuration={3500} onClose={() => setFeedback('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" variant="filled" onClose={() => setFeedback('')} sx={{ width: '100%' }}>{feedback}</Alert>
            </Snackbar>
        </Box>
    );
};

export default Vaccines;
