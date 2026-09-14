import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
import { getPatientHistory } from '../services/api';

const PatientHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getPatientHistory();
                setHistory(data);
            } catch (err) {
                setError(err.message || 'Error al cargar el historial.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <CircularProgress sx={{ mt: 2 }} />;
    if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

    return (
        <Box sx={{ mt: 4, width: '100%' }}>
            <Typography variant="h6" color="primary" gutterBottom>
                Mi Historial Médico
            </Typography>
            
            {history.length === 0 ? (
                <Alert severity="info">Aún no tenés consultas médicas registradas en el sistema.</Alert>
            ) : (
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
                            <TableRow>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Ubicación</strong></TableCell>
                                <TableCell><strong>Diagnóstico</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.map((row) => (
                                <TableRow key={row.id_consultation}>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell>{row.location}</TableCell>
                                    <TableCell>{row.diagnosis}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default PatientHistory;