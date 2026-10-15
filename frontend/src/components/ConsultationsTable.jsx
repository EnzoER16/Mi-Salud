import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { colors, cardSx } from '../theme';

const IconText = ({ icon, children }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ color: colors.teal, display: 'flex' }}>{icon}</Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{children}</Typography>
    </Box>
);

// Tabla de consultas compartida por el médico (con DNI del paciente) y el paciente
const ConsultationsTable = ({ rows, showPatientDni = false }) => (
    <TableContainer component={Paper} elevation={0} sx={{ ...cardSx, overflow: 'auto' }}>
        <Table sx={{ minWidth: 560 }}>
            <TableHead>
                <TableRow>
                    <TableCell>Fecha</TableCell>
                    {showPatientDni && <TableCell>DNI Paciente</TableCell>}
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Diagnóstico / Estado</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.map((row) => (
                    <TableRow key={row.id_consultation} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <IconText icon={<CalendarMonthOutlinedIcon fontSize="small" />}>{row.date}</IconText>
                        </TableCell>
                        {showPatientDni && (
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.patient_dni}</Typography>
                            </TableCell>
                        )}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <IconText icon={<PlaceOutlinedIcon fontSize="small" />}>{row.location}</IconText>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2">{row.diagnosis}</Typography>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);

export default ConsultationsTable;
