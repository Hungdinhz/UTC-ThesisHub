# 🔧 Kế Hoạch Căn Chỉnh Frontend cho Backend Spring Boot Mới

> [!IMPORTANT]
> Frontend hiện tại được copy từ dự án **Smart FYP** (Django REST Framework).
> Backend mới là **Spring Boot 4.1 + Java 25 + PostgreSQL**.
> Có **nhiều điểm không tương thích** cần sửa ngay để tránh lỗi khi phát triển backend.

---

## 📊 Tổng Quan Vấn Đề

| Hạng mục | Frontend hiện tại (Django) | Backend mới (Spring Boot) | Cần sửa? |
|---|---|---|---|
| API Base URL | `/app` | `/api` hoặc `/api/v1` | ✅ **Sửa** |
| Auth pattern | Django JWT (`/app/token/refresh/`) | Spring Security JWT | ✅ **Sửa** |
| API URL style | Trailing slash (`/student/login/`) | Không trailing slash (`/student/login`) | ✅ **Sửa** |
| Response format | Django REST `{results: [], count: N}` | Spring Boot format khác | ⚠️ **Chuẩn bị** |
| Cookie auth | Django HttpOnly cookie | Spring Security cookie config | ⚠️ **Review** |
| WebSocket | Django Channels (`ws://`) | Spring WebSocket (STOMP) | ✅ **Sửa** |
| File upload | Django media server | Spring multipart handler | ⚠️ **Review** |

---

## 🚨 Mức Ưu Tiên 1: Sửa Ngay (Tránh lỗi ngay khi chạy)

### 1.1 API Base URL & Proxy Config

**Vấn đề**: Frontend đang trỏ tới `/app` — convention của Django. Spring Boot thường dùng `/api` hoặc `/api/v1`.

**File cần sửa:**

#### `.env` và `.env.example`
```diff
- VITE_API_BASE_URL=http://localhost:8000/app
- VITE_WS_URL=ws://localhost:8000/ws
+ VITE_API_BASE_URL=http://localhost:8080/api/v1
+ VITE_WS_URL=ws://localhost:8080/ws
```

> [!NOTE]  
> Spring Boot mặc định chạy port **8080**, không phải 8000 như Django.

#### `vite.config.ts` — Sửa proxy
```diff
  server: {
    port: 3000,
    proxy: {
-     '/app': {
-       target: 'http://localhost:8000',
+     '/api': {
+       target: 'http://localhost:8080',
        changeOrigin: true,
      },
-     '/api': {
-       target: 'http://localhost:8000',
-       changeOrigin: true,
-     },
-     '/documents': {
-       target: 'http://localhost:8000',
+     '/documents': {
+       target: 'http://localhost:8080',
        changeOrigin: true,
      },
-     '/doc_templates': {
-       target: 'http://localhost:8000',
+     '/doc_templates': {
+       target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
-       target: 'http://localhost:8000',
+       target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
```

---

### 1.2 API URL Pattern — Bỏ Trailing Slash

**Vấn đề**: Django yêu cầu trailing slash (`/student/login/`), Spring Boot thì **không** (sẽ trả 404 nếu có trailing slash mà controller không map).

**File**: `src/services/api.ts`

Tất cả các endpoint đều có trailing slash, ví dụ:
```typescript
// Django style (hiện tại)
'/student/login/'
'/supervisor/profile/'
'/projects/list/'

// Spring Boot style (cần đổi)
'/students/login'
'/supervisors/profile'  
'/projects'
```

> [!TIP]
> **Giải pháp tốt nhất**: Tạo một hằng số `API_ENDPOINTS` tập trung, để khi backend hoàn thiện, chỉ cần sửa 1 chỗ.

---

### 1.3 Auth Token Flow — Django → Spring Security

**Vấn đề hiện tại trong** `api.ts`:
```typescript
// Token refresh - Django pattern
await axios.post(`${API_BASE_URL}/token/refresh/`, {}, { withCredentials: true });
// Logout - Django pattern  
await axios.post(`${API_BASE_URL}/token/logout/`, {}, { withCredentials: true });
```

**Spring Boot sẽ cần:**
```typescript
// Spring Security JWT pattern
await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
```

---

## 🔶 Mức Ưu Tiên 2: Tái Cấu Trúc API Layer (Nên làm sớm)

### 2.1 Tạo API Endpoints Config tập trung

Thay vì hardcode URL rải rác trong `api.ts` (885 dòng!), tạo file config:

**File mới**: `src/services/endpoints.ts`
```typescript
export const ENDPOINTS = {
  auth: {
    studentLogin: '/auth/students/login',
    supervisorLogin: '/auth/supervisors/login',
    committeeMemberLogin: '/auth/committee-members/login',
    externalLogin: '/auth/externals/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
  },
  students: {
    profile: '/students/profile',
    list: '/students',
  },
  supervisors: {
    profile: '/supervisors/profile',
    list: '/supervisors',
  },
  projects: {
    list: '/projects',
    detail: (id: number) => `/projects/${id}`,
    categories: '/projects/categories',
  },
  groups: {
    requests: '/groups/requests',
    detail: (id: number) => `/groups/${id}`,
    comments: (groupId: number) => `/groups/${groupId}/comments`,
  },
  documents: {
    list: (type: string) => `/documents/${type}`,
    upload: (type: string) => `/documents/${type}`,
    requirements: '/documents/requirements',
  },
  // ... thêm theo từng module
} as const;
```

### 2.2 Chuẩn hóa Response Format

Frontend đang handle cả 2 format (paginated/non-paginated) rất lộn xộn:
```typescript
// Code hiện tại - rất messy
const response = await this.api.get<Project[] | { results: Project[] }>('/projects/list/', { params });
if (Array.isArray(response.data)) {
  return response.data;
} else if (response.data.results) {
  return response.data.results;
}
```

**Nên**: Quy ước 1 format chuẩn cho backend mới (Spring Boot `Page<T>`):
```typescript
// Spring Boot pagination format
interface SpringPage<T> {
  content: T[];        // ← khác Django dùng "results"
  totalElements: number; // ← khác Django dùng "count"
  totalPages: number;
  number: number;      // current page (0-based)
  size: number;
  first: boolean;
  last: boolean;
}
```

---

## 🔵 Mức Ưu Tiên 3: Chuẩn Bị Cho Tích Hợp (Làm khi phát triển backend)

### 3.1 WebSocket — Django Channels → Spring STOMP

Frontend đang dùng raw WebSocket:
```typescript
const ws = new WebSocket(`${wsUrl}?ticket=${ticket}`);
```

Spring Boot thường dùng **STOMP over WebSocket** với SockJS:
```typescript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
```

> [!WARNING]
> Cần cài thêm package: `@stomp/stompjs` và `sockjs-client` nếu backend dùng STOMP.
> Hoặc backend cũng có thể dùng raw WebSocket — quyết định khi code backend.

### 3.2 File Upload/Download paths

Hiện tại reference tới Django media server paths. Spring Boot serve static files khác.

### 3.3 Locales/i18n

File `en.json` và `vi.json` có thể giữ nguyên — không phụ thuộc backend.

---

## ✅ Những Thứ Giữ Nguyên Được (Không cần sửa)

| Thành phần | Lý do |
|---|---|
| React Router & Routes | Routing phía client, không liên quan backend |
| ThemeContext | Dark/Light mode — pure frontend |
| ErrorBoundary | Error handling frontend |
| i18n (en.json, vi.json) | Localization — pure frontend |
| CSS/Styles | UI styling — pure frontend |
| TypeScript types (`types/index.ts`) | **Giữ làm "hợp đồng"** — backend phải trả về format tương tự |
| Component layout & structure | Dashboard, Navbar, Modal... — UI logic |

---

## 📋 Checklist Hành Động

### Làm ngay (trước khi code backend):
- [ ] Sửa `.env` + `.env.example`: đổi port 8000 → 8080, đổi `/app` → `/api/v1`
- [ ] Sửa `vite.config.ts`: cập nhật proxy rules
- [ ] Tạo `src/services/endpoints.ts`: tập trung tất cả API paths
- [ ] Sửa `api.ts`: import endpoints từ file mới, bỏ trailing slash
- [ ] Update comments trong `.env` cho đúng với Spring Boot

### Làm khi bắt đầu code backend:
- [ ] Quyết định response pagination format (Spring Page vs custom)
- [ ] Cập nhật `PaginatedResponse<T>` trong types nếu dùng Spring Page format
- [ ] Quyết định WebSocket approach (STOMP vs raw)
- [ ] Thiết kế API endpoints chính thức & document
- [ ] Cập nhật `endpoints.ts` theo API thực tế

### Không cần làm:
- [x] Routing — giữ nguyên
- [x] Theme/Styling — giữ nguyên
- [x] i18n — giữ nguyên
- [x] Component structure — giữ nguyên

---

> [!TIP]
> **Lời khuyên**: File `types/index.ts` (620 dòng) là tài liệu cực kỳ quý giá!
> Khi code backend Spring Boot, hãy dùng nó làm **API Contract** — các entity/DTO
> trong Java nên match với các TypeScript interface này. Điều này đảm bảo frontend-backend
> đồng bộ hoàn hảo mà không cần sửa nhiều code frontend.
