export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errorCode?: string;
  timestamp?: string;
}

export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'FORCE_APPROVED' | 'DISQUALIFIED' | 'PENDING';

export interface EligibilityCheckResponse {
  studentId: number;
  studentCode: string;
  studentName: string;
  gpa: number;
  accumulatedCredits: number;
  unpassedPrerequisites: string[];
  eligible: boolean;
  reason: string;
  projectRoundId?: number;
  status: EligibilityStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ForceApproveRequest {
  studentId: number;
  projectRoundId?: number;
  reason: string;
  approvedBy: string;
}

export interface DisqualifyRequest {
  studentId: number;
  projectRoundId?: number;
  reason: string;
  disqualifiedBy: string;
}

export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReservationRequestItem {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  projectRoundId: number;
  reason: string;
  evidenceFileUrl?: string;
  status: ReservationStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface ReservationSubmitRequest {
  studentId: number;
  projectRoundId: number;
  reason: string;
  evidenceFileUrl?: string;
}

export interface ReservationReviewRequest {
  status: 'APPROVED' | 'REJECTED';
  reviewNotes: string;
  reviewedBy: string;
}

export interface FinalDefenseEligibilityResponse {
  thesisId: number;
  thesisTitle: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  supervisorScore: number;
  reviewerScore: number;
  plagiarismRate: number;
  allProgressStagesCompleted: boolean;
  eligibleForDefense: boolean;
  reasons: string[];
}
