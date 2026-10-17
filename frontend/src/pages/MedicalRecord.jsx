import { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Alert, MenuItem, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getMedicalRecord, saveMedicalRecord } from '../services/api';
import PageHeader from '../components/PageHeader';
import { cardSx } from '../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido'];

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
                setError('No se pudo cargar la información previa.');
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

        if (!bloodGroup) return setError('Debe seleccionar un grupo sanguíneo.');

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
        <Box sx={{ maxWidth: 720, width: '100%', mx: 'auto' }}>
            <PageHeader
                eyebrow="Mi cuenta"
                title="Mi ficha médica"
                subtitle="Mantené actualizada tu información clínica. Es clave para los médicos que te atiendan."
            />

            <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 4 } }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField select fullWidth required label="Grupo sanguíneo" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                            {BLOOD_GROUPS.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth multiline rows={3} label="Alergias conocidas"
                            placeholder="Ej: Penicilina, Ibuprofeno, Maní (dejar en blanco si no tiene)"
                            value={allergies} onChange={(e) => setAllergies(e.target.value)}
                        />

                        <TextField
                            fullWidth multiline rows={4} label="Antecedentes médicos / enfermedades crónicas"
                            placeholder="Ej: Asma, Hipertensión, Diabetes tipo 2"
                            value={antecedents} onChange={(e) => setAntecedents(e.target.value)}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4 }}>
                        <Button variant="outlined" color="inherit" onClick={() => navigate('/dashboard')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained">
                            Guardar ficha
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default MedicalRecord;
