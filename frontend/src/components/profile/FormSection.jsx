import { Paper, Box, Typography } from '@mui/material';
import IconBadge from '../IconBadge';
import { cardSx } from '../../theme';

// Tarjeta con título e ícono que agrupa campos de un formulario ("Datos personales", "Domicilio", etc.)
const FormSection = ({ icon, tone = 'teal', title, description, action, children, columns = 2 }) => (
    <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            {icon && <IconBadge tone={tone} size={40}>{icon}</IconBadge>}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>{title}</Typography>
                {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
            </Box>
            {action}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: columns === 1 ? '1fr' : '1fr 1fr' }, gap: 2.5 }}>
            {children}
        </Box>
    </Paper>
);

// Para que un campo ocupe todo el ancho de la grilla
export const fullWidth = { gridColumn: { sm: '1 / -1' } };

export default FormSection;
