import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Stack, Autocomplete, Box,
} from '@mui/material';
import { addVaccine, updateVaccine } from '../../services/api';
import { VACCINE_CATALOG, DOSE_OPTIONS, todayInput, str, orNullValue } from '../profile/format';

const EMPTY = { name: '', dose: '', applied_on: '', next_dose_on: '', place: '', notes: '' };

// Sirve para agregar (vaccine = null) y para editar. `initialName` precarga el nombre (atajos de la pantalla vacía)
const VaccineFormDialog = ({ open, vaccine, initialName = '', onClose, onSaved }) => {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = Boolean(vaccine);

    useEffect(() => {
        if (!open) return;
        setError('');
        setForm(vaccine ? {
            name: vaccine.name, dose: str(vaccine.dose), applied_on: str(vaccine.applied_on),
            next_dose_on: str(vaccine.next_dose_on), place: str(vaccine.place), notes: str(vaccine.notes),
        } : { ...EMPTY, name: initialName });
    }, [open, vaccine, initialName]);

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) return setError('Escribí o elegí el nombre de la vacuna.');
        if (form.applied_on && form.next_dose_on && form.next_dose_on <= form.applied_on) {
            return setError('La próxima dosis tiene que ser posterior a la fecha de aplicación.');
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                dose: orNullValue(form.dose),
                applied_on: orNullValue(form.applied_on),
                next_dose_on: orNullValue(form.next_dose_on),
                place: orNullValue(form.place),
                notes: orNullValue(form.notes),
            };
            const saved = isEdit ? await updateVaccine(vaccine.id_vaccine, payload) : await addVaccine(payload);
            onSaved(saved, isEdit);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <form onSubmit={handleSubmit}>
                <DialogTitle>{isEdit ? 'Editar vacuna' : 'Agregar vacuna'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Autocomplete
                            freeSolo options={VACCINE_CATALOG} inputValue={form.name}
                            onInputChange={(_, value) => setForm((prev) => ({ ...prev, name: value }))}
                            renderInput={(params) => (
                                <TextField
                                    {...params} required autoFocus label="Vacuna" placeholder="Elegí de la lista o escribí otra"
                                    slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, maxLength: 100 } }}
                                />
                            )}
                        />

                        <Autocomplete
                            freeSolo options={DOSE_OPTIONS} inputValue={form.dose}
                            onInputChange={(_, value) => setForm((prev) => ({ ...prev, dose: value }))}
                            renderInput={(params) => (
                                <TextField {...params} label="Dosis" slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, maxLength: 40 } }} />
                            )}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                            <TextField
                                label="Fecha de aplicación" type="date" value={form.applied_on} onChange={set('applied_on')}
                                helperText="Podés dejarla vacía si no la recordás"
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayInput(), min: '1900-01-01' } }}
                            />
                            <TextField
                                label="Próxima dosis o refuerzo" type="date" value={form.next_dose_on} onChange={set('next_dose_on')}
                                helperText="Opcional"
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Box>

                        <TextField label="Lugar de aplicación" value={form.place} onChange={set('place')} placeholder="Ej: Centro de salud, vacunatorio" slotProps={{ htmlInput: { maxLength: 100 } }} />
                        <TextField label="Notas" value={form.notes} onChange={set('notes')} placeholder="Ej: lote, reacción, observaciones" slotProps={{ htmlInput: { maxLength: 255 } }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default VaccineFormDialog;
