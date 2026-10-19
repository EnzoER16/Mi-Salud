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

export const getDoctorHistory = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/doctor/history`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const getPatientHistory = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/patient/history`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const createConsultation = async (patientId, consultationData) => {
    const token = localStorage.getItem('token');
    
    // Apuntamos a la ruta de Flask: POST /api/consultation/<patient_id>
    const response = await fetch(`${API_URL}/consultation/${patientId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(consultationData)
    });
    
    return handleResponse(response);
};

export const getTodaysIntakes = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/intake/today`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const checkIntake = async (intakeId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/intake/${intakeId}/check`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const getMyTreatments = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/treatment/my-treatments`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};
export const getPatientTreatments = async (patientId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/treatment/patient/${patientId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const updateTreatment = async (treatmentId, changes) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/treatment/${treatmentId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(changes)
    });
    return handleResponse(response);
};

export const getTreatmentHistory = async (treatmentId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/treatment/${treatmentId}/history`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const getNotifications = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/notifications/my`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const markNotificationRead = async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const markAllNotificationsRead = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const getMedications = async () => {
    const token = localStorage.getItem('token');
    // La barra final es importante: la ruta de Flask es "/api/medication/"
    const response = await fetch(`${API_URL}/medication/`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const generateAISummary = async (patientId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/doctor/patient/${patientId}/ai-summary`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};
// ===================== MIS TURNOS (turnos, archivos y notas del paciente) =====================

// A diferencia de handleResponse, acá un 404 también es un error (turno borrado, archivo inexistente...)
const appointmentResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error("Tu sesión ha expirado.");
    }
    if (!response.ok) {
        let message = "Error de comunicación con el servidor";
        try {
            message = (await response.json()).message || message;
        } catch {
            // la respuesta no traía JSON: dejamos el mensaje por defecto
        }
        throw new Error(message);
    }
    return response;
};

const authHeaders = (extra = {}) => ({
    "Authorization": `Bearer ${localStorage.getItem('token')}`,
    ...extra
});

const requestJson = async (path, method = "GET", body) => {
    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: authHeaders(body ? { "Content-Type": "application/json" } : {}),
        body: body ? JSON.stringify(body) : undefined
    });
    return (await appointmentResponse(response)).json();
};

// La barra final de "/appointments/" es importante: así está definida la ruta en Flask
export const getAppointments = () => requestJson("/appointments/");
export const getAppointment = (id) => requestJson(`/appointments/${id}`);
export const createAppointment = (data) => requestJson("/appointments/", "POST", data);
export const updateAppointment = (id, data) => requestJson(`/appointments/${id}`, "PATCH", data);
export const deleteAppointment = (id) => requestJson(`/appointments/${id}`, "DELETE");

export const addAppointmentNote = (appointmentId, data) => requestJson(`/appointments/${appointmentId}/notes`, "POST", data);
export const updateAppointmentNote = (noteId, data) => requestJson(`/appointments/notes/${noteId}`, "PATCH", data);
export const deleteAppointmentNote = (noteId) => requestJson(`/appointments/notes/${noteId}`, "DELETE");

export const deleteAppointmentFile = (fileId) => requestJson(`/appointments/files/${fileId}`, "DELETE");

// Sube UN archivo (el navegador arma solo el Content-Type multipart, por eso no lo ponemos)
export const uploadAppointmentFile = async (appointmentId, file) => {
    const formData = new FormData();
    formData.append("files", file);
    const response = await fetch(`${API_URL}/appointments/${appointmentId}/files`, {
        method: "POST",
        headers: authHeaders(),
        body: formData
    });
    return (await appointmentResponse(response)).json();
};

// Los archivos son privados: se piden con el token y se devuelven como Blob
// (para mostrarlos o descargarlos desde el navegador, ya que un <img src> no puede mandar el token)
export const fetchAppointmentFile = async (fileId, { download = false } = {}) => {
    const response = await fetch(`${API_URL}/appointments/files/${fileId}${download ? "?download=1" : ""}`, {
        method: "GET",
        headers: authHeaders()
    });
    return (await appointmentResponse(response)).blob();
};
