import { Paper, Box, Typography, Button } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

// Acceso rápido a "Mis turnos" desde el inicio del paciente
const AppointmentsCard = () => {
    const navigate = useNavigate();

    return (
        <Paper elevation={0} sx={{ ...cardSx, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <IconBadge tone="teal" size={40}><CalendarMonthOutlinedIcon /></IconBadge>
                <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>Mis turnos</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consultá tus turnos y agregá archivos, revisiones o fotos para cada visita.
            </Typography>
            <Button
                variant="outlined"
                startIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate('/appointments')}
                sx={{ textTransform: 'none', letterSpacing: 0 }}
            >
                Ver mis turnos
            </Button>
        </Paper>
    );
};

export default AppointmentsCard;
