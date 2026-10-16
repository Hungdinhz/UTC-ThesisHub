Mục Lục
1. Phùng Đình Hùng	1
2. Nguyễn Đình Công	6
3. Ngô Minh Quyết	11
4. Khuất Đăng Khoa	17
5. Các folder dùng chung	22
6. Frontend dùng chung	24
7. Folder Test	26
8. Database Migration	27
9. Tổng hợp phân chia 37 bảng	28
10. Nguyên tắc phối hợp và hạn chế xung đột mã nguồn	32
11. Cách 4 thành viên làm việc song song	35
12. Trách nhiệm chung của cả nhóm	36
13. Nguyên tắc kỹ thuật quan trọng	36

PHÂN CÔNG CÔNG VIỆC PHÁT TRIỂN HỆ THỐNG THESISHUB
Nhóm gồm 4 thành viên. Công việc được phân chia theo module nghiệp vụ (domain) thay vì chia đều theo số lượng bảng. Mỗi thành viên chịu trách nhiệm chính từ thiết kế cơ sở dữ liệu → Backend → API → Frontend → kiểm thử đối với module được giao. Nên đặt tên tiếng Anh trong code,
Mô hình này giúp các thành viên có thể phát triển song song, hạn chế xung đột mã nguồn và bảo đảm mỗi thành viên chịu trách nhiệm trọn vẹn một nhóm chức năng.
________________________________________
1. Phùng Đình Hùng
Vai trò
Nhóm trưởng – Technical Lead / Full-stack Developer
Module phụ trách
Identity + Organization + Project Round + Hạ tầng dùng chung
Backend
backend/thesis-hub-api/src/main/java/com/example/thesis_hub_api/

├── identity/
├── organization/
└── projectround/
Frontend
frontend/src/features/

├── auth/
└── project-round/
Folder dùng chung – phụ trách quản lý
Backend:
common/
config/
notification/
file/

Frontend:
components/
layouts/
routes/
services/
hooks/
stores/
types/
utils/
A. Authentication & Authorization
Phụ trách toàn bộ chức năng tài khoản và phân quyền:
•	Đăng nhập hệ thống.
•	Đăng xuất.
•	Đổi mật khẩu.
•	Xác thực người dùng.
•	JWT/session.
•	Quản lý vai trò.
•	Quản lý quyền.
•	Quản lý tài khoản người dùng.
•	Quản lý hồ sơ sinh viên.
•	Quản lý hồ sơ giảng viên.
•	Phân quyền API theo vai trò.
•	Bảo vệ route trên Frontend.
•	Kiểm soát quyền truy cập đối với các chức năng của Quản trị viên, Sinh viên, Giảng viên và Hội đồng chấm thi.
B. Quản lý dữ liệu nền và tổ chức
Phụ trách dữ liệu nền được sử dụng bởi toàn bộ hệ thống:
•	Quản lý Khoa.
•	Quản lý Bộ môn.
•	Quản lý Ngành.
•	Quản lý Chương trình đào tạo.
•	Quản lý sinh viên.
•	Quản lý giảng viên.
•	Quản lý học vị của giảng viên.
•	Quản lý hướng nghiên cứu của giảng viên.
•	Thiết lập quan hệ Khoa → Bộ môn → Giảng viên.
•	Thiết lập quan hệ Ngành → Sinh viên.
•	Quản lý chương trình Cử nhân/Kỹ sư.
C. Quản lý đợt đồ án
Phụ trách giai đoạn khởi tạo và thiết lập dữ liệu cho từng đợt đồ án:
•	Tạo đợt đồ án.
•	Chọn chương trình đào tạo áp dụng.
•	Mở/đóng đợt đồ án.
•	Quản lý các mốc thời gian.
•	Import danh sách sinh viên.
•	Phân loại sinh viên theo Ngành và Chương trình đào tạo.
•	Kiểm tra dữ liệu sinh viên khi import.
•	Quản lý trạng thái tham gia của sinh viên trong từng đợt.
•	Import dữ liệu học vụ phục vụ xét điều kiện.
•	Cung cấp dữ liệu nền cho các module phân công, đề tài và bảo vệ.
D. Các bảng dữ liệu sở hữu
Tài khoản, tổ chức và dữ liệu nền – 9 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
1	KHOA	Faculty	faculties
2	BOMON	Department	departments
3	NGANH	Major	majors
4	CHUONGTRINHDAOTAO	TrainingProgram	training_programs
5	VAITRO	Role	roles
6	NGUOIDUNG	User	users
7	SINHVIEN	Student	students
8	GIANGVIEN	Lecturer	lecturers
9	THONGBAO	Notification	notifications
Đợt đồ án và dữ liệu điều kiện – 4 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
10	DOTDOAN	ProjectRound	project_rounds
11	MOCTHOIGIAN	TimelineMilestone	timeline_milestones
12	SINHVIEN_DOTDOAN	StudentProjectRound	student_project_rounds
13	KETQUAHOCVU	AcademicRecord	academic_records

