import { Box, Typography } from '@mui/material';
import { colors } from '../theme';

// Título de sección con la barrita verde a la izquierda (como en el boceto)
const SectionTitle = ({ children }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box sx={{ width: 4, height: 22, borderRadius: 2, bgcolor: colors.green }} />
        <Typography variant="h6">{children}</Typography>
    </Box>
);

export default SectionTitle;
