import axios from 'axios';

export interface ChatRoomMember {
  userId?: number;
  profileId?: number;
  fullName: string;
  code?: string;
  className?: string;
  role: 'SUPERVISOR' | 'STUDENT' | string;
  email?: string;
  phone?: string;
  directionName?: string;
  thesisTitle?: string;
  assignmentStatus?: string;
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
  lecturerCode?: string;
  lecturerEmail?: string;
  lecturerPhone?: string;
  departmentName?: string;
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
  senderCode?: string;
  senderSubtitle?: string;
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

const API_BASE_ROOT = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_ROOT,
  withCredentials: true,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('token');
}

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          const refreshToken =
            typeof localStorage !== 'undefined'
              ? localStorage.getItem('refresh_token') || localStorage.getItem('access_token')
              : null;

          refreshPromise = axios
            .post(
              `${API_BASE_ROOT}/auth/refresh`,
              { refreshToken, refresh: refreshToken },
              {
                withCredentials: true,
                headers: refreshToken ? { Authorization: `Bearer ${refreshToken}` } : undefined,
              }
            )
            .then((res) => {
              const rawData = res.data?.data || res.data;
              const access = rawData?.access || rawData?.token;
              const newRefresh = rawData?.refreshToken || rawData?.refresh;
              if (access && typeof localStorage !== 'undefined') {
                localStorage.setItem('access_token', access);
                if (newRefresh) {
                  localStorage.setItem('refresh_token', newRefresh);
                }
              }
              return access || null;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccess = await refreshPromise;
        if (newAccess) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          }
          return apiClient(originalRequest);
        }
      } catch {
        // Let caller handle auth error without hard redirect loop if polling
      }
    }
    return Promise.reject(error);
  }
);

export const chatService = {
  async getMyRooms(): Promise<ChatRoom[]> {
    const res = await apiClient.get('/chat/rooms');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  async getRoomMessages(roundId: number, lecturerId: number): Promise<ChatMessageItem[]> {
    const res = await apiClient.get(`/chat/rooms/${roundId}/${lecturerId}/messages`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  async sendMessage(
    roundId: number,
    lecturerId: number,
    payload: SendChatMessagePayload
  ): Promise<ChatMessageItem> {
    const res = await apiClient.post(`/chat/rooms/${roundId}/${lecturerId}/messages`, payload);
    return res.data?.data;
  },

  async deleteMessage(roundId: number, lecturerId: number, messageId: number): Promise<void> {
    await apiClient.delete(`/chat/rooms/${roundId}/${lecturerId}/messages/${messageId}`);
  },
};
