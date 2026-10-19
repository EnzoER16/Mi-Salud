import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Stack, MenuItem,
} from '@mui/material';
import { createAppointment, updateAppointment } from '../../services/api';
import { toLocalInputValue } from './format';

const EMPTY = { title: '', scheduled_at: '', doctor_name: '', location: '', modality: 'Presencial' };

// Sirve para crear (appointment = null) y para editar un turno existente
const AppointmentFormDialog = ({ open, appointment, onClose, onSaved }) => {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = Boolean(appointment);

    useEffect(() => {
        if (!open) return;
        setError('');
        setForm(appointment ? {
            title: appointment.title,
            scheduled_at: toLocalInputValue(appointment.scheduled_at),
            doctor_name: appointment.doctor_name || '',
            location: appointment.location || '',
            modality: appointment.modality,
        } : EMPTY);
    }, [open, appointment]);

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const date = new Date(form.scheduled_at);
        if (!form.scheduled_at || Number.isNaN(date.getTime())) {
            return setError('Elegí la fecha y la hora del turno.');
        }

        setSaving(true);
        try {
            const payload = {
                title: form.title,
                scheduled_at: date.toISOString(),   // se manda en UTC; el backend lo guarda así
                doctor_name: form.doctor_name,
                location: form.location,
                modality: form.modality,
            };
            const saved = isEdit
                ? await updateAppointment(appointment.id_appointment, payload)
                : await createAppointment(payload);
            onSaved(saved);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
            <form onSubmit={handleSubmit}>
                <DialogTitle>{isEdit ? 'Editar turno' : 'Nuevo turno'}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Motivo o especialidad" required value={form.title} onChange={set('title')}
                            placeholder="Ej: Clínica médica" slotProps={{ htmlInput: { maxLength: 100 } }}
                        />
                        <TextField
                            label="Fecha y hora" type="datetime-local" required value={form.scheduled_at}
                            onChange={set('scheduled_at')} slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                            label="Profesional" value={form.doctor_name} onChange={set('doctor_name')}
                            placeholder="Ej: Dr. Juan Pérez" slotProps={{ htmlInput: { maxLength: 100 } }}
                        />
                        <TextField
                            label="Lugar" value={form.location} onChange={set('location')}
                            placeholder="Ej: Consultorio 1" slotProps={{ htmlInput: { maxLength: 100 } }}
                        />
                        <TextField select label="Modalidad" value={form.modality} onChange={set('modality')}>
                            <MenuItem value="Presencial">Presencial</MenuItem>
                            <MenuItem value="Virtual">Virtual</MenuItem>
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar turno'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AppointmentFormDialog;
