BƯỚC 1: Khởi tạo đợt đồ án & Dữ liệu (Giai đoạn 1)
Đăng nhập Admin: Truy cập /login, chọn tab Quản trị viên, đăng nhập admin / Admin@123.
Kiểm tra/Tạo Giảng viên thủ công:
Vào menu "Dữ liệu Tổ chức & GV/SV" (/admin/organization), chuyển sang tab Giảng viên.
Bấm nút "Thêm Giảng viên". Nhập:
Mã CB: CB999
Họ tên: TS. Phạm Văn Mẫu
Email: maupv@utc.edu.vn
Bộ môn: Bộ môn Công nghệ phần mềm
Học vị: TIEN_SI
Hướng nghiên cứu: AI, Hệ thống nhúng
Chỉ tiêu: 5
Bấm "Lưu Giảng viên" -> Hệ thống tạo tài khoản User và hồ sơ GV thành công.
Kiểm tra/Tạo Sinh viên thủ công:
Chuyển sang tab Sinh viên, bấm "Thêm Sinh viên". Nhập:
MSSV: 2021609999
Họ tên: Lê Văn Thử Nghiệm
Email: 2021609999@lms.utc.edu.vn
Lớp: CNTT 1 - K62
Ngành: Công nghệ thông tin (CNTT)
Chương trình đào tạo: Chương trình Kỹ sư
Bấm "Lưu Sinh viên".
Tạo đợt đồ án mới:
Vào menu "Đợt đồ án & SV" (/admin/project-rounds).
Bấm "➕ Tạo đợt đồ án mới".
Điền thông tin:
Mã đợt: DA_CNTT_K62_HK1
Tên đợt: Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027
Năm học: 2026-2027 | Học kỳ: HK1
Chương trình: Chương trình Kỹ sư (hoặc Chương trình Cử nhân)
Bấm "Lưu đợt đồ án". Bấm nút "Mở đợt (OPEN)" trên thanh trạng thái.
Import danh sách sinh viên qua Excel:
Chọn đợt đồ án vừa tạo, tại tab "Danh sách sinh viên & Import Excel", bấm nút "📥 Tải file mẫu Excel UTC".
Mở file vừa tải về, kiểm tra các cột STT, MSSV, Họ đệm, Tên, Ngành, Lớp, SĐT, Email.
Bấm "📤 Import danh sách sinh viên", chọn file Excel, bấm "Phân tích trước (Preview)".
Xem bảng xem trước: Các dòng hợp lệ có tích xanh Hợp lệ.
Bấm "Xác nhận ghi dữ liệu (Commit Import)".
Kết quả mong đợi: Hệ thống báo thành công tạo mới User, Sinh viên và ghi danh vào đợt với trạng thái ELIGIBLE.
BƯỚC 2: Sinh viên đăng ký nguyện vọng & Khoa phân công (Giai đoạn 2)
Sinh viên đăng nhập & Đăng ký nguyện vọng:
Đăng xuất Admin, đăng nhập bằng tài khoản Sinh viên Kỹ sư (VD: 2021600001 / Password@123).
Trên Sidebar, bấm vào "🎯 Đăng ký hướng & Nguyện vọng" (/student/assignment).
Bước 1: Chọn Hướng đồ án: Công nghệ phần mềm & Web nâng cao.
Bước 2: Danh sách Giảng viên hiển thị tương ứng theo hướng.
Thử nghiệm nhánh kiểm tra học vị Kỹ sư:
Chọn NV1 là một Giảng viên có học vị Thạc sĩ (ThS. Pham Van Dong).
Bấm nộp -> Hệ thống hiển thị cảnh báo đỏ: "Quy định đối với sinh viên chương trình Kỹ sư: Giảng viên hướng dẫn phải có học vị Tiến sĩ trở lên. Vui lòng chọn lại!"
Đổi NV1 sang Giảng viên học vị Tiến sĩ (TS. Nguyen Van Huong).
Chọn NV2, NV3, nhập GPA: 3.45, tiêu chí phụ.
Bấm "Xác nhận nộp nguyện vọng" -> Báo thành công.
Khoa chạy thuật toán phân công tự động:
Đăng nhập lại tài khoản admin.
Vào menu "🎯 Phân công GVHD" (/admin/assignments).
Bấm nút "⚡ Chạy thuật toán phân công đề xuất".
Thuật toán kiểm tra hard constraints (hạn mức capacity, học vị Tiến sĩ cho Kỹ sư, hướng đồ án) và soft constraints (NV1=100 điểm, NV2=60, NV3=30, điểm thưởng GPA).
Danh sách phân công đề xuất hiển thị trên bảng AssignmentProposalTable.
Khoa xem xét & Điều chỉnh (Override):
Nếu muốn đổi GVHD cho 1 SV, bấm nút "Override" trên dòng tương ứng, chọn GV mới và nhập lý do.
Bấm "Xác nhận điều chỉnh" -> Hệ thống cập nhật phân công thủ công.
Khoa chốt kết quả phân công:
Bấm nút "🔒 Chốt kết quả phân công (Finalize)".
Trạng thái các phân công chuyển sang FINALIZED. Sinh viên đăng nhập vào sẽ thấy banner chúc mừng kèm tên GVHD chính thức.
BƯỚC 3: Xây dựng & Phê duyệt đề tài (Giai đoạn 3)
Tạo và gửi đề cương (Draft):
Sinh viên vào mục "📑 Đề cương đồ án" (/thesis/proposals), bấm "Tạo đề cương mới".
Nhập tên đề tài tiếng Việt, tiếng Anh, mục tiêu, nội dung nghiên cứu.
Trạng thái ban đầu: DRAFT. Bấm "Nộp đề cương" -> Chuyển sang SUBMITTED.
Giảng viên hướng dẫn xác nhận:
Đăng nhập tài khoản GVHD (huongnv@utc.edu.vn), vào xem đề cương, bấm "Phê duyệt đề cương" -> Trạng thái chuyển sang UNDER_REVIEW.
Khoa duyệt đề tài:
Đăng nhập admin, duyệt đề tài -> Chuyển sang APPROVED.
Hệ thống tự động tạo thực thể Đề tài chính thức (Thesis) trong CSDL với mã DT_DA_CNTT_K62_HK1_... và trạng thái IN_PROGRESS.
Xuất đề cương PDF:
Bấm nút "Xuất file Đề cương (PDF)" để in/tải file đề cương có chữ ký sinh viên và xác nhận của Khoa.
BƯỚC 4: Xét duyệt điều kiện làm đồ án (Giai đoạn 4)
Khoa nạp kết quả học vụ xét điều kiện:
Tại trang Đợt đồ án (/admin/project-rounds), tab "Kết quả học vụ xét điều kiện", nạp dữ liệu tín chỉ tích lũy, GPA, nợ học phí, môn tiên quyết.
Kiểm tra và xử lý đặc cách (Force Approve / Loại):
Vào menu "⚖️ Xét điều kiện & Bảo lưu" (/admin/eligibility).
Hệ thống liệt kê sinh viên đủ điều kiện (ELIGIBLE) và chưa đủ điều kiện (INELIGIBLE).
Đối với SV thiếu 1-2 tín chỉ: Khoa bấm "Force Approve", nhập lý do miễn giảm -> SV được chuyển sang ELIGIBLE.
Đối với SV không đạt: Bấm "Loại khỏi đợt" -> Chuyển sang DROPPED.
BƯỚC 5: Thực hiện đồ án & Quản lý tiến độ (Giai đoạn 5)
Giao Task và hạn nộp (Deadline):
Vào mục "📌 Bảng tiến độ & Task" (/progress/tasks).
GVHD tạo các Task: "Thiết kế Database", "Viết API Backend", "Xây dựng giao diện React".
Đặt mức độ ưu tiên, deadline và gán cho SV.
Sinh viên nộp bài (Submission):
SV đăng nhập, mở Task, kéo sang IN_PROGRESS, nhập nội dung kết quả và link Github/Báo cáo, bấm "Nộp kết quả" -> Task chuyển thành SUBMITTED.
Giảng viên Review và Đánh giá:
GV mở bài nộp, đánh giá:
Nếu chưa đạt: Chọn REVISE_REQUIRED, nhập nhận xét sửa chữa -> Task quay lại trạng thái REVISE để SV làm lại.
Nếu đạt: Chọn ACCEPTED -> Task chuyển sang COMPLETED, thanh tiến độ đề tài tăng lên.
Xác nhận đủ điều kiện bảo vệ:
Khi hoàn thành các mốc quan trọng, GVHD xác nhận đề tài đạt yêu cầu bảo vệ -> Cập nhật trạng thái DEFENSE_READY.
BƯỚC 6: Hội đồng, Lịch bảo vệ, Chấm điểm & Kết thúc (Giai đoạn 6)
Xét điều kiện bảo vệ cuối kỳ & Xử lý bảo lưu:
Vào trang "Xét điều kiện bảo vệ cuối" (/admin/eligibility): Hệ thống kiểm tra tiến độ đề tài và xác nhận của GVHD.
Thử nghiệm nhánh Bảo lưu:
SV có lý do cá nhân nộp đơn bảo lưu tại /student/reservation.
Khoa vào /admin/reservations, bấm "Phê duyệt đơn bảo lưu".
Hệ thống lưu hồ sơ bảo lưu, chuyển SV sang RESERVED và chuyển thẳng dữ liệu sang hồ sơ cuối kỳ.
Thành lập Hội đồng chấm bảo vệ:
Vào menu "🎓 Hội đồng & Lịch bảo vệ" (/admin/councils).
Bấm nút "⚡ Sinh Hội đồng tự động (Thuật toán CSP 1CT - 2TK - 2UV)".
Thuật toán CSP phân bổ chuẩn xác 5 thành viên cho mỗi hội đồng: 1 Chủ tịch, 2 Thư ký, 2 Ủy viên; đồng thời loại trừ GVHD của các sinh viên trong ca đó.
Phân công Giảng viên phản biện (GVPB):
Bấm sang tab Phản biện, hệ thống tự động gán GVPB đảm bảo ràng buộc: GVPB ≠ GVHD và cân bằng tải số lượng đề tài phản biện.
Xếp lịch bảo vệ:
Chuyển sang mục "Xếp lịch bảo vệ" (/admin/defense-schedules), Khoa chọn ngày bảo vệ, phòng học (VD: Phòng A2-301), ca sáng/chiều.
Bấm "Tự động sinh lịch" -> Hệ thống phân bổ danh sách SV vào từng khung giờ.
Nhập điểm và nhận xét:
Vào menu "📝 Chấm điểm & Kết quả" (/admin/defense-scoring).
Thành viên Hội đồng nhập điểm số (0 - 10) và nhận xét:
Điểm GVHD (trọng số 0.3)
Điểm GVPB (trọng số 0.2)
Điểm Hội đồng (trọng số 0.5)
Tổng hợp kết quả & Xuất biên bản:
Bấm "Tổng hợp kết quả cuối kỳ" -> Hệ thống tính điểm tổng kết, xếp loại (Xuất sắc, Giỏi, Khá, Trung bình, Không đạt).
Bấm "📄 Xuất Biên bản bảo vệ PDF" và "📊 Xuất Bảng điểm tổng hợp cuối kỳ".
Đóng đợt đồ án:
Khoa quay lại trang Quản lý Đợt đồ án, bấm "🔒 Đóng đợt (CLOSED)" để hoàn tất toàn bộ vòng đời đợt đồ án.