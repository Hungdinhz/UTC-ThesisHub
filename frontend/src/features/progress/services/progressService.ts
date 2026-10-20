import axios from 'axios';
import type {
  Task,
  CreateTaskPayload,
  Submission,
  Comment,
  ProgressReport,
  ThesisProgressSummary
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

export const progressService = {
  // Task APIs
  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const res = await axios.post(`${API_BASE}/tasks`, payload);
    return res.data.data;
  },

  async updateTask(id: number, payload: Partial<Task>): Promise<Task> {
    const res = await axios.put(`${API_BASE}/tasks/${id}`, payload);
    return res.data.data;
  },

  async getTasksByThesis(thesisId: number): Promise<Task[]> {
    const res = await axios.get(`${API_BASE}/tasks/by-thesis/${thesisId}`);
    return res.data.data;
  },

  async getTaskById(id: number): Promise<Task> {
    const res = await axios.get(`${API_BASE}/tasks/${id}`);
    return res.data.data;
  },

  async deleteTask(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/tasks/${id}`);
  },

  // Submission APIs
  async submitTask(taskId: number, studentId: number, content: string, fileUrl?: string): Promise<Submission> {
    const res = await axios.post(`${API_BASE}/submissions/by-task/${taskId}`, {
      studentId,
      submissionContent: content,
      fileUrl
    });
    return res.data.data;
  },

  async reviewSubmission(submissionId: number, status: 'ACCEPTED' | 'REVISE_REQUIRED' | 'REJECTED', reviewFeedback?: string): Promise<Submission> {
    const res = await axios.post(`${API_BASE}/submissions/${submissionId}/review`, {
      status,
      reviewFeedback
    });
    return res.data.data;
  },

  async getSubmissionsByTask(taskId: number): Promise<Submission[]> {
    const res = await axios.get(`${API_BASE}/submissions/by-task/${taskId}`);
    return res.data.data;
  },

  // Comment APIs
  async addComment(taskId: number, userId: number, content: string, parentId?: number, attachmentUrl?: string): Promise<Comment> {
    const res = await axios.post(`${API_BASE}/comments/by-task/${taskId}`, {
      userId,
      parentId,
      content,
      attachmentUrl
    });
    return res.data.data;
  },

  async getCommentsByTask(taskId: number): Promise<Comment[]> {
    const res = await axios.get(`${API_BASE}/comments/by-task/${taskId}`);
    return res.data.data;
  },

  // Progress Report APIs
  async createProgressReport(thesisId: number, payload: {
    studentId: number;
    milestoneId?: number;
    reportTitle: string;
    completedWork: string;
    plannedWork: string;
    difficulties?: string;
    progressPercent: number;
    fileUrl?: string;
  }): Promise<ProgressReport> {
    const res = await axios.post(`${API_BASE}/progress-reports/by-thesis/${thesisId}`, payload);
    return res.data.data;
  },

  async feedbackProgressReport(reportId: number, payload: {
    lecturerId: number;
    feedbackContent: string;
    assessment: string;
    confirmedCompletionRate?: number;
  }): Promise<ProgressReport> {
    const res = await axios.post(`${API_BASE}/progress-reports/${reportId}/feedback`, payload);
    return res.data.data;
  },

  async getReportsByThesis(thesisId: number): Promise<ProgressReport[]> {
    const res = await axios.get(`${API_BASE}/progress-reports/by-thesis/${thesisId}`);
    return res.data.data;
  },

  // Summary API for Module 4 integration
  async getThesisProgressSummary(thesisId: number): Promise<ThesisProgressSummary> {
    const res = await axios.get(`${API_BASE}/progress-reports/by-thesis/${thesisId}/summary`);
    return res.data.data;
  }
};
