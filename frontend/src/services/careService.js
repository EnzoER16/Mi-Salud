const API_URL = 'http://localhost:5000/api/care';

async function call(path, method = 'GET', data) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'Error al comunicarse con MiSalud+.');
  return result;
}

export const getCareMembers = () => call('/members');
export const getCareInvitations = () => call('/invitations/mine');
export const getSharedPatients = () => call('/shared-with-me');
export const inviteCareMember = (data) => call('/invitations', 'POST', data);
export const acceptCareInvitation = (id) => call(`/invitations/${id}/accept`, 'POST');
export const declineCareInvitation = (id) => call(`/invitations/${id}/decline`, 'POST');
export const updateCarePermissions = (id, data) => call(`/members/${id}/permissions`, 'PATCH', data);
export const removeCareMember = (id) => call(`/members/${id}`, 'DELETE');

export const getSharedMedication = (patientId) => call(`/patients/${encodeURIComponent(patientId)}/medication`);
export const registerSharedIntake = (patientId, intakeId) => call(`/patients/${encodeURIComponent(patientId)}/intakes/${encodeURIComponent(intakeId)}/check`, 'PATCH');
export const getSharedActivity = (patientId) => call(`/patients/${encodeURIComponent(patientId)}/activity`);

export const getMyCareActivity = () => call('/my-activity');

export const getSharedMedicalRecord = (patientId) => call(`/patients/${encodeURIComponent(patientId)}/medical-record`);
