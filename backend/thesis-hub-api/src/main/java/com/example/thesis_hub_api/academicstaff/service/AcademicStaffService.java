package com.example.thesis_hub_api.academicstaff.service;

import com.example.thesis_hub_api.academicstaff.dto.ClassGradeGroupDTO;
import com.example.thesis_hub_api.academicstaff.dto.ClassGradeReportResponseDTO;
import com.example.thesis_hub_api.academicstaff.dto.EligibleStudentListResponseDTO;
import com.example.thesis_hub_api.academicstaff.dto.EligibleStudentRowDTO;
import com.example.thesis_hub_api.academicstaff.util.AcademicStaffExcelExporter;
import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.defense.dto.GraduationResultResponseDTO;
import com.example.thesis_hub_api.defense.service.DefenseService;
import com.example.thesis_hub_api.eligibility.dto.EligibilityCheckResponseDTO;
import com.example.thesis_hub_api.eligibility.service.EligibilityService;
import com.example.thesis_hub_api.organization.entity.Major;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.MajorRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.entity.AcademicRecord;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.AcademicRecordRepository;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Nghiệp vụ của Giáo vụ khoa:
 * 1. Lập danh sách sinh viên đủ điều kiện nhận đồ án (Giai đoạn 1).
 * 2. In danh sách điểm đồ án theo lớp (Giai đoạn 5).
 */
@Service
@RequiredArgsConstructor
public class AcademicStaffService {

    public static final String STATUS_NO_DATA = "NO_DATA";
    private static final String NO_CLASS_LABEL = "Chưa có lớp";

    private final ProjectRoundRepository projectRoundRepository;
    private final StudentProjectRoundRepository studentProjectRoundRepository;
    private final AcademicRecordRepository academicRecordRepository;
    private final MajorRepository majorRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private StudentRepository studentRepository;
    private final EligibilityService eligibilityService;
    private final DefenseService defenseService;
    private final AcademicStaffExcelExporter excelExporter;

    // ─── 1. DANH SÁCH ĐỦ ĐIỀU KIỆN NHẬN ĐỒ ÁN ───────────────────────────────

    @Transactional(readOnly = true)
    public EligibleStudentListResponseDTO getEligibleStudents(Long roundId, boolean onlyEligible) {
        ProjectRound round = getRound(roundId);

        Map<Long, AcademicRecord> recordMap = academicRecordRepository.findByProjectRoundId(roundId).stream()
                .filter(ar -> ar.getStudent() != null)
                .collect(Collectors.toMap(ar -> ar.getStudent().getId(), ar -> ar, (a, b) -> a));
        Map<Long, Major> majorMap = majorRepository.findAll().stream()
                .collect(Collectors.toMap(Major::getId, m -> m, (a, b) -> a));

        List<EligibleStudentRowDTO> all = new ArrayList<>();
        for (StudentProjectRound spr : studentProjectRoundRepository.findByProjectRoundId(roundId)) {
            Student student = spr.getStudent();
            if (student == null) {
                continue;
            }
            all.add(buildRow(spr, student, recordMap.get(student.getId()), majorMap, roundId));
        }

        all.sort(Comparator
                .comparing((EligibleStudentRowDTO r) -> r.getClassName() == null ? "" : r.getClassName())
                .thenComparing(r -> r.getStudentCode() == null ? "" : r.getStudentCode()));

        int eligibleCount = (int) all.stream().filter(EligibleStudentRowDTO::isEligible).count();
        int noDataCount = (int) all.stream().filter(r -> STATUS_NO_DATA.equals(r.getStatus())).count();

        List<EligibleStudentRowDTO> students = onlyEligible
                ? all.stream().filter(EligibleStudentRowDTO::isEligible).toList()
                : all;

        return EligibleStudentListResponseDTO.builder()
                .roundId(round.getId())
                .roundCode(round.getRoundCode())
                .roundName(round.getName())
                .maxDebtCredits(eligibilityService.getMaxDebtCreditsToStart())
                .totalStudents(all.size())
                .eligibleCount(eligibleCount)
                .ineligibleCount(all.size() - eligibleCount - noDataCount)
                .noDataCount(noDataCount)
                .students(students)
                .build();
    }

    private EligibleStudentRowDTO buildRow(StudentProjectRound spr, Student student, AcademicRecord record,
                                           Map<Long, Major> majorMap, Long roundId) {
        String status;
        List<String> reasons;

        // Sinh viên chưa có dữ liệu học vụ của đợt thì KHÔNG được coi là đủ điều kiện
        // (tránh việc EligibilityService rơi về dữ liệu mock mặc định).
        if (record != null || hasSpecialRoundStatus(spr)) {
            EligibilityCheckResponseDTO check = eligibilityService.checkThesisEligibility(student.getId(), roundId);
            status = check.getStatus();
            reasons = check.getReasons() != null ? check.getReasons() : List.of();
        } else {
            status = STATUS_NO_DATA;
            reasons = List.of("Chưa có dữ liệu học vụ của sinh viên trong đợt này (cần import file Excel học vụ)");
        }

        Major major = student.getMajorId() != null ? majorMap.get(student.getMajorId()) : null;
        boolean eligible = "ELIGIBLE".equalsIgnoreCase(status) || "FORCE_APPROVED".equalsIgnoreCase(status);

        return EligibleStudentRowDTO.builder()
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .fullName(student.getUser() != null ? student.getUser().getFullName() : null)
                .className(student.getClassName())
                .majorName(major != null ? major.getName() : null)
                .completedCredits(record != null ? record.getCompletedCredits() : null)
                .debtCredits(record != null ? record.getDebtCredits() : null)
                .gpa(record != null ? record.getGpa() : null)
                .status(status)
                .eligible(eligible)
                .reasons(reasons)
                .build();
    }

