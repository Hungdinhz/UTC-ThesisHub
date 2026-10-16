package com.example.thesis_hub_api.assignment;

import com.example.thesis_hub_api.assignment.algorithm.*;
import com.example.thesis_hub_api.assignment.dto.*;
import com.example.thesis_hub_api.assignment.entity.*;
import com.example.thesis_hub_api.assignment.mapper.AssignmentMapper;
import com.example.thesis_hub_api.assignment.repository.*;
import com.example.thesis_hub_api.assignment.service.AssignmentServiceImpl;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.*;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Assignment Service Unit Tests")
class AssignmentServiceTest {

    @Mock private ProjectDirectionRepository directionRepository;
    @Mock private LecturerDirectionRepository lecturerDirectionRepository;
    @Mock private LecturerCapacityRepository capacityRepository;
    @Mock private DirectionRegistrationRepository registrationRepository;
    @Mock private PreferenceRepository preferenceRepository;
    @Mock private SupervisorAssignmentRepository assignmentRepository;

    @Mock private StudentRepository studentRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private ProjectRoundRepository projectRoundRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private TrainingProgramRepository trainingProgramRepository;

    @Spy private AssignmentMapper mapper = new AssignmentMapper();
    @Spy private AssignmentConstraints constraints = new AssignmentConstraints();
    @Mock private AssignmentAlgorithm algorithm;
    @Spy private CapacityCalculator capacityCalculator = new CapacityCalculator();
    @Mock private AssignmentOverrideManager overrideManager;

    @InjectMocks
    private AssignmentServiceImpl assignmentService;

    private Student mockStudent;
    private Lecturer mockLecturer1;
    private Lecturer mockLecturer2;
    private ProjectRound mockRound;
    private ProjectDirection mockDirection;

    @BeforeEach
    void setUp() {
        mockStudent = Student.builder()
                .id(1L)
                .studentCode("SV001")
                .trainingProgramId(1L)
                .user(User.builder().id(10L).fullName("Nguyễn Văn A").build())
                .build();

        mockLecturer1 = Lecturer.builder()
                .id(101L)
                .lecturerCode("GV001")
                .academicDegree("TIEN_SI")
                .user(User.builder().id(20L).fullName("TS. Trần Văn B").build())
                .build();

        mockLecturer2 = Lecturer.builder()
                .id(102L)
                .lecturerCode("GV002")
                .academicDegree("THAC_SI")
                .user(User.builder().id(21L).fullName("ThS. Lê Văn C").build())
                .build();

        mockRound = ProjectRound.builder()
                .id(50L)
                .roundCode("ROUND_2026")
                .build();

        mockDirection = ProjectDirection.builder()
                .id(5L)
                .code("HD_AI")
                .name("Trí tuệ nhân tạo")
                .build();
    }

