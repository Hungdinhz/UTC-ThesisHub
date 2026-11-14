package com.example.thesis_hub_api.academicstaff;

import com.example.thesis_hub_api.academicstaff.dto.ClassGradeReportResponseDTO;
import com.example.thesis_hub_api.academicstaff.dto.EligibleStudentListResponseDTO;
import com.example.thesis_hub_api.academicstaff.service.AcademicStaffService;
import com.example.thesis_hub_api.academicstaff.util.AcademicStaffExcelExporter;
import com.example.thesis_hub_api.defense.dto.GraduationResultResponseDTO;
import com.example.thesis_hub_api.defense.service.DefenseService;
import com.example.thesis_hub_api.eligibility.dto.EligibilityCheckResponseDTO;
import com.example.thesis_hub_api.eligibility.service.EligibilityService;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.MajorRepository;
import com.example.thesis_hub_api.projectround.entity.AcademicRecord;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.AcademicRecordRepository;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AcademicStaffServiceTest {

    private static final Long ROUND_ID = 1L;

    @Mock private ProjectRoundRepository projectRoundRepository;
    @Mock private StudentProjectRoundRepository studentProjectRoundRepository;
    @Mock private AcademicRecordRepository academicRecordRepository;
    @Mock private MajorRepository majorRepository;
    @Mock private EligibilityService eligibilityService;
    @Mock private DefenseService defenseService;

    private AcademicStaffService service;

    @BeforeEach
    void setUp() {
        service = new AcademicStaffService(projectRoundRepository, studentProjectRoundRepository,
                academicRecordRepository, majorRepository, eligibilityService, defenseService,
                new AcademicStaffExcelExporter());
        ProjectRound round = ProjectRound.builder().id(ROUND_ID).roundCode("R1").name("Dot 1").status("IN_PROGRESS").build();
        lenient().when(projectRoundRepository.findById(ROUND_ID)).thenReturn(Optional.of(round));
        lenient().when(majorRepository.findAll()).thenReturn(List.of());
        lenient().when(eligibilityService.getMaxDebtCreditsToStart()).thenReturn(10);
    }

    private Student student(long id, String code, String className) {
        return Student.builder().id(id).studentCode(code).className(className).build();
    }

    private StudentProjectRound spr(Student s) {
        return StudentProjectRound.builder().student(s).status("ELIGIBLE").build();
    }

    private AcademicRecord record(Student s, int debt) {
        return AcademicRecord.builder().student(s).completedCredits(120).gpa(3.0).debtCredits(debt).build();
    }

    private EligibilityCheckResponseDTO check(String status) {
        return EligibilityCheckResponseDTO.builder().status(status).reasons(List.of("r")).build();
    }

    @Test
    void eligibleStudents_splitsEligibleIneligibleAndNoData() {
        Student s1 = student(1, "SV1", "CNTT1");
        Student s2 = student(2, "SV2", "CNTT1");
        Student s3 = student(3, "SV3", "CNTT2");

        when(studentProjectRoundRepository.findByProjectRoundId(ROUND_ID))
                .thenReturn(List.of(spr(s1), spr(s2), spr(s3)));
        // s3 không có dữ liệu học vụ
        when(academicRecordRepository.findByProjectRoundId(ROUND_ID))
                .thenReturn(List.of(record(s1, 6), record(s2, 15)));
        when(eligibilityService.checkThesisEligibility(1L, ROUND_ID)).thenReturn(check("ELIGIBLE"));
        when(eligibilityService.checkThesisEligibility(2L, ROUND_ID)).thenReturn(check("INELIGIBLE"));

        EligibleStudentListResponseDTO result = service.getEligibleStudents(ROUND_ID, false);

        assertEquals(3, result.getTotalStudents());
        assertEquals(1, result.getEligibleCount());
        assertEquals(1, result.getIneligibleCount());
        assertEquals(1, result.getNoDataCount());
        verify(eligibilityService, never()).checkThesisEligibility(eq(3L), anyLong());

        EligibleStudentListResponseDTO onlyOk = service.getEligibleStudents(ROUND_ID, true);
        assertEquals(1, onlyOk.getStudents().size());
        assertEquals("SV1", onlyOk.getStudents().get(0).getStudentCode());
        assertEquals(6, onlyOk.getStudents().get(0).getDebtCredits());
    }

    private GraduationResultResponseDTO grade(String code, String cls, String score, String result, boolean published) {
        return GraduationResultResponseDTO.builder()
                .studentCode(code).studentName("Name " + code).studentClass(cls)
                .finalScore(new BigDecimal(score)).finalResult(result)
                .publishedAt(published ? Instant.now() : null)
                .build();
    }

    @Test
    void gradeReport_groupsByClassAndSkipsUnpublished() {
        when(defenseService.getGraduationResultsByRound(ROUND_ID)).thenReturn(List.of(
                grade("SV2", "CNTT1", "8.00", "PASSED", true),
                grade("SV1", "CNTT1", "4.00", "FAILED", true),
                grade("SV3", "CNTT2", "9.00", "PASSED", true),
                grade("SV4", "CNTT2", "7.00", "PASSED", false)));

        ClassGradeReportResponseDTO report = service.buildGradeReport(ROUND_ID, null);

        assertEquals(2, report.getClasses().size());
        assertEquals(3, report.getTotalStudents());
        assertEquals("CNTT1", report.getClasses().get(0).getClassName());
        assertEquals("SV1", report.getClasses().get(0).getRows().get(0).getStudentCode());
        assertEquals(1, report.getClasses().get(0).getPassedCount());
        assertEquals(1, report.getClasses().get(0).getFailedCount());
        assertEquals(6.0, report.getClasses().get(0).getAverageScore());

        ClassGradeReportResponseDTO filtered = service.buildGradeReport(ROUND_ID, "cntt2");
        assertEquals(1, filtered.getClasses().size());
        assertEquals(1, filtered.getTotalStudents());
    }

    @Test
    void exportClassGrades_producesXlsxBytes() {
        when(defenseService.getGraduationResultsByRound(ROUND_ID)).thenReturn(List.of(
                grade("SV1", "CNTT1 - K62", "8.00", "PASSED", true)));

        byte[] bytes = service.exportClassGrades(ROUND_ID, null);

        // File xlsx là zip: bắt đầu bằng "PK"
        assertTrue(bytes.length > 100);
        assertEquals('P', bytes[0]);
        assertEquals('K', bytes[1]);
    }

    @Test
    void exportClassGrades_throwsWhenNothingPublished() {
        when(defenseService.getGraduationResultsByRound(ROUND_ID)).thenReturn(List.of());
        assertThrows(RuntimeException.class, () -> service.exportClassGrades(ROUND_ID, null));
    }

    @Test
    void exportEligibleStudents_producesXlsxBytes() {
        Student s1 = student(1, "SV1", "CNTT1");
        when(studentProjectRoundRepository.findByProjectRoundId(ROUND_ID)).thenReturn(List.of(spr(s1)));
        when(academicRecordRepository.findByProjectRoundId(ROUND_ID)).thenReturn(List.of(record(s1, 0)));
        when(eligibilityService.checkThesisEligibility(1L, ROUND_ID)).thenReturn(check("ELIGIBLE"));

        byte[] bytes = service.exportEligibleStudents(ROUND_ID);

        assertEquals('P', bytes[0]);
        assertEquals('K', bytes[1]);
    }
}
