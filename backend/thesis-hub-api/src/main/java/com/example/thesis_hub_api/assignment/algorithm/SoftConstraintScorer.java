package com.example.thesis_hub_api.assignment.algorithm;

import com.example.thesis_hub_api.assignment.entity.Preference;
import org.springframework.stereotype.Component;

@Component
public class SoftConstraintScorer {

    public int calculateScore(Preference preference) {
        int score = 0;

        // 1. Thứ tự nguyện vọng: NV1 > NV2 > NV3
        switch (preference.getPriorityOrder()) {
            case 1:
                score += 100;
                break;
            case 2:
                score += 60;
                break;
            case 3:
                score += 30;
                break;
            default:
                score += 10;
        }

        // 2. Add extra scores if needed (e.g. based on extra criteria, or lecturer workload)
        
        return score;
    }
}
