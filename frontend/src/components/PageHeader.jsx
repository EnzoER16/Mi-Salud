import { Box, Typography } from '@mui/material';
import { colors } from '../theme';

// Encabezado de página: etiqueta chica arriba ("INICIO"), título grande y subtítulo opcional
const PageHeader = ({ eyebrow, title, subtitle, action }) => (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
        <Box>
            {eyebrow && (
                <Typography
                    sx={{
                        color: colors.teal,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        mb: 0.5,
                    }}
                >
                    {eyebrow}
                </Typography>
            )}
            <Typography variant="h4" sx={{ fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>{title}</Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
        {action}
    </Box>
);

export default PageHeader;
