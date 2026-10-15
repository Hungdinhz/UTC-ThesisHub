package com.example.thesis_hub_api.defense.service;

import com.example.thesis_hub_api.defense.algorithm.DefenseCouncilScheduler;
import com.example.thesis_hub_api.defense.dto.*;
import com.example.thesis_hub_api.defense.entity.*;
import com.example.thesis_hub_api.defense.repository.*;
import com.example.thesis_hub_api.defense.service.mock.ExternalThesisMockService;
import com.example.thesis_hub_api.defense.service.mock.ExternalThesisMockService.MockLecturer;
import com.example.thesis_hub_api.defense.service.mock.ExternalThesisMockService.MockThesis;
import lombok.RequiredArgsConstructor;
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
            List<MockThesis> thesesInRound = thesisMockService.getThesesByProjectRound(roundId);
            for (MockThesis mt : thesesInRound) {
                CouncilSchedulingRequestDTO.StudentInfo si = new CouncilSchedulingRequestDTO.StudentInfo();
                si.setStudentId(String.valueOf(mt.getStudentId()));
                si.setThesisId(String.valueOf(mt.getThesisId()));
                si.setAdvisorId(String.valueOf(mt.getAdvisorId()));
                students.add(si);
            }
        }

        // Prepare lecturer pool inputs
        List<CouncilSchedulingRequestDTO.LecturerInfo> lecturers = new ArrayList<>();
        if (request.getOverrideLecturers() != null && !request.getOverrideLecturers().isEmpty()) {
            lecturers.addAll(request.getOverrideLecturers());
        } else {
            List<MockLecturer> allLecs = thesisMockService.getAllLecturers();
            for (MockLecturer ml : allLecs) {
                CouncilSchedulingRequestDTO.LecturerInfo li = new CouncilSchedulingRequestDTO.LecturerInfo();
                li.setLecturerId(String.valueOf(ml.getLecturerId()));
                li.setPresidentEligible(ml.isCanBePresident());
                li.setSecretaryEligible(ml.isCanBeSecretary());
                li.setMemberEligible(ml.isCanBeMember());
                li.setCurrentLoad(ml.getCurrentLoad());
                lecturers.add(li);
            }
        }

        CouncilSchedulingRequestDTO schedulerRequest = new CouncilSchedulingRequestDTO();
        schedulerRequest.setStudents(students);
        schedulerRequest.setLecturers(lecturers);
        schedulerRequest.setMaxStudentsPerCouncil(request.getMaxStudentsPerCouncil() > 0 ? request.getMaxStudentsPerCouncil() : 5);

        CouncilSchedulingResultDTO schedulerResult = councilScheduler.schedule(schedulerRequest);

        List<CouncilResponseDTO> responseList = new ArrayList<>();
        long councilSeq = councilRepository.count() + 1;

        for (CouncilSchedulingResultDTO.CouncilResult cr : schedulerResult.getCouncils()) {
            String code = "HD-" + roundId + "-" + String.format("%02d", councilSeq);
            String name = "Hội đồng đánh giá luận văn " + code;

            DefenseCouncil council = DefenseCouncil.builder()
                    .projectRoundId(roundId)
                    .code(code)
                    .name(name)
                    .status("ACTIVE")
                    .description("Hội đồng sinh tự động bằng thuật toán CSP Backtracking + Greedy")
                    .build();
            DefenseCouncil savedCouncil = councilRepository.save(council);
            councilSeq++;

            List<CouncilMemberDTO> memberDTOs = new ArrayList<>();

            // 1 President
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getPresidentId()), "PRESIDENT"));
            // 2 Secretaries
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getSecretary1Id()), "SECRETARY"));
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getSecretary2Id()), "SECRETARY"));
            // 2 Members
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getMember1Id()), "MEMBER"));
            memberDTOs.add(saveCouncilMember(savedCouncil.getId(), Long.parseLong(cr.getMember2Id()), "MEMBER"));

            List<Long> assignedStudentIds = cr.getStudentIds().stream().map(Long::parseLong).collect(Collectors.toList());

            responseList.add(CouncilResponseDTO.builder()
                    .id(savedCouncil.getId())
                    .projectRoundId(savedCouncil.getProjectRoundId())
                    .code(savedCouncil.getCode())
                    .name(savedCouncil.getName())
                    .status(savedCouncil.getStatus())
                    .description(savedCouncil.getDescription())
                    .members(memberDTOs)
                    .studentIds(assignedStudentIds)
                    .build());
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

        String lecName = thesisMockService.getLecturer(lecturerId)
                .map(MockLecturer::getFullName)
                .orElse("Giảng viên " + lecturerId);

        return CouncilMemberDTO.builder()
                .id(saved.getId())
                .lecturerId(saved.getLecturerId())
                .lecturerName(lecName)
                .role(saved.getRole())
                .confirmed(saved.getConfirmed())
                .build();
    }

    public List<CouncilResponseDTO> getCouncilsByRound(Long projectRoundId) {
        List<DefenseCouncil> councils = councilRepository.findByProjectRoundId(projectRoundId);
        return councils.stream().map(this::mapToCouncilResponse).collect(Collectors.toList());
    }

    public CouncilResponseDTO getCouncilById(Long id) {
        DefenseCouncil council = councilRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy hội đồng ID: " + id));
        return mapToCouncilResponse(council);
    }

    private CouncilResponseDTO mapToCouncilResponse(DefenseCouncil council) {
        List<CouncilMember> members = memberRepository.findByCouncilId(council.getId());
        List<CouncilMemberDTO> memberDTOs = members.stream().map(m -> {
            String name = thesisMockService.getLecturer(m.getLecturerId())
                    .map(MockLecturer::getFullName)
                    .orElse("Giảng viên " + m.getLecturerId());
            return CouncilMemberDTO.builder()
                    .id(m.getId())
                    .lecturerId(m.getLecturerId())
                    .lecturerName(name)
                    .role(m.getRole())
                    .confirmed(m.getConfirmed())
                    .build();
        }).collect(Collectors.toList());

        return CouncilResponseDTO.builder()
                .id(council.getId())
                .projectRoundId(council.getProjectRoundId())
                .code(council.getCode())
                .name(council.getName())
                .status(council.getStatus())
                .description(council.getDescription())
                .members(memberDTOs)
                .studentIds(new ArrayList<>())
                .build();
    }

    /**
     * 2. API Phân công Giảng viên phản biện (Reviewer Assignment)
     * Hard constraint: GVPB ≠ GVHD
     */
    @Transactional
    public ReviewerAssignmentResponseDTO assignReviewer(ReviewerAssignRequestDTO request) {
        Optional<MockThesis> thesisOpt = thesisMockService.getThesis(request.getThesisId());
        if (thesisOpt.isPresent()) {
            Long advisorId = thesisOpt.get().getAdvisorId();
            if (Objects.equals(advisorId, request.getReviewerId())) {
                throw new IllegalArgumentException("Ràng buộc cứng vi phạm: Giảng viên phản biện (GVPB) KHÔNG ĐƯỢC TRÙNG với Giảng viên hướng dẫn (GVHD - ID: " + advisorId + ")");
            }
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
        String reviewerName = thesisMockService.getLecturer(assignment.getReviewerId())
                .map(MockLecturer::getFullName)
                .orElse("Giảng viên " + assignment.getReviewerId());

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
        if (councilIds == null || councilIds.isEmpty()) {
            Long roundId = request.getProjectRoundId() != null ? request.getProjectRoundId() : 10L;
            councilIds = councilRepository.findByProjectRoundId(roundId)
                    .stream().map(DefenseCouncil::getId).collect(Collectors.toList());
        }

        List<String> rooms = (request.getRooms() != null && !request.getRooms().isEmpty())
                ? request.getRooms()
                : List.of("Phòng Hội thảo A2", "Phòng 301-A1", "Phòng 402-A1");

        List<String> sessions = (request.getSessions() != null && !request.getSessions().isEmpty())
                ? request.getSessions()
                : List.of("MORNING", "AFTERNOON");

        LocalDate currentDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().plusDays(7);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : currentDate.plusDays(14);

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

    public List<DefenseScheduleResponseDTO> getSchedulesByDate(LocalDate date) {
        return scheduleRepository.findByDefenseDate(date).stream()
                .map(this::mapToScheduleResponse).collect(Collectors.toList());
    }

    private DefenseScheduleResponseDTO mapToScheduleResponse(DefenseSchedule s) {
        String councilName = councilRepository.findById(s.getCouncilId())
                .map(DefenseCouncil::getName)
                .orElse("Hội đồng " + s.getCouncilId());

        return DefenseScheduleResponseDTO.builder()
                .id(s.getId())
                .councilId(s.getCouncilId())
                .councilName(councilName)
                .defenseDate(s.getDefenseDate())
                .session(s.getSession())
                .room(s.getRoom())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .maxStudents(s.getMaxStudents())
                .status(s.getStatus())
                .notes(s.getNotes())
                .build();
    }

    /**
     * 4. API Chấm điểm, nhập nhận xét của Hội đồng
     */
    @Transactional
    public ScoreResponseDTO submitScore(ScoreSubmitRequestDTO request) {
        if (request.getScore() == null || request.getScore().compareTo(BigDecimal.ZERO) < 0 || request.getScore().compareTo(BigDecimal.TEN) > 0) {
            throw new IllegalArgumentException("Điểm số phải nằm trong thang điểm từ 0.00 đến 10.00");
        }

        String scoreType = request.getScoreType() != null ? request.getScoreType().toUpperCase() : "COUNCIL";
        if (!List.of("SUPERVISOR", "REVIEWER", "COUNCIL").contains(scoreType)) {
            throw new IllegalArgumentException("Loại điểm không hợp lệ (Phải là SUPERVISOR, REVIEWER hoặc COUNCIL)");
        }

        Score scoreEntity = scoreRepository.findByThesisIdAndGraderIdAndScoreType(
                request.getThesisId(), request.getGraderId(), scoreType
        ).orElse(Score.builder()
                .thesisId(request.getThesisId())
                .graderId(request.getGraderId())
                .scoreType(scoreType)
                .build());

        scoreEntity.setScore(request.getScore().setScale(2, RoundingMode.HALF_UP));
        scoreEntity.setFeedback(request.getFeedback());
        scoreEntity.setGradedAt(Instant.now());

        Score saved = scoreRepository.save(scoreEntity);
        return ScoreResponseDTO.builder()
                .id(saved.getId())
                .thesisId(saved.getThesisId())
                .graderId(saved.getGraderId())
                .scoreType(saved.getScoreType())
                .score(saved.getScore())
                .feedback(saved.getFeedback())
                .gradedAt(saved.getGradedAt())
                .build();
    }

    public List<ScoreResponseDTO> getScoresByThesis(Long thesisId) {
        return scoreRepository.findByThesisId(thesisId).stream()
                .map(s -> ScoreResponseDTO.builder()
                        .id(s.getId())
                        .thesisId(s.getThesisId())
                        .graderId(s.getGraderId())
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
        GraduationResult entity = graduationResultRepository.findByThesisId(thesisId)
                .orElseThrow(() -> new NoSuchElementException("Chưa có kết quả tốt nghiệp cho đề tài ID: " + thesisId));

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
