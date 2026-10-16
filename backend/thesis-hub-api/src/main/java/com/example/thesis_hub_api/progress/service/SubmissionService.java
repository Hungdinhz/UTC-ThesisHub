package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.progress.dto.CreateSubmissionRequest;
import com.example.thesis_hub_api.progress.dto.ReviewSubmissionRequest;
import com.example.thesis_hub_api.progress.dto.SubmissionResponse;

import java.util.List;

public interface SubmissionService {

    SubmissionResponse submitTask(Long taskId, CreateSubmissionRequest request);

    SubmissionResponse reviewSubmission(Long submissionId, ReviewSubmissionRequest request);

    List<SubmissionResponse> getSubmissionsByTask(Long taskId);

    SubmissionResponse getSubmissionById(Long id);
}
