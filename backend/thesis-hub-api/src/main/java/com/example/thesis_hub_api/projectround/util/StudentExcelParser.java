package com.example.thesis_hub_api.projectround.util;

import com.example.thesis_hub_api.projectround.dto.response.StudentImportRowDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Component
public class StudentExcelParser {

    private final DataFormatter dataFormatter = new DataFormatter();

    /**
     * Phân tích file Excel tải lên thành danh sách StudentImportRowDTO
     */
    public List<StudentImportRowDTO> parseExcel(MultipartFile file) throws IOException {
        List<StudentImportRowDTO> rows = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                return rows;
            }

            int lastRowNum = sheet.getLastRowNum();
            int headerRowIdx = detectHeaderRowIndex(sheet, Math.min(lastRowNum, 6));
            boolean combinedFullNameMode = isCombinedFullNameHeader(sheet.getRow(headerRowIdx));

            for (int r = headerRowIdx + 1; r <= lastRowNum; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                StudentImportRowDTO rowDto = parseRow(row, r, combinedFullNameMode);
                rows.add(rowDto);
            }
        }

        return rows;
    }

    private int detectHeaderRowIndex(Sheet sheet, int maxScanRow) {
        for (int r = 0; r <= maxScanRow; r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            for (int c = 0; c < row.getLastCellNum(); c++) {
                String val = getCellValue(row.getCell(c)).toLowerCase();
                if (val.contains("mssv") || val.contains("mã sinh viên") || val.contains("ma sinh vien") || val.contains("mã sv") || val.contains("student code")) {
                    return r;
                }
            }
        }
        return 0;
    }

    private boolean isCombinedFullNameHeader(Row headerRow) {
        if (headerRow == null) return false;
        String col2 = getCellValue(headerRow.getCell(2)).toLowerCase();
        String col3 = getCellValue(headerRow.getCell(3)).toLowerCase();
        // If column C is "Họ và tên" / "Họ tên" and column D is "Ngành" / "Lớp" (not "Tên")
        return (col2.contains("họ và tên") || col2.contains("họ tên") || col2.contains("full name"))
                && !col3.equals("tên") && !col3.equals("tên *");
    }

    public String normalizeMajorCode(String rawMajor) {
        if (rawMajor == null) return "";
        String upper = rawMajor.trim().toUpperCase();
        if (upper.isEmpty()) return "";
        if (upper.equals("CNTT") || upper.contains("CÔNG NGHỆ THÔNG TIN") || upper.contains("CONG NGHE THONG TIN") || upper.equals("IT") || upper.equals("FIT")) {
            return "CNTT";
        }
        if (upper.equals("KTPM") || upper.contains("KỸ THUẬT PHẦN MỀM") || upper.contains("KY THUAT PHAN MEM") || upper.contains("CÔNG NGHỆ PHẦN MỀM") || upper.equals("CNPM") || upper.equals("SE")) {
            return "KTPM";
        }
        if (upper.equals("KHMT") || upper.contains("KHOA HỌC MÁY TÍNH") || upper.contains("KHOA HOC MAY TINH") || upper.equals("CS")) {
            return "KHMT";
        }
        if (upper.equals("HTTT") || upper.contains("HỆ THỐNG THÔNG TIN") || upper.contains("HE THONG THONG TIN") || upper.equals("IS")) {
            return "CNTT";
        }
        if (upper.equals("MMT") || upper.contains("MẠNG MÁY TÍNH") || upper.contains("AN TOÀN THÔNG TIN") || upper.equals("ATTT")) {
            return "CNTT";
        }
        return upper;
    }

    private StudentImportRowDTO parseRow(Row row, int rowIndex, boolean combinedFullNameMode) {
        List<String> errors = new ArrayList<>();

        // Cột A (0): STT
        String sttStr = getCellValue(row.getCell(0));
        Integer stt = null;
        if (!sttStr.isEmpty()) {
            try {
                stt = (int) Double.parseDouble(sttStr);
            } catch (NumberFormatException ignored) {
            }
        }

        // Cột B (1): Mã sinh viên (MSSV) *
        String studentCode = getCellValue(row.getCell(1)).trim();
        if (studentCode.isEmpty()) {
            errors.add("Mã sinh viên không được để trống");
        } else if (!studentCode.matches("^\\d{9}$")) {
            errors.add("MSSV không hợp lệ (phải đúng 9 chữ số: " + studentCode + ")");
        }

        String lastName;
        String firstName;
        String fullName;
        String rawMajor;
        String className;
        String phone;
        String email;

        if (combinedFullNameMode) {
            fullName = getCellValue(row.getCell(2));
            if (fullName.isEmpty()) {
                errors.add("Họ và tên không được để trống");
                lastName = "";
                firstName = "";
            } else {
                int lastSpace = fullName.lastIndexOf(' ');
                if (lastSpace > 0) {
                    lastName = fullName.substring(0, lastSpace).trim();
                    firstName = fullName.substring(lastSpace + 1).trim();
                } else {
                    lastName = fullName;
                    firstName = fullName;
                }
            }
            rawMajor = getCellValue(row.getCell(3));
            className = getCellValue(row.getCell(4));
            phone = getCellValue(row.getCell(5));
            email = getCellValue(row.getCell(6));
        } else {
            // Cột C (2): Họ đệm *
            lastName = getCellValue(row.getCell(2));
            // Cột D (3): Tên *
            firstName = getCellValue(row.getCell(3));

            if (lastName.isEmpty() && firstName.isEmpty()) {
                errors.add("Họ và tên sinh viên không được để trống");
            } else if (firstName.isEmpty() && lastName.contains(" ")) {
                // Trường hợp người dùng nhập cả họ và tên vào cột Họ đệm
                int lastSpace = lastName.lastIndexOf(' ');
                firstName = lastName.substring(lastSpace + 1).trim();
                lastName = lastName.substring(0, lastSpace).trim();
            }

            fullName = (lastName + " " + firstName).trim();
            rawMajor = getCellValue(row.getCell(4));
            className = getCellValue(row.getCell(5));
            phone = getCellValue(row.getCell(6));
            email = getCellValue(row.getCell(7));
        }

        String majorCode = normalizeMajorCode(rawMajor);
        if (majorCode.isEmpty()) {
            majorCode = "CNTT"; // Mặc định ngành CNTT nếu để trống
        }

        if (className.isEmpty()) {
            className = majorCode + " - K62";
        }

        if (!phone.isEmpty()) {
            String cleanedPhone = phone.replaceAll("[\\s.-]", "");
            if (!cleanedPhone.matches("^0\\d{9}$") && (cleanedPhone.length() < 9 || cleanedPhone.length() > 11)) {
                errors.add("Số điện thoại không hợp lệ (phải là 10 chữ số bắt đầu bằng 0)");
            } else {
                phone = cleanedPhone;
            }
        }

        if (email.isEmpty()) {
            if (!studentCode.isEmpty() && studentCode.matches("^\\d{9}$")) {
                email = studentCode.toLowerCase() + "@lms.utc.edu.vn";
            }
        } else if (!email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
            errors.add("Email không đúng định dạng chuẩn: " + email);
        }

        // Đọc điểm GPA tích lũy (Hệ 4.0)
        String gpaStr = "";
        int gpaColIdx = combinedFullNameMode ? 7 : 8;
        if (row.getCell(gpaColIdx) != null) {
            gpaStr = getCellValue(row.getCell(gpaColIdx)).trim();
        }
        Double gpa = 3.20;
        if (!gpaStr.isEmpty()) {
            try {
                double parsedGpa = Double.parseDouble(gpaStr.replace(',', '.'));
                if (parsedGpa >= 0.0 && parsedGpa <= 4.0) {
                    gpa = Math.round(parsedGpa * 100.0) / 100.0;
                } else {
                    errors.add("Điểm GPA phải nằm trong khoảng từ 0.0 đến 4.0 (nhập: " + gpaStr + ")");
                }
            } catch (NumberFormatException e) {
                errors.add("Điểm GPA không đúng định dạng số: " + gpaStr);
            }
        }

        boolean isValid = errors.isEmpty();

        return StudentImportRowDTO.builder()
                .rowIndex(rowIndex + 1) // 1-based index hiển thị cho user
                .stt(stt != null ? stt : rowIndex)
                .studentCode(studentCode)
                .lastName(lastName)
                .firstName(firstName)
                .fullName(fullName)
                .majorCode(majorCode)
                .className(className)
                .phone(phone)
                .email(email)
                .gpa(gpa)
                .isValid(isValid)
                .errors(errors)
                .build();
    }

    private String getCellValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        return dataFormatter.formatCellValue(cell).trim();
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && !getCellValue(cell).isEmpty()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Tạo file Excel mẫu chuẩn 8 cột theo yêu cầu thực tế của UTC
     */
    public byte[] generateTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Danh sách sinh viên");

            // Style Header
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);
            headerCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerCellStyle.setBorderTop(BorderStyle.THIN);
            headerCellStyle.setBorderBottom(BorderStyle.THIN);
            headerCellStyle.setBorderLeft(BorderStyle.THIN);
            headerCellStyle.setBorderRight(BorderStyle.THIN);

            // Style Data
            CellStyle dataCellStyle = workbook.createCellStyle();
            dataCellStyle.setBorderTop(BorderStyle.THIN);
            dataCellStyle.setBorderBottom(BorderStyle.THIN);
            dataCellStyle.setBorderLeft(BorderStyle.THIN);
            dataCellStyle.setBorderRight(BorderStyle.THIN);

            CellStyle centerCellStyle = workbook.createCellStyle();
            centerCellStyle.cloneStyleFrom(dataCellStyle);
            centerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Danh sách tiêu đề các cột chuẩn UTC gồm cột Điểm GPA
            String[] headers = {
                    "STT",
                    "Mã sinh viên (MSSV) *",
                    "Họ đệm *",
                    "Tên *",
                    "Ngành (CNTT/KHMT) *",
                    "Lớp sinh hoạt *",
                    "Số điện thoại",
                    "Email",
                    "Điểm GPA (Hệ 4.0) *"
            };

            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(28);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Dữ liệu mẫu chuẩn từ ảnh UTC của người dùng kèm điểm GPA
            Object[][] sampleData = {
                    {1, "201200101", "Nguyễn Văn", "An", "CNTT", "CNTT 1 - K62", "0912345671", "201200101@lms.utc.edu.vn", 3.45},
                    {2, "201200102", "Trần Thị", "Bình", "CNTT", "CNTT 2 - K62", "0912345672", "201200102@lms.utc.edu.vn", 3.20},
                    {3, "201200103", "Lê Hoàng", "Cường", "KHMT", "KHMT 1 - K62", "0912345673", "201200103@lms.utc.edu.vn", 3.65},
                    {4, "201200104", "Phạm Ngọc", "Dung", "CNTT", "CNTT Việt Anh - K62", "0912345674", "201200104@lms.utc.edu.vn", 3.10},
                    {5, "201200105", "Hoàng Minh", "Đức", "KHMT", "KHMT 2 - K62", "0912345675", "201200105@lms.utc.edu.vn", 3.50}
            };

            int rowIdx = 1;
            for (Object[] student : sampleData) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(20);

                for (int col = 0; col < student.length; col++) {
                    Cell cell = row.createCell(col);
                    if (student[col] instanceof Integer) {
                        cell.setCellValue((Integer) student[col]);
                        cell.setCellStyle(centerCellStyle);
                    } else if (student[col] instanceof Double) {
                        cell.setCellValue((Double) student[col]);
                        cell.setCellStyle(centerCellStyle);
                    } else {
                        cell.setCellValue(String.valueOf(student[col]));
                        if (col == 1 || col == 4) {
                            cell.setCellStyle(centerCellStyle);
                        } else {
                            cell.setCellStyle(dataCellStyle);
                        }
                    }
                }
            }

            // Set độ rộng cột hợp lý
            sheet.setColumnWidth(0, 8 * 256);   // STT
            sheet.setColumnWidth(1, 24 * 256);  // MSSV
            sheet.setColumnWidth(2, 20 * 256);  // Họ đệm
            sheet.setColumnWidth(3, 14 * 256);  // Tên
            sheet.setColumnWidth(4, 22 * 256);  // Ngành
            sheet.setColumnWidth(5, 24 * 256);  // Lớp
            sheet.setColumnWidth(6, 18 * 256);  // SĐT
            sheet.setColumnWidth(7, 30 * 256);  // Email
            sheet.setColumnWidth(8, 22 * 256);  // Điểm GPA

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
