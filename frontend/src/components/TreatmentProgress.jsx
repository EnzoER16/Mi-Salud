import { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, CircularProgress, LinearProgress, IconButton, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert
} from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import { getMyTreatments, rescheduleTreatment } from '../services/api';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

const TreatmentProgress = ({ refreshTrigger, onRescheduled }) => {
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para el Modal de Reprogramación
    const [activeModal, setActiveModal] = useState(null);
    const [newTime, setNewTime] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchTreatments = async () => {
        try {
            const data = await getMyTreatments();
            setTreatments(data || []);
        } catch (err) {
            console.error('Error al cargar tratamientos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTreatments();
    }, [refreshTrigger]);

    const handleOpenModal = (treatment) => {
        let localTimeString = '';
        
        if (treatment.next_intake_time) {
            // Convertimos la hora del servidor a la hora local del celular
            const dateObj = new Date(
                treatment.next_intake_time.endsWith('Z') 
                    ? treatment.next_intake_time 
                    : treatment.next_intake_time + 'Z'
            );
            // Ajustamos los minutos según la zona horaria para el input datetime-local
            dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
            localTimeString = dateObj.toISOString().slice(0, 16);
        } else {
            // Si por algún motivo no hay tomas, usamos la hora actual
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            localTimeString = now.toISOString().slice(0, 16);
        }

        setNewTime(localTimeString);
        setActiveModal(treatment);
        setError('');
    };

    const handleReschedule = async () => {
        setSaving(true);
        setError('');
        try {
            // Convertimos la hora local seleccionada a formato ISO UTC para el backend
            const dateObj = new Date(newTime);
            await rescheduleTreatment(activeModal.id_treatment, dateObj.toISOString());
            
            setActiveModal(null);
            fetchTreatments(); // Recargamos el progreso
            if (onRescheduled) onRescheduled(); // Avisamos al componente padre si necesita recargar algo
        } catch (err) {
            setError(err.message || 'Error al reprogramar los horarios.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <CircularProgress sx={{ mt: 2 }} />;
    if (treatments.length === 0) return null;

    return (
        <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <IconBadge tone="green"><TrendingUpRoundedIcon /></IconBadge>
                <Box>
                    <Typography variant="h6">Progreso de mis tratamientos</Typography>
                    <Typography variant="body2" color="text.secondary">Tu adherencia a cada medicación.</Typography>
                </Box>
            </Box>

            {treatments.map((t) => {
                // Consideramos activo si no llegó al 100% (o podés usar la fecha de fin)
                const isActive = t.compliance < 100;

                return (
                    <Box key={t.id_treatment} sx={{ mt: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                            <Typography fontWeight={700}>{t.medication} · {t.dose}</Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={700} color={t.compliance === 100 ? 'success.main' : 'primary.main'}>
                                    {`${t.compliance}%`}
                                </Typography>
                                {isActive && (
                                    <Tooltip title="Ajustar horario de mis tomas">
                                        <IconButton size="small" onClick={() => handleOpenModal(t)} sx={{ color: 'text.secondary' }}>
                                            <EditCalendarOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Cada {t.frequency_hours} hs durante {t.duration_days} días
                        </Typography>
                        
                        <LinearProgress
                            variant="determinate"
                            value={t.compliance}
                            color={t.compliance === 100 ? 'success' : 'primary'}
                            sx={{ height: 10, borderRadius: 5, bgcolor: '#E6F5F7' }}
                        />
                    </Box>
                );
            })}

            {/* Modal para elegir la nueva hora de inicio */}
            <Dialog open={Boolean(activeModal)} onClose={() => setActiveModal(null)} fullWidth maxWidth="xs">
                <DialogTitle>Ajustar horario</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 1 }}>
                        Si empezaste a tomar <strong>{activeModal?.medication}</strong> en un horario distinto, indicanos a qué hora tomaste (o vas a tomar) la primera pastilla y ajustaremos el resto.
                    </Typography>
                    <TextField
                        fullWidth
                        type="datetime-local"
                        label="Siguiente toma programada"
                        InputLabelProps={{ shrink: true }}
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={() => setActiveModal(null)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleReschedule} disabled={saving || !newTime}>
                        {saving ? 'Guardando...' : 'Reprogramar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default TreatmentProgress;