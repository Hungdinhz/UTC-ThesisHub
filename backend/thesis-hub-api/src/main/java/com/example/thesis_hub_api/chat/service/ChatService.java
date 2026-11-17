package com.example.thesis_hub_api.chat.service;

import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.repository.ProjectDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import com.example.thesis_hub_api.chat.dto.ChatMessageResponseDTO;
import com.example.thesis_hub_api.chat.dto.ChatRoomMemberDTO;
import com.example.thesis_hub_api.chat.dto.ChatRoomResponseDTO;
import com.example.thesis_hub_api.chat.dto.SendChatMessageRequestDTO;
import com.example.thesis_hub_api.chat.entity.ChatMessage;
import com.example.thesis_hub_api.chat.repository.ChatMessageRepository;
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
import lombok.*;
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
    private final StudentProjectRoundRepository studentProjectRoundRepository;
    private final ProjectDirectionRepository projectDirectionRepository;
    private final DepartmentRepository departmentRepository;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    private static class AssignedStudentMeta {
        private Long studentId;
        private Long lecturerId;
        private Long directionId;
        private String directionName;
        private String thesisTitle;
        private String assignmentStatus;
    }

    private record SenderMeta(String code, String subtitle) {}

    private boolean isFinalizedAssignmentStatus(String status) {
        if (!StringUtils.hasText(status)) return false;
        String s = status.trim().toUpperCase(Locale.ROOT);
        return "FINALIZED".equals(s) || "CONFIRMED".equals(s) || "APPROVED".equals(s);
    }

    private boolean isValidAssignmentStatus(String status) {
        if (!StringUtils.hasText(status)) return false;
        String s = status.trim().toUpperCase(Locale.ROOT);
        return !"CANCELLED".equals(s) && !"CANCELED".equals(s) && !"REJECTED".equals(s);
    }

    private boolean isExcludedRoundStatus(String status) {
        if (!StringUtils.hasText(status)) return false;
        String s = status.trim().toUpperCase(Locale.ROOT);
        return "INELIGIBLE".equals(s) || "DROPPED".equals(s);
    }

    private boolean isInactiveThesisOrProposalStatus(String status) {
        if (!StringUtils.hasText(status)) return false;
        String s = status.trim().toUpperCase(Locale.ROOT);
        return "CANCELLED".equals(s) || "CANCELED".equals(s) || "REJECTED".equals(s);
    }

    /**
     * Resolves the authoritative mapping of studentId -> AssignedStudentMeta (with single lecturerId)
     * for a given project round.
     *
     * Rules:
     * 1. Students marked INELIGIBLE or DROPPED in student_project_rounds are excluded.
     * 2. supervisor_assignments (excluding CANCELLED/REJECTED) is the primary source of truth.
     *    Valid statuses include FINALIZED, OVERRIDDEN, PROPOSED, CONFIRMED, APPROVED, ASSIGNED.
     * 3. If the round already has finalized assignments (hasFinalizedInRound == true), ONLY students
     *    present in supervisor_assignments are included (prevents stale/demo Thesis or Proposal rows
     *    from leaking unrelated students into a finalized supervisor group).
     * 4. If the round does NOT yet have finalized assignments, students without a SupervisorAssignment
     *    may fall back to active Thesis then active Proposal rows.
     * 5. Existing Thesis/Proposal titles are enriched onto the assigned student metadata when the
     *    lecturer matches the resolved supervisor.
     */
    private Map<Long, AssignedStudentMeta> resolveRoundStudentAssignments(
            Long roundId,
            Map<Long, String> directionNameMap) {
        Map<Long, AssignedStudentMeta> result = new LinkedHashMap<>();
        if (roundId == null) {
            return result;
        }

        Set<Long> excludedStudentIds = new HashSet<>();
        List<StudentProjectRound> roundEnrollments = studentProjectRoundRepository.findByProjectRoundId(roundId);
        if (roundEnrollments != null) {
            for (StudentProjectRound spr : roundEnrollments) {
                if (spr.getStudent() != null && spr.getStudent().getId() != null
                        && isExcludedRoundStatus(spr.getStatus())) {
                    excludedStudentIds.add(spr.getStudent().getId());
                }
            }
        }

        List<SupervisorAssignment> assignments = supervisorAssignmentRepository.findByProjectRoundId(roundId);
        if (assignments == null) {
            assignments = Collections.emptyList();
        }

        boolean hasFinalizedInRound = assignments.stream()
                .anyMatch(sa -> sa.getStudentId() != null
                        && sa.getLecturerId() != null
                        && !excludedStudentIds.contains(sa.getStudentId())
                        && isFinalizedAssignmentStatus(sa.getStatus()));

        for (SupervisorAssignment sa : assignments) {
            if (sa.getStudentId() == null || sa.getLecturerId() == null) {
                continue;
            }
            if (excludedStudentIds.contains(sa.getStudentId())) {
                continue;
            }
            if (!isValidAssignmentStatus(sa.getStatus())) {
                continue;
            }
            String dirName = sa.getDirectionId() != null ? directionNameMap.get(sa.getDirectionId()) : null;
            result.put(sa.getStudentId(), AssignedStudentMeta.builder()
                    .studentId(sa.getStudentId())
                    .lecturerId(sa.getLecturerId())
                    .directionId(sa.getDirectionId())
                    .directionName(dirName)
                    .assignmentStatus(sa.getStatus())
                    .build());
        }

        List<Thesis> theses = thesisRepository.findByProjectRoundId(roundId);
        if (theses != null) {
            for (Thesis t : theses) {
                if (t.getStudent() == null || t.getStudent().getId() == null
                        || t.getLecturer() == null || t.getLecturer().getId() == null) {
                    continue;
                }
                Long stuId = t.getStudent().getId();
                if (excludedStudentIds.contains(stuId) || isInactiveThesisOrProposalStatus(t.getStatus())) {
                    continue;
                }
                AssignedStudentMeta existing = result.get(stuId);
                if (existing != null) {
                    if (Objects.equals(existing.getLecturerId(), t.getLecturer().getId())
                            && !StringUtils.hasText(existing.getThesisTitle())
                            && StringUtils.hasText(t.getTitleVn())) {
                        existing.setThesisTitle(t.getTitleVn());
                    }
                } else if (!hasFinalizedInRound) {
                    result.put(stuId, AssignedStudentMeta.builder()
                            .studentId(stuId)
                            .lecturerId(t.getLecturer().getId())
                            .thesisTitle(t.getTitleVn())
                            .assignmentStatus(t.getStatus())
                            .build());
                }
            }
        }

        List<Proposal> proposals = proposalRepository.findByProjectRoundId(roundId);
        if (proposals != null) {
            for (Proposal p : proposals) {
                if (p.getStudent() == null || p.getStudent().getId() == null
                        || p.getLecturer() == null || p.getLecturer().getId() == null) {
                    continue;
                }
                Long stuId = p.getStudent().getId();
                if (excludedStudentIds.contains(stuId) || isInactiveThesisOrProposalStatus(p.getStatus())) {
                    continue;
                }
                AssignedStudentMeta existing = result.get(stuId);
                if (existing != null) {
                    if (Objects.equals(existing.getLecturerId(), p.getLecturer().getId())
                            && !StringUtils.hasText(existing.getThesisTitle())
                            && StringUtils.hasText(p.getTitleVn())) {
                        existing.setThesisTitle(p.getTitleVn());
                    }
                } else if (!hasFinalizedInRound) {
                    result.put(stuId, AssignedStudentMeta.builder()
                            .studentId(stuId)
                            .lecturerId(p.getLecturer().getId())
                            .thesisTitle(p.getTitleVn())
                            .assignmentStatus(p.getStatus())
                            .build());
                }
            }
        }

        return result;
    }

    private Map<Long, String> loadDirectionNameMap() {
        List<ProjectDirection> directions = projectDirectionRepository.findAll();
        if (directions == null || directions.isEmpty()) {
            return Collections.emptyMap();
        }
        return directions.stream()
                .filter(d -> d.getId() != null)
                .collect(Collectors.toMap(ProjectDirection::getId, ProjectDirection::getName, (a, b) -> a));
    }

    private Map<Long, String> loadDepartmentNameMap() {
        List<Department> departments = departmentRepository.findAll();
        if (departments == null || departments.isEmpty()) {
            return Collections.emptyMap();
        }
        return departments.stream()
                .filter(d -> d.getId() != null)
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));
    }

    private Set<Long> collectAssignedStudentIdsForRoom(Long roundId, Long lecturerId) {
        Map<Long, AssignedStudentMeta> roundAssignments = resolveRoundStudentAssignments(roundId, loadDirectionNameMap());
        Set<Long> studentIds = new LinkedHashSet<>();
        for (AssignedStudentMeta meta : roundAssignments.values()) {
            if (Objects.equals(meta.getLecturerId(), lecturerId)) {
                studentIds.add(meta.getStudentId());
            }
        }
        return studentIds;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponseDTO> getMyRooms(Long currentUserId) {
        if (currentUserId == null) {
            return Collections.emptyList();
        }

        Optional<Lecturer> lecOpt = lecturerRepository.findByUserId(currentUserId);
        Optional<Student> stuOpt = studentRepository.findByUserId(currentUserId);

        if (lecOpt.isEmpty() && stuOpt.isEmpty()) {
            return Collections.emptyList();
        }

        List<ProjectRound> allRounds = projectRoundRepository.findAll();
        if (allRounds == null || allRounds.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, String> directionNameMap = loadDirectionNameMap();
        Map<Long, String> departmentNameMap = loadDepartmentNameMap();

        List<ChatRoomResponseDTO> rooms = new ArrayList<>();
        for (ProjectRound round : allRounds) {
            if (round.getId() == null) {
                continue;
            }
            Map<Long, AssignedStudentMeta> roundAssignments = resolveRoundStudentAssignments(round.getId(), directionNameMap);
            if (roundAssignments.isEmpty()) {
                continue;
            }

            Set<Long> roomLecturerIds = new LinkedHashSet<>();
            if (lecOpt.isPresent()) {
                Long myLecId = lecOpt.get().getId();
                boolean hasAnyStudent = roundAssignments.values().stream()
                        .anyMatch(meta -> Objects.equals(meta.getLecturerId(), myLecId));
                if (hasAnyStudent) {
                    roomLecturerIds.add(myLecId);
                }
            }
            if (stuOpt.isPresent()) {
                Long myStuId = stuOpt.get().getId();
                AssignedStudentMeta myMeta = roundAssignments.get(myStuId);
                if (myMeta != null && myMeta.getLecturerId() != null) {
                    roomLecturerIds.add(myMeta.getLecturerId());
                }
            }

            for (Long lecturerId : roomLecturerIds) {
                ChatRoomResponseDTO dto = buildRoomDTO(round, lecturerId, roundAssignments, departmentNameMap);
                if (dto != null) {
                    rooms.add(dto);
                }
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

    private ChatRoomResponseDTO buildRoomDTO(
            ProjectRound round,
            Long lecturerId,
            Map<Long, AssignedStudentMeta> roundAssignments,
            Map<Long, String> departmentNameMap) {
        Lecturer lecturer = lecturerRepository.findById(lecturerId).orElse(null);
        if (round == null || lecturer == null) {
            return null;
        }

        Map<Long, AssignedStudentMeta> roomStudentMetas = new LinkedHashMap<>();
        for (AssignedStudentMeta meta : roundAssignments.values()) {
            if (Objects.equals(meta.getLecturerId(), lecturerId)) {
                roomStudentMetas.put(meta.getStudentId(), meta);
            }
        }
        if (roomStudentMetas.isEmpty()) {
            return null;
        }

        List<ChatRoomMemberDTO> members = new ArrayList<>();
        User lecUser = lecturer.getUser();
        String lecName = lecUser != null && StringUtils.hasText(lecUser.getFullName())
                ? lecUser.getFullName()
                : ("GV #" + lecturer.getId());
        String deptName = lecturer.getDepartmentId() != null ? departmentNameMap.get(lecturer.getDepartmentId()) : null;

        members.add(ChatRoomMemberDTO.builder()
                .userId(lecUser != null ? lecUser.getId() : null)
                .profileId(lecturer.getId())
                .fullName(lecName)
                .code(lecturer.getLecturerCode())
                .className(lecturer.getAcademicDegree())
                .role("SUPERVISOR")
                .email(lecUser != null ? lecUser.getEmail() : null)
                .phone(lecUser != null ? lecUser.getPhone() : null)
                .directionName(StringUtils.hasText(deptName) ? deptName : lecturer.getResearchInterests())
                .assignmentStatus("SUPERVISOR")
                .build());

        List<Student> students = studentRepository.findByIdIn(roomStudentMetas.keySet());
        if (students == null) {
            students = Collections.emptyList();
        }
        List<Student> sortedStudents = new ArrayList<>(students);
        sortedStudents.sort(Comparator.comparing(s -> s.getStudentCode() != null ? s.getStudentCode() : ""));

        for (Student st : sortedStudents) {
            User stUser = st.getUser();
            String stName = stUser != null && StringUtils.hasText(stUser.getFullName())
                    ? stUser.getFullName()
                    : ("SV #" + st.getId());
            AssignedStudentMeta meta = roomStudentMetas.get(st.getId());

            members.add(ChatRoomMemberDTO.builder()
                    .userId(stUser != null ? stUser.getId() : null)
                    .profileId(st.getId())
                    .fullName(stName)
                    .code(st.getStudentCode())
                    .className(st.getClassName())
                    .role("STUDENT")
                    .email(stUser != null ? stUser.getEmail() : null)
                    .phone(stUser != null ? stUser.getPhone() : null)
                    .directionName(meta != null ? meta.getDirectionName() : null)
                    .thesisTitle(meta != null ? meta.getThesisTitle() : null)
                    .assignmentStatus(meta != null ? meta.getAssignmentStatus() : null)
                    .build());
        }

        ChatMessage lastMsg = chatMessageRepository
                .findTopByProjectRoundIdAndLecturerIdOrderByCreatedAtDescIdDesc(round.getId(), lecturerId)
                .orElse(null);
        long totalMsgs = chatMessageRepository.countByProjectRoundIdAndLecturerId(round.getId(), lecturerId);

        String preview = null;
        if (lastMsg != null) {
            if (StringUtils.hasText(lastMsg.getContent())) {
                preview = lastMsg.getContent();
            } else if (StringUtils.hasText(lastMsg.getAttachmentName())) {
                preview = "📎 Đã gửi tệp: " + lastMsg.getAttachmentName();
            }
        }

        return ChatRoomResponseDTO.builder()
                .roomKey(round.getId() + "-" + lecturerId)
                .projectRoundId(round.getId())
                .roundCode(round.getRoundCode())
                .roundName(round.getName())
                .roundStatus(round.getStatus())
                .lecturerId(lecturerId)
                .lecturerName(lecName)
                .lecturerDegree(lecturer.getAcademicDegree())
                .lecturerCode(lecturer.getLecturerCode())
                .lecturerEmail(lecUser != null ? lecUser.getEmail() : null)
                .lecturerPhone(lecUser != null ? lecUser.getPhone() : null)
                .departmentName(deptName)
                .studentCount(sortedStudents.size())
                .members(members)
                .lastMessagePreview(preview)
                .lastSenderName(lastMsg != null ? lastMsg.getSenderName() : null)
                .lastMessageAt(lastMsg != null ? lastMsg.getCreatedAt() : null)
                .totalMessages(totalMsgs)
                .build();
    }

    private String verifyMembershipAndResolveRole(Long roundId, Long lecturerId, Long currentUserId) {
        if (currentUserId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED, "Phiên đăng nhập không hợp lệ!");
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

        throw new AppException(ErrorCode.UNAUTHORIZED,
                "Bạn không thuộc Nhóm hướng dẫn này nên không có quyền truy cập phòng chat!");
    }

    private Map<Long, SenderMeta> buildSenderMetaMapForRoom(Long roundId, Long lecturerId) {
        Map<Long, SenderMeta> senderMetaMap = new HashMap<>();

        lecturerRepository.findById(lecturerId).ifPresent(lec -> {
            if (lec.getUser() != null && lec.getUser().getId() != null) {
                senderMetaMap.put(lec.getUser().getId(),
                        new SenderMeta(lec.getLecturerCode(), lec.getAcademicDegree()));
            }
        });

        Set<Long> studentIds = collectAssignedStudentIdsForRoom(roundId, lecturerId);
        if (!studentIds.isEmpty()) {
            List<Student> students = studentRepository.findByIdIn(studentIds);
            if (students != null) {
                for (Student st : students) {
                    if (st.getUser() != null && st.getUser().getId() != null) {
                        senderMetaMap.put(st.getUser().getId(),
                                new SenderMeta(st.getStudentCode(), st.getClassName()));
                    }
                }
            }
        }

        return senderMetaMap;
    }

    private SenderMeta resolveSenderMetaForMessage(ChatMessage m, Map<Long, SenderMeta> cache) {
        if (m.getSenderUserId() == null) {
            return null;
        }
        SenderMeta cached = cache.get(m.getSenderUserId());
        if (cached != null) {
            return cached;
        }

        SenderMeta resolved = null;
        if ("SUPERVISOR".equalsIgnoreCase(m.getSenderRole())) {
            resolved = lecturerRepository.findByUserId(m.getSenderUserId())
                    .map(l -> new SenderMeta(l.getLecturerCode(), l.getAcademicDegree()))
                    .orElse(null);
        } else {
            resolved = studentRepository.findByUserId(m.getSenderUserId())
                    .map(s -> new SenderMeta(s.getStudentCode(), s.getClassName()))
                    .orElse(null);
        }
        if (resolved != null) {
            cache.put(m.getSenderUserId(), resolved);
        }
        return resolved;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDTO> getRoomMessages(Long roundId, Long lecturerId, Long currentUserId) {
        verifyMembershipAndResolveRole(roundId, lecturerId, currentUserId);
        Map<Long, SenderMeta> senderMetaMap = buildSenderMetaMapForRoom(roundId, lecturerId);
        return chatMessageRepository
                .findByProjectRoundIdAndLecturerIdOrderByCreatedAtAscIdAsc(roundId, lecturerId)
                .stream()
                .map(m -> toMessageDTO(m, currentUserId, resolveSenderMetaForMessage(m, senderMetaMap)))
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
        SenderMeta senderMeta = resolveSenderMetaForMessage(saved, new HashMap<>());
        return toMessageDTO(saved, currentUserId, senderMeta);
    }

    @Transactional
    public void deleteMessage(Long roundId, Long lecturerId, Long messageId, Long currentUserId) {
        String callerRole = verifyMembershipAndResolveRole(roundId, lecturerId, currentUserId);

        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy tin nhắn cần thu hồi!"));

        if (!Objects.equals(msg.getProjectRoundId(), roundId) || !Objects.equals(msg.getLecturerId(), lecturerId)) {
            throw new IllegalArgumentException("Tin nhắn không thuộc nhóm chat này!");
        }

        boolean isOwner = Objects.equals(msg.getSenderUserId(), currentUserId);
        boolean isGroupSupervisor = "SUPERVISOR".equalsIgnoreCase(callerRole);

        if (!isOwner && !isGroupSupervisor) {
            throw new AppException(ErrorCode.UNAUTHORIZED,
                    "Bạn chỉ có thể thu hồi tin nhắn do chính mình gửi!");
        }

        chatMessageRepository.delete(msg);
    }

    private ChatMessageResponseDTO toMessageDTO(ChatMessage m, Long currentUserId, SenderMeta senderMeta) {
        return ChatMessageResponseDTO.builder()
                .id(m.getId())
                .projectRoundId(m.getProjectRoundId())
                .lecturerId(m.getLecturerId())
                .senderUserId(m.getSenderUserId())
                .senderName(m.getSenderName())
                .senderRole(m.getSenderRole())
                .senderCode(senderMeta != null ? senderMeta.code() : null)
                .senderSubtitle(senderMeta != null ? senderMeta.subtitle() : null)
                .content(m.getContent())
                .attachmentUrl(m.getAttachmentUrl())
                .attachmentName(m.getAttachmentName())
                .createdAt(m.getCreatedAt())
                .isMine(Objects.equals(m.getSenderUserId(), currentUserId))
                .build();
    }
}
