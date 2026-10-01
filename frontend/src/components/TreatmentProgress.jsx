import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, LinearProgress } from '@mui/material';
import { getMyTreatments } from '../services/api';

// 1. Recibimos el gatillo por props
const TreatmentProgress = ({ refreshTrigger }) => { 
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTreatments = async () => {
            try {
                const data = await getMyTreatments();
                setTreatments(data);
            } catch (err) {
                console.error("Error al cargar tratamientos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTreatments();
    // 2. Colocamos el gatillo en el array de dependencias
    }, [refreshTrigger]);

    if (loading) return <CircularProgress sx={{ mt: 2 }} />;
    if (treatments.length === 0) return null; // Si no tiene tratamientos, ocultamos la caja

    return (
        <Paper elevation={2} sx={{ mb: 4, p: 3, borderLeft: '5px solid #4DB6AC' }}>
            <Typography variant="h6" color="primary" gutterBottom>
                📈 Progreso de mis Tratamientos
            </Typography>
            
            {treatments.map((t) => (
                <Box key={t.id_treatment} sx={{ mt: 2 }}>
                    <Typography variant="body1" fontWeight="bold">
                        {t.medication} - {t.dose}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Duración: {t.duration_days} días (Cada {t.frequency_hours} hs)
                    </Typography>
                    
                    {/* Contenedor de la barra y el porcentaje */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                        <Box sx={{ width: '100%' }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={t.compliance} 
                                sx={{ height: 10, borderRadius: 5 }} 
                                color={t.compliance === 100 ? "success" : "primary"}
                            />
                        </Box>
                        <Box sx={{ minWidth: 40 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                {`${t.compliance}%`}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            ))}
        </Paper>
    );
};

export default TreatmentProgress;