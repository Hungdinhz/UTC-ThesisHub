package com.example.thesis_hub_api.chat;

import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.repository.ProjectDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import com.example.thesis_hub_api.chat.dto.ChatMessageResponseDTO;
import com.example.thesis_hub_api.chat.dto.ChatRoomResponseDTO;
import com.example.thesis_hub_api.chat.dto.SendChatMessageRequestDTO;
import com.example.thesis_hub_api.chat.entity.ChatMessage;
import com.example.thesis_hub_api.chat.repository.ChatMessageRepository;
import com.example.thesis_hub_api.chat.service.ChatService;
import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.Department;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.DepartmentRepository;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.thesis.entity.Proposal;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ProposalRepository;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Chat Service Unit Tests")
class ChatServiceTest {

    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private SupervisorAssignmentRepository supervisorAssignmentRepository;
    @Mock private ThesisRepository thesisRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private ProjectRoundRepository projectRoundRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private UserRepository userRepository;
    @Mock private StudentProjectRoundRepository studentProjectRoundRepository;
    @Mock private ProjectDirectionRepository projectDirectionRepository;
    @Mock private DepartmentRepository departmentRepository;

    @InjectMocks
    private ChatService chatService;

    private ProjectRound round;
    private Lecturer lec1;
    private Lecturer lec2;
    private Student stu1;
    private Student stu2;
    private Student stu3;
    private Student stu4;
    private Department dept;
    private ProjectDirection dir;

    @BeforeEach
    void setUp() {
        round = ProjectRound.builder()
                .id(1L)
                .roundCode("DA_K63_HK1")
                .name("Đợt Đồ án K63 - HK1")
                .status("IN_PROGRESS")
                .build();

        dept = Department.builder()
                .id(10L)
                .code("CNPM")
                .name("Bộ môn Công nghệ phần mềm")
                .build();

        dir = ProjectDirection.builder()
                .id(20L)
                .code("HD_PM_APP")
                .name("Phát triển phần mềm và ứng dụng")
                .build();

        lec1 = Lecturer.builder()
                .id(10L)
                .lecturerCode("GV001")
                .academicDegree("TIEN_SI")
                .departmentId(10L)
                .user(User.builder().id(101L).username("gv001").fullName("TS. Nguyễn Văn A").email("gva@utc.edu.vn").phone("0901111111").build())
                .build();

        lec2 = Lecturer.builder()
                .id(11L)
                .lecturerCode("GV002")
                .academicDegree("PGS")
                .departmentId(10L)
                .user(User.builder().id(102L).username("gv002").fullName("PGS.TS. Trần Văn B").email("gvb@utc.edu.vn").phone("0902222222").build())
                .build();

        stu1 = Student.builder()
                .id(1L)
                .studentCode("221200001")
                .className("CNTT1-K63")
                .user(User.builder().id(201L).username("sv1").fullName("Sinh Viên Một").email("sv1@utc.edu.vn").build())
                .build();

        stu2 = Student.builder()
                .id(2L)
                .studentCode("221200002")
                .className("CNTT1-K63")
                .user(User.builder().id(202L).username("sv2").fullName("Sinh Viên Hai").email("sv2@utc.edu.vn").build())
                .build();

        stu3 = Student.builder()
                .id(3L)
                .studentCode("221200003")
                .className("CNTT2-K63")
                .user(User.builder().id(203L).username("sv3").fullName("Sinh Viên Ba").email("sv3@utc.edu.vn").build())
                .build();

        stu4 = Student.builder()
                .id(4L)
                .studentCode("221200004")
                .className("CNTT3-K63")
                .user(User.builder().id(204L).username("sv4").fullName("Sinh Viên Bốn").email("sv4@utc.edu.vn").build())
                .build();
    }

    @Test
    @DisplayName("Lecturer and assigned students (FINALIZED, OVERRIDDEN, PROPOSED) see the exact same group chat")
    void testGetMyRooms_LecturerAndAssignedStudentsSeeSameRoom() {
        when(projectRoundRepository.findAll()).thenReturn(List.of(round));
        when(projectDirectionRepository.findAll()).thenReturn(List.of(dir));
        when(departmentRepository.findAll()).thenReturn(List.of(dept));
        when(studentProjectRoundRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());

        List<SupervisorAssignment> assignments = List.of(
                SupervisorAssignment.builder().studentId(1L).lecturerId(10L).projectRoundId(1L).directionId(20L).status("FINALIZED").build(),
                SupervisorAssignment.builder().studentId(2L).lecturerId(10L).projectRoundId(1L).directionId(20L).status("OVERRIDDEN").build(),
                SupervisorAssignment.builder().studentId(3L).lecturerId(10L).projectRoundId(1L).directionId(20L).status("PROPOSED").build(),
                SupervisorAssignment.builder().studentId(4L).lecturerId(11L).projectRoundId(1L).directionId(20L).status("FINALIZED").build()
        );
        when(supervisorAssignmentRepository.findByProjectRoundId(1L)).thenReturn(assignments);

        Thesis thesis1 = Thesis.builder()
                .id(100L)
                .projectRound(round)
                .student(stu1)
                .lecturer(lec1)
                .titleVn("Hệ thống quản lý đồ án")
                .status("IN_PROGRESS")
                .build();
        when(thesisRepository.findByProjectRoundId(1L)).thenReturn(List.of(thesis1));
        when(proposalRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());

        when(lecturerRepository.findById(10L)).thenReturn(Optional.of(lec1));
        when(lecturerRepository.findById(11L)).thenReturn(Optional.of(lec2));
        when(studentRepository.findByIdIn(argThat(c -> c != null && c.contains(1L) && c.size() == 3)))
                .thenReturn(List.of(stu1, stu2, stu3));
        when(studentRepository.findByIdIn(argThat(c -> c != null && c.contains(4L) && c.size() == 1)))
                .thenReturn(List.of(stu4));

        when(chatMessageRepository.findTopByProjectRoundIdAndLecturerIdOrderByCreatedAtDescIdDesc(anyLong(), anyLong()))
                .thenReturn(Optional.empty());
        when(chatMessageRepository.countByProjectRoundIdAndLecturerId(anyLong(), anyLong())).thenReturn(0L);

        // Lecturer 1 sees 1 room with 3 students
        when(lecturerRepository.findByUserId(101L)).thenReturn(Optional.of(lec1));
        when(studentRepository.findByUserId(101L)).thenReturn(Optional.empty());
        List<ChatRoomResponseDTO> lecRooms = chatService.getMyRooms(101L);

        assertEquals(1, lecRooms.size());
        ChatRoomResponseDTO room = lecRooms.get(0);
        assertEquals(10L, room.getLecturerId());
        assertEquals("GV001", room.getLecturerCode());
        assertEquals("Bộ môn Công nghệ phần mềm", room.getDepartmentName());
        assertEquals(3, room.getStudentCount());
        assertEquals(4, room.getMembers().size()); // 1 GVHD + 3 SV
        assertEquals("Hệ thống quản lý đồ án", room.getMembers().get(1).getThesisTitle());
        assertEquals("Phát triển phần mềm và ứng dụng", room.getMembers().get(1).getDirectionName());

        // Student 2 (OVERRIDDEN) sees the exact same room
        when(lecturerRepository.findByUserId(202L)).thenReturn(Optional.empty());
        when(studentRepository.findByUserId(202L)).thenReturn(Optional.of(stu2));
        List<ChatRoomResponseDTO> stu2Rooms = chatService.getMyRooms(202L);
        assertEquals(1, stu2Rooms.size());
        assertEquals("1-10", stu2Rooms.get(0).getRoomKey());
        assertEquals(3, stu2Rooms.get(0).getStudentCount());

        // Student 4 (assigned to Lec 2) sees only Lec 2's room with 1 student
        when(lecturerRepository.findByUserId(204L)).thenReturn(Optional.empty());
        when(studentRepository.findByUserId(204L)).thenReturn(Optional.of(stu4));
        List<ChatRoomResponseDTO> stu4Rooms = chatService.getMyRooms(204L);
        assertEquals(1, stu4Rooms.size());
        assertEquals("1-11", stu4Rooms.get(0).getRoomKey());
        assertEquals(1, stu4Rooms.get(0).getStudentCount());
    }

