import axios from 'axios';
import type { Proposal, CreateProposalPayload, ReviewGroup, Thesis, ThesisDocument } from '../types';

const API_BASE = '/api/v1';

export const thesisService = {
  // Proposal APIs
  async createProposal(payload: CreateProposalPayload): Promise<Proposal> {
    const res = await axios.post(`${API_BASE}/proposals`, payload);
    return res.data.data;
  },

  async getProposalById(id: number): Promise<Proposal> {
    const res = await axios.get(`${API_BASE}/proposals/${id}`);
    return res.data.data;
  },

  async getProposalByStudentAndRound(studentId: number, roundId: number): Promise<Proposal> {
    const res = await axios.get(`${API_BASE}/proposals/by-student-and-round`, {
      params: { studentId, roundId }
    });
    return res.data.data;
  },

  async submitProposal(id: number): Promise<Proposal> {
    const res = await axios.post(`${API_BASE}/proposals/${id}/submit`);
    return res.data.data;
  },

  async supervisorApprove(id: number, approved: boolean, comment?: string): Promise<Proposal> {
    const res = await axios.post(`${API_BASE}/proposals/${id}/supervisor-approve`, null, {
      params: { approved, comment }
    });
    return res.data.data;
  },

  async reviewProposal(id: number, reviewGroupId: number, status: string, evaluationNotes?: string): Promise<Proposal> {
    const res = await axios.post(`${API_BASE}/proposals/${id}/reviews`, {
      reviewGroupId,
      status,
      evaluationNotes
    });
    return res.data.data;
  },

  async searchProposals(params?: { roundId?: number; lecturerId?: number; status?: string; search?: string }): Promise<Proposal[]> {
    const res = await axios.get(`${API_BASE}/proposals`, { params });
    return res.data.data.content || res.data.data;
  },

  // Review Group APIs
  async getReviewGroupsByRound(roundId: number): Promise<ReviewGroup[]> {
    const res = await axios.get(`${API_BASE}/review-groups/by-round/${roundId}`);
    return res.data.data;
  },

  // Thesis APIs
  async getThesisById(id: number): Promise<Thesis> {
    const res = await axios.get(`${API_BASE}/theses/${id}`);
    return res.data.data;
  },

  async getThesisByCode(code: string): Promise<Thesis> {
    const res = await axios.get(`${API_BASE}/theses/by-code/${code}`);
    return res.data.data;
  },

  async getThesisByStudentAndRound(studentId: number, roundId: number): Promise<Thesis> {
    const res = await axios.get(`${API_BASE}/theses/by-student-and-round`, {
      params: { studentId, roundId }
    });
    return res.data.data;
  },

  async updateThesisCompletionRate(id: number, rate: number): Promise<Thesis> {
    const res = await axios.patch(`${API_BASE}/theses/${id}/completion-rate`, null, {
      params: { rate }
    });
    return res.data.data;
  },

  async searchTheses(params?: { roundId?: number; lecturerId?: number; status?: string; search?: string }): Promise<Thesis[]> {
    const res = await axios.get(`${API_BASE}/theses`, { params });
    return res.data.data.content || res.data.data;
  },

  // Document APIs
  async getDocumentsByThesis(thesisId: number): Promise<ThesisDocument[]> {
    const res = await axios.get(`${API_BASE}/theses/${thesisId}/documents`);
    return res.data.data;
  },

  async uploadDocument(thesisId: number, uploaderId: number, payload: {
    name: string;
    documentType: string;
    fileUrl: string;
    description?: string;
  }): Promise<ThesisDocument> {
    const res = await axios.post(`${API_BASE}/theses/${thesisId}/documents`, payload, {
      params: { uploaderId }
    });
    return res.data.data;
  }
};
