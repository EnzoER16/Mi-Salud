import { Box, Typography } from '@mui/material';
import { colors } from '../theme';

// Logo (isotipo) + nombre. Usa /logo-icon.png de la carpeta public.
const Brand = ({ subtitle, size = 40, onClick, center = false }) => (
    <Box
        onClick={onClick}
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: center ? 'center' : 'flex-start',
            gap: 1.5,
            cursor: onClick ? 'pointer' : 'default',
        }}
    >
        <Box
            component="img"
            src="/logo-icon.png"
            alt="MiSalud+"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            sx={{ height: size, width: 'auto', objectFit: 'contain' }}
        />
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: size > 48 ? '1.6rem' : '1.15rem', lineHeight: 1.1, color: colors.navy }}>
                Mi
                <Box component="span" sx={{ color: colors.teal }}>Salud</Box>
                <Box component="span" sx={{ color: colors.green }}>+</Box>
            </Typography>
            {subtitle && (
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1, display: 'block', mt: 0.25 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
    </Box>
);

export default Brand;
