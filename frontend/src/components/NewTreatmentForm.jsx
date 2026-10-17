import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Autocomplete } from '@mui/material';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import { getMedications } from '../services/api';
import IconBadge from './IconBadge';

// Recibe el ID de la consulta actual por props
const NewTreatmentForm = ({ consultationId, onTreatmentAdded }) => {
    const [medication, setMedication] = useState('');
    const [dose, setDose] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');

    // Catálogo de medicamentos para el desplegable
    const [catalog, setCatalog] = useState([]);
    const [autocompleteKey, setAutocompleteKey] = useState(0); // para limpiar el campo al guardar

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let active = true;
        getMedications()
            .then((data) => {
                if (active && Array.isArray(data)) setCatalog(data);
            })
            .catch(() => {
                // Si el catálogo no carga, el campo sigue funcionando como texto libre
            });
        return () => { active = false; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Number(frequency) <= 0 || Number(duration) <= 0) {
            return setError('La frecuencia y la duración deben ser mayores a 0.');
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            // POST /api/treatment/<consultation_id>
            const response = await fetch(`http://localhost:5000/api/treatment/${consultationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    medication: medication.trim(),
                    dose,
                    frequency_hours: parseInt(frequency),
                    duration_days: parseInt(duration)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al guardar el tratamiento');
            }

            setSuccess('Tratamiento recetado y recordatorios generados con éxito.');
            setMedication('');
            setAutocompleteKey((k) => k + 1);
            setDose('');
            setFrequency('');
            setDuration('');

            if (onTreatmentAdded) onTreatmentAdded(data.treatment);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: '#FAFCFD' }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <IconBadge tone="green" size={40}><MedicationOutlinedIcon /></IconBadge>
                <Box>
                    <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>Recetar medicamento</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Se generan automáticamente las tomas del paciente.
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {/* freeSolo: se puede elegir de la lista o escribir cualquier otro medicamento */}
                <Autocomplete
                    key={autocompleteKey}
                    freeSolo
                    options={catalog}
                    groupBy={(option) => option.category}
                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                    inputValue={medication}
                    onInputChange={(e, value) => setMedication(value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Medicamento"
                            required
                            placeholder="Escribí o elegí de la lista"
                        />
                    )}
                />
                <TextField
                    fullWidth label="Dosis" required
                    value={dose} onChange={(e) => setDose(e.target.value)}
                    placeholder="Ej: 600mg"
                />
                <TextField
                    fullWidth label="Frecuencia (horas)" required type="number"
                    value={frequency} onChange={(e) => setFrequency(e.target.value)}
                    slotProps={{ htmlInput: { min: 1 } }}
                    placeholder="Ej: 8 (cada 8 horas)"
                />
                <TextField
                    fullWidth label="Duración (días)" required type="number"
                    value={duration} onChange={(e) => setDuration(e.target.value)}
                    slotProps={{ htmlInput: { min: 1 } }}
                    placeholder="Ej: 7"
                />
            </Box>

            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3 }} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar y generar tomas'}
            </Button>
        </Box>
    );
};

export default NewTreatmentForm;
