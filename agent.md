1. Nguyên Tắc Cốt Lõi (Core Principles)
DRY (Don't Repeat Yourself) là ưu tiên số 1: Không bao giờ viết mới những gì đã tồn tại. Luôn tìm kiếm và tái sử dụng triệt để logic/hàm có sẵn trong codebase.

Tối giản & Hiệu năng cao: Ưu tiên code ngắn gọn, rõ nghĩa, hạn chế boilerplate code không cần thiết, tối ưu độ phức tạp thuật toán và tài nguyên hệ thống.

Tôn trọng cấu trúc hiện tại: Tuân thủ conventions, design patterns và kiến trúc thư mục vốn có của dự án.
2. Quy Tắc Cơ Sở Dữ Liệu (Database Restrictions)
Tuyệt đối không tự ý tạo bảng mới: Không được tự thêm table, migration tạo table mới hoặc thay đổi cấu trúc schema khi chưa có yêu cầu tường minh từ lập trình viên.

Tận dụng Schema sẵn có: Mọi logic truy vấn, lưu trữ dữ liệu phải dựa hoàn toàn trên các bảng và trường (fields) hiện tại.

Nếu bắt buộc phải đổi Schema: Cần dừng lại, giải thích rõ lý do kỹ thuật và xin xác nhận từ người dùng trước khi viết migration hay code schema.

3. Tái Sử Dụng & Tối Ưu Code (Reuse & Optimization)
Kiểm tra trước khi viết mới (Code Reuse First)

Trước khi triển khai bất kỳ hàm hoặc logic nghiệp vụ nào, bắt buộc phải quét/tìm kiếm trong dự án xem:

Đã có helper/utility function nào xử lý logic tương tự chưa (ví dụ: format ngày tháng, parse JSON, xử lý chuỗi, validate input, handle response/error...)?

Đã có custom hook, service, repository, hoặc query tương tự chưa?

Nếu có sẵn nhưng thiếu một nhánh logic nhỏ: Mở rộng (extend) hàm hiện có một cách an toàn thay vì viết một hàm mới trùng lặp.

Tiêu chuẩn viết code ngắn gọn & tối ưu (Clean & Concise Code)

Tránh viết code dài dòng: Loại bỏ các đoạn code lồng nhau phức tạp (nested blocks), áp dụng kỹ thuật Early Return / Guard Clauses.

Tận dụng tính năng hiện đại của ngôn ngữ: Sử dụng cú pháp ngắn gọn, an toàn (Optional Chaining, Nullish Coalescing, Destructuring, Pattern Matching, Stream API... tùy theo ngôn ngữ dự án).

Tối ưu truy vấn dữ liệu:

Chỉ SELECT các trường cần dùng, tuyệt đối tránh SELECT * bừa bãi.

Hạn chế tối đa lỗi $N+1$ query; sử dụng bulk insert/update và eager loading hợp lý.

Không chèn code thừa: Không sinh comment thừa thãi mô tả những điều hiển nhiên; không để lại dead code hoặc biến không sử dụng.
4. Quy Trình Thực Thi Của AI (Step-by-Step Workflow)
Khi nhận một task, AI phải tuân thủ nghiêm ngặt 3 bước sau:

Bước 1 - Khảo sát Codebase:

Tìm kiếm các hàm, file utils, component liên quan đã có trong dự án.

Xác định xem tính năng mới có thể lắp ghép từ các khối code sẵn có hay không.

Bước 2 - Lên giải pháp tối giản:

Chọn cách tiếp cận tốn ít dòng code nhất nhưng đảm bảo performance và tính dễ bảo trì.

Đảm bảo không đụng chạm đến việc tạo bảng database mới.

Bước 3 - Triển khai & Tinh gọn:

Viết code súc tích, tái sử dụng các module đã khảo sát ở Bước 1.