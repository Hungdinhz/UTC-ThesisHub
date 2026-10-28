import axios from 'axios';

export interface ChatRoomMember {
  userId?: number;
  profileId?: number;
  fullName: string;
  code?: string;
  className?: string;
  role: 'SUPERVISOR' | 'STUDENT' | string;
}

export interface ChatRoom {
  roomKey: string;
  projectRoundId: number;
  roundCode: string;
  roundName: string;
  roundStatus: string;
  lecturerId: number;
  lecturerName: string;
  lecturerDegree?: string;
  studentCount: number;
  members: ChatRoomMember[];
  lastMessagePreview?: string;
  lastSenderName?: string;
  lastMessageAt?: string;
  totalMessages?: number;
}

export interface ChatMessageItem {
  id: number;
  projectRoundId: number;
  lecturerId: number;
  senderUserId: number;
  senderName: string;
  senderRole: 'SUPERVISOR' | 'STUDENT' | string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  isMine?: boolean;
}

export interface SendChatMessagePayload {
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')}/chat`;

function authHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const chatService = {
  async getMyRooms(): Promise<ChatRoom[]> {
    const res = await axios.get(`${API_BASE}/rooms`, { headers: authHeaders() });
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  async getRoomMessages(roundId: number, lecturerId: number): Promise<ChatMessageItem[]> {
    const res = await axios.get(`${API_BASE}/rooms/${roundId}/${lecturerId}/messages`, {
      headers: authHeaders(),
    });
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  async sendMessage(
    roundId: number,
    lecturerId: number,
    payload: SendChatMessagePayload
  ): Promise<ChatMessageItem> {
    const res = await axios.post(`${API_BASE}/rooms/${roundId}/${lecturerId}/messages`, payload, {
      headers: authHeaders(),
    });
    return res.data?.data;
  },
};
