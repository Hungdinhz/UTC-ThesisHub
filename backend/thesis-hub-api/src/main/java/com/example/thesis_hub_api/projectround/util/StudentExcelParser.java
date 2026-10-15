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
            for (int r = 1; r <= lastRowNum; r++) { // Bắt đầu từ dòng 1 (bỏ qua header ở dòng 0)
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                StudentImportRowDTO rowDto = parseRow(row, r);
                rows.add(rowDto);
            }
        }

        return rows;
    }

    private StudentImportRowDTO parseRow(Row row, int rowIndex) {
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
        String studentCode = getCellValue(row.getCell(1));
        if (studentCode.isEmpty()) {
            errors.add("Mã sinh viên không được để trống");
        }

        // Cột C (2): Họ đệm *
        String lastName = getCellValue(row.getCell(2));
        if (lastName.isEmpty()) {
            errors.add("Họ đệm không được để trống");
        }

        // Cột D (3): Tên *
        String firstName = getCellValue(row.getCell(3));
        if (firstName.isEmpty()) {
            errors.add("Tên không được để trống");
        }

        String fullName = (lastName + " " + firstName).trim();

        // Cột E (4): Ngành (CNTT/KHMT) *
        String majorCode = getCellValue(row.getCell(4)).toUpperCase();
        if (majorCode.isEmpty()) {
            errors.add("Mã ngành không được để trống");
        }

        // Cột F (5): Lớp sinh hoạt *
        String className = getCellValue(row.getCell(5));
        if (className.isEmpty()) {
            errors.add("Lớp sinh hoạt không được để trống");
        }

        // Cột G (6): Số điện thoại
        String phone = getCellValue(row.getCell(6));
        if (!phone.isEmpty() && (phone.length() < 9 || phone.length() > 15 || !phone.matches("^[0-9+ ]+$"))) {
            errors.add("Số điện thoại không hợp lệ");
        }

        // Cột H (7): Email
        String email = getCellValue(row.getCell(7));
        if (email.isEmpty()) {
            if (!studentCode.isEmpty()) {
                email = studentCode.toLowerCase() + "@lms.utc.edu.vn";
            }
        } else if (!email.contains("@") || !email.contains(".")) {
            errors.add("Email không đúng định dạng: " + email);
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

            // Danh sách tiêu đề các cột đúng như ảnh mẫu của UTC
            String[] headers = {
                    "STT",
                    "Mã sinh viên (MSSV) *",
                    "Họ đệm *",
                    "Tên *",
                    "Ngành (CNTT/KHMT) *",
                    "Lớp sinh hoạt *",
                    "Số điện thoại",
                    "Email"
            };

            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(28);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Dữ liệu mẫu chuẩn từ ảnh UTC của người dùng
            Object[][] sampleData = {
                    {1, "201200101", "Nguyễn Văn", "An", "CNTT", "CNTT 1 - K62", "0912345671", "201200101@lms.utc.edu.vn"},
                    {2, "201200102", "Trần Thị", "Bình", "CNTT", "CNTT 2 - K62", "0912345672", "201200102@lms.utc.edu.vn"},
                    {3, "201200103", "Lê Hoàng", "Cường", "KHMT", "KHMT 1 - K62", "0912345673", "201200103@lms.utc.edu.vn"},
                    {4, "201200104", "Phạm Ngọc", "Dung", "CNTT", "CNTT Việt Anh - K62", "0912345674", "201200104@lms.utc.edu.vn"},
                    {5, "201200105", "Hoàng Minh", "Đức", "KHMT", "KHMT 2 - K62", "0912345675", "201200105@lms.utc.edu.vn"}
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

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
