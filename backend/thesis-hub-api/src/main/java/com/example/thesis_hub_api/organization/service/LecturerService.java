package com.example.thesis_hub_api.organization.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.dto.request.CreateLecturerRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateLecturerRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateResearchInterestsDTO;
import com.example.thesis_hub_api.organization.dto.response.LecturerResponseDTO;
import com.example.thesis_hub_api.organization.entity.Department;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.repository.DepartmentRepository;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import com.example.thesis_hub_api.assignment.repository.LecturerCapacityRepository;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LecturerService {

    private final LecturerRepository lecturerRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private LecturerCapacityRepository lecturerCapacityRepository;

    @Autowired(required = false)
    private ProjectRoundRepository projectRoundRepository;

    @Autowired(required = false)
    private com.example.thesis_hub_api.assignment.service.LecturerDirectionSyncHelper lecturerDirectionSyncHelper;

    /**
     * CONTRACT 1: Lấy danh sách Giảng viên theo Bộ môn, Học vị hoặc từ khóa tìm kiếm.
     * Cung cấp dữ liệu nền cho module phân công hướng dẫn và hội đồng bảo vệ.
     */
    @Transactional(readOnly = true)
    public List<LecturerResponseDTO> getLecturers(Long departmentId, String degree, String search) {
        return getLecturers(departmentId, degree, search, null);
    }

    @Transactional(readOnly = true)
    public List<LecturerResponseDTO> getLecturers(Long departmentId, String degree, String search, Long projectRoundId) {
        String cleanSearch = StringUtils.hasText(search) ? "%" + search.trim().toLowerCase() + "%" : null;
        String cleanDegree = StringUtils.hasText(degree) ? degree.trim() : null;

        List<Lecturer> lecturers = (projectRoundId != null)
                ? lecturerRepository.findLecturersFiltered(departmentId, cleanDegree, cleanSearch, projectRoundId)
                : lecturerRepository.findLecturersFiltered(departmentId, cleanDegree, cleanSearch);
        return mapLecturersWithRounds(lecturers);
    }

    @Transactional(readOnly = true)
    public PageResponse<LecturerResponseDTO> getLecturersPaged(Long departmentId, String degree, String search, Pageable pageable) {
        return getLecturersPaged(departmentId, degree, search, null, pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<LecturerResponseDTO> getLecturersPaged(Long departmentId, String degree, String search, Long projectRoundId, Pageable pageable) {
        String cleanSearch = StringUtils.hasText(search) ? "%" + search.trim().toLowerCase() + "%" : null;
        String cleanDegree = StringUtils.hasText(degree) ? degree.trim() : null;

        Page<Lecturer> page = (projectRoundId != null)
                ? lecturerRepository.searchLecturers(departmentId, cleanDegree, cleanSearch, projectRoundId, pageable)
                : lecturerRepository.searchLecturers(departmentId, cleanDegree, cleanSearch, pageable);
        List<LecturerResponseDTO> content = mapLecturersWithRounds(page.getContent());
        return PageResponse.from(page, content);
    }

    @Transactional(readOnly = true)
    public LecturerResponseDTO getLecturerById(Long id) {
        Lecturer lecturer = lecturerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LECTURER_NOT_FOUND));
        return toResponseDTO(lecturer);
    }

    @Transactional(readOnly = true)
    public LecturerResponseDTO getLecturerByUserId(Long userId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.LECTURER_NOT_FOUND));
        return toResponseDTO(lecturer);
    }

    @Transactional
    public LecturerResponseDTO createLecturer(CreateLecturerRequestDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername().trim())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(dto.getEmail().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }
        if (lecturerRepository.existsByLecturerCode(dto.getLecturerCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        Role role = roleRepository.findByName("ROLE_LECTURER")
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

        Lecturer lecturer = Lecturer.builder()
                .user(user)
                .lecturerCode(dto.getLecturerCode().trim())
                .departmentId(department.getId())
                .academicDegree(dto.getAcademicDegree().trim())
                .researchInterests(dto.getResearchInterests())
                .maxThesisQuota(dto.getMaxThesisQuota() != null ? dto.getMaxThesisQuota() : 5)
                .build();
        lecturer = lecturerRepository.save(lecturer);
        if (lecturerDirectionSyncHelper != null) {
            lecturerDirectionSyncHelper.syncLecturerDirections(lecturer);
        }

        return toResponseDTO(lecturer);
    }

    @Transactional
    public LecturerResponseDTO updateLecturer(Long id, UpdateLecturerRequestDTO dto) {
        Lecturer lecturer = lecturerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LECTURER_NOT_FOUND));

        if (dto.getDepartmentId() != null) {
            if (!departmentRepository.existsById(dto.getDepartmentId())) {
                throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
            }
            lecturer.setDepartmentId(dto.getDepartmentId());
        }

        if (StringUtils.hasText(dto.getAcademicDegree())) {
            lecturer.setAcademicDegree(dto.getAcademicDegree().trim());
        }
        if (dto.getResearchInterests() != null) {
            lecturer.setResearchInterests(dto.getResearchInterests().trim());
        }
        if (dto.getMaxThesisQuota() != null) {
            lecturer.setMaxThesisQuota(dto.getMaxThesisQuota());
        }

        User user = lecturer.getUser();
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

        lecturer = lecturerRepository.save(lecturer);
        if (lecturerDirectionSyncHelper != null) {
            lecturerDirectionSyncHelper.syncLecturerDirections(lecturer);
        }
        return toResponseDTO(lecturer);
    }

    @Transactional
    public LecturerResponseDTO updateMyResearchInterests(Long userId, UpdateResearchInterestsDTO dto) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.LECTURER_NOT_FOUND));

        lecturer.setResearchInterests(dto.getResearchInterests().trim());
        lecturer = lecturerRepository.save(lecturer);
        if (lecturerDirectionSyncHelper != null) {
            lecturerDirectionSyncHelper.syncLecturerDirections(lecturer);
        }
        return toResponseDTO(lecturer);
    }

    @Transactional
    public void deleteLecturer(Long id) {
        Lecturer lecturer = lecturerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LECTURER_NOT_FOUND));

        if (lecturerCapacityRepository != null) {
            List<LecturerCapacity> caps = lecturerCapacityRepository.findByLecturerId(id);
            if (!caps.isEmpty()) {
                lecturerCapacityRepository.deleteAll(caps);
            }
        }

        User user = lecturer.getUser();
        lecturerRepository.delete(lecturer);
        if (user != null) {
            userRepository.delete(user);
        }
    }

    private LecturerResponseDTO toResponseDTO(Lecturer lecturer) {
        User user = lecturer.getUser();
        Department department = (lecturer.getDepartmentId() != null)
                ? departmentRepository.findById(lecturer.getDepartmentId()).orElse(null) : null;

        Long facultyId = null;
        String facultyName = null;
        String departmentName = null;

        if (department != null) {
            departmentName = department.getName();
            if (department.getFaculty() != null) {
                facultyId = department.getFaculty().getId();
                facultyName = department.getFaculty().getName();
            }
        }

        LecturerResponseDTO dto = LecturerResponseDTO.builder()
                .lecturerId(lecturer.getId())
                .userId(user != null ? user.getId() : null)
                .lecturerCode(lecturer.getLecturerCode())
                .fullName(user != null ? user.getFullName() : null)
                .email(user != null ? user.getEmail() : null)
                .phone(user != null ? user.getPhone() : null)
                .avatarUrl(user != null ? user.getAvatarUrl() : null)
                .academicDegree(lecturer.getAcademicDegree())
                .departmentId(lecturer.getDepartmentId())
                .departmentName(departmentName)
                .facultyId(facultyId)
                .facultyName(facultyName)
                .researchInterests(lecturer.getResearchInterests())
                .maxThesisQuota(lecturer.getMaxThesisQuota())
                .isActive(user != null ? user.getIsActive() : true)
                .build();

        if (lecturerCapacityRepository != null && projectRoundRepository != null && lecturer.getId() != null) {
            Map<Long, ProjectRound> roundMap = projectRoundRepository.findAll().stream()
                    .collect(Collectors.toMap(ProjectRound::getId, r -> r, (a, b) -> a));
            List<LecturerCapacity> caps = lecturerCapacityRepository.findByLecturerId(lecturer.getId());
            List<String> codes = new ArrayList<>();
            List<String> names = new ArrayList<>();
            for (LecturerCapacity cap : caps) {
                ProjectRound pr = roundMap.get(cap.getProjectRoundId());
                if (pr != null) {
                    codes.add(pr.getRoundCode());
                    names.add(pr.getName());
                }
            }
            dto.setProjectRoundCodes(codes);
            dto.setProjectRoundNames(names);
        }
        return dto;
    }

    private List<LecturerResponseDTO> mapLecturersWithRounds(List<Lecturer> lecturers) {
        if (lecturers == null || lecturers.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, List<String>> lecturerRoundCodeMap = new HashMap<>();
        Map<Long, List<String>> lecturerRoundNameMap = new HashMap<>();

        if (lecturerCapacityRepository != null && projectRoundRepository != null) {
            Map<Long, ProjectRound> roundMap = projectRoundRepository.findAll().stream()
                    .collect(Collectors.toMap(ProjectRound::getId, r -> r, (a, b) -> a));

            for (Lecturer l : lecturers) {
                List<LecturerCapacity> caps = lecturerCapacityRepository.findByLecturerId(l.getId());
                List<String> codes = new ArrayList<>();
                List<String> names = new ArrayList<>();
                for (LecturerCapacity cap : caps) {
                    ProjectRound pr = roundMap.get(cap.getProjectRoundId());
                    if (pr != null) {
                        codes.add(pr.getRoundCode());
                        names.add(pr.getName());
                    }
                }
                lecturerRoundCodeMap.put(l.getId(), codes);
                lecturerRoundNameMap.put(l.getId(), names);
            }
        }

        return lecturers.stream().map(l -> {
            LecturerResponseDTO dto = toResponseDTO(l);
            dto.setProjectRoundCodes(lecturerRoundCodeMap.getOrDefault(l.getId(), Collections.emptyList()));
            dto.setProjectRoundNames(lecturerRoundNameMap.getOrDefault(l.getId(), Collections.emptyList()));
            return dto;
        }).toList();
    }
}
