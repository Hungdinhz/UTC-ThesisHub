export type CouncilRole = 'PRESIDENT' | 'SECRETARY' | 'MEMBER';

export interface CouncilMember {
  id: number;
  councilId?: number;
  lecturerId: number;
  lecturerName: string;
  role: CouncilRole;
  confirmed?: boolean;
}

export interface DefenseCouncil {
  id: number;
  projectRoundId: number;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  description?: string;
  members: CouncilMember[];
  studentIds: number[];
}

export interface CouncilGenerationRequest {
  projectRoundId?: number;
  maxStudentsPerCouncil?: number;
  overrideStudents?: Array<{
    studentId: string;
    thesisId: string;
    advisorId: string;
    reviewerId?: string;
  }>;
  overrideLecturers?: Array<{
    lecturerId: string;
    presidentEligible: boolean;
    secretaryEligible: boolean;
    memberEligible: boolean;
    currentLoad: number;
  }>;
}

export interface LecturerOption {
  lecturerId: number;
  fullName: string;
  email?: string;
  degree?: string;
  canBePresident: boolean;
  canBeSecretary: boolean;
  canBeMember: boolean;
  currentLoad: number;
}

export interface ReviewerAssignment {
  id: number;
  thesisId: number;
  thesisTitle?: string;
  studentName?: string;
  advisorId?: number;
  advisorName?: string;
  reviewerId: number;
  reviewerName: string;
  assignedBy?: string;
  assignedAt?: string;
  status: 'PENDING' | 'ASSIGNED' | 'REVIEWED' | 'CANCELLED';
  reviewFileUrl?: string;
  reviewNotes?: string;
  note?: string;
}

export interface ReviewerAssignRequest {
  thesisId: number;
  reviewerId: number;
  assignedBy: string;
  note?: string;
}

export type ScheduleSession = 'MORNING' | 'AFTERNOON';

export interface DefenseSchedule {
  id: number;
  councilId: number;
  councilName: string;
  defenseDate: string; // YYYY-MM-DD
  session: ScheduleSession;
  room: string;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  maxStudents: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface AutoScheduleRequest {
  projectRoundId?: number;
  councilIds?: number[];
  rooms?: string[];
  sessions?: string[];
  startDate?: string;
  endDate?: string;
  maxStudentsPerSession?: number;
}

export interface ScheduleConfig {
  councilId: number;
  defenseDate: string;
  session: string;
  room: string;
  startTime: string;
  endTime: string;
  maxStudents?: number;
  notes?: string;
}

export type ScoreType = 'SUPERVISOR' | 'REVIEWER' | 'COUNCIL';

export interface ScoreCriterion {
  name: string;
  maxScore: number;
  score: number;
  note?: string;
}

export interface ScoreItem {
  id: number;
  thesisId: number;
  graderId: number;
  graderName?: string;
  scoreType: ScoreType;
  score: number;
  feedback?: string;
  gradedAt?: string;
}

export interface ScoreSubmitRequest {
  thesisId: number;
  graderId: number;
  scoreType: ScoreType;
  score: number;
  feedback: string;
}

export type GradeClassification = 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'AVERAGE' | 'POOR';
export type FinalGraduationResult = 'PASSED' | 'FAILED';

export interface GraduationResult {
  id: number;
  thesisId: number;
  thesisTitle?: string;
  studentName?: string;
  studentCode?: string;
  supervisorScore: number;
  reviewerScore: number;
  councilScore: number;
  finalScore: number;
  grade: GradeClassification;
  finalResult: FinalGraduationResult;
  publishedAt?: string;
  notes?: string;
}

export interface SynthesizeResultRequest {
  thesisId: number;
  supervisorWeight?: number;
  reviewerWeight?: number;
  councilWeight?: number;
  notes?: string;
}
