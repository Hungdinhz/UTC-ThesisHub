# Đây là file cho người dùng đọc, AI không được phép đọc
# 📘 Hướng dẫn sử dụng UTC-ThesisHub

> Tài liệu mô tả toàn bộ quy trình quản lý đồ án tốt nghiệp trên hệ thống, đi theo thứ tự **5 bước** từ khởi tạo đợt đến đóng đợt.

## 📑 Mục lục

| Bước | Nội dung | Vai trò chính |
|:---:|---|---|
| [1](#bước-1--khởi-tạo-đợt-đồ-án--dữ-liệu-giai-đoạn-1) | Khởi tạo đợt đồ án & Dữ liệu | Admin (Khoa) |
| [2](#bước-2--đăng-ký-nguyện-vọng--phân-công-giai-đoạn-2) | Đăng ký nguyện vọng & Phân công GVHD | Sinh viên, Admin |
| [3](#bước-3--xây-dựng--phê-duyệt-đề-tài-giai-đoạn-3) | Xây dựng & Phê duyệt đề tài | Sinh viên, GVHD, Admin |
| [4](#bước-4--thực-hiện-đồ-án--quản-lý-tiến-độ-giai-đoạn-4) | Thực hiện đồ án & Quản lý tiến độ | GVHD, Sinh viên |
| [5](#bước-5--xét-điều-kiện-hội-đồng-chấm-điểm--kết-thúc-giai-đoạn-5) | Xét ĐK bảo vệ, Hội đồng, Chấm điểm & Kết thúc | Admin, Hội đồng |

## 🔑 Tài khoản thử nghiệm

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
|---|---|---|---|
| Quản trị viên (Khoa) | `admin` | `Admin@123` | Chọn tab **Quản trị viên** khi đăng nhập |
| Sinh viên Kỹ sư | `2021600001` | `Password@123` | |
| Giảng viên hướng dẫn | `huongnv@utc.edu.vn` | — | TS. Nguyen Van Huong |

---

## BƯỚC 1 — Khởi tạo đợt đồ án & Dữ liệu (Giai đoạn 1)

### 1.1. Đăng nhập Admin

Truy cập `/login` → chọn tab **Quản trị viên** → đăng nhập `admin` / `Admin@123`.

### 1.2. Tạo Giảng viên thủ công

📍 Menu **"Dữ liệu Tổ chức & GV/SV"** (`/admin/organization`) → tab **Giảng viên** → bấm **"Thêm Giảng viên"**.

| Trường | Giá trị mẫu |
|---|---|
| Mã CB | `CB999` |
| Họ tên | TS. Phạm Văn Mẫu |
| Email | `maupv@utc.edu.vn` |
| Bộ môn | Bộ môn Công nghệ phần mềm |
| Học vị | `TIEN_SI` |
| Hướng nghiên cứu | AI, Hệ thống nhúng |
| Chỉ tiêu | `5` |

Bấm **"Lưu Giảng viên"**.

> ✅ **Kết quả:** Hệ thống tạo tài khoản User và hồ sơ Giảng viên thành công.

### 1.3. Tạo Sinh viên thủ công

📍 Chuyển sang tab **Sinh viên** → bấm **"Thêm Sinh viên"**.

| Trường | Giá trị mẫu |
|---|---|
| MSSV | `2021609999` |
| Họ tên | Lê Văn Thử Nghiệm |
| Email | `2021609999@lms.utc.edu.vn` |
| Lớp | CNTT 1 - K62 |
| Ngành | Công nghệ thông tin (CNTT) |
| Chương trình đào tạo | Chương trình Kỹ sư |

Bấm **"Lưu Sinh viên"**.

### 1.4. Tạo đợt đồ án mới

📍 Menu **"Đợt đồ án & SV"** (`/admin/project-rounds`) → bấm **"➕ Tạo đợt đồ án mới"**.

| Trường | Giá trị mẫu |
|---|---|
| Mã đợt | `DA_CNTT_K62_HK1` |
| Tên đợt | Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027 |
| Năm học | `2026-2027` |
| Học kỳ | `HK1` |
| Chương trình | Chương trình Kỹ sư *(hoặc Chương trình Cử nhân)* |

1. Bấm **"Lưu đợt đồ án"**.
2. Bấm **"Mở đợt (OPEN)"** trên thanh trạng thái.

### 1.5. Import danh sách sinh viên qua Excel

1. Chọn đợt đồ án vừa tạo → tab **"Danh sách sinh viên & Import Excel"**.
2. Bấm **"📥 Tải file mẫu Excel UTC"**.
3. Mở file mẫu, kiểm tra các cột:
   `STT` · `MSSV` · `Họ đệm` · `Tên` · `Ngành` · `Lớp` · `SĐT` · `Email` · `Điểm GPA (Hệ 4.0)`
4. Bấm **"📤 Import danh sách sinh viên"** → chọn file Excel → bấm **"Phân tích trước (Preview)"**.
5. Xem bảng xem trước: cột GPA và các dòng hợp lệ có tích xanh **Hợp lệ**.
6. Bấm **"Xác nhận ghi dữ liệu (Commit Import)"**.

> ✅ **Kết quả:**
> - Hệ thống tạo User, Sinh viên với điểm GPA chính thức và ghi danh vào đợt.
> - Bảng sinh viên hiển thị cột **GPA** (thay thế cho cột Nợ TC).
> - Khi thêm SV thủ công, form có thêm ô nhập **"Điểm GPA tích lũy"**.

### 1.6. Quản lý Giảng viên trong đợt đồ án

📍 Trang **"Đợt đồ án & SV"** (`/admin/project-rounds`) → tab **"👨‍🏫 Giảng viên trong đợt"**.

- **Thẻ thống kê:** Tổng số GV tham gia đợt · Tổng chỉ tiêu (Quota) · Đã phân công · Chỉ tiêu còn lại.
- **"➕ Thêm Giảng viên vào đợt":** đưa thêm GV từ danh mục vào đợt.
- **Chỉnh sửa:** điều chỉnh hạn mức hướng dẫn (`maxQuota`), ghi chú.
- **Xóa GV khỏi đợt:** chỉ được phép khi GV chưa có SV được phân công.

### 1.7. Tra cứu theo đợt tại Dữ liệu Tổ chức

📍 Menu **"Dữ liệu Tổ chức & GV/SV"** (`/admin/organization`):

| Tab | Bộ lọc mới | Cột mới |
|---|---|---|
| Giảng viên | "Tất cả đợt đồ án" | **"Đợt đồ án tham gia"** — huy hiệu các đợt GV đang phụ trách |
| Sinh viên | "Tất cả đợt đồ án" | **"Đợt đồ án"** — huy hiệu đợt SV đã được ghi danh |

---

## BƯỚC 2 — Đăng ký nguyện vọng & Phân công (Giai đoạn 2)

### 2.1. Sinh viên đăng ký hướng & nguyện vọng

1. Đăng xuất Admin, đăng nhập tài khoản **Sinh viên Kỹ sư** (`2021600001` / `Password@123`).
2. Sidebar → **"🎯 Đăng ký hướng & Nguyện vọng"** (`/student/assignment`).
3. **Chọn Hướng đồ án** từ danh sách 7 hướng chính thức, VD: *Phát triển phần mềm và ứng dụng (WebApp, MobileApp)*.
4. **Điểm GPA** hiển thị và bị khóa cứng tự động (🔒 *Đã khóa cứng theo hồ sơ đợt đồ án*) — sinh viên không thể tự sửa.

### 2.2. Thử nghiệm ràng buộc học vị (SV Kỹ sư)

| # | Thao tác | Kết quả |
|:---:|---|---|
| 1 | Chọn NV1 là GV học vị **Thạc sĩ** (ThS. Pham Van Dong) rồi bấm nộp | ❌ Cảnh báo đỏ: *"Quy định đối với sinh viên chương trình Kỹ sư: Giảng viên hướng dẫn phải có học vị Tiến sĩ trở lên. Vui lòng chọn lại!"* |
| 2 | Đổi NV1 sang GV học vị **Tiến sĩ** (TS. Nguyen Van Huong) | Hợp lệ |
| 3 | Chọn NV2, NV3, nhập tiêu chí phụ | — |
| 4 | Bấm **"Xác nhận nộp nguyện vọng"** | ✅ Báo thành công |

### 2.3. Khoa chạy thuật toán phân công tự động

1. Đăng nhập lại tài khoản `admin`.
2. Menu **"🎯 Phân công GVHD"** (`/admin/assignments`).
3. Bấm **"⚡ Chạy thuật toán phân công đề xuất"**.

**Ràng buộc thuật toán:**

| Loại | Nội dung |
|---|---|
| **Hard** (bắt buộc) | Hạn mức capacity của GV · Học vị Tiến sĩ cho SV Kỹ sư · Hướng đồ án phù hợp |
| **Soft** (tính điểm) | NV1 = 100 điểm · NV2 = 60 điểm · NV3 = 30 điểm · Điểm thưởng GPA |

> ✅ **Kết quả:** Danh sách phân công đề xuất hiển thị trên bảng `AssignmentProposalTable`.

### 2.4. Khoa xem xét & điều chỉnh (Override)

1. Bấm **"Override"** trên dòng sinh viên cần đổi GVHD.
2. Chọn GV mới và nhập lý do.
3. Bấm **"Xác nhận điều chỉnh"** → hệ thống cập nhật phân công thủ công.

### 2.5. Chốt kết quả phân công

1. Bấm **"🔒 Chốt kết quả phân công (Finalize)"**.
2. Hộp thoại hiển thị quy định:

   > ⚠️ *"Những sinh viên chưa đăng ký nguyện vọng đồ án trong đợt này sẽ tự động bị **LOẠI KHỎI ĐỢT** theo quy định"*

3. Bấm xác nhận.

> ✅ **Kết quả:**
> - Trạng thái các phân công chuyển sang `FINALIZED`.
> - SV chưa nộp đăng ký hướng/nguyện vọng tự động chuyển sang `DROPPED` (Bị loại khỏi đợt) kèm lý do.
> - Thẻ thống kê hiển thị số SV bị loại: **"🚫 Loại X SV"**.
> - SV đã được phân công khi đăng nhập sẽ thấy banner chúc mừng kèm tên GVHD chính thức.

---

## BƯỚC 3 — Xây dựng & Phê duyệt đề tài (Giai đoạn 3)

### Luồng trạng thái đề cương

```
DRAFT ──(SV nộp)──▶ SUBMITTED ──(GVHD duyệt)──▶ UNDER_REVIEW ──(Khoa duyệt)──▶ APPROVED
```

| # | Vai trò | Thao tác | Trạng thái sau |
|:---:|---|---|---|
| 1 | Sinh viên | Vào **"📑 Đề cương đồ án"** (`/thesis/proposals`) → **"Tạo đề cương mới"** → nhập tên đề tài (Việt/Anh), mục tiêu, nội dung nghiên cứu | `DRAFT` |
| 2 | Sinh viên | Bấm **"Nộp đề cương"** | `SUBMITTED` |
| 3 | GVHD (`huongnv@utc.edu.vn`) | Mở đề cương → bấm **"Phê duyệt đề cương"** | `UNDER_REVIEW` |
| 4 | Admin (Khoa) | Duyệt đề tài | `APPROVED` |

> ✅ **Kết quả khi APPROVED:** Hệ thống tự động tạo **Đề tài chính thức (Thesis)** với mã `DT_DA_CNTT_K62_HK1_...` và trạng thái `IN_PROGRESS`.

### Xuất đề cương PDF

Bấm **"Xuất file Đề cương (PDF)"** để in/tải đề cương có chữ ký sinh viên và xác nhận của Khoa.

---

## BƯỚC 4 — Thực hiện đồ án & Quản lý tiến độ (Giai đoạn 4)

### 4.1. Giao Task và Deadline (GVHD)

1. Vào **"📌 Bảng tiến độ & Task"** (`/progress/tasks`).
2. Thanh điều khiển trên cùng có 2 bộ chọn riêng:
   - **"📁 Đợt đồ án"** — lọc danh sách đề tài theo đợt.
   - **"🎯 Tên đề tài"** — chọn đề tài cần theo dõi/giao việc.
3. Tạo các Task, VD: *Thiết kế Database*, *Viết API Backend*, *Xây dựng giao diện React*.
4. Đặt mức độ ưu tiên, deadline và gán cho SV.

### 4.2. Sinh viên nộp bài (Submission)

SV đăng nhập → mở Task → kéo sang `IN_PROGRESS` → nhập nội dung kết quả và link Github/Báo cáo → bấm **"Nộp kết quả"** → Task chuyển thành `SUBMITTED`.

### 4.3. Giảng viên Review & Đánh giá

| Đánh giá | Thao tác | Kết quả |
|---|---|---|
| ❌ Chưa đạt | Chọn `REVISE_REQUIRED`, nhập nhận xét sửa chữa | Task quay về `REVISE` để SV làm lại |
| ✅ Đạt | Chọn `ACCEPTED` | Task chuyển `COMPLETED`, thanh tiến độ đề tài tăng |

### Luồng trạng thái Task

```
TODO ──▶ IN_PROGRESS ──▶ SUBMITTED ──┬──(Đạt)──────▶ COMPLETED
                ▲                    │
                └──── REVISE ◀───────┘(Chưa đạt)
```

### 4.4. Xác nhận đủ điều kiện bảo vệ

Khi hoàn thành các mốc quan trọng, GVHD xác nhận đề tài đạt yêu cầu → trạng thái chuyển sang `DEFENSE_READY`.

---

## BƯỚC 5 — Xét điều kiện, Hội đồng, Chấm điểm & Kết thúc (Giai đoạn 5)

### 5.1. Quản lý học vụ & Xét điều kiện bảo vệ cuối kỳ

📍 Trang **"G05: Xét ĐK Bảo vệ Cuối"** (`/admin/final-eligibility`) → chọn **"Đợt đồ án"** ở thanh lọc phía trên.

| Tab | Chức năng |
|---|---|
| **1. Xét điều kiện bảo vệ cuối kỳ** | Nhập Mã đề tài hoặc Mã SV để kiểm tra tự động: hoàn thành task, xác nhận GVHD, học vụ |
| **2. Sinh viên trong đợt** | Danh sách SV ghi danh kèm GPA, trạng thái và nút **"🔍 Xét ĐK bảo vệ"** trực tiếp |
| **3. Quản lý kết quả học vụ** | Tải Excel mẫu học vụ · Thêm học vụ thủ công · Import học vụ (Excel Contract 4): tín chỉ tích lũy, môn tiên quyết, tình trạng học phí |

### 5.2. Thử nghiệm nhánh Bảo lưu

1. **SV** nộp đơn bảo lưu tại `/student/reservation`.
2. **Khoa** vào `/admin/reservations` → bấm **"Phê duyệt đơn bảo lưu"**.

> ✅ **Kết quả:** Hệ thống lưu hồ sơ bảo lưu, chuyển SV sang `RESERVED` và chuyển dữ liệu sang hồ sơ cuối kỳ.

### 5.3. Thành lập Hội đồng chấm bảo vệ

📍 Menu **"🎓 Hội đồng & Lịch bảo vệ"** (`/admin/councils`) → bấm **"⚡ Sinh Hội đồng tự động (Thuật toán CSP 1CT - 2TK - 2UV)"**.

| Thành phần mỗi hội đồng | Số lượng |
|---|:---:|
| Chủ tịch (CT) | 1 |
| Thư ký (TK) | 2 |
| Ủy viên (UV) | 2 |
| **Tổng** | **5** |

> ℹ️ Thuật toán tự động **loại trừ GVHD** của các sinh viên trong ca đó khỏi hội đồng.

### 5.4. Phân công Giảng viên phản biện (GVPB)

Chuyển sang tab **Phản biện** → hệ thống tự động gán GVPB với ràng buộc:
- GVPB **≠** GVHD.
- Cân bằng tải số lượng đề tài phản biện giữa các GV.

### 5.5. Xếp lịch bảo vệ

1. Vào **"Xếp lịch bảo vệ"** (`/admin/defense-schedules`).
2. Chọn ngày bảo vệ, phòng (VD: *Phòng A2-301*), ca sáng/chiều.
3. Bấm **"Tự động sinh lịch"** → hệ thống phân bổ SV vào từng khung giờ.

### 5.6. Nhập điểm và nhận xét

📍 Menu **"📝 Chấm điểm & Kết quả"** (`/admin/defense-scoring`) — thành viên Hội đồng nhập điểm (thang **0 – 10**) và nhận xét:

| Thành phần điểm | Trọng số |
|---|:---:|
| Điểm GVHD | **0.3** |
| Điểm GVPB | **0.2** |
| Điểm Hội đồng | **0.5** |

$$\text{Điểm tổng kết} = 0.3 \times \text{GVHD} + 0.2 \times \text{GVPB} + 0.5 \times \text{Hội đồng}$$

### 5.7. Tổng hợp kết quả & Xuất biên bản

1. Bấm **"Tổng hợp kết quả cuối kỳ"** → hệ thống tính điểm tổng kết và xếp loại: *Xuất sắc · Giỏi · Khá · Trung bình · Không đạt*.
2. Bấm **"📄 Xuất Biên bản bảo vệ PDF"** và **"📊 Xuất Bảng điểm tổng hợp cuối kỳ"**.

### 5.8. Đóng đợt đồ án

Quay lại trang **Quản lý Đợt đồ án** → bấm **"🔒 Đóng đợt (CLOSED)"** để hoàn tất toàn bộ vòng đời đợt đồ án.

---

## 🔄 Vòng đời trạng thái đợt đồ án

```
Tạo mới ──▶ OPEN ──▶ (Phân công · Đề tài · Tiến độ · Bảo vệ) ──▶ CLOSED
```
