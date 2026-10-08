# KẾ HOẠCH TRIỂN KHAI CHI TIẾT (IMPLEMENTATION PLAN)
## DỰ ÁN: THESISHUB — HỆ THỐNG QUẢN LÝ ĐỒ ÁN / KHÓA LUẬN TỐT NGHIỆP UTC

---

- **Họ và tên**: Phùng Đình Hùng
- **Vai trò**: Nhóm trưởng – Technical Lead / Full-stack Developer
- **Phạm vi phụ trách**: Module Identity + Organization + Project Round + Hạ tầng dùng chung (Shared Infrastructure)
- **Thời gian thực hiện**: Từ **08/10/2026** đến **01/11/2026** (khoảng 21 ngày làm việc chuyên trách)
- **Mục tiêu cốt lõi**:
  1. Hoàn thành 100% phần việc được giao (Database, Backend API, Frontend UI, Testing) đúng hạn 01/11/2026.
  2. Xây dựng vững chắc hạ tầng kỹ thuật dùng chung và chuẩn hóa giao tiếp liên module.
  3. Cung cấp sớm nhất các API/Hợp đồng dữ liệu nền (Data Contracts) để **không chặn (unblock)** tiến độ của 3 thành viên còn lại:
     - **Nguyễn Đình Công** (*Module Assignment* - Phân công hướng dẫn, nguyện vọng, chỉ tiêu)
     - **Ngô Minh Quyết** (*Module Thesis* - Đề tài, đề cương, nhiệm vụ, tiến độ)
     - **Khuất Đăng Khoa** (*Module Eligibility & Defense* - Xét điều kiện, bảo lưu, hội đồng, chấm điểm)

---

