import { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Alert, Divider, Grid } from '@mui/material';
import { Scanner } from '@yudiel/react-qr-scanner';
import { getPatientByDni, createConsultation } from '../services/api';
import NewTreatmentForm from './NewTreatmentForm';
import TreatmentManager from './TreatmentManager';


const DoctorSearch = () => {
    const [dniInput, setDniInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados para la nueva consulta
    const [showConsultationForm, setShowConsultationForm] = useState(false);
    const [location, setLocation] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [startingConsultation, setStartingConsultation] = useState(false);
    const [activeConsultationId, setActiveConsultationId] = useState(null);
    const [consultationSuccess, setConsultationSuccess] = useState('');
    const [treatmentsVersion, setTreatmentsVersion] = useState(0);

    const handleSearch = async (dniToSearch) => {
        if (!dniToSearch) return;
        
        setLoading(true);
        setError('');
        setConsultationSuccess('');
        setPatientData(null);
        setIsScanning(false);
        setShowConsultationForm(false);
        setActiveConsultationId(null);
        setLocation('');
        setDiagnosis('');

        try {
            const data = await getPatientByDni(dniToSearch);
            setPatientData(data);
        } catch (err) {
            setError(err.message || 'Paciente no encontrado o sin ficha médica.');
        } finally {
            setLoading(false);
            setDniInput('');
        }
    };

    const handleStartConsultation = async () => {
        if (!location || !diagnosis) {
            setError("Por favor, ingresa el lugar de atención y el diagnóstico.");
            return;
        }

        setStartingConsultation(true);
        setError('');
        
        try {
            // Llamamos a la API para crear la consulta
            const data = await createConsultation(patientData.id_patient, {
                location: location,
                diagnosis: diagnosis
            });

            // Guardamos el ID que generó la base de datos
            setActiveConsultationId(data.consultation.id_consultation);
            setConsultationSuccess("Consulta registrada exitosamente. Ahora puedes recetar un tratamiento.");
            
        } catch (err) {
            setError(err.message || 'Error al guardar la consulta');
        } finally {
            setStartingConsultation(false);
        }
    };

    return (
        <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h5" color="primary" gutterBottom>
                Atención a Pacientes
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Controles de Búsqueda */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <TextField 
                    label="Ingresar DNI" 
                    variant="outlined" 
                    size="small"
                    value={dniInput}
                    onChange={(e) => setDniInput(e.target.value.replace(/[^0-9]/g, ''))}
                    inputProps={{ maxLength: 8 }}
                />
                <Button 
                    variant="contained" 
                    onClick={() => handleSearch(dniInput)}
                    disabled={loading || !dniInput}
                >
                    Buscar
                </Button>
                
                <Typography variant="body2" sx={{ mx: 2 }}>O</Typography>

                <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={() => setIsScanning(!isScanning)}
                >
                    {isScanning ? 'Cancelar Escáner' : 'Escanear QR'}
                </Button>
            </Box>

            {/* Escáner QR */}
            {isScanning && (
                <Box sx={{ maxWidth: 300, mx: 'auto', mb: 3, border: '2px solid #1976d2', borderRadius: 2, overflow: 'hidden' }}>
                    <Scanner 
                        onScan={(result) => {
                            if (result && result.length > 0) {
                                handleSearch(result[0].rawValue);
                            }
                        }}
                        paused={loading} 
                    />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {/* Resultados del Paciente */}
            {patientData && (
                <Paper elevation={3} sx={{ p: 3, backgroundColor: '#fdfdfd', borderLeft: '5px solid #4caf50' }}>
                    <Typography variant="h6" gutterBottom>Ficha del Paciente (DNI: {patientData.dni})</Typography>
                    <Typography variant="body1"><strong>Grupo Sanguíneo:</strong> {patientData.medical_record?.blood_group || 'No especificado'}</Typography>
                    <Typography variant="body1"><strong>Alergias:</strong> {patientData.medical_record?.allergies || 'Ninguna'}</Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}><strong>Antecedentes:</strong> {patientData.medical_record?.antecedents || 'Ninguno'}</Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    <TreatmentManager patientId={patientData.id_patient} refreshKey={treatmentsVersion} />
                    {/* Paso 1: Botón para iniciar la consulta (Si no hay consulta activa ni formulario abierto) */}
                    {!showConsultationForm && !activeConsultationId && (
                        <Button variant="contained" color="primary" onClick={() => setShowConsultationForm(true)}>
                            Registrar Nueva Consulta
                        </Button>
                    )}

                    {/* Paso 2: Formulario de la Consulta Médica */}
                    {showConsultationForm && !activeConsultationId && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f7ff', borderRadius: 2 }}>
                            <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>
                                Detalles de la Atención
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField 
                                        fullWidth size="small" label="Lugar de atención" variant="outlined" 
                                        placeholder="Ej: Consultorio 3, Guardia"
                                        value={location} onChange={(e) => setLocation(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <TextField 
                                        fullWidth size="small" label="Diagnóstico Clínico" variant="outlined" 
                                        placeholder="Ej: Faringitis aguda. Se receta antibiótico."
                                        value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="contained" color="success"
                                    onClick={handleStartConsultation} disabled={startingConsultation}
                                >
                                    {startingConsultation ? 'Guardando...' : 'Guardar Diagnóstico'}
                                </Button>
                                <Button 
                                    variant="text" color="error"
                                    onClick={() => setShowConsultationForm(false)}
                                >
                                    Cancelar
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Paso 3: Al guardar la consulta, mostramos éxito y abrimos la Receta */}
                    {activeConsultationId && (
                        <Box sx={{ mt: 2 }}>
                            {consultationSuccess && <Alert severity="success" sx={{ mb: 2 }}>{consultationSuccess}</Alert>}
                            
                            {/* Invocamos el formulario de tratamiento pasándole el ID de la consulta recién creada */}
                            <NewTreatmentForm 
                                consultationId={activeConsultationId} 
                                onTreatmentAdded={() => {
                                    // Cuando termina de recetar, podemos limpiar todo o mostrar un mensaje
                                    setConsultationSuccess('¡Tratamiento asignado! El paciente ya tiene sus recordatorios.');
                                    setTreatmentsVersion(v => v + 1);
                                }} 
                            />
                        </Box>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default DoctorSearch;