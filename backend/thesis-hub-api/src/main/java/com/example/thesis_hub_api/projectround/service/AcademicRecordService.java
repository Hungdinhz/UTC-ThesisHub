package com.example.thesis_hub_api.projectround.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.organization.entity.Major;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.MajorRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.dto.request.AcademicRecordImportCommitRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportPreviewResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportResultResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportRowDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordResponseDTO;
import com.example.thesis_hub_api.projectround.entity.AcademicRecord;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.repository.AcademicRecordRepository;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.projectround.util.AcademicRecordExcelParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AcademicRecordService {

    private final AcademicRecordRepository academicRecordRepository;
    private final ProjectRoundRepository projectRoundRepository;
    private final StudentRepository studentRepository;
    private final StudentProjectRoundRepository studentProjectRoundRepository;
    private final MajorRepository majorRepository;
    private final AcademicRecordExcelParser academicRecordExcelParser;

    private ProjectRound getAndValidateActiveRound(Long roundId) {
        ProjectRound round = projectRoundRepository.findById(roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        if ("CLOSED".equalsIgnoreCase(round.getStatus()) || "ARCHIVED".equalsIgnoreCase(round.getStatus())) {
            throw new AppException(ErrorCode.PROJECT_ROUND_CLOSED);
        }
        return round;
    }

    /**
     * Xem trước (Preview) kết quả phân tích file Excel điểm học vụ xét điều kiện
     */
    @Transactional(readOnly = true)
    public AcademicRecordImportPreviewResponseDTO previewImport(Long roundId, MultipartFile file) {
        ProjectRound round = getAndValidateActiveRound(roundId);

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.toLowerCase().endsWith(".xlsx") && !fileName.toLowerCase().endsWith(".xls"))) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        List<AcademicRecordImportRowDTO> parsedRows;
        try {
            parsedRows = academicRecordExcelParser.parseExcel(file);
        } catch (Exception e) {
            log.error("Lỗi khi đọc file Excel học vụ: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.EXCEL_PARSING_ERROR);
        }

        int validCount = 0;
        int errorCount = 0;

        for (AcademicRecordImportRowDTO row : parsedRows) {
            List<String> errors = new ArrayList<>(row.getErrors());

            if (StringUtils.hasText(row.getStudentCode())) {
                Optional<Student> studentOpt = studentRepository.findByStudentCode(row.getStudentCode());
                if (studentOpt.isEmpty()) {
                    errors.add("Không tìm thấy sinh viên có mã: " + row.getStudentCode());
                } else {
                    Student student = studentOpt.get();
                    if (!studentProjectRoundRepository.existsByStudentIdAndProjectRoundId(student.getId(), round.getId())) {
                        errors.add("Sinh viên " + row.getStudentCode() + " chưa có trong đợt đồ án này");
                    }
                }
            }

            row.setErrors(errors);
            row.setValid(errors.isEmpty());

            if (row.isValid()) {
                validCount++;
            } else {
                errorCount++;
            }
        }

        return AcademicRecordImportPreviewResponseDTO.builder()
                .roundId(round.getId())
                .roundCode(round.getRoundCode())
                .roundName(round.getName())
                .totalRows(parsedRows.size())
                .validRows(validCount)
                .errorRows(errorCount)
                .rows(parsedRows)
                .build();
    }

    /**
     * Xác nhận commit lưu dữ liệu học vụ vào CSDL (Bảng academic_records)
     */
    @Transactional
    public AcademicRecordImportResultResponseDTO commitImport(Long roundId, AcademicRecordImportCommitRequestDTO requestDTO) {
        ProjectRound round = getAndValidateActiveRound(roundId);

        int totalProcessed = 0;
        int recordsCreated = 0;
        int recordsUpdated = 0;
        int skipped = 0;
        List<String> messages = new ArrayList<>();

        for (AcademicRecordImportRowDTO row : requestDTO.getRows()) {
            totalProcessed++;

            boolean hasNoErrors = row.getErrors() == null || row.getErrors().isEmpty();
            boolean hasStudentCode = StringUtils.hasText(row.getStudentCode());
            if (!row.isValid() && !(hasNoErrors && hasStudentCode)) {
                skipped++;
                continue;
            }

            Optional<Student> studentOpt = studentRepository.findByStudentCode(row.getStudentCode().trim());
            if (studentOpt.isEmpty()) {
                skipped++;
                continue;
            }

            Student student = studentOpt.get();
            Optional<AcademicRecord> recordOpt = academicRecordRepository
                    .findByStudentIdAndProjectRoundId(student.getId(), round.getId());

            AcademicRecord record;
            if (recordOpt.isPresent()) {
                record = recordOpt.get();
                record.setCompletedCredits(row.getCompletedCredits());
                record.setGpa(row.getGpa());
                record.setTuitionDebt(row.getTuitionDebt());
                record.setUnderDisciplinaryAction(row.getUnderDisciplinaryAction());
                record.setMissingPrerequisiteCount(row.getMissingPrerequisiteCount());
                record.setNote(row.getNote());
                record.setImportedAt(Instant.now());
                recordsUpdated++;
            } else {
                record = AcademicRecord.builder()
                        .student(student)
                        .projectRound(round)
                        .completedCredits(row.getCompletedCredits())
                        .gpa(row.getGpa())
                        .tuitionDebt(row.getTuitionDebt())
                        .underDisciplinaryAction(row.getUnderDisciplinaryAction())
                        .missingPrerequisiteCount(row.getMissingPrerequisiteCount())
                        .note(row.getNote())
                        .importedAt(Instant.now())
                        .build();
                recordsCreated++;
            }

            academicRecordRepository.save(record);
        }

        messages.add(String.format("Lưu trữ thành công %d kết quả học vụ (Thêm mới: %d, Cập nhật: %d, Bỏ qua: %d).",
                totalProcessed, recordsCreated, recordsUpdated, skipped));

        return AcademicRecordImportResultResponseDTO.builder()
                .totalProcessed(totalProcessed)
                .recordsCreated(recordsCreated)
                .recordsUpdated(recordsUpdated)
                .skipped(skipped)
                .messages(messages)
                .build();
    }

    /**
     * Tra cứu danh sách dữ liệu học vụ trong đợt đồ án có phân trang và bộ lọc
     */
    @Transactional(readOnly = true)
    public PageResponse<AcademicRecordResponseDTO> getAcademicRecords(
            Long roundId,
            Boolean tuitionDebt,
            Boolean underDisciplinaryAction,
            String search,
            Pageable pageable) {

        String normalizedSearch = StringUtils.hasText(search) ? "%" + search.trim().toLowerCase() + "%" : null;

        Page<AcademicRecord> recordPage = academicRecordRepository.searchAcademicRecords(
                roundId,
                tuitionDebt,
                underDisciplinaryAction,
                normalizedSearch,
                pageable);

        Map<Long, Major> majorMap = majorRepository.findAll().stream()
                .collect(Collectors.toMap(Major::getId, m -> m, (a, b) -> a));

        List<AcademicRecordResponseDTO> mappedContent = recordPage.getContent().stream()
                .map(r -> toResponseDTO(r, majorMap))
                .toList();

        return PageResponse.from(recordPage, mappedContent);
    }

    /**
     * CONTRACT 4: API Chi tiết Kết quả học vụ của một sinh viên trong đợt đồ án.
     * Cung cấp trực tiếp cho module Eligibility của Khoa (Khuất Đăng Khoa) thay thế mock service.
     */
    @Transactional(readOnly = true)
    public AcademicRecordResponseDTO getStudentAcademicRecord(Long roundId, Long studentId) {
        AcademicRecord record = academicRecordRepository.findByStudentIdAndProjectRoundId(studentId, roundId)
                .or(() -> academicRecordRepository.findFirstByStudentIdOrderByImportedAtDesc(studentId))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        Map<Long, Major> majorMap = majorRepository.findAll().stream()
                .collect(Collectors.toMap(Major::getId, m -> m, (a, b) -> a));

        return toResponseDTO(record, majorMap);
    }

    /**
     * Tra cứu học vụ theo studentId gần nhất
     */
    @Transactional(readOnly = true)
    public AcademicRecordResponseDTO getRecordByStudentId(Long studentId) {
        AcademicRecord record = academicRecordRepository.findFirstByStudentIdOrderByImportedAtDesc(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        Map<Long, Major> majorMap = majorRepository.findAll().stream()
                .collect(Collectors.toMap(Major::getId, m -> m, (a, b) -> a));

        return toResponseDTO(record, majorMap);
    }

    /**
     * Sinh file Excel mẫu import học vụ chuẩn UTC
     */
    public byte[] generateTemplate() {
        try {
            return academicRecordExcelParser.generateTemplate();
        } catch (IOException e) {
            log.error("Lỗi khi sinh template học vụ Excel: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    private AcademicRecordResponseDTO toResponseDTO(AcademicRecord r, Map<Long, Major> majorMap) {
        Student s = r.getStudent();
        User u = s != null ? s.getUser() : null;
        ProjectRound round = r.getProjectRound();

        Major major = (s != null && s.getMajorId() != null)
                ? majorMap.get(s.getMajorId())
                : null;

        return AcademicRecordResponseDTO.builder()
                .id(r.getId())
                .studentId(s != null ? s.getId() : null)
                .studentCode(s != null ? s.getStudentCode() : null)
                .fullName(u != null ? u.getFullName() : null)
                .className(s != null ? s.getClassName() : null)
                .majorName(major != null ? major.getName() : null)
                .projectRoundId(round != null ? round.getId() : null)
                .roundCode(round != null ? round.getRoundCode() : null)
                .completedCredits(r.getCompletedCredits())
                .gpa(r.getGpa())
                .tuitionDebt(r.getTuitionDebt())
                .underDisciplinaryAction(r.getUnderDisciplinaryAction())
                .missingPrerequisiteCount(r.getMissingPrerequisiteCount())
                .note(r.getNote())
                .importedAt(r.getImportedAt())
                .build();
    }
}