Tổng: 13 bảng.
E. Hạ tầng dùng chung
Phụ trách xây dựng và duy trì các thành phần kỹ thuật được sử dụng bởi cả nhóm:
•	Cấu trúc project Backend và Frontend.
•	Quy tắc đặt tên.
•	Coding convention.
•	Cấu trúc package/module.
•	JWT/security configuration.
•	Xử lý exception dùng chung.
•	Chuẩn hóa API response.
•	Validation dùng chung.
•	Pagination, filtering, sorting.
•	Swagger/OpenAPI.
•	File upload/storage dùng chung.
•	Email và notification dùng chung.
•	Audit log nếu nhóm triển khai.
•	Docker và cấu hình môi trường nếu nhóm triển khai.
•	Thiết lập Git workflow.
•	Quản lý nhánh main, develop, feature/*.
•	Review Pull Request.
•	Tích hợp các module.
•	Integration test toàn hệ thống cuối mỗi Sprint.
F. Trách nhiệm phối hợp
•	Không trực tiếp sửa code nghiệp vụ của các thành viên khác nếu không cần thiết.
•	Chịu trách nhiệm quản lý kiến trúc và tích hợp toàn hệ thống.
•	Cung cấp API và DTO chuẩn để các thành viên khác sử dụng.
•	Là người review chính đối với các Pull Request quan trọng.
•	Hỗ trợ xử lý các vấn đề liên module và các lỗi tích hợp.
G.
________________________________________
2. Nguyễn Đình Công
Vai trò
Full-stack Developer – Assignment / Supervisor Allocation
Module phụ trách
Đăng ký hướng đồ án và phân công giảng viên hướng dẫn
Module này xử lý toàn bộ quy trình từ lúc sinh viên đăng ký nguyện vọng đến khi Khoa chốt kết quả phân công.
Backend
backend/thesis-hub-api/src/main/java/com/example/thesis_hub_api/

└── assignment/
Cấu trúc:
assignment/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── mapper/
└── algorithm/
Trong đó:
assignment/algorithm/
chứa logic:
•	Tính capacity.
•	Hard constraints.
•	Soft constraints.
•	Chấm điểm nguyện vọng.
•	Tối ưu phân công.
•	Sinh đề xuất phân công.
•	Override.
•	Chốt kết quả.
•	…
Frontend
frontend/src/features/

└── assignment/
    ├── pages/
    ├── components/
    ├── services/
    └── types/

A. Đăng ký hướng đồ án
•	Sinh viên xem các hướng đồ án được phép đăng ký.
•	Chọn hướng đồ án.
•	Hệ thống lọc danh sách giảng viên phù hợp với hướng đã chọn.
•	Sinh viên chọn nguyện vọng NV1, NV2, NV3.
•	Khai báo các tiêu chí phụ/prioritization criteria.
•	Kiểm tra tính hợp lệ của nguyện vọng.
•	Kiểm tra giảng viên có thuộc hướng đồ án tương ứng hay không.
•	Kiểm tra chương trình đào tạo của sinh viên.
•	Đối với sinh viên chương trình Kỹ sư, kiểm tra điều kiện học vị tối thiểu của giảng viên.
B. Quản lý năng lực hướng dẫn
•	Quản lý chỉ tiêu của giảng viên theo từng đợt đồ án.
•	Tính capacity của từng giảng viên.
•	Áp dụng hệ số capacity.
•	Theo dõi số lượng sinh viên đã được phân công cho mỗi giảng viên.
•	Xác định giảng viên còn khả năng nhận sinh viên.
C. Thuật toán phân công
Phụ trách toàn bộ logic phân công bán tự động:
•	Kiểm tra các ràng buộc cứng (Hard Constraints).
•	Xử lý các ràng buộc mềm (Soft Constraints).
•	Xử lý thứ tự ưu tiên NV1 → NV3.
•	Ưu tiên giảng viên phù hợp với hướng đồ án.
•	Ưu tiên theo các tiêu chí đã khai báo.
•	Cân bằng tải hướng dẫn.
•	Tính toán kết quả phân công.
•	Sinh phương án phân công đề xuất.
•	Cho phép Khoa review kết quả.
•	Cho phép Khoa override kết quả hệ thống.
•	Lưu lịch sử điều chỉnh.
•	Chốt kết quả phân công cuối cùng.
D. Giao diện quản lý phân công
Phụ trách Frontend:
•	Danh sách sinh viên đăng ký.
•	Danh sách nguyện vọng.
•	Danh sách giảng viên.
•	Theo dõi capacity.
•	Màn hình xem kết quả hệ thống đề xuất.
•	Màn hình review.
•	Màn hình override thủ công.
•	Màn hình chốt phân công.
•	Lọc, tìm kiếm và sắp xếp dữ liệu phân công.
E. API chính
Ví dụ:
•	GET /assignments/preferences
•	POST /assignments/generate
•	GET /assignments/proposals
•	PUT /assignments/{id}/override
•	POST /assignments/finalize
Tên API có thể điều chỉnh trong quá trình thiết kế Backend nhưng phải được thống nhất trước khi Frontend tích hợp.
F. Các bảng dữ liệu sở hữu
Đăng ký hướng và phân công giảng viên – 6 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
14	CHITIEUGIANGVIEN	LecturerCapacity	lecturer_capacities
15	HUONGDOAN	ProjectDirection	project_directions
16	GIANGVIEN_HUONGDOAN	LecturerDirection	lecturer_directions
17	DANGKYHUONG	DirectionRegistration	direction_registrations
18	NGUYENVONG	Preference	preferences
19	PHANCONGHUONGDAN	SupervisorAssignment	supervisor_assignments
Tổng: 6 bảng.
G. Trách nhiệm phối hợp
•	Sử dụng dữ liệu SINHVIEN, GIANGVIEN, DOTDOAN do thành viên 1 cung cấp.
•	Không tự ý thay đổi cấu trúc các bảng thuộc module của thành viên 1.
•	Chỉ sử dụng API/DTO đã thống nhất để lấy dữ liệu dùng chung.
•	Cung cấp API kết quả phân công để thành viên 3 và 4 sử dụng.
•	Chịu trách nhiệm kiểm thử thuật toán phân công với các trường hợp hợp lệ và không hợp lệ.
________________________________________
3. Ngô Minh Quyết
Vai trò
Full-stack Developer – Thesis / Project Execution
Module phụ trách
Xét duyệt đề cương + Quản lý đề tài + Quản lý quá trình thực hiện đồ án
Module này xử lý toàn bộ quá trình từ sau khi phân công giảng viên hướng dẫn đến khi sinh viên hoàn thành việc thực hiện đề tài.
Backend
backend/thesis-hub-api/src/main/java/com/example/thesis_hub_api/

├── thesis/
└── progress/
thesis/
thesis/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
└── mapper/
progress/
progress/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
└── mapper/
Frontend
frontend/src/features/

├── thesis/
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── types/
│
└── progress/
    ├── pages/
    ├── components/
    ├── services/
    └── types/

A. Xét duyệt đề cương
•	Tạo nhóm xét duyệt.
•	Quản lý thành viên nhóm xét duyệt.
•	Phân công đề cương cho nhóm xét duyệt.
•	Theo dõi đề cương được giao.
•	Xử lý trạng thái xét duyệt.
•	Lưu kết quả xét duyệt.
•	Hỗ trợ yêu cầu chỉnh sửa đề cương.
•	Quản lý lịch sử thay đổi trạng thái.
B. Quản lý đề tài
•	GV và SV cùng xây dựng đề tài.
•	Tạo đề tài ở trạng thái Draft.
•	Chỉnh sửa đề tài.
•	GV xác nhận đề tài.
•	Trình Khoa/Ban duyệt.
•	Chuyển trạng thái Approved.
•	Chuyển trạng thái yêu cầu chỉnh sửa khi không được duyệt.
•	Lưu lịch sử thay đổi.
•	Liên kết đề tài với sinh viên, giảng viên và đợt đồ án.
C. Quản lý tài liệu
Phụ trách hệ thống tài liệu của đồ án:
•	Đề cương.
•	Báo cáo tiến độ.
•	Báo cáo nghiệm thu.
•	Toàn văn luận văn/đồ án.
•	Source code.
•	Slide thuyết trình.
•	Tài liệu khác.
•	Quản lý phiên bản tài liệu nếu cần.
•	Lưu trạng thái tài liệu.
•	Hỗ trợ upload/download file.
D. Quản lý quá trình thực hiện đồ án
Phụ trách các chức năng:
•	Tạo công việc (Task).
•	Thiết lập deadline.
•	Giao Task cho sinh viên.
•	Sinh viên nhận Task.
•	Sinh viên thực hiện Task.
•	Sinh viên submit kết quả.
•	Giảng viên review.
•	Thêm comment/trao đổi.
•	Đánh giá Đạt/Không đạt.
•	Yêu cầu sinh viên sửa lại Task.
•	Theo dõi trạng thái hoàn thành của Task.
•	Quản lý báo cáo tiến độ.
•	Giảng viên nhận xét báo cáo tiến độ.
E. Frontend
Phụ trách chuẩn hóa cấu trúc Frontend và giao diện nghiệp vụ của module:
src/
├── components/
├── layouts/
├── features/
│   ├── thesis/
│   ├── task/
│   ├── document/
│   └── defense/
├── services/
├── hooks/
├── types/
└── routes/
Phụ trách chuẩn UI/UX chung của dự án ở mức component và layout, nhưng không chịu trách nhiệm code toàn bộ Frontend của nhóm.
F. Các bảng dữ liệu sở hữu
Xét duyệt đề cương – 4 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
20	NHOMXETDUYET	ReviewGroup	review_groups
21	THANHVIENNHOMXETDUYET	ReviewGroupMember	review_group_members
22	PHANCONGXETDUYET	ProposalReviewAssignment	proposal_review_assignments
23	DECUONG	Proposal	Proposals
Đề tài và quá trình thực hiện – 7 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
24	DETAI	Thesis	theses
25	TAILIEU	Document	documents
26	CONGVIEC	Task	tasks
27	NOPBAI	Submission	submissions
28	BINHLUAN	Comment	comments
29	BAOCAOTIENDO	ProgressReport	progress_reports
30	NHANXETTIENDO	ProgressFeedback	progress_feedbacks

Tổng: 11 bảng.
G. Trách nhiệm phối hợp
•	Nhận thông tin phân công từ module của thành viên 2.
•	Sử dụng thông tin sinh viên, giảng viên và đợt đồ án từ thành viên 1.
•	Cung cấp dữ liệu đề tài và trạng thái hoàn thành cho module bảo vệ của thành viên 4.
•	Không tự ý sửa cấu trúc bảng thuộc module Assignment hoặc Defense.
________________________________________
4. Khuất Đăng Khoa
Vai trò
Full-stack Developer – Eligibility / Defense / Result
Module phụ trách
Xét điều kiện + Bảo lưu + Hội đồng + Xếp lịch + Bảo vệ + Kết quả
Đây là module xử lý giai đoạn cuối của vòng đời đồ án.
Backend
backend/thesis-hub-api/src/main/java/com/example/thesis_hub_api/

├── eligibility/
└── defense/
eligibility/
eligibility/
├── controller/
├── service/
├── repository/
├── entity/
└── dto/
Phụ trách:
•	Kiểm tra điều kiện.
•	Force approve.
•	Loại khỏi đợt.
•	Bảo lưu.
•	Điều kiện bảo vệ.
defense/
defense/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
└── mapper/
Phụ trách:
•	Hội đồng.
•	Thành viên hội đồng.
•	Phản biện.
•	Lịch bảo vệ.
•	Điểm.
•	Kết quả.
Frontend
frontend/src/features/

├── eligibility/
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── types/
│
└── defense/
    ├── pages/
    ├── components/
    ├── services/
    └── types/

A. Xét điều kiện làm đồ án và điều kiện bảo vệ
•	Kiểm tra điều kiện tham gia đợt đồ án.
•	Xử lý trạng thái đủ điều kiện.
•	Xử lý trường hợp không đủ điều kiện.
•	Force approve.
•	Loại sinh viên khỏi đợt.
•	Kiểm tra điều kiện học vụ cuối.
•	Kiểm tra điều kiện đủ khả năng bảo vệ.
•	Xác định sinh viên đủ điều kiện bảo vệ.
•	Lưu trạng thái xét điều kiện.
B. Quản lý bảo lưu
•	Sinh viên tạo đơn bảo lưu.
•	Theo dõi đơn bảo lưu.
•	Khoa duyệt hoặc từ chối.
•	Lưu lý do và trạng thái xử lý.
•	Lưu hồ sơ bảo lưu.
•	Cập nhật trạng thái tham gia đợt.
•	Chuyển dữ liệu bảo lưu sang hồ sơ cuối kỳ.
C. Thành lập hội đồng
•	Tạo hội đồng.
•	Quản lý thông tin hội đồng.
•	Gán Chủ tịch.
•	Gán 2 Thư ký.
•	Gán 2 Ủy viên.
•	Quản lý danh sách thành viên.
•	Kiểm tra điều kiện thành viên hội đồng.
•	Kiểm tra trùng và xung đột phân công.
D. Phân công phản biện
•	Gán giảng viên phản biện cho đề tài.
•	Kiểm tra giảng viên có phù hợp hay không.
•	Hạn chế xung đột giữa giảng viên hướng dẫn và giảng viên phản biện.
•	Cân bằng số lượng đề tài phản biện.
E. Xếp lịch bảo vệ
•	Khoa nhập tham số lịch.
•	Quản lý ngày bảo vệ.
•	Quản lý khung giờ.
•	Quản lý phòng.
•	Quản lý số lượng sinh viên trong từng phiên.
•	Xử lý ràng buộc giảng viên.
•	Xử lý ràng buộc hội đồng.
•	Sinh lịch bảo vệ.
•	Cho phép xem và điều chỉnh lịch nếu cần.
F. Bảo vệ và chấm điểm
•	Hiển thị danh sách sinh viên trong buổi bảo vệ.
•	Thành viên hội đồng nhập điểm.
•	Thành viên hội đồng nhập nhận xét.
•	Tổng hợp điểm.
•	Kiểm tra dữ liệu điểm.
•	Hội đồng xác nhận kết quả.
•	Xuất biên bản PDF.
•	Lưu hồ sơ bảo vệ.
•	Hỗ trợ dữ liệu ký/lưu theo quy trình.
G. Kết thúc đợt đồ án
•	Tổng hợp dữ liệu cuối kỳ.
•	Xuất dữ liệu kết quả.
•	Xuất hồ sơ cuối kỳ.
•	Đóng đợt đồ án.
•	Lưu trạng thái hoàn tất.
•	Lưu lịch sử kết thúc đợt.
H. Các bảng dữ liệu sở hữu
Bảo lưu – 1 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
31	DONBAOLUU	ReservationRequest	reservation_requests

Phản biện, hội đồng, bảo vệ và kết quả – 6 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
32	PHANCONGPHANBIEN	ReviewerAssignment	reviewer_assignments
33	HOIDONG	DefenseCouncil	defense_councils
34	THANHVIENHOIDONG	CouncilMember	council_members
35	LICHBAOVE	DefenseSchedule	defense_schedules
36	DIEMSO	Score	scores
37	KETQUATOTNGHIEP	GraduationResult	graduation_results
Tổng: 7 bảng.
I. Trách nhiệm phối hợp
•	Sử dụng dữ liệu sinh viên và đợt đồ án từ thành viên 1.
•	Sử dụng kết quả phân công từ thành viên 2.
•	Sử dụng đề tài và trạng thái hoàn thành từ thành viên 3.
•	Xác định điều kiện bảo vệ dựa trên dữ liệu từ các module trước.
•	Chịu trách nhiệm kiểm thử toàn bộ quy trình từ xét điều kiện đến kết thúc đợt.
________________________________________
5. Các folder dùng chung
Các folder sau không thuộc riêng một module nghiệp vụ mà được sử dụng bởi toàn bộ hệ thống.
Backend
common/
config/
notification/
file/
common/
common/
├── exception/
├── response/
├── validation/
├── pagination/
├── mapper/
└── util/
Dùng cho:
•	Global exception.
•	API response chuẩn.
•	Validation dùng chung.
•	Pagination/filter/sort.
•	Utility.
•	Mapper dùng chung.
config/
config/
├── SecurityConfig.java
├── OpenApiConfig.java
└── ...
notification/
Dùng cho:
•	Email.
•	Thông báo hệ thống.
•	Notification service.
file/
Dùng cho:
•	Upload.
•	Download.
•	Quản lý file.
•	Storage.
Hùng quản lý kiến trúc và quy chuẩn của các folder này; các thành viên khác chỉ bổ sung khi chức năng của họ thực sự cần.
________________________________________
6. Frontend dùng chung
frontend/src/

├── components/
├── layouts/
├── routes/
├── services/
├── hooks/
├── stores/
├── types/
└── utils/
components/
Chứa các component dùng chung:
components/
├── ui/
├── table/
├── form/
├── modal/
└── feedback/
Ví dụ:
Button
Input
Modal
Table
Pagination
StatusBadge
Loading
ErrorMessage
layouts/
AuthLayout
MainLayout
DashboardLayout
routes/
AppRoutes
ProtectedRoute
RoleRoute
services/
Chứa cấu hình API client và các service dùng chung.
hooks/
Custom hooks dùng chung.
stores/
State management dùng chung.
types/
Các type dùng chung.
utils/
Các hàm tiện ích dùng chung.
Hùng chịu trách nhiệm định nghĩa cấu trúc và quy chuẩn. Các thành viên khác không tự tạo các phiên bản component dùng chung trùng nhau.
________________________________________
7. Folder Test
Mỗi thành viên viết test cho module mình phụ trách.
backend/thesis-hub-api/src/test/java/com/example/thesis_hub_api/

├── identity/          ← Hùng
├── organization/      ← Hùng
├── projectround/      ← Hùng
├── assignment/        ← Công
├── thesis/            ← Quyết
├── progress/          ← Quyết
├── eligibility/       ← Khoa
└── defense/           ← Khoa
Ví dụ module Assignment:
assignment/
├── AssignmentServiceTest.java
├── AssignmentControllerTest.java
├── CapacityCalculatorTest.java
└── AssignmentAlgorithmTest.java
Đặc biệt phần thuật toán phân công của Công cần có test riêng cho các trường hợp:
•	NV1 được đáp ứng.
•	NV1 không được đáp ứng nhưng NV2 được đáp ứng.
•	Không đủ capacity.
•	Không đạt ràng buộc học vị.
•	Nhiều sinh viên cùng chọn một giảng viên.
•	Override thủ công.
•	Chốt kết quả.
________________________________________
8. Database Migration
Các thành viên chỉ tạo migration cho module mình phụ trách.
backend/thesis-hub-api/src/main/resources/db/migration/
Quy ước:
V1xx__...     → Hùng
V2xx__...     → Công
V3xx__...     → Quyết
V4xx__...     → Khoa
Ví dụ:
V101__create_khoa.sql
V102__create_bomon.sql
V103__create_sinhvien.sql

V201__create_huongdoan.sql
V202__create_dangkyhuong.sql
V203__create_nguyenvong.sql

V301__create_detai.sql
V302__create_decung.sql
V303__create_congviec.sql

V401__create_hoidong.sql
V402__create_thanhvienhoidong.sql
V403__create_lichbaove.sql
Không tự ý sửa migration của thành viên khác sau khi migration đã được merge.
________________________________________
9. Tổng hợp phân chia 37 bảng
Thành viên	Vai trò chính	Module phụ trách	Số bảng	Backend – Folder chính	Frontend – Folder chính
Phùng Đình Hùng	Nhóm trưởng / Technical Lead	Identity + Organization + Project Round	13	identity/, organization/, projectround/	features/auth/, features/project-round/
Nguyễn Đình Công	Full-stack Developer	Assignment	6	assignment/	features/assignment/
Ngô Minh Quyết	Full-stack Developer	Thesis + Review + Project Execution	11	thesis/, progress/	features/thesis/, features/progress/
Khuất Đăng Khoa	Full-stack Developer	Eligibility + Defense + Result	7	eligibility/, defense/	features/eligibility/, features/defense/
Tổng cộng			37		
________________________________________

Danh sách sở hữu
Phùng Đình Hùng
Tài khoản, tổ chức và dữ liệu nền – 9 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
1	KHOA	Faculty	faculties
2	BOMON	Department	departments
3	NGANH	Major	majors
4	CHUONGTRINHDAOTAO	TrainingProgram	training_programs
5	VAITRO	Role	roles
6	NGUOIDUNG	User	users
7	SINHVIEN	Student	students
8	GIANGVIEN	Lecturer	lecturers
9	THONGBAO	Notification	notifications
Đợt đồ án và dữ liệu điều kiện – 4 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
10	DOTDOAN	ProjectRound	project_rounds
11	MOCTHOIGIAN	TimelineMilestone	timeline_milestones
12	SINHVIEN_DOTDOAN	StudentProjectRound	student_project_rounds
13	KETQUAHOCVU	AcademicRecord	academic_records

Nguyễn Đình Công
Đăng ký hướng và phân công giảng viên – 6 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
14	CHITIEUGIANGVIEN	LecturerCapacity	lecturer_capacities
15	HUONGDOAN	ProjectDirection	project_directions
16	GIANGVIEN_HUONGDOAN	LecturerDirection	lecturer_directions
17	DANGKYHUONG	DirectionRegistration	direction_registrations
18	NGUYENVONG	Preference	preferences
19	PHANCONGHUONGDAN	SupervisorAssignment	supervisor_assignments
Ngô Minh Quyết
Xét duyệt đề cương – 4 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
20	NHOMXETDUYET	ReviewGroup	review_groups
21	THANHVIENNHOMXETDUYET	ReviewGroupMember	review_group_members
22	PHANCONGXETDUYET	ProposalReviewAssignment	proposal_review_assignments
23	DECUONG	Proposal	Proposals
Đề tài và quá trình thực hiện – 7 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
24	DETAI	Thesis	theses
25	TAILIEU	Document	documents
26	CONGVIEC	Task	tasks
27	NOPBAI	Submission	submissions
28	BINHLUAN	Comment	comments
29	BAOCAOTIENDO	ProgressReport	progress_reports
30	NHANXETTIENDO	ProgressFeedback	progress_feedbacks

Khuất Đăng Khoa
Bảo lưu – 1 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
31	DONBAOLUU	ReservationRequest	reservation_requests

Phản biện, hội đồng, bảo vệ và kết quả – 6 bảng
STT	Trong báo cáo/ERD	Entity Java	Tên bảng Database
32	PHANCONGPHANBIEN	ReviewerAssignment	reviewer_assignments
33	HOIDONG	DefenseCouncil	defense_councils
34	THANHVIENHOIDONG	CouncilMember	council_members
35	LICHBAOVE	DefenseSchedule	defense_schedules
36	DIEMSO	Score	scores
37	KETQUATOTNGHIEP	GraduationResult	graduation_results

9 bảng được bổ sung so với ERD 28 bảng ban đầu
So với ERD cũ, 9 bảng quan trọng được bổ sung là:
STT	Bảng mới	Lý do
1	KHOA	Biểu diễn quan hệ Khoa → Bộ môn → Giảng viên
2	CHUONGTRINHDAOTAO	Phân biệt Cử nhân/Kỹ sư
3	SINHVIEN_DOTDOAN	Lưu trạng thái SV trong từng đợt
4	KETQUAHOCVU	Lưu dữ liệu học vụ để xét điều kiện
5	NGUYENVONG	Lưu riêng NV1, NV2, NV3
6	TAILIEU	Quản lý các loại file/tài liệu
7	CONGVIEC	Quản lý Task và deadline
8	NOPBAI	Quản lý kết quả sinh viên submit
9	BINHLUAN	Quản lý trao đổi/comment trong quá trình thực hiện

________________________________________
10. Nguyên tắc phối hợp và hạn chế xung đột mã nguồn
Để 4 thành viên có thể phát triển song song, nhóm thống nhất các nguyên tắc sau:
Một bảng có một Owner
Mỗi bảng dữ liệu chỉ có một thành viên chịu trách nhiệm chính về cấu trúc và nghiệp vụ.
Các thành viên khác có thể sử dụng dữ liệu nhưng không tự ý thay đổi cấu trúc bảng thuộc module khác.
Ví dụ:
•	SINHVIEN → Hùng sở hữu.
•	PHANCONGHUONGDAN → Công sở hữu.
•	DETAI → Quyết sở hữu.
•	HOIDONG → Khoa sở hữu.
Giao tiếp giữa các module thông qua API/DTO
Không phụ thuộc trực tiếp vào code nội bộ của module khác.
Ví dụ module Assignment cần sinh viên thì sử dụng dữ liệu do module Identity/Student cung cấp thông qua API hoặc service contract đã thống nhất.
Sử dụng Database Migration
Không để cả nhóm cùng sửa một file schema.sql.
Các migration được phân vùng theo module, ví dụ:
V100__...
V101__...
cho module của thành viên 1;
V200__...
V201__...
cho module Assignment;
V300__...
cho module Thesis;
V400__...
cho module Defense.
Mỗi thành viên làm một Vertical Slice
Mỗi chức năng hoàn chỉnh bao gồm:
Database
    ↓
Entity
    ↓
Repository
    ↓
Service
    ↓
DTO
    ↓
Controller / API
    ↓
Frontend
    ↓
Test
Không chia kiểu:
Người 1 = toàn bộ Backend
Người 2 = toàn bộ Frontend
Người 3 = Database
Người 4 = Testing
Quy trình Git
Nhóm sử dụng:
main
   ↑
develop
   ↑
feature/*
Ví dụ:
feature/auth
feature/project-round
feature/assignment
feature/thesis
feature/task
feature/defense
Quy trình:
Code
 ↓
Commit
 ↓
Push feature branch
 ↓
Pull Request
 ↓
Code Review
 ↓
Merge vào develop
Không thành viên nào tự ý push trực tiếp vào main.
Không tự merge Pull Request của chính mình.
________________________________________
11. Cách 4 thành viên làm việc song song
Trong giai đoạn đầu, các thành viên có thể phát triển song song bằng cách sử dụng API contract và dữ liệu mẫu (mock data).
Ví dụ:
•	Thành viên 1 xây dựng Authentication, Student, Lecturer và Project Round.
•	Thành viên 2 xây dựng Assignment và thuật toán phân công.
•	Thành viên 3 xây dựng Thesis, Task và Document.
•	Thành viên 4 xây dựng Defense, Council và Eligibility.
Khi API của thành viên 1 hoàn thành, các module còn lại chuyển từ mock data sang API thật.
Như vậy các thành viên không phải chờ toàn bộ Backend hoàn thành mới bắt đầu Frontend.
________________________________________
12. Trách nhiệm chung của cả nhóm
Mặc dù mỗi thành viên có module riêng, cả nhóm cùng chịu trách nhiệm đối với:
•	Tuân thủ Git workflow.
•	Tuân thủ coding convention.
•	Viết test cho chức năng của mình.
•	Review Pull Request của thành viên khác.
•	Cập nhật tài liệu API.
•	Đồng bộ với ERD đã thống nhất.
•	Không tự ý thay đổi nghiệp vụ đã chốt.
•	Kiểm thử tích hợp giữa các module.
•	Kiểm thử theo toàn bộ quy trình nghiệp vụ của ThesisHub.
•	Chuẩn bị dữ liệu demo.
•	Chuẩn bị tài liệu báo cáo và tài liệu triển khai.
________________________________________
13. Nguyên tắc kỹ thuật quan trọng
Nhóm thống nhất:
Chia theo nghiệp vụ/domain, không chia theo số lượng bảng.
Mỗi domain có một Owner chịu trách nhiệm chính.
Một thành viên phụ trách trọn vẹn DB + Backend + Frontend + Test của module mình.
Các module giao tiếp với nhau thông qua API/DTO và các contract đã thống nhất.
Không tự ý sửa bảng hoặc code nội bộ thuộc module của thành viên khác.
ERD phải được chốt trước khi triển khai chính thức.
Mô hình phân chia này giúp nhóm 4 thành viên phát triển song song, giảm xung đột Git và đồng thời bảo đảm các chức năng được triển khai đúng theo quy trình nghiệp vụ của hệ thống ThesisHub.

