import { Box, Paper, Typography } from '@mui/material';
import Brand from './Brand';
import { cardSx, gradient } from '../theme';

// Contenedor compartido por Login y Registro
const AuthShell = ({ title, subtitle, children, footer }) => (
    <Box
        sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background:
                'radial-gradient(900px 420px at 8% -8%, rgba(26,115,217,0.12), transparent 70%),' +
                'radial-gradient(800px 480px at 100% 108%, rgba(45,184,154,0.16), transparent 70%),' +
                '#F3F8F9',
        }}
    >
        <Box sx={{ height: 4, background: gradient }} />

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Box sx={{ width: '100%', maxWidth: 440 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Brand size={64} center />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Tu bienestar, nuestra prioridad
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ ...cardSx, p: { xs: 3, sm: 4 } }}>
                    <Typography variant="h5">{title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {subtitle}
                    </Typography>
                    {children}
                </Paper>

                {footer && <Box sx={{ textAlign: 'center', mt: 3 }}>{footer}</Box>}
            </Box>
        </Box>
    </Box>
);

export default AuthShell;