    @Test
    @DisplayName("Submit preferences: duplicate preferences are rejected")
    void testSubmitPreferences_DuplicateLecturer_ThrowsException() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(mockStudent));
        when(projectRoundRepository.existsById(50L)).thenReturn(true);
        when(registrationRepository.findByStudentIdAndProjectRoundId(1L, 50L))
                .thenReturn(Optional.of(DirectionRegistration.builder().directionId(5L).build()));

        PreferenceSubmitRequestDTO request = PreferenceSubmitRequestDTO.builder()
                .studentId(1L)
                .projectRoundId(50L)
                .preferences(Arrays.asList(
                        PreferenceItemDTO.builder().priority(1).lecturerId(101L).build(),
                        PreferenceItemDTO.builder().priority(2).lecturerId(101L).build() // Duplicate lecturer
                ))
                .build();

        assertThrows(IllegalArgumentException.class, () -> assignmentService.submitPreferences(request, null));
    }

    @Test
    @DisplayName("Submit preferences: lecturer outside chosen direction is rejected")
    void testSubmitPreferences_LecturerNotInDirection_ThrowsException() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(mockStudent));
        when(projectRoundRepository.existsById(50L)).thenReturn(true);
        when(registrationRepository.findByStudentIdAndProjectRoundId(1L, 50L))
                .thenReturn(Optional.of(DirectionRegistration.builder().directionId(5L).build()));
        when(trainingProgramRepository.findById(1L))
                .thenReturn(Optional.of(TrainingProgram.builder().code("CU_NHAN").build()));
        when(lecturerRepository.findById(101L)).thenReturn(Optional.of(mockLecturer1));

        // Lecturer does not belong to direction 5
        when(lecturerDirectionRepository.existsByLecturerIdAndDirectionId(101L, 5L)).thenReturn(false);

        PreferenceSubmitRequestDTO request = PreferenceSubmitRequestDTO.builder()
                .studentId(1L)
                .projectRoundId(50L)
                .preferences(Collections.singletonList(
                        PreferenceItemDTO.builder().priority(1).lecturerId(101L).build()
                ))
                .build();

        assertThrows(IllegalArgumentException.class, () -> assignmentService.submitPreferences(request, null));
    }

    @Test
    @DisplayName("Submit preferences: engineering student choosing Master is rejected")
    void testSubmitPreferences_EngineeringDegreeViolation_ThrowsException() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(mockStudent));
        when(projectRoundRepository.existsById(50L)).thenReturn(true);
        when(registrationRepository.findByStudentIdAndProjectRoundId(1L, 50L))
                .thenReturn(Optional.of(DirectionRegistration.builder().directionId(5L).build()));
        // Student is Engineering program (KY_SU)
        when(trainingProgramRepository.findById(1L))
                .thenReturn(Optional.of(TrainingProgram.builder().code("KY_SU").build()));
        when(lecturerRepository.findById(102L)).thenReturn(Optional.of(mockLecturer2)); // THAC_SI
        when(lecturerDirectionRepository.existsByLecturerIdAndDirectionId(102L, 5L)).thenReturn(true);

        PreferenceSubmitRequestDTO request = PreferenceSubmitRequestDTO.builder()
                .studentId(1L)
                .projectRoundId(50L)
                .preferences(Collections.singletonList(
                        PreferenceItemDTO.builder().priority(1).lecturerId(102L).build()
                ))
                .build();

        assertThrows(IllegalArgumentException.class, () -> assignmentService.submitPreferences(request, null));
    }

    @Test
    @DisplayName("Manual Override flow: calls override manager and reloads proposal")
    void testOverrideAssignment() {
        SupervisorAssignment mockAssignment = SupervisorAssignment.builder()
                .id(99L)
                .studentId(1L)
                .lecturerId(102L)
                .projectRoundId(50L)
                .isOverridden(true)
                .status("OVERRIDDEN")
                .overrideReason("Điều chuyển theo quyết định Khoa")
                .build();

        when(overrideManager.executeOverride(eq(99L), eq(102L), eq("Điều chuyển theo quyết định Khoa"), any()))
                .thenReturn(mockAssignment);
        when(assignmentRepository.findByProjectRoundId(50L))
                .thenReturn(Collections.singletonList(mockAssignment));
        when(studentRepository.findAll()).thenReturn(Collections.singletonList(mockStudent));
        when(lecturerRepository.findAll()).thenReturn(Collections.singletonList(mockLecturer2));

        AssignmentOverrideRequestDTO req = AssignmentOverrideRequestDTO.builder()
                .newLecturerId(102L)
                .reason("Điều chuyển theo quyết định Khoa")
                .build();

        SupervisorAssignmentResponseDTO result = assignmentService.overrideAssignment(99L, req, 10L);

        assertNotNull(result);
        assertEquals(99L, result.getId());
        assertEquals("OVERRIDDEN", result.getStatus());
        assertTrue(result.getIsOverridden());
    }

    @Test
    @DisplayName("Finalize flow: updates all assignments to FINALIZED")
    void testFinalizeAssignments() {
        SupervisorAssignment sa = SupervisorAssignment.builder()
                .id(1L)
                .projectRoundId(50L)
                .status("PROPOSED")
                .matchedPriority(1)
                .build();

        when(assignmentRepository.findByProjectRoundId(50L))
                .thenReturn(Collections.singletonList(sa));
        when(registrationRepository.findByProjectRoundId(50L))
                .thenReturn(Collections.singletonList(DirectionRegistration.builder().build()));
        when(capacityRepository.findByProjectRoundId(50L))
                .thenReturn(Collections.singletonList(LecturerCapacity.builder().maxQuota(5).build()));

        AssignmentFinalizeRequestDTO req = AssignmentFinalizeRequestDTO.builder()
                .projectRoundId(50L)
                .note("Chốt phân công chính thức đợt 1")
                .build();

        AssignmentStatsResponseDTO stats = assignmentService.finalizeAssignments(req, 10L);

        assertNotNull(stats);
        assertEquals(1, stats.getFinalizedCount());
        assertEquals("FINALIZED", sa.getStatus());
        verify(assignmentRepository, atLeastOnce()).save(sa);
    }
}
