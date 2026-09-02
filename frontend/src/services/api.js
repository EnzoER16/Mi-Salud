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