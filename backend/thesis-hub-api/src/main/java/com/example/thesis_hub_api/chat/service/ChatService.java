package com.example.thesis_hub_api.chat.service;

import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import com.example.thesis_hub_api.chat.dto.ChatMessageResponseDTO;
import com.example.thesis_hub_api.chat.dto.ChatRoomMemberDTO;
import com.example.thesis_hub_api.chat.dto.ChatRoomResponseDTO;
import com.example.thesis_hub_api.chat.dto.SendChatMessageRequestDTO;
import com.example.thesis_hub_api.chat.entity.ChatMessage;
import com.example.thesis_hub_api.chat.repository.ChatMessageRepository;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.thesis.entity.Proposal;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ProposalRepository;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final SupervisorAssignmentRepository supervisorAssignmentRepository;
    private final ThesisRepository thesisRepository;
    private final ProposalRepository proposalRepository;
    private final ProjectRoundRepository projectRoundRepository;
    private final LecturerRepository lecturerRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    private boolean isOfficialAssignmentStatus(String status) {
        return "FINALIZED".equalsIgnoreCase(status)
                || "CONFIRMED".equalsIgnoreCase(status)
                || "APPROVED".equalsIgnoreCase(status);
    }

    private Set<Long> collectAssignedStudentIdsForRoom(Long roundId, Long lecturerId) {
        Set<Long> studentIds = new LinkedHashSet<>();

        for (SupervisorAssignment sa : supervisorAssignmentRepository.findByProjectRoundIdAndLecturerId(roundId, lecturerId)) {
            if (sa.getStudentId() != null && isOfficialAssignmentStatus(sa.getStatus())) {
                studentIds.add(sa.getStudentId());
            }
        }

        for (Proposal p : proposalRepository.findByProjectRoundId(roundId)) {
            if (p.getLecturer() != null && Objects.equals(p.getLecturer().getId(), lecturerId) && p.getStudent() != null) {
                studentIds.add(p.getStudent().getId());
            }
        }

        for (Thesis t : thesisRepository.findByProjectRoundId(roundId)) {
            if (t.getLecturer() != null && Objects.equals(t.getLecturer().getId(), lecturerId) && t.getStudent() != null) {
                studentIds.add(t.getStudent().getId());
            }
        }

        return studentIds;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponseDTO> getMyRooms(Long currentUserId) {
        if (currentUserId == null) {
            return Collections.emptyList();
        }

        Set<String> roomKeys = new LinkedHashSet<>();

        Optional<Lecturer> lecOpt = lecturerRepository.findByUserId(currentUserId);
        if (lecOpt.isPresent()) {
            Long lecId = lecOpt.get().getId();
            for (SupervisorAssignment sa : supervisorAssignmentRepository.findByLecturerId(lecId)) {
                if (sa.getProjectRoundId() != null && isOfficialAssignmentStatus(sa.getStatus())) {
                    roomKeys.add(sa.getProjectRoundId() + ":" + lecId);
                }
            }
            for (Proposal p : proposalRepository.findByLecturerId(lecId)) {
                if (p.getProjectRound() != null) {
                    roomKeys.add(p.getProjectRound().getId() + ":" + lecId);
                }
            }
            for (Thesis t : thesisRepository.findByLecturerId(lecId)) {
                if (t.getProjectRound() != null) {
                    roomKeys.add(t.getProjectRound().getId() + ":" + lecId);
                }
            }
        }

        Optional<Student> stuOpt = studentRepository.findByUserId(currentUserId);
        if (stuOpt.isPresent()) {
            Long stuId = stuOpt.get().getId();
            for (SupervisorAssignment sa : supervisorAssignmentRepository.findByStudentId(stuId)) {
                if (sa.getProjectRoundId() != null && sa.getLecturerId() != null && isOfficialAssignmentStatus(sa.getStatus())) {
                    roomKeys.add(sa.getProjectRoundId() + ":" + sa.getLecturerId());
                }
            }
            for (Thesis t : thesisRepository.findByStudentId(stuId)) {
                if (t.getProjectRound() != null && t.getLecturer() != null) {
                    roomKeys.add(t.getProjectRound().getId() + ":" + t.getLecturer().getId());
                }
            }
        }

        List<ChatRoomResponseDTO> rooms = new ArrayList<>();
        for (String key : roomKeys) {
            String[] parts = key.split(":");
            Long roundId = Long.parseLong(parts[0]);
            Long lecturerId = Long.parseLong(parts[1]);
            ChatRoomResponseDTO dto = buildRoomDTO(roundId, lecturerId);
            if (dto != null) {
                rooms.add(dto);
            }
        }

        rooms.sort(Comparator
                .comparingInt((ChatRoomResponseDTO r) -> {
                    if ("IN_PROGRESS".equalsIgnoreCase(r.getRoundStatus())) return 0;
                    if ("OPEN".equalsIgnoreCase(r.getRoundStatus())) return 1;
                    return 2;
                })
                .thenComparing(
                        (ChatRoomResponseDTO r) -> r.getLastMessageAt() != null ? r.getLastMessageAt() : Instant.EPOCH,
                        Comparator.reverseOrder()
                )
                .thenComparing(ChatRoomResponseDTO::getProjectRoundId, Comparator.reverseOrder()));

        return rooms;
    }

    private ChatRoomResponseDTO buildRoomDTO(Long roundId, Long lecturerId) {
        ProjectRound round = projectRoundRepository.findById(roundId).orElse(null);
        Lecturer lecturer = lecturerRepository.findById(lecturerId).orElse(null);
        if (round == null || lecturer == null) {
            return null;
        }

        Set<Long> studentIds = collectAssignedStudentIdsForRoom(roundId, lecturerId);
        if (studentIds.isEmpty()) {
            return null;
        }

        List<ChatRoomMemberDTO> members = new ArrayList<>();
        String lecName = lecturer.getUser() != null ? lecturer.getUser().getFullName() : ("GV #" + lecturer.getId());
        members.add(ChatRoomMemberDTO.builder()
                .userId(lecturer.getUser() != null ? lecturer.getUser().getId() : null)
                .profileId(lecturer.getId())
                .fullName(lecName)
                .code(lecturer.getLecturerCode())
                .className(lecturer.getAcademicDegree())
                .role("SUPERVISOR")
                .build());

        List<Student> students = studentRepository.findAllById(studentIds);
        students.sort(Comparator.comparing(s -> s.getStudentCode() != null ? s.getStudentCode() : ""));
        for (Student st : students) {
            String stName = st.getUser() != null ? st.getUser().getFullName() : ("SV #" + st.getId());
            members.add(ChatRoomMemberDTO.builder()
                    .userId(st.getUser() != null ? st.getUser().getId() : null)
                    .profileId(st.getId())
                    .fullName(stName)
                    .code(st.getStudentCode())
                    .className(st.getClassName())
                    .role("STUDENT")
                    .build());
        }

        ChatMessage lastMsg = chatMessageRepository
                .findTopByProjectRoundIdAndLecturerIdOrderByCreatedAtDescIdDesc(roundId, lecturerId)
                .orElse(null);
        long totalMsgs = chatMessageRepository.countByProjectRoundIdAndLecturerId(roundId, lecturerId);

        String preview = null;
        if (lastMsg != null) {
            if (StringUtils.hasText(lastMsg.getContent())) {
                preview = lastMsg.getContent();
            } else if (StringUtils.hasText(lastMsg.getAttachmentName())) {
                preview = "📎 Đã gửi tệp: " + lastMsg.getAttachmentName();
            }
        }

        return ChatRoomResponseDTO.builder()
                .roomKey(roundId + "-" + lecturerId)
                .projectRoundId(roundId)
                .roundCode(round.getRoundCode())
                .roundName(round.getName())
                .roundStatus(round.getStatus())
                .lecturerId(lecturerId)
                .lecturerName(lecName)
                .lecturerDegree(lecturer.getAcademicDegree())
                .studentCount(students.size())
                .members(members)
                .lastMessagePreview(preview)
                .lastSenderName(lastMsg != null ? lastMsg.getSenderName() : null)
                .lastMessageAt(lastMsg != null ? lastMsg.getCreatedAt() : null)
                .totalMessages(totalMsgs)
                .build();
    }

    private String verifyMembershipAndResolveRole(Long roundId, Long lecturerId, Long currentUserId) {
        if (currentUserId == null) {
            throw new IllegalArgumentException("Phiên đăng nhập không hợp lệ!");
        }

        Optional<Lecturer> lecOpt = lecturerRepository.findByUserId(currentUserId);
        if (lecOpt.isPresent() && Objects.equals(lecOpt.get().getId(), lecturerId)) {
            return "SUPERVISOR";
        }

        Optional<Student> stuOpt = studentRepository.findByUserId(currentUserId);
        if (stuOpt.isPresent()) {
            Set<Long> roomStudentIds = collectAssignedStudentIdsForRoom(roundId, lecturerId);
            if (roomStudentIds.contains(stuOpt.get().getId())) {
                return "STUDENT";
            }
        }

        throw new IllegalArgumentException("Bạn không thuộc Nhóm hướng dẫn này nên không có quyền truy cập phòng chat!");
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDTO> getRoomMessages(Long roundId, Long lecturerId, Long currentUserId) {
        verifyMembershipAndResolveRole(roundId, lecturerId, currentUserId);
        return chatMessageRepository
                .findByProjectRoundIdAndLecturerIdOrderByCreatedAtAscIdAsc(roundId, lecturerId)
                .stream()
                .map(m -> toMessageDTO(m, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponseDTO sendMessage(Long roundId, Long lecturerId, Long currentUserId, SendChatMessageRequestDTO req) {
        String senderRole = verifyMembershipAndResolveRole(roundId, lecturerId, currentUserId);

        String text = req != null && req.getContent() != null ? req.getContent().trim() : "";
        String attUrl = req != null && StringUtils.hasText(req.getAttachmentUrl()) ? req.getAttachmentUrl().trim() : null;
        String attName = req != null && StringUtils.hasText(req.getAttachmentName()) ? req.getAttachmentName().trim() : null;

        if (!StringUtils.hasText(text) && !StringUtils.hasText(attUrl)) {
            throw new IllegalArgumentException("Vui lòng nhập nội dung tin nhắn hoặc chọn tệp đính kèm!");
        }

        User senderUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy tài khoản người gửi!"));

        String senderName = StringUtils.hasText(senderUser.getFullName())
                ? senderUser.getFullName()
                : senderUser.getUsername();

        ChatMessage entity = ChatMessage.builder()
                .projectRoundId(roundId)
                .lecturerId(lecturerId)
                .senderUserId(currentUserId)
                .senderName(senderName)
                .senderRole(senderRole)
                .content(text)
                .attachmentUrl(attUrl)
                .attachmentName(attName)
                .createdAt(Instant.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(entity);
        return toMessageDTO(saved, currentUserId);
    }

    private ChatMessageResponseDTO toMessageDTO(ChatMessage m, Long currentUserId) {
        return ChatMessageResponseDTO.builder()
                .id(m.getId())
                .projectRoundId(m.getProjectRoundId())
                .lecturerId(m.getLecturerId())
                .senderUserId(m.getSenderUserId())
                .senderName(m.getSenderName())
                .senderRole(m.getSenderRole())
                .content(m.getContent())
                .attachmentUrl(m.getAttachmentUrl())
                .attachmentName(m.getAttachmentName())
                .createdAt(m.getCreatedAt())
                .isMine(Objects.equals(m.getSenderUserId(), currentUserId))
                .build();
    }
}
