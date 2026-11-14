package com.example.thesis_hub_api.academicstaff.util;

import com.example.thesis_hub_api.academicstaff.dto.ClassGradeGroupDTO;
import com.example.thesis_hub_api.academicstaff.dto.ClassGradeReportResponseDTO;
import com.example.thesis_hub_api.academicstaff.dto.EligibleStudentListResponseDTO;
import com.example.thesis_hub_api.academicstaff.dto.EligibleStudentRowDTO;
import com.example.thesis_hub_api.defense.dto.GraduationResultResponseDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

/**
 * Xuất file Excel cho Giáo vụ: danh sách đủ điều kiện nhận đồ án và danh sách điểm đồ án theo lớp.
 */
@Component
public class AcademicStaffExcelExporter {

    private static final String[] FULL_STUDENT_HEADERS = {
            "STT", "MSSV", "Họ và tên", "Lớp", "Ngành", "Email", "Số điện thoại",
            "TC tích lũy", "GPA", "Học phí", "Kỷ luật", "Nợ tín", "Trạng thái", "Ghi chú"
    };
    private static final String[] GRADE_HEADERS = {
            "STT", "Mã sinh viên", "Họ và tên", "Tên đề tài", "GVHD", "Điểm GVHD", "Điểm phản biện",
            "Điểm hội đồng", "Điểm tổng kết", "Xếp loại", "Kết quả"
    };

    private static final class Styles {
        CellStyle title;
        CellStyle subtitle;
        CellStyle header;
        CellStyle text;
        CellStyle center;
        CellStyle number;
        CellStyle bold;
    }

    // ─── Danh sách đủ điều kiện nhận đồ án ───────────────────────────────────

    public byte[] exportEligibleStudents(EligibleStudentListResponseDTO data) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles st = createStyles(workbook);

            // Sheet 1: Toàn bộ danh sách sinh viên trong đợt (đầy đủ cột như bảng danh sách bên dưới)
            Sheet allSheet = workbook.createSheet("Danh_sach_sinh_vien");
            int rAll = writeTitle(allSheet, st, "DANH SÁCH SINH VIÊN TRONG ĐỢT ĐỒ ÁN",
                    "Đợt: " + safe(data.getRoundName()) + " (" + safe(data.getRoundCode()) + ")"
                            + " - Điều kiện: nợ tín chỉ <= " + data.getMaxDebtCredits(),
                    FULL_STUDENT_HEADERS.length);
            writeHeader(allSheet, st, rAll++, FULL_STUDENT_HEADERS);
            int sttAll = 1;
            for (EligibleStudentRowDTO s : data.getStudents()) {
                writeStudentRow(allSheet.createRow(rAll++), st, sttAll++, s);
            }
            rAll++;
            Row sumAll = allSheet.createRow(rAll);
            Cell sumAllCell = sumAll.createCell(1);
            sumAllCell.setCellValue("Tổng số sinh viên trong đợt: " + data.getTotalStudents()
                    + " (Đủ điều kiện: " + data.getEligibleCount() + ", Không đủ điều kiện: " + data.getIneligibleCount() + ")");
            sumAllCell.setCellStyle(st.bold);
            widths(allSheet, 6, 16, 26, 18, 24, 28, 16, 14, 10, 14, 14, 12, 18, 36);

            // Sheet 2: Đủ điều kiện
            Sheet ok = workbook.createSheet("Du_dieu_kien");
            int r = writeTitle(ok, st, "DANH SÁCH SINH VIÊN ĐỦ ĐIỀU KIỆN NHẬN ĐỒ ÁN",
                    "Đợt: " + safe(data.getRoundName()) + " (" + safe(data.getRoundCode()) + ")"
                            + " - Điều kiện: nợ tín chỉ <= " + data.getMaxDebtCredits(),
                    FULL_STUDENT_HEADERS.length);
            writeHeader(ok, st, r++, FULL_STUDENT_HEADERS);
            int stt = 1;
            for (EligibleStudentRowDTO s : data.getStudents()) {
                if (!s.isEligible()) {
                    continue;
                }
                writeStudentRow(ok.createRow(r++), st, stt++, s);
            }
            r++;
            Row sum = ok.createRow(r);
            Cell sumCell = sum.createCell(1);
            sumCell.setCellValue("Tổng số sinh viên đủ điều kiện: " + (stt - 1) + " / " + data.getTotalStudents());
            sumCell.setCellStyle(st.bold);
            widths(ok, 6, 16, 26, 18, 24, 28, 16, 14, 10, 14, 14, 12, 18, 36);

