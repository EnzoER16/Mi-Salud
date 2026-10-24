import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Chip, Alert, CircularProgress, Paper, Stack,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Collapse, List, ListItem, ListItemText, MenuItem
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { getPatientTreatments, updateTreatment, getTreatmentHistory } from '../services/api';

const TreatmentManager = ({ patientId, refreshKey }) => {
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');

    // Diálogo de edición
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ doseAmount: '', doseUnit: 'mg', frequency_hours: '', duration_days: '' });
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
        
        // Extraemos el número y la unidad del string (ej: "500mg" -> "500", "mg")
        let amount = '';
        let unit = 'mg';
        const match = t.dose.match(/^([\d.]+)\s*(mg|g)$/i);
        
        if (match) {
            amount = match[1];
            unit = match[2].toLowerCase();
        } else {
            // Fallback por si hay un dato viejo guardado distinto
            amount = t.dose.replace(/[^\d.]/g, ''); 
            unit = t.dose.toLowerCase().includes('g') && !t.dose.toLowerCase().includes('mg') ? 'g' : 'mg';
        }

        setForm({
            doseAmount: amount,
            doseUnit: unit,
            frequency_hours: String(t.frequency_hours),
            duration_days: String(t.duration_days)
        });
    };

    const handleSave = async () => {
        if (!form.doseAmount || !form.frequency_hours || !form.duration_days) {
            return setDialogError('Todos los campos son obligatorios.');
        }

        setSaving(true);
        setDialogError('');
        try {
            await updateTreatment(editing.id_treatment, {
                dose: `${form.doseAmount}${form.doseUnit}`,
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

    const formatDate = (iso) => new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString();

    if (loading) return <CircularProgress size={24} />;
    if (treatments.length === 0) return null;

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Tratamientos del paciente
            </Typography>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Stack spacing={1.5}>
                {treatments.map((t) => (
                    <Paper key={t.id_treatment} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Box>
                                <Typography fontWeight="bold">{t.medication} · {t.dose}</Typography>
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

                        <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {t.is_active && (
                                <Button size="small" variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(t)}>
                                    Editar
                                </Button>
                            )}
                            <Button
                                size="small" variant="text" startIcon={<HistoryRoundedIcon />}
                                onClick={() => toggleHistory(t.id_treatment)}
                                sx={{ letterSpacing: 0, textTransform: 'none' }}
                            >
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
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField 
                                fullWidth 
                                label="Dosis" 
                                type="number" 
                                value={form.doseAmount} 
                                onChange={(e) => setForm({ ...form, doseAmount: e.target.value })}
                                slotProps={{ htmlInput: { min: 0.1, step: "any" } }}
                            />
                            <TextField 
                                select 
                                value={form.doseUnit} 
                                onChange={(e) => setForm({ ...form, doseUnit: e.target.value })}
                                sx={{ minWidth: 80 }}
                            >
                                <MenuItem value="mg">mg</MenuItem>
                                <MenuItem value="g">g</MenuItem>
                            </TextField>
                        </Box>

                        <TextField label="Frecuencia (horas)" type="number" value={form.frequency_hours}
                            onChange={(e) => setForm({ ...form, frequency_hours: e.target.value })}
                            slotProps={{ htmlInput: { min: 1 } }} />
                        <TextField label="Duración (días)" type="number" value={form.duration_days}
                            onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                            slotProps={{ htmlInput: { min: 1 } }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={() => setEditing(null)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TreatmentManager;