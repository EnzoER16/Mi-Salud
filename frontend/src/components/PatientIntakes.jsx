import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, Chip, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { getTodaysIntakes, checkIntake, skipIntake, postponeIntake } from '../services/api';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

const toLocalTime = (iso) =>
    new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PatientIntakes = ({ onIntakeChecked, refreshKey }) => {
    const [intakes, setIntakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para el menú de opciones (3 puntitos)
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedIntake, setSelectedIntake] = useState(null);

    useEffect(() => {
        fetchIntakes();
    }, [refreshKey]);

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

    const handleAction = async (actionFn, intakeId) => {
        setError('');
        setAnchorEl(null); // Cerramos el menú
        try {
            await actionFn(intakeId);
            fetchIntakes();
            if (onIntakeChecked) onIntakeChecked(); // Refresca el % global de la UI
        } catch (err) {
            setError(err.message || 'Error al procesar la acción');
        }
    };

    if (loading) return <CircularProgress sx={{ mt: 2 }} />;

    const taken = intakes.filter((i) => i.status === 'Tomado').length;
    const skipped = intakes.filter((i) => i.status === 'Omitido').length;
    return (
        <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <IconBadge tone="teal"><MedicationOutlinedIcon /></IconBadge>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">Mi medicación de hoy</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {intakes.length === 0 ? 'Sin tomas programadas' : 'Medicamentos, diagnóstico y tomas de cada tratamiento'}
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
                        const isSkipped = intake.status === 'Omitido';

                        // Estilos condicionales según el estado
                        let borderColor = 'divider';
                        let bgcolor = '#FAFCFD';
                        if (isTaken) { borderColor = '#D6EBC3'; bgcolor = '#F4FAEC'; }
                        else if (isSkipped) { borderColor = '#F5D9A6'; bgcolor = '#FFF9EC'; }

                        return (
                            <Box
                                key={intake.id_intake}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor,
                                    bgcolor,
                                }}
                            >
                                <Box
                                    sx={{
                                        px: 1.5, py: 0.75, borderRadius: 2, bgcolor: '#fff',
                                        border: '1px solid', borderColor: 'divider', fontWeight: 700,
                                        minWidth: 64, textAlign: 'center',
                                    }}
                                >
                                    {toLocalTime(intake.scheduled_time)}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700}>{intake.medication} · {intake.dose}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                        {isTaken ? 'Ya tomaste esta dosis' : isSkipped ? 'Salteaste esta dosis' : 'Pendiente de tomar'}
                                    </Typography>
                                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1, pt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {intake.diagnosis && <Typography variant="caption" sx={{ display: 'block', overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: 'text.secondary' }}>Diagnóstico: </Box>{intake.diagnosis}</Typography>}
                                        <Typography variant="caption" sx={{ display: 'block', overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: 'text.secondary' }}>Tratamiento: </Box>Cada {intake.frequency_hours} hs durante {intake.duration_days} días</Typography>
                                        {intake.instructions && <Typography variant="caption" sx={{ display: 'block', overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: 'text.secondary' }}>Indicaciones: </Box>{intake.instructions}</Typography>}
                                        <Typography variant="caption" sx={{ display: 'block' }}><Box component="span" sx={{ color: 'text.secondary' }}>Tomas totales: </Box><Box component="span" sx={{ fontWeight: 700 }}>{intake.treatment_taken}/{intake.treatment_total}</Box></Typography>
                                    </Box>
                                </Box>
                                {isTaken ? (
                                    <Chip label="Tomado" color="success" size="small" icon={<CheckCircleRoundedIcon />} />
                                ) : isSkipped ? (
                                    <Chip label="Salteado" color="warning" size="small" icon={<ErrorOutlineRoundedIcon />} sx={{ bgcolor: '#FFF1D6', color: '#B26A00' }} />
                                ) : (
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Button variant="contained" size="small" onClick={() => handleAction(checkIntake, intake.id_intake)}>
                                            Tomado
                                        </Button>
                                        <IconButton 
                                            size="small" 
                                            color="inherit" 
                                            onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedIntake(intake.id_intake); }}
                                        >
                                            <MoreVertRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}

                    {/* Menú de opciones adicionales (Snooze / Skip) */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { mt: 1, minWidth: 180, borderRadius: 3 } } }}
                    >
                        <MenuItem onClick={() => handleAction(postponeIntake, selectedIntake)}>
                            <ListItemIcon><UpdateOutlinedIcon fontSize="small" /></ListItemIcon>
                            Posponer 1 hora
                        </MenuItem>
                        <MenuItem onClick={() => handleAction(skipIntake, selectedIntake)} sx={{ color: 'warning.main' }}>
                            <ListItemIcon><BlockOutlinedIcon fontSize="small" color="warning" /></ListItemIcon>
                            Saltear esta toma
                        </MenuItem>
                    </Menu>

                </Box>
            )}
        </Paper>
    );
};

export default PatientIntakes;