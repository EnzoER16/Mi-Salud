import { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Alert, Divider } from '@mui/material';
import { Scanner } from '@yudiel/react-qr-scanner';
// Importaremos esta función enseguida en api.js
import { getPatientByDni } from '../services/api';
import NewTreatmentForm from './NewTreatmentForm';

const DoctorSearch = () => {
    const [dniInput, setDniInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [activeConsultationId, setActiveConsultationId] = useState(null);
    const [startingConsultation, setStartingConsultation] = useState(false);

    // Función para buscar al paciente en el backend
    const handleSearch = async (dniToSearch) => {
        if (!dniToSearch) return;
        
        setLoading(true);
        setError('');
        setPatientData(null);
        setIsScanning(false); // Apagamos la cámara si estaba prendida

        try {
            const data = await getPatientByDni(dniToSearch);
            setPatientData(data);
        } catch (err) {
            setError(err.message || 'Paciente no encontrado o sin ficha médica.');
        } finally {
            setLoading(false);
            setDniInput(''); // Limpiamos el input
        }
    };

    const handleStartConsultation = async () => {
        setStartingConsultation(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            // Asegurate de que esta URL coincida con la ruta que creamos en Flask
            const response = await fetch(`http://localhost:5000/api/doctor/consultation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id_patient: patientData.id_patient })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message);

            // Guardamos el ID que nos devolvió Flask para pasárselo al formulario
            setActiveConsultationId(data.id_consultation);
            
        } catch (err) {
            setError(err.message || 'Error al iniciar la consulta');
        } finally {
            setStartingConsultation(false);
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" color="primary" gutterBottom>
                Buscar Paciente
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Controles de Búsqueda */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <TextField 
                    label="Ingresar DNI manualmente" 
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

            {/* Ventana del Escáner QR */}
            {isScanning && (
                <Box sx={{ maxWidth: 300, mx: 'auto', mb: 3, border: '2px solid #1976d2', borderRadius: 2, overflow: 'hidden' }}>
                    <Scanner 
                        // CORRECCIÓN: onScan recibe un array de resultados. Tomamos el primero y leemos 'rawValue'
                        onScan={(result) => {
                            if (result && result.length > 0) {
                                const textLeido = result[0].rawValue;
                                console.log("QR Leído:", textLeido);
                                handleSearch(textLeido);
                            }
                        }}
                        // Podemos apagar el escáner u ocultarlo apenas detecte algo
                        paused={loading} 
                    />
                </Box>
            )}

            {/* Resultados y Errores */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {patientData && (
                <Paper elevation={3} sx={{ p: 3, backgroundColor: '#fdfdfd', borderLeft: '5px solid #4caf50' }}>
                    <Typography variant="h6">Ficha del Paciente (DNI: {patientData.dni})</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}><strong>Grupo Sanguíneo:</strong> {patientData.medical_record?.blood_group || 'No especificado'}</Typography>
                    <Typography variant="body1"><strong>Alergias:</strong> {patientData.medical_record?.allergies || 'Ninguna'}</Typography>
                    <Typography variant="body1"><strong>Antecedentes:</strong> {patientData.medical_record?.antecedents || 'Ninguno'}</Typography>
                    
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button variant="contained" color="success">
                            Recetar Tratamiento
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default DoctorSearch;