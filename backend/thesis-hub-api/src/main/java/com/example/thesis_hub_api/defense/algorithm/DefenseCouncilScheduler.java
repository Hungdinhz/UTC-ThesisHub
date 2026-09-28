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

            // Collect excluded advisors and reviewers
            Set<String> excludedLecturers = new HashSet<>();
            for (StudentInfo student : batch) {
                if (student.getAdvisorId() != null) {
                    excludedLecturers.add(student.getAdvisorId());
                }
                if (student.getReviewerId() != null) {
                    // Usually reviewer is also excluded or maybe they SHOULD be in the council?
                    // The rule: "GVPB KHÔNG ĐƯỢC TRÙNG với GVHD của đề tài: GVPB ≠ GVHD". It doesn't strictly say GVPB is excluded from Council.
                    // However, we exclude GVHD explicitly. Let's just exclude GVHD as requested.
                }
            }

            CouncilResult council = findCouncilForBatch(batch, mutableLecturers, excludedLecturers);

            if (council != null) {
                result.getCouncils().add(council);
                // Update loads greedy
                incrementLoad(mutableLecturers, council.getPresidentId());
                incrementLoad(mutableLecturers, council.getSecretary1Id());
                incrementLoad(mutableLecturers, council.getSecretary2Id());
                incrementLoad(mutableLecturers, council.getMember1Id());
                incrementLoad(mutableLecturers, council.getMember2Id());
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

        // Backtracking: 1 President, 2 Secretaries, 2 Members
        for (LecturerInfo p : presidents) {
            for (int i = 0; i < secretaries.size(); i++) {
                for (int j = i + 1; j < secretaries.size(); j++) {
                    LecturerInfo s1 = secretaries.get(i);
                    LecturerInfo s2 = secretaries.get(j);

                    if (s1.getLecturerId().equals(p.getLecturerId()) || s2.getLecturerId().equals(p.getLecturerId())) {
                        continue;
                    }

                    for (int m1i = 0; m1i < members.size(); m1i++) {
                        for (int m2i = m1i + 1; m2i < members.size(); m2i++) {
                            LecturerInfo m1 = members.get(m1i);
                            LecturerInfo m2 = members.get(m2i);

                            Set<String> selectedIds = new HashSet<>(Arrays.asList(
                                    p.getLecturerId(),
                                    s1.getLecturerId(),
                                    s2.getLecturerId(),
                                    m1.getLecturerId(),
                                    m2.getLecturerId()
                            ));

                            if (selectedIds.size() == 5) {
                                // Found valid combination
                                CouncilResult cr = new CouncilResult();
                                cr.setStudentIds(batch.stream().map(StudentInfo::getStudentId).collect(Collectors.toList()));
                                cr.setPresidentId(p.getLecturerId());
                                cr.setSecretary1Id(s1.getLecturerId());
                                cr.setSecretary2Id(s2.getLecturerId());
                                cr.setMember1Id(m1.getLecturerId());
                                cr.setMember2Id(m2.getLecturerId());
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
