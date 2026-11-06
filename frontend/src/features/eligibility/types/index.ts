export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errorCode?: string;
  timestamp?: string;
}

export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'FORCE_APPROVED' | 'DISQUALIFIED' | 'RESERVED' | 'PENDING';

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

export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type ReservationReasonCategory =
  | 'INSUFFICIENT_CREDITS'
  | 'SUPERVISOR_NOT_ELIGIBLE'
  | 'RESEARCH_PROGRESS'
  | 'HEALTH_REASONS'
  | 'INTERNSHIP_WORK'
  | 'FAMILY_CIRCUMSTANCES'
  | 'OTHER';

export interface ReservationRequestItem {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  thesisId?: number;
  thesisTitle?: string;
  projectRoundId: number;
  roundCode?: string;
  reasonCategory?: ReservationReasonCategory | string;
  reason: string;
  evidenceFileUrl?: string;
  evidenceFileName?: string;
  supervisorApproved?: boolean;
  supervisorComment?: string;
  targetRoundCode?: string;
  status: ReservationStatus;
  reviewedBy?: string | number;
  reviewerName?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  note?: string;
  submittedAt: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservationSubmitRequest {
  studentId: number;
  thesisId?: number;
  projectRoundId?: number;
  reasonCategory?: ReservationReasonCategory | string;
  reason: string;
  evidenceFileUrl?: string;
  evidenceFileName?: string;
  targetRoundCode?: string;
  note?: string;
}

export interface AdminCreateReservationRequest {
  studentId: number;
  thesisId?: number;
  projectRoundId?: number;
  reasonCategory?: ReservationReasonCategory | string;
  reason?: string;
  evidenceFileUrl?: string;
  evidenceFileName?: string;
  targetRoundCode?: string;
  autoApprove?: boolean;
  reviewedBy?: number;
  note?: string;
}

export interface SupervisorReservationFeedback {
  supervisorId: number;
  approved: boolean;
  comment: string;
}

export interface ReservationReviewRequest {
  status: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  rejectionReason?: string;
  reviewedBy: string | number;
  note?: string;
}

export interface FinalDefenseEligibilityResponse {
  thesisId: number;
  thesisTitle: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  supervisorApproved?: boolean;
  supervisorScore: number;
  reviewerAssigned?: boolean;
  reviewerScore: number;
  plagiarismRate: number;
  thesisProgressPercentage?: number;
  allProgressStagesCompleted: boolean;
  eligibleForDefense: boolean;
  reasons: string[];

  // Reservation details
  hasPendingReservation?: boolean;
  reservationId?: number;
  reservationStatus?: ReservationStatus | string;
  reservationCategory?: ReservationReasonCategory | string;
  reservationReason?: string;
  studentRoundStatus?: string;
  completedCredits?: number;
  debtCredits?: number;
  missingPrerequisiteCount?: number;
  tuitionDebt?: boolean;
  underDisciplinaryAction?: boolean;
}
