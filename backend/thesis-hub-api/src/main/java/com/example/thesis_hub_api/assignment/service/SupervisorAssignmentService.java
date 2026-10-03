package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import java.util.List;

public interface SupervisorAssignmentService {
    List<SupervisorAssignment> generateAssignments(Integer projectRoundId, String performedBy);
    List<SupervisorAssignment> getProposals(Integer projectRoundId);
    SupervisorAssignment overrideAssignment(Integer assignmentId, Integer newLecturerId, String reason, String performedBy);
    void finalizeAssignments(Integer projectRoundId, String performedBy);
}
