# React + TypeScript + Vite

| Thư mục      | Dùng để làm gì?               |
| ------------ | ----------------------------- |
| `components` | Component dùng lại nhiều nơi  |
| `pages`      | Các trang thực tế của website |
| `layouts`    | Khung chung của các trang     |
| `routes`     | Khai báo URL                  |
| `services`   | Gọi API Spring Boot           |
| `hooks`      | Custom React hooks            |
| `types`      | Interface/type TypeScript     |
| `utils`      | Hàm tiện ích                  |
| `assets`     | Ảnh, icon, tài nguyên         |

Ví dụ luồng:

User
 ↓
ProductListPage
 ↓
ProductList
 ↓
productService
 ↓
api.ts
 ↓
Spring Boot API
 ↓
PostgreSQL