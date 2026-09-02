import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CompleteProfile from './pages/CompleteProfile';
import MedicalRecord from './pages/MedicalRecord';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return <div>Cargando...</div>;
    if (!user) return <Navigate to="/login" replace />;
    
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Ruta protegida */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />

                    <Route 
                        path="/complete-profile" 
                        element={
                            <ProtectedRoute>
                                <CompleteProfile />
                            </ProtectedRoute>
                        } 
                    />

                    <Route
                        path="/medical-record"
                        element={
                            <ProtectedRoute>
                                <MedicalRecord />
                            </ProtectedRoute>
                        }
                    />

                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;