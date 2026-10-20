package com.example.thesis_hub_api.projectround.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.Major;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.MajorRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.organization.repository.TrainingProgramRepository;
import com.example.thesis_hub_api.projectround.dto.request.StudentImportCommitRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.UpdateStudentRoundStatusRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentImportPreviewResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentImportResultResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentImportRowDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentProjectRoundResponseDTO;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.projectround.util.StudentExcelParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentProjectRoundService {

    private final ProjectRoundRepository projectRoundRepository;
    private final StudentProjectRoundRepository studentProjectRoundRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MajorRepository majorRepository;
    private final TrainingProgramRepository trainingProgramRepository;
    private final StudentExcelParser studentExcelParser;
    private final PasswordEncoder passwordEncoder;

    /**
     * Xem trước kết quả phân tích file Excel import sinh viên vào đợt đồ án
     */
    @Transactional(readOnly = true)
    public StudentImportPreviewResponseDTO previewImportStudents(Long roundId, MultipartFile file) {
        ProjectRound round = projectRoundRepository.findById(roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.toLowerCase().endsWith(".xlsx") && !fileName.toLowerCase().endsWith(".xls"))) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        List<StudentImportRowDTO> parsedRows;
        try {
            parsedRows = studentExcelParser.parseExcel(file);
        } catch (Exception e) {
            log.error("Lỗi khi đọc file Excel: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.EXCEL_PARSING_ERROR);
        }

        Map<String, Major> majorMap = majorRepository.findAll().stream()
                .filter(m -> m.getCode() != null)
                .collect(Collectors.toMap(m -> m.getCode().toUpperCase().trim(), m -> m, (a, b) -> a));

        int validCount = 0;
        int errorCount = 0;

        for (StudentImportRowDTO row : parsedRows) {
            List<String> errors = new ArrayList<>(row.getErrors());

            // Kiểm tra mã ngành có hợp lệ trong CSDL không
            if (StringUtils.hasText(row.getMajorCode())) {
                String normalizedMajor = studentExcelParser.normalizeMajorCode(row.getMajorCode()); if (!StringUtils.hasText(normalizedMajor)) { normalizedMajor = row.getMajorCode().trim().toUpperCase(); }
                row.setMajorCode(normalizedMajor);
                if (!majorMap.containsKey(normalizedMajor) && !majorMap.isEmpty()) {
                    errors.add("Không tìm thấy mã ngành '" + row.getMajorCode() + "' trong hệ thống (Hỗ trợ: " + String.join(", ", majorMap.keySet()) + ")");
                }
            }

            // Kiểm tra xem sinh viên đã tham gia đợt này chưa
            if (StringUtils.hasText(row.getStudentCode())) {
                studentRepository.findByStudentCode(row.getStudentCode()).ifPresent(student -> {
                    if (studentProjectRoundRepository.existsByStudentIdAndProjectRoundId(student.getId(), round.getId())) {
                        errors.add("Sinh viên đã có trong đợt đồ án này");
                    }
                });
            }

            row.setErrors(errors);
            row.setValid(errors.isEmpty());

            if (row.isValid()) {
                validCount++;
            } else {
                errorCount++;
            }
        }

        return StudentImportPreviewResponseDTO.builder()
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
     * Xác nhận commit import sinh viên vào đợt đồ án:
     * - Tự động tạo User (ROLE_STUDENT) nếu chưa có tài khoản.
     * - Tự động tạo hồ sơ Student nếu chưa có.
     * - Ghi danh vào bảng student_project_rounds với trạng thái ELIGIBLE.
     */
    @Transactional
    public StudentImportResultResponseDTO commitImportStudents(Long roundId, StudentImportCommitRequestDTO requestDTO) {
        ProjectRound round = projectRoundRepository.findById(roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        Role studentRole = roleRepository.findByName("ROLE_STUDENT")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        String defaultEncodedPassword = passwordEncoder.encode("Password@123");

        Map<String, Major> majorMap = majorRepository.findAll().stream()
                .filter(m -> m.getCode() != null)
                .collect(Collectors.toMap(m -> m.getCode().toUpperCase().trim(), m -> m, (a, b) -> a));

        int totalProcessed = 0;
        int newUsersCreated = 0;
        int newStudentsCreated = 0;
        int enrolledInRound = 0;
        int skipped = 0;
        List<String> messages = new ArrayList<>();

        for (StudentImportRowDTO row : requestDTO.getRows()) {
            totalProcessed++;

            boolean hasNoErrors = row.getErrors() == null || row.getErrors().isEmpty();
            boolean hasStudentCode = StringUtils.hasText(row.getStudentCode());
            if (!row.isValid() && !(hasNoErrors && hasStudentCode)) {
                skipped++;
                continue;
            }

            String studentCode = row.getStudentCode().trim();
            String fullName = StringUtils.hasText(row.getFullName())
                    ? row.getFullName().trim()
                    : ((row.getLastName() != null ? row.getLastName() : "") + " " + (row.getFirstName() != null ? row.getFirstName() : "")).trim();
            if (fullName.isEmpty()) {
                fullName = "Sinh viên " + studentCode;
            }
            String email = StringUtils.hasText(row.getEmail())
                    ? row.getEmail().trim()
                    : studentCode.toLowerCase() + "@lms.utc.edu.vn";

            // 1. Tìm hoặc tạo User
            User user = userRepository.findByUsername(studentCode)
                    .or(() -> userRepository.findByEmail(email))
                    .orElse(null);

            if (user == null) {
                user = User.builder()
                        .username(studentCode)
                        .fullName(fullName)
                        .email(email)
                        .phone(row.getPhone())
                        .password(defaultEncodedPassword)
                        .role(studentRole)
                        .isActive(true)
                        .build();
                user = userRepository.save(user);
                newUsersCreated++;
            } else {
                if (StringUtils.hasText(fullName)) {
                    user.setFullName(fullName);
                }
                if (StringUtils.hasText(row.getPhone())) {
                    user.setPhone(row.getPhone());
                }
                user = userRepository.save(user);
            }

            // 2. Tìm hoặc tạo Student
            Student student = studentRepository.findByStudentCode(studentCode).orElse(null);
            String normalizedMajorCode = studentExcelParser.normalizeMajorCode(row.getMajorCode());
            Major major = majorMap.get(normalizedMajorCode);
            if (major == null && !majorMap.isEmpty()) {
                major = majorMap.getOrDefault("CNTT", majorMap.values().iterator().next());
            }

            Long roundTrainingProgramId = round.getTrainingProgram() != null ? round.getTrainingProgram().getId() : null;

            if (student == null) {
                student = Student.builder()
                        .user(user)
                        .studentCode(studentCode)
                        .className(row.getClassName())
                        .majorId(major != null ? major.getId() : null)
                        .trainingProgramId(roundTrainingProgramId)
                        .debtCredits(0)
                        .build();
                student = studentRepository.save(student);
                newStudentsCreated++;
            } else {
                if (StringUtils.hasText(row.getClassName())) {
                    student.setClassName(row.getClassName());
                }
                if (major != null) {
                    student.setMajorId(major.getId());
                }
                if (student.getTrainingProgramId() == null) {
                    student.setTrainingProgramId(roundTrainingProgramId);
                }
                student = studentRepository.save(student);
            }

            // 3. Ghi danh vào StudentProjectRound
            Optional<StudentProjectRound> existingSpr = studentProjectRoundRepository
                    .findByStudentIdAndProjectRoundId(student.getId(), round.getId());

            if (existingSpr.isEmpty()) {
                StudentProjectRound spr = StudentProjectRound.builder()
                        .student(student)
                        .projectRound(round)
                        .status("ELIGIBLE")
                        .note("Import từ file Excel")
                        .build();
                studentProjectRoundRepository.save(spr);
                enrolledInRound++;
            } else {
                // Đã có trong đợt, bỏ qua không ghi đè
                skipped++;
            }
        }

        messages.add(String.format("Xử lý thành công %d sinh viên (Tạo mới %d tài khoản, %d hồ sơ sinh viên, ghi danh %d vào đợt đồ án).",
                totalProcessed, newUsersCreated, newStudentsCreated, enrolledInRound));

        return StudentImportResultResponseDTO.builder()
                .totalProcessed(totalProcessed)
                .newUsersCreated(newUsersCreated)
                .newStudentsCreated(newStudentsCreated)
                .enrolledInRound(enrolledInRound)
                .skipped(skipped)
                .messages(messages)
                .build();
    }

    /**
     * CONTRACT 3: Tra cứu danh sách sinh viên trong đợt đồ án có phân trang và lọc theo ngành, trạng thái, từ khóa.
     * Cung cấp cho thành viên Nguyễn Đình Công (phân công GVHD) & Ngô Minh Quyết (hội đồng bảo vệ).
     */
    @Transactional(readOnly = true)
    public PageResponse<StudentProjectRoundResponseDTO> getStudentsInRound(
            Long roundId,
            Long majorId,
            String status,
            String search,
            Pageable pageable) {

        if (!projectRoundRepository.existsById(roundId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }

        String normalizedSearch = StringUtils.hasText(search) ? "%" + search.trim().toLowerCase() + "%" : null;
        String normalizedStatus = StringUtils.hasText(status) ? status.trim().toUpperCase() : null;

        Page<StudentProjectRound> sprPage = studentProjectRoundRepository.searchStudentsInRound(
                roundId,
                majorId,
                normalizedStatus,
                normalizedSearch,
                pageable);

        Map<Long, Major> majorMap = majorRepository.findAll().stream()
                .collect(Collectors.toMap(Major::getId, m -> m, (a, b) -> a));

        Map<Long, TrainingProgram> tpMap = trainingProgramRepository.findAll().stream()
                .collect(Collectors.toMap(TrainingProgram::getId, tp -> tp, (a, b) -> a));

        List<StudentProjectRoundResponseDTO> mappedContent = sprPage.getContent().stream()
                .map(spr -> toStudentProjectRoundResponseDTO(spr, majorMap, tpMap))
                .toList();

        return PageResponse.from(sprPage, mappedContent);
    }

    /**
     * Lấy thông tin chi tiết một sinh viên trong đợt đồ án
     */
    @Transactional(readOnly = true)
    public StudentProjectRoundResponseDTO getStudentRoundDetail(Long roundId, Long studentId) {
        StudentProjectRound spr = studentProjectRoundRepository.findByStudentIdAndProjectRoundId(studentId, roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        Map<Long, Major> majorMap = majorRepository.findAll().stream()
                .collect(Collectors.toMap(Major::getId, m -> m, (a, b) -> a));

        Map<Long, TrainingProgram> tpMap = trainingProgramRepository.findAll().stream()
                .collect(Collectors.toMap(TrainingProgram::getId, tp -> tp, (a, b) -> a));

        return toStudentProjectRoundResponseDTO(spr, majorMap, tpMap);
    }

    /**
     * Cập nhật trạng thái và ghi chú của sinh viên trong đợt đồ án
     */
    @Transactional
    public StudentProjectRoundResponseDTO updateStudentRoundStatus(
            Long roundId,
            Long studentId,
            UpdateStudentRoundStatusRequestDTO dto) {

        StudentProjectRound spr = studentProjectRoundRepository.findByStudentIdAndProjectRoundId(studentId, roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        spr.setStatus(dto.getStatus().trim().toUpperCase());
        if (dto.getNote() != null) {
            spr.setNote(dto.getNote());
        }

        StudentProjectRound updated = studentProjectRoundRepository.save(spr);

        Map<Long, Major> majorMap = majorRepository.findAll().stream()
                .collect(Collectors.toMap(Major::getId, m -> m, (a, b) -> a));

        Map<Long, TrainingProgram> tpMap = trainingProgramRepository.findAll().stream()
                .collect(Collectors.toMap(TrainingProgram::getId, tp -> tp, (a, b) -> a));

        return toStudentProjectRoundResponseDTO(updated, majorMap, tpMap);
    }

    /**
     * Xóa sinh viên khỏi đợt đồ án
     */
    @Transactional
    public void removeStudentFromRound(Long roundId, Long studentId) {
        StudentProjectRound spr = studentProjectRoundRepository.findByStudentIdAndProjectRoundId(studentId, roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        studentProjectRoundRepository.delete(spr);
    }

    /**
     * Tải file Excel mẫu theo chuẩn UTC (8 cột)
     */
    public byte[] generateTemplate() {
        try {
            return studentExcelParser.generateTemplate();
        } catch (IOException e) {
            log.error("Lỗi khi sinh file Excel mẫu: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    private StudentProjectRoundResponseDTO toStudentProjectRoundResponseDTO(
            StudentProjectRound spr,
            Map<Long, Major> majorMap,
            Map<Long, TrainingProgram> tpMap) {

        Student student = spr.getStudent();
        User user = student != null ? student.getUser() : null;

        Major major = (student != null && student.getMajorId() != null)
                ? majorMap.get(student.getMajorId())
                : null;

        TrainingProgram tp = (student != null && student.getTrainingProgramId() != null)
                ? tpMap.get(student.getTrainingProgramId())
                : null;

        return StudentProjectRoundResponseDTO.builder()
                .studentRoundId(spr.getId())
                .studentId(student != null ? student.getId() : null)
                .studentCode(student != null ? student.getStudentCode() : null)
                .fullName(user != null ? user.getFullName() : null)
                .email(user != null ? user.getEmail() : null)
                .phone(user != null ? user.getPhone() : null)
                .className(student != null ? student.getClassName() : null)
                .majorId(student != null ? student.getMajorId() : null)
                .majorCode(major != null ? major.getCode() : null)
                .majorName(major != null ? major.getName() : null)
                .trainingProgramId(student != null ? student.getTrainingProgramId() : null)
                .trainingProgram(tp != null ? tp.getName() : null)
                .status(spr.getStatus())
                .debtCredits(student != null ? student.getDebtCredits() : 0)
                .note(spr.getNote())
                .enrolledAt(spr.getCreatedAt())
                .build();
    }
}
