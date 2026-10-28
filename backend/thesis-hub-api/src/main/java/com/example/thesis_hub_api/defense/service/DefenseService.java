package com.example.thesis_hub_api.defense.service;

import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import com.example.thesis_hub_api.defense.algorithm.DefenseCouncilScheduler;
import com.example.thesis_hub_api.defense.dto.*;
import com.example.thesis_hub_api.defense.entity.*;
import com.example.thesis_hub_api.defense.repository.*;
import com.example.thesis_hub_api.defense.service.mock.ExternalThesisMockService;
import com.example.thesis_hub_api.defense.service.mock.ExternalThesisMockService.MockLecturer;
import com.example.thesis_hub_api.defense.service.mock.ExternalThesisMockService.MockThesis;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DefenseService {

    private final DefenseCouncilRepository councilRepository;
    private final CouncilMemberRepository memberRepository;
    private final ReviewerAssignmentRepository reviewerAssignmentRepository;
    private final DefenseScheduleRepository scheduleRepository;
    private final ScoreRepository scoreRepository;
    private final GraduationResultRepository graduationResultRepository;

    private final DefenseCouncilScheduler councilScheduler;
    private final ExternalThesisMockService thesisMockService;

    @Autowired(required = false)
    private ThesisRepository thesisRepository;

    @Autowired(required = false)
    private LecturerRepository lecturerRepository;

    @Autowired(required = false)
    private StudentRepository studentRepository;

    @Autowired(required = false)
    private SupervisorAssignmentRepository supervisorAssignmentRepository;

    private String resolveLecturerName(Long lecturerId) {
        if (lecturerRepository != null && lecturerId != null) {
            Optional<Lecturer> dbLec = lecturerRepository.findById(lecturerId);
            if (dbLec.isPresent() && dbLec.get().getUser() != null) {
                return dbLec.get().getUser().getFullName();
            }
        }
        return thesisMockService.getLecturer(lecturerId)
                .map(MockLecturer::getFullName)
                .orElse("Giảng viên " + lecturerId);
    }

    /**
     * 1. API Chạy thuật toán CSP (Backtracking + Greedy) tạo Hội đồng & gán sinh viên
     */
    @Transactional
    public List<CouncilResponseDTO> generateCouncils(CouncilGenerationRequestDTO request) {
        Long roundId = request.getProjectRoundId() != null ? request.getProjectRoundId() : 10L;

        // Prepare student inputs
        List<CouncilSchedulingRequestDTO.StudentInfo> students = new ArrayList<>();
        if (request.getOverrideStudents() != null && !request.getOverrideStudents().isEmpty()) {
            students.addAll(request.getOverrideStudents());
        } else {
            List<Thesis> dbTheses = thesisRepository != null
                    ? thesisRepository.findByProjectRoundId(roundId)
                    : Collections.emptyList();
            List<Thesis> eligibleTheses = dbTheses.stream()
                    .filter(t -> Boolean.TRUE.equals(t.getDefenseEligible())
                            || "DEFENSE_READY".equalsIgnoreCase(t.getStatus())
                            || "COMPLETED".equalsIgnoreCase(t.getStatus()))
                    .collect(Collectors.toList());
            List<Thesis> targetTheses = !eligibleTheses.isEmpty() ? eligibleTheses : dbTheses;

            if (!targetTheses.isEmpty()) {
                for (Thesis t : targetTheses) {
                    if (t.getStudent() == null) continue;
                    CouncilSchedulingRequestDTO.StudentInfo si = new CouncilSchedulingRequestDTO.StudentInfo();
                    si.setStudentId(String.valueOf(t.getStudent().getId()));
                    si.setThesisId(String.valueOf(t.getId()));
                    if (t.getLecturer() != null) {
                        si.setAdvisorId(String.valueOf(t.getLecturer().getId()));
                    }
                    students.add(si);
                }
            } else if (supervisorAssignmentRepository != null) {
                List<SupervisorAssignment> activeAssignments = supervisorAssignmentRepository.findByProjectRoundId(roundId)
                        .stream()
                        .filter(sa -> !"CANCELLED".equalsIgnoreCase(sa.getStatus()))
                        .collect(Collectors.toList());
                if (!activeAssignments.isEmpty()) {
                    for (SupervisorAssignment sa : activeAssignments) {
                        if (sa.getStudentId() == null) continue;
                        CouncilSchedulingRequestDTO.StudentInfo si = new CouncilSchedulingRequestDTO.StudentInfo();
                        si.setStudentId(String.valueOf(sa.getStudentId()));
                        si.setThesisId(String.valueOf(sa.getId()));
                        if (sa.getLecturerId() != null) {
                            si.setAdvisorId(String.valueOf(sa.getLecturerId()));
                        }
                        students.add(si);
                    }
                }
            }

            if (students.isEmpty()) {
                List<MockThesis> thesesInRound = thesisMockService.getThesesByProjectRound(roundId);
                for (MockThesis mt : thesesInRound) {
                    CouncilSchedulingRequestDTO.StudentInfo si = new CouncilSchedulingRequestDTO.StudentInfo();
                    si.setStudentId(String.valueOf(mt.getStudentId()));
                    si.setThesisId(String.valueOf(mt.getThesisId()));
                    si.setAdvisorId(String.valueOf(mt.getAdvisorId()));
                    students.add(si);
                }
            }
        }

        // Prepare lecturer pool inputs
        List<CouncilSchedulingRequestDTO.LecturerInfo> lecturers = new ArrayList<>();
        if (request.getOverrideLecturers() != null && !request.getOverrideLecturers().isEmpty()) {
            lecturers.addAll(request.getOverrideLecturers());
        } else {
            List<Lecturer> dbLecturers = lecturerRepository != null
                    ? lecturerRepository.findAll()
                    : Collections.emptyList();
            if (!dbLecturers.isEmpty()) {
                for (Lecturer l : dbLecturers) {
                    CouncilSchedulingRequestDTO.LecturerInfo li = new CouncilSchedulingRequestDTO.LecturerInfo();
                    li.setLecturerId(String.valueOf(l.getId()));
                    String degree = l.getAcademicDegree() != null ? l.getAcademicDegree().toUpperCase() : "";
                    boolean canBePres = degree.contains("TIEN_SI") || degree.contains("TIẾN SĨ")
                            || degree.contains("TS") || degree.contains("PGS") || degree.contains("GS")
                            || degree.contains("PHÓ GIÁO SƯ") || degree.contains("GIÁO SƯ") || degree.contains("PHD");
                    li.setPresidentEligible(canBePres);
                    li.setSecretaryEligible(true);
                    li.setMemberEligible(true);
                    li.setCurrentLoad(0);
                    lecturers.add(li);
                }
                if (lecturers.stream().noneMatch(CouncilSchedulingRequestDTO.LecturerInfo::isPresidentEligible)) {
                    lecturers.forEach(li -> li.setPresidentEligible(true));
                }
            }
            if (lecturers.size() < 5) {
                Set<String> existingLecIds = lecturers.stream()
                        .map(CouncilSchedulingRequestDTO.LecturerInfo::getLecturerId)
                        .collect(Collectors.toSet());
                List<MockLecturer> allLecs = thesisMockService.getAllLecturers();
                for (MockLecturer ml : allLecs) {
                    String mlId = String.valueOf(ml.getLecturerId());
                    if (!existingLecIds.contains(mlId)) {
                        CouncilSchedulingRequestDTO.LecturerInfo li = new CouncilSchedulingRequestDTO.LecturerInfo();
                        li.setLecturerId(mlId);
                        li.setPresidentEligible(ml.isCanBePresident());
                        li.setSecretaryEligible(ml.isCanBeSecretary());
                        li.setMemberEligible(ml.isCanBeMember());
                        li.setCurrentLoad(ml.getCurrentLoad());
                        lecturers.add(li);
                    }
                }
            }
        }

        CouncilSchedulingRequestDTO schedulerRequest = new CouncilSchedulingRequestDTO();
        schedulerRequest.setStudents(students);
        schedulerRequest.setLecturers(lecturers);
        schedulerRequest.setMaxStudentsPerCouncil(request.getMaxStudentsPerCouncil() > 0 ? request.getMaxStudentsPerCouncil() : 5);

        CouncilSchedulingResultDTO schedulerResult = councilScheduler.schedule(schedulerRequest);

        // Fallback if single-batch advisor exclusion left fewer than 5 non-advisor lecturers in a small faculty pool
        if (schedulerResult.getCouncils().isEmpty() && lecturers.size() >= 5) {
            Set<String> batchAdvisors = students.stream()
                    .map(CouncilSchedulingRequestDTO.StudentInfo::getAdvisorId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            List<CouncilSchedulingRequestDTO.LecturerInfo> sortedPool = new ArrayList<>(lecturers);
            sortedPool.sort(Comparator
                    .comparing((CouncilSchedulingRequestDTO.LecturerInfo l) -> batchAdvisors.contains(l.getLecturerId()))
                    .thenComparing(l -> !l.isPresidentEligible())
                    .thenComparingInt(CouncilSchedulingRequestDTO.LecturerInfo::getCurrentLoad));

            CouncilSchedulingResultDTO.CouncilResult fallbackCr = new CouncilSchedulingResultDTO.CouncilResult();
            fallbackCr.setStudentIds(students.stream()
                    .map(CouncilSchedulingRequestDTO.StudentInfo::getStudentId)
                    .collect(Collectors.toList()));
            fallbackCr.setPresidentId(sortedPool.get(0).getLecturerId());
            fallbackCr.setSecretary1Id(sortedPool.get(1).getLecturerId());
            fallbackCr.setSecretary2Id(sortedPool.get(2).getLecturerId());
            fallbackCr.setMember1Id(sortedPool.get(3).getLecturerId());
            fallbackCr.setMember2Id(sortedPool.get(4).getLecturerId());
            schedulerResult.getCouncils().add(fallbackCr);
        }

        List<CouncilResponseDTO> responseList = new ArrayList<>();

        // Delete existing councils of this round so only 1 council is maintained
        List<DefenseCouncil> oldCouncils = councilRepository.findByProjectRoundId(roundId);
        for (DefenseCouncil oc : oldCouncils) {
            memberRepository.deleteByCouncilId(oc.getId());
            scheduleRepository.deleteAll(scheduleRepository.findByCouncilId(oc.getId()));
            councilRepository.delete(oc);
        }
        councilRepository.flush();

        List<DefenseCouncil> remaining = councilRepository.findByProjectRoundId(roundId);
        Set<String> existingCodes = remaining.stream().map(DefenseCouncil::getCode).collect(Collectors.toSet());
        long nextNum = Math.max(1L, councilRepository.count() + 1L);

        for (CouncilSchedulingResultDTO.CouncilResult cr : schedulerResult.getCouncils()) {
            while (existingCodes.contains("HD-" + roundId + "-" + String.format("%02d", nextNum))) {
                nextNum++;
            }
            String code = "HD-" + roundId + "-" + String.format("%02d", nextNum);
            existingCodes.add(code);
            String name = "Hội đồng đánh giá luận văn " + code;

            DefenseCouncil council = DefenseCouncil.builder()
                    .projectRoundId(roundId)
                    .code(code)
                    .name(name)
                    .status("ACTIVE")
                    .description("Hội đồng sinh tự động bằng thuật toán CSP Backtracking + Greedy (1CT - 2TK - 2UV)")
                    .build();
            DefenseCouncil savedCouncil = councilRepository.save(council);
            nextNum++;

            List<CouncilMemberDTO> memberDTOs = new ArrayList<>();

            // 1 President
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getPresidentId()), "PRESIDENT"));
            // 2 Secretaries
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getSecretary1Id()), "SECRETARY"));
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getSecretary2Id()), "SECRETARY"));
            // 2 Members
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getMember1Id()), "MEMBER"));
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getMember2Id()), "MEMBER"));

            CouncilResponseDTO councilResp = mapToCouncilResponse(savedCouncil);
            if (councilResp.getMembers() == null || councilResp.getMembers().isEmpty()) {
                councilResp.setMembers(memberDTOs);
            }
            responseList.add(councilResp);
        }

        return responseList;
    }

    private CouncilMemberDTO saveCouncilMember(Long councilId, Long lecturerId, String role) {
        CouncilMember member = CouncilMember.builder()
                .councilId(councilId)
                .lecturerId(lecturerId)
                .role(role)
                .confirmed(true)
                .build();
        CouncilMember saved = memberRepository.save(member);

        String lecName = resolveLecturerName(lecturerId);

        return CouncilMemberDTO.builder()
                .id(saved.getId())
                .lecturerId(saved.getLecturerId())
                .lecturerName(lecName)
                .role(saved.getRole())
                .confirmed(saved.getConfirmed())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CouncilResponseDTO> getCouncilsByRound(Long projectRoundId) {
        List<DefenseCouncil> councils = councilRepository.findByProjectRoundId(projectRoundId);
        return councils.stream().map(this::mapToCouncilResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CouncilResponseDTO getCouncilById(Long id) {
        DefenseCouncil council = councilRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy hội đồng ID: " + id));
        return mapToCouncilResponse(council);
    }

    @Transactional
    public CouncilResponseDTO finalizeCouncil(Long id) {
        DefenseCouncil council = councilRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy hội đồng ID: " + id));
        council.setStatus("FINALIZED");
        DefenseCouncil saved = councilRepository.save(council);
        return mapToCouncilResponse(saved);
    }

    @Transactional
    public CouncilResponseDTO updateCouncilMembers(Long councilId, List<CouncilMemberDTO> updatedMembers) {
        DefenseCouncil council = councilRepository.findById(councilId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy hội đồng ID: " + councilId));

        if ("FINALIZED".equalsIgnoreCase(council.getStatus())) {
            throw new IllegalStateException("Hội đồng đã được chốt (FINALIZED), không thể thay đổi thành viên!");
        }

        long presidents = updatedMembers.stream().filter(m -> "PRESIDENT".equalsIgnoreCase(m.getRole())).count();
        long secretaries = updatedMembers.stream().filter(m -> "SECRETARY".equalsIgnoreCase(m.getRole())).count();
        long regularMembers = updatedMembers.stream().filter(m -> "MEMBER".equalsIgnoreCase(m.getRole())).count();

        if (presidents != 1 || secretaries != 2 || regularMembers != 2) {
            throw new IllegalArgumentException("Cơ cấu hội đồng bắt buộc đúng 5 người: 1 Chủ tịch, 2 Thư ký, 2 Ủy viên!");
        }

        CouncilResponseDTO current = mapToCouncilResponse(council);
        Set<Long> advisorIds = current.getAssignedStudents().stream()
                .map(CouncilStudentDetailDTO::getAdvisorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (CouncilMemberDTO m : updatedMembers) {
            if (advisorIds.contains(m.getLecturerId())) {
                String lecName = resolveLecturerName(m.getLecturerId());
                throw new IllegalArgumentException("Ràng buộc cứng vi phạm: " + lecName + " là GVHD của sinh viên trong Hội đồng này! Không thể phân công.");
            }
        }

        memberRepository.deleteByCouncilId(councilId);
        for (CouncilMemberDTO m : updatedMembers) {
            saveCouncilMember(councilId, m.getLecturerId(), m.getRole());
        }

        return mapToCouncilResponse(council);
    }

    private CouncilResponseDTO mapToCouncilResponse(DefenseCouncil council) {
        List<CouncilMember> members = memberRepository.findByCouncilId(council.getId());
        List<CouncilMemberDTO> memberDTOs = members.stream().map(m -> {
            String name = resolveLecturerName(m.getLecturerId());
            return CouncilMemberDTO.builder()
                    .id(m.getId())
                    .lecturerId(m.getLecturerId())
                    .lecturerName(name)
                    .role(m.getRole())
                    .confirmed(m.getConfirmed())
                    .build();
        }).collect(Collectors.toList());

        List<Long> studentIds = new ArrayList<>();
        List<CouncilStudentDetailDTO> assignedStudents = new ArrayList<>();
        if (thesisRepository != null && council.getProjectRoundId() != null) {
            List<Thesis> dbTheses = thesisRepository.findByProjectRoundId(council.getProjectRoundId());
            List<Thesis> eligibleTheses = dbTheses.stream()
                    .filter(t -> Boolean.TRUE.equals(t.getDefenseEligible())
                            || "DEFENSE_READY".equalsIgnoreCase(t.getStatus())
                            || "COMPLETED".equalsIgnoreCase(t.getStatus()))
                    .collect(Collectors.toList());
            List<Thesis> targetTheses = !eligibleTheses.isEmpty() ? eligibleTheses : dbTheses;

            for (Thesis t : targetTheses) {
                if (t.getStudent() != null) {
                    studentIds.add(t.getStudent().getId());
                    String sName = (t.getStudent().getUser() != null) ? t.getStudent().getUser().getFullName() : ("Sinh viên #" + t.getStudent().getId());
                    String sCode = t.getStudent().getStudentCode();
                    Long advId = (t.getLecturer() != null) ? t.getLecturer().getId() : null;
                    String advName = (t.getLecturer() != null && t.getLecturer().getUser() != null) ? t.getLecturer().getUser().getFullName() : ("GV #" + advId);

                    assignedStudents.add(CouncilStudentDetailDTO.builder()
                            .studentId(t.getStudent().getId())
                            .studentName(sName)
                            .studentCode(sCode)
                            .thesisId(t.getId())
                            .thesisTitle(t.getTitleVn())
                            .advisorId(advId)
                            .advisorName(advName)
                            .build());
                }
            }
        }
        if (assignedStudents.isEmpty() && supervisorAssignmentRepository != null && council.getProjectRoundId() != null) {
            List<SupervisorAssignment> activeAssignments = supervisorAssignmentRepository.findByProjectRoundId(council.getProjectRoundId())
                    .stream()
                    .filter(sa -> !"CANCELLED".equalsIgnoreCase(sa.getStatus()))
                    .collect(Collectors.toList());
            for (SupervisorAssignment sa : activeAssignments) {
                if (sa.getStudentId() != null) {
                    studentIds.add(sa.getStudentId());
                    String sName = "Sinh viên #" + sa.getStudentId();
                    String sCode = "SV" + sa.getStudentId();
                    if (studentRepository != null) {
                        Optional<Student> stOpt = studentRepository.findById(sa.getStudentId());
                        if (stOpt.isPresent()) {
                            sCode = stOpt.get().getStudentCode();
                            if (stOpt.get().getUser() != null) {
                                sName = stOpt.get().getUser().getFullName();
                            }
                        }
                    }
                    Long advId = sa.getLecturerId();
                    String advName = advId != null ? resolveLecturerName(advId) : "—";

                    assignedStudents.add(CouncilStudentDetailDTO.builder()
                            .studentId(sa.getStudentId())
                            .studentName(sName)
                            .studentCode(sCode)
                            .thesisId(sa.getId())
                            .thesisTitle("Đề tài tốt nghiệp đợt " + council.getProjectRoundId())
                            .advisorId(advId)
                            .advisorName(advName)
                            .build());
                }
            }
        }

        return CouncilResponseDTO.builder()
                .id(council.getId())
                .projectRoundId(council.getProjectRoundId())
                .code(council.getCode())
                .name(council.getName())
                .status(council.getStatus())
                .description(council.getDescription())
                .members(memberDTOs)
                .studentIds(studentIds)
                .assignedStudents(assignedStudents)
                .build();
    }


    /**
     * 2. API Phân công Giảng viên phản biện (Reviewer Assignment)
     * Hard constraint: GVPB ≠ GVHD
     */
    @Transactional
    public ReviewerAssignmentResponseDTO assignReviewer(ReviewerAssignRequestDTO request) {
        Long advisorId = null;
        if (thesisRepository != null && request.getThesisId() != null) {
            Optional<Thesis> dbThesis = thesisRepository.findById(request.getThesisId());
            if (dbThesis.isPresent() && dbThesis.get().getLecturer() != null) {
                advisorId = dbThesis.get().getLecturer().getId();
            }
        }
        if (advisorId == null) {
            Optional<MockThesis> thesisOpt = thesisMockService.getThesis(request.getThesisId());
            if (thesisOpt.isPresent()) {
                advisorId = thesisOpt.get().getAdvisorId();
            }
        }
        if (advisorId != null && Objects.equals(advisorId, request.getReviewerId())) {
            throw new IllegalArgumentException("Ràng buộc cứng vi phạm: Giảng viên phản biện (GVPB) KHÔNG ĐƯỢC TRÙNG với Giảng viên hướng dẫn (GVHD - ID: " + advisorId + ")");
        }

        ReviewerAssignment assignment = reviewerAssignmentRepository.findByThesisId(request.getThesisId())
                .orElse(ReviewerAssignment.builder()
                        .thesisId(request.getThesisId())
                        .build());

        assignment.setReviewerId(request.getReviewerId());
        assignment.setAssignedBy(request.getAssignedBy());
        assignment.setAssignedAt(Instant.now());
        assignment.setStatus("ASSIGNED");
        assignment.setNote(request.getNote());

        ReviewerAssignment saved = reviewerAssignmentRepository.save(assignment);
        return mapToReviewerResponse(saved);
    }

    public List<ReviewerAssignmentResponseDTO> getReviewerAssignments(Long reviewerId, String status) {
        List<ReviewerAssignment> list;
        if (reviewerId != null && status != null) {
            list = reviewerAssignmentRepository.findByReviewerIdAndStatus(reviewerId, status.toUpperCase());
        } else if (reviewerId != null) {
            list = reviewerAssignmentRepository.findByReviewerId(reviewerId);
        } else if (status != null) {
            list = reviewerAssignmentRepository.findByStatus(status.toUpperCase());
        } else {
            list = reviewerAssignmentRepository.findAll();
        }
        return list.stream().map(this::mapToReviewerResponse).collect(Collectors.toList());
    }

    private ReviewerAssignmentResponseDTO mapToReviewerResponse(ReviewerAssignment assignment) {
        String reviewerName = resolveLecturerName(assignment.getReviewerId());

        return ReviewerAssignmentResponseDTO.builder()
                .id(assignment.getId())
                .thesisId(assignment.getThesisId())
                .reviewerId(assignment.getReviewerId())
                .reviewerName(reviewerName)
                .assignedBy(assignment.getAssignedBy())
                .assignedAt(assignment.getAssignedAt())
                .status(assignment.getStatus())
                .reviewFileUrl(assignment.getReviewFileUrl())
                .reviewNotes(assignment.getReviewNotes())
                .note(assignment.getNote())
                .build();
    }

    /**
     * 3. API Cấu hình tham số và tự động sinh lịch bảo vệ
     */
    @Transactional
    public List<DefenseScheduleResponseDTO> autoGenerateSchedules(AutoScheduleRequestDTO request) {
        List<Long> councilIds = request.getCouncilIds();
        Long roundId = request.getProjectRoundId() != null ? request.getProjectRoundId() : 10L;

        if (councilIds == null || councilIds.isEmpty()) {
            councilIds = councilRepository.findByProjectRoundId(roundId)
                    .stream().map(DefenseCouncil::getId).collect(Collectors.toList());
        }

        if (councilIds.isEmpty()) {
            // Auto generate the 1 council first if none exists
            CouncilGenerationRequestDTO genReq = new CouncilGenerationRequestDTO();
            genReq.setProjectRoundId(roundId);
            genReq.setMaxStudentsPerCouncil(50);
            List<CouncilResponseDTO> genCouncils = generateCouncils(genReq);
            councilIds = genCouncils.stream().map(CouncilResponseDTO::getId).collect(Collectors.toList());
        }

        List<String> rooms = (request.getRooms() != null && !request.getRooms().isEmpty())
                ? request.getRooms()
                : List.of("Phòng Hội thảo A2-301", "Phòng Lab 402-A1", "Phòng Chuyên đề A6-205");

        List<String> sessions = (request.getSessions() != null && !request.getSessions().isEmpty())
                ? request.getSessions()
                : List.of("MORNING", "AFTERNOON");

        LocalDate currentDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().plusDays(7);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : currentDate.plusDays(14);

        // Clean up previous schedules of these councils before generating
        for (Long cId : councilIds) {
            scheduleRepository.deleteAll(scheduleRepository.findByCouncilId(cId));
        }
        scheduleRepository.flush();

        List<DefenseScheduleResponseDTO> result = new ArrayList<>();
        int roomIdx = 0;
        int sessionIdx = 0;

        for (Long councilId : councilIds) {
            String currentSession = sessions.get(sessionIdx % sessions.size());
            String currentRoom = rooms.get(roomIdx % rooms.size());

            LocalTime start = "MORNING".equalsIgnoreCase(currentSession) ? LocalTime.of(8, 0) : LocalTime.of(13, 30);
            LocalTime end = "MORNING".equalsIgnoreCase(currentSession) ? LocalTime.of(11, 30) : LocalTime.of(17, 0);

            // Avoid council duplicate date & session
            Optional<DefenseSchedule> existing = scheduleRepository.findByCouncilIdAndDefenseDateAndSession(
                    councilId, currentDate, currentSession
            );

            DefenseSchedule schedule = existing.orElseGet(DefenseSchedule::new);
            schedule.setCouncilId(councilId);
            schedule.setDefenseDate(currentDate);
            schedule.setSession(currentSession);
            schedule.setRoom(currentRoom);
            schedule.setStartTime(start);
            schedule.setEndTime(end);
            schedule.setMaxStudents(request.getMaxStudentsPerSession() != null ? request.getMaxStudentsPerSession() : 12);
            schedule.setStatus("SCHEDULED");
            schedule.setNotes("Lịch bảo vệ xếp tự động tránh trùng phòng và khung giờ");

            DefenseSchedule saved = scheduleRepository.save(schedule);
            result.add(mapToScheduleResponse(saved));

            sessionIdx++;
            if (sessionIdx % sessions.size() == 0) {
                roomIdx++;
                if (roomIdx % rooms.size() == 0) {
                    currentDate = currentDate.plusDays(1);
                    if (currentDate.isAfter(endDate)) {
                        currentDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().plusDays(7);
                    }
                }
            }
        }

        return result;
    }

    @Transactional
    public DefenseScheduleResponseDTO configureSchedule(ScheduleConfigDTO config) {
        DefenseSchedule schedule = DefenseSchedule.builder()
                .councilId(config.getCouncilId())
                .defenseDate(config.getDefenseDate())
                .session(config.getSession())
                .room(config.getRoom())
                .startTime(config.getStartTime())
                .endTime(config.getEndTime())
                .maxStudents(config.getMaxStudents() != null ? config.getMaxStudents() : 12)
                .status("SCHEDULED")
                .notes(config.getNotes())
                .build();

        DefenseSchedule saved = scheduleRepository.save(schedule);
        return mapToScheduleResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DefenseScheduleResponseDTO> getSchedulesByDate(LocalDate date) {
        return getSchedules(date, null);
    }

    @Transactional(readOnly = true)
    public List<DefenseScheduleResponseDTO> getSchedules(LocalDate date, Long projectRoundId) {
        List<DefenseSchedule> list;
        if (date != null && projectRoundId != null) {
            List<Long> councilIds = councilRepository.findByProjectRoundId(projectRoundId)
                    .stream().map(DefenseCouncil::getId).collect(Collectors.toList());
            list = scheduleRepository.findByDefenseDate(date).stream()
                    .filter(s -> councilIds.contains(s.getCouncilId()))
                    .collect(Collectors.toList());
        } else if (date != null) {
            list = scheduleRepository.findByDefenseDate(date);
        } else if (projectRoundId != null) {
            List<Long> councilIds = councilRepository.findByProjectRoundId(projectRoundId)
                    .stream().map(DefenseCouncil::getId).collect(Collectors.toList());
            list = scheduleRepository.findAll().stream()
                    .filter(s -> councilIds.contains(s.getCouncilId()))
                    .collect(Collectors.toList());
        } else {
            list = scheduleRepository.findAll();
        }
        return list.stream().map(this::mapToScheduleResponse).collect(Collectors.toList());
    }

    private DefenseScheduleResponseDTO mapToScheduleResponse(DefenseSchedule s) {
        DefenseCouncil council = councilRepository.findById(s.getCouncilId()).orElse(null);
        String councilName = council != null ? council.getName() : ("Hội đồng " + s.getCouncilId());
        String councilCode = council != null ? council.getCode() : "";
        Long projectRoundId = council != null ? council.getProjectRoundId() : null;

        List<CouncilMemberDTO> memberDTOs = Collections.emptyList();
        List<Long> studentIds = Collections.emptyList();
        List<CouncilStudentDetailDTO> assignedStudents = Collections.emptyList();

        if (council != null) {
            CouncilResponseDTO cDto = mapToCouncilResponse(council);
            memberDTOs = cDto.getMembers();
            studentIds = cDto.getStudentIds();
            assignedStudents = cDto.getAssignedStudents();
        }

        return DefenseScheduleResponseDTO.builder()
                .id(s.getId())
                .councilId(s.getCouncilId())
                .councilName(councilName)
                .councilCode(councilCode)
                .projectRoundId(projectRoundId)
                .defenseDate(s.getDefenseDate())
                .session(s.getSession())
                .room(s.getRoom())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .maxStudents(s.getMaxStudents())
                .status(s.getStatus())
                .notes(s.getNotes())
                .members(memberDTOs)
                .studentIds(studentIds)
                .assignedStudents(assignedStudents)
                .build();
    }


    /**
     * 4. API Chấm điểm, nhập nhận xét của Hội đồng / GVHD / GVPB
     */
    @Transactional
    public ScoreResponseDTO submitScore(ScoreSubmitRequestDTO request, Long currentUserId) {
        if (request.getScore() == null || request.getScore().compareTo(BigDecimal.ZERO) < 0 || request.getScore().compareTo(BigDecimal.TEN) > 0) {
            throw new IllegalArgumentException("Điểm số phải nằm trong thang điểm từ 0.00 đến 10.00");
        }

        String scoreType = request.getScoreType() != null ? request.getScoreType().toUpperCase() : "COUNCIL";
        if (!List.of("SUPERVISOR", "REVIEWER", "COUNCIL").contains(scoreType)) {
            throw new IllegalArgumentException("Loại điểm không hợp lệ (Phải là SUPERVISOR, REVIEWER hoặc COUNCIL)");
        }

        Long graderId = request.getGraderId();
        if (graderId == null && currentUserId != null) {
            if (lecturerRepository != null) {
                graderId = lecturerRepository.findByUserId(currentUserId)
                        .map(Lecturer::getId)
                        .orElse(currentUserId);
            } else {
                graderId = currentUserId;
            }
        }
        if (graderId == null && request.getThesisId() != null && thesisRepository != null) {
            Optional<Thesis> tOpt = thesisRepository.findById(request.getThesisId());
            if (tOpt.isPresent() && tOpt.get().getLecturer() != null) {
                graderId = tOpt.get().getLecturer().getId();
            }
        }
        if (graderId == null) {
            graderId = 1L;
        }

        // Hard constraint: If scoreType is COUNCIL, ensure grader is NOT the thesis's advisor!
        if ("COUNCIL".equalsIgnoreCase(scoreType) && request.getThesisId() != null && thesisRepository != null) {
            Optional<Thesis> tOpt = thesisRepository.findById(request.getThesisId());
            if (tOpt.isPresent() && tOpt.get().getLecturer() != null) {
                Long advId = tOpt.get().getLecturer().getId();
                if (Objects.equals(advId, graderId)) {
                    throw new IllegalArgumentException("Quy chế đào tạo UTC: Giảng viên hướng dẫn không được phép tham gia Hội đồng chấm thi của chính sinh viên do mình hướng dẫn!");
                }
            }
        }

        Score scoreEntity = scoreRepository.findByThesisIdAndGraderIdAndScoreType(
                request.getThesisId(), graderId, scoreType
        ).orElse(Score.builder()
                .thesisId(request.getThesisId())
                .graderId(graderId)
                .scoreType(scoreType)
                .build());

        scoreEntity.setScore(request.getScore().setScale(2, RoundingMode.HALF_UP));
        scoreEntity.setFeedback(request.getFeedback());
        scoreEntity.setGradedAt(Instant.now());

        Score saved = scoreRepository.save(scoreEntity);
        String graderName = resolveLecturerName(saved.getGraderId());

        return ScoreResponseDTO.builder()
                .id(saved.getId())
                .thesisId(saved.getThesisId())
                .graderId(saved.getGraderId())
                .graderName(graderName)
                .scoreType(saved.getScoreType())
                .score(saved.getScore())
                .feedback(saved.getFeedback())
                .gradedAt(saved.getGradedAt())
                .build();
    }

    public ScoreResponseDTO submitScore(ScoreSubmitRequestDTO request) {
        return submitScore(request, null);
    }

    @Transactional(readOnly = true)
    public List<ScoreResponseDTO> getScoresByThesis(Long thesisId) {
        return scoreRepository.findByThesisId(thesisId).stream()
                .map(s -> ScoreResponseDTO.builder()
                        .id(s.getId())
                        .thesisId(s.getThesisId())
                        .graderId(s.getGraderId())
                        .graderName(resolveLecturerName(s.getGraderId()))
                        .scoreType(s.getScoreType())
                        .score(s.getScore())
                        .feedback(s.getFeedback())
                        .gradedAt(s.getGradedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 5. API Tổng hợp điểm, xuất kết quả tốt nghiệp cuối kỳ
     */
    @Transactional
    public GraduationResultResponseDTO synthesizeResult(SynthesizeResultRequestDTO request) {
        Long thesisId = request.getThesisId();
        List<Score> scores = scoreRepository.findByThesisId(thesisId);

        BigDecimal supervisorScore = null;
        BigDecimal reviewerScore = null;
        List<BigDecimal> councilScores = new ArrayList<>();

        for (Score s : scores) {
            if ("SUPERVISOR".equalsIgnoreCase(s.getScoreType())) {
                supervisorScore = s.getScore();
            } else if ("REVIEWER".equalsIgnoreCase(s.getScoreType())) {
                reviewerScore = s.getScore();
            } else if ("COUNCIL".equalsIgnoreCase(s.getScoreType())) {
                councilScores.add(s.getScore());
            }
        }

        BigDecimal avgCouncilScore = BigDecimal.ZERO;
        if (!councilScores.isEmpty()) {
            BigDecimal sum = councilScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            avgCouncilScore = sum.divide(BigDecimal.valueOf(councilScores.size()), 2, RoundingMode.HALF_UP);
        }

        // Default fallback if not yet graded
        if (supervisorScore == null) supervisorScore = BigDecimal.valueOf(8.0);
        if (reviewerScore == null) reviewerScore = BigDecimal.valueOf(7.5);
        if (councilScores.isEmpty()) avgCouncilScore = BigDecimal.valueOf(8.0);

        double wSup = request.getSupervisorWeight() != null ? request.getSupervisorWeight() : 0.3;
        double wRev = request.getReviewerWeight() != null ? request.getReviewerWeight() : 0.2;
        double wCou = request.getCouncilWeight() != null ? request.getCouncilWeight() : 0.5;

        double finalVal = (supervisorScore.doubleValue() * wSup)
                + (reviewerScore.doubleValue() * wRev)
                + (avgCouncilScore.doubleValue() * wCou);
        BigDecimal finalScore = BigDecimal.valueOf(finalVal).setScale(2, RoundingMode.HALF_UP);

        String grade;
        if (finalScore.compareTo(BigDecimal.valueOf(8.5)) >= 0) {
            grade = "EXCELLENT";
        } else if (finalScore.compareTo(BigDecimal.valueOf(7.0)) >= 0) {
            grade = "VERY_GOOD";
        } else if (finalScore.compareTo(BigDecimal.valueOf(5.5)) >= 0) {
            grade = "GOOD";
        } else if (finalScore.compareTo(BigDecimal.valueOf(4.0)) >= 0) {
            grade = "AVERAGE";
        } else {
            grade = "POOR";
        }

        String finalResult = finalScore.compareTo(BigDecimal.valueOf(5.0)) >= 0 ? "PASSED" : "FAILED";

        GraduationResult entity = graduationResultRepository.findByThesisId(thesisId)
                .orElse(GraduationResult.builder().thesisId(thesisId).build());

        entity.setSupervisorScore(supervisorScore);
        entity.setReviewerScore(reviewerScore);
        entity.setCouncilScore(avgCouncilScore);
        entity.setFinalScore(finalScore);
        entity.setGrade(grade);
        entity.setFinalResult(finalResult);
        entity.setPublishedAt(Instant.now());
        entity.setNotes(request.getNotes() != null ? request.getNotes() : "Đã tổng hợp điểm tốt nghiệp");

        GraduationResult saved = graduationResultRepository.save(entity);

        return GraduationResultResponseDTO.builder()
                .id(saved.getId())
                .thesisId(saved.getThesisId())
                .supervisorScore(saved.getSupervisorScore())
                .reviewerScore(saved.getReviewerScore())
                .councilScore(saved.getCouncilScore())
                .finalScore(saved.getFinalScore())
                .grade(saved.getGrade())
                .finalResult(saved.getFinalResult())
                .publishedAt(saved.getPublishedAt())
                .notes(saved.getNotes())
                .build();
    }

    public GraduationResultResponseDTO getGraduationResultByThesis(Long thesisId) {
        GraduationResult entity = graduationResultRepository.findByThesisId(thesisId).orElse(null);
        if (entity == null) {
            return null;
        }

        return GraduationResultResponseDTO.builder()
                .id(entity.getId())
                .thesisId(entity.getThesisId())
                .supervisorScore(entity.getSupervisorScore())
                .reviewerScore(entity.getReviewerScore())
                .councilScore(entity.getCouncilScore())
                .finalScore(entity.getFinalScore())
                .grade(entity.getGrade())
                .finalResult(entity.getFinalResult())
                .publishedAt(entity.getPublishedAt())
                .notes(entity.getNotes())
                .build();
    }
}
