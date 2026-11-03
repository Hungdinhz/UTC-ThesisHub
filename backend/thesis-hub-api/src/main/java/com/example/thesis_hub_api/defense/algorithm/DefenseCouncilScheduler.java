package com.example.thesis_hub_api.defense.algorithm;

import com.example.thesis_hub_api.defense.dto.CouncilSchedulingRequestDTO;
import com.example.thesis_hub_api.defense.dto.CouncilSchedulingResultDTO;
import com.example.thesis_hub_api.defense.dto.CouncilSchedulingRequestDTO.StudentInfo;
import com.example.thesis_hub_api.defense.dto.CouncilSchedulingRequestDTO.LecturerInfo;
import com.example.thesis_hub_api.defense.dto.CouncilSchedulingResultDTO.CouncilResult;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class DefenseCouncilScheduler {

    public CouncilSchedulingResultDTO schedule(CouncilSchedulingRequestDTO request) {
        CouncilSchedulingResultDTO result = new CouncilSchedulingResultDTO();
        result.setCouncils(new ArrayList<>());
        result.setUnassignedStudentIds(new ArrayList<>());

        List<StudentInfo> students = request.getStudents() != null ? new ArrayList<>(request.getStudents()) : new ArrayList<>();
        List<LecturerInfo> lecturers = request.getLecturers() != null ? request.getLecturers() : new ArrayList<>();

        int maxStudents = request.getMaxStudentsPerCouncil() > 0 ? request.getMaxStudentsPerCouncil() : 5;

        // Clone lecturers to track load dynamically
        List<LecturerInfo> mutableLecturers = new ArrayList<>();
        for (LecturerInfo l : lecturers) {
            LecturerInfo clone = new LecturerInfo();
            clone.setLecturerId(l.getLecturerId());
            clone.setPresidentEligible(l.isPresidentEligible());
            clone.setSecretaryEligible(l.isSecretaryEligible());
            clone.setMemberEligible(l.isMemberEligible());
            clone.setCurrentLoad(l.getCurrentLoad());
            mutableLecturers.add(clone);
        }

        // Process students in batches
        for (int i = 0; i < students.size(); i += maxStudents) {
            int end = Math.min(i + maxStudents, students.size());
            List<StudentInfo> batch = students.subList(i, end);

            // Collect excluded advisors
            Set<String> excludedLecturers = new HashSet<>();
            for (StudentInfo student : batch) {
                if (student.getAdvisorId() != null) {
                    excludedLecturers.add(student.getAdvisorId());
                }
            }

            CouncilResult council = findCouncilForBatch(batch, mutableLecturers, excludedLecturers);

            if (council != null) {
                result.getCouncils().add(council);
                // Update loads greedy
                incrementLoad(mutableLecturers, council.getPresidentId());
                incrementLoad(mutableLecturers, council.getSecretaryId());
                incrementLoad(mutableLecturers, council.getReviewer1Id());
                incrementLoad(mutableLecturers, council.getReviewer2Id());
                incrementLoad(mutableLecturers, council.getMemberId());
            } else {
                batch.forEach(s -> result.getUnassignedStudentIds().add(s.getStudentId()));
            }
        }

        if (!result.getUnassignedStudentIds().isEmpty()) {
            result.setErrorMessage("Could not schedule councils for all students due to constraint violations or lack of eligible lecturers.");
        }

        return result;
    }

    private void incrementLoad(List<LecturerInfo> lecturers, String id) {
        if (id == null) return;
        for (LecturerInfo l : lecturers) {
            if (l.getLecturerId().equals(id)) {
                l.setCurrentLoad(l.getCurrentLoad() + 1);
                break;
            }
        }
    }

    private CouncilResult findCouncilForBatch(List<StudentInfo> batch, List<LecturerInfo> availableLecturers, Set<String> excludedAdvisors) {
        // Filter out excluded advisors
        List<LecturerInfo> validLecturers = availableLecturers.stream()
                .filter(l -> !excludedAdvisors.contains(l.getLecturerId()))
                .collect(Collectors.toList());

        // Sort greedy: ascending by load
        validLecturers.sort(Comparator.comparingInt(LecturerInfo::getCurrentLoad));

        List<LecturerInfo> presidents = validLecturers.stream().filter(LecturerInfo::isPresidentEligible).collect(Collectors.toList());
        List<LecturerInfo> secretaries = validLecturers.stream().filter(LecturerInfo::isSecretaryEligible).collect(Collectors.toList());
        List<LecturerInfo> members = validLecturers.stream().filter(LecturerInfo::isMemberEligible).collect(Collectors.toList());

        // Backtracking: 1 Chủ tịch, 1 Thư ký, 1 Phản biện 1, 1 Phản biện 2, 1 Ủy viên thông thường
        for (LecturerInfo p : presidents) {
            for (LecturerInfo s : secretaries) {
                if (s.getLecturerId().equals(p.getLecturerId())) {
                    continue;
                }
                for (int r1i = 0; r1i < members.size(); r1i++) {
                    LecturerInfo r1 = members.get(r1i);
                    for (int r2i = r1i + 1; r2i < members.size(); r2i++) {
                        LecturerInfo r2 = members.get(r2i);
                        for (int mi = 0; mi < members.size(); mi++) {
                            if (mi == r1i || mi == r2i) continue;
                            LecturerInfo m = members.get(mi);

                            Set<String> selectedIds = new HashSet<>(Arrays.asList(
                                    p.getLecturerId(),
                                    s.getLecturerId(),
                                    r1.getLecturerId(),
                                    r2.getLecturerId(),
                                    m.getLecturerId()
                            ));

                            if (selectedIds.size() == 5) {
                                CouncilResult cr = new CouncilResult();
                                cr.setStudentIds(batch.stream().map(StudentInfo::getStudentId).collect(Collectors.toList()));
                                cr.setPresidentId(p.getLecturerId());
                                cr.setSecretaryId(s.getLecturerId());
                                cr.setReviewer1Id(r1.getLecturerId());
                                cr.setReviewer2Id(r2.getLecturerId());
                                cr.setMemberId(m.getLecturerId());
                                return cr;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
}
