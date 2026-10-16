export interface ProjectDirection {
  id: number;
  code: string;
  name: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
  isActive: boolean;
  lecturerCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LecturerDirection {
  id: number;
  lecturerId: number;
  lecturerCode: string;
  lecturerName: string;
  academicDegree: string;
  directionId: number;
  directionCode: string;
  directionName: string;
  isPrimary: boolean;
  note?: string;
  createdAt?: string;
}

export interface LecturerCapacity {
  id: number;
  lecturerId: number;
  lecturerCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  academicDegree: string;
  departmentId?: number;
  departmentName?: string;
  projectRoundId: number;
  maxQuota: number;
  capacityFactor: number;
  effectiveCapacity: number;
  currentAssigned: number;
  remainingCapacity: number;
  loadRatio: number;
  isActive: boolean;
  note?: string;
  directionNames?: string[];
}

export interface DirectionRegistration {
  id: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentClass?: string;
  trainingProgramCode?: string;
  projectRoundId: number;
  projectRoundCode?: string;
  directionId: number;
  directionCode?: string;
  directionName?: string;
  status: 'REGISTERED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  registeredAt: string;
  note?: string;
}

export interface PreferenceItem {
  priority: number; // 1, 2, 3
  lecturerId: number;
}

export interface PreferenceSubmitRequest {
  projectRoundId: number;
  studentId?: number;
  gpa?: number;
  prioritizationCriteria?: string;
  preferences: PreferenceItem[];
}

export interface PreferenceResponse {
  id: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  trainingProgramCode: string;
  projectRoundId: number;
  lecturerId: number;
  lecturerCode: string;
  lecturerName: string;
  academicDegree: string;
  priority: number;
  gpa?: number;
  prioritizationCriteria?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt?: string;
}

export interface SupervisorAssignment {
  id: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentClass?: string;
  trainingProgramCode?: string;
  lecturerId: number;
  lecturerCode: string;
  lecturerName: string;
  academicDegree: string;
  departmentName?: string;
  projectRoundId: number;
  directionId?: number;
  directionCode?: string;
  directionName?: string;
  matchedPriority?: number; // 1, 2, 3, 0 (fallback)
  matchScore?: number;
  assignmentMethod: 'ALGORITHM' | 'MANUAL_OVERRIDE' | 'DIRECT_ASSIGNMENT';
  status: 'PROPOSED' | 'OVERRIDDEN' | 'FINALIZED' | 'CANCELLED';
  isOverridden: boolean;
  previousLecturerId?: number;
  previousLecturerName?: string;
  overrideReason?: string;
  overriddenAt?: string;
  finalizedAt?: string;
  note?: string;
}

export interface AssignmentStats {
  projectRoundId: number;
  totalStudents: number;
  totalAssigned: number;
  matchedNv1: number;
  nv1Rate: number;
  matchedNv2: number;
  nv2Rate: number;
  matchedNv3: number;
  nv3Rate: number;
  matchedFallback: number;
  unassignedCount: number;
  overriddenCount: number;
  finalizedCount: number;
  totalLecturers: number;
  totalCapacity: number;
  averageLoadRatio: number;
}
