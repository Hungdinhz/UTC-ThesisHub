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

        if (assignmentRepository.countByProjectRoundIdAndStatus(request.getProjectRoundId(), "FINALIZED") > 0) {
            throw new AppException(ErrorCode.ASSIGNMENT_ALREADY_FINALIZED);
        }

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

        if (assignmentRepository.countByProjectRoundIdAndStatus(request.getProjectRoundId(), "FINALIZED") > 0) {
            throw new AppException(ErrorCode.ASSIGNMENT_ALREADY_FINALIZED);
        }

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

        List<Preference> savedPreferences = new ArrayList<>();
        for (PreferenceItemDTO item : items) {
            Preference pref = Preference.builder()
                    .studentId(studentId)
                    .projectRoundId(request.getProjectRoundId())
                    .lecturerId(item.getLecturerId())
                    .priority(item.getPriority())
                    .gpa(request.getGpa())
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
    @Transactional(readOnly = true)
    public List<LecturerCapacityResponseDTO> getCapacitiesByRound(Long projectRoundId) {
        List<LecturerCapacity> list = capacityRepository.findByProjectRoundId(projectRoundId);

        Map<Long, Lecturer> lecturerMap = lecturerRepository.findAll().stream()
                .collect(Collectors.toMap(Lecturer::getId, l -> l));
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

            List<String> dNames = allLd.stream()
                    .filter(ld -> ld.getLecturerId().equals(cap.getLecturerId()))
                    .map(ld -> directionMap.get(ld.getDirectionId()))
                    .filter(Objects::nonNull)
                    .flatMap(d -> java.util.stream.Stream.of(d.getCode(), d.getName()))
                    .collect(Collectors.toList());

            return mapper.toCapacityResponse(cap, lCode, lName, email, phone, degree, deptId, deptName, dNames);
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

        capacityRepository.save(capacity);
        return getCapacitiesByRound(capacity.getProjectRoundId()).stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    @Override
    @Transactional
    public void initializeCapacitiesForRound(Long projectRoundId, int defaultQuota) {
        getAndValidateActiveRound(projectRoundId);
        List<Lecturer> lecturers = lecturerRepository.findAll();
        for (Lecturer l : lecturers) {
            if (capacityRepository.findByLecturerIdAndProjectRoundId(l.getId(), projectRoundId).isEmpty()) {
                LecturerCapacity cap = LecturerCapacity.builder()
                        .lecturerId(l.getId())
                        .projectRoundId(projectRoundId)
                        .maxQuota(l.getMaxThesisQuota() != null ? l.getMaxThesisQuota() : defaultQuota)
                        .capacityFactor(1.0)
                        .currentAssigned(0)
                        .isActive(true)
                        .build();
                capacityRepository.save(cap);
            }
        }
    }

    // ==========================================
    // 6. Algorithm Execution & Proposals (Mục C & E)
    // ==========================================

    @Override
    @Transactional
    public List<SupervisorAssignmentResponseDTO> generateAssignments(AssignmentGenerateRequestDTO request) {
        Long roundId = request.getProjectRoundId();
        ProjectRound round = getAndValidateActiveRound(roundId);

        log.info("Executing supervisor allocation algorithm for round: {}", round.getRoundCode());

        // Nếu reassignAll = true, xóa các đề xuất phân công cũ (status = 'PROPOSED')
        if (request.getReassignAll() != null && request.getReassignAll()) {
            assignmentRepository.deleteByProjectRoundIdAndStatus(roundId, "PROPOSED");
        }

        // Đảm bảo các giảng viên đã có bản ghi capacity trong đợt
        initializeCapacitiesForRound(roundId, 5);

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

            String tpCode = (s.getTrainingProgramId() != null && tpMap.get(s.getTrainingProgramId()) != null)
                    ? tpMap.get(s.getTrainingProgramId()).getCode()
                    : "CU_NHAN";

            List<Preference> pList = studentPrefs.getOrDefault(s.getId(), Collections.emptyList());
            Double gpa = pList.stream().map(Preference::getGpa).filter(Objects::nonNull).findFirst().orElse(3.0);

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

            algorithmLecturers.add(LecturerAssignmentInput.builder()
                    .lecturerId(l.getId())
                    .lecturerCode(l.getLecturerCode())
                    .fullName(l.getUser() != null ? l.getUser().getFullName() : "")
                    .academicDegree(l.getAcademicDegree())
                    .maxQuota(cap.getMaxQuota())
                    .capacityFactor(cap.getCapacityFactor())
                    .effectiveCapacity(cap.getEffectiveCapacity())
                    .currentAssigned(0) // Start fresh for algorithm allocation
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
                .build();
    }
}
