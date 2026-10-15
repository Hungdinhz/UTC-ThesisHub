export interface ReviewGroupMember {
  id: number;
  lecturerId: number;
  lecturerName: string;
  role: string;
}

export interface ReviewGroup {
  id: number;
  projectRoundId: number;
  name: string;
  description?: string;
  status: string;
  members: ReviewGroupMember[];
}

export interface Proposal {
  id: number;
  thesisId: number;
  title: string;
  content?: string;
  fileUrl?: string;
  status: string;
  version: number;
  submittedAt?: string;
  createdAt: string;
}

export interface Thesis {
  id: number;
  projectRoundId: number;
  studentId: number;
  studentName: string;
  lecturerId: number;
  lecturerName: string;
  title: string;
  englishTitle?: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  thesisId: number;
  docType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedBy: number;
  uploadedByName: string;
  version: number;
  status: string;
  createdAt: string;
}