            // Sheet 3: Không đủ điều kiện / chưa có dữ liệu
            Sheet no = workbook.createSheet("Khong_du_dieu_kien");
            r = writeTitle(no, st, "DANH SÁCH SINH VIÊN KHÔNG ĐỦ ĐIỀU KIỆN HOẶC CHƯA CÓ DỮ LIỆU HỌC VỤ",
                    "Đợt: " + safe(data.getRoundName()) + " (" + safe(data.getRoundCode()) + ")",
                    FULL_STUDENT_HEADERS.length);
            writeHeader(no, st, r++, FULL_STUDENT_HEADERS);
            stt = 1;
            for (EligibleStudentRowDTO s : data.getStudents()) {
                if (s.isEligible()) {
                    continue;
                }
                writeStudentRow(no.createRow(r++), st, stt++, s);
            }
            widths(no, 6, 16, 26, 18, 24, 28, 16, 14, 10, 14, 14, 12, 18, 36);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void writeStudentRow(Row row, Styles st, int stt, EligibleStudentRowDTO s) {
        cell(row, 0, st.center).setCellValue(stt);
        cell(row, 1, st.center).setCellValue(safe(s.getStudentCode()));
        cell(row, 2, st.text).setCellValue(safe(s.getFullName()));
        cell(row, 3, st.center).setCellValue(safe(s.getClassName()));
        String majorDisplay = !safe(s.getMajorCode()).isEmpty() && !safe(s.getMajorName()).isEmpty()
                ? s.getMajorCode() + " - " + s.getMajorName()
                : (!safe(s.getMajorName()).isEmpty() ? s.getMajorName() : safe(s.getMajorCode()));
        cell(row, 4, st.text).setCellValue(majorDisplay);
        cell(row, 5, st.text).setCellValue(safe(s.getEmail()));
        cell(row, 6, st.center).setCellValue(safe(s.getPhone()));
        setInt(cell(row, 7, st.center), s.getCompletedCredits());
        if (s.getGpa() != null) {
            cell(row, 8, st.number).setCellValue(s.getGpa());
        } else {
            cell(row, 8, st.center);
        }
        cell(row, 9, st.center).setCellValue(Boolean.TRUE.equals(s.getTuitionDebt()) ? "Nợ HP" : "Đã đóng");
        cell(row, 10, st.center).setCellValue(Boolean.TRUE.equals(s.getUnderDisciplinaryAction()) ? "Bị KL" : "Không");
        setInt(cell(row, 11, st.center), s.getDebtCredits() != null ? s.getDebtCredits() : 0);
        cell(row, 12, st.center).setCellValue(statusLabel(s.getStatus()));
        String noteOrReasons = !safe(s.getNote()).isEmpty()
                ? s.getNote()
                : (s.getReasons() == null ? "" : String.join("; ", s.getReasons()));
        cell(row, 13, st.text).setCellValue(noteOrReasons);
    }

    // ─── Danh sách điểm đồ án theo lớp ───────────────────────────────────────

    public byte[] exportClassGrades(ClassGradeReportResponseDTO report) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles st = createStyles(workbook);
            Set<String> usedNames = new HashSet<>();

