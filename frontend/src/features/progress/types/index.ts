export interface Task {
  id: number;
  thesisId: number;
  thesisTitle?: string;
  createdById: number;
  createdByFullName?: string;
  assignedToId: number;
  assignedToFullName?: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISE' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  completedAt?: string;
  submissionCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  thesisId: number;
  createdById: number;
  assignedToId: number;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
}

export interface Submission {
  id: number;
  taskId: number;
  taskTitle?: string;
  studentId: number;
  studentCode?: string;
  studentFullName?: string;
  title?: string;
  submissionContent?: string;
  fileUrl?: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REVISE_REQUIRED' | 'REJECTED';
  reviewFeedback?: string;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  userFullName?: string;
  userAvatarUrl?: string;
  parentId?: number;
  content: string;
  attachmentUrl?: string;
  isEdited: boolean;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressFeedback {
  id: number;
  progressReportId: number;
  lecturerId: number;
  lecturerFullName?: string;
  feedbackContent: string;
  assessment: 'DAT' | 'KHONG_DAT' | 'XUAT_SAC' | 'CAN_CO_GANG';
  confirmedCompletionRate?: number;
  feedbackAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressReport {
  id: number;
  thesisId: number;
  thesisTitle?: string;
  studentId: number;
  studentCode?: string;
  studentFullName?: string;
  milestoneId?: number;
  milestoneName?: string;
  reportTitle: string;
  completedWork: string;
  plannedWork: string;
  difficulties?: string;
  progressPercent: number;
  fileUrl?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED';
  submittedAt: string;
  feedback?: ProgressFeedback;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisProgressSummary {
  thesisId: number;
  thesisCode: string;
  studentId: number;
  studentCode: string;
  studentFullName: string;
  lecturerId: number;
  lecturerFullName: string;
  status: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionPercent: number;
  totalProgressReports: number;
  latestReportPercent?: number;
  latestAssessment?: string;
  defenseEligible: boolean;
  readyForDefense: boolean;
}
