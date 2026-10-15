import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, LinearProgress } from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { getMyTreatments } from '../services/api';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

// refreshTrigger: cuando cambia, se vuelve a pedir el progreso
const TreatmentProgress = ({ refreshTrigger }) => {
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTreatments = async () => {
            try {
                const data = await getMyTreatments();
                setTreatments(data || []);
            } catch (err) {
                console.error('Error al cargar tratamientos:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTreatments();
    }, [refreshTrigger]);

    if (loading) return <CircularProgress sx={{ mt: 2 }} />;
    if (treatments.length === 0) return null;

    return (
        <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <IconBadge tone="green"><TrendingUpRoundedIcon /></IconBadge>
                <Box>
                    <Typography variant="h6">Progreso de mis tratamientos</Typography>
                    <Typography variant="body2" color="text.secondary">Tu adherencia a cada medicación.</Typography>
                </Box>
            </Box>

            {treatments.map((t) => (
                <Box key={t.id_treatment} sx={{ mt: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                        <Typography fontWeight={700}>{t.medication} · {t.dose}</Typography>
                        <Typography variant="body2" fontWeight={700} color={t.compliance === 100 ? 'success.main' : 'primary.main'}>
                            {`${t.compliance}%`}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Cada {t.frequency_hours} hs durante {t.duration_days} días
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={t.compliance}
                        color={t.compliance === 100 ? 'success' : 'primary'}
                        sx={{ height: 10, borderRadius: 5, bgcolor: '#E6F5F7' }}
                    />
                </Box>
            ))}
        </Paper>
    );
};

export default TreatmentProgress;
