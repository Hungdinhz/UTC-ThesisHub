package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.dto.PreferenceItemDto;
import com.example.thesis_hub_api.assignment.dto.PreferenceSubmitDto;
import com.example.thesis_hub_api.assignment.dto.RegistrationResponseDto;
import com.example.thesis_hub_api.assignment.entity.DirectionRegistration;
import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import com.example.thesis_hub_api.assignment.mapper.DirectionRegistrationMapper;
import com.example.thesis_hub_api.assignment.mapper.ProjectDirectionMapper;
import com.example.thesis_hub_api.assignment.repository.DirectionRegistrationRepository;
import com.example.thesis_hub_api.assignment.repository.LecturerDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.PreferenceRepository;
import com.example.thesis_hub_api.assignment.repository.ProjectDirectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DirectionRegistrationServiceTest {

    @Mock private ProjectDirectionRepository projectDirectionRepository;
    @Mock private LecturerDirectionRepository lecturerDirectionRepository;
    @Mock private DirectionRegistrationRepository registrationRepository;
    @Mock private PreferenceRepository preferenceRepository;
    @Mock private IdentitySharedService identitySharedService;
    @Mock private ProjectDirectionMapper projectDirectionMapper;
    @Mock private DirectionRegistrationMapper registrationMapper;

    @InjectMocks
    private DirectionRegistrationService service;

    private PreferenceSubmitDto validDto;
    private ProjectDirection validDirection;

    @BeforeEach
    void setUp() {
        validDto = new PreferenceSubmitDto();
        validDto.setProjectDirectionId(1);
        validDto.setPreferences(Arrays.asList(
                new PreferenceItemDto(10, 1),
                new PreferenceItemDto(20, 2),
                new PreferenceItemDto(30, 3)
        ));

        validDirection = new ProjectDirection();
        validDirection.setId(1);
        validDirection.setProjectRoundId(100);
    }

    // 1. Đăng ký hợp lệ với đủ 3 nguyện vọng → thành công.
    @Test
    void submitPreferences_Valid_Success() {
        when(identitySharedService.verifyRole(1, "STUDENT")).thenReturn(true);
        when(projectDirectionRepository.findById(1)).thenReturn(Optional.of(validDirection));
        when(registrationRepository.findByStudentIdAndProjectRoundId(1, 100)).thenReturn(Optional.empty());
        when(identitySharedService.getStudentProgram(1)).thenReturn("Cử nhân");
        when(lecturerDirectionRepository.existsByLecturerIdAndProjectDirectionId(anyInt(), eq(1))).thenReturn(true);
        
        when(registrationRepository.save(any())).thenAnswer(i -> {
            DirectionRegistration reg = i.getArgument(0);
            reg.setId(99);
            return reg;
        });

        service.submitPreferences(1, validDto);

        verify(registrationRepository).save(any());
        verify(preferenceRepository).saveAll(any());
    }

    // 2. Thiếu nguyện vọng (chỉ có NV1, NV2) → bị từ chối.
    @Test
    void submitPreferences_MissingPreferences_ThrowsException() {
        validDto.setPreferences(Arrays.asList(new PreferenceItemDto(10, 1), new PreferenceItemDto(20, 2)));

        when(identitySharedService.verifyRole(1, "STUDENT")).thenReturn(true);
        when(projectDirectionRepository.findById(1)).thenReturn(Optional.of(validDirection));
        when(registrationRepository.findByStudentIdAndProjectRoundId(1, 100)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.submitPreferences(1, validDto));
    }

    // 3. Trùng giảng viên giữa các nguyện vọng → bị từ chối.
    @Test
    void submitPreferences_DuplicateLecturers_ThrowsException() {
        validDto.setPreferences(Arrays.asList(
                new PreferenceItemDto(10, 1),
                new PreferenceItemDto(10, 2),
                new PreferenceItemDto(30, 3)
        ));

        when(identitySharedService.verifyRole(1, "STUDENT")).thenReturn(true);
        when(projectDirectionRepository.findById(1)).thenReturn(Optional.of(validDirection));
        when(registrationRepository.findByStudentIdAndProjectRoundId(1, 100)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.submitPreferences(1, validDto));
    }

    // 4. Giảng viên không thuộc hướng đã chọn → bị từ chối.
    @Test
    void submitPreferences_LecturerNotInDirection_ThrowsException() {
        when(identitySharedService.verifyRole(1, "STUDENT")).thenReturn(true);
        when(projectDirectionRepository.findById(1)).thenReturn(Optional.of(validDirection));
        when(registrationRepository.findByStudentIdAndProjectRoundId(1, 100)).thenReturn(Optional.empty());
        when(identitySharedService.getStudentProgram(1)).thenReturn("Cử nhân");

        // Giả sử giảng viên 10 không thuộc hướng đồ án
        when(lecturerDirectionRepository.existsByLecturerIdAndProjectDirectionId(10, 1)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> service.submitPreferences(1, validDto));
    }

    // 5. Sinh viên chương trình Kỹ sư chọn giảng viên chưa đạt học vị tối thiểu → bị từ chối.
    @Test
    void submitPreferences_EngineerProgram_LecturerNotQualified_ThrowsException() {
        when(identitySharedService.verifyRole(1, "STUDENT")).thenReturn(true);
        when(projectDirectionRepository.findById(1)).thenReturn(Optional.of(validDirection));
        when(registrationRepository.findByStudentIdAndProjectRoundId(1, 100)).thenReturn(Optional.empty());
        
        when(identitySharedService.getStudentProgram(1)).thenReturn("Kỹ sư");
        when(lecturerDirectionRepository.existsByLecturerIdAndProjectDirectionId(anyInt(), eq(1))).thenReturn(true);
        
        // Giảng viên 10 chỉ có bằng Cử nhân
        when(identitySharedService.getLecturerDegree(10)).thenReturn("Cử nhân");

        assertThrows(IllegalArgumentException.class, () -> service.submitPreferences(1, validDto));
    }

    // 6. Sinh viên chương trình Cử nhân chọn giảng viên bất kỳ đạt điều kiện hướng → thành công.
    @Test
    void submitPreferences_BachelorProgram_AnyLecturer_Success() {
        when(identitySharedService.verifyRole(1, "STUDENT")).thenReturn(true);
        when(projectDirectionRepository.findById(1)).thenReturn(Optional.of(validDirection));
        when(registrationRepository.findByStudentIdAndProjectRoundId(1, 100)).thenReturn(Optional.empty());
        
        when(identitySharedService.getStudentProgram(1)).thenReturn("Cử nhân");
        when(lecturerDirectionRepository.existsByLecturerIdAndProjectDirectionId(anyInt(), eq(1))).thenReturn(true);
        
        when(registrationRepository.save(any())).thenAnswer(i -> {
            DirectionRegistration reg = i.getArgument(0);
            reg.setId(99);
            return reg;
        });

        assertDoesNotThrow(() -> service.submitPreferences(1, validDto));
    }

    // 7. Sinh viên đã đăng ký (status LOCKED) cố đăng ký lại → bị từ chối.
    @Test
    void submitPreferences_AlreadyLocked_ThrowsException() {
        when(identitySharedService.verifyRole(1, "STUDENT")).thenReturn(true);
        when(projectDirectionRepository.findById(1)).thenReturn(Optional.of(validDirection));
        
        DirectionRegistration existingReg = new DirectionRegistration();
        existingReg.setStatus("LOCKED");
        when(registrationRepository.findByStudentIdAndProjectRoundId(1, 100)).thenReturn(Optional.of(existingReg));

        assertThrows(IllegalStateException.class, () -> service.submitPreferences(1, validDto));
    }
}