    @Test
    @DisplayName("DROPPED, INELIGIBLE and un-assigned demo Thesis/Proposal rows do not leak into finalized rooms")
    void testGetMyRooms_ExcludesDroppedIneligibleAndDemoLeaks() {
        when(projectRoundRepository.findAll()).thenReturn(List.of(round));
        when(projectDirectionRepository.findAll()).thenReturn(Collections.emptyList());
        when(departmentRepository.findAll()).thenReturn(Collections.emptyList());

        List<StudentProjectRound> sprs = List.of(
                StudentProjectRound.builder().student(stu1).projectRound(round).status("ASSIGNED").build(),
                StudentProjectRound.builder().student(stu2).projectRound(round).status("DROPPED").build(),
                StudentProjectRound.builder().student(stu3).projectRound(round).status("INELIGIBLE").build()
        );
        when(studentProjectRoundRepository.findByProjectRoundId(1L)).thenReturn(sprs);

        List<SupervisorAssignment> assignments = List.of(
                SupervisorAssignment.builder().studentId(1L).lecturerId(10L).projectRoundId(1L).status("FINALIZED").build(),
                SupervisorAssignment.builder().studentId(2L).lecturerId(10L).projectRoundId(1L).status("FINALIZED").build(),
                SupervisorAssignment.builder().studentId(3L).lecturerId(10L).projectRoundId(1L).status("FINALIZED").build()
        );
        when(supervisorAssignmentRepository.findByProjectRoundId(1L)).thenReturn(assignments);

        // Demo thesis for stu4 pointing to lec1 without supervisor_assignment in finalized round
        Thesis demoLeak = Thesis.builder()
                .id(99L)
                .projectRound(round)
                .student(stu4)
                .lecturer(lec1)
                .titleVn("Demo Thesis")
                .status("IN_PROGRESS")
                .build();
        when(thesisRepository.findByProjectRoundId(1L)).thenReturn(List.of(demoLeak));
        when(proposalRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());

        when(lecturerRepository.findById(10L)).thenReturn(Optional.of(lec1));
        when(studentRepository.findByIdIn(argThat(c -> c != null && c.size() == 1 && c.contains(1L))))
                .thenReturn(List.of(stu1));
        when(chatMessageRepository.findTopByProjectRoundIdAndLecturerIdOrderByCreatedAtDescIdDesc(1L, 10L))
                .thenReturn(Optional.empty());
        when(chatMessageRepository.countByProjectRoundIdAndLecturerId(1L, 10L)).thenReturn(0L);

        when(lecturerRepository.findByUserId(101L)).thenReturn(Optional.of(lec1));
        when(studentRepository.findByUserId(101L)).thenReturn(Optional.empty());
        List<ChatRoomResponseDTO> lecRooms = chatService.getMyRooms(101L);

        assertEquals(1, lecRooms.size());
        assertEquals(1, lecRooms.get(0).getStudentCount());
        assertEquals("221200001", lecRooms.get(0).getMembers().get(1).getCode());

        // Student 4 (demo leak) sees 0 rooms
        when(lecturerRepository.findByUserId(204L)).thenReturn(Optional.empty());
        when(studentRepository.findByUserId(204L)).thenReturn(Optional.of(stu4));
        List<ChatRoomResponseDTO> stu4Rooms = chatService.getMyRooms(204L);
        assertTrue(stu4Rooms.isEmpty());
    }

    @Test
    @DisplayName("Student sees room when only active Proposal exists in non-finalized round")
    void testGetMyRooms_ProposalOnlyFallbackForBothLecturerAndStudent() {
        when(projectRoundRepository.findAll()).thenReturn(List.of(round));
        when(projectDirectionRepository.findAll()).thenReturn(Collections.emptyList());
        when(departmentRepository.findAll()).thenReturn(Collections.emptyList());
        when(studentProjectRoundRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());
        when(supervisorAssignmentRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());
        when(thesisRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());

        Proposal prop = Proposal.builder()
                .id(55L)
                .projectRound(round)
                .student(stu1)
                .lecturer(lec1)
                .titleVn("Đề cương AI")
                .status("SUBMITTED")
                .build();
        when(proposalRepository.findByProjectRoundId(1L)).thenReturn(List.of(prop));

        when(lecturerRepository.findById(10L)).thenReturn(Optional.of(lec1));
        when(studentRepository.findByIdIn(any())).thenReturn(List.of(stu1));
        when(chatMessageRepository.findTopByProjectRoundIdAndLecturerIdOrderByCreatedAtDescIdDesc(1L, 10L))
                .thenReturn(Optional.empty());
        when(chatMessageRepository.countByProjectRoundIdAndLecturerId(1L, 10L)).thenReturn(0L);

        when(lecturerRepository.findByUserId(201L)).thenReturn(Optional.empty());
        when(studentRepository.findByUserId(201L)).thenReturn(Optional.of(stu1));
        List<ChatRoomResponseDTO> rooms = chatService.getMyRooms(201L);

        assertEquals(1, rooms.size());
        assertEquals(1, rooms.get(0).getStudentCount());
        assertEquals("Đề cương AI", rooms.get(0).getMembers().get(1).getThesisTitle());
    }

