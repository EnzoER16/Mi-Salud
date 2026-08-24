import { useContext } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2, background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)' }}>
                <Typography variant="h4" color="primary" gutterBottom>
                    Bienvenido, {user?.username}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
                    Rol: {user?.role}
                </Typography>
                
                <Button variant="outlined" color="error" onClick={handleLogout}>
                    Cerrar Sesión
                </Button>
            </Paper>
        </Box>
    );
};

export default Dashboard;