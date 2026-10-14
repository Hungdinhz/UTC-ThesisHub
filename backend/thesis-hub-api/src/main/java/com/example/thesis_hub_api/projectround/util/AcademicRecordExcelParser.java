package com.example.thesis_hub_api.projectround.util;

import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportRowDTO;
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
public class AcademicRecordExcelParser {

    private final DataFormatter dataFormatter = new DataFormatter();

    /**
     * Phân tích file Excel điểm và học vụ thành danh sách AcademicRecordImportRowDTO
     */
    public List<AcademicRecordImportRowDTO> parseExcel(MultipartFile file) throws IOException {
        List<AcademicRecordImportRowDTO> rows = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                return rows;
            }

            int lastRowNum = sheet.getLastRowNum();
            for (int r = 1; r <= lastRowNum; r++) { // Dòng 1 trở đi (dòng 0 là header)
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                AcademicRecordImportRowDTO rowDto = parseRow(row, r);
                rows.add(rowDto);
            }
        }

        return rows;
    }

    private AcademicRecordImportRowDTO parseRow(Row row, int rowIndex) {
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

        // Cột C (2): Họ và tên
        String fullName = getCellValue(row.getCell(2));

        // Cột D (3): Số tín chỉ tích lũy *
        String creditsStr = getCellValue(row.getCell(3));
        Integer completedCredits = 0;
        if (creditsStr.isEmpty()) {
            errors.add("Số tín chỉ tích lũy không được để trống");
        } else {
            try {
                completedCredits = (int) Double.parseDouble(creditsStr);
                if (completedCredits < 0) {
                    errors.add("Số tín chỉ tích lũy phải >= 0");
                }
            } catch (NumberFormatException e) {
                errors.add("Số tín chỉ tích lũy không đúng định dạng số: " + creditsStr);
            }
        }

        // Cột E (4): Điểm GPA tích lũy *
        String gpaStr = getCellValue(row.getCell(4));
        Double gpa = 0.0;
        if (gpaStr.isEmpty()) {
            errors.add("Điểm GPA tích lũy không được để trống");
        } else {
            try {
                gpa = Double.parseDouble(gpaStr.replace(',', '.'));
                if (gpa < 0.0 || gpa > 4.0) {
                    errors.add("Điểm GPA tích lũy phải nằm trong khoảng từ 0.0 đến 4.0: " + gpaStr);
                }
            } catch (NumberFormatException e) {
                errors.add("Điểm GPA không đúng định dạng số: " + gpaStr);
            }
        }

        // Cột F (5): Nợ học phí (CÓ/KHÔNG) *
        String tuitionDebtStr = getCellValue(row.getCell(5));
        boolean tuitionDebt = parseBoolean(tuitionDebtStr);

        // Cột G (6): Kỷ luật (CÓ/KHÔNG) *
        String disciplinaryStr = getCellValue(row.getCell(6));
        boolean underDisciplinaryAction = parseBoolean(disciplinaryStr);

        // Cột H (7): Số môn tiên quyết còn nợ *
        String prereqStr = getCellValue(row.getCell(7));
        Integer missingPrereqCount = 0;
        if (!prereqStr.isEmpty()) {
            try {
                missingPrereqCount = (int) Double.parseDouble(prereqStr);
                if (missingPrereqCount < 0) {
                    errors.add("Số môn tiên quyết còn nợ phải >= 0");
                }
            } catch (NumberFormatException e) {
                errors.add("Số môn tiên quyết còn nợ không đúng định dạng số: " + prereqStr);
            }
        }

        // Cột I (8): Ghi chú
        String note = getCellValue(row.getCell(8));

        boolean isValid = errors.isEmpty();

        return AcademicRecordImportRowDTO.builder()
                .rowIndex(rowIndex + 1)
                .stt(stt != null ? stt : rowIndex)
                .studentCode(studentCode)
                .fullName(fullName)
                .completedCredits(completedCredits)
                .gpa(gpa)
                .tuitionDebt(tuitionDebt)
                .underDisciplinaryAction(underDisciplinaryAction)
                .missingPrerequisiteCount(missingPrereqCount)
                .note(note)
                .isValid(isValid)
                .errors(errors)
                .build();
    }

    private boolean parseBoolean(String value) {
        if (value == null) return false;
        String val = value.trim().toUpperCase();
        return val.equals("CÓ") || val.equals("CO") || val.equals("YES") || val.equals("TRUE") || val.equals("1") || val.equals("X");
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
     * Tạo file Excel mẫu import dữ liệu học vụ chuẩn UTC
     */
    public byte[] generateTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Ket_qua_hoc_vu_xet_dieu_kien");

            // Header Style
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

            // Data Style
            CellStyle dataCellStyle = workbook.createCellStyle();
            dataCellStyle.setBorderTop(BorderStyle.THIN);
            dataCellStyle.setBorderBottom(BorderStyle.THIN);
            dataCellStyle.setBorderLeft(BorderStyle.THIN);
            dataCellStyle.setBorderRight(BorderStyle.THIN);

            CellStyle centerCellStyle = workbook.createCellStyle();
            centerCellStyle.cloneStyleFrom(dataCellStyle);
            centerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            String[] headers = {
                    "STT",
                    "Mã sinh viên (MSSV) *",
                    "Họ và tên",
                    "Số tín chỉ tích lũy *",
                    "Điểm GPA tích lũy *",
                    "Nợ học phí (CÓ/KHÔNG) *",
                    "Kỷ luật (CÓ/KHÔNG) *",
                    "Số môn tiên quyết còn nợ *",
                    "Ghi chú"
            };

            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(28);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Dữ liệu mẫu chuẩn ứng với 5 sinh viên của đợt
            Object[][] sampleData = {
                    {1, "201200101", "Nguyễn Văn An", 125, 3.25, "KHÔNG", "KHÔNG", 0, "Đủ điều kiện xét làm đồ án"},
                    {2, "201200102", "Trần Thị Bình", 118, 2.85, "KHÔNG", "KHÔNG", 0, "Đủ điều kiện xét làm đồ án"},
                    {3, "201200103", "Lê Hoàng Cường", 132, 3.65, "KHÔNG", "KHÔNG", 0, "Đủ điều kiện xét làm đồ án xuất sắc"},
                    {4, "201200104", "Phạm Ngọc Dung", 102, 2.15, "CÓ", "KHÔNG", 1, "Chưa đủ 110 tín chỉ và còn nợ học phí"},
                    {5, "201200105", "Hoàng Minh Đức", 120, 1.95, "KHÔNG", "CÓ", 0, "GPA dưới 2.0 và đang bị kỷ luật"}
            };

            int rowIdx = 1;
            for (Object[] rowData : sampleData) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(20);

                for (int col = 0; col < rowData.length; col++) {
                    Cell cell = row.createCell(col);
                    Object val = rowData[col];
                    if (val instanceof Integer) {
                        cell.setCellValue((Integer) val);
                        cell.setCellStyle(centerCellStyle);
                    } else if (val instanceof Double) {
                        cell.setCellValue((Double) val);
                        cell.setCellStyle(centerCellStyle);
                    } else {
                        cell.setCellValue(String.valueOf(val));
                        if (col == 0 || col == 1 || col == 5 || col == 6) {
                            cell.setCellStyle(centerCellStyle);
                        } else {
                            cell.setCellStyle(dataCellStyle);
                        }
                    }
                }
            }

            // Độ rộng cột
            sheet.setColumnWidth(0, 8 * 256);
            sheet.setColumnWidth(1, 24 * 256);
            sheet.setColumnWidth(2, 24 * 256);
            sheet.setColumnWidth(3, 22 * 256);
            sheet.setColumnWidth(4, 20 * 256);
            sheet.setColumnWidth(5, 24 * 256);
            sheet.setColumnWidth(6, 22 * 256);
            sheet.setColumnWidth(7, 26 * 256);
            sheet.setColumnWidth(8, 36 * 256);

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
