package com.example.thesis_hub_api.organization.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.organization.dto.request.*;
import com.example.thesis_hub_api.organization.dto.response.*;
import com.example.thesis_hub_api.organization.entity.*;
import com.example.thesis_hub_api.organization.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final TrainingProgramRepository trainingProgramRepository;

    // ─── FACULTIES ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<FacultyResponseDTO> getAllFaculties() {
        return facultyRepository.findAll().stream()
                .map(f -> {
                    int deptCount = departmentRepository.findByFacultyId(f.getId()).size();
                    return FacultyResponseDTO.builder()
                            .id(f.getId())
                            .code(f.getCode())
                            .name(f.getName())
                            .description(f.getDescription())
                            .departmentCount(deptCount)
                            .createdAt(f.getCreatedAt())
                            .updatedAt(f.getUpdatedAt())
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public FacultyResponseDTO getFacultyById(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        int deptCount = departmentRepository.findByFacultyId(faculty.getId()).size();
        return FacultyResponseDTO.builder()
                .id(faculty.getId())
                .code(faculty.getCode())
                .name(faculty.getName())
                .description(faculty.getDescription())
                .departmentCount(deptCount)
                .createdAt(faculty.getCreatedAt())
                .updatedAt(faculty.getUpdatedAt())
                .build();
    }

    @Transactional
    public FacultyResponseDTO createFaculty(FacultyRequestDTO dto) {
        if (facultyRepository.existsByCode(dto.getCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        Faculty faculty = Faculty.builder()
                .code(dto.getCode().trim())
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .build();
        faculty = facultyRepository.save(faculty);

        return FacultyResponseDTO.builder()
                .id(faculty.getId())
                .code(faculty.getCode())
                .name(faculty.getName())
                .description(faculty.getDescription())
                .departmentCount(0)
                .createdAt(faculty.getCreatedAt())
                .updatedAt(faculty.getUpdatedAt())
                .build();
    }

    @Transactional
    public FacultyResponseDTO updateFaculty(Long id, FacultyRequestDTO dto) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!faculty.getCode().equalsIgnoreCase(dto.getCode().trim()) && facultyRepository.existsByCode(dto.getCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        faculty.setCode(dto.getCode().trim());
        faculty.setName(dto.getName().trim());
        faculty.setDescription(dto.getDescription());
        faculty = facultyRepository.save(faculty);

        int deptCount = departmentRepository.findByFacultyId(faculty.getId()).size();
        return FacultyResponseDTO.builder()
                .id(faculty.getId())
                .code(faculty.getCode())
                .name(faculty.getName())
                .description(faculty.getDescription())
                .departmentCount(deptCount)
                .createdAt(faculty.getCreatedAt())
                .updatedAt(faculty.getUpdatedAt())
                .build();
    }

    @Transactional
    public void deleteFaculty(Long id) {
        if (!facultyRepository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        facultyRepository.deleteById(id);
    }

    // ─── DEPARTMENTS ───────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DepartmentResponseDTO> getDepartments(Long facultyId) {
        List<Department> list = (facultyId != null) 
                ? departmentRepository.findByFacultyId(facultyId)
                : departmentRepository.findAll();

        return list.stream()
                .map(d -> DepartmentResponseDTO.builder()
                        .id(d.getId())
                        .facultyId(d.getFaculty() != null ? d.getFaculty().getId() : null)
                        .facultyName(d.getFaculty() != null ? d.getFaculty().getName() : null)
                        .code(d.getCode())
                        .name(d.getName())
                        .description(d.getDescription())
                        .createdAt(d.getCreatedAt())
                        .updatedAt(d.getUpdatedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponseDTO getDepartmentById(Long id) {
        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        return DepartmentResponseDTO.builder()
                .id(d.getId())
                .facultyId(d.getFaculty() != null ? d.getFaculty().getId() : null)
                .facultyName(d.getFaculty() != null ? d.getFaculty().getName() : null)
                .code(d.getCode())
                .name(d.getName())
                .description(d.getDescription())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    @Transactional
    public DepartmentResponseDTO createDepartment(DepartmentRequestDTO dto) {
        if (departmentRepository.existsByCode(dto.getCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        Department department = Department.builder()
                .faculty(faculty)
                .code(dto.getCode().trim())
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .build();
        department = departmentRepository.save(department);

        return DepartmentResponseDTO.builder()
                .id(department.getId())
                .facultyId(faculty.getId())
                .facultyName(faculty.getName())
                .code(department.getCode())
                .name(department.getName())
                .description(department.getDescription())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }

    @Transactional
    public DepartmentResponseDTO updateDepartment(Long id, DepartmentRequestDTO dto) {
        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!d.getCode().equalsIgnoreCase(dto.getCode().trim()) && departmentRepository.existsByCode(dto.getCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        if (dto.getFacultyId() != null && (d.getFaculty() == null || !d.getFaculty().getId().equals(dto.getFacultyId()))) {
            Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
            d.setFaculty(faculty);
        }

        d.setCode(dto.getCode().trim());
        d.setName(dto.getName().trim());
        d.setDescription(dto.getDescription());
        d = departmentRepository.save(d);

        return DepartmentResponseDTO.builder()
                .id(d.getId())
                .facultyId(d.getFaculty() != null ? d.getFaculty().getId() : null)
                .facultyName(d.getFaculty() != null ? d.getFaculty().getName() : null)
                .code(d.getCode())
                .name(d.getName())
                .description(d.getDescription())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        departmentRepository.deleteById(id);
    }

    // ─── MAJORS ────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MajorResponseDTO> getMajors(Long facultyId, Long departmentId) {
        List<Major> list;
        if (departmentId != null) {
            list = majorRepository.findByDepartmentId(departmentId);
        } else if (facultyId != null) {
            list = majorRepository.findByFacultyId(facultyId);
        } else {
            list = majorRepository.findAll();
        }

        return list.stream()
                .map(m -> MajorResponseDTO.builder()
                        .id(m.getId())
                        .facultyId(m.getFaculty() != null ? m.getFaculty().getId() : null)
                        .facultyName(m.getFaculty() != null ? m.getFaculty().getName() : null)
                        .departmentId(m.getDepartment() != null ? m.getDepartment().getId() : null)
                        .departmentName(m.getDepartment() != null ? m.getDepartment().getName() : null)
                        .code(m.getCode())
                        .name(m.getName())
                        .description(m.getDescription())
                        .createdAt(m.getCreatedAt())
                        .updatedAt(m.getUpdatedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public MajorResponseDTO getMajorById(Long id) {
        Major m = majorRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        return MajorResponseDTO.builder()
                .id(m.getId())
                .facultyId(m.getFaculty() != null ? m.getFaculty().getId() : null)
                .facultyName(m.getFaculty() != null ? m.getFaculty().getName() : null)
                .departmentId(m.getDepartment() != null ? m.getDepartment().getId() : null)
                .departmentName(m.getDepartment() != null ? m.getDepartment().getName() : null)
                .code(m.getCode())
                .name(m.getName())
                .description(m.getDescription())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    @Transactional
    public MajorResponseDTO createMajor(MajorRequestDTO dto) {
        if (majorRepository.existsByCode(dto.getCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        Faculty faculty = (dto.getFacultyId() != null) 
                ? facultyRepository.findById(dto.getFacultyId()).orElse(null) : null;
        Department department = (dto.getDepartmentId() != null) 
                ? departmentRepository.findById(dto.getDepartmentId()).orElse(null) : null;

        Major major = Major.builder()
                .faculty(faculty)
                .department(department)
                .code(dto.getCode().trim())
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .build();
        major = majorRepository.save(major);

        return MajorResponseDTO.builder()
                .id(major.getId())
                .facultyId(faculty != null ? faculty.getId() : null)
                .facultyName(faculty != null ? faculty.getName() : null)
                .departmentId(department != null ? department.getId() : null)
                .departmentName(department != null ? department.getName() : null)
                .code(major.getCode())
                .name(major.getName())
                .description(major.getDescription())
                .createdAt(major.getCreatedAt())
                .updatedAt(major.getUpdatedAt())
                .build();
    }

    @Transactional
    public MajorResponseDTO updateMajor(Long id, MajorRequestDTO dto) {
        Major m = majorRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!m.getCode().equalsIgnoreCase(dto.getCode().trim()) && majorRepository.existsByCode(dto.getCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        if (dto.getFacultyId() != null) {
            Faculty f = facultyRepository.findById(dto.getFacultyId()).orElse(null);
            m.setFaculty(f);
        }
        if (dto.getDepartmentId() != null) {
            Department d = departmentRepository.findById(dto.getDepartmentId()).orElse(null);
            m.setDepartment(d);
        }

        m.setCode(dto.getCode().trim());
        m.setName(dto.getName().trim());
        m.setDescription(dto.getDescription());
        m = majorRepository.save(m);

        return MajorResponseDTO.builder()
                .id(m.getId())
                .facultyId(m.getFaculty() != null ? m.getFaculty().getId() : null)
                .facultyName(m.getFaculty() != null ? m.getFaculty().getName() : null)
                .departmentId(m.getDepartment() != null ? m.getDepartment().getId() : null)
                .departmentName(m.getDepartment() != null ? m.getDepartment().getName() : null)
                .code(m.getCode())
                .name(m.getName())
                .description(m.getDescription())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    // ─── TRAINING PROGRAMS ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<TrainingProgramResponseDTO> getAllTrainingPrograms() {
        return trainingProgramRepository.findAll().stream()
                .map(tp -> TrainingProgramResponseDTO.builder()
                        .id(tp.getId())
                        .code(tp.getCode())
                        .name(tp.getName())
                        .durationYears(tp.getDurationYears())
                        .totalCredits(tp.getTotalCredits())
                        .description(tp.getDescription())
                        .createdAt(tp.getCreatedAt())
                        .updatedAt(tp.getUpdatedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public TrainingProgramResponseDTO getTrainingProgramById(Long id) {
        TrainingProgram tp = trainingProgramRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        return TrainingProgramResponseDTO.builder()
                .id(tp.getId())
                .code(tp.getCode())
                .name(tp.getName())
                .durationYears(tp.getDurationYears())
                .totalCredits(tp.getTotalCredits())
                .description(tp.getDescription())
                .createdAt(tp.getCreatedAt())
                .updatedAt(tp.getUpdatedAt())
                .build();
    }

    @Transactional
    public TrainingProgramResponseDTO createTrainingProgram(TrainingProgramRequestDTO dto) {
        if (trainingProgramRepository.existsByCode(dto.getCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        TrainingProgram tp = TrainingProgram.builder()
                .code(dto.getCode().trim())
                .name(dto.getName().trim())
                .durationYears(dto.getDurationYears())
                .totalCredits(dto.getTotalCredits())
                .description(dto.getDescription())
                .build();
        tp = trainingProgramRepository.save(tp);

        return TrainingProgramResponseDTO.builder()
                .id(tp.getId())
                .code(tp.getCode())
                .name(tp.getName())
                .durationYears(tp.getDurationYears())
                .totalCredits(tp.getTotalCredits())
                .description(tp.getDescription())
                .createdAt(tp.getCreatedAt())
                .updatedAt(tp.getUpdatedAt())
                .build();
    }

    @Transactional
    public TrainingProgramResponseDTO updateTrainingProgram(Long id, TrainingProgramRequestDTO dto) {
        TrainingProgram tp = trainingProgramRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!tp.getCode().equalsIgnoreCase(dto.getCode().trim()) && trainingProgramRepository.existsByCode(dto.getCode().trim())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        tp.setCode(dto.getCode().trim());
        tp.setName(dto.getName().trim());
        tp.setDurationYears(dto.getDurationYears());
        tp.setTotalCredits(dto.getTotalCredits());
        tp.setDescription(dto.getDescription());
        tp = trainingProgramRepository.save(tp);

        return TrainingProgramResponseDTO.builder()
                .id(tp.getId())
                .code(tp.getCode())
                .name(tp.getName())
                .durationYears(tp.getDurationYears())
                .totalCredits(tp.getTotalCredits())
                .description(tp.getDescription())
                .createdAt(tp.getCreatedAt())
                .updatedAt(tp.getUpdatedAt())
                .build();
    }
}
