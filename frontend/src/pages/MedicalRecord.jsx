import { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, MenuItem, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getMedicalRecord, saveMedicalRecord } from '../services/api';

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Desconocido"];

const MedicalRecord = () => {
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [bloodGroup, setBloodGroup] = useState('');
    const [allergies, setAllergies] = useState('');
    const [antecedents, setAntecedents] = useState('');

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const record = await getMedicalRecord();
                if (record) {
                    setBloodGroup(record.blood_group || '');
                    setAllergies(record.allergies || '');
                    setAntecedents(record.antecedents || '');
                }
            } catch (err) {
                console.error(err);
                setError("No se pudo cargar la información previa.");
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await saveMedicalRecord({ blood_group: bloodGroup, allergies, antecedents });
            setSuccess('Ficha médica guardada exitosamente.');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.message);
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
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
            <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
                Mi Ficha Médica
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Mantené actualizada tu información clínica. Esto será vital para los médicos que te atiendan.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
                <TextField select fullWidth label="Grupo Sanguíneo" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} margin="normal" required>
                    {BLOOD_GROUPS.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                </TextField>

                <TextField fullWidth label="Alergias Conocidas" placeholder="Ej: Penicilina, Ibuprofeno, Maní (Dejar en blanco si no tiene)" multiline rows={3} margin="normal" value={allergies} onChange={(e) => setAllergies(e.target.value)} />

                <TextField fullWidth label="Antecedentes Médicos / Enfermedades Crónicas" placeholder="Ej: Asma, Hipertensión, Diabetes tipo 2" multiline rows={4} margin="normal" value={antecedents} onChange={(e) => setAntecedents(e.target.value)} />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button type="submit" variant="contained" color="primary">
                        Guardar Ficha
                    </Button>
                </Box>
            </form>
        </Paper>
    );
};

export default MedicalRecord;