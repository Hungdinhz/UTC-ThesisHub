import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

export interface FileUploadResponse {
  fileName: string;
  fileDownloadUri: string;
  fileType: string;
  size: number;
}

export const fileUploadService = {
  async uploadFile(file: File, onProgress?: (percent: number) => void): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await axios.post(`${API_BASE}/files/upload`, formData, {
      headers,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data.data;
  },
};