    @Test
    @DisplayName("Sending, reading, deleting messages enforces room membership and ownership")
    void testSendReadAndDeleteMessages_Permissions() {
        when(projectDirectionRepository.findAll()).thenReturn(Collections.emptyList());
        when(studentProjectRoundRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());
        when(supervisorAssignmentRepository.findByProjectRoundId(1L)).thenReturn(List.of(
                SupervisorAssignment.builder().studentId(1L).lecturerId(10L).projectRoundId(1L).status("FINALIZED").build(),
                SupervisorAssignment.builder().studentId(2L).lecturerId(10L).projectRoundId(1L).status("FINALIZED").build(),
                SupervisorAssignment.builder().studentId(4L).lecturerId(11L).projectRoundId(1L).status("FINALIZED").build()
        ));
        when(thesisRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());
        when(proposalRepository.findByProjectRoundId(1L)).thenReturn(Collections.emptyList());

        // Student 4 (assigned to lec 11) is blocked from room (1, 10)
        when(lecturerRepository.findByUserId(204L)).thenReturn(Optional.empty());
        when(studentRepository.findByUserId(204L)).thenReturn(Optional.of(stu4));

        AppException unauthorizedEx = assertThrows(AppException.class,
                () -> chatService.getRoomMessages(1L, 10L, 204L));
        assertEquals(ErrorCode.UNAUTHORIZED, unauthorizedEx.getErrorCode());

        // Student 1 sends message
        when(lecturerRepository.findByUserId(201L)).thenReturn(Optional.empty());
        when(studentRepository.findByUserId(201L)).thenReturn(Optional.of(stu1));
        when(userRepository.findById(201L)).thenReturn(Optional.of(stu1.getUser()));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            m.setId(500L);
            return m;
        });

        SendChatMessageRequestDTO req = SendChatMessageRequestDTO.builder()
                .content("Em chào thầy ạ")
                .attachmentUrl("/api/v1/files/download/abc.pdf")
                .attachmentName("de_cuong.pdf")
                .build();
        ChatMessageResponseDTO sent = chatService.sendMessage(1L, 10L, 201L, req);

        assertEquals(500L, sent.getId());
        assertEquals("STUDENT", sent.getSenderRole());
        assertEquals("221200001", sent.getSenderCode());
        assertEquals("CNTT1-K63", sent.getSenderSubtitle());
        assertTrue(sent.getIsMine());

        // Student 2 cannot delete Student 1's message
        ChatMessage savedMsg = ChatMessage.builder()
                .id(500L)
                .projectRoundId(1L)
                .lecturerId(10L)
                .senderUserId(201L)
                .senderRole("STUDENT")
                .content("Em chào thầy ạ")
                .createdAt(Instant.now())
                .build();
        when(chatMessageRepository.findById(500L)).thenReturn(Optional.of(savedMsg));
        when(lecturerRepository.findByUserId(202L)).thenReturn(Optional.empty());
        when(studentRepository.findByUserId(202L)).thenReturn(Optional.of(stu2));

        AppException deleteDenied = assertThrows(AppException.class,
                () -> chatService.deleteMessage(1L, 10L, 500L, 202L));
        assertEquals(ErrorCode.UNAUTHORIZED, deleteDenied.getErrorCode());

        // Student 1 can delete their own message
        chatService.deleteMessage(1L, 10L, 500L, 201L);
        verify(chatMessageRepository, times(1)).delete(savedMsg);

        // Lecturer 1 can also delete any message in their room
        when(lecturerRepository.findByUserId(101L)).thenReturn(Optional.of(lec1));
        chatService.deleteMessage(1L, 10L, 500L, 101L);
        verify(chatMessageRepository, times(2)).delete(savedMsg);
    }
}
