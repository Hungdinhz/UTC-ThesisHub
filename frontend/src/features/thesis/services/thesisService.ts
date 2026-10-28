import axios from 'axios';
import type { Proposal, CreateProposalPayload, UpdateProposalPayload, ReviewGroup, Thesis, ThesisDocument } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const thesisService = {
  // Proposal APIs
  async createProposal(payload: CreateProposalPayload): Promise<Proposal> {
    const res = await apiClient.post('/proposals', payload);
    return res.data.data;
  },

  async updateProposal(id: number, payload: UpdateProposalPayload): Promise<Proposal> {
    const res = await apiClient.put(`/proposals/${id}`, payload);
    return res.data.data;
  },

  async getProposalById(id: number): Promise<Proposal> {
    const res = await apiClient.get(`/proposals/${id}`);
    return res.data.data;
  },

  async getProposalByStudentAndRound(studentId: number, roundId: number): Promise<Proposal> {
    const res = await apiClient.get('/proposals/by-student-and-round', {
      params: { studentId, roundId }
    });
    return res.data.data;
  },

  async submitProposal(id: number): Promise<Proposal> {
    const res = await apiClient.post(`/proposals/${id}/submit`);
    return res.data.data;
  },

  async supervisorApprove(id: number, approved: boolean, comment?: string): Promise<Proposal> {
    const res = await apiClient.post(`/proposals/${id}/supervisor-approve`, null, {
      params: { approved, comment }
    });
    return res.data.data;
  },

  async reviewProposal(id: number, reviewGroupId: number, status: string, evaluationNotes?: string): Promise<Proposal> {
    const res = await apiClient.post(`/proposals/${id}/reviews`, {
      reviewGroupId,
      status,
      evaluationNotes
    });
    return res.data.data;
  },

  async signProposal(id: number): Promise<Proposal> {
    const res = await apiClient.post(`/proposals/${id}/sign`);
    return res.data.data;
  },

  async searchProposals(params?: { roundId?: number; lecturerId?: number; studentId?: number; status?: string; search?: string }): Promise<Proposal[]> {
    const res = await apiClient.get('/proposals', { params });
    return res.data?.data?.content || res.data?.content || res.data?.data || res.data || [];
  },

  // Review Group APIs
  async getReviewGroupsByRound(roundId: number): Promise<ReviewGroup[]> {
    const res = await apiClient.get(`/review-groups/by-round/${roundId}`);
    return res.data.data;
  },

  // Thesis APIs
  async getThesisById(id: number): Promise<Thesis> {
    const res = await apiClient.get(`/theses/${id}`);
    return res.data.data;
  },

  async getThesisByCode(code: string): Promise<Thesis> {
    const res = await apiClient.get(`/theses/by-code/${code}`);
    return res.data.data;
  },

  async getThesisByStudentAndRound(studentId: number, roundId: number): Promise<Thesis> {
    const res = await apiClient.get('/theses/by-student-and-round', {
      params: { studentId, roundId }
    });
    return res.data.data;
  },

  async updateThesisCompletionRate(id: number, rate: number): Promise<Thesis> {
    const res = await apiClient.patch(`/theses/${id}/completion-rate`, null, {
      params: { rate }
    });
    return res.data.data;
  },

  async setDefenseEligible(id: number, eligible: boolean): Promise<Thesis> {
    const res = await apiClient.patch(`/theses/${id}/defense-eligible`, null, {
      params: { eligible }
    });
    return res.data.data;
  },

  async searchTheses(params?: { roundId?: number; lecturerId?: number; status?: string; search?: string }): Promise<Thesis[]> {
    const res = await apiClient.get('/theses', { params });
    return res.data.data.content || res.data.data;
  },

  // Document APIs
  async getDocumentsByThesis(thesisId: number): Promise<ThesisDocument[]> {
    const res = await apiClient.get(`/theses/${thesisId}/documents`);
    return res.data.data;
  },

  async uploadDocument(thesisId: number, uploaderId: number, payload: {
    name: string;
    documentType: string;
    fileUrl: string;
    description?: string;
  }): Promise<ThesisDocument> {
    const res = await apiClient.post(`/theses/${thesisId}/documents`, payload, {
      params: { uploaderId }
    });
    return res.data.data;
  }
};
