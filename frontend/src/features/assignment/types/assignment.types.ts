export interface ProjectDirection {
  id: number;
  name: string;
  description: string;
  projectRoundId: number;
}

export interface Lecturer {
  id: number;
  fullName: string;
  degree: string;
}

export interface PreferenceItem {
  lecturerId: number;
  priorityOrder: number;
}

export interface PreferenceSubmitRequest {
  projectDirectionId: number;
  preferences: PreferenceItem[];
  extraCriteria?: string;
}

export interface RegistrationResponse {
  id: number;
  studentId: number;
  projectDirectionId: number;
  status: 'PENDING' | 'LOCKED';
  preferences: PreferenceItem[];
  extraCriteria?: string;
}

export interface LecturerCapacityRequest {
  lecturerId: number;
  projectRoundId: number;
  baseQuota: number;
  capacityCoefficient: number;
}

export interface LecturerCapacityResponse {
  id: number;
  lecturerId: number;
  projectRoundId: number;
  baseQuota: number;
  capacityCoefficient: number;
  effectiveCapacity: number;
  assignedCount: number;
  remainingCapacity: number;
}

export interface SupervisorAssignment {
  id: number;
  studentId: number;
  lecturerId: number;
  projectRoundId: number;
  projectDirectionId: number;
  status: 'PROPOSED' | 'FINAL';
  preferenceOrder: number | null;
  score: number | null;
  reason: string;
}
