import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, Chip } from '@mui/material';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { getTodaysIntakes, checkIntake } from '../services/api';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

// El backend guarda en UTC sin zona: agregamos 'Z' para mostrar la hora local
const toLocalTime = (iso) =>
    new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PatientIntakes = ({ onIntakeChecked }) => {
    const [intakes, setIntakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchIntakes();
    }, []);

    const fetchIntakes = async () => {
        try {
            const data = await getTodaysIntakes();
            setIntakes(data || []);
        } catch (err) {
            setError(err.message || 'Error al cargar las tomas de hoy.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheck = async (intakeId) => {
        setError('');
        try {
            await checkIntake(intakeId);
            fetchIntakes();
            if (onIntakeChecked) onIntakeChecked();
        } catch (err) {
            setError(err.message || 'Error al registrar la toma');
        }
    };

    if (loading) return <CircularProgress sx={{ mt: 2 }} />;

    const taken = intakes.filter((i) => i.status === 'Tomado').length;

    return (
        <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <IconBadge tone="teal"><MedicationOutlinedIcon /></IconBadge>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">Mi medicación de hoy</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {intakes.length === 0 ? 'Sin tomas programadas' : `${taken} de ${intakes.length} tomas registradas`}
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {intakes.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleRoundedIcon />}>
                    ¡No tenés medicación programada para el día de hoy!
                </Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {intakes.map((intake) => {
                        const isTaken = intake.status === 'Tomado';
                        return (
                            <Box
                                key={intake.id_intake}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: isTaken ? '#D6EBC3' : 'divider',
                                    bgcolor: isTaken ? '#F4FAEC' : '#FAFCFD',
                                }}
                            >
                                <Box
                                    sx={{
                                        px: 1.5,
                                        py: 0.75,
                                        borderRadius: 2,
                                        bgcolor: '#fff',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        fontWeight: 700,
                                        minWidth: 64,
                                        textAlign: 'center',
                                    }}
                                >
                                    {toLocalTime(intake.scheduled_time)}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                    {isTaken ? 'Ya tomaste esta dosis' : 'Pendiente de tomar'}
                                </Typography>
                                {isTaken ? (
                                    <Chip label="Tomado" color="success" size="small" icon={<CheckCircleRoundedIcon />} />
                                ) : (
                                    <Button variant="contained" size="small" onClick={() => handleCheck(intake.id_intake)}>
                                        Marcar tomado
                                    </Button>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Paper>
    );
};

export default PatientIntakes;
