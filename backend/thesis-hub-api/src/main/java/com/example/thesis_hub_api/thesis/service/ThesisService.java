package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.ThesisResponse;
import com.example.thesis_hub_api.thesis.dto.UpdateThesisRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface ThesisService {

    ThesisResponse getThesisById(Long id);

    ThesisResponse getThesisByStudentAndRound(Long studentId, Long roundId);

    ThesisResponse getThesisByCode(String code);

    ThesisResponse updateThesis(Long id, UpdateThesisRequest request);

    ThesisResponse updateCompletionRate(Long id, BigDecimal rate);

    ThesisResponse setDefenseEligible(Long id, boolean eligible);

    Page<ThesisResponse> searchTheses(Long roundId, Long lecturerId, String status, Boolean defenseEligible, String search, Pageable pageable);
}