            for (ClassGradeGroupDTO group : report.getClasses()) {
                Sheet sheet = workbook.createSheet(uniqueSheetName(group.getClassName(), usedNames));
                int r = writeTitle(sheet, st, "DANH SÁCH ĐIỂM ĐỒ ÁN TỐT NGHIỆP - LỚP " + group.getClassName(),
                        "Đợt: " + safe(report.getRoundName()) + " (" + safe(report.getRoundCode()) + ")",
                        GRADE_HEADERS.length);
                writeHeader(sheet, st, r++, GRADE_HEADERS);

                int stt = 1;
                for (GraduationResultResponseDTO g : group.getRows()) {
                    Row row = sheet.createRow(r++);
                    cell(row, 0, st.center).setCellValue(stt++);
                    cell(row, 1, st.center).setCellValue(safe(g.getStudentCode()));
                    cell(row, 2, st.text).setCellValue(safe(g.getStudentName()));
                    cell(row, 3, st.text).setCellValue(safe(g.getThesisTitle()));
                    cell(row, 4, st.text).setCellValue(safe(g.getAdvisorName()));
                    setScore(cell(row, 5, st.number), st.center, g.getSupervisorScore());
                    setScore(cell(row, 6, st.number), st.center, g.getReviewerScore());
                    setScore(cell(row, 7, st.number), st.center, g.getCouncilScore());
                    setScore(cell(row, 8, st.number), st.center, g.getFinalScore());
                    cell(row, 9, st.center).setCellValue(safe(g.getGrade()));
                    cell(row, 10, st.center).setCellValue(resultLabel(g.getFinalResult()));
                }

                r++;
                Row sum = sheet.createRow(r);
                Cell c = sum.createCell(1);
                c.setCellValue("Tổng số: " + group.getTotalStudents() + " | Đạt: " + group.getPassedCount()
                        + " | Không đạt: " + group.getFailedCount()
                        + (group.getAverageScore() != null ? " | Điểm TB: " + group.getAverageScore() : ""));
                c.setCellStyle(st.bold);

                Row sign = sheet.createRow(r + 2);
                Cell s1 = sign.createCell(2);
                s1.setCellValue("Giáo vụ khoa");
                s1.setCellStyle(st.bold);
                Cell s2 = sign.createCell(8);
                s2.setCellValue("Trưởng khoa");
                s2.setCellStyle(st.bold);

                widths(sheet, 6, 16, 28, 40, 26, 12, 14, 14, 14, 14, 14);
                sheet.getPrintSetup().setLandscape(true);
                sheet.setFitToPage(true);
                sheet.getPrintSetup().setFitWidth((short) 1);
                sheet.getPrintSetup().setFitHeight((short) 0);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private int writeTitle(Sheet sheet, Styles st, String title, String subtitle, int columns) {
        Row t = sheet.createRow(0);
        t.setHeightInPoints(26);
        Cell tc = t.createCell(0);
        tc.setCellValue(title);
        tc.setCellStyle(st.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, columns - 1));

        Row s = sheet.createRow(1);
        Cell sc = s.createCell(0);
        sc.setCellValue(subtitle);
        sc.setCellStyle(st.subtitle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, columns - 1));
        return 3;
    }

    private void writeHeader(Sheet sheet, Styles st, int rowIdx, String[] headers) {
        Row row = sheet.createRow(rowIdx);
        row.setHeightInPoints(28);
        for (int i = 0; i < headers.length; i++) {
            Cell c = row.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(st.header);
        }
    }

    private Cell cell(Row row, int col, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellStyle(style);
        return c;
    }

    private void setInt(Cell cell, Integer value) {
        if (value != null) {
            cell.setCellValue(value);
        }
    }

    private void setScore(Cell cell, CellStyle emptyStyle, BigDecimal value) {
        if (value != null) {
            cell.setCellValue(value.doubleValue());
        } else {
            cell.setCellStyle(emptyStyle);
        }
    }

    private void widths(Sheet sheet, int... chars) {
        for (int i = 0; i < chars.length; i++) {
            sheet.setColumnWidth(i, chars[i] * 256);
        }
    }

    private String uniqueSheetName(String raw, Set<String> used) {
        String base = (raw == null || raw.isBlank() ? "Lop" : raw).replaceAll("[\\\\/?*\\[\\]:]", "_").trim();
        if (base.length() > 28) {
            base = base.substring(0, 28);
        }
        String name = base;
        int i = 2;
        while (!used.add(name.toLowerCase())) {
            name = base + "_" + i++;
        }
        return name;
    }

    private String statusLabel(String status) {
        if (status == null) return "";
        return switch (status.toUpperCase()) {
            case "INELIGIBLE" -> "Không đủ điều kiện";
            case "RESERVED" -> "Đã bảo lưu";
            case "DISQUALIFIED" -> "Bị loại khỏi đợt";
            case "NO_DATA" -> "Chưa có dữ liệu học vụ";
            case "FORCE_APPROVED" -> "Duyệt đặc cách";
            case "ELIGIBLE" -> "Đủ điều kiện";
            default -> status;
        };
    }

    private String resultLabel(String result) {
        if ("PASSED".equalsIgnoreCase(result)) return "Đạt";
        if ("FAILED".equalsIgnoreCase(result)) return "Không đạt";
        return "";
    }

    private String safe(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        char first = s.charAt(0);
        if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
            return "'" + s;
        }
        return s;
    }

    private Styles createStyles(Workbook wb) {
        Styles st = new Styles();

        Font titleFont = wb.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        st.title = wb.createCellStyle();
        st.title.setFont(titleFont);
        st.title.setAlignment(HorizontalAlignment.CENTER);
        st.title.setVerticalAlignment(VerticalAlignment.CENTER);

        Font italic = wb.createFont();
        italic.setItalic(true);
        st.subtitle = wb.createCellStyle();
        st.subtitle.setFont(italic);
        st.subtitle.setAlignment(HorizontalAlignment.CENTER);

        Font headerFont = wb.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        st.header = wb.createCellStyle();
        st.header.setFont(headerFont);
        st.header.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        st.header.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        st.header.setAlignment(HorizontalAlignment.CENTER);
        st.header.setVerticalAlignment(VerticalAlignment.CENTER);
        st.header.setWrapText(true);
        border(st.header);

        st.text = wb.createCellStyle();
        st.text.setWrapText(true);
        st.text.setVerticalAlignment(VerticalAlignment.CENTER);
        border(st.text);

        st.center = wb.createCellStyle();
        st.center.cloneStyleFrom(st.text);
        st.center.setAlignment(HorizontalAlignment.CENTER);

        st.number = wb.createCellStyle();
        st.number.cloneStyleFrom(st.center);
        st.number.setDataFormat(wb.createDataFormat().getFormat("0.00"));

        Font boldFont = wb.createFont();
        boldFont.setBold(true);
        st.bold = wb.createCellStyle();
        st.bold.setFont(boldFont);
        return st;
    }

    private void border(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }
}
