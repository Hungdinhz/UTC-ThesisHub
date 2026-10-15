package com.example.thesis_hub_api.projectround;

import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportRowDTO;
import com.example.thesis_hub_api.projectround.util.AcademicRecordExcelParser;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AcademicRecordExcelParserTest {

    private final AcademicRecordExcelParser parser = new AcademicRecordExcelParser();

    @Test
    @DisplayName("Tạo template Excel học vụ mẫu và parse lại kiểm tra dữ liệu")
    void generateTemplate_And_ParseBack_Success() throws IOException {
        byte[] excelBytes = parser.generateTemplate();
        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "mau_import_hoc_vu_utc.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                excelBytes
        );

        List<AcademicRecordImportRowDTO> rows = parser.parseExcel(file);
        assertNotNull(rows);
        assertEquals(5, rows.size());

        // Kiểm tra dòng 1 (An: 125 TC, 3.25 GPA, không nợ HP, không kỷ luật, 0 môn tiên quyết)
        AcademicRecordImportRowDTO row1 = rows.get(0);
        assertEquals(1, row1.getStt());
        assertEquals("201200101", row1.getStudentCode());
        assertEquals("Nguyễn Văn An", row1.getFullName());
        assertEquals(125, row1.getCompletedCredits());
        assertEquals(3.25, row1.getGpa(), 0.001);
        assertFalse(row1.getTuitionDebt());
        assertFalse(row1.getUnderDisciplinaryAction());
        assertEquals(0, row1.getMissingPrerequisiteCount());
        assertTrue(row1.isValid());

        // Kiểm tra dòng 4 (Dung: nợ học phí = CÓ)
        AcademicRecordImportRowDTO row4 = rows.get(3);
        assertEquals("201200104", row4.getStudentCode());
        assertTrue(row4.getTuitionDebt());
        assertEquals(1, row4.getMissingPrerequisiteCount());

        // Kiểm tra dòng 5 (Đức: bị kỷ luật = CÓ)
        AcademicRecordImportRowDTO row5 = rows.get(4);
        assertEquals("201200105", row5.getStudentCode());
        assertTrue(row5.getUnderDisciplinaryAction());
    }
}
