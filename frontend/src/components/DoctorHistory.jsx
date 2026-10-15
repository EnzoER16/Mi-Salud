import { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import { getDoctorHistory } from '../services/api';
import ConsultationsTable from './ConsultationsTable';
import SectionTitle from './SectionTitle';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

// refreshKey: cuando cambia, se vuelve a pedir el historial (sin mostrar el spinner de nuevo)
const DoctorHistory = ({ refreshKey = 0 }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getDoctorHistory();
                setHistory(data || []);
                setError('');
            } catch (err) {
                setError(err.message || 'Error al cargar el historial.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [refreshKey]);

    return (
        <Box>
            <SectionTitle>Mi Historial de Consultas</SectionTitle>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : history.length === 0 ? (
                <Paper elevation={0} sx={{ ...cardSx, p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconBadge tone="blue"><EventNoteOutlinedIcon /></IconBadge>
                    <Box>
                        <Typography fontWeight={600}>Todavía no registraste consultas</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Buscá a un paciente por DNI o QR para registrar la primera.
                        </Typography>
                    </Box>
                </Paper>
            ) : (
                <ConsultationsTable rows={history} showPatientDni />
            )}
        </Box>
    );
};

export default DoctorHistory;
