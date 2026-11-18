# Student Capstone System (UTC-ThesisHub)

## 📚 Hệ Thống Quản Lý Đồ Án Tốt Nghiệp Sinh Viên – UTC

**Student Capstone System (ThesisHub)** là hệ thống quản lý đồ án/khóa luận tốt nghiệp chuyên biệt cho trường Đại học Giao thông Vận tải (UTC), được phát triển nhằm hỗ trợ Khoa, Bộ môn, Giảng viên và Sinh viên trong việc tổ chức, phân công, theo dõi và quản lý toàn bộ vòng đời của một đợt đồ án tốt nghiệp.

Hệ thống số hóa toàn diện quy trình 5 giai đoạn chuẩn của Nhà trường:
* **Giai đoạn 1 (GĐ1):** Khởi tạo đợt đồ án, cấu hình mốc thời gian, import danh sách sinh viên & xét điều kiện làm đồ án.
* **Giai đoạn 2 (GĐ2):** Sinh viên đăng ký hướng đồ án & nguyện vọng GVHD (NV1–NV3); tự động phân công theo thuật toán tối ưu ràng buộc học vị/chỉ tiêu và hỗ trợ quản trị viên duyệt/override.
* **Giai đoạn 3 (GĐ3):** Đề xuất, thẩm định và phê duyệt đề cương chi tiết; xuất file PDF đề cương chuẩn UTC.
* **Giai đoạn 4 (GĐ4):** Quản lý tiến độ thực hiện: giao Task, nộp bài, phản hồi/review, báo cáo định kỳ & nhóm chat hướng dẫn.
* **Giai đoạn 5 (GĐ5):** Xét điều kiện bảo vệ cuối kỳ, thành lập hội đồng chuẩn (1 Chủ tịch – 2 Thư ký – 2 Ủy viên), xếp lịch bảo vệ tự động/thủ công, chấm điểm độc lập, ký số biên bản bảo vệ PDF, tổng hợp điểm và xuất dữ liệu hoàn tất đợt đồ án.

---

## 🎯 Mục tiêu dự án

* **Số hóa 100% quy trình:** Chuyển đổi toàn bộ thao tác thủ công giấy tờ sang quy trình làm việc trực tuyến khép kín.
* **Tự động hóa phân công GVHD:** Áp dụng thuật toán phân bổ nguyện vọng tối ưu, kiểm soát nghiêm ngặt chỉ tiêu hướng dẫn và tiêu chuẩn học vị (Tiến sĩ, Thạc sĩ, Kỹ sư).
* **Minh bạch tiến độ:** Sinh viên và Giảng viên theo dõi sát sao từng đầu việc qua Task board và báo cáo định kỳ.
* **Tổ chức bảo vệ chuyên nghiệp:** Hỗ trợ sinh hội đồng tự động, kiểm tra trùng lịch phòng/giảng viên, hỗ trợ chấm điểm trực tuyến và ký số biên bản bảo vệ.
* **Tập trung hóa dữ liệu:** Toàn bộ lịch sử điểm số, file nộp, biên bản PDF và nhật ký hệ thống được lưu trữ an toàn, truy xuất tức thì.

---

## 👥 Đối tượng sử dụng & Phân quyền

Hệ thống được thiết kế theo mô hình phân quyền chặt chẽ theo vai trò (Role-Based Access Control):

### 1. Sinh viên (STUDENT)
* Cập nhật hồ sơ cá nhân, xem điểm GPA và thông tin đợt đồ án được kích hoạt.
* Chọn hướng nghiên cứu, đăng ký nguyện vọng giảng viên hướng dẫn (NV1, NV2, NV3).
* Xem kết quả phân công GVHD chính thức.
* Nộp đề cương chi tiết, chỉnh sửa theo góp ý và xuất bản in PDF.
* Quản lý nhiệm vụ (Tasks): nộp tài liệu đính kèm, cập nhật tiến độ, trao đổi qua nhóm chat với GVHD.
* Tra cứu điều kiện bảo vệ, xem lịch bảo vệ (phòng, ca, hội đồng).
* Tra cứu kết quả điểm tổng kết, xếp loại và quyết định tốt nghiệp.

### 2. Giảng viên hướng dẫn & Phản biện (SUPERVISOR / LECTURER)
* Quản lý hướng nghiên cứu và cấu hình chỉ tiêu tiếp nhận sinh viên.
* Duyệt và phản hồi đề cương đề tài của sinh viên hướng dẫn.
* Giao nhiệm vụ (Task management), review tài liệu sinh viên nộp, chấm điểm tiến độ định kỳ.
* Trao đổi trực tiếp qua kênh chat hướng dẫn riêng của từng đợt đồ án.
* Chấm điểm phản biện đồ án được phân công.
* Xác nhận sinh viên đủ điều kiện ra bảo vệ trước hội đồng.

