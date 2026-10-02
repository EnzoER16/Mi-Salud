import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Chip, Alert, CircularProgress, Paper, Stack,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Collapse, List, ListItem, ListItemText
} from '@mui/material';
import { getPatientTreatments, updateTreatment, getTreatmentHistory } from '../services/api';

const TreatmentManager = ({ patientId, refreshKey }) => {
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');

    // Diálogo de edición
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ dose: '', frequency_hours: '', duration_days: '' });
    const [saving, setSaving] = useState(false);
    const [dialogError, setDialogError] = useState('');

    // Historial desplegable
    const [historyOpenId, setHistoryOpenId] = useState(null);
    const [history, setHistory] = useState([]);

    const loadTreatments = async () => {
        try {
            const data = await getPatientTreatments(patientId);
            setTreatments(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadTreatments();
    }, [patientId, refreshKey]);

    const openEdit = (t) => {
        setEditing(t);
        setDialogError('');
        setForm({
            dose: t.dose,
            frequency_hours: String(t.frequency_hours),
            duration_days: String(t.duration_days)
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setDialogError('');
        try {
            await updateTreatment(editing.id_treatment, {
                dose: form.dose,
                frequency_hours: parseInt(form.frequency_hours),
                duration_days: parseInt(form.duration_days)
            });
            setEditing(null);
            setSuccess('Tratamiento actualizado. Los recordatorios del paciente se regeneraron.');
            setHistoryOpenId(null);
            await loadTreatments();
        } catch (err) {
            setDialogError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleHistory = async (treatmentId) => {
        if (historyOpenId === treatmentId) {
            setHistoryOpenId(null);
            return;
        }
        const data = await getTreatmentHistory(treatmentId);
        setHistory(data || []);
        setHistoryOpenId(treatmentId);
    };

    // El backend guarda en UTC sin zona: agregamos 'Z' para que el navegador lo convierta a hora local
    const formatDate = (iso) => new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString();

    if (loading) return <CircularProgress size={24} />;
    if (treatments.length === 0) return null;

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>
                Tratamientos del paciente
            </Typography>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Stack spacing={2}>
                {treatments.map((t) => (
                    <Paper key={t.id_treatment} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Box>
                                <Typography fontWeight="bold">{t.medication} - {t.dose}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Cada {t.frequency_hours} hs durante {t.duration_days} días · Cumplimiento: {t.compliance}%
                                </Typography>
                            </Box>
                            <Chip
                                label={t.is_active ? 'Activo' : 'Finalizado'}
                                color={t.is_active ? 'success' : 'default'}
                                size="small"
                            />
                        </Box>

                        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                            {t.is_active && (
                                <Button size="small" variant="contained" onClick={() => openEdit(t)}>
                                    Editar
                                </Button>
                            )}
                            <Button size="small" variant="text" onClick={() => toggleHistory(t.id_treatment)}>
                                {historyOpenId === t.id_treatment ? 'Ocultar historial' : 'Ver historial de cambios'}
                            </Button>
                        </Box>

                        <Collapse in={historyOpenId === t.id_treatment}>
                            {history.length === 0 ? (
                                <Typography variant="body2" sx={{ mt: 1 }}>Este tratamiento no tiene modificaciones.</Typography>
                            ) : (
                                <List dense>
                                    {history.map((h) => (
                                        <ListItem key={h.id_history} disableGutters>
                                            <ListItemText
                                                primary={h.changes_details.split(' | ').join(' · ')}
                                                secondary={formatDate(h.date_modified)}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Collapse>
                    </Paper>
                ))}
            </Stack>

            {/* Diálogo de edición */}
            <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
                <DialogTitle>Editar {editing?.medication}</DialogTitle>
                <DialogContent>
                    {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Dosis" value={form.dose}
                            onChange={(e) => setForm({ ...form, dose: e.target.value })} />
                        <TextField label="Frecuencia (horas)" type="number" value={form.frequency_hours}
                            onChange={(e) => setForm({ ...form, frequency_hours: e.target.value })}
                            inputProps={{ min: 1 }} />
                        <TextField label="Duración (días)" type="number" value={form.duration_days}
                            onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                            inputProps={{ min: 1 }} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditing(null)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TreatmentManager;