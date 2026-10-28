export const extractFileName = (url?: string): string => {
  if (!url) return '';
  try {
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');
    const last = decodeURIComponent(parts[parts.length - 1]);
    const underscoreIdx = last.indexOf('_');
    // If it starts with UUID (36 chars) followed by underscore
    if (underscoreIdx >= 32 && underscoreIdx <= 40) {
      return last.substring(underscoreIdx + 1);
    }
    return last;
  } catch {
    return url;
  }
};

export const resolveFileUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  let serverOrigin = '';
  try {
    serverOrigin = new URL(apiBase, window.location.origin).origin;
  } catch {
    serverOrigin = window.location.origin;
  }

  // Chuẩn hóa mọi URL có chứa /api/v1/files/download/... (kể cả URL cũ gắn localhost:8080 trong DB)
  const downloadMarker = '/api/v1/files/download/';
  const markerIdx = trimmed.indexOf(downloadMarker);
  if (markerIdx >= 0) {
    const relativeDownloadPath = trimmed.substring(markerIdx);
    return `${serverOrigin}${relativeDownloadPath}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (!trimmed.startsWith('/') && !trimmed.includes('/')) {
    return `${serverOrigin}/api/v1/files/download/${encodeURIComponent(trimmed)}`;
  }

  return `${serverOrigin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

export const getFileIcon = (url?: string): string => {
  if (!url) return '📄';
  const lower = url.split('?')[0].toLowerCase();
  if (lower.endsWith('.pdf')) return '📕';
  if (lower.match(/\.(doc|docx)$/)) return '📘';
  if (lower.match(/\.(ppt|pptx)$/)) return '📙';
  if (lower.match(/\.(zip|rar|7z|tar|gz)$/)) return '🗂️';
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return '🖼️';
  return '📄';
};
