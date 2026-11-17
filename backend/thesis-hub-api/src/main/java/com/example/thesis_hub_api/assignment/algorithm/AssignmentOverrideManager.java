package com.example.thesis_hub_api.assignment.algorithm;

import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.repository.LecturerCapacityRepository;
import com.example.thesis_hub_api.assignment.repository.LecturerDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.thesis.repository.ProposalRepository;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Handles the manual override algorithm and business logic:
 * - Checks status and constraint rules for the proposed assignment.
 * - Validates that the new lecturer is assigned to the appropriate project direction.
 * - Recomputes and balances capacities for both the previous and newly assigned lecturer.
 * - Applies override modifications and reasons.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AssignmentOverrideManager {

    private final SupervisorAssignmentRepository assignmentRepository;
    private final LecturerCapacityRepository capacityRepository;
    private final LecturerDirectionRepository lecturerDirectionRepository;
    private final CapacityCalculator capacityCalculator;

    @Autowired(required = false)
    private LecturerRepository lecturerRepository;

    @Autowired(required = false)
    private ProposalRepository proposalRepository;

    @Autowired(required = false)
    private ThesisRepository thesisRepository;

    @Transactional
    public SupervisorAssignment executeOverride(Long assignmentId, Long newLecturerId, String reason, Long overriddenBy) {
        log.info("Executing override for assignment ID: {}, new Lecturer ID: {}", assignmentId, newLecturerId);

        SupervisorAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found with ID: " + assignmentId));

        boolean wasFinalized = "FINALIZED".equalsIgnoreCase(assignment.getStatus())
                || "FINAL".equalsIgnoreCase(assignment.getStatus());

        // Validate that new lecturer belongs to the project direction
        if (assignment.getDirectionId() != null) {
            boolean inDirection = lecturerDirectionRepository.findByProjectDirectionId(assignment.getDirectionId())
                    .stream()
                    .anyMatch(ld -> ld.getLecturerId().equals(newLecturerId));
            if (!inDirection) {
                log.warn("New lecturer {} is not registered for direction {}", newLecturerId, assignment.getDirectionId());
            }
        }

        // Adjust lecturer capacity counts
        Long oldLecturerId = assignment.getLecturerId();
        Long roundId = assignment.getProjectRoundId();

        if (oldLecturerId != null && !oldLecturerId.equals(newLecturerId)) {
            LecturerCapacity oldCapacity = capacityRepository
                    .findByLecturerIdAndProjectRoundId(oldLecturerId, roundId)
                    .orElse(null);
            LecturerCapacity newCapacity = capacityRepository
                    .findByLecturerIdAndProjectRoundId(newLecturerId, roundId)
                    .orElse(null);

            capacityCalculator.adjustForOverride(oldCapacity, newCapacity);

            if (oldCapacity != null) {
                capacityRepository.save(oldCapacity);
            }
            if (newCapacity != null) {
                capacityRepository.save(newCapacity);
            }
        }

        assignment.setPreviousLecturerId(oldLecturerId);
        assignment.setLecturerId(newLecturerId);
        assignment.setIsOverridden(true);
        assignment.setOverrideReason(reason);
        assignment.setStatus(wasFinalized ? "FINALIZED" : "OVERRIDDEN");
        assignment.setAssignmentMethod("MANUAL_OVERRIDE");
        assignment.setOverriddenBy(overriddenBy);
        assignment.setOverriddenAt(Instant.now());

        SupervisorAssignment saved = assignmentRepository.save(assignment);

        // Sync existing proposal & thesis lecturer if student already started Stage 3/4
        if (assignment.getStudentId() != null && roundId != null && newLecturerId != null && lecturerRepository != null) {
            Lecturer newLecturer = lecturerRepository.findById(newLecturerId).orElse(null);
            if (newLecturer != null) {
                if (proposalRepository != null) {
                    proposalRepository.findByStudentIdAndProjectRoundId(assignment.getStudentId(), roundId)
                            .ifPresent(p -> {
                                p.setLecturer(newLecturer);
                                proposalRepository.save(p);
                            });
                }
                if (thesisRepository != null) {
                    thesisRepository.findByStudentIdAndProjectRoundId(assignment.getStudentId(), roundId)
                            .ifPresent(t -> {
                                t.setLecturer(newLecturer);
                                thesisRepository.save(t);
                            });
                }
            }
        }

        return saved;
    }

    @Transactional
    public SupervisorAssignment executeOverride(Integer assignmentId, Integer newLecturerId, String reason) {
        Long aId = assignmentId != null ? assignmentId.longValue() : null;
        Long lId = newLecturerId != null ? newLecturerId.longValue() : null;
        return executeOverride(aId, lId, reason, null);
    }
}
