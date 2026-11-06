package com.example.thesis_hub_api.projectround;

import com.example.thesis_hub_api.projectround.dto.response.StudentImportRowDTO;
import com.example.thesis_hub_api.projectround.util.StudentExcelParser;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class StudentExcelParserTest {

    private final StudentExcelParser studentExcelParser = new StudentExcelParser();

    @Test
    @DisplayName("Tạo template Excel mẫu chuẩn và parse lại chính file đó")
    void generateTemplate_And_ParseBack_Success() throws IOException {
        byte[] excelBytes = studentExcelParser.generateTemplate();
        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "mau_import_sinh_vien_utc.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                excelBytes
        );

        List<StudentImportRowDTO> parsedRows = studentExcelParser.parseExcel(file);
        assertNotNull(parsedRows);
        assertEquals(5, parsedRows.size());

        // Kiểm tra dòng đầu tiên (An)
        StudentImportRowDTO row1 = parsedRows.get(0);
        assertEquals(1, row1.getStt());
        assertEquals("250200001", row1.getStudentCode());
        assertEquals("Nguyễn Tuấn", row1.getLastName());
        assertEquals("Anh", row1.getFirstName());
        assertEquals("Nguyễn Tuấn Anh", row1.getFullName());
        assertEquals("CNTT", row1.getMajorCode());
        assertEquals("CNTT 1 - K65", row1.getClassName());
        assertEquals(3.28, row1.getGpa(), 0.001);
        assertEquals("0983000001", row1.getPhone());
        assertEquals("250200001@lms.utc.edu.vn", row1.getEmail());
        assertTrue(row1.isValid());
        assertTrue(row1.getErrors().isEmpty());

        // Kiểm tra dòng thứ 3 (Cường - KHMT)
        StudentImportRowDTO row3 = parsedRows.get(2);
        assertEquals(3, row3.getStt());
        assertEquals("250200003", row3.getStudentCode());
        assertEquals("KHMT", row3.getMajorCode());
        assertEquals("KHMT 1 - K65", row3.getClassName());
        assertEquals(2.61, row3.getGpa(), 0.001);
        assertTrue(row3.isValid());
    }

    @Test
    @DisplayName("Parse file co cot So DT va cot Ho ten gop")
    void parseFile_WithCombinedFullName_And_SoDTHeader() throws IOException {
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = wb.createSheet("SinhVien");
            org.apache.poi.ss.usermodel.Row header = sheet.createRow(0);
            String[] headers = {"STT", "MSSV", "Họ tên", "Ngành", "Lớp", "GPA", "Số ĐT", "Email", "Trạng thái / Lỗi"};
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }

            org.apache.poi.ss.usermodel.Row row = sheet.createRow(1);
            row.createCell(0).setCellValue(1);
            row.createCell(1).setCellValue("225106007");
            row.createCell(2).setCellValue("Đỗ Mai Phương");
            row.createCell(3).setCellValue("Công nghệ thông tin");
            row.createCell(4).setCellValue("CNTT2022B");
            row.createCell(5).setCellValue(1.40);
            row.createCell(6).setCellValue("0978901234");
            row.createCell(7).setCellValue("phuong.dm225106007@sv.edu.vn");
            row.createCell(8).setCellValue("Đình chỉ học tập tạm thời");

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            wb.write(out);

            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    out.toByteArray()
            );

            List<StudentImportRowDTO> parsed = studentExcelParser.parseExcel(file);
            assertEquals(1, parsed.size());
            StudentImportRowDTO r = parsed.get(0);
            assertEquals("225106007", r.getStudentCode());
            assertEquals("Đỗ Mai Phương", r.getFullName());
            assertEquals("0978901234", r.getPhone());
            assertEquals("phuong.dm225106007@sv.edu.vn", r.getEmail());
            assertTrue(r.isValid());
        }
    }
}
