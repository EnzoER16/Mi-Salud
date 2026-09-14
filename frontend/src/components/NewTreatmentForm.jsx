import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Grid } from '@mui/material';

// Recibe el ID de la consulta actual por props
const NewTreatmentForm = ({ consultationId, onTreatmentAdded }) => {
    const [medication, setMedication] = useState('');
    const [dose, setDose] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            // Llamamos a tu ruta exacta: POST /api/treatment/<consultation_id>
            const response = await fetch(`http://localhost:5000/api/treatment/${consultationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    medication,
                    dose,
                    frequency_hours: parseInt(frequency),
                    duration_days: parseInt(duration)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al guardar el tratamiento');
            }

            setSuccess('Tratamiento recetado y alarmas generadas con éxito.');
            setMedication('');
            setDose('');
            setFrequency('');
            setDuration('');
            
            // Avisamos al componente padre que se agregó un tratamiento (para recargar la lista)
            if (onTreatmentAdded) onTreatmentAdded(data.treatment);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
            <Typography variant="h6" color="primary" gutterBottom>
                Recetar Nuevo Medicamento
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField 
                        fullWidth label="Medicamento" variant="outlined" required
                        value={medication} onChange={(e) => setMedication(e.target.value)}
                        placeholder="Ej: Ibuprofeno"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField 
                        fullWidth label="Dosis" variant="outlined" required
                        value={dose} onChange={(e) => setDose(e.target.value)}
                        placeholder="Ej: 600mg"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField 
                        fullWidth label="Frecuencia (Horas)" variant="outlined" required type="number"
                        value={frequency} onChange={(e) => setFrequency(e.target.value)}
                        inputProps={{ min: 1 }}
                        placeholder="Ej: 8 (para 'cada 8 horas')"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField 
                        fullWidth label="Duración (Días)" variant="outlined" required type="number"
                        value={duration} onChange={(e) => setDuration(e.target.value)}
                        inputProps={{ min: 1 }}
                        placeholder="Ej: 7"
                    />
                </Grid>
            </Grid>

            <Button 
                type="submit" variant="contained" color="primary" fullWidth 
                sx={{ mt: 3 }} disabled={loading}
            >
                {loading ? 'Guardando...' : 'Guardar y Generar Tomas'}
            </Button>
        </Box>
    );
};

export default NewTreatmentForm;