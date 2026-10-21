export interface Proposal {
  id: number;
  projectRoundId: number;
  projectRoundName?: string;
  studentId: number;
  studentCode?: string;
  studentFullName?: string;
  studentClass?: string;
  lecturerId: number;
  lecturerCode?: string;
  lecturerFullName?: string;
  lecturerDegree?: string;
  titleVn: string;
  titleEn?: string;
  description?: string;
  objectives?: string;
  expectedResults?: string;
  researchContent?: string;
  fileUrl?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ASSIGNED' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISE_REQUIRED' | 'REJECTED';
  supervisorApproved: boolean;
  supervisorComment?: string;
  version: number;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalPayload {
  projectRoundId: number;
  studentId: number;
  lecturerId: number;
  titleVn: string;
  titleEn?: string;
  description?: string;
  objectives?: string;
  expectedResults?: string;
  researchContent?: string;
  fileUrl?: string;
}

export interface UpdateProposalPayload {
  titleVn?: string;
  titleEn?: string;
  description?: string;
  objectives?: string;
  expectedResults?: string;
  researchContent?: string;
  fileUrl?: string;
}

export interface ReviewGroupMember {
  id: number;
  lecturerId: number;
  lecturerCode?: string;
  lecturerFullName?: string;
  academicDegree?: string;
  role: 'LEADER' | 'SECRETARY' | 'MEMBER';
}

export interface ReviewGroup {
  id: number;
  projectRoundId: number;
  projectRoundName?: string;
  departmentId?: number;
  departmentName?: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISSOLVED';
  members: ReviewGroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Thesis {
  id: number;
  proposalId?: number;
  projectRoundId: number;
  projectRoundName?: string;
  studentId: number;
  studentCode?: string;
  studentFullName?: string;
  studentClass?: string;
  lecturerId: number;
  lecturerCode?: string;
  lecturerFullName?: string;
  lecturerDegree?: string;
  thesisCode: string;
  titleVn: string;
  titleEn?: string;
  description?: string;
  objectives?: string;
  scope?: string;
  technologies?: string;
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DEFENSE_READY' | 'COMPLETED' | 'CANCELLED';
  completionRate: number;
  defenseEligible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisDocument {
  id: number;
  thesisId: number;
  uploaderId: number;
  uploaderFullName?: string;
  name: string;
  documentType: 'PROPOSAL' | 'INTERIM_REPORT' | 'FINAL_REPORT' | 'SOURCE_CODE' | 'PRESENTATION_SLIDE' | 'DEFENSE_MINUTES' | 'OTHER';
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  version: number;
  isLatest: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
