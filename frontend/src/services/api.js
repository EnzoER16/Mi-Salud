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