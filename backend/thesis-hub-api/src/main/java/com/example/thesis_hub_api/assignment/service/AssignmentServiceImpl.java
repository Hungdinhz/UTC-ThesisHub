package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.algorithm.*;
import com.example.thesis_hub_api.assignment.dto.*;
import com.example.thesis_hub_api.assignment.entity.*;
import com.example.thesis_hub_api.assignment.mapper.AssignmentMapper;
import com.example.thesis_hub_api.assignment.repository.*;
import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.organization.entity.Department;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.DepartmentRepository;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.organization.repository.TrainingProgramRepository;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final ProjectDirectionRepository directionRepository;
    private final LecturerDirectionRepository lecturerDirectionRepository;
    private final LecturerCapacityRepository capacityRepository;
    private final DirectionRegistrationRepository registrationRepository;
    private final PreferenceRepository preferenceRepository;
    private final SupervisorAssignmentRepository assignmentRepository;

    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final ProjectRoundRepository projectRoundRepository;
    private final StudentProjectRoundRepository studentProjectRoundRepository;
    private final DepartmentRepository departmentRepository;
    private final TrainingProgramRepository trainingProgramRepository;

    private final AssignmentMapper mapper;
    private final AssignmentConstraints constraints;
    private final AssignmentAlgorithm algorithm;
    private final CapacityCalculator capacityCalculator;
    private final AssignmentOverrideManager overrideManager;
    private final LecturerDirectionSyncHelper syncHelper;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.example.thesis_hub_api.notification.service.NotificationService notificationService;

    private ProjectRound getAndValidateActiveRound(Long projectRoundId) {
        ProjectRound round = projectRoundRepository.findById(projectRoundId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đợt đồ án với ID: " + projectRoundId));
        if ("CLOSED".equalsIgnoreCase(round.getStatus()) || "ARCHIVED".equalsIgnoreCase(round.getStatus())) {
            throw new AppException(ErrorCode.PROJECT_ROUND_CLOSED);
        }
        return round;
    }

    // ==========================================
    // 1. Project Directions (Mục A)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDirectionResponseDTO> getAllDirections(Boolean activeOnly) {
        List<ProjectDirection> list = (activeOnly != null && activeOnly)
                ? directionRepository.findByIsActiveTrue()
                : directionRepository.findAll();

        Map<Long, String> deptNames = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));

        return list.stream().map(d -> {
            String deptName = d.getDepartmentId() != null ? deptNames.get(d.getDepartmentId()) : null;
            int count = lecturerDirectionRepository.findByDirectionId(d.getId()).size();
            return mapper.toDirectionResponse(d, deptName, count);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDirectionResponseDTO getDirectionById(Long id) {
        ProjectDirection direction = directionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hướng đồ án với ID: " + id));
        String deptName = null;
        if (direction.getDepartmentId() != null) {
            deptName = departmentRepository.findById(direction.getDepartmentId())
                    .map(Department::getName).orElse(null);
        }
        int count = lecturerDirectionRepository.findByDirectionId(id).size();
        return mapper.toDirectionResponse(direction, deptName, count);
    }

    @Override
    @Transactional
    public ProjectDirectionResponseDTO createDirection(ProjectDirectionRequestDTO request) {
        if (directionRepository.findByCode(request.getCode()).isPresent()) {
            throw new IllegalArgumentException("Mã hướng đồ án đã tồn tại: " + request.getCode());
        }
        ProjectDirection direction = ProjectDirection.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .description(request.getDescription())
                .departmentId(request.getDepartmentId())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        ProjectDirection saved = directionRepository.save(direction);
        return getDirectionById(saved.getId());
    }

    @Override
    @Transactional
    public ProjectDirectionResponseDTO updateDirection(Long id, ProjectDirectionRequestDTO request) {
        ProjectDirection direction = directionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hướng đồ án với ID: " + id));

        if (!direction.getCode().equalsIgnoreCase(request.getCode().trim())) {
            if (directionRepository.findByCode(request.getCode().trim().toUpperCase()).isPresent()) {
                throw new IllegalArgumentException("Mã hướng đồ án đã tồn tại: " + request.getCode());
            }
            direction.setCode(request.getCode().trim().toUpperCase());
        }

        direction.setName(request.getName().trim());
        direction.setDescription(request.getDescription());
        direction.setDepartmentId(request.getDepartmentId());
        if (request.getIsActive() != null) {
            direction.setIsActive(request.getIsActive());
        }
        directionRepository.save(direction);
        return getDirectionById(id);
    }

    // ==========================================
    // 2. Lecturer Directions (Mục A & B)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<LecturerDirectionResponseDTO> getLecturerDirections(Long lecturerId, Long directionId) {
        List<LecturerDirection> list;
        if (lecturerId != null) {
            list = lecturerDirectionRepository.findByLecturerId(lecturerId);
        } else if (directionId != null) {
            list = lecturerDirectionRepository.findByDirectionId(directionId);
        } else {
            list = lecturerDirectionRepository.findAll();
        }

        Map<Long, Lecturer> lecturerMap = lecturerRepository.findAll().stream()
                .collect(Collectors.toMap(Lecturer::getId, l -> l));
        Map<Long, ProjectDirection> directionMap = directionRepository.findAll().stream()
                .collect(Collectors.toMap(ProjectDirection::getId, d -> d));

        return list.stream().map(ld -> {
            Lecturer l = lecturerMap.get(ld.getLecturerId());
            ProjectDirection d = directionMap.get(ld.getDirectionId());
            String lCode = l != null ? l.getLecturerCode() : "";
            String lName = (l != null && l.getUser() != null) ? l.getUser().getFullName() : "";
            String degree = l != null ? l.getAcademicDegree() : "";
            String dCode = d != null ? d.getCode() : "";
            String dName = d != null ? d.getName() : "";
            return mapper.toLecturerDirectionResponse(ld, lCode, lName, degree, dCode, dName);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LecturerDirectionResponseDTO assignLecturerDirection(LecturerDirectionRequestDTO request) {
        if (!lecturerRepository.existsById(request.getLecturerId())) {
            throw new ResourceNotFoundException("Không tìm thấy giảng viên với ID: " + request.getLecturerId());
        }
        if (!directionRepository.existsById(request.getDirectionId())) {
            throw new ResourceNotFoundException("Không tìm thấy hướng đồ án với ID: " + request.getDirectionId());
        }

        if (lecturerDirectionRepository.existsByLecturerIdAndDirectionId(request.getLecturerId(), request.getDirectionId())) {
            throw new IllegalArgumentException("Giảng viên đã được gán vào hướng đồ án này");
        }

        LecturerDirection ld = LecturerDirection.builder()
                .lecturerId(request.getLecturerId())
                .directionId(request.getDirectionId())
                .isPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false)
                .note(request.getNote())
                .build();
        LecturerDirection saved = lecturerDirectionRepository.save(ld);

        Lecturer l = lecturerRepository.findById(saved.getLecturerId()).orElse(null);
        ProjectDirection d = directionRepository.findById(saved.getDirectionId()).orElse(null);
        String lCode = l != null ? l.getLecturerCode() : "";
        String lName = (l != null && l.getUser() != null) ? l.getUser().getFullName() : "";
        String degree = l != null ? l.getAcademicDegree() : "";
        String dCode = d != null ? d.getCode() : "";
        String dName = d != null ? d.getName() : "";
        return mapper.toLecturerDirectionResponse(saved, lCode, lName, degree, dCode, dName);
    }

    @Override
    @Transactional
    public void removeLecturerDirection(Long id) {
        if (!lecturerDirectionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy liên kết giảng viên - hướng đồ án ID: " + id);
        }
        lecturerDirectionRepository.deleteById(id);
    }

    // ==========================================
    // 3. Student Direction Registration (Mục A)
    // ==========================================

    @Override
    @Transactional
    public DirectionRegistrationResponseDTO registerDirection(DirectionRegistrationRequestDTO request, Long currentUserId) {
        ProjectRound round = getAndValidateActiveRound(request.getProjectRoundId());

        Long studentId = null;
        if (currentUserId != null) {
            Optional<Student> studentOpt = studentRepository.findByUserId(currentUserId);
            if (studentOpt.isPresent()) {
                studentId = studentOpt.get().getId();
            }
        }
        if (studentId == null) {
            studentId = request.getStudentId();
        }
        if (studentId == null) {
            throw new IllegalArgumentException("Student ID không được để trống");
        }

        final Long finalStudentId = studentId;
        Student student = studentRepository.findById(finalStudentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên với ID: " + finalStudentId));

        validateNotAlreadyFinalizedOrAllowSupplementary(student, round);
        validateStudentInRound(student, round, currentUserId);
        ProjectDirection direction = directionRepository.findById(request.getDirectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hướng đồ án với ID: " + request.getDirectionId()));

        Optional<DirectionRegistration> existingOpt = registrationRepository.findByStudentIdAndProjectRoundId(studentId, request.getProjectRoundId());
        DirectionRegistration reg;
        if (existingOpt.isPresent()) {
            reg = existingOpt.get();
            reg.setDirectionId(request.getDirectionId());
            reg.setNote(request.getNote());
            reg.setStatus("REGISTERED");
            reg.setRegisteredAt(Instant.now());
        } else {
            reg = DirectionRegistration.builder()
                    .studentId(studentId)
                    .projectRoundId(request.getProjectRoundId())
                    .directionId(request.getDirectionId())
                    .status("REGISTERED")
                    .registeredAt(Instant.now())
                    .note(request.getNote())
                    .build();
        }
        DirectionRegistration saved = registrationRepository.save(reg);

        // Đồng bộ trạng thái vào bảng student_project_rounds nếu có
        studentProjectRoundRepository.findByStudentIdAndProjectRoundId(studentId, request.getProjectRoundId())
                .ifPresent(spr -> {
                    spr.setStatus("REGISTERED");
                    studentProjectRoundRepository.save(spr);
                });

        String sCode = student.getStudentCode();
        String sName = student.getUser() != null ? student.getUser().getFullName() : "";
        String sClass = student.getClassName();
        String tpCode = student.getTrainingProgramId() != null
                ? trainingProgramRepository.findById(student.getTrainingProgramId()).map(TrainingProgram::getCode).orElse("CU_NHAN")
                : "CU_NHAN";

        return mapper.toRegistrationResponse(saved, sCode, sName, sClass, tpCode, round.getRoundCode(), direction.getCode(), direction.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public DirectionRegistrationResponseDTO getStudentDirectionRegistration(Long studentId, Long projectRoundId) {
        DirectionRegistration reg = registrationRepository.findByStudentIdAndProjectRoundId(studentId, projectRoundId)
                .orElseThrow(() -> new ResourceNotFoundException("Sinh viên chưa đăng ký hướng đồ án cho đợt này"));

        Student s = studentRepository.findById(studentId).orElse(null);
        ProjectRound r = projectRoundRepository.findById(projectRoundId).orElse(null);
        ProjectDirection d = directionRepository.findById(reg.getDirectionId()).orElse(null);

        String sCode = s != null ? s.getStudentCode() : "";
        String sName = (s != null && s.getUser() != null) ? s.getUser().getFullName() : "";
        String sClass = s != null ? s.getClassName() : "";
        String tpCode = (s != null && s.getTrainingProgramId() != null)
                ? trainingProgramRepository.findById(s.getTrainingProgramId()).map(TrainingProgram::getCode).orElse("CU_NHAN")
                : "CU_NHAN";

        return mapper.toRegistrationResponse(reg, sCode, sName, sClass, tpCode,
                r != null ? r.getRoundCode() : "",
                d != null ? d.getCode() : "",
                d != null ? d.getName() : "");
    }

    @Override
    @Transactional(readOnly = true)
    public List<DirectionRegistrationResponseDTO> getRegistrationsByRound(Long projectRoundId, Long directionId) {
        List<DirectionRegistration> list;
        if (directionId != null) {
            list = registrationRepository.findByProjectRoundIdAndDirectionId(projectRoundId, directionId);
        } else {
            list = registrationRepository.findByProjectRoundId(projectRoundId);
        }

        Map<Long, Student> studentMap = studentRepository.findAll().stream()
                .collect(Collectors.toMap(Student::getId, s -> s));
        Map<Long, ProjectDirection> directionMap = directionRepository.findAll().stream()
                .collect(Collectors.toMap(ProjectDirection::getId, d -> d));
        Map<Long, TrainingProgram> tpMap = trainingProgramRepository.findAll().stream()
                .collect(Collectors.toMap(TrainingProgram::getId, tp -> tp));
        ProjectRound round = projectRoundRepository.findById(projectRoundId).orElse(null);
        String roundCode = round != null ? round.getRoundCode() : "";

        return list.stream().map(reg -> {
            Student s = studentMap.get(reg.getStudentId());
            ProjectDirection d = directionMap.get(reg.getDirectionId());
            String sCode = s != null ? s.getStudentCode() : "";
            String sName = (s != null && s.getUser() != null) ? s.getUser().getFullName() : "";
            String sClass = s != null ? s.getClassName() : "";
            String tpCode = (s != null && s.getTrainingProgramId() != null && tpMap.get(s.getTrainingProgramId()) != null)
                    ? tpMap.get(s.getTrainingProgramId()).getCode()
                    : "CU_NHAN";
            String dCode = d != null ? d.getCode() : "";
            String dName = d != null ? d.getName() : "";
            return mapper.toRegistrationResponse(reg, sCode, sName, sClass, tpCode, roundCode, dCode, dName);
        }).collect(Collectors.toList());
    }

    // ==========================================
    // 4. Preferences (NV1, NV2, NV3) (Mục A & E)
    // ==========================================

    @Override
    @Transactional
    public List<PreferenceResponseDTO> submitPreferences(PreferenceSubmitRequestDTO request, Long currentUserId) {
        ProjectRound round = getAndValidateActiveRound(request.getProjectRoundId());

        Long studentId = null;
        if (currentUserId != null) {
            Optional<Student> studentOpt = studentRepository.findByUserId(currentUserId);
            if (studentOpt.isPresent()) {
                studentId = studentOpt.get().getId();
            }
        }
        if (studentId == null) {
            studentId = request.getStudentId();
        }
        if (studentId == null) {
            throw new IllegalArgumentException("Student ID không được để trống");
        }

        final Long finalStudentId = studentId;
        Student student = studentRepository.findById(finalStudentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên ID: " + finalStudentId));

        validateNotAlreadyFinalizedOrAllowSupplementary(student, round);
        validateStudentInRound(student, round, currentUserId);

        // Kiểm tra sinh viên đã đăng ký hướng đồ án chưa (Mục A.2)
        DirectionRegistration directionReg = registrationRepository.findByStudentIdAndProjectRoundId(studentId, request.getProjectRoundId())
                .orElseThrow(() -> new IllegalStateException("Sinh viên phải chọn hướng đồ án trước khi đăng ký nguyện vọng GVHD"));

        Long directionId = directionReg.getDirectionId();

        // Kiểm tra tính hợp lệ của nguyện vọng (Mục A.6)
        List<PreferenceItemDTO> items = request.getPreferences();
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 nguyện vọng");
        }
        if (items.size() > 3) {
            throw new IllegalArgumentException("Chỉ được phép chọn tối đa 3 nguyện vọng");
        }

        // Kiểm tra trùng giảng viên giữa các nguyện vọng
        Set<Long> lecturerIds = new HashSet<>();
        Set<Integer> priorities = new HashSet<>();
        for (PreferenceItemDTO item : items) {
            if (!lecturerIds.add(item.getLecturerId())) {
                throw new IllegalArgumentException("Các nguyện vọng không được chọn trùng giảng viên!");
            }
            if (!priorities.add(item.getPriority())) {
                throw new IllegalArgumentException("Thứ tự ưu tiên (NV1, NV2, NV3) không được trùng lặp!");
            }
        }

        // Kiểm tra chương trình đào tạo của sinh viên (Mục A.8)
        String trainingProgramCode = student.getTrainingProgramId() != null
                ? trainingProgramRepository.findById(student.getTrainingProgramId()).map(TrainingProgram::getCode).orElse("CU_NHAN")
                : "CU_NHAN";

        // Validate từng giảng viên:
        for (PreferenceItemDTO item : items) {
            Lecturer lecturer = lecturerRepository.findById(item.getLecturerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên ID: " + item.getLecturerId()));

            // Mục A.7: Kiểm tra giảng viên có thuộc hướng đồ án tương ứng hay không
            boolean belongsToDirection = lecturerDirectionRepository.existsByLecturerIdAndDirectionId(lecturer.getId(), directionId);
            if (!belongsToDirection) {
                String lName = lecturer.getUser() != null ? lecturer.getUser().getFullName() : lecturer.getLecturerCode();
                throw new IllegalArgumentException("Giảng viên " + lName + " không nhận hướng đồ án mà sinh viên đã chọn!");
            }

            // Mục A.9: Đối với sinh viên chương trình Kỹ sư, kiểm tra điều kiện học vị tối thiểu (Tiến sĩ trở lên)
            if (!constraints.checkDegreeConstraint(trainingProgramCode, lecturer.getAcademicDegree())) {
                String lName = lecturer.getUser() != null ? lecturer.getUser().getFullName() : lecturer.getLecturerCode();
                throw new IllegalArgumentException("Sinh viên chương trình Kỹ sư chỉ được chọn giảng viên có học vị Tiến sĩ trở lên! Giảng viên "
                        + lName + " có học vị " + lecturer.getAcademicDegree());
            }
        }

        // Xóa nguyện vọng cũ của sinh viên trong đợt này và lưu nguyện vọng mới
        preferenceRepository.deleteByStudentIdAndProjectRoundId(studentId, request.getProjectRoundId());

        Double effectiveGpa = request.getGpa() != null ? request.getGpa() : student.getGpa();
        List<Preference> savedPreferences = new ArrayList<>();
        for (PreferenceItemDTO item : items) {
            Preference pref = Preference.builder()
                    .studentId(studentId)
                    .projectRoundId(request.getProjectRoundId())
                    .lecturerId(item.getLecturerId())
                    .priority(item.getPriority())
                    .gpa(effectiveGpa)
                    .prioritizationCriteria(request.getPrioritizationCriteria())
                    .status("PENDING")
                    .build();
            savedPreferences.add(preferenceRepository.save(pref));
        }

        return getStudentPreferences(studentId, request.getProjectRoundId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PreferenceResponseDTO> getStudentPreferences(Long studentId, Long projectRoundId) {
        List<Preference> list = preferenceRepository.findByStudentIdAndProjectRoundIdOrderByPriorityAsc(studentId, projectRoundId);
        Student s = studentRepository.findById(studentId).orElse(null);
        String sCode = s != null ? s.getStudentCode() : "";
        String sName = (s != null && s.getUser() != null) ? s.getUser().getFullName() : "";
        String tpCode = (s != null && s.getTrainingProgramId() != null)
                ? trainingProgramRepository.findById(s.getTrainingProgramId()).map(TrainingProgram::getCode).orElse("CU_NHAN")
                : "CU_NHAN";

        Map<Long, Lecturer> lecturerMap = lecturerRepository.findAll().stream()
                .collect(Collectors.toMap(Lecturer::getId, l -> l));

        return list.stream().map(p -> {
            Lecturer l = lecturerMap.get(p.getLecturerId());
            String lCode = l != null ? l.getLecturerCode() : "";
            String lName = (l != null && l.getUser() != null) ? l.getUser().getFullName() : "";
            String degree = l != null ? l.getAcademicDegree() : "";
            return mapper.toPreferenceResponse(p, sCode, sName, tpCode, lCode, lName, degree);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PreferenceResponseDTO> getPreferencesByRound(Long projectRoundId) {
        List<Preference> list = preferenceRepository.findByProjectRoundIdOrderByStudentIdAscPriorityAsc(projectRoundId);

        Map<Long, Student> studentMap = studentRepository.findAll().stream()
                .collect(Collectors.toMap(Student::getId, s -> s));
        Map<Long, Lecturer> lecturerMap = lecturerRepository.findAll().stream()
                .collect(Collectors.toMap(Lecturer::getId, l -> l));
        Map<Long, TrainingProgram> tpMap = trainingProgramRepository.findAll().stream()
                .collect(Collectors.toMap(TrainingProgram::getId, tp -> tp));

        return list.stream().map(p -> {
            Student s = studentMap.get(p.getStudentId());
            Lecturer l = lecturerMap.get(p.getLecturerId());
            String sCode = s != null ? s.getStudentCode() : "";
            String sName = (s != null && s.getUser() != null) ? s.getUser().getFullName() : "";
            String tpCode = (s != null && s.getTrainingProgramId() != null && tpMap.get(s.getTrainingProgramId()) != null)
                    ? tpMap.get(s.getTrainingProgramId()).getCode()
                    : "CU_NHAN";
            String lCode = l != null ? l.getLecturerCode() : "";
            String lName = (l != null && l.getUser() != null) ? l.getUser().getFullName() : "";
            String degree = l != null ? l.getAcademicDegree() : "";
            return mapper.toPreferenceResponse(p, sCode, sName, tpCode, lCode, lName, degree);
        }).collect(Collectors.toList());
    }

    // ==========================================
    // 5. Capacities (Mục B)
    // ==========================================

    @Override
    @Transactional
    public List<LecturerCapacityResponseDTO> getCapacitiesByRound(Long projectRoundId) {
        List<LecturerCapacity> list = capacityRepository.findByProjectRoundId(projectRoundId);

        Map<Long, Lecturer> lecturerMap = lecturerRepository.findAll().stream()
                .collect(Collectors.toMap(Lecturer::getId, l -> l));

        // Auto-sync research directions for participating lecturers if not yet mapped
        for (LecturerCapacity cap : list) {
            Lecturer l = lecturerMap.get(cap.getLecturerId());
            if (l != null && lecturerDirectionRepository.findByLecturerId(l.getId()).isEmpty()) {
                syncHelper.syncLecturerDirections(l);
            }
        }

        Map<Long, Department> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, d -> d));
        Map<Long, ProjectDirection> directionMap = directionRepository.findAll().stream()
                .collect(Collectors.toMap(ProjectDirection::getId, d -> d));
        List<LecturerDirection> allLd = lecturerDirectionRepository.findAll();

        return list.stream().map(cap -> {
            Lecturer l = lecturerMap.get(cap.getLecturerId());
            String lCode = l != null ? l.getLecturerCode() : "";
            String lName = (l != null && l.getUser() != null) ? l.getUser().getFullName() : "";
            String email = (l != null && l.getUser() != null) ? l.getUser().getEmail() : "";
            String phone = (l != null && l.getUser() != null) ? l.getUser().getPhone() : "";
            String degree = l != null ? l.getAcademicDegree() : "";
            Long deptId = l != null ? l.getDepartmentId() : null;
            String deptName = (deptId != null && deptMap.get(deptId) != null) ? deptMap.get(deptId).getName() : "";
            String interests = l != null ? l.getResearchInterests() : null;

            List<ProjectDirection> matchingDirs = allLd.stream()
                    .filter(ld -> ld.getLecturerId().equals(cap.getLecturerId()))
                    .map(ld -> directionMap.get(ld.getDirectionId()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            List<Long> dIds = matchingDirs.stream().map(ProjectDirection::getId).collect(Collectors.toList());
            List<String> dCodes = matchingDirs.stream().map(ProjectDirection::getCode).collect(Collectors.toList());
            List<String> dNames = matchingDirs.stream().map(ProjectDirection::getName).collect(Collectors.toList());

            return mapper.toCapacityResponse(cap, lCode, lName, email, phone, degree, deptId, deptName, dNames, dIds, dCodes, interests);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LecturerCapacityResponseDTO updateCapacity(Long id, CapacityUpdateRequestDTO request) {
        LecturerCapacity capacity = capacityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỉ tiêu giảng viên ID: " + id));
        getAndValidateActiveRound(capacity.getProjectRoundId());

        if (request.getMaxQuota() != null) {
            capacity.setMaxQuota(request.getMaxQuota());
        }
        if (request.getCapacityFactor() != null) {
            capacity.setCapacityFactor(request.getCapacityFactor());
        }
        if (request.getIsActive() != null) {
            capacity.setIsActive(request.getIsActive());
        }
        if (request.getNote() != null) {
            capacity.setNote(request.getNote());
        }

        if (request.getDirectionIds() != null) {
            Long lecturerId = capacity.getLecturerId();
            lecturerDirectionRepository.deleteByLecturerId(lecturerId);
            for (Long dirId : request.getDirectionIds()) {
                if (directionRepository.existsById(dirId)) {
                    lecturerDirectionRepository.save(LecturerDirection.builder()
                            .lecturerId(lecturerId)
                            .directionId(dirId)
                            .isPrimary(false)
                            .build());
                }
            }
        }

        capacityRepository.save(capacity);
        return getCapacitiesByRound(capacity.getProjectRoundId()).stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    @Override
    @Transactional
    public void initializeCapacitiesForRound(Long projectRoundId, int defaultQuota) {
        ProjectRound round = getAndValidateActiveRound(projectRoundId);

        // 1. Kiểm tra số lượng sinh viên hợp lệ trong đợt
        List<StudentProjectRound> enrolledStudents = studentProjectRoundRepository.findByProjectRoundId(projectRoundId);
        long activeStudentCount = enrolledStudents.stream()
                .filter(spr -> !"DROPPED".equalsIgnoreCase(spr.getStatus()) && !"RESERVED".equalsIgnoreCase(spr.getStatus()))
                .count();

        if (activeStudentCount <= 0) {
            throw new AppException(ErrorCode.VALIDATION_FAILED,
                    "Đợt đồ án hiện chưa có sinh viên nào. Vui lòng import hoặc thêm sinh viên vào đợt (GĐ1: Sinh viên trong đợt) trước khi khởi tạo danh sách giảng viên.");
        }

        // 2. Lấy danh sách toàn bộ giảng viên trong khoa
        List<Lecturer> allLecturers = lecturerRepository.findAll();
        if (allLecturers.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Không tìm thấy giảng viên nào trong hệ thống.");
        }

        for (Lecturer l : allLecturers) {
            syncHelper.syncLecturerDirections(l);
        }

        // 3. Kiểm tra các chỉ tiêu hiện có trong đợt
        List<LecturerCapacity> existingCapacities = capacityRepository.findByProjectRoundId(projectRoundId);
        Map<Long, LecturerCapacity> existingCapMap = existingCapacities.stream()
                .collect(Collectors.toMap(LecturerCapacity::getLecturerId, c -> c, (c1, c2) -> c1));

        // Các giảng viên đã được phân công sinh viên (currentAssigned > 0) bắt buộc phải giữ lại
        Set<Long> mustKeepLecturerIds = existingCapacities.stream()
                .filter(c -> c.getCurrentAssigned() != null && c.getCurrentAssigned() > 0)
                .map(LecturerCapacity::getLecturerId)
                .collect(Collectors.toSet());

        // 4. Xác định số lượng giảng viên cần phân công (K)
        // Quy tắc: Mỗi giảng viên tối thiểu hướng dẫn 4 sinh viên
        // => Số lượng giảng viên tối đa = floor(activeStudentCount / 4)
        int maxLecturersByStudents = (int) Math.max(1, activeStudentCount / 4);
        int targetLecturerCount = Math.max(mustKeepLecturerIds.size(), maxLecturersByStudents);
        targetLecturerCount = Math.min(allLecturers.size(), targetLecturerCount);

        // 5. Ưu tiên chọn giảng viên theo học vị: PGS > Tiến sĩ (TIEN_SI) > Thạc sĩ (THAC_SI)
        List<Lecturer> sortedLecturers = new ArrayList<>(allLecturers);
        sortedLecturers.sort((l1, l2) -> {
            boolean keep1 = mustKeepLecturerIds.contains(l1.getId());
            boolean keep2 = mustKeepLecturerIds.contains(l2.getId());
            if (keep1 != keep2) {
                return keep1 ? -1 : 1;
            }
            double w1 = getDegreeWeight(l1.getAcademicDegree());
            double w2 = getDegreeWeight(l2.getAcademicDegree());
            if (Double.compare(w2, w1) != 0) {
                return Double.compare(w2, w1);
            }
            return Long.compare(l1.getId(), l2.getId());
        });

        List<Lecturer> selectedLecturers = new ArrayList<>(sortedLecturers.subList(0, targetLecturerCount));
        Set<Long> selectedLecturerIds = selectedLecturers.stream().map(Lecturer::getId).collect(Collectors.toSet());

        // 6. Phân bổ chỉ tiêu cho từng giảng viên theo hệ số học vị:
        // Tiến sĩ = 1.5 lần Thạc sĩ, PGS = 2.0 lần Thạc sĩ, GS = 2.5 lần Thạc sĩ
        // Mỗi giảng viên tối thiểu 4 sinh viên (hoặc toàn bộ SV nếu SV < 4)
        int minStudentsPerLecturer = (int) Math.min(4, activeStudentCount);
        double totalWeight = selectedLecturers.stream()
                .mapToDouble(l -> getDegreeWeight(l.getAcademicDegree()))
                .sum();
        double baseRatio = (double) activeStudentCount / Math.max(1.0, totalWeight);

        Map<Long, Integer> assignedBaseQuotas = new LinkedHashMap<>();
        int totalEffectiveAllocated = 0;

        for (Lecturer l : selectedLecturers) {
            double weight = getDegreeWeight(l.getAcademicDegree());
            // Chỉ tiêu mục tiêu thực tế theo trọng số học vị
            int targetEffective = (int) Math.max(minStudentsPerLecturer, Math.round(weight * baseRatio));

            // Chỉ tiêu gốc baseQuota (sao cho Math.round(baseQuota * weight) >= targetEffective)
            int baseQuota = (int) Math.max(1, Math.round((double) targetEffective / weight));
            while ((int) Math.round(baseQuota * weight) < targetEffective) {
                baseQuota++;
            }

            // Nếu giảng viên đã có sinh viên được gán, chỉ tiêu thực không được nhỏ hơn số đã gán
            LecturerCapacity existingCap = existingCapMap.get(l.getId());
            if (existingCap != null && existingCap.getCurrentAssigned() != null && existingCap.getCurrentAssigned() > 0) {
                while ((int) Math.round(baseQuota * weight) < existingCap.getCurrentAssigned()) {
                    baseQuota++;
                }
            }

            assignedBaseQuotas.put(l.getId(), baseQuota);
            totalEffectiveAllocated += (int) Math.round(baseQuota * weight);
        }

        // Đảm bảo tổng chỉ tiêu thực tế >= số lượng sinh viên
        if (totalEffectiveAllocated < activeStudentCount) {
            int shortage = (int) (activeStudentCount - totalEffectiveAllocated);
            for (int i = 0; i < shortage; i++) {
                Lecturer target = selectedLecturers.get(i % selectedLecturers.size());
                assignedBaseQuotas.put(target.getId(), assignedBaseQuotas.get(target.getId()) + 1);
            }
        }

        // 7. Cập nhật hoặc lưu mới bảng LecturerCapacity cho các giảng viên được chọn
        for (Lecturer l : selectedLecturers) {
            int baseQuota = assignedBaseQuotas.get(l.getId());
            double weight = getDegreeWeight(l.getAcademicDegree());
            LecturerCapacity cap = existingCapMap.get(l.getId());
            if (cap != null) {
                cap.setMaxQuota(baseQuota);
                cap.setCapacityFactor(weight);
                cap.setIsActive(true);
                capacityRepository.save(cap);
            } else {
                cap = LecturerCapacity.builder()
                        .lecturerId(l.getId())
                        .projectRoundId(projectRoundId)
                        .maxQuota(baseQuota)
                        .capacityFactor(weight)
                        .currentAssigned(0)
                        .isActive(true)
                        .build();
                capacityRepository.save(cap);
            }
        }

        // 8. Dọn dẹp các giảng viên không thuộc danh sách được chọn (nếu chưa gán sinh viên nào)
        for (LecturerCapacity existingCap : existingCapacities) {
            if (!selectedLecturerIds.contains(existingCap.getLecturerId())) {
                if (existingCap.getCurrentAssigned() != null && existingCap.getCurrentAssigned() > 0) {
                    existingCap.setIsActive(true);
                    capacityRepository.save(existingCap);
                } else {
                    capacityRepository.delete(existingCap);
                }
            }
        }

        log.info("Initialized capacities for round {} with {} students: selected {} lecturers (min 4 SV/GV, degree multipliers applied)",
                round.getRoundCode(), activeStudentCount, selectedLecturers.size());
    }

    private double getDegreeWeight(String degree) {
        if (degree == null) return 1.0;
        String d = degree.toUpperCase().trim();
        if (d.contains("GS") && !d.contains("PGS")) {
            return 2.5;
        } else if (d.contains("PGS")) {
            return 2.0;
        } else if (d.contains("TIEN_SI") || d.contains("TS") || d.contains("DOCTOR")) {
            return 1.5;
        } else {
            return 1.0;
        }
    }

    @Override
    @Transactional
    public void addLecturersToRound(Long projectRoundId, List<Long> lecturerIds, Integer defaultQuota) {
        addLecturersToRound(projectRoundId, lecturerIds, defaultQuota, null);
    }

    @Override
    @Transactional
    public void addLecturersToRound(Long projectRoundId, List<Long> lecturerIds, Integer defaultQuota, Map<Long, Integer> lecturerQuotas) {
        getAndValidateActiveRound(projectRoundId);
        int fallbackQuota = (defaultQuota != null && defaultQuota > 0) ? defaultQuota : 5;
        List<Lecturer> lecturers = (lecturerIds == null || lecturerIds.isEmpty())
                ? lecturerRepository.findAll()
                : lecturerRepository.findAllById(lecturerIds);

        for (Lecturer l : lecturers) {
            syncHelper.syncLecturerDirections(l);
            if (capacityRepository.findByLecturerIdAndProjectRoundId(l.getId(), projectRoundId).isEmpty()) {
                int assignedQuota = fallbackQuota;
                if (lecturerQuotas != null && lecturerQuotas.containsKey(l.getId())) {
                    Integer q = lecturerQuotas.get(l.getId());
                    if (q != null && q > 0) {
                        assignedQuota = q;
                    }
                } else if (l.getMaxThesisQuota() != null && l.getMaxThesisQuota() > 0) {
                    assignedQuota = l.getMaxThesisQuota();
                }

                LecturerCapacity cap = LecturerCapacity.builder()
                        .lecturerId(l.getId())
                        .projectRoundId(projectRoundId)
                        .maxQuota(assignedQuota)
                        .capacityFactor(getDegreeWeight(l.getAcademicDegree()))
                        .currentAssigned(0)
                        .isActive(true)
                        .build();
                capacityRepository.save(cap);
            }
        }
    }

    @Override
    @Transactional
    public void deleteCapacity(Long id) {
        LecturerCapacity capacity = capacityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỉ tiêu giảng viên ID: " + id));
        getAndValidateActiveRound(capacity.getProjectRoundId());
        if (capacity.getCurrentAssigned() != null && capacity.getCurrentAssigned() > 0) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Không thể xóa giảng viên đã được phân công sinh viên hướng dẫn.");
        }
        capacityRepository.delete(capacity);
        log.info("Removed lecturer capacity ID: {} for project round {}", id, capacity.getProjectRoundId());
    }

    @Override
    @Transactional
    public void deleteCapacityByRoundAndLecturer(Long projectRoundId, Long lecturerId) {
        LecturerCapacity capacity = capacityRepository.findByLecturerIdAndProjectRoundId(lecturerId, projectRoundId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên trong đợt đồ án (Round ID: " + projectRoundId + ", Lecturer ID: " + lecturerId + ")"));
        getAndValidateActiveRound(projectRoundId);
        if (capacity.getCurrentAssigned() != null && capacity.getCurrentAssigned() > 0) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Không thể xóa giảng viên đã được phân công sinh viên hướng dẫn.");
        }
        capacityRepository.delete(capacity);
        log.info("Removed lecturer capacity for lecturer ID: {} in project round {}", lecturerId, projectRoundId);
    }

    // ==========================================
    // 6. Algorithm Execution & Proposals (Mục C & E)
    // ==========================================

    @Override
    @Transactional
    public List<SupervisorAssignmentResponseDTO> generateAssignments(AssignmentGenerateRequestDTO request) {
        Long roundId = request.getProjectRoundId();
        ProjectRound round = getAndValidateActiveRound(roundId);

        if (Boolean.TRUE.equals(round.getSupplementaryOpen())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED,
                    "Đợt đồ án đang mở đăng ký bổ sung. Vui lòng bấm \"Kết thúc ĐK bổ sung & Xóa SV không ĐK khỏi đợt\" trước khi chạy thuật toán phân công!");
        }

        log.info("Executing supervisor allocation algorithm for round: {}", round.getRoundCode());

        // Nếu reassignAll = true, xóa các đề xuất phân công cũ (status = 'PROPOSED')
        if (request.getReassignAll() != null && request.getReassignAll()) {
            assignmentRepository.deleteByProjectRoundIdAndStatus(roundId, "PROPOSED");
        }

        // Lấy danh sách các phân công đã chốt (FINALIZED) nếu không reassignAll
        List<SupervisorAssignment> existingAssignments = assignmentRepository.findByProjectRoundId(roundId);
        Set<Long> finalizedStudentIds = existingAssignments.stream()
                .filter(a -> "FINALIZED".equalsIgnoreCase(a.getStatus()))
                .map(SupervisorAssignment::getStudentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Integer> finalizedCountPerLecturer = existingAssignments.stream()
                .filter(a -> "FINALIZED".equalsIgnoreCase(a.getStatus()) && a.getLecturerId() != null)
                .collect(Collectors.groupingBy(SupervisorAssignment::getLecturerId, Collectors.reducing(0, e -> 1, Integer::sum)));

        // Đảm bảo các giảng viên đã có bản ghi capacity trong đợt nếu chưa khởi tạo
        List<LecturerCapacity> existingRoundCaps = capacityRepository.findByProjectRoundIdAndIsActiveTrue(roundId);
        if (existingRoundCaps.isEmpty()) {
            initializeCapacitiesForRound(roundId, 5);
        }

        // Chuẩn bị dữ liệu đầu vào cho Thuật toán
        List<DirectionRegistration> registrations = registrationRepository.findByProjectRoundId(roundId);
        List<Preference> allPreferences = preferenceRepository.findByProjectRoundIdOrderByStudentIdAscPriorityAsc(roundId);
        List<LecturerCapacity> capacities = capacityRepository.findByProjectRoundIdAndIsActiveTrue(roundId);
        List<Lecturer> allLecturers = lecturerRepository.findAll();
        List<Student> allStudents = studentRepository.findAll();
        List<TrainingProgram> tpList = trainingProgramRepository.findAll();
        List<LecturerDirection> lecturerDirections = lecturerDirectionRepository.findAll();

        Map<Long, Student> studentMap = allStudents.stream().collect(Collectors.toMap(Student::getId, s -> s));
        Map<Long, Lecturer> lecturerMap = allLecturers.stream().collect(Collectors.toMap(Lecturer::getId, l -> l));
        Map<Long, TrainingProgram> tpMap = tpList.stream().collect(Collectors.toMap(TrainingProgram::getId, tp -> tp));

        // Group preferences by studentId
        Map<Long, List<Preference>> studentPrefs = allPreferences.stream()
                .collect(Collectors.groupingBy(Preference::getStudentId));

        // Map registrations to StudentAssignmentInput
        List<StudentAssignmentInput> algorithmStudents = new ArrayList<>();
        for (DirectionRegistration reg : registrations) {
            Student s = studentMap.get(reg.getStudentId());
            if (s == null) continue;

            // Nếu reassignAll = false thì giữ nguyên SV đã FINALIZED, không đưa vào danh sách phân công lại
            if (Boolean.FALSE.equals(request.getReassignAll()) && finalizedStudentIds.contains(s.getId())) {
                continue;
            }

            String tpCode = (s.getTrainingProgramId() != null && tpMap.get(s.getTrainingProgramId()) != null)
                    ? tpMap.get(s.getTrainingProgramId()).getCode()
                    : "CU_NHAN";

            List<Preference> pList = studentPrefs.getOrDefault(s.getId(), Collections.emptyList());
            Double gpa = pList.stream().map(Preference::getGpa).filter(Objects::nonNull).findFirst().orElseGet(() -> s.getGpa() != null ? s.getGpa() : 0.0);

            List<StudentAssignmentInput.PreferenceEntry> pEntries = pList.stream()
                    .map(p -> StudentAssignmentInput.PreferenceEntry.builder()
                            .priority(p.getPriority())
                            .lecturerId(p.getLecturerId())
                            .build())
                    .collect(Collectors.toList());

            algorithmStudents.add(StudentAssignmentInput.builder()
                    .studentId(s.getId())
                    .studentCode(s.getStudentCode())
                    .fullName(s.getUser() != null ? s.getUser().getFullName() : "")
                    .trainingProgramCode(tpCode)
                    .directionId(reg.getDirectionId())
                    .gpa(gpa)
                    .preferences(pEntries)
                    .build());
        }

        // Map capacities to LecturerAssignmentInput
        List<LecturerAssignmentInput> algorithmLecturers = new ArrayList<>();
        for (LecturerCapacity cap : capacities) {
            Lecturer l = lecturerMap.get(cap.getLecturerId());
            if (l == null) continue;

            List<Long> dIds = lecturerDirections.stream()
                    .filter(ld -> ld.getLecturerId().equals(l.getId()))
                    .map(LecturerDirection::getDirectionId)
                    .collect(Collectors.toList());

            int initialAssigned = Boolean.FALSE.equals(request.getReassignAll())
                    ? finalizedCountPerLecturer.getOrDefault(l.getId(), 0)
                    : 0;

            algorithmLecturers.add(LecturerAssignmentInput.builder()
                    .lecturerId(l.getId())
                    .lecturerCode(l.getLecturerCode())
                    .fullName(l.getUser() != null ? l.getUser().getFullName() : "")
                    .academicDegree(l.getAcademicDegree())
                    .maxQuota(cap.getMaxQuota())
                    .capacityFactor(cap.getCapacityFactor())
                    .effectiveCapacity(cap.getEffectiveCapacity())
                    .currentAssigned(initialAssigned) // Đã tính các SV đã FINALIZED nếu không reassignAll
                    .directionIds(dIds)
                    .build());
        }

        // Chạy thuật toán
        List<AssignmentMatchResult> results = algorithm.executeMatching(algorithmStudents, algorithmLecturers);

        // Lưu kết quả vào supervisor_assignments
        for (AssignmentMatchResult res : results) {
            if (res.getLecturerId() == null) {
                continue; // Unassigned students can be tracked via statistics or pending list
            }

            Optional<SupervisorAssignment> existingOpt = assignmentRepository.findByStudentIdAndProjectRoundId(res.getStudentId(), roundId);
            SupervisorAssignment sa;
            if (existingOpt.isPresent()) {
                sa = existingOpt.get();
                if ("FINALIZED".equalsIgnoreCase(sa.getStatus())) {
                    continue; // Do not overwrite finalized assignments
                }
                sa.setLecturerId(res.getLecturerId());
                sa.setDirectionId(res.getDirectionId());
                sa.setMatchedPriority(res.getMatchedPriority());
                sa.setMatchScore(res.getMatchScore());
                sa.setAssignmentMethod("ALGORITHM");
                sa.setStatus("PROPOSED");
                sa.setNote(res.getNotes());
            } else {
                sa = SupervisorAssignment.builder()
                        .studentId(res.getStudentId())
                        .lecturerId(res.getLecturerId())
                        .projectRoundId(roundId)
                        .directionId(res.getDirectionId())
                        .matchedPriority(res.getMatchedPriority())
                        .matchScore(res.getMatchScore())
                        .assignmentMethod("ALGORITHM")
                        .status("PROPOSED")
                        .isOverridden(false)
                        .note(res.getNotes())
                        .build();
            }
            assignmentRepository.save(sa);
        }

        // Cập nhật current_assigned trong lecturer_capacities
        for (LecturerAssignmentInput al : algorithmLecturers) {
            capacityRepository.findByLecturerIdAndProjectRoundId(al.getLecturerId(), roundId)
                    .ifPresent(cap -> {
                        cap.setCurrentAssigned(al.getCurrentAssigned());
                        capacityRepository.save(cap);
                    });
        }

        return getProposalsByRound(roundId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupervisorAssignmentResponseDTO> getProposalsByRound(Long projectRoundId, String status) {
        List<SupervisorAssignment> list;
        if (status != null && !status.isBlank()) {
            list = assignmentRepository.findByProjectRoundIdAndStatus(projectRoundId, status.toUpperCase().trim());
        } else {
            list = assignmentRepository.findByProjectRoundId(projectRoundId);
        }

        Map<Long, Student> studentMap = studentRepository.findAll().stream()
                .collect(Collectors.toMap(Student::getId, s -> s));
        Map<Long, Lecturer> lecturerMap = lecturerRepository.findAll().stream()
                .collect(Collectors.toMap(Lecturer::getId, l -> l));
        Map<Long, Department> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, d -> d));
        Map<Long, ProjectDirection> directionMap = directionRepository.findAll().stream()
                .collect(Collectors.toMap(ProjectDirection::getId, d -> d));
        Map<Long, TrainingProgram> tpMap = trainingProgramRepository.findAll().stream()
                .collect(Collectors.toMap(TrainingProgram::getId, tp -> tp));

        return list.stream().map(sa -> {
            Student s = studentMap.get(sa.getStudentId());
            Lecturer l = lecturerMap.get(sa.getLecturerId());
            Lecturer prevL = sa.getPreviousLecturerId() != null ? lecturerMap.get(sa.getPreviousLecturerId()) : null;
            ProjectDirection d = sa.getDirectionId() != null ? directionMap.get(sa.getDirectionId()) : null;

            String sCode = s != null ? s.getStudentCode() : "";
            String sName = (s != null && s.getUser() != null) ? s.getUser().getFullName() : "";
            String sClass = s != null ? s.getClassName() : "";
            String tpCode = (s != null && s.getTrainingProgramId() != null && tpMap.get(s.getTrainingProgramId()) != null)
                    ? tpMap.get(s.getTrainingProgramId()).getCode()
                    : "CU_NHAN";

            String lCode = l != null ? l.getLecturerCode() : "";
            String lName = (l != null && l.getUser() != null) ? l.getUser().getFullName() : "";
            String degree = l != null ? l.getAcademicDegree() : "";
            String deptName = (l != null && l.getDepartmentId() != null && deptMap.get(l.getDepartmentId()) != null)
                    ? deptMap.get(l.getDepartmentId()).getName()
                    : "";

            String dCode = d != null ? d.getCode() : "";
            String dName = d != null ? d.getName() : "";
            String prevName = (prevL != null && prevL.getUser() != null) ? prevL.getUser().getFullName() : "";

            return mapper.toAssignmentResponse(sa, sCode, sName, sClass, tpCode,
                    lCode, lName, degree, deptName, dCode, dName, prevName);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SupervisorAssignmentResponseDTO overrideAssignment(Long assignmentId, AssignmentOverrideRequestDTO request, Long currentUserId) {
        SupervisorAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi phân công ID: " + assignmentId));
        getAndValidateActiveRound(assignment.getProjectRoundId());
        log.info("Faculty requested manual override for assignment: {}, new lecturer: {}", assignmentId, request.getNewLecturerId());
        SupervisorAssignment updated = overrideManager.executeOverride(assignmentId, request.getNewLecturerId(), request.getReason(), currentUserId);
        return getProposalsByRound(updated.getProjectRoundId(), null).stream()
                .filter(p -> p.getId().equals(assignmentId))
                .findFirst()
                .orElse(null);
    }

    @Override
    @Transactional
    public AssignmentStatsResponseDTO finalizeAssignments(AssignmentFinalizeRequestDTO request, Long currentUserId) {
        Long roundId = request.getProjectRoundId();
        getAndValidateActiveRound(roundId);
        List<SupervisorAssignment> assignments = assignmentRepository.findByProjectRoundId(roundId);
        if (assignments.isEmpty()) {
            throw new IllegalStateException("Chưa có danh sách phân công đề xuất để chốt kết quả.");
        }

        Instant now = Instant.now();
        for (SupervisorAssignment sa : assignments) {
            sa.setStatus("FINALIZED");
            sa.setFinalizedBy(currentUserId);
            sa.setFinalizedAt(now);
            if (request.getNote() != null) {
                sa.setNote(request.getNote());
            }
            assignmentRepository.save(sa);

            // Đồng bộ trạng thái ASSIGNED vào StudentProjectRound
            if (studentProjectRoundRepository != null && sa.getStudentId() != null) {
                studentProjectRoundRepository.findByStudentIdAndProjectRoundId(sa.getStudentId(), roundId)
                        .ifPresent(spr -> {
                            spr.setStatus("ASSIGNED");
                            if (spr.getNote() == null || spr.getNote().isBlank()) {
                                spr.setNote("Đã được phân công GVHD chính thức");
                            }
                            studentProjectRoundRepository.save(spr);
                        });
            }

            // Gửi thông báo nội bộ cho sinh viên
            if (notificationService != null && sa.getStudentId() != null) {
                studentRepository.findById(sa.getStudentId()).ifPresent(student -> {
                    if (student.getUser() != null && student.getUser().getId() != null) {
                        try {
                            notificationService.createNotification(
                                    student.getUser().getId(),
                                    "Kết quả phân công GVHD",
                                    "Khoa đã chốt kết quả phân công GVHD cho bạn trong đợt đồ án.",
                                    "ASSIGNMENT",
                                    "/student/assignment"
                            );
                        } catch (Exception e) {
                            log.warn("Không thể gửi thông báo phân công cho sinh viên ID={}: {}", student.getId(), e.getMessage());
                        }
                    }
                });
            }
        }

        // Những sinh viên chưa đăng kí sau khi đã chốt phân công thì loại khỏi đợt đồ án
        if (studentProjectRoundRepository != null) {
            Set<Long> registeredStudentIds = registrationRepository.findByProjectRoundId(roundId).stream()
                    .map(DirectionRegistration::getStudentId)
                    .collect(Collectors.toSet());
            Set<Long> preferenceStudentIds = preferenceRepository.findByProjectRoundIdOrderByStudentIdAscPriorityAsc(roundId).stream()
                    .map(Preference::getStudentId)
                    .collect(Collectors.toSet());
            Set<Long> assignedStudentIds = assignments.stream()
                    .map(SupervisorAssignment::getStudentId)
                    .collect(Collectors.toSet());

            List<StudentProjectRound> roundStudents = studentProjectRoundRepository.findByProjectRoundId(roundId);
            int droppedCount = 0;
            for (StudentProjectRound spr : roundStudents) {
                if (spr.getStudent() == null || spr.getStudent().getId() == null) {
                    continue;
                }
                Long sId = spr.getStudent().getId();
                boolean hasRegistered = registeredStudentIds.contains(sId) || preferenceStudentIds.contains(sId) || assignedStudentIds.contains(sId);
                // Nếu sinh viên chưa từng đăng ký hướng/nguyện vọng và chưa bị loại/bảo lưu từ trước
                if (!hasRegistered && !"DROPPED".equalsIgnoreCase(spr.getStatus()) && !"RESERVED".equalsIgnoreCase(spr.getStatus())) {
                    spr.setStatus("DROPPED");
                    spr.setNote("Chưa đăng ký nguyện vọng đồ án khi đã chốt phân công - Bị loại khỏi đợt");
                    studentProjectRoundRepository.save(spr);
                    droppedCount++;
                }
            }
            log.info("Chốt phân công đợt {}: Đã loại {} sinh viên chưa đăng ký khỏi đợt đồ án", roundId, droppedCount);
        }

        log.info("Finalized {} supervisor assignments for project round {}", assignments.size(), roundId);
        return getAssignmentStats(roundId);
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentStatsResponseDTO getAssignmentStats(Long projectRoundId) {
        long totalStudents = registrationRepository.findByProjectRoundId(projectRoundId).size();
        List<SupervisorAssignment> assignments = assignmentRepository.findByProjectRoundId(projectRoundId);
        List<LecturerCapacity> capacities = capacityRepository.findByProjectRoundId(projectRoundId);

        int totalAssigned = assignments.size();
        int nv1 = (int) assignments.stream().filter(a -> a.getMatchedPriority() != null && a.getMatchedPriority() == 1).count();
        int nv2 = (int) assignments.stream().filter(a -> a.getMatchedPriority() != null && a.getMatchedPriority() == 2).count();
        int nv3 = (int) assignments.stream().filter(a -> a.getMatchedPriority() != null && a.getMatchedPriority() == 3).count();
        int fallback = (int) assignments.stream().filter(a -> a.getMatchedPriority() != null && a.getMatchedPriority() == 0).count();
        int unassigned = Math.max(0, (int) totalStudents - totalAssigned);
        int overridden = (int) assignments.stream().filter(a -> Boolean.TRUE.equals(a.getIsOverridden())).count();
        int finalized = (int) assignments.stream().filter(a -> "FINALIZED".equalsIgnoreCase(a.getStatus())).count();

        int totalCap = capacities.stream().mapToInt(LecturerCapacity::getEffectiveCapacity).sum();
        double avgLoad = totalCap > 0 ? (double) totalAssigned / (double) totalCap : 0.0;

        double nv1Rate = totalStudents > 0 ? ((double) nv1 / (double) totalStudents) * 100.0 : 0.0;
        double nv2Rate = totalStudents > 0 ? ((double) nv2 / (double) totalStudents) * 100.0 : 0.0;
        double nv3Rate = totalStudents > 0 ? ((double) nv3 / (double) totalStudents) * 100.0 : 0.0;

        int dropped = 0;
        if (studentProjectRoundRepository != null) {
            dropped = (int) studentProjectRoundRepository.findByProjectRoundId(projectRoundId).stream()
                    .filter(spr -> "DROPPED".equalsIgnoreCase(spr.getStatus()))
                    .count();
        }

        return AssignmentStatsResponseDTO.builder()
                .projectRoundId(projectRoundId)
                .totalStudents((int) totalStudents)
                .totalAssigned(totalAssigned)
                .matchedNv1(nv1)
                .nv1Rate(Math.round(nv1Rate * 100.0) / 100.0)
                .matchedNv2(nv2)
                .nv2Rate(Math.round(nv2Rate * 100.0) / 100.0)
                .matchedNv3(nv3)
                .nv3Rate(Math.round(nv3Rate * 100.0) / 100.0)
                .matchedFallback(fallback)
                .unassignedCount(unassigned)
                .overriddenCount(overridden)
                .finalizedCount(finalized)
                .totalLecturers(capacities.size())
                .totalCapacity(totalCap)
                .averageLoadRatio(Math.round(avgLoad * 100.0) / 100.0)
                .droppedCount(dropped)
                .supplementaryOpen(projectRoundRepository.findById(projectRoundId)
                        .map(r -> Boolean.TRUE.equals(r.getSupplementaryOpen()))
                        .orElse(false))
                .build();
    }

    @Override
    @Transactional
    public AssignmentStatsResponseDTO openSupplementaryRegistration(Long projectRoundId) {
        ProjectRound round = getAndValidateActiveRound(projectRoundId);
        if (studentProjectRoundRepository == null) {
            return getAssignmentStats(projectRoundId);
        }

        Set<Long> assignedStudentIds = assignmentRepository.findByProjectRoundId(projectRoundId).stream()
                .map(SupervisorAssignment::getStudentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<StudentProjectRound> roundStudents = studentProjectRoundRepository.findByProjectRoundId(projectRoundId);
        int reopenedCount = 0;
        for (StudentProjectRound spr : roundStudents) {
            if (spr.getStudent() == null || spr.getStudent().getId() == null) {
                continue;
            }
            Long sId = spr.getStudent().getId();
            if ("RESERVED".equalsIgnoreCase(spr.getStatus()) || assignedStudentIds.contains(sId)) {
                continue;
            }
            // Cho phép các sinh viên chưa được phân công (bao gồm cả SV đã bị DROPPED do chưa đăng ký NV đợt 1) đăng ký bổ sung
            spr.setStatus("ELIGIBLE");
            spr.setNote("Đợt đăng ký bổ sung nguyện vọng GVHD đang mở");
            studentProjectRoundRepository.save(spr);
            reopenedCount++;

            if (notificationService != null && spr.getStudent().getUser() != null && spr.getStudent().getUser().getId() != null) {
                try {
                    notificationService.createNotification(
                            spr.getStudent().getUser().getId(),
                            "Mở đợt đăng ký bổ sung nguyện vọng GVHD",
                            "Khoa đã mở đợt đăng ký bổ sung nguyện vọng GVHD cho đợt [" + round.getRoundCode() + "]. Vui lòng hoàn tất đăng ký trước khi kết thúc đợt bổ sung.",
                            "ASSIGNMENT",
                            "/student/assignment"
                    );
                } catch (Exception ignored) {}
            }
        }
        round.setSupplementaryOpen(true);
        projectRoundRepository.save(round);
        log.info("Đã mở đợt đăng ký bổ sung cho {} sinh viên trong đợt {}", reopenedCount, round.getRoundCode());
        AssignmentStatsResponseDTO stats = getAssignmentStats(projectRoundId);
        stats.setSupplementaryOpen(true);
        stats.setSupplementaryCount(reopenedCount);
        return stats;
    }

    @SuppressWarnings("unused")
    private AssignmentStatsResponseDTO unusedAnchor(Long projectRoundId) {
        return getAssignmentStats(projectRoundId);
    }

    @Override
    @Transactional
    public AssignmentStatsResponseDTO finalizeSupplementaryRegistration(Long projectRoundId, Long currentUserId) {
        ProjectRound round = getAndValidateActiveRound(projectRoundId);

        if (!Boolean.TRUE.equals(round.getSupplementaryOpen())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Đợt đăng ký bổ sung chưa được mở nên không thể thực hiện kết thúc đợt bổ sung!");
        }

        // Đóng cờ supplementaryOpen trước khi phân công để thỏa mãn validation
        round.setSupplementaryOpen(false);
        projectRoundRepository.save(round);

        // Chạy thuật toán gán cho các sinh viên mới đăng ký bổ sung (reassignAll = false để giữ nguyên các SV đã FINALIZED)
        try {
            AssignmentGenerateRequestDTO genReq = new AssignmentGenerateRequestDTO();
            genReq.setProjectRoundId(projectRoundId);
            genReq.setReassignAll(false);
            generateAssignments(genReq);
        } catch (Exception ex) {
            log.warn("Không thể chạy tự động phân công khi chốt đợt bổ sung: {}", ex.getMessage());
        }

        // Chốt toàn bộ phân công mới phát sinh
        List<SupervisorAssignment> assignments = assignmentRepository.findByProjectRoundId(projectRoundId);
        Instant now = Instant.now();
        for (SupervisorAssignment sa : assignments) {
            if (!"FINALIZED".equalsIgnoreCase(sa.getStatus())) {
                sa.setStatus("FINALIZED");
                sa.setFinalizedBy(currentUserId);
                sa.setFinalizedAt(now);
                assignmentRepository.save(sa);

                if (studentProjectRoundRepository != null && sa.getStudentId() != null) {
                    studentProjectRoundRepository.findByStudentIdAndProjectRoundId(sa.getStudentId(), projectRoundId)
                            .ifPresent(spr -> {
                                spr.setStatus("ASSIGNED");
                                spr.setNote("Đã được phân công GVHD chính thức (Đợt bổ sung)");
                                studentProjectRoundRepository.save(spr);
                            });
                }
            }
        }

        round.setSupplementaryOpen(false);
        projectRoundRepository.save(round);
        if (studentProjectRoundRepository != null) {
            Set<Long> registeredStudentIds = registrationRepository.findByProjectRoundId(projectRoundId).stream()
                    .map(DirectionRegistration::getStudentId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Set<Long> preferenceStudentIds = preferenceRepository.findByProjectRoundIdOrderByStudentIdAscPriorityAsc(projectRoundId).stream()
                    .map(Preference::getStudentId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Set<Long> assignedStudentIds = assignments.stream()
                    .map(SupervisorAssignment::getStudentId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            List<StudentProjectRound> roundStudents = studentProjectRoundRepository.findByProjectRoundId(projectRoundId);
            int removedCount = 0;
            for (StudentProjectRound spr : roundStudents) {
                if (spr.getStudent() == null || spr.getStudent().getId() == null) {
                    continue;
                }
                if ("RESERVED".equalsIgnoreCase(spr.getStatus())) {
                    continue;
                }
                Long sId = spr.getStudent().getId();
                boolean hasRegistered = registeredStudentIds.contains(sId)
                        || preferenceStudentIds.contains(sId)
                        || assignedStudentIds.contains(sId);
                if (!hasRegistered) {
                    studentProjectRoundRepository.delete(spr);
                    removedCount++;
                }
            }
            log.info("Kết thúc đợt đăng ký bổ sung đợt {}: Đã xóa vĩnh viễn {} sinh viên không đăng ký khỏi đợt đồ án",
                    round.getRoundCode(), removedCount);
        }

        return getAssignmentStats(projectRoundId);
    }

    private void validateNotAlreadyFinalizedOrAllowSupplementary(Student student, ProjectRound round) {
        if (student == null || round == null) {
            return;
        }
        // Nếu cá nhân sinh viên này đã có phân công FINALIZED thì không cho đăng ký lại
        Optional<SupervisorAssignment> myAssign = assignmentRepository.findByStudentIdAndProjectRoundId(student.getId(), round.getId());
        if (myAssign.isPresent() && "FINALIZED".equalsIgnoreCase(myAssign.get().getStatus())) {
            throw new AppException(ErrorCode.ASSIGNMENT_ALREADY_FINALIZED);
        }
        // Nếu đợt đã có các SV khác FINALIZED, kiểm tra xem sinh viên này có đang được mở đăng ký bổ sung không
        if (assignmentRepository.countByProjectRoundIdAndStatus(round.getId(), "FINALIZED") > 0) {
            if (Boolean.TRUE.equals(round.getSupplementaryOpen())) {
                return;
            }
            if (studentProjectRoundRepository != null) {
                Optional<StudentProjectRound> sprOpt = studentProjectRoundRepository.findByStudentIdAndProjectRoundId(student.getId(), round.getId());
                if (sprOpt.isPresent()) {
                    StudentProjectRound spr = sprOpt.get();
                    boolean isSupplementary = spr.getNote() != null && spr.getNote().toLowerCase().contains("bổ sung");
                    if (isSupplementary && !"DROPPED".equalsIgnoreCase(spr.getStatus())) {
                        return;
                    }
                }
            }
            throw new AppException(ErrorCode.ASSIGNMENT_ALREADY_FINALIZED);
        }
    }

    private void validateStudentInRound(Student student, ProjectRound round, Long currentUserId) {
        if (student == null || round == null || studentProjectRoundRepository == null) {
            return;
        }
        Optional<StudentProjectRound> sprOpt = studentProjectRoundRepository
                .findByStudentIdAndProjectRoundId(student.getId(), round.getId());
        if (sprOpt.isEmpty()) {
            boolean enforceEnrollment = currentUserId != null
                    || studentProjectRoundRepository.countByProjectRoundId(round.getId()) > 0
                    || !studentProjectRoundRepository.findByStudentId(student.getId()).isEmpty();
            if (enforceEnrollment) {
                throw new AppException(ErrorCode.VALIDATION_FAILED,
                        "Sinh viên (" + student.getStudentCode() + ") không thuộc danh sách tham gia đợt đồ án [" + round.getRoundCode()
                                + "]. Sinh viên thuộc đợt đồ án nào thì chỉ được đăng ký và thực hiện ở đợt đó.");
            }
        } else {
            String sprStatus = sprOpt.get().getStatus();
            if ("DROPPED".equalsIgnoreCase(sprStatus) || "RESERVED".equalsIgnoreCase(sprStatus)) {
                throw new AppException(ErrorCode.VALIDATION_FAILED,
                        "Sinh viên (" + student.getStudentCode() + ") hiện ở trạng thái " + sprStatus
                                + " trong đợt đồ án [" + round.getRoundCode() + "] nên không thể đăng ký nguyện vọng.");
            }
        }
    }
}
