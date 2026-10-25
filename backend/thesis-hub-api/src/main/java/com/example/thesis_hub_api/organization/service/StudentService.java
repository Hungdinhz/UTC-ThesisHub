package com.example.thesis_hub_api.organization.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.dto.request.CreateStudentRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateStudentRequestDTO;
import com.example.thesis_hub_api.organization.dto.response.StudentResponseDTO;
import com.example.thesis_hub_api.organization.entity.Major;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.MajorRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.organization.repository.TrainingProgramRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final MajorRepository majorRepository;
    private final TrainingProgramRepository trainingProgramRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private StudentProjectRoundRepository studentProjectRoundRepository;

    @Autowired(required = false)
    private ProjectRoundRepository projectRoundRepository;

    @Transactional(readOnly = true)
    public PageResponse<StudentResponseDTO> getStudents(Long majorId, Long trainingProgramId, String className, String search, Pageable pageable) {
        return getStudents(majorId, trainingProgramId, className, search, null, pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<StudentResponseDTO> getStudents(Long majorId, Long trainingProgramId, String className, String search, Long projectRoundId, Pageable pageable) {
        String cleanSearch = StringUtils.hasText(search) ? "%" + search.trim().toLowerCase() + "%" : null;
        String cleanClass = StringUtils.hasText(className) ? "%" + className.trim().toLowerCase() + "%" : null;

        Page<Student> page = (projectRoundId != null)
                ? studentRepository.searchStudents(majorId, trainingProgramId, cleanClass, cleanSearch, projectRoundId, pageable)
                : studentRepository.searchStudents(majorId, trainingProgramId, cleanClass, cleanSearch, pageable);
        List<StudentResponseDTO> content = mapStudentsWithRounds(page.getContent());
        return PageResponse.from(page, content);
    }

    @Transactional(readOnly = true)
    public StudentResponseDTO getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_FOUND));
        return toResponseDTO(student);
    }

    @Transactional(readOnly = true)
    public StudentResponseDTO getStudentByUserId(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_FOUND));
        return toResponseDTO(student);
    }

    @Transactional(readOnly = true)
    public StudentResponseDTO getStudentByCode(String studentCode) {
        Student student = studentRepository.findByStudentCode(studentCode.trim())
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_FOUND));
        return toResponseDTO(student);
    }

    @Transactional
    public StudentResponseDTO createStudent(CreateStudentRequestDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername().trim())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(dto.getEmail().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }
        if (studentRepository.existsByStudentCode(dto.getStudentCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        if (dto.getMajorId() != null && !majorRepository.existsById(dto.getMajorId())) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }

        if (dto.getTrainingProgramId() != null && !trainingProgramRepository.existsById(dto.getTrainingProgramId())) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }

        Role role = roleRepository.findByName("ROLE_STUDENT")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User user = User.builder()
                .username(dto.getUsername().trim())
                .email(dto.getEmail().trim())
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName().trim())
                .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                .role(role)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .user(user)
                .studentCode(dto.getStudentCode().trim())
                .className(dto.getClassName() != null ? dto.getClassName().trim() : null)
                .majorId(dto.getMajorId())
                .trainingProgramId(dto.getTrainingProgramId())
                .dateOfBirth(dto.getDateOfBirth())
                .gender(dto.getGender())
                .debtCredits(dto.getDebtCredits() != null ? dto.getDebtCredits() : 0)
                .build();
        student = studentRepository.save(student);

        return toResponseDTO(student);
    }

    @Transactional
    public StudentResponseDTO updateStudent(Long id, UpdateStudentRequestDTO dto) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_FOUND));

        if (dto.getMajorId() != null) {
            if (!majorRepository.existsById(dto.getMajorId())) {
                throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
            }
            student.setMajorId(dto.getMajorId());
        }

        if (dto.getTrainingProgramId() != null) {
            if (!trainingProgramRepository.existsById(dto.getTrainingProgramId())) {
                throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
            }
            student.setTrainingProgramId(dto.getTrainingProgramId());
        }

        if (StringUtils.hasText(dto.getClassName())) {
            student.setClassName(dto.getClassName().trim());
        }
        if (dto.getDateOfBirth() != null) {
            student.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getGender() != null) {
            student.setGender(dto.getGender().trim());
        }
        if (dto.getDebtCredits() != null) {
            student.setDebtCredits(dto.getDebtCredits());
        }

        User user = student.getUser();
        if (user != null) {
            if (StringUtils.hasText(dto.getFullName())) {
                user.setFullName(dto.getFullName().trim());
            }
            if (dto.getPhone() != null) {
                user.setPhone(dto.getPhone().trim());
            }
            if (dto.getIsActive() != null) {
                user.setIsActive(dto.getIsActive());
            }
            userRepository.save(user);
        }

        student = studentRepository.save(student);
        return toResponseDTO(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_FOUND));
        
        User user = student.getUser();
        studentRepository.delete(student);
        if (user != null) {
            userRepository.delete(user);
        }
    }

    private StudentResponseDTO toResponseDTO(Student student) {
        User user = student.getUser();
        Major major = (student.getMajorId() != null)
                ? majorRepository.findById(student.getMajorId()).orElse(null) : null;
        TrainingProgram tp = (student.getTrainingProgramId() != null)
                ? trainingProgramRepository.findById(student.getTrainingProgramId()).orElse(null) : null;

        StudentResponseDTO dto = StudentResponseDTO.builder()
                .studentId(student.getId())
                .userId(user != null ? user.getId() : null)
                .studentCode(student.getStudentCode())
                .fullName(user != null ? user.getFullName() : null)
                .email(user != null ? user.getEmail() : null)
                .phone(user != null ? user.getPhone() : null)
                .avatarUrl(user != null ? user.getAvatarUrl() : null)
                .className(student.getClassName())
                .majorId(student.getMajorId())
                .majorName(major != null ? major.getName() : null)
                .trainingProgramId(student.getTrainingProgramId())
                .trainingProgramName(tp != null ? tp.getName() : null)
                .dateOfBirth(student.getDateOfBirth())
                .gender(student.getGender())
                .debtCredits(student.getDebtCredits())
                .isActive(user != null ? user.getIsActive() : true)
                .build();

        if (studentProjectRoundRepository != null && projectRoundRepository != null && student.getId() != null) {
            Map<Long, ProjectRound> roundMap = projectRoundRepository.findAll().stream()
                    .collect(Collectors.toMap(ProjectRound::getId, r -> r, (a, b) -> a));
            List<StudentProjectRound> sprs = studentProjectRoundRepository.findByStudentId(student.getId());
            List<String> codes = new ArrayList<>();
            List<String> names = new ArrayList<>();
            for (StudentProjectRound spr : sprs) {
                Long rId = spr.getProjectRound() != null ? spr.getProjectRound().getId() : null;
                ProjectRound pr = rId != null ? roundMap.get(rId) : null;
                if (pr != null) {
                    String statusStr = spr.getStatus() != null ? (" (" + spr.getStatus() + ")") : "";
                    codes.add(pr.getRoundCode() + statusStr);
                    names.add(pr.getName() + statusStr);
                }
            }
            dto.setProjectRoundCodes(codes);
            dto.setProjectRoundNames(names);
        }
        return dto;
    }

    private List<StudentResponseDTO> mapStudentsWithRounds(List<Student> students) {
        if (students == null || students.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, List<String>> studentRoundCodeMap = new HashMap<>();
        Map<Long, List<String>> studentRoundNameMap = new HashMap<>();

        if (studentProjectRoundRepository != null && projectRoundRepository != null) {
            Map<Long, ProjectRound> roundMap = projectRoundRepository.findAll().stream()
                    .collect(Collectors.toMap(ProjectRound::getId, r -> r, (a, b) -> a));

            for (Student s : students) {
                List<StudentProjectRound> sprs = studentProjectRoundRepository.findByStudentId(s.getId());
                List<String> codes = new ArrayList<>();
                List<String> names = new ArrayList<>();
                for (StudentProjectRound spr : sprs) {
                    Long rId = spr.getProjectRound() != null ? spr.getProjectRound().getId() : null;
                    ProjectRound pr = rId != null ? roundMap.get(rId) : null;
                    if (pr != null) {
                        String statusStr = spr.getStatus() != null ? (" (" + spr.getStatus() + ")") : "";
                        codes.add(pr.getRoundCode() + statusStr);
                        names.add(pr.getName() + statusStr);
                    }
                }
                studentRoundCodeMap.put(s.getId(), codes);
                studentRoundNameMap.put(s.getId(), names);
            }
        }

        return students.stream().map(s -> {
            StudentResponseDTO dto = toResponseDTO(s);
            dto.setProjectRoundCodes(studentRoundCodeMap.getOrDefault(s.getId(), Collections.emptyList()));
            dto.setProjectRoundNames(studentRoundNameMap.getOrDefault(s.getId(), Collections.emptyList()));
            return dto;
        }).toList();
    }
}
