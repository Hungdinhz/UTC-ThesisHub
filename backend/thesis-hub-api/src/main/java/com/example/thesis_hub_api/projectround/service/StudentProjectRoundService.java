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
import com.example.thesis_hub_api.projectround.dto.request.CreateRoundStudentManualDTO;
import com.example.thesis_hub_api.projectround.dto.request.StudentImportCommitRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.UpdateStudentRoundStatusRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentEligibilityCheckResponseDTO;
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

    private ProjectRound getAndValidateActiveRound(Long roundId) {
        ProjectRound round = projectRoundRepository.findById(roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        if ("CLOSED".equalsIgnoreCase(round.getStatus()) || "ARCHIVED".equalsIgnoreCase(round.getStatus())) {
            throw new AppException(ErrorCode.PROJECT_ROUND_CLOSED);
        }
        return round;
    }

    /**
     * Kiểm tra tính hợp lệ khi sinh viên tham gia đợt đồ án mới:
     * - Kiểm tra trùng lặp trong đợt hiện tại.
     * - Không chấp nhận sinh viên đang trong đợt đồ án khác chưa kết thúc.
     * - Không chấp nhận sinh viên đã hoàn thành và bảo vệ đồ án ở đợt trước.
     */
    private Optional<String> validateStudentRoundEligibility(Student student, ProjectRound targetRound) {
        if (student == null || student.getId() == null) {
            return Optional.empty();
        }

        if (studentProjectRoundRepository.existsByStudentIdAndProjectRoundId(student.getId(), targetRound.getId())) {
            return Optional.of("Sinh viên (MSSV: " + student.getStudentCode() + ") đã có trong đợt đồ án này.");
        }

        List<StudentProjectRound> prevRounds = studentProjectRoundRepository.findByStudentId(student.getId());
        for (StudentProjectRound prev : prevRounds) {
            if (prev.getProjectRound() != null && !prev.getProjectRound().getId().equals(targetRound.getId())) {
                String prevStatus = prev.getStatus() != null ? prev.getStatus().toUpperCase() : "";
                String roundStatus = prev.getProjectRound().getStatus() != null ? prev.getProjectRound().getStatus().toUpperCase() : "";

                // Đã bảo vệ thành công hoặc đã tốt nghiệp đợt trước -> Không được đăng ký đợt mới
                if ("DEFENDED".equals(prevStatus) || "COMPLETED".equals(prevStatus) || "PASSED".equals(prevStatus)) {
                    return Optional.of("Sinh viên (MSSV: " + student.getStudentCode() + ") đã hoàn thành và bảo vệ đồ án ở đợt trước (" + prev.getProjectRound().getName() + "), không thuộc diện đăng ký lại.");
                }

                // Không chấp nhận sinh viên đang trong đợt đồ án khác chưa kết thúc
                // Một đợt được coi là chưa kết thúc nếu trạng thái không phải CLOSED và ARCHIVED
                // Và trạng thái sinh viên không phải đã bị loại/trượt/bảo lưu
                boolean isTerminatedInPrev = "DROPPED".equals(prevStatus) || "RESERVED".equals(prevStatus) || "FAILED".equals(prevStatus) || "CANCELLED".equals(prevStatus);
                boolean isRoundClosed = "CLOSED".equals(roundStatus) || "ARCHIVED".equals(roundStatus);

                if (!isRoundClosed && !isTerminatedInPrev) {
                    String otherRoundName = prev.getProjectRound().getName() != null ? prev.getProjectRound().getName() : prev.getProjectRound().getRoundCode();
                    return Optional.of("Sinh viên (MSSV: " + student.getStudentCode() + ") đang trong đợt đồ án khác chưa kết thúc: [" + otherRoundName + "]. Mỗi sinh viên chỉ được tham gia 1 đợt đồ án tại một thời điểm.");
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Kiểm tra tính hợp lệ và trùng lặp thời gian thực khi nhập MSSV:
     * - Trùng lặp trong đợt hiện tại
     * - Đang tham gia đợt đồ án khác chưa kết thúc
     * - Đã tốt nghiệp / bảo vệ đợt trước
     * - Trả về thông tin sinh viên có sẵn (Họ tên, lớp, ngành, email, phone) để tự động điền form
     */
    @Transactional(readOnly = true)
    public StudentEligibilityCheckResponseDTO checkStudentEligibilityForRound(Long roundId, String studentCode) {
        if (!StringUtils.hasText(studentCode)) {
            return StudentEligibilityCheckResponseDTO.builder()
                    .studentCode(studentCode)
                    .eligible(false)
                    .message("Mã sinh viên không được để trống")
                    .build();
        }

        String cleanCode = studentCode.trim();
        ProjectRound round = getAndValidateActiveRound(roundId);

        Student student = studentRepository.findByStudentCode(cleanCode).orElse(null);
        if (student == null) {
            return StudentEligibilityCheckResponseDTO.builder()
                    .studentCode(cleanCode)
                    .eligible(true)
                    .existsInSystem(false)
                    .message("Mã sinh viên hợp lệ (sinh viên mới, chưa có hồ sơ trong hệ thống)")
                    .build();
        }

        Optional<String> eligibilityError = validateStudentRoundEligibility(student, round);
        User user = student.getUser();
        String fullName = (user != null && StringUtils.hasText(user.getFullName())) ? user.getFullName() : "";
        String email = (user != null && StringUtils.hasText(user.getEmail())) ? user.getEmail() : (cleanCode.toLowerCase() + "@lms.utc.edu.vn");
        String phone = (user != null && StringUtils.hasText(user.getPhone())) ? user.getPhone() : "";
        String majorName = "";
        if (student.getMajorId() != null) {
            majorName = majorRepository.findById(student.getMajorId()).map(Major::getName).orElse("");
        }

        if (eligibilityError.isPresent()) {
            return StudentEligibilityCheckResponseDTO.builder()
                    .studentCode(cleanCode)
                    .eligible(false)
                    .existsInSystem(true)
                    .message(eligibilityError.get())
                    .studentId(student.getId())
                    .fullName(fullName)
                    .className(student.getClassName())
                    .majorId(student.getMajorId())
                    .majorName(majorName)
                    .email(email)
                    .phone(phone)
                    .build();
        }

        return StudentEligibilityCheckResponseDTO.builder()
                .studentCode(cleanCode)
                .eligible(true)
                .existsInSystem(true)
                .message("Sinh viên hợp lệ và đủ điều kiện tham gia đợt")
                .studentId(student.getId())
                .fullName(fullName)
                .className(student.getClassName())
                .majorId(student.getMajorId())
                .majorName(majorName)
                .email(email)
                .phone(phone)
                .build();
    }

    /**
     * Xem trước kết quả phân tích file Excel import sinh viên vào đợt đồ án
     */
    @Transactional(readOnly = true)
    public StudentImportPreviewResponseDTO previewImportStudents(Long roundId, MultipartFile file) {
        ProjectRound round = getAndValidateActiveRound(roundId);

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

            // Kiểm tra xem sinh viên đã tham gia đợt này chưa & điều kiện tham gia đợt mới (trượt ở trước mới được đăng ký)
            if (StringUtils.hasText(row.getStudentCode())) {
                studentRepository.findByStudentCode(row.getStudentCode().trim()).ifPresent(student -> {
                    validateStudentRoundEligibility(student, round).ifPresent(errors::add);
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

        parsedRows.sort((a, b) -> {
            String ca = a.getStudentCode() != null ? a.getStudentCode().trim() : "";
            String cb = b.getStudentCode() != null ? b.getStudentCode().trim() : "";
            return ca.compareTo(cb);
        });

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
        ProjectRound round = getAndValidateActiveRound(roundId);

        if (requestDTO == null || requestDTO.getRows() == null || requestDTO.getRows().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Danh sách sinh viên import không được để trống");
        }

        Role studentRole = roleRepository.findByName("ROLE_STUDENT")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        Map<String, Major> majorMap = majorRepository.findAll().stream()
                .filter(m -> m.getCode() != null)
                .collect(Collectors.toMap(m -> m.getCode().toUpperCase().trim(), m -> m, (a, b) -> a));

        Long roundTrainingProgramId = null;
        try {
            if (round.getTrainingProgram() != null) {
                roundTrainingProgramId = round.getTrainingProgram().getId();
            }
        } catch (Exception e) {
            log.warn("Không thể truy xuất trainingProgram của round {}: {}", roundId, e.getMessage());
        }

        int totalProcessed = 0;
        int newUsersCreated = 0;
        int newStudentsCreated = 0;
        int enrolledInRound = 0;
        int skipped = 0;
        List<String> messages = new ArrayList<>();
        Set<Long> processedStudentIdsInBatch = new HashSet<>();

        for (StudentImportRowDTO row : requestDTO.getRows()) {
            totalProcessed++;

            boolean hasNoErrors = row.getErrors() == null || row.getErrors().isEmpty();
            boolean hasStudentCode = StringUtils.hasText(row.getStudentCode());
            if (!row.isValid() && !(hasNoErrors && hasStudentCode)) {
                skipped++;
                continue;
            }

            try {
                String studentCode = row.getStudentCode().trim();
                String fullName = StringUtils.hasText(row.getFullName())
                        ? row.getFullName().trim()
                        : ((row.getLastName() != null ? row.getLastName() : "") + " " + (row.getFirstName() != null ? row.getFirstName() : "")).trim();
                if (fullName.isEmpty()) {
                    fullName = "Sinh viên " + studentCode;
                }
                String email = StringUtils.hasText(row.getEmail())
                        ? row.getEmail().trim().toLowerCase()
                        : studentCode.toLowerCase() + "@lms.utc.edu.vn";

                // 1. Tìm hoặc tạo User
                // Ưu tiên: nếu sinh viên đã có hồ sơ thì lấy User của sinh viên đó
                Student existingStudent = studentRepository.findByStudentCode(studentCode).orElse(null);
                User user = null;
                if (existingStudent != null) {
                    user = existingStudent.getUser();
                }

                if (user == null) {
                    user = userRepository.findByUsername(studentCode).orElse(null);
                }

                if (user == null) {
                    // Kiểm tra email xem có bị xung đột với user khác trong hệ thống không
                    String targetEmail = email;
                    Optional<User> userWithEmail = userRepository.findByEmail(targetEmail);
                    if (userWithEmail.isPresent() && !studentCode.equalsIgnoreCase(userWithEmail.get().getUsername())) {
                        targetEmail = studentCode.toLowerCase() + "@lms.utc.edu.vn";
                        if (userRepository.findByEmail(targetEmail).isPresent()) {
                            targetEmail = studentCode.toLowerCase() + "." + System.currentTimeMillis() + "@lms.utc.edu.vn";
                        }
                    }

                    user = User.builder()
                            .username(studentCode)
                            .fullName(fullName)
                            .email(targetEmail)
                            .phone(row.getPhone())
                            .password(passwordEncoder.encode("Password@123"))
                            .role(studentRole)
                            .isActive(true)
                            .build();
                    user.setIsActive(shouldActivateStudentAccount(existingStudent, round));
            user = userRepository.save(user);
                    newUsersCreated++;
                } else {
                    if (StringUtils.hasText(fullName)) {
                        user.setFullName(fullName);
                    }
                    if (StringUtils.hasText(row.getPhone())) {
                        user.setPhone(row.getPhone());
                    }
                    if (StringUtils.hasText(email) && !email.equalsIgnoreCase(user.getEmail())) {
                        Optional<User> otherUser = userRepository.findByEmail(email);
                        if (otherUser.isEmpty() || otherUser.get().getId().equals(user.getId())) {
                            user.setEmail(email);
                        }
                    }
                    user.setIsActive(shouldActivateStudentAccount(existingStudent, round));
            user = userRepository.save(user);
                }

                // 2. Tìm hoặc tạo Student
                Student student = existingStudent;
                if (student == null) {
                    student = studentRepository.findByUserId(user.getId()).orElse(null);
                }

                String normalizedMajorCode = studentExcelParser.normalizeMajorCode(row.getMajorCode());
                Major major = majorMap.get(normalizedMajorCode);
                if (major == null && !majorMap.isEmpty()) {
                    major = majorMap.getOrDefault("CNTT", majorMap.values().iterator().next());
                }

                if (student == null) {
                    student = Student.builder()
                            .user(user)
                            .studentCode(studentCode)
                            .className(row.getClassName())
                            .majorId(major != null ? major.getId() : null)
                            .trainingProgramId(roundTrainingProgramId)
                            .debtCredits(0)
                            .gpa(row.getGpa())
                            .build();
                    student = studentRepository.save(student);
                    newStudentsCreated++;
                } else {
                    if (student.getUser() == null || !student.getUser().getId().equals(user.getId())) {
                        student.setUser(user);
                    }
                    if (StringUtils.hasText(row.getClassName())) {
                        student.setClassName(row.getClassName());
                    }
                    if (major != null) {
                        student.setMajorId(major.getId());
                    }
                    if (student.getTrainingProgramId() == null && roundTrainingProgramId != null) {
                        student.setTrainingProgramId(roundTrainingProgramId);
                    }
                    if (row.getGpa() != null) {
                        student.setGpa(row.getGpa());
                    }
                    student = studentRepository.save(student);
                }

                // 3. Ghi danh vào StudentProjectRound nếu đủ điều kiện
                Optional<String> eligibilityErr = validateStudentRoundEligibility(student, round);
                if (eligibilityErr.isPresent()) {
                    skipped++;
                    continue;
                }

                if (processedStudentIdsInBatch.contains(student.getId())) {
                    skipped++;
                    continue;
                }
                processedStudentIdsInBatch.add(student.getId());

                Optional<StudentProjectRound> existingSpr = studentProjectRoundRepository
                        .findByStudentIdAndProjectRoundId(student.getId(), round.getId());

                if (existingSpr.isEmpty()) {
                    StudentProjectRound spr = StudentProjectRound.builder()
                            .student(student)
                            .projectRound(round)
                            .status("ELIGIBLE")
                            .gpa(row.getGpa())
                            .note("Import từ file Excel")
                            .build();
                    studentProjectRoundRepository.save(spr);
                    enrolledInRound++;
                } else {
                    if (row.getGpa() != null) {
                        existingSpr.get().setGpa(row.getGpa());
                        studentProjectRoundRepository.save(existingSpr.get());
                    }
                    skipped++;
                }
            } catch (Exception rowEx) {
                log.error("Lỗi khi import sinh viên MSSV {}: {}", row.getStudentCode(), rowEx.getMessage(), rowEx);
                skipped++;
                messages.add("Bỏ qua sinh viên " + (row.getStudentCode() != null ? row.getStudentCode() : ("dòng " + totalProcessed)) + ": " + rowEx.getMessage());
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

    @Transactional
    public StudentProjectRoundResponseDTO addStudentManually(Long roundId, CreateRoundStudentManualDTO dto) {
        ProjectRound round = getAndValidateActiveRound(roundId);

        String studentCode = dto.getStudentCode().trim();
        String fullName = dto.getFullName().trim();
        String email = StringUtils.hasText(dto.getEmail())
                ? dto.getEmail().trim()
                : studentCode.toLowerCase() + "@lms.utc.edu.vn";

        // Kiểm tra trùng lặp và tính hợp lệ trước khi thao tác CSDL nếu sinh viên đã tồn tại
        Student existingCheckStudent = studentRepository.findByStudentCode(studentCode).orElse(null);
        if (existingCheckStudent != null) {
            Optional<String> eligibilityError = validateStudentRoundEligibility(existingCheckStudent, round);
            if (eligibilityError.isPresent()) {
                throw new AppException(ErrorCode.VALIDATION_FAILED, eligibilityError.get());
            }
        }

        Role studentRole = roleRepository.findByName("ROLE_STUDENT")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        // 1. User: username = studentCode
        User user = null;
        if (existingCheckStudent != null) {
            user = existingCheckStudent.getUser();
        }
        if (user == null) {
            user = userRepository.findByUsername(studentCode).orElse(null);
        }

        if (user == null) {
            String targetEmail = email;
            Optional<User> userWithEmail = userRepository.findByEmail(targetEmail);
            if (userWithEmail.isPresent() && !studentCode.equalsIgnoreCase(userWithEmail.get().getUsername())) {
                targetEmail = studentCode.toLowerCase() + "@lms.utc.edu.vn";
                if (userRepository.findByEmail(targetEmail).isPresent()) {
                    targetEmail = studentCode.toLowerCase() + "." + System.currentTimeMillis() + "@lms.utc.edu.vn";
                }
            }

            user = User.builder()
                    .username(studentCode)
                    .fullName(fullName)
                    .email(targetEmail)
                    .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                    .password(passwordEncoder.encode("Password@123"))
                    .role(studentRole)
                    .isActive(true)
                    .build();
            user.setIsActive(shouldActivateStudentAccount(existingCheckStudent, round));
            user = userRepository.save(user);
        } else {
            user.setFullName(fullName);
            if (StringUtils.hasText(dto.getPhone())) {
                user.setPhone(dto.getPhone().trim());
            }
            if (StringUtils.hasText(email) && !email.equalsIgnoreCase(user.getEmail())) {
                Optional<User> otherUser = userRepository.findByEmail(email);
                if (otherUser.isEmpty() || otherUser.get().getId().equals(user.getId())) {
                    user.setEmail(email);
                }
            }
            user.setPassword(passwordEncoder.encode("Password@123"));
            user.setIsActive(shouldActivateStudentAccount(existingCheckStudent, round));
            user = userRepository.save(user);
        }

        // 2. Student
        Long roundTrainingProgramId = null;
        try {
            if (round.getTrainingProgram() != null) {
                roundTrainingProgramId = round.getTrainingProgram().getId();
            }
        } catch (Exception ignored) {
        }

        Double manualGpa = dto.getGpa() != null ? dto.getGpa() : 3.20;
        Student student = existingCheckStudent;
        if (student == null) {
            student = studentRepository.findByUserId(user.getId()).orElse(null);
        }

        if (student == null) {
            student = Student.builder()
                    .user(user)
                    .studentCode(studentCode)
                    .className(dto.getClassName() != null ? dto.getClassName().trim() : null)
                    .majorId(dto.getMajorId())
                    .trainingProgramId(roundTrainingProgramId)
                    .debtCredits(0)
                    .gpa(manualGpa)
                    .build();
            student = studentRepository.save(student);
        } else {
            if (student.getUser() == null || !student.getUser().getId().equals(user.getId())) {
                student.setUser(user);
            }
            if (dto.getClassName() != null) {
                student.setClassName(dto.getClassName().trim());
            }
            if (dto.getMajorId() != null) {
                student.setMajorId(dto.getMajorId());
            }
            if (student.getTrainingProgramId() == null && roundTrainingProgramId != null) {
                student.setTrainingProgramId(roundTrainingProgramId);
            }
            student.setGpa(manualGpa);
            student = studentRepository.save(student);
        }

        // Kiểm tra điều kiện tham gia đợt (chỉ sinh viên chưa đạt/trượt ở đợt trước mới được đăng ký đợt sau)
        Optional<String> eligibilityError = validateStudentRoundEligibility(student, round);
        if (eligibilityError.isPresent()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, eligibilityError.get());
        }

        // 3. StudentProjectRound
        StudentProjectRound spr = studentProjectRoundRepository
                .findByStudentIdAndProjectRoundId(student.getId(), roundId)
                .orElse(null);

        String initialStatus = StringUtils.hasText(dto.getStatus()) ? dto.getStatus().trim().toUpperCase() : "ELIGIBLE";

        if (spr == null) {
            spr = StudentProjectRound.builder()
                    .student(student)
                    .projectRound(round)
                    .status(initialStatus)
                    .gpa(manualGpa)
                    .note(dto.getNote() != null ? dto.getNote().trim() : "Thêm thủ công")
                    .build();
        } else {
            spr.setStatus(initialStatus);
            spr.setGpa(manualGpa);
            if (dto.getNote() != null) {
                spr.setNote(dto.getNote().trim());
            }
        }
        spr = studentProjectRoundRepository.save(spr);

        Map<Long, Major> majorMap = majorRepository.findAll().stream()
                .collect(Collectors.toMap(Major::getId, m -> m, (a, b) -> a));

        Map<Long, TrainingProgram> tpMap = trainingProgramRepository.findAll().stream()
                .collect(Collectors.toMap(TrainingProgram::getId, tp -> tp, (a, b) -> a));

        return toStudentProjectRoundResponseDTO(spr, majorMap, tpMap);
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

        Pageable effectivePageable = pageable;
        if (effectivePageable == null || effectivePageable.getSort().isUnsorted()) {
            int page = effectivePageable != null ? effectivePageable.getPageNumber() : 0;
            int size = effectivePageable != null ? effectivePageable.getPageSize() : 20;
            effectivePageable = org.springframework.data.domain.PageRequest.of(
                    page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "student.studentCode"));
        }

        Page<StudentProjectRound> sprPage = studentProjectRoundRepository.searchStudentsInRound(
                roundId,
                majorId,
                normalizedStatus,
                normalizedSearch,
                effectivePageable);

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

        getAndValidateActiveRound(roundId);
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
        getAndValidateActiveRound(roundId);
        StudentProjectRound spr = studentProjectRoundRepository.findByStudentIdAndProjectRoundId(studentId, roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        studentProjectRoundRepository.delete(spr);
    }

    /**
     * Tải file Excel mẫu theo chuẩn UTC (8 cột)
     */
    public byte[] generateTemplate() {
        try {
            Set<String> existingCodes = studentRepository != null
                    ? studentRepository.findAll().stream()
                            .map(Student::getStudentCode)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet())
                    : Collections.emptySet();
            if (existingCodes.isEmpty()) {
                return studentExcelParser.generateTemplate();
            }
            return studentExcelParser.generateTemplate(existingCodes);
        } catch (IOException e) {
            log.error("Lỗi khi sinh file Excel mẫu: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    private boolean shouldActivateStudentAccount(Student existingStudent, ProjectRound round) {
        if (round != null && !"DRAFT".equalsIgnoreCase(round.getStatus())) {
            return true;
        }
        if (existingStudent != null && existingStudent.getId() != null && studentProjectRoundRepository != null) {
            return studentProjectRoundRepository.findByStudentId(existingStudent.getId()).stream()
                    .filter(spr -> spr.getProjectRound() != null && (round == null || !Objects.equals(spr.getProjectRound().getId(), round.getId())))
                    .anyMatch(spr -> "OPEN".equalsIgnoreCase(spr.getProjectRound().getStatus())
                            || "IN_PROGRESS".equalsIgnoreCase(spr.getProjectRound().getStatus()));
        }
        return false;
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
                .gpa(spr.getGpa() != null ? spr.getGpa() : (student != null ? student.getGpa() : null))
                .note(spr.getNote())
                .accountActive(user != null && Boolean.TRUE.equals(user.getIsActive()))
                .enrolledAt(spr.getCreatedAt())
                .build();
    }
}
