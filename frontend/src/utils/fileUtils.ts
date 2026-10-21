export const extractFileName = (url?: string): string => {
  if (!url) return '';
  try {
    const parts = url.split('/');
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
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  let serverOrigin = '';
  try {
    serverOrigin = new URL(apiBase, window.location.origin).origin;
  } catch {
    serverOrigin = window.location.origin;
  }
  return `${serverOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const getFileIcon = (url?: string): string => {
  if (!url) return '📄';
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return '📕';
  if (lower.match(/\.(doc|docx)$/)) return '📘';
  if (lower.match(/\.(ppt|pptx)$/)) return '📙';
  if (lower.match(/\.(zip|rar|7z|tar|gz)$/)) return '🗂️';
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return '🖼️';
  return '📄';
};
