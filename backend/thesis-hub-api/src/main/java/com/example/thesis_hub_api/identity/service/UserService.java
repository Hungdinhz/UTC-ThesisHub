package com.example.thesis_hub_api.identity.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.dto.request.*;
import com.example.thesis_hub_api.identity.dto.response.UserProfileResponseDTO;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.organization.repository.TrainingProgramRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final TrainingProgramRepository trainingProgramRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponseDTO getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return toUserProfileResponse(user);
    }

    @Transactional
    public UserProfileResponseDTO updateCurrentUserProfile(Long userId, UpdateProfileRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (StringUtils.hasText(dto.getFullName())) {
            user.setFullName(dto.getFullName().trim());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone().trim());
        }
        if (dto.getAvatarUrl() != null) {
            user.setAvatarUrl(dto.getAvatarUrl().trim());
        }

        userRepository.save(user);

        // Update student specifics if applicable
        if (dto.getDateOfBirth() != null || StringUtils.hasText(dto.getGender())) {
            studentRepository.findByUserId(userId).ifPresent(student -> {
                if (dto.getDateOfBirth() != null) {
                    student.setDateOfBirth(dto.getDateOfBirth());
                }
                if (StringUtils.hasText(dto.getGender())) {
                    student.setGender(dto.getGender().trim());
                }
                studentRepository.save(student);
            });
        }

        // Update lecturer specifics if applicable
        String researchInterests = dto.getActualResearchInterests();
        if (StringUtils.hasText(researchInterests)) {
            lecturerRepository.findByUserId(userId).ifPresent(lecturer -> {
                lecturer.setResearchInterests(researchInterests.trim());
                lecturerRepository.save(lecturer);
            });
        }

        return toUserProfileResponse(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserProfileResponseDTO> getUsers(String search, Long roleId, Boolean isActive, Pageable pageable) {
        String cleanSearch = org.springframework.util.StringUtils.hasText(search) ? "%" + search.trim().toLowerCase() + "%" : null;
        Page<User> userPage = userRepository.searchUsers(roleId, isActive, cleanSearch, pageable);
        List<UserProfileResponseDTO> content = userPage.getContent().stream()
                .map(this::toUserProfileResponse)
                .toList();

        return PageResponse.from(userPage, content);
    }

    @Transactional(readOnly = true)
    public UserProfileResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return toUserProfileResponse(user);
    }

    @Transactional
    public UserProfileResponseDTO createUser(CreateUserRequestDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        String roleName = StringUtils.hasText(dto.getRoleName()) ? dto.getRoleName() : "ROLE_STUDENT";
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User user = User.builder()
                .username(dto.getUsername().trim())
                .email(dto.getEmail().trim())
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName().trim())
                .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                .avatarUrl(dto.getAvatarUrl() != null ? dto.getAvatarUrl().trim() : null)
                .role(role)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Auto-create Student profile if role is ROLE_STUDENT
        if ("ROLE_STUDENT".equalsIgnoreCase(roleName)) {
            String studentCode = StringUtils.hasText(dto.getStudentCode()) ? dto.getStudentCode().trim() : dto.getUsername().trim();
            if (studentRepository.existsByStudentCode(studentCode)) {
                throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
            }

            Student student = Student.builder()
                    .user(user)
                    .studentCode(studentCode)
                    .className(dto.getClassName())
                    .majorId(dto.getMajorId())
                    .trainingProgramId(dto.getTrainingProgramId())
                    .dateOfBirth(dto.getDateOfBirth())
                    .gender(dto.getGender())
                    .debtCredits(0)
                    .build();
            studentRepository.save(student);
        }

        // Auto-create Lecturer profile if role is ROLE_LECTURER or ROLE_COMMITTEE
        if ("ROLE_LECTURER".equalsIgnoreCase(roleName) || "ROLE_COMMITTEE".equalsIgnoreCase(roleName)) {
            String lecturerCode = StringUtils.hasText(dto.getLecturerCode()) ? dto.getLecturerCode().trim() : dto.getUsername().trim();
            if (lecturerRepository.existsByLecturerCode(lecturerCode)) {
                throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
            }

            Lecturer lecturer = Lecturer.builder()
                    .user(user)
                    .lecturerCode(lecturerCode)
                    .departmentId(dto.getDepartmentId())
                    .academicDegree(StringUtils.hasText(dto.getAcademicDegree()) ? dto.getAcademicDegree() : "THAC_SI")
                    .researchInterests(dto.getResearchInterests())
                    .maxThesisQuota(dto.getMaxThesisQuota() != null ? dto.getMaxThesisQuota() : 5)
                    .build();
            lecturerRepository.save(lecturer);
        }

        return toUserProfileResponse(user);
    }

    @Transactional
    public UserProfileResponseDTO updateUserStatus(Long id, UpdateUserStatusRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setIsActive(dto.getIsActive());
        user = userRepository.save(user);

        return toUserProfileResponse(user);
    }

    @Transactional
    public UserProfileResponseDTO updateUserRole(Long id, UpdateUserRoleRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Role role;
        if (dto.getRoleId() != null) {
            role = roleRepository.findById(dto.getRoleId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        } else if (StringUtils.hasText(dto.getRoleName())) {
            role = roleRepository.findByName(dto.getRoleName())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        } else {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        user.setRole(role);
        user = userRepository.save(user);

        return toUserProfileResponse(user);
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
        log.info("Admin reset password for user ID: {}", id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentProfileForFrontend(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Student student = studentRepository.findByUserId(userId).orElse(null);

        String progCode = "CU_NHAN";
        if (student != null && student.getTrainingProgramId() != null) {
            progCode = trainingProgramRepository.findById(student.getTrainingProgramId())
                    .map(TrainingProgram::getCode)
                    .orElse("CU_NHAN");
        }

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("email", user.getEmail());
        userMap.put("user_type", "student");
        userMap.put("first_name", user.getFullName());
        userMap.put("last_name", "");
        userMap.put("training_program", progCode);
        userMap.put("trainingProgram", progCode);
        userMap.put("program", progCode);
        userMap.put("training_program_id", student != null ? student.getTrainingProgramId() : null);

        Map<String, Object> res = new HashMap<>();
        res.put("id", student != null ? student.getId() : user.getId());
        res.put("user", userMap);
        res.put("registration_no", student != null ? student.getStudentCode() : user.getUsername());
        res.put("department", "Khoa Công nghệ thông tin");
        res.put("semester", "Học kỳ 1");
        res.put("batch_no", student != null && student.getClassName() != null ? student.getClassName() : "K62");
        res.put("training_program", progCode);
        res.put("trainingProgram", progCode);
        res.put("program", progCode);
        res.put("training_program_id", student != null ? student.getTrainingProgramId() : null);
        return res;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSupervisorProfileForFrontend(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("email", user.getEmail());
        userMap.put("user_type", "supervisor");
        userMap.put("first_name", user.getFullName());
        userMap.put("last_name", "");

        Map<String, Object> res = new HashMap<>();
        res.put("id", lecturer != null ? lecturer.getId() : user.getId());
        res.put("user", userMap);
        res.put("supervisor_id", lecturer != null ? lecturer.getLecturerCode() : user.getUsername());
        res.put("research_interest", lecturer != null && lecturer.getResearchInterests() != null ? lecturer.getResearchInterests() : "Công nghệ phần mềm");
        res.put("academic_background", lecturer != null ? lecturer.getAcademicDegree() : "Thạc sĩ");
        return res;
    }

    private UserProfileResponseDTO toUserProfileResponse(User user) {
        String roleName = user.getRole() != null ? user.getRole().getName() : "ROLE_STUDENT";
        String roleDisplayName = user.getRole() != null ? user.getRole().getDisplayName() : "Sinh viên";

        String userType = switch (roleName) {
            case "ROLE_ADMIN" -> "admin";
            case "ROLE_LECTURER" -> "supervisor";
            case "ROLE_COMMITTEE" -> "supervisor";
            default -> "student";
        };

        UserProfileResponseDTO.StudentInfoDTO studentInfo = null;
        Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
        if (studentOpt.isPresent()) {
            Student s = studentOpt.get();
            studentInfo = UserProfileResponseDTO.StudentInfoDTO.builder()
                    .id(s.getId())
                    .studentCode(s.getStudentCode())
                    .registrationNo(s.getStudentCode())
                    .className(s.getClassName())
                    .majorId(s.getMajorId())
                    .trainingProgramId(s.getTrainingProgramId())
                    .dateOfBirth(s.getDateOfBirth())
                    .gender(s.getGender())
                    .debtCredits(s.getDebtCredits())
                    .build();
        }

        UserProfileResponseDTO.LecturerInfoDTO lecturerInfo = null;
        Optional<Lecturer> lecturerOpt = lecturerRepository.findByUserId(user.getId());
        if (lecturerOpt.isPresent()) {
            Lecturer l = lecturerOpt.get();
            lecturerInfo = UserProfileResponseDTO.LecturerInfoDTO.builder()
                    .id(l.getId())
                    .lecturerCode(l.getLecturerCode())
                    .supervisorId(l.getLecturerCode())
                    .departmentId(l.getDepartmentId())
                    .academicDegree(l.getAcademicDegree())
                    .researchInterests(l.getResearchInterests())
                    .maxThesisQuota(l.getMaxThesisQuota())
                    .build();
        }

        return UserProfileResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(roleName)
                .roleDisplayName(roleDisplayName)
                .userType(userType)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .student(studentInfo)
                .lecturer(lecturerInfo)
                .build();
    }
}
