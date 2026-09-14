import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
import { getDoctorHistory } from '../services/api';

const DoctorHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getDoctorHistory();
                setHistory(data);
            } catch (err) {
                setError(err.message || 'Error al cargar el historial.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" color="primary" gutterBottom>
                Mi Historial de Consultas
            </Typography>
            
            {history.length === 0 ? (
                <Alert severity="info">Aún no has registrado ninguna consulta.</Alert>
            ) : (
                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>DNI Paciente</strong></TableCell>
                                <TableCell><strong>Ubicación</strong></TableCell>
                                <TableCell><strong>Diagnóstico / Estado</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.map((row) => (
                                <TableRow key={row.id_consultation}>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell>{row.patient_dni}</TableCell>
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

export default DoctorHistory;