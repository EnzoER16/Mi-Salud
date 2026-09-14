const API_URL = "http://localhost:5000/api"; // Ajusta el puerto al que use tu backend en Flask

export const loginUser = async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al iniciar sesión");
    }
    
    return response.json(); // Devuelve { token, user }
};

export const registerUser = async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar usuario");
    }
    
    return response.json();
};

export const loginWithGoogle = async (googleToken) => {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // El backend espera recibir { "token": "..." }
        body: JSON.stringify({ token: googleToken }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al autenticar con Google");
    }
    
    return response.json(); // Devuelve { token, user }
};

export const createProfile = async (profileData, role) => {
    const token = localStorage.getItem('token');
    
    // Determinamos a qué endpoint apuntar según el rol
    const endpoint = role === 'Paciente' ? '/patient/profile' : '/doctor/profile';

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Enviamos el JWT para pasar la seguridad
        },
        body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar el perfil");
    }
    
    return response.json();
};

export const getProfile = async (role) => {
    const token = localStorage.getItem('token');
    const endpoint = role === 'Paciente' ? '/patient/profile' : '/doctor/profile';

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: { 
            "Authorization": `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        // Si el backend nos dice que no encontró el perfil, devolvemos null
        if (response.status === 404) {
            return null;
        }
        // Si es otro tipo de error, lo lanzamos
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener el perfil");
    }
    
    return response.json(); // Devuelve los datos del paciente o del médico
};

export const getMedicalRecord = async () => {
    const token = localStorage.getItem('token');
    
    // CORRECCIÓN: Apuntamos a /medical-record/ (con la barra al final)
    const response = await fetch(`${API_URL}/medical-record/`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!response.ok) {
        if (response.status === 404) return null; 
        throw new Error("Error al obtener la ficha médica");
    }
    return response.json();
};

export const saveMedicalRecord = async (recordData) => {
    const token = localStorage.getItem('token');
    
    // CORRECCIÓN: Apuntamos a /medical-record/ (con la barra al final)
    const response = await fetch(`${API_URL}/medical-record/`, {
        method: "POST", 
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(recordData),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar la ficha médica");
    }
    return response.json();
};

export const getPatientByDni = async (dni) => {
    const token = localStorage.getItem('token');
    
    // Asumimos que vas a crear esta ruta en tu Flask
    const response = await fetch(`${API_URL}/doctor/patient/${dni}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    
    return handleResponse(response);
};

// 1. ESTA ES LA FUNCIÓN QUE FALTABA O ESTABA MAL UBICADA
const handleResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login'; 
        throw new Error("Tu sesión ha expirado.");
    }
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error de comunicación con el servidor");
    }
    if (response.status === 204) return true;
    return response.json();
};