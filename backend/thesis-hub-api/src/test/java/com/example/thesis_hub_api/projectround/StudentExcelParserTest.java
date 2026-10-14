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
        assertEquals("201200101", row1.getStudentCode());
        assertEquals("Nguyễn Văn", row1.getLastName());
        assertEquals("An", row1.getFirstName());
        assertEquals("Nguyễn Văn An", row1.getFullName());
        assertEquals("CNTT", row1.getMajorCode());
        assertEquals("CNTT 1 - K62", row1.getClassName());
        assertEquals("0912345671", row1.getPhone());
        assertEquals("201200101@lms.utc.edu.vn", row1.getEmail());
        assertTrue(row1.isValid());
        assertTrue(row1.getErrors().isEmpty());

        // Kiểm tra dòng thứ 3 (Cường - KHMT)
        StudentImportRowDTO row3 = parsedRows.get(2);
        assertEquals(3, row3.getStt());
        assertEquals("201200103", row3.getStudentCode());
        assertEquals("KHMT", row3.getMajorCode());
        assertEquals("KHMT 1 - K62", row3.getClassName());
        assertTrue(row3.isValid());
    }
}
