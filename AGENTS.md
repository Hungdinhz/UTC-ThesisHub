# THESISHUB PROJECT RULES & AGENT INSTRUCTIONS

## 1. USER CONTEXT & IDENTITY
- **Active Developer**: Khuất Đăng Khoa
- **Role**: Full-stack Developer – Eligibility / Defense / Result (Module 4)
- **Primary Mission**: Chịu trách nhiệm trọn vẹn từ DB -> Backend -> Frontend -> Test cho Module xét điều kiện, bảo lưu, hội đồng, xếp lịch, chấm điểm và kết quả.

---

## 2. STRICT PERMISSION & CODE OWNERSHIP BOUNDARIES (BẮT BUỘC TUÂN THỦ)

### ✅ CÁC VÙNG KHOA ĐƯỢC PHÉP TẠO MỚI & CHỈNH SỬA TOÀN QUYỀN:
1. **Backend**:
   - `backend/.../thesis_hub_api/eligibility/**`
   - `backend/.../thesis_hub_api/defense/**`
2. **Frontend**:
   - `frontend/src/features/eligibility/**`
   - `frontend/src/features/defense/**`
3. **Database Migration**:
   - Chỉ tạo/sửa các file migration thuộc dải: `V4xx__*.sql` trong `src/main/resources/db/migration/`
4. **Test**:
   - `backend/.../src/test/java/.../eligibility/**`
   - `backend/.../src/test/java/.../defense/**`
5. **7 Bảng dữ liệu thuộc sở hữu của Khoa (Owner)**:
   - `reservation_requests` (`DONBAOLUU` - ReservationRequest)
   - `reviewer_assignments` (`PHANCONGPHANBIEN` - ReviewerAssignment)
   - `defense_councils` (`HOIDONG` - DefenseCouncil)
   - `council_members` (`THANHVIENHOIDONG` - CouncilMember)
   - `defense_schedules` (`LICHBAOVE` - DefenseSchedule)
   - `scores` (`DIEMSO` - Score)
   - `graduation_results` (`KETQUATOTNGHIEP` - GraduationResult)

---

### ❌ CÁC VÙNG CẤM (READ-ONLY HOẶC KHÔNG TỰ Ý SỬA ĐỔI):
1. **Module của thành viên khác (Chỉ đọc DTO/Interface, không sửa code nội bộ)**:
   - `identity/`, `organization/`, `projectround/` (Hùng sở hữu)
   - `assignment/` (Công sở hữu)
   - `thesis/`, `progress/` (Quyết sở hữu)
   - Không được tạo hoặc sửa các file migration: `V1xx`, `V2xx`, `V3xx`.
2. **Thư mục dùng chung (Shared Folders)**:
   - Backend: `common/`, `config/`, `notification/`, `file/`
   - Frontend: `components/ui/`, `layouts/`, `routes/`, `stores/`, `utils/`
   - **Quy tắc**: Đây là tài nguyên do Tech Lead (Hùng) quản lý. Agent CHỈ ĐƯỢC sử dụng (import/call), KHÔNG ĐƯỢC tự ý sửa đổi code gốc của shared folder trừ khi cần thêm utility mà nhóm đã thống nhất.

---

## 3. ARCHITECTURE & CODING CONVENTIONS
1. **Ngôn ngữ trong mã nguồn**: 
   - 100% đặt tên tiếng Anh cho Class, Method, Variable, DB table, Column, API endpoint.
   - Comment code bằng tiếng Việt hoặc tiếng Anh rõ ràng.
2. **Kiến trúc Vertical Slice**:
   - Mỗi chức năng phải đi theo luồng khép kín:
     `DB Migration (V4xx)` -> `Entity` -> `Repository` -> `DTO & Mapper` -> `Service` -> `Controller` -> `Frontend Page/Component` -> `Test`.
3. **Nguyên tắc giao tiếp liên module**:
   - Không query trực tiếp bảng của thành viên khác bằng Entity relation nếu gây vòng lặp phụ thuộc.
   - Khi cần dữ liệu ngoài (User, Student, Lecturer, Round, Thesis), giao tiếp qua Service contract hoặc DTO. Trong giai đoạn chưa có API thật, sử dụng **Mock Service / Mock Data**.
4. **Quy tắc Git**:
   - Làm việc trên nhánh `feature/defense` hoặc `feature/eligibility`. Không commit trực tiếp lên `main` hay `develop`.

---

## 4. CORE BUSINESS LOGIC REQUIREMENTS (ĐẶC TẢ NGHIỆP VỤ BẮT BUỘC)
1. **Hội đồng bảo vệ (1CT - 2TK - 2UV)**:
   - Mỗi hội đồng bắt buộc có đúng 5 thành viên: 1 Chủ tịch, 2 Thư ký, 2 Ủy viên.
2. **Ràng buộc cứng (Hard Constraint - Bắt buộc)**:
   - Giảng viên hướng dẫn của sinh viên (GVHD) **TUYỆT ĐỐI KHÔNG** được ngồi trong Hội đồng chấm chính sinh viên đó: `GVHD(s) ∉ CouncilMembers(s)`.
   - Giảng viên phản biện (GVPB) **KHÔNG ĐƯỢC TRÙNG** với GVHD của đề tài: `GVPB ≠ GVHD`.
3. **Thuật toán**:
   - Sử dụng CSP (Constraint Satisfaction Problem) giải bằng Backtracking + Greedy (ưu tiên chọn GV có tải thấp nhất) để sinh Hội đồng và xếp lịch.