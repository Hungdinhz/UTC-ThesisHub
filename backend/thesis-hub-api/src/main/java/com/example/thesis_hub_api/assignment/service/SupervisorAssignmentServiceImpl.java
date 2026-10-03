package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.algorithm.AssignmentAlgorithmEngine;
import com.example.thesis_hub_api.assignment.entity.AssignmentHistory;
import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.repository.AssignmentHistoryRepository;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupervisorAssignmentServiceImpl implements SupervisorAssignmentService {

    private final AssignmentAlgorithmEngine algorithmEngine;
    private final SupervisorAssignmentRepository assignmentRepository;
    private final AssignmentHistoryRepository historyRepository;

    @Override
    @Transactional
    public List<SupervisorAssignment> generateAssignments(Integer projectRoundId, String performedBy) {
        List<SupervisorAssignment> proposals = algorithmEngine.generateProposals(projectRoundId);
        
        AssignmentHistory history = AssignmentHistory.builder()
                .projectRoundId(projectRoundId)
                .action("GENERATE")
                .performedBy(performedBy)
                .reason("Auto generated using Gale-Shapley Algorithm")
                .build();
        historyRepository.save(history);
        
        return proposals;
    }

    @Override
    public List<SupervisorAssignment> getProposals(Integer projectRoundId) {
        return assignmentRepository.findByProjectRoundId(projectRoundId);
    }

    @Override
    @Transactional
    public SupervisorAssignment overrideAssignment(Integer assignmentId, Integer newLecturerId, String reason, String performedBy) {
        SupervisorAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
                
        // In a real scenario, we should also check if newLecturerId has capacity,
        // update assigned_count in lecturer_capacities table, etc.
        // For now, we update the assignment entity.
        
        assignment.setLecturerId(newLecturerId);
        assignment.setReason("Overridden manually. Reason: " + reason);
        assignmentRepository.save(assignment);
        
        AssignmentHistory history = AssignmentHistory.builder()
                .assignmentId(assignment.getId())
                .projectRoundId(assignment.getProjectRoundId())
                .action("OVERRIDE")
                .performedBy(performedBy)
                .reason(reason)
                .build();
        historyRepository.save(history);
        
        return assignment;
    }

    @Override
    @Transactional
    public void finalizeAssignments(Integer projectRoundId, String performedBy) {
        List<SupervisorAssignment> proposals = assignmentRepository.findByProjectRoundId(projectRoundId);
        
        for (SupervisorAssignment assignment : proposals) {
            if ("PROPOSED".equals(assignment.getStatus())) {
                assignment.setStatus("FINAL");
            }
        }
        
        assignmentRepository.saveAll(proposals);
        
        AssignmentHistory history = AssignmentHistory.builder()
                .projectRoundId(projectRoundId)
                .action("FINALIZE")
                .performedBy(performedBy)
                .reason("Assignments finalized for project round")
                .build();
        historyRepository.save(history);
    }
}