### 3. Hội đồng chấm bảo vệ (COMMITTEE_MEMBER / COUNCIL)
* Tiếp nhận danh sách sinh viên và hồ sơ đề tài cần chấm.
* Nhập điểm thành phần độc lập trong buổi bảo vệ.
* Ký số xác nhận Biên bản bảo vệ đồ án tốt nghiệp trực tuyến.

### 4. Quản trị viên Khoa (ADMIN / FACULTY_ADMIN)
* Quản lý cấu trúc tổ chức: Khoa, Bộ môn, Ngành đào tạo, Giảng viên, Sinh viên.
* Khởi tạo và quản trị vòng đời đợt đồ án (DRAFT → OPEN → IN_PROGRESS → CLOSED → ARCHIVED).
* Import sinh viên và kết quả học tập từ file Excel; tự động kích hoạt tài khoản khi mở đợt.
* Quản lý phân công GVHD: chạy thuật toán phân bổ tự động, điều chỉnh (override), chốt danh sách.
* Thành lập các hội đồng chấm bảo vệ theo cơ cấu chuẩn.
* Xếp lịch bảo vệ tự động (tránh trùng phòng, trùng lịch thành viên hội đồng).
* Khóa đợt, ký xuất dữ liệu cuối kỳ và công bố điểm chính thức về tài khoản sinh viên.

---

## 🔄 Quy trình nghiệp vụ 5 giai đoạn

```text
       [ GIAI ĐOẠN 1: KHỞI TẠO ĐỢT ĐỒ ÁN ]
Khoa tạo đợt đồ án → Import danh sách SV đủ điều kiện → Mở đợt & kích hoạt tài khoản
                            ↓
       [ GIAI ĐOẠN 2: ĐĂNG KÝ NGUYỆN VỌNG & PHÂN CÔNG GVHD ]
SV chọn hướng & đăng ký NV1-NV3 → Thuật toán phân bổ tự động → Admin duyệt/override → Chốt phân công
                            ↓
       [ GIAI ĐOẠN 3: XÂY DỰNG & DUYỆT ĐỀ CƯƠNG ]
GVHD & SV thống nhất tên đề tài → Nộp đề cương → GV duyệt & xuất PDF đề cương chuẩn UTC
                            ↓
       [ GIAI ĐOẠN 4: THỰC HIỆN ĐỒ ÁN & THEO DÕI TIẾN ĐỘ ]
Giao việc (Tasks) → Nộp bài & Review → Báo cáo tiến độ định kỳ → Nhóm chat trao đổi
                            ↓
       [ GIAI ĐOẠN 5: BẢO VỆ & HOÀN TẤT ĐỢT ĐỒ ÁN ]
Xét duyệt điều kiện bảo vệ → Thành lập hội đồng (1CT-2TK-2UV) → Xếp lịch bảo vệ
                            ↓
Chấm điểm hội đồng → Ký số Biên bản bảo vệ PDF → Ký xuất dữ liệu & Đóng hoàn tất đợt
```

---

## 🛠️ Công nghệ sử dụng

### Backend
* **Ngôn ngữ:** Java 21 LTS
* **Framework:** Spring Boot 3.x
* **Bảo mật:** Spring Security 6, JWT (JSON Web Token), RBAC
* **Cơ sở dữ liệu:** PostgreSQL 15+
* **ORM & Data Access:** Spring Data JPA, Hibernate
* **Database Migration:** Flyway (tự động quản lý version schema)
* **Xử lý tài liệu:** Apache POI (Excel import/export), OpenPDF / iText (xuất biên bản PDF)
* **Build tool:** Apache Maven
* **Tài liệu API:** Springdoc OpenAPI / Swagger UI

### Frontend
* **Core:** React 18, TypeScript
* **Build tool:** Vite
* **Routing:** React Router v6
* **HTTP Client:** Axios (Interceptors xử lý Bearer Token & Refresh Token)
* **Styling:** CSS3, Tailwind CSS, Responsive Web Design
* **Đa ngôn ngữ:** i18next (Tiếng Việt & English)
* **Testing:** Vitest, React Testing Library, Playwright

---

## 📁 Cấu trúc thư mục dự án

