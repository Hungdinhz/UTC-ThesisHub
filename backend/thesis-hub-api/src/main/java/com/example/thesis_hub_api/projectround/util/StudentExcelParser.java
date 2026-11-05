package com.example.thesis_hub_api.projectround.util;

import com.example.thesis_hub_api.projectround.dto.response.StudentImportRowDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class StudentExcelParser {

    private final DataFormatter dataFormatter = new DataFormatter();

    public static class ColumnMapping {
        public int colStt = 0;
        public int colStudentCode = 1;
        public int colLastName = 2;
        public int colFirstName = 3;
        public int colFullName = -1;
        public int colMajor = 4;
        public int colClass = 5;
        public int colGpa = 6;
        public int colPhone = 7;
        public int colEmail = 8;
        public int colCompletedCredits = -1;
        public int colDebtCredits = -1;
        public int colTuitionDebt = -1;
        public int colDiscipline = -1;
        public int colPrereq = -1;
        public boolean combinedFullNameMode = false;
    }

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
            int headerRowIdx = detectHeaderRowIndex(sheet, Math.min(lastRowNum, 25));
            Row headerRow = sheet.getRow(headerRowIdx);
            ColumnMapping mapping = detectColumnMapping(headerRow);

            for (int r = headerRowIdx + 1; r <= lastRowNum; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                try {
                    StudentImportRowDTO rowDto = parseRowWithMapping(row, r, mapping);
                    rows.add(rowDto);
                } catch (Exception rowEx) {
                    log.warn("Lỗi khi đọc dòng {}: {}", r, rowEx.getMessage());
                    List<String> rowErrors = new ArrayList<>();
                    rowErrors.add("Lỗi cấu trúc dữ liệu dòng " + (r + 1) + ": " + rowEx.getMessage());
                    rows.add(StudentImportRowDTO.builder()
                            .rowIndex(r + 1)
                            .stt(r)
                            .studentCode("")
                            .fullName("")
                            .isValid(false)
                            .errors(rowErrors)
                            .build());
                }
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
                if (val.contains("mssv") || val.contains("mã sinh viên") || val.contains("ma sinh vien")
                        || val.contains("mã sv") || val.contains("student code") || val.contains("mã số sv")) {
                    return r;
                }
            }
        }
        return 0;
    }

    private ColumnMapping detectColumnMapping(Row headerRow) {
        ColumnMapping mapping = new ColumnMapping();
        if (headerRow == null) {
            return mapping;
        }

        boolean foundStudentCode = false;
        int lastCell = headerRow.getLastCellNum();

        for (int c = 0; c < lastCell; c++) {
            String val = getCellValue(headerRow.getCell(c)).toLowerCase().trim();
            if (val.isEmpty()) continue;

            if (val.contains("mssv") || val.contains("mã sinh viên") || val.contains("ma sinh vien")
                    || val.contains("mã sv") || val.contains("ma sv") || val.contains("student code") || val.contains("mã số sv")) {
                mapping.colStudentCode = c;
                foundStudentCode = true;
            } else if (val.contains("họ và tên") || val.contains("họ tên") || val.contains("ho va ten") || val.contains("ho ten") || val.contains("full name")) {
                mapping.colFullName = c;
            } else if (val.contains("họ đệm") || val.contains("ho dem") || val.contains("họ và tên đệm") || (val.contains("họ") && !val.contains("học") && !val.contains("tên"))) {
                mapping.colLastName = c;
            } else if (val.equals("tên") || val.equals("ten") || val.equals("tên *") || val.equals("ten *") || val.contains("first name")) {
                mapping.colFirstName = c;
            } else if (val.contains("ngành") || val.contains("nganh") || val.contains("chuyên ngành") || val.contains("major")) {
                mapping.colMajor = c;
            } else if (val.contains("lớp") || val.contains("lop") || val.contains("class")) {
                mapping.colClass = c;
            } else if (val.contains("điện thoại") || val.contains("dien thoai") || val.contains("sđt") || val.contains("sdt") || val.contains("phone") || val.contains("mobile")) {
                mapping.colPhone = c;
            } else if (val.contains("email") || val.contains("thư điện tử") || val.contains("mail")) {
                mapping.colEmail = c;
            } else if (val.contains("gpa") || val.contains("điểm") || val.contains("diem") || val.contains("tbc")) {
                mapping.colGpa = c;
            } else if (val.contains("tín chỉ nợ") || val.contains("tin chi no") || val.contains("nợ tín chỉ") || val.contains("no tin chi") || val.contains("debt credit")) {
                mapping.colDebtCredits = c;
            } else if (val.contains("tín chỉ tích lũy") || val.contains("tin chi tich luy") || (val.contains("tích lũy") && !val.contains("gpa")) || val.contains("completed credit")) {
                mapping.colCompletedCredits = c;
            } else if (val.contains("học phí") || val.contains("hoc phi") || val.contains("tuition")) {
                mapping.colTuitionDebt = c;
            } else if (val.contains("kỷ luật") || val.contains("ky luat") || val.contains("discipline")) {
                mapping.colDiscipline = c;
            } else if (val.contains("tiên quyết") || val.contains("tien quyet") || val.contains("prereq") || val.contains("môn nợ") || val.contains("nợ môn")) {
                mapping.colPrereq = c;
            } else if (val.equals("stt") || val.contains("thứ tự") || val.contains("thu tu") || val.equals("no")) {
                mapping.colStt = c;
            }
        }

        if (mapping.colFullName >= 0 && mapping.colLastName < 0) {
            mapping.combinedFullNameMode = true;
        } else if (mapping.colFullName >= 0 && mapping.colFirstName < 0) {
            mapping.combinedFullNameMode = true;
        }

        // Nếu không phát hiện được cột MSSV từ header, giữ fallback theo chuẩn đầy đủ
        if (!foundStudentCode) {
            mapping.colStt = 0;
            mapping.colStudentCode = 1;
            mapping.colLastName = 2;
            mapping.colFirstName = 3;
            mapping.colMajor = 4;
            mapping.colClass = 5;
            mapping.colGpa = 6;
            mapping.colPhone = 7;
            mapping.colEmail = 8;
            mapping.colCompletedCredits = 9;
            mapping.colDebtCredits = 10;
            mapping.colPrereq = 11;
            mapping.colTuitionDebt = 12;
            mapping.colDiscipline = 13;
            mapping.combinedFullNameMode = false;
        }

        return mapping;
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

    private StudentImportRowDTO parseRowWithMapping(Row row, int rowIndex, ColumnMapping mapping) {
        List<String> errors = new ArrayList<>();

        // STT
        Integer stt = null;
        if (mapping.colStt >= 0 && mapping.colStt < row.getLastCellNum()) {
            String sttStr = getCellValue(row.getCell(mapping.colStt));
            if (!sttStr.isEmpty()) {
                try {
                    stt = (int) Double.parseDouble(sttStr);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        // Mã sinh viên (MSSV) *
        String rawStudentCode = "";
        if (mapping.colStudentCode >= 0 && mapping.colStudentCode < row.getLastCellNum()) {
            rawStudentCode = getCellValue(row.getCell(mapping.colStudentCode));
        }
        // Loại bỏ ký tự tàng hình zero-width hoặc khoảng trắng
        String studentCode = rawStudentCode.replaceAll("[\\u200B-\\u200D\\uFEFF\\s]", "").trim();

        if (studentCode.isEmpty()) {
            errors.add("Mã sinh viên không được để trống");
        } else if (!studentCode.matches("^\\d{9}$")) {
            errors.add("MSSV không hợp lệ (phải đúng 9 chữ số: " + studentCode + ")");
        }

        String lastName = "";
        String firstName = "";
        String fullName = "";
        String rawMajor = "";
        String className = "";
        String phone = "";
        String email = "";

        if (mapping.combinedFullNameMode && mapping.colFullName >= 0) {
            if (mapping.colFullName < row.getLastCellNum()) {
                fullName = getCellValue(row.getCell(mapping.colFullName));
            }
            if (fullName.isEmpty()) {
                errors.add("Họ và tên không được để trống");
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
        } else {
            if (mapping.colLastName >= 0 && mapping.colLastName < row.getLastCellNum()) {
                lastName = getCellValue(row.getCell(mapping.colLastName));
            }
            if (mapping.colFirstName >= 0 && mapping.colFirstName < row.getLastCellNum()) {
                firstName = getCellValue(row.getCell(mapping.colFirstName));
            }

            if (lastName.isEmpty() && firstName.isEmpty()) {
                errors.add("Họ và tên sinh viên không được để trống");
            } else if (firstName.isEmpty() && lastName.contains(" ")) {
                int lastSpace = lastName.lastIndexOf(' ');
                firstName = lastName.substring(lastSpace + 1).trim();
                lastName = lastName.substring(0, lastSpace).trim();
            }

            fullName = (lastName + " " + firstName).trim();
        }

        if (mapping.colMajor >= 0 && mapping.colMajor < row.getLastCellNum()) {
            rawMajor = getCellValue(row.getCell(mapping.colMajor));
        }
        if (mapping.colClass >= 0 && mapping.colClass < row.getLastCellNum()) {
            className = getCellValue(row.getCell(mapping.colClass));
        }
        if (mapping.colPhone >= 0 && mapping.colPhone < row.getLastCellNum()) {
            phone = getCellValue(row.getCell(mapping.colPhone));
        }
        if (mapping.colEmail >= 0 && mapping.colEmail < row.getLastCellNum()) {
            email = getCellValue(row.getCell(mapping.colEmail));
        }

        String majorCode = normalizeMajorCode(rawMajor);
        if (majorCode.isEmpty()) {
            majorCode = "CNTT";
        }

        if (className.isEmpty()) {
            className = majorCode + " - K62";
        }

        if (!phone.isEmpty()) {
            String cleanedPhone = phone.replaceAll("[\\s.-]", "");
            if (cleanedPhone.length() == 9 && !cleanedPhone.startsWith("0")) {
                cleanedPhone = "0" + cleanedPhone;
            }
            if (!cleanedPhone.matches("^0\\d{9}$") && (cleanedPhone.length() < 9 || cleanedPhone.length() > 11)) {
                errors.add("Số điện thoại không hợp lệ (phải là 10 chữ số bắt đầu bằng 0: " + phone + ")");
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

        // Đọc điểm GPA tích lũy từ cột Excel
        Double gpa = null;
        if (mapping.colGpa >= 0 && mapping.colGpa < row.getLastCellNum()) {
            Cell gpaCell = row.getCell(mapping.colGpa);
            if (gpaCell != null) {
                if (gpaCell.getCellType() == CellType.NUMERIC) {
                    double val = gpaCell.getNumericCellValue();
                    if (val >= 0.0 && val <= 4.0) {
                        gpa = Math.round(val * 100.0) / 100.0;
                    } else {
                        errors.add("Điểm GPA phải nằm trong khoảng từ 0.0 đến 4.0 (nhập: " + val + ")");
                    }
                } else {
                    String gpaStr = getCellValue(gpaCell).trim();
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
                }
            }
        }

        if (gpa == null) {
            errors.add("Điểm GPA không được để trống (nhập số hệ 4.0 từ 0.0 đến 4.0)");
        }

        // Đọc dữ liệu học vụ (nếu có trong file All-in-One)
        Integer debtCredits = 0;
        if (mapping.colDebtCredits >= 0 && mapping.colDebtCredits < row.getLastCellNum()) {
            String debtStr = getCellValue(row.getCell(mapping.colDebtCredits));
            if (!debtStr.isEmpty()) {
                try {
                    debtCredits = (int) Double.parseDouble(debtStr.replace(',', '.'));
                    if (debtCredits < 0) {
                        errors.add("Số tín chỉ nợ phải >= 0 (nhập: " + debtStr + ")");
                    } else if (debtCredits >= 10) {
                        errors.add("Sinh viên nợ " + debtCredits + " tín chỉ (>= 10 tín chỉ) - không đủ điều kiện nhận đồ án (bị loại khỏi đợt)");
                    }
                } catch (NumberFormatException e) {
                    errors.add("Số tín chỉ nợ không đúng định dạng số: " + debtStr);
                }
            }
        }

        Integer completedCredits = 115;
        if (mapping.colCompletedCredits >= 0 && mapping.colCompletedCredits < row.getLastCellNum()) {
            String cStr = getCellValue(row.getCell(mapping.colCompletedCredits));
            if (!cStr.isEmpty()) {
                try {
                    completedCredits = (int) Double.parseDouble(cStr.replace(',', '.'));
                    if (completedCredits < 0 || completedCredits > 150) {
                        errors.add("Tín chỉ tích lũy phải nằm trong khoảng 0 - 150 tín chỉ (nhập: " + completedCredits + ")");
                    }
                } catch (NumberFormatException ignored) {
                    errors.add("Tín chỉ tích lũy không đúng định dạng số: " + cStr);
                }
            }
        }

        Boolean tuitionDebt = false;
        if (mapping.colTuitionDebt >= 0 && mapping.colTuitionDebt < row.getLastCellNum()) {
            String tStr = getCellValue(row.getCell(mapping.colTuitionDebt)).toLowerCase();
            tuitionDebt = tStr.contains("có") || tStr.contains("co") || tStr.contains("yes") || tStr.equals("true") || tStr.equals("1");
        }

        Boolean underDiscipline = false;
        if (mapping.colDiscipline >= 0 && mapping.colDiscipline < row.getLastCellNum()) {
            String dStr = getCellValue(row.getCell(mapping.colDiscipline)).toLowerCase();
            underDiscipline = dStr.contains("có") || dStr.contains("co") || dStr.contains("yes") || dStr.equals("true") || dStr.equals("1");
        }

        Integer missingPrereq = 0;
        if (mapping.colPrereq >= 0 && mapping.colPrereq < row.getLastCellNum()) {
            String pStr = getCellValue(row.getCell(mapping.colPrereq));
            if (!pStr.isEmpty()) {
                try {
                    missingPrereq = (int) Double.parseDouble(pStr.replace(',', '.'));
                } catch (NumberFormatException ignored) {}
            }
        }

        // Điều kiện nhận đồ án UTC (GĐ1): Nợ tín chỉ < 10, Không nợ học phí, Không kỷ luật, Không nợ môn tiên quyết và GPA >= 2.0
        boolean isEligible = debtCredits < 10 && !tuitionDebt && !underDiscipline && missingPrereq == 0 && (gpa == null || gpa >= 2.0);
        String academicStatus = isEligible ? "ELIGIBLE" : "INELIGIBLE";

        boolean isValid = errors.isEmpty();

        return StudentImportRowDTO.builder()
                .rowIndex(rowIndex + 1)
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
                .completedCredits(completedCredits)
                .debtCredits(debtCredits)
                .tuitionDebt(tuitionDebt)
                .underDisciplinaryAction(underDiscipline)
                .missingPrerequisiteCount(missingPrereq)
                .academicStatus(academicStatus)
                .isValid(isValid)
                .errors(errors)
                .build();
    }

    private String getCellValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        try {
            if (cell.getCellType() == CellType.NUMERIC && !DateUtil.isCellDateFormatted(cell)) {
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    return String.valueOf((long) val);
                }
            } else if (cell.getCellType() == CellType.FORMULA) {
                try {
                    FormulaEvaluator evaluator = cell.getSheet().getWorkbook().getCreationHelper().createFormulaEvaluator();
                    CellValue cellValue = evaluator.evaluate(cell);
                    if (cellValue != null) {
                        if (cellValue.getCellType() == CellType.NUMERIC) {
                            double num = cellValue.getNumberValue();
                            return (num == (long) num) ? String.valueOf((long) num) : String.valueOf(num);
                        } else if (cellValue.getCellType() == CellType.STRING) {
                            return cellValue.getStringValue() != null ? cellValue.getStringValue().trim() : "";
                        } else if (cellValue.getCellType() == CellType.BOOLEAN) {
                            return String.valueOf(cellValue.getBooleanValue());
                        }
                    }
                } catch (Exception ignored) {
                }
            }
            return dataFormatter.formatCellValue(cell).trim();
        } catch (Exception e) {
            return "";
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null || row.getFirstCellNum() < 0) {
            return true;
        }
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
        return generateTemplate(Collections.emptySet());
    }

    public byte[] generateTemplate(Set<String> existingCodes) throws IOException {
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

            // Danh sách tiêu đề các cột chuẩn UTC gồm đầy đủ thông tin sinh viên & học vụ
            String[] headers = {
                    "STT",
                    "Mã sinh viên (MSSV) *",
                    "Họ đệm *",
                    "Tên *",
                    "Ngành (CNTT/KHMT) *",
                    "Lớp sinh hoạt *",
                    "GPA",
                    "Số điện thoại",
                    "Email",
                    "Tín chỉ tích lũy",
                    "Tín chỉ nợ (Nhận đồ án < 10)",
                    "Nợ môn tiên quyết",
                    "Nợ học phí (CÓ/KHÔNG)",
                    "Kỷ luật (CÓ/KHÔNG)"
            };

            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(28);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Sinh 5 mã sinh viên 9 chữ số chưa trùng lặp trong hệ thống
            Set<String> used = existingCodes != null ? new HashSet<>(existingCodes) : new HashSet<>();
            List<String> sampleCodes = new ArrayList<>();
            long candidate = 201200101L;
            while (sampleCodes.size() < 5) {
                String codeStr = String.format("%09d", candidate++);
                if (!used.contains(codeStr)) {
                    sampleCodes.add(codeStr);
                    used.add(codeStr);
                }
            }

            // Dữ liệu mẫu chuẩn từ ảnh UTC kèm đầy đủ cột học vụ
            Object[][] sampleData = {
                    {1, sampleCodes.get(0), "Nguyễn Tuấn", "Anh", "CNTT", "CNTT 1 - K65", 3.28, "0983000001", sampleCodes.get(0) + "@lms.utc.edu.vn", 125, 0, 0, "KHÔNG", "KHÔNG"},
                    {2, sampleCodes.get(1), "Trần Phương", "Thảo", "CNTT", "CNTT 2 - K65", 2.85, "0983000002", sampleCodes.get(1) + "@lms.utc.edu.vn", 118, 4, 0, "KHÔNG", "KHÔNG"},
                    {3, sampleCodes.get(2), "Lê Hoàng", "Long", "KHMT", "KHMT 1 - K65", 2.61, "0983000003", sampleCodes.get(2) + "@lms.utc.edu.vn", 112, 8, 0, "KHÔNG", "KHÔNG"},
                    {4, sampleCodes.get(3), "Phạm Minh", "Quân", "CNTT", "CNTT Việt Anh - K65", 2.10, "0983000004", sampleCodes.get(3) + "@lms.utc.edu.vn", 102, 12, 1, "KHÔNG", "KHÔNG"},
                    {5, sampleCodes.get(4), "Hoàng Thu", "Trang", "KHMT", "KHMT 2 - K65", 3.46, "0983000005", sampleCodes.get(4) + "@lms.utc.edu.vn", 130, 0, 0, "KHÔNG", "KHÔNG"}
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
            sheet.setColumnWidth(6, 14 * 256);  // GPA
            sheet.setColumnWidth(7, 18 * 256);  // SĐT
            sheet.setColumnWidth(8, 30 * 256);  // Email
            sheet.setColumnWidth(9, 18 * 256);  // Tín chỉ tích lũy
            sheet.setColumnWidth(10, 26 * 256); // Tín chỉ nợ
            sheet.setColumnWidth(11, 20 * 256); // Nợ môn tiên quyết
            sheet.setColumnWidth(12, 20 * 256); // Nợ học phí
            sheet.setColumnWidth(13, 18 * 256); // Kỷ luật

            workbook.write(out);
            return out.toByteArray();
        }
    }
}