    private boolean hasSpecialRoundStatus(StudentProjectRound spr) {
        String s = spr.getStatus();
        if ("RESERVED".equalsIgnoreCase(s) || "DROPPED".equalsIgnoreCase(s) || "DISQUALIFIED".equalsIgnoreCase(s)) {
            return true;
        }
        return spr.getNote() != null && spr.getNote().toLowerCase().contains("force approve");
    }

    @Transactional(readOnly = true)
    public byte[] exportEligibleStudents(Long roundId) {
        EligibleStudentListResponseDTO data = getEligibleStudents(roundId, false);
        try {
            return excelExporter.exportEligibleStudents(data);
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    // ─── 2. DANH SÁCH ĐIỂM ĐỒ ÁN THEO LỚP ───────────────────────────────────

    @Transactional(readOnly = true)
    public List<String> getClassNames(Long roundId) {
        return buildGradeReport(roundId, null).getClasses().stream()
                .map(ClassGradeGroupDTO::getClassName)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassGradeReportResponseDTO buildGradeReport(Long roundId, String className) {
        ProjectRound round = getRound(roundId);

        // Chỉ lấy kết quả đã được tổng hợp và công bố (publishedAt != null)
        List<GraduationResultResponseDTO> results = defenseService.getGraduationResultsByRound(roundId).stream()
                .filter(r -> r.getPublishedAt() != null)
                .toList();

        Map<String, List<GraduationResultResponseDTO>> byClass = results.stream()
                .collect(Collectors.groupingBy(
                        r -> StringUtils.hasText(r.getStudentClass()) ? r.getStudentClass().trim() : NO_CLASS_LABEL,
                        TreeMap::new,
                        Collectors.toList()));

        List<ClassGradeGroupDTO> groups = new ArrayList<>();
        for (Map.Entry<String, List<GraduationResultResponseDTO>> entry : byClass.entrySet()) {
            if (StringUtils.hasText(className) && !entry.getKey().equalsIgnoreCase(className.trim())) {
                continue;
            }
            List<GraduationResultResponseDTO> rows = new ArrayList<>(entry.getValue());
            rows.sort(Comparator.comparing(r -> r.getStudentCode() == null ? "" : r.getStudentCode()));

            List<BigDecimal> scores = rows.stream()
                    .map(GraduationResultResponseDTO::getFinalScore)
                    .filter(Objects::nonNull)
                    .toList();
            Double avg = scores.isEmpty() ? null
                    : scores.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0.0);

            groups.add(ClassGradeGroupDTO.builder()
                    .className(entry.getKey())
                    .totalStudents(rows.size())
                    .passedCount((int) rows.stream().filter(r -> "PASSED".equalsIgnoreCase(r.getFinalResult())).count())
                    .failedCount((int) rows.stream().filter(r -> "FAILED".equalsIgnoreCase(r.getFinalResult())).count())
                    .averageScore(avg != null ? Math.round(avg * 100.0) / 100.0 : null)
                    .rows(rows)
                    .build());
        }

        return ClassGradeReportResponseDTO.builder()
                .roundId(round.getId())
                .roundCode(round.getRoundCode())
                .roundName(round.getName())
                .roundStatus(round.getStatus())
                .totalStudents(groups.stream().mapToInt(ClassGradeGroupDTO::getTotalStudents).sum())
                .classes(groups)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportClassGrades(Long roundId, String className) {
        ClassGradeReportResponseDTO report = buildGradeReport(roundId, className);
        if (report.getClasses().isEmpty()) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Chưa có điểm đồ án đã công bố để xuất" + (StringUtils.hasText(className) ? " cho lớp " + className : ""));
        }
        try {
            return excelExporter.exportClassGrades(report);
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    public String getRoundCode(Long roundId) {
        return getRound(roundId).getRoundCode();
    }

    private ProjectRound getRound(Long roundId) {
        return projectRoundRepository.findById(roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đợt đồ án ID: " + roundId));
    }

    @Transactional
    public void clearStudentDebt(Long roundId, Long studentId) {
        updateStudentDebt(roundId, studentId, 0);
    }

    @Transactional
    public void updateStudentDebt(Long roundId, Long studentId, Integer newDebtCredits) {
        int debt = newDebtCredits != null ? Math.max(0, newDebtCredits) : 0;
        AcademicRecord record = academicRecordRepository.findByStudentIdAndProjectRoundId(studentId, roundId)
                .orElse(null);
        if (record != null) {
            record.setDebtCredits(debt);
            if (debt == 0) {
                record.setMissingPrerequisiteCount(0);
                record.setNote("Giáo vụ xác nhận đã hoàn thành trả nợ tín chỉ trước khi bảo vệ đồ án");
            }
            academicRecordRepository.save(record);
        }

        if (studentRepository != null) {
            studentRepository.findById(studentId).ifPresent(st -> {
                st.setDebtCredits(debt);
                studentRepository.save(st);
            });
        }
    }
}
