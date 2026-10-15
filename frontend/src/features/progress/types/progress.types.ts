export interface Task {
  id: number;
  thesisId: number;
  assigneeId: number;
  assigneeName: string;
  assignerId: number;
  assignerName: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: number;
  taskId: number;
  studentId: number;
  studentName: string;
  content?: string;
  fileUrl?: string;
  submittedAt: string;
  status: string;
  feedback?: string;
  reviewedAt?: string;
}

export interface Comment {
  id: number;
  taskId?: number;
  submissionId?: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ProgressFeedback {
  id: number;
  reportId: number;
  lecturerId: number;
  lecturerName: string;
  feedback: string;
  isSatisfactory: boolean;
  createdAt: string;
}

export interface ProgressReport {
  id: number;
  thesisId: number;
  studentId: number;
  studentName: string;
  title: string;
  content?: string;
  fileUrl?: string;
  reportDate: string;
  status: string;
  createdAt: string;
  feedbacks: ProgressFeedback[];
}
