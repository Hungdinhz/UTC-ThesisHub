import axios from 'axios';
import { ReviewGroup, Proposal, Thesis, Document } from '../types/thesis.types';

const API_BASE_URL = '/api';

export const thesisApi = {
  // Review Groups
  getReviewGroups: () => axios.get<ReviewGroup[]>(`${API_BASE_URL}/review-groups`).then(res => res.data),
  createReviewGroup: (data: Partial<ReviewGroup>) => axios.post<ReviewGroup>(`${API_BASE_URL}/review-groups`, data).then(res => res.data),
  
  // Proposals
  getProposals: (status?: string) => axios.get<Proposal[]>(`${API_BASE_URL}/proposals`, { params: { status } }).then(res => res.data),
  reviewProposal: (id: number, result: string, feedback: string, reviewerId: number) => 
    axios.put<Proposal>(`${API_BASE_URL}/proposals/${id}/review`, { result, feedback, reviewerId }).then(res => res.data),

  // Theses
  getTheses: (roundId?: number, status?: string) => 
    axios.get<Thesis[]>(`${API_BASE_URL}/theses`, { params: { roundId, status } }).then(res => res.data),
  createThesis: (data: Partial<Thesis>) => axios.post<Thesis>(`${API_BASE_URL}/theses`, data).then(res => res.data),
  updateThesis: (id: number, data: Partial<Thesis>) => axios.put<Thesis>(`${API_BASE_URL}/theses/${id}`, data).then(res => res.data),
  approveThesis: (id: number, status: string, notes: string) => 
    axios.put<Thesis>(`${API_BASE_URL}/theses/${id}/approve`, { status, notes }).then(res => res.data),

  // Documents
  getDocuments: (thesisId: number) => axios.get<Document[]>(`${API_BASE_URL}/documents`, { params: { thesisId } }).then(res => res.data),
  uploadDocument: (data: Partial<Document>) => axios.post<Document>(`${API_BASE_URL}/documents`, data).then(res => res.data),
};