```text
student-capstone-system/
│
├── backend/
│   └── thesis-hub-api/
│       ├── pom.xml
│       └── src/
│           ├── main/
│           │   ├── java/com/example/thesis_hub_api/
│           │   │   ├── assignment/     # Nghiệp vụ phân công GVHD & thuật toán
│           │   │   ├── common/         # Exception handling, pagination, base DTO
│           │   │   ├── config/         # Security, CORS, Swagger config
│           │   │   ├── defense/        # Hội đồng, xếp lịch, chấm điểm, ký biên bản PDF
│           │   │   ├── eligibility/    # Xét điều kiện làm đồ án & điều kiện bảo vệ
│           │   │   ├── file/           # Quản lý lưu trữ file đính kèm
│           │   │   ├── identity/       # Quản lý tài khoản, User, Auth, JWT
│           │   │   ├── notification/   # Hệ thống thông báo người dùng
│           │   │   ├── organization/   # Khoa, Bộ môn, Ngành, Giảng viên, Sinh viên
│           │   │   ├── progress/       # Quản lý Task, nộp bài, báo cáo tiến độ
│           │   │   ├── projectround/   # Quản lý đợt đồ án, import Excel sinh viên
│           │   │   └── thesis/         # Quản lý đề tài, đề cương chi tiết
│           │   └── resources/
│           │       ├── application.yml # Cấu hình môi trường & kết nối DB
│           │       └── db/migration/   # Tập lệnh migration Flyway
│           └── test/                   # JUnit 5 & Mockito unit tests
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── public/                         # Mẫu Excel sinh viên, favicon, logo UTC
│   └── src/
│       ├── assets/                     # Hình ảnh, logo, icon
│       ├── components/                 # Component tái sử dụng (Layout, Modal, Badge...)
│       ├── contexts/                   # AuthContext, ThemeContext
│       ├── features/
│       │   ├── assignment/             # GĐ2: Phân công GVHD & duyệt nguyện vọng
│       │   ├── chat/                   # Nhóm chat hướng dẫn đồ án
│       │   ├── defense/                # GĐ5: Hội đồng, xếp lịch, chấm điểm & ký PDF
│       │   ├── eligibility/            # Xét duyệt điều kiện làm đồ án & bảo vệ
│       │   ├── progress/               # GĐ4: Giao task, theo dõi tiến độ đồ án
│       │   ├── project-round/          # GĐ1: Quản lý đợt đồ án & danh sách SV
│       │   └── thesis/                 # GĐ3: Đề cương đề tài, duyệt & xuất PDF
│       ├── pages/                      # Các trang Dashboard theo vai trò, Login
│       ├── routes/                     # Cấu hình routing & phân quyền ProtectedRoute
│       └── services/                   # Axios API service layers
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt và chạy ứng dụng

### 1. Yêu cầu môi trường
* **Java:** JDK 21 trở lên
* **Node.js:** v18 trở lên (khuyến nghị v20+) & npm
* **Cơ sở dữ liệu:** PostgreSQL 14 trở lên

---

### 2. Cài đặt Backend (Spring Boot)

1. Mở terminal và di chuyển vào thư mục backend:
   ```bash
   cd backend/thesis-hub-api
   ```

2. Cấu hình thông tin cơ sở dữ liệu trong file `src/main/resources/application.yml` (hoặc tạo database `thesishub` trong PostgreSQL):
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/thesishub
       username: postgres
       password: your_password
   ```

3. Chạy ứng dụng Backend:
   * Trên Windows:
     ```bash
     .\mvnw.cmd spring-boot:run
     ```
   * Trên Linux/macOS:
     ```bash
     ./mvnw spring-boot:run
     ```

4. Sau khi khởi động thành công:
   * **API Base URL:** `http://localhost:8080/api/v1`
   * **Swagger UI Documentation:** `http://localhost:8080/swagger-ui/index.html`

---

### 3. Cài đặt Frontend (React + Vite)

1. Mở terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Chạy môi trường Development:
   ```bash
   npm run dev
   ```

4. Truy cập giao diện người dùng tại trình duyệt:
   * **Frontend URL:** `http://localhost:5173`

---

### 4. Kiểm thử (Testing)

* **Backend Unit & Integration Tests:**
  ```bash
  cd backend/thesis-hub-api
  ./mvnw test
  ```

* **Frontend Unit Tests (Vitest):**
  ```bash
  cd frontend
  npm test
  # hoặc chạy một lần:
  npm run test:run
  ```

---

## 👨‍💻 Thông tin đồ án & Đơn vị phát triển

* **Học phần:** Phát triển phần mềm mã nguồn mở
* **Đơn vị:** Khoa Công nghệ Thông tin – Trường Đại học Giao thông Vận tải (UTC)
* **Kho lưu trữ chính thức:** [Hungdinhz/UTC-ThesisHub](https://github.com/Hungdinhz/UTC-ThesisHub)