## MỤC LỤC
1. [Bản đồ Kiến trúc & 13 Bảng Dữ liệu Phụ trách](#1-bản-đồ-kiến-trúc--13-bảng-dữ-liệu-phụ-trách)
2. [Chiến lược Đường găng & Danh sách API Cần Cung cấp Sớm (Unblock First)](#2-chiến-lược-đường-găng--danh-sách-api-cần-cung-cấp-sớm-unblock-first)
3. [Phân rã Công việc thành các Task Nguyên tử (Atomic Work Breakdown)](#3-phân-rã-công-việc-thành-các-task-nguyên-tử-atomic-work-breakdown)
   - [Nhóm Task 1: Hạ tầng dùng chung & Nền tảng Core (Shared Infrastructure)](#nhóm-task-1-hạ-tầng-dùng-chung--nền-tảng-core-shared-infrastructure)
   - [Nhóm Task 2: Xác thực & Phân quyền (Identity / Auth Module)](#nhóm-task-2-xác-thực--phân-quyền-identity--auth-module)
   - [Nhóm Task 3: Dữ liệu nền & Cơ cấu Tổ chức (Organization Module)](#nhóm-task-3-dữ-liệu-nền--cơ-cấu-tổ-chức-organization-module)
   - [Nhóm Task 4: Quản lý Đợt đồ án & Mốc thời gian (Project Round Module)](#nhóm-task-4-quản-ly-đợt-đồ-án--mốc-thời-gian-project-round-module)
   - [Nhóm Task 5: Import Danh sách Sinh viên & Phân loại Đợt đồ án (Phase 1 Ingestion)](#nhóm-task-5-import-danh-sách-sinh-viên--phân-loại-đợt-đồ-án-phase-1-ingestion)
   - [Nhóm Task 6: Import Dữ liệu Học vụ phục vụ Xét điều kiện (Phase 4 Ingestion)](#nhóm-task-6-import-dữ-liệu-học-vụ-phục-vụ-xét-điều-kiện-phase-4-ingestion)
   - [Nhóm Task 7: Hạ tầng Frontend dùng chung & Tích hợp Toàn hệ thống](#nhóm-task-7-hạ-tầng-frontend-dùng-chung--tích-hợp-toàn-hệ-thống)
4. [Lịch trình Thực hiện theo Tuần (08/10/2026 – 01/11/2026)](#4-lịch-trình-thực-hiện-theo-tuần-08102026--01112026)
5. [Checklist "Definition of Done" (DoD) theo từng Nhóm Chức năng](#5-checklist-definition-of-done-dod-theo-từng-nhóm-chức-năng)
6. [Danh mục Câu hỏi Cần Làm Rõ (Open Questions & Clarifications)](#6-danh-mục-câu-hỏi-cần-làm-rõ-open-questions--clarifications)

---

## 1. BẢN ĐỒ KIẾN TRÚC & 13 BẢNG DỮ LIỆU PHỤ TRÁCH

Hệ thống TheSisHub tuân thủ kiến trúc **Modular Monolith**. Phùng Đình Hùng sở hữu độc quyền **13 bảng cơ sở dữ liệu** dưới đây. Các thành viên khác chỉ truy xuất dữ liệu thông qua Repository nội bộ (nếu đọc) hoặc Service/API/DTO chuẩn do Hùng phát hành.

### 1.1. Bảng phân định 13 Entity và quan hệ dữ liệu

| STT | Tên bảng PostgreSQL | Java Entity tương ứng | Package Backend | Mục đích & Ràng buộc chính |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `faculties` | `Faculty` | `organization.entity` | Quản lý Khoa (ví dụ: Khoa CNTT). Khóa chính `id`, mã khoa `code` (UNIQUE), tên khoa `name`. |
| **2** | `departments` | `Department` | `organization.entity` | Quản lý Bộ môn trực thuộc Khoa (CNTT, HTTT, KTPM...). FK `faculty_id` → `faculties(id)`. |
| **3** | `majors` | `Major` | `organization.entity` | Quản lý Ngành đào tạo (CNTT, KTPM, MMT...). FK `department_id` hoặc `faculty_id`. |
| **4** | `training_programs` | `TrainingProgram` | `organization.entity` | Phân biệt chương trình: CỬ NHÂN (4 năm) hoặc KỸ SƯ (4.5 - 5 năm). Khóa chính `id`, `code` (CU_NHAN/KY_SU). |
| **5** | `roles` | `Role` | `identity.entity` | Danh mục vai trò hệ thống: `ROLE_ADMIN`, `ROLE_STUDENT`, `ROLE_LECTURER`, `ROLE_COMMITTEE`. |
| **6** | `users` | `User` | `identity.entity` | Tài khoản đăng nhập hệ thống: `username`/`email`, `password_hash`, `full_name`, `phone`, `avatar_url`, `is_active`, `role_id` → `roles(id)`. |
| **7** | `students` | `Student` | `organization.entity` | Thông tin chi tiết sinh viên: `user_id` → `users(id)` (1-1), `student_code` (Mã SV - UNIQUE), `class_name` (Lớp SH), `major_id` → `majors(id)`, `training_program_id` → `training_programs(id)`. |
| **8** | `lecturers` | `Lecturer` | `organization.entity` | Thông tin chi tiết giảng viên: `user_id` → `users(id)` (1-1), `lecturer_code` (Mã CB - UNIQUE), `department_id` → `departments(id)`, `academic_degree` (THAC_SI/TIEN_SI/PGS/GS), `research_interests` (chuỗi/tags). |
| **9** | `notifications` | `Notification` | `notification.entity` | Lưu thông báo gửi đến người dùng: `user_id` → `users(id)`, `title`, `content`, `type`, `is_read`, `created_at`. |
| **10** | `project_rounds` | `ProjectRound` | `projectround.entity` | Đợt đồ án/khóa luận tốt nghiệp: `round_code`, `name`, `academic_year`, `semester`, `training_program_id` → `training_programs(id)`, `status` (DRAFT/OPEN/IN_PROGRESS/CLOSED), `created_by`. |
| **11** | `timeline_milestones` | `TimelineMilestone` | `projectround.entity` | Các mốc thời gian của đợt: `project_round_id` → `project_rounds(id)`, `milestone_name`, `phase_type`, `start_date`, `end_date`, `is_active`. |
| **12** | `student_project_rounds` | `StudentProjectRound` | `projectround.entity` | Trạng thái của sinh viên trong từng đợt đồ án: `student_id` → `students(id)`, `project_round_id` → `project_rounds(id)`, `status` (ELIGIBLE, REGISTERED, ASSIGNED, IN_PROGRESS, DROPPED, DEFENDED), `note`. Khóa tự nhiên `UNIQUE(student_id, project_round_id)`. |
| **13** | `academic_records` | `AcademicRecord` | `projectround.entity` | Lưu kết quả học vụ import từ phòng Đào tạo phục vụ xét điều kiện: `student_id` → `students(id)`, `project_round_id` → `project_rounds(id)`, `completed_credits`, `gpa`, `tuition_debt`, `under_disciplinary_action`, `missing_prerequisite_count`, `imported_at`. |

---

## 2. CHIẾN LƯỢC ĐƯỜNG GĂNG & DANH SÁCH API CẦN CUNG CẤP SỚM (UNBLOCK FIRST)

### 2.1. Phân tích hiện trạng & Nút thắt cổ chai (Bottlenecks)
- Teammate **Khuất Đăng Khoa** (Module 4) đã viết code xong tầng Controller/Service/Repo và đang phải dùng các mock class (`ExternalThesisMockService`, `ExternalAcademicMockService`).
- Teammate **Nguyễn Đình Công** (Module 2) không thể ghép thuật toán phân công nếu không có danh sách GV (kèm học vị, bộ môn) và danh sách SV đủ điều kiện trong đợt.
- Teammate **Ngô Minh Quyết** (Module 3) không thể tạo đề tài nếu thiếu `project_round_id`, `student_id`, `lecturer_id`.
- Hệ thống hiện tại trong `SecurityConfig` đang để `permitAll()` toàn bộ, chưa có cấu trúc phân quyền JWT thực tế, chưa có Flyway V100 khởi tạo 13 bảng cốt lõi.

### 2.2. Danh mục 5 Hợp đồng API / Dữ liệu ưu tiên số 1 (Hoàn thành ngay trong Tuần 1)

```
       ┌────────────────────────────────────────────────────────┐
       │     Phùng Đình Hùng (Identity & Organization Core)     │
       └──────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┼─────────────────────────┐
         │ (API 1 & 2)            │ (API 3 & 4)             │ (API 5)
         ▼                        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐      ┌──────────────────┐
│ Nguyễn Đình Công │    │  Ngô Minh Quyết  │      │ Khuất Đăng Khoa  │
│  (Assignment)    │    │ (Thesis/Tasks)   │      │ (Eligibility/Def)│
└──────────────────┘    └──────────────────┘      └──────────────────┘
```

#### Contract 1: API Tra cứu Giảng viên theo Bộ môn / Hướng nghiên cứu / Học vị
- **Endpoint**: `GET /api/v1/lecturers?departmentId={id}&degree={degree}&search={keyword}`
- **Người dùng trực tiếp**: Nguyễn Đình Công (ghép chỉ tiêu phân công), Khuất Đăng Khoa (hội đồng bảo vệ, phản biện).
- **Format DTO trả về**:
```json
{
  "code": 200,
  "success": true,
  "message": "Success",
  "data": [
    {
      "lecturerId": 501,
      "lecturerCode": "CB0123",
      "fullName": "TS. Nguyễn Văn Hướng",
      "email": "huongnv@utc.edu.vn",
      "phone": "0987654321",
      "academicDegree": "DOCTOR",
      "departmentId": 2,
      "departmentName": "Công nghệ phần mềm",
      "facultyId": 1,
      "facultyName": "Công nghệ thông tin",
      "researchInterests": "Trí tuệ nhân tạo, Xử lý ảnh",
      "isActive": true
    }
  ]
}
```

#### Contract 2: API Tra cứu Đợt đồ án đang hoạt động & Mốc thời gian (Timeline)
- **Endpoint**: `GET /api/v1/project-rounds/active`
- **Người dùng trực tiếp**: Cả 3 thành viên (kiểm tra hạn đăng ký, hạn nộp đề cương, hạn bảo lưu, hạn bảo vệ).
- **Format DTO trả về**:
```json
{
  "code": 200,
  "success": true,
  "message": "Success",
  "data": {
    "roundId": 10,
    "roundCode": "DA_CNTT_K62_HK1",
    "name": "Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027",
    "academicYear": "2026-2027",
    "semester": "HK1",
    "trainingProgram": "CU_NHAN",
    "status": "OPEN",
    "milestones": [
      {
        "milestoneId": 1,
        "phaseType": "REGISTRATION",
        "name": "Đăng ký nguyện vọng & Hướng đề tài",
        "startDate": "2026-10-10T00:00:00",
        "endDate": "2026-10-20T23:59:59",
        "isActive": true
      },
      {
        "milestoneId": 2,
        "phaseType": "PROPOSAL_SUBMISSION",
        "name": "Nộp đề cương đồ án",
        "startDate": "2026-10-21T00:00:00",
        "endDate": "2026-10-31T23:59:59",
        "isActive": false
      }
    ]
  }
}
```

#### Contract 3: API Danh sách Sinh viên tham gia đợt đồ án (Student Project Round Directory)
- **Endpoint**: `GET /api/v1/project-rounds/{roundId}/students?majorId={majorId}&status={status}`
- **Người dùng trực tiếp**: Nguyễn Đình Công (lấy SV để chia GVHD), Ngô Minh Quyết (gán đề tài).
- **Format DTO trả về**:
```json
{
  "code": 200,
  "success": true,
  "data": {
    "content": [
      {
        "studentRoundId": 1001,
        "studentId": 101,
        "studentCode": "201200001",
        "fullName": "Trần Văn An",
        "email": "an.tv@student.utc.edu.vn",
        "className": "CNTT1-K62",
        "majorId": 1,
        "majorName": "Công nghệ thông tin",
        "trainingProgram": "CU_NHAN",
        "status": "ELIGIBLE",
        "debtCredits": 0
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

#### Contract 4: API Thông tin Học vụ Sinh viên (Academic Records)
- **Endpoint**: `GET /api/v1/project-rounds/{roundId}/academic-records/{studentId}`
- **Người dùng trực tiếp**: Khuất Đăng Khoa (thay thế trực tiếp cho `ExternalAcademicMockService`).
- **Format DTO trả về**:
```json
{
  "code": 200,
  "success": true,
  "data": {
    "studentId": 101,
    "studentCode": "201200001",
    "fullName": "Trần Văn An",
    "completedCredits": 125,
    "gpa": 3.25,
    "tuitionDebt": false,
    "underDisciplinaryAction": false,
    "missingPrerequisiteCount": 0,
    "importedAt": "2026-10-12T14:30:00"
  }
}
```

#### Contract 5: API Chi tiết Tài khoản hiện tại (Current User Profile)
- **Endpoint**: `GET /api/v1/users/me`
- **Người dùng trực tiếp**: Frontend của cả 4 thành viên (xác thực context người dùng đăng nhập).
- **Format DTO trả về**:
```json
{
  "code": 200,
  "success": true,
  "data": {
    "userId": 55,
    "username": "201200001",
    "email": "an.tv@student.utc.edu.vn",
    "fullName": "Trần Văn An",
    "role": "ROLE_STUDENT",
    "studentProfile": {
      "studentId": 101,
      "studentCode": "201200001",
      "className": "CNTT1-K62",
      "majorId": 1,
      "trainingProgram": "CU_NHAN"
    },
    "lecturerProfile": null
  }
}
```

---

## 3. PHÂN RÃ CÔNG VIỆC THÀNH CÁC TASK NGUYÊN TỬ (ATOMIC WORK BREAKDOWN)

Mỗi task được thiết kế hoàn thành trong **0.5 ngày đến tối đa 1.5 ngày**, tuân thủ nguyên tắc **Vertical Slice** (DB Migration → Entity/Repository → Service → Controller → Test/Frontend).

---

### NHÓM TASK 1: HẠ TẦNG DÙNG CHUNG & NỀN TẢNG CORE (SHARED INFRASTRUCTURE)
*Trách nhiệm của Tech Lead đối với toàn bộ dự án.*

#### Task 1.1: Bổ sung dependencies còn thiếu vào `pom.xml` & Khởi tạo Flyway Migrations V100/V101 cho 13 bảng
- **Mục tiêu**: Bổ sung thư viện JWT, Apache POI (xử lý Excel), Springdoc OpenAPI. Viết script SQL Flyway cho 13 bảng thuộc quyền sở hữu của Hùng.
- **Thực thể / Bảng liên quan**: Toàn bộ 13 bảng (`faculties`, `departments`, `majors`, `training_programs`, `roles`, `users`, `students`, `lecturers`, `notifications`, `project_rounds`, `timeline_milestones`, `student_project_rounds`, `academic_records`).
- **Chi tiết thực hiện**:
  1. Cập nhật `pom.xml`: Thêm `jjwt-api`, `jjwt-impl`, `jjwt-jackson`, `poi-ooxml` (bản 5.x), `springdoc-openapi-starter-webmvc-ui` (v2.x cho Spring Boot 3/4).
  2. Tạo file `src/main/resources/db/migration/V100__create_identity_and_organization_tables.sql`: DDL cho 9 bảng (`roles`, `users`, `faculties`, `departments`, `majors`, `training_programs`, `lecturers`, `students`, `notifications`) kèm chỉ mục (Index) và Ràng buộc toàn vẹn.
  3. Tạo file `V101__create_project_round_and_academic_tables.sql`: DDL cho 4 bảng (`project_rounds`, `timeline_milestones`, `student_project_rounds`, `academic_records`).
  4. Tạo file `V102__seed_initial_master_data.sql`: Dữ liệu mẫu (Seed) cho các vai trò chuẩn (`ROLE_ADMIN`, `ROLE_STUDENT`, `ROLE_LECTURER`, `ROLE_COMMITTEE`), khoa CNTT, bộ môn, ngành, chương trình đào tạo và tài khoản Admin mặc định.
- **Thời lượng ước tính**: 1.0 ngày (Ngày 1: 08/10/2026).

#### Task 1.2: Chuẩn hóa Global Exception Handling, Validation & API Response Specification
- **Mục tiêu**: Xây dựng cơ chế bắt lỗi tập trung (`@RestControllerAdvice`) đồng bộ theo định dạng `ApiResponse<T>`, loại bỏ hoàn toàn các response lỗi không đồng nhất.
- **Thực thể / Bảng liên quan**: Toàn hệ thống (Shared).
- **Chi tiết thực hiện**:
  1. Tạo mã lỗi chuẩn `ErrorCode` enum: `UNAUTHORIZED(401)`, `FORBIDDEN(403)`, `NOT_FOUND(404)`, `VALIDATION_FAILED(400)`, `CONFLICT(409)`, `INTERNAL_SERVER_ERROR(500)`.
  2. Tạo các runtime exception: `AppException`, `ResourceNotFoundException`, `DuplicateResourceException`, `UnauthorizedException`.
  3. Xây dựng `GlobalExceptionHandler`: Xử lý `MethodArgumentNotValidException` (lỗi `@Valid`), `AppException`, và các lỗi hệ thống chung.
  4. Viết DTO `PageResponse<T>` phục vụ phân trang chuẩn: `page`, `size`, `totalElements`, `totalPages`, `content`.
- **Thời lượng ước tính**: 0.5 ngày (Sáng Ngày 2: 09/10/2026).

#### Task 1.3: Cấu hình OpenAPI (Swagger UI) & Docker Compose Môi trường
- **Mục tiêu**: Cung cấp giao diện Swagger UI tài liệu hóa toàn bộ API cho 3 thành viên tra cứu; kiểm tra cấu hình Docker PostgreSQL.
- **Thực thể / Bảng liên quan**: Toàn hệ thống (Shared).
- **Chi tiết thực hiện**:
  1. Tạo config class `OpenApiConfig`: Cấu hình OpenAPI 3.0 với Bearer Authentication token.
  2. Cập nhật `docker/docker-compose.yml`: Đảm bảo service PostgreSQL chạy đúng cổng 5432, mount volume dữ liệu ổn định, mở port sẵn sàng cho local testing.
  3. Verify truy cập `http://localhost:8080/swagger-ui.html`.
- **Thời lượng ước tính**: 0.5 ngày (Chiều Ngày 2: 09/10/2026).

#### Task 1.4: Base File Storage Service & Base Notification Service
- **Mục tiêu**: Cung cấp module lõi để lưu trữ file (phục vụ upload Excel, tài liệu) và lưu thông báo vào database.
- **Thực thể / Bảng liên quan**: `notifications`.
- **API dự kiến**:
  - `POST /api/v1/files/upload` (Upload multipart file nội bộ, lưu vào ổ đĩa thư mục `./uploads/`)
  - `GET /api/v1/notifications` (Danh sách thông báo của user)
  - `PATCH /api/v1/notifications/{id}/read` (Đánh dấu đã đọc)
- **Chi tiết thực hiện**:
  1. Xây dựng `FileStorageService`: Phương thức `storeFile(MultipartFile)`, `loadFileAsResource(String filename)`, `validateFileType(...)`.
  2. Xây dựng `NotificationService`: Phương thức `createNotification(userId, title, content, type)` và các phương thức truy vấn thông báo cho user đang đăng nhập.
- **Thời lượng ước tính**: 1.0 ngày (Ngày 3: 10/10/2026).

---

### NHÓM TASK 2: XÁC THỰC & PHÂN QUYỀN (IDENTITY / AUTH MODULE)
*Bảo đảm an ninh toàn hệ thống và kiểm soát truy cập phân tầng theo vai trò.*

#### Task 2.1: Triển khai Spring Security + JWT Engine
- **Mục tiêu**: Xây dựng cơ chế sinh và giải mã JWT token, bộ lọc request `JwtAuthenticationFilter`, cơ chế `PasswordEncoder` (BCrypt).
- **Thực thể / Bảng liên quan**: `roles`, `users`.
- **Chi tiết thực hiện**:
  1. Tạo `JwtTokenProvider`: Hàm sinh access token, validate token, trích xuất username/roles từ claims.
  2. Tạo `CustomUserDetailsService`: Load user từ bảng `users` và ánh xạ sang `UserDetails` kèm authorities (`ROLE_*`).
  3. Xây dựng `JwtAuthenticationFilter`: Đọc header `Authorization: Bearer <token>`, giải mã và đưa thông tin xác thực vào `SecurityContextHolder`.
  4. Cấu hình lại `SecurityConfig`: Thay thế `permitAll` bằng các quy tắc kiểm soát truy cập (Permit các route public: `/api/v1/auth/**`, `/swagger-ui/**`; Yêu cầu xác thực đối với các route nghiệp vụ còn lại).
- **Thời lượng ước tính**: 1.0 ngày (Ngày 4: 11/10/2026).

#### Task 2.2: API Đăng nhập, Đăng xuất, Đổi mật khẩu
- **Mục tiêu**: Hiện thực hóa đầy đủ chức năng xác thực cho người dùng trên Backend.
- **Thực thể / Bảng liên quan**: `users`, `roles`, `students`, `lecturers`.
- **API dự kiến**:
  - `POST /api/v1/auth/login` (Body: `username`, `password`) → Trả về accessToken, role, user info.
  - `POST /api/v1/auth/change-password` (Body: `oldPassword`, `newPassword`) → Cập nhật BCrypt hash.
  - `POST /api/v1/auth/logout` (Hỗ trợ vô hiệu hóa session/client-side cleanup).
  - *Fallback Endpoints cho Frontend hiện tại*: Alias router để khớp với `/api/v1/auth/students/login`, `/api/v1/auth/supervisors/login` mà frontend hiện tại đang gọi.
- **Chi tiết thực hiện**:
  1. Viết `AuthService` và `AuthController`.
  2. Xử lý trả về định danh kèm thông tin profile con (nếu là SV thì kèm `studentId`, nếu là GV thì kèm `lecturerId`).
- **Thời lượng ước tính**: 1.0 ngày (Ngày 5: 12/10/2026).

#### Task 2.3: API Quản lý Tài khoản & Phân quyền (Admin Account Management)
- **Mục tiêu**: Cho phép Quản trị viên tra cứu, cấp tài khoản, đổi vai trò, khóa hoặc mở khóa người dùng.
- **Thực thể / Bảng liên quan**: `users`, `roles`.
- **API dự kiến**:
  - `GET /api/v1/users?role={role}&search={search}&page={page}&size={size}` (Lấy danh sách user kèm phân trang)
  - `POST /api/v1/users` (Tạo tài khoản thủ công)
  - `PUT /api/v1/users/{id}/status` (Khóa/Mở tài khoản: `isActive: true/false`)
  - `PUT /api/v1/users/{id}/role` (Cập nhật vai trò)
  - `POST /api/v1/users/{id}/reset-password` (Admin reset mật khẩu mặc định)
- **Thời lượng ước tính**: 0.5 ngày (Sáng Ngày 6: 13/10/2026).

#### Task 2.4: API Hồ sơ Người dùng (Profile Management) & Me Endpoint
- **Mục tiêu**: Trả về thông tin chi tiết của người dùng đang đăng nhập và cho phép cập nhật thông tin cá nhân cơ bản (SĐT, Email, Avatar).
- **Thực thể / Bảng liên quan**: `users`, `students`, `lecturers`, `departments`, `majors`.
- **API dự kiến**:
  - `GET /api/v1/users/me` (Lấy profile cá nhân hiện tại)
  - `PUT /api/v1/users/me` (Cập nhật số điện thoại, email)
  - `GET /api/v1/students/profile` & `GET /api/v1/supervisors/profile` (Phục vụ khớp với frontend endpoints hiện có).
- **Thời lượng ước tính**: 0.5 ngày (Chiều Ngày 6: 13/10/2026).

#### Task 2.5: Tích hợp Frontend Auth Slice (Next.js / React)
- **Mục tiêu**: Nối giao diện `LoginPage.tsx`, hoàn thiện `AuthContext.tsx`, cấu hình Axios Interceptor tự động gắn Bearer Token và xử lý khi hết hạn token (401 Redirect).
- **Chi tiết thực hiện**:
  1. Cập nhật `frontend/src/services/api.ts`: Cấu hình request interceptor gắn `Authorization: Bearer <token>`, response interceptor bắt lỗi 401.
  2. Hoàn thiện `AuthContext.tsx`: Quản lý lưu trữ token trong `localStorage`, gọi `GET /api/v1/users/me` khi reload trang.
  3. Cập nhật `LoginPage.tsx`: Hỗ trợ form đăng nhập chuẩn, hiển thị thông báo lỗi khi sai tài khoản/mật khẩu, chuyển hướng đúng dashboard theo role (`/student`, `/supervisor`, `/admin`, `/committee`).
  4. Viết Protected Route Guard (`frontend/src/routes/ProtectedRoute.tsx`): Chặn truy cập trái quyền theo vai trò.
- **Thời lượng ước tính**: 1.0 ngày (Ngày 7: 14/10/2026).

---

### NHÓM TASK 3: DỮ LIỆU NỀN & CƠ CẤU TỔ CHỨC (ORGANIZATION MODULE)
*Thiết lập cơ sở dữ liệu Khoa – Bộ môn – Ngành – Chương trình – Giảng viên – Sinh viên.*

#### Task 3.1: Quản lý Khoa (Faculties) & Bộ môn (Departments)
- **Mục tiêu**: CRUD dữ liệu Khoa và quan hệ phân cấp Khoa → Bộ môn.
- **Thực thể / Bảng liên quan**: `faculties`, `departments`.
- **API dự kiến**:
  - `GET /api/v1/faculties` / `POST /api/v1/faculties` / `PUT /api/v1/faculties/{id}`
  - `GET /api/v1/departments?facultyId={facultyId}` / `POST /api/v1/departments` / `PUT /api/v1/departments/{id}`
- **Thời lượng ước tính**: 0.5 ngày (Sáng Ngày 8: 15/10/2026).

#### Task 3.2: Quản lý Ngành (Majors) & Chương trình đào tạo (Training Programs)
- **Mục tiêu**: Quản lý danh mục Ngành học và 2 Chương trình đào tạo chuẩn của UTC (CỬ NHÂN & KỸ SƯ).
- **Thực thể / Bảng liên quan**: `majors`, `training_programs`.
- **API dự kiến**:
  - `GET /api/v1/majors` / `POST /api/v1/majors`
  - `GET /api/v1/training-programs` (Trả về CỬ NHÂN, KỸ SƯ)
- **Thời lượng ước tính**: 0.5 ngày (Chiều Ngày 8: 15/10/2026).

#### Task 3.3: Quản lý Hồ sơ Giảng viên, Học vị & Hướng nghiên cứu (**CRITICAL UNBLOCK**)
- **Mục tiêu**: Quản lý hồ sơ giảng viên, cập nhật học vị (ThS, TS, PGS, GS), cập nhật hướng nghiên cứu và liên kết với bộ môn. **Đây là API unblock sống còn cho Nguyễn Đình Công và Khuất Đăng Khoa.**
- **Thực thể / Bảng liên quan**: `lecturers`, `departments`, `users`.
- **API dự kiến**:
  - `GET /api/v1/lecturers` (Hỗ trợ lọc theo `departmentId`, `degree`, tìm kiếm theo tên/mã CB)
  - `GET /api/v1/lecturers/{id}` (Chi tiết thông tin GV)
  - `PUT /api/v1/lecturers/{id}` (Admin hoặc Trưởng bộ môn cập nhật học vị, bộ môn)
  - `PUT /api/v1/lecturers/me/research-interests` (GV tự cập nhật hướng nghiên cứu của bản thân)
- **Thời lượng ước tính**: 1.0 ngày (Ngày 9: 16/10/2026).

#### Task 3.4: Quản lý Hồ sơ Sinh viên (Student Master Data)
- **Mục tiêu**: Cung cấp API quản lý danh sách sinh viên tổng thể trong hệ thống theo Ngành, Lớp, Bậc đào tạo.
- **Thực thể / Bảng liên quan**: `students`, `majors`, `training_programs`, `users`.
- **API dự kiến**:
  - `GET /api/v1/students?majorId={majorId}&programId={programId}&search={search}&page={page}&size={size}`
  - `GET /api/v1/students/{id}`
  - `PUT /api/v1/students/{id}` (Cập nhật thông tin SV: lớp, ngành, bậc đào tạo)
- **Thời lượng ước tính**: 0.5 ngày (Sáng Ngày 10: 17/10/2026).

#### Task 3.5: Frontend UI Quản lý Tổ chức & Danh mục Hệ thống
- **Mục tiêu**: Xây dựng giao diện cho Admin quản lý Khoa, Bộ môn, Ngành, Giảng viên và Sinh viên.
- **Chi tiết thực hiện**:
  1. Tạo trang `OrganizationManagementPage.tsx` gồm các Tab: Khoa & Bộ môn, Ngành & CTĐT, Danh sách Giảng viên, Danh sách Sinh viên.
  2. Bảng dữ liệu hiển thị kèm bộ lọc, tìm kiếm, nút thêm/sửa nhanh và modal xem chi tiết.
- **Thời lượng ước tính**: 0.5 ngày (Chiều Ngày 10: 17/10/2026).

---

### NHÓM TASK 4: QUẢN LÝ ĐỢT ĐỒ ÁN & MỐC THỜI GIAN (PROJECT ROUND MODULE)
*Khởi tạo đợt đồ án, gắn chương trình đào tạo, thiết lập các mốc timeline nghiệp vụ.*

#### Task 4.1: CRUD Đợt đồ án (Project Rounds)
- **Mục tiêu**: Cho phép Khoa/Admin tạo đợt đồ án mới, chọn năm học, học kỳ, gắn chương trình đào tạo áp dụng (Cử nhân hoặc Kỹ sư).
- **Thực thể / Bảng liên quan**: `project_rounds`, `training_programs`, `users`.
- **API dự kiến**:
  - `GET /api/v1/project-rounds?status={status}&academicYear={year}` (Danh sách các đợt)
  - `POST /api/v1/project-rounds` (Tạo đợt mới với mã đợt, tên đợt, CTĐT, năm học, học kỳ)
  - `GET /api/v1/project-rounds/{id}` (Chi tiết đợt)
  - `PUT /api/v1/project-rounds/{id}` (Cập nhật thông tin chung đợt)
- **Thời lượng ước tính**: 1.0 ngày (Ngày 11: 18/10/2026).

#### Task 4.2: Quản lý Mốc thời gian (Timeline Milestones)
- **Mục tiêu**: Cấu hình các giai đoạn thời gian (bắt đầu - kết thúc) cho từng đợt đồ án: Đăng ký nguyện vọng, Nộp đề cương, Thực hiện báo cáo tuần, Xét điều kiện, Thành lập hội đồng, Bảo vệ.
- **Thực thể / Bảng liên quan**: `timeline_milestones`, `project_rounds`.
- **API dự kiến**:
  - `GET /api/v1/project-rounds/{roundId}/milestones` (Lấy toàn bộ timeline của đợt)
  - `POST /api/v1/project-rounds/{roundId}/milestones` (Thêm một mốc thời gian)
  - `PUT /api/v1/timeline-milestones/{milestoneId}` (Sửa ngày bắt đầu, ngày kết thúc)
  - `DELETE /api/v1/timeline-milestones/{milestoneId}` (Xóa mốc)
- **Thời lượng ước tính**: 0.5 ngày (Sáng Ngày 12: 19/10/2026).

#### Task 4.3: Quản lý Vòng đời Đợt đồ án (Lifecycle) & Tra cứu Đợt Active (**CRITICAL UNBLOCK**)
- **Mục tiêu**: Điều khiển trạng thái đợt đồ án (`DRAFT` → `OPEN` → `IN_PROGRESS` → `CLOSED`). Cung cấp API lấy đợt đang mở và kiểm tra tính hợp lệ của mốc thời gian hiện tại.
- **Thực thể / Bảng liên quan**: `project_rounds`, `timeline_milestones`.
- **API dự kiến**:
  - `PATCH /api/v1/project-rounds/{id}/status` (Chuyển đổi trạng thái đợt: OPEN/CLOSE/IN_PROGRESS)
  - `GET /api/v1/project-rounds/active` (Lấy đợt hiện tại kèm timeline - Unblock cho toàn bộ hệ thống)
  - `GET /api/v1/project-rounds/{id}/current-milestone` (Lấy giai đoạn đang diễn ra)
- **Thời lượng ước tính**: 0.5 ngày (Chiều Ngày 12: 19/10/2026).

#### Task 4.4: Frontend UI Quản lý Đợt đồ án & Cấu hình Timeline
- **Mục tiêu**: Giao diện Admin quản lý danh sách đợt đồ án, tạo đợt mới, chọn chương trình đào tạo, kéo thả hoặc chọn ngày cho các mốc timeline trực quan.
- **Chi tiết thực hiện**:
  1. Tạo `ProjectRoundListPage.tsx`: Bảng danh sách các đợt đồ án kèm badge trạng thái (`DRAFT`, `OPEN`, `IN_PROGRESS`, `CLOSED`).
  2. Tạo `ProjectRoundDetailPage.tsx`: Xem chi tiết đợt, cấu hình timeline (dùng form hoặc timeline stepper), nút chuyển trạng thái Mở/Đóng đợt.
- **Thời lượng ước tính**: 1.0 ngày (Ngày 13: 20/10/2026).

---

### NHÓM TASK 5: IMPORT DANH SÁCH SINH VIÊN & PHÂN LOẠI ĐỢT ĐỒ ÁN (PHASE 1 INGESTION)
*Xử lý bước 4, 5, 6, 8 trong quy trình Giai đoạn 1.*

#### Task 5.1: Xây dựng Excel Parser Engine & Validation Rules cho Danh sách Sinh viên
- **Mục tiêu**: Đọc file `.xlsx`, parse từng dòng dữ liệu sinh viên, kiểm tra lỗi hợp lệ (Validation).
- **Thực thể / Bảng liên quan**: `students`, `users`, `majors`, `training_programs`.
- **Chi tiết thực hiện**:
  1. Viết `StudentExcelParser`: Đọc các cột: STT, Mã SV, Họ và tên, Ngày sinh, Lớp, Mã ngành, Chương trình đào tạo (Cử nhân/Kỹ sư), Email, Số điện thoại.
  2. Xây dựng logic kiểm tra dữ liệu:
     - Dòng thiếu Mã SV hoặc Họ tên → Báo lỗi dòng.
     - Mã ngành không tồn tại trong hệ thống → Báo lỗi.
     - Chương trình đào tạo không khớp với đợt đồ án → Cảnh báo.
     - Định dạng email/SĐT không chuẩn → Ghi nhận cảnh báo.
  3. Trả về kết quả phân tích: `totalRows`, `validRows`, `errorRows` kèm chi tiết lỗi từng dòng (row index, lỗi gì) trước khi commit vào DB.
- **Thời lượng ước tính**: 1.0 ngày (Ngày 14: 21/10/2026).

#### Task 5.2: Nghiệp vụ Lưu trữ, Tự động Khởi tạo Tài khoản & Thiết lập `student_project_rounds`
- **Mục tiêu**: Thực hiện lưu dữ liệu sinh viên vào bảng `students`, tạo tài khoản `users` tương ứng (nếu chưa có), gán vai trò `ROLE_STUDENT`, và tạo bản ghi tham gia trong `student_project_rounds`.
- **Thực thể / Bảng liên quan**: `users`, `students`, `roles`, `project_rounds`, `student_project_rounds`.
- **API dự kiến**:
  - `POST /api/v1/project-rounds/{roundId}/students/import-preview` (Upload file Excel để xem trước kết quả parse và danh sách lỗi).
  - `POST /api/v1/project-rounds/{roundId}/students/import-commit` (Xác nhận lưu danh sách sinh viên hợp lệ vào đợt).
- **Chi tiết thực hiện**:
  1. Nếu SV chưa có tài khoản: Tạo `User` với username = `student_code`, email = SV email, mật khẩu mặc định được mã hóa BCrypt (mặc định theo ngày sinh `ddMMyyyy` hoặc `UTC@{student_code}`).
  2. Tạo/Cập nhật bản ghi trong bảng `students`.
  3. Tạo bản ghi trong `student_project_rounds` với trạng thái ban đầu là `ELIGIBLE` (đủ điều kiện tham gia đợt).
- **Thời lượng ước tính**: 1.0 ngày (Ngày 15: 22/10/2026).

#### Task 5.3: API Quản lý & Lọc Sinh viên trong Đợt đồ án (**CRITICAL UNBLOCK**)
- **Mục tiêu**: Tra cứu, tìm kiếm, phân loại sinh viên trong đợt theo Ngành, Chương trình đào tạo và Trạng thái tham gia.
- **Thực thể / Bảng liên quan**: `student_project_rounds`, `students`, `majors`, `training_programs`.
- **API dự kiến**:
  - `GET /api/v1/project-rounds/{roundId}/students` (Bộ lọc: `majorId`, `programId`, `status`, `search`, phân trang)
  - `GET /api/v1/project-rounds/{roundId}/students/{studentId}` (Chi tiết trạng thái SV trong đợt)
  - `PATCH /api/v1/project-rounds/{roundId}/students/{studentId}/status` (Cập nhật trạng thái SV: ELIGIBLE, DROPPED, IN_PROGRESS...)
  - `DELETE /api/v1/project-rounds/{roundId}/students/{studentId}` (Loại SV khỏi đợt nếu chưa phân công)
- **Thời lượng ước tính**: 0.5 ngày (Sáng Ngày 16: 23/10/2026).

#### Task 5.4: Frontend UI Màn hình Import Sinh viên & Quản lý Danh sách SV trong đợt
- **Mục tiêu**: Cung cấp giao diện trực quan cho Khoa upload file Excel, xem bảng Preview các dòng hợp lệ/dòng lỗi màu đỏ, tải file template mẫu, bấm xác nhận import.
- **Chi tiết thực hiện**:
  1. Tạo component `StudentImportModal.tsx`: Drag & drop file Excel, hiển thị tiến độ upload, bảng preview lỗi theo dòng.
  2. Tạo trang `RoundStudentsManagementPage.tsx`: Danh sách SV trong đợt, tabs phân loại theo Ngành & Bậc đào tạo, nút tải template Excel, nút Import, thống kê tổng số lượng SV tham gia.
- **Thời lượng ước tính**: 1.0 ngày (Chiều Ngày 16 & Sáng Ngày 17: 23 - 24/10/2026).

---

### NHÓM TASK 6: IMPORT DỮ LIỆU HỌC VỤ PHỤC VỤ XÉT ĐIỀU KIỆN (PHASE 4 INGESTION)
*Xử lý bước 25 trong quy trình Giai đoạn 4. Chỉ import & lưu trữ, không xử lý logic xét duyệt.*

#### Task 6.1: Excel Parser & Lưu trữ Dữ liệu Học vụ vào `academic_records`
- **Mục tiêu**: Xây dựng bộ đọc file Excel kết quả học vụ từ phòng Đào tạo (Tín chỉ tích lũy, GPA, Nợ học phí, Kỷ luật, Môn tiên quyết còn nợ) và lưu trữ nguyên vẹn vào bảng `academic_records`.
- **Thực thể / Bảng liên quan**: `academic_records`, `students`, `project_rounds`.
- **API dự kiến**:
  - `POST /api/v1/project-rounds/{roundId}/academic-records/import` (Upload file Excel điểm/học vụ)
  - `GET /api/v1/project-rounds/{roundId}/academic-records/template` (Tải file mẫu Excel học vụ)
- **Chi tiết thực hiện**:
  1. Viết `AcademicRecordExcelParser`: Đọc các cột: Mã SV, Số tín chỉ tích lũy, Điểm GPA (thang 4), Nợ học phí (CÓ/KHÔNG), Kỷ luật (CÓ/KHÔNG), Số môn tiên quyết còn nợ, Ghi chú.
  2. Khớp `student_code` với `students.id`. Nếu SV không thuộc đợt đồ án này thì đánh dấu lỗi dòng.
  3. Lưu/Cập nhật (Upsert) vào bảng `academic_records`.
- **Thời lượng ước tính**: 1.0 ngày (Chiều Ngày 17 & Ngày 18: 24 - 25/10/2026).

#### Task 6.2: API Tra cứu Dữ liệu Học vụ & Cung cấp cho Module Eligibility (**CRITICAL UNBLOCK**)
- **Mục tiêu**: Cung cấp API và Service nội bộ để thành viên Khuất Đăng Khoa (Module Eligibility) gọi sang lấy dữ liệu thực tế thay thế cho `ExternalAcademicMockService`.
- **Thực thể / Bảng liên quan**: `academic_records`, `students`.
- **API dự kiến**:
  - `GET /api/v1/project-rounds/{roundId}/academic-records?page={page}&size={size}` (Lấy toàn bộ danh sách điểm học vụ trong đợt)
  - `GET /api/v1/project-rounds/{roundId}/academic-records/{studentId}` (Lấy chi tiết học vụ của 1 SV)
  - `GET /api/v1/academic-records/student/{studentId}` (Truy vấn theo studentId)
- **Thời lượng ước tính**: 0.5 ngày (Sáng Ngày 19: 26/10/2026).

#### Task 6.3: Frontend UI Màn hình Import & Xem Dữ liệu Học vụ
- **Mục tiêu**: Giao diện cho Admin upload file Excel dữ liệu học vụ, hiển thị bảng kết quả học vụ đã import.
- **Chi tiết thực hiện**:
  1. Tạo component `AcademicImportModal.tsx` và trang `AcademicRecordsPage.tsx`.
  2. Bảng hiển thị thông tin học vụ đã import (Số TC, GPA, Nợ HP, Kỷ luật) kèm bộ lọc theo Mã SV, Lớp.
- **Thời lượng ước tính**: 0.5 ngày (Chiều Ngày 19: 26/10/2026).

---

### NHÓM TASK 7: HẠ TẦNG FRONTEND DÙNG CHUNG & TÍCH HỢP TOÀN HỆ THỐNG
*Đảm bảo trải nghiệm xuyên suốt của toàn bộ hệ thống trước ngày nộp.*

#### Task 7.1: Hoàn thiện Layout dùng chung (Navigation, Sidebar, Header theo Role)
- **Mục tiêu**: Cấu trúc lại giao diện toàn hệ thống theo chuẩn UTC: Header hiển thị thông tin user, nút Đổi mật khẩu, Đăng xuất; Sidebar tự động ẩn/hiện menu tương ứng theo vai trò (Sinh viên, Giảng viên, Admin, Hội đồng).
- **Chi tiết thực hiện**:
  1. Hoàn thiện `UTCAppLayout.tsx`: Tích hợp `useAuth()` để hiển thị avatar, họ tên, role badge.
  2. Xây dựng thanh điều hướng Sidebar phân quyền:
     - **Admin**: Quản lý Đợt đồ án, Quản lý Tổ chức, Import SV, Import Học vụ, Tài khoản.
     - **Sinh viên**: Đăng ký hướng/GVHD, Nộp đề cương, Báo cáo tuần, Xem điều kiện bảo vệ, Lịch bảo vệ.
     - **Giảng viên**: Khai báo chỉ tiêu, Duyệt đề cương, Giao Task/nhận xét, Chấm điểm.
     - **Hội đồng**: Lịch bảo vệ, Chấm điểm hội đồng.
- **Thời lượng ước tính**: 1.0 ngày (Ngày 20: 27/10/2026).

#### Task 7.2: Tích hợp Hệ thống Thông báo (Notification Bell & Realtime Polling)
- **Mục tiêu**: Hiển thị chuông thông báo trên Header, badge số lượng chưa đọc, popup danh sách thông báo và đánh dấu đã đọc.
- **Thực thể / Bảng liên quan**: `notifications`.
- **API sử dụng**: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{id}/read`.
- **Thời lượng ước tính**: 0.5 ngày (Sáng Ngày 21: 28/10/2026).

#### Task 7.3: Hỗ trợ Tích hợp Liên module, Review PR & Khử Mock Data
- **Mục tiêu**: Đóng vai trò Tech Lead, phối hợp cùng Nguyễn Đình Công, Ngô Minh Quyết, Khuất Đăng Khoa để:
  1. Chuyển đổi các mock service (`ExternalThesisMockService`, `ExternalAcademicMockService`) sang gọi trực tiếp API/Service của Hùng.
  2. Review các Pull Request quan trọng vào nhánh `develop`.
  3. Giải quyết xung đột merge code (nếu có).
- **Thời lượng ước tính**: 1.5 ngày (Chiều Ngày 21 & Ngày 22: 28 - 29/10/2026).

#### Task 7.4: Integration Test Toàn hệ thống (End-to-End Workflow) & Chuẩn bị Demo
- **Mục tiêu**: Chạy kịch bản hoàn chỉnh từ Giai đoạn 1 đến Giai đoạn 4:
  1. Admin tạo đợt đồ án K62 CNTT → Cấu hình Timeline.
  2. Import danh sách 50 sinh viên từ file Excel → Tự sinh tài khoản.
  3. Cập nhật học vị, hướng nghiên cứu cho 10 giảng viên.
  4. SV đăng nhập hệ thống thành công bằng tài khoản vừa tạo.
  5. Import dữ liệu học vụ thành công.
  6. Kiểm tra các module phân công, đề tài, bảo vệ nhận dữ liệu thông suốt.
  7. Tối ưu hóa Database Index, dọn dẹp log, chuẩn bị tài liệu báo cáo kỹ thuật.
- **Thời lượng ước tính**: 2.0 ngày (Ngày 23 - 24: 30/10 - 01/11/2026).

---

## 4. LỊCH TRÌNH THỰC HIỆN THEO TUẦN (08/10/2026 – 01/11/2026)

| Tuần | Khoảng thời gian | Trọng tâm công việc | Các Task hoàn thành | Kết quả bàn giao (Deliverables) |
| :---: | :---: | :--- | :--- | :--- |
| **Tuần 1** | **08/10 – 14/10** *(7 ngày)* | **Hạ tầng Dùng chung & Auth & Unblock Cơ sở** | Task 1.1, 1.2, 1.3, 1.4<br>Task 2.1, 2.2, 2.3, 2.4, 2.5 | • Database khởi tạo 13 bảng (Flyway V100/V101/V102).<br>• JWT Authentication & Security hoạt động.<br>• Swagger UI online.<br>• API Login, Me, Change Password hoạt động.<br>• Frontend Login & AuthContext kết nối thành công. |
| **Tuần 2** | **15/10 – 21/10** *(7 ngày)* | **Dữ liệu Tổ chức, Đợt đồ án & Unblock Nhóm** | Task 3.1, 3.2, 3.3, 3.4, 3.5<br>Task 4.1, 4.2, 4.3, 4.4<br>Task 5.1 | • **Unblock Công & Khoa**: Bàn giao API Lecturer Pool & Degree.<br>• **Unblock cả nhóm**: Bàn giao API Active Project Round & Timeline.<br>• UI Quản lý Tổ chức & Đợt đồ án hoàn thiện.<br>• Hoàn thành bộ đọc Excel danh sách SV. |
| **Tuần 3** | **22/10 – 28/10** *(7 ngày)* | **Import Sinh viên, Import Học vụ & Layout Chung** | Task 5.2, 5.3, 5.4<br>Task 6.1, 6.2, 6.3<br>Task 7.1, 7.2 | • Hoàn thành Import SV (Phase 1) & Tự sinh tài khoản.<br>• **Unblock Công & Quyết**: Bàn giao API Danh sách SV trong đợt.<br>• Hoàn thành Import Dữ liệu Học vụ (Phase 4).<br>• **Unblock Khoa**: Bàn giao API Academic Records.<br>• Layout chuẩn UTCAppLayout + Notification Bell hoàn thiện. |
| **Tuần 4**<br>*(Về đích)* | **29/10 – 01/11** *(4 ngày)* | **Tích hợp Toàn diện (E2E), Khử Mock & Chốt Dự án** | Task 7.3, 7.4 | • Toàn bộ 4 module kết nối trơn tru, không còn Mock data.<br>• Chạy kịch bản E2E từ Giai đoạn 1 đến Giai đoạn 4 thành công 100%.<br>• Review và merge toàn bộ PR vào `main`.<br>• Sẵn sàng bộ dữ liệu mẫu (Seed Data) chuẩn phục vụ Hội đồng chấm. |

---

## 5. CHECKLIST "DEFINITION OF DONE" (DOD) THEO TỪNG NHÓM CHỨC NĂNG

Mỗi nhóm công việc chỉ được coi là **HOÀN THÀNH (DONE)** khi thỏa mãn đầy đủ các tiêu chí kiểm định nghiêm ngặt sau:

### 5.1. DoD cho Hạ tầng dùng chung (Shared Infrastructure)
- [x] File `pom.xml` build thành công không có dependency bị lỗi xung đột phiên bản. (Đã bổ sung validation, jjwt, poi-ooxml, springdoc-openapi).
- [x] Flyway chạy tự động tạo đủ 13 bảng trong PostgreSQL mà không phát sinh lỗi syntax hay lỗi khóa ngoại (V100, V101, V102 đã migrate thành công).
- [x] Mọi response trả về từ Controller đều được đóng gói trong `ApiResponse<T>`.
- [x] Khi xảy ra lỗi (Validation, 404, 401, 500), `GlobalExceptionHandler` trả về JSON đúng chuẩn với mã lỗi `code`, `message`, không để lộ stacktrace nguyên bản ra ngoài.
- [x] Swagger UI (`/swagger-ui.html`) hiển thị đầy đủ danh sách các endpoint kèm mô tả và nút Authorize Bearer Token hoạt động bình thường (OpenApiConfig).
- [x] `FileStorageService` upload được file an toàn, kiểm tra kích thước tối đa (<= 20MB) và lưu đúng đường dẫn quy định.

### 5.2. DoD cho Xác thực & Phân quyền (Authentication & Authorization)
- [ ] Đăng nhập với mật khẩu đúng trả về Access Token hợp lệ; mật khẩu sai trả về 401 Unauthorized kèm thông báo rõ ràng.
- [ ] Mật khẩu trong DB được mã hóa 100% bằng BCrypt, không lưu plain text.
- [ ] Request không có token hoặc token hết hạn khi gọi API bảo vệ sẽ bị chặn 401 ngay tại `JwtAuthenticationFilter`.
- [ ] Phân quyền theo vai trò chính xác: Ví dụ sinh viên gọi API tạo đợt đồ án của Admin phải nhận mã lỗi 403 Forbidden.
- [ ] Frontend lưu token an toàn, tự động đính kèm vào mọi request axios, tự động chuyển về trang `/login` khi token hết hạn.
- [ ] Người dùng đổi mật khẩu thành công và không thể dùng mật khẩu cũ để đăng nhập lại.

### 5.3. DoD cho Dữ liệu nền & Tổ chức (Organization)
- [ ] Tạo lập đầy đủ quan hệ phân cấp: Khoa → Bộ môn → Giảng viên; Ngành → Sinh viên.
- [ ] Giảng viên lưu được đầy đủ thông tin: Mã CB (UNIQUE), Học vị (`THAC_SI`, `TIEN_SI`, `PGS`, `GS`), Hướng nghiên cứu, Bộ môn trực thuộc.
- [ ] Sinh viên liên kết đúng 1-1 với tài khoản `users`, có đầy đủ Mã SV, Lớp, Ngành và Bậc đào tạo.
- [ ] Cung cấp API lọc giảng viên theo học vị và bộ môn với tốc độ phản hồi < 200ms.
- [ ] Giao diện Admin quản lý tổ chức cho phép xem, tìm kiếm và chỉnh sửa dữ liệu thuận tiện.

### 5.4. DoD cho Đợt đồ án & Import Dữ liệu (Project Round & Ingestion)
- [ ] Tạo được đợt đồ án, gắn đúng chương trình đào tạo (Cử nhân hoặc Kỹ sư), không cho phép tạo 2 đợt trùng mã code.
- [ ] Cấu hình được các mốc thời gian (Timeline) và validate ngày kết thúc phải sau ngày bắt đầu.
- [ ] Chức năng Mở / Đóng đợt hoạt động chính xác; API `/project-rounds/active` trả về đợt đồ án đang mở.
- [ ] **Import Sinh viên (Phase 1)**:
  - [ ] Đọc thành công file Excel mẫu (.xlsx).
  - [ ] Hiển thị danh sách lỗi rõ ràng theo dòng nếu file có dữ liệu không hợp lệ.
  - [ ] Khi commit import: Tự động tạo bản ghi `students`, tạo tài khoản `users` với mật khẩu mặc định, gán vào bảng `student_project_rounds`.
  - [ ] Sinh viên đăng nhập được ngay lập tức bằng tài khoản vừa được tạo từ file Excel.
- [ ] **Import Dữ liệu Học vụ (Phase 4)**:
  - [ ] Đọc và lưu chính xác các chỉ số: Số tín chỉ tích lũy, GPA, Nợ học phí, Kỷ luật, Môn tiên quyết vào bảng `academic_records`.
  - [ ] Không can thiệp vào logic duyệt hay loại sinh viên (nhường trọn vẹn cho module của Khoa).
  - [ ] API trả về thông tin học vụ theo `studentId` và `roundId` hoạt động chính xác để module Eligibility gọi sang.

---

## 6. DANH MỤC CÂU HỎI CẦN LÀM RÕ (OPEN QUESTIONS & CLARIFICATIONS)

Để đảm bảo việc triển khai diễn ra chính xác 100%, không bị lệch pha giữa các thành viên và sát với quy định thực tế tại UTC, dưới đây là các câu hỏi quan trọng cần chốt ngay với nhóm và giảng viên hướng dẫn:

### 6.1. Về Quy cách File Excel Import Sinh viên & Dữ liệu Học vụ
1. **Thứ tự & Tên các cột trong file Excel**:
   - File danh sách SV có form mẫu chuẩn từ phòng Đào tạo UTC không? Cần chốt chính xác thứ tự cột (STT | Mã SV | Họ và tên | Ngày sinh | Giới tính | Lớp SH | Mã Ngành | Email | Số ĐT).
   - File dữ liệu học vụ: Điểm GPA dùng thang điểm 4.0 hay thang điểm 10? Cột nợ học phí và kỷ luật được thể hiện dưới dạng chuỗi `"Có"/"Không"` hay số `1/0` hay `True/False`?
2. **Quy tắc xử lý trùng lặp (Conflict Resolution)**:
   - Nếu import một sinh viên đã có sẵn trong bảng `students` (đã từng làm đồ án kỳ trước hoặc import lại file sửa đổi), hệ thống nên **Ghi đè (Update)** thông tin mới hay **Bỏ qua (Skip)** hay **Báo lỗi dừng toàn bộ**? *(Đề xuất: Ghi đè thông tin và cập nhật trạng thái trong đợt).*

### 6.2. Về Chính sách Tài khoản & Mật khẩu Mặc định
3. **Quy tắc sinh mật khẩu mặc định cho Sinh viên khi Import**:
   - Mật khẩu mặc định lần đầu nên sinh theo định dạng nào:
     - Phương án A: Ngày tháng năm sinh (ví dụ sinh ngày 15/08/2003 → `15082003`)?
     - Phương án B: Mã sinh viên + tiền tố cố định (ví dụ `UTC@201200001`)?
     *(Đề xuất: Dùng Phương án B để bảo đảm có ký tự hoa và ký tự đặc biệt, đồng thời bắt buộc SV đổi mật khẩu trong lần đầu đăng nhập).*

### 6.3. Về Mối quan hệ giữa Đợt đồ án và Chương trình đào tạo
4. **Phạm vi Chương trình đào tạo trong một Đợt đồ án**:
   - Trong quy trình Giai đoạn 1: *"Khoa tạo đợt đồ án → Chọn chương trình đào tạo: Cử nhân hoặc Kỹ sư"*.
   - Một đợt đồ án (`project_rounds`) chỉ áp dụng cho **duy nhất 1 chương trình đào tạo** (ví dụ: Tạo riêng đợt Cử nhân K62 và đợt Kỹ sư K62), hay **một đợt đồ án có thể chứa cả 2 chương trình** nhưng phân luồng sinh viên theo trường `bac_dao_tao`?
   *(Đề xuất kiến trúc hiện tại: 1 bản ghi `project_rounds` gắn với 1 `training_program_id`. Nếu Khoa tổ chức cho cả 2 bậc thì tạo 2 đợt riêng biệt để độc lập về mốc thời gian và chỉ tiêu).*

### 6.4. Về Phân định Ranh giới Hướng nghiên cứu Giảng viên (Hùng vs Công)
5. **Cơ chế lưu trữ Hướng nghiên cứu**:
   - Trong phân công, Hùng quản lý *"Hướng nghiên cứu của GV"* (`lecturers.research_interests` dạng text/tags mô tả chuyên môn chung).
   - Đồng thời, Công sở hữu bảng `project_directions` (Danh mục hướng đồ án của đợt) và `lecturer_directions` (GV đăng ký nhận hướng nào trong đợt).
   - Cần xác nhận: Hùng chỉ lưu mô tả chuyên môn nền trong hồ sơ GV, còn việc GV chọn hướng đồ án cụ thể cho từng đợt sẽ do Công quản lý hoàn toàn đúng không? *(Đề xuất: Đúng như vậy để tránh xung đột quyền sở hữu).*

### 6.5. Về Kiến trúc Token & Đăng nhập
6. **Cơ chế Đăng nhập Đa vai trò (Multi-role)**:
   - Một Giảng viên có thể đồng thời là Thành viên Hội đồng chấm thi.
   - Khi đăng nhập: Hệ thống nên dùng 1 API đăng nhập duy nhất (`POST /api/v1/auth/login`) tự động trả về toàn bộ vai trò của user, hay tách thành các API riêng biệt như `/auth/students/login`, `/auth/supervisors/login` như trong file `endpoints.ts` cũ của Frontend?
   *(Đề xuất: Sử dụng 1 API duy nhất `/api/v1/auth/login`, trả về token chứa danh sách roles. Tạo thêm router alias để không làm gãy code cũ của frontend).*

---
*Kế hoạch này là kim chỉ nam kỹ thuật và tiến độ của Nhóm trưởng Phùng Đình Hùng. Toàn bộ các mốc hoàn thành sẽ được đối soát hàng ngày để bảo đảm cán đích ngày 01/11/2026 với chất lượng cao nhất.*
