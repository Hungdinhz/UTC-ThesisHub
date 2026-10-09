import type { ProjectDirection, Lecturer, PreferenceSubmitRequest, RegistrationResponse, LecturerCapacityRequest, LecturerCapacityResponse, SupervisorAssignment } from '../types/assignment.types';

// Mocking API base URL and fetch wrapper for demonstration
const API_BASE_URL = '/api/v1/assignments';

async function fetchWrapper<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Assuming a token would be added here normally
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API Error');
  }
  
  return response.json();
}

export const assignmentApi = {
  getAvailableDirections: (projectRoundId: number) => 
    fetchWrapper<ProjectDirection[]>(`/directions?projectRoundId=${projectRoundId}`),
    
  getLecturersForDirection: (directionId: number) =>
    fetchWrapper<Lecturer[]>(`/directions/${directionId}/lecturers`),
    
  getMyPreferences: (projectRoundId: number) =>
    fetchWrapper<RegistrationResponse>(`/preferences/me?projectRoundId=${projectRoundId}`),
    
  submitPreferences: (data: PreferenceSubmitRequest) =>
    fetchWrapper<RegistrationResponse>('/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updatePreferences: (registrationId: number, data: PreferenceSubmitRequest) =>
    fetchWrapper<RegistrationResponse>(`/preferences/${registrationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  getCapacitiesByProjectRound: (projectRoundId: number) =>
    fetchWrapper<LecturerCapacityResponse[]>(`/lecturer-capacities?projectRoundId=${projectRoundId}`),
    
  getCapacityByLecturerAndRound: (lecturerId: number, projectRoundId: number) =>
    fetchWrapper<LecturerCapacityResponse>(`/lecturer-capacities/${lecturerId}?projectRoundId=${projectRoundId}`),
    
  createCapacity: (data: LecturerCapacityRequest) =>
    fetchWrapper<LecturerCapacityResponse>('/lecturer-capacities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updateCapacity: (id: number, data: LecturerCapacityRequest) =>
    fetchWrapper<LecturerCapacityResponse>(`/lecturer-capacities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  getAllRegistrations: (projectRoundId: number) =>
    fetchWrapper<RegistrationResponse[]>(`/registrations?projectRoundId=${projectRoundId}`),
    
  getAvailableLecturers: (projectRoundId: number, directionId?: number) =>
    fetchWrapper<LecturerCapacityResponse[]>(`/lecturer-capacities/available?projectRoundId=${projectRoundId}${directionId ? `&directionId=${directionId}` : ''}`),
    
  generateAssignments: (projectRoundId: number) =>
    fetchWrapper<SupervisorAssignment[]>(`/generate?projectRoundId=${projectRoundId}`, { method: 'POST' }),
    
  getProposals: (projectRoundId: number) =>
    fetchWrapper<SupervisorAssignment[]>(`/proposals?projectRoundId=${projectRoundId}`),
    
  overrideAssignment: (id: number, newLecturerId: number, reason: string) =>
    fetchWrapper<SupervisorAssignment>(`/${id}/override`, {
      method: 'PUT',
      body: JSON.stringify({ newLecturerId, reason }),
    }),
    
  finalizeAssignments: (projectRoundId: number) =>
    fetchWrapper<string>(`/finalize?projectRoundId=${projectRoundId}`, { method: 'POST' }),
};
