package com.example.thesis_hub_api.projectround.service;

/**
 * Port interface allowing the projectround module to trigger graduation result
 * synthesis when closing a round without depending on the defense service class.
 */
public interface RoundDefenseSynthesizer {

    boolean canSynthesizeResult(Long thesisId);

    void synthesizeThesisResult(Long thesisId);
}
