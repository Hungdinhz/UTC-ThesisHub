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
  directionIds?: number[];
  directionCodes?: string[];
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
  droppedCount?: number;
}

/**
 * Check if a lecturer's capacity record is assigned to a given project direction.
 * Accurately matches by directionIds, directionCodes, or directionNames.
 */
export const isLecturerAssignedToDirection = (
  capacity: LecturerCapacity,
  direction: ProjectDirection
): boolean => {
  if (!capacity || !direction) return false;

  // 1. Match by directionIds (Exact primary key match)
  if (capacity.directionIds && Array.isArray(capacity.directionIds) && capacity.directionIds.length > 0) {
    if (capacity.directionIds.includes(direction.id) || capacity.directionIds.includes(Number(direction.id))) {
      return true;
    }
  }

  // 2. Match by directionCodes (Exact code match, e.g. 'HD_PM_APP')
  if (capacity.directionCodes && Array.isArray(capacity.directionCodes) && capacity.directionCodes.length > 0) {
    const targetCode = direction.code.trim().toUpperCase();
    if (capacity.directionCodes.some((code) => code.trim().toUpperCase() === targetCode)) {
      return true;
    }
  }

  // 3. Match by directionNames (Fuzzy/case-insensitive name or code match)
  if (capacity.directionNames && Array.isArray(capacity.directionNames) && capacity.directionNames.length > 0) {
    const targetCode = direction.code.trim().toLowerCase();
    const targetName = direction.name.trim().toLowerCase();
    return capacity.directionNames.some((dn) => {
      const dnNorm = dn.trim().toLowerCase();
      return (
        dnNorm === targetCode ||
        dnNorm === targetName ||
        dnNorm.includes(targetCode) ||
        targetName.includes(dnNorm) ||
        dnNorm.includes(targetName)
      );
    });
  }

  return false;
};
