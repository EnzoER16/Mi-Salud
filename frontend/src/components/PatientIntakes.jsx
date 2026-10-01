import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import { getTodaysIntakes, checkIntake } from '../services/api';

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
            setIntakes(data);
        } catch (err) {
            setError(err.message || 'Error al cargar las tomas de hoy.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheck = async (intakeId) => {
        try {
            await checkIntake(intakeId);
            fetchIntakes(); 
            // 2. Le avisamos al Dashboard que algo cambió
            if (onIntakeChecked) onIntakeChecked(); 
        } catch (err) {
            alert(err.message || "Error al registrar la toma");
        }
    };

    if (loading) return <CircularProgress sx={{ mt: 2 }} />;

    return (
        <Paper elevation={2} sx={{ mt: 0, mb: 4, p: 3, borderLeft: '5px solid #00838F' }}>
            <Typography variant="h6" color="primary" gutterBottom>
                💊 Mi Medicación para Hoy
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            {intakes.length === 0 ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                    ¡No tenés medicación programada para el día de hoy!
                </Alert>
            ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 2 }}>
                    {intakes.map((intake, index) => {
                        // Formateamos la hora para que se vea linda (ej: 14:30)
                        const time = new Date(intake.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const isTaken = intake.status === 'Tomado';

                        return (
                            <Box key={intake.id_intake}>
                                <ListItem 
                                    sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        backgroundColor: isTaken ? '#f1f8e9' : 'transparent',
                                        borderRadius: 1
                                    }}
                                >
                                    <ListItemText 
                                        primary={`Hora: ${time}`} 
                                        secondary={isTaken ? 'Ya tomaste esta dosis' : 'Pendiente de tomar'}
                                    />
                                    
                                    {isTaken ? (
                                        <Chip label="Tomado" color="success" variant="filled" />
                                    ) : (
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            size="small"
                                            onClick={() => handleCheck(intake.id_intake)}
                                        >
                                            Marcar Tomado
                                        </Button>
                                    )}
                                </ListItem>
                                {index < intakes.length - 1 && <Divider />}
                            </Box>
                        );
                    })}
                </List>
            )}
        </Paper>
    );
};

export default PatientIntakes;