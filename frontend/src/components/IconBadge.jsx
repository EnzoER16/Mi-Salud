import { Box } from '@mui/material';
import { colors } from '../theme';

const tones = {
    blue: { bg: '#E8F1FC', fg: colors.blue },
    teal: { bg: '#E6F5F7', fg: colors.teal },
    green: { bg: '#EEF6E4', fg: '#5C9A22' },
    amber: { bg: '#FFF4E0', fg: '#B26A00' },
};

// Cuadradito redondeado con un ícono adentro (se ve en el boceto junto a "Buscar Paciente")
const IconBadge = ({ children, tone = 'teal', size = 44 }) => {
    const { bg, fg } = tones[tone] || tones.teal;
    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: 2.5,
                bgcolor: bg,
                color: fg,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
            }}
        >
            {children}
        </Box>
    );
};

export default IconBadge;
