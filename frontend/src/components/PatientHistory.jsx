import { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import { getPatientHistory } from '../services/api';
import ConsultationsTable from './ConsultationsTable';
import SectionTitle from './SectionTitle';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

const PatientHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getPatientHistory();
                setHistory(data || []);
            } catch (err) {
                setError(err.message || 'Error al cargar el historial.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <Box>
            <SectionTitle>Mi Historial Médico</SectionTitle>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : history.length === 0 ? (
                <Paper elevation={0} sx={{ ...cardSx, p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconBadge tone="blue"><EventNoteOutlinedIcon /></IconBadge>
                    <Typography variant="body2" color="text.secondary">
                        Aún no tenés consultas médicas registradas en el sistema.
                    </Typography>
                </Paper>
            ) : (
                <ConsultationsTable rows={history} />
            )}
        </Box>
    );
};

export default PatientHistory;
