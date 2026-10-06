import axios from 'axios';
import { Task, Submission, Comment, ProgressReport, ProgressFeedback } from '../types/progress.types';

const API_BASE_URL = '/api';

export const progressApi = {
  // Tasks
  getTasks: (thesisId: number) => axios.get<Task[]>(`${API_BASE_URL}/tasks`, { params: { thesisId } }).then(res => res.data),
  createTask: (data: Partial<Task>) => axios.post<Task>(`${API_BASE_URL}/tasks`, data).then(res => res.data),
  updateTask: (id: number, data: Partial<Task>) => axios.put<Task>(`${API_BASE_URL}/tasks/${id}`, data).then(res => res.data),

  // Submissions
  submitTask: (id: number, data: Partial<Submission>) => axios.post<Submission>(`${API_BASE_URL}/tasks/${id}/submit`, data).then(res => res.data),
  reviewSubmission: (id: number, status: string, feedback: string) => 
    axios.put<Submission>(`${API_BASE_URL}/submissions/${id}/review`, { status, feedback }).then(res => res.data),

  // Comments
  getComments: (taskId: number) => axios.get<Comment[]>(`${API_BASE_URL}/tasks/${taskId}/comments`).then(res => res.data),
  addComment: (taskId: number, data: Partial<Comment>) => axios.post<Comment>(`${API_BASE_URL}/tasks/${taskId}/comments`, data).then(res => res.data),

  // Progress Reports
  getReports: (thesisId: number) => axios.get<ProgressReport[]>(`${API_BASE_URL}/progress-reports`, { params: { thesisId } }).then(res => res.data),
  createReport: (data: Partial<ProgressReport>) => axios.post<ProgressReport>(`${API_BASE_URL}/progress-reports`, data).then(res => res.data),
  addFeedback: (id: number, data: Partial<ProgressFeedback>) => 
    axios.post<ProgressFeedback>(`${API_BASE_URL}/progress-reports/${id}/feedback`, data).then(res => res.data),
};
