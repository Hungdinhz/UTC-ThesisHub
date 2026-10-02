package com.example.thesis_hub_api.eligibility.service.mock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Mock service providing academic and student data from Identity / Organization / Thesis modules.
 * Ensures Module 4 (Eligibility & Defense) can function and test independently.
 */
@Service
public class ExternalAcademicMockService {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAcademicRecord {
        private Long studentId;
        private String studentCode;
        private String fullName;
        private int completedCredits;
        private double gpa;
        private boolean tuitionDebt;
        private boolean underDisciplinaryAction;
        private int missingPrerequisiteCount;
        private double thesisProgressPercentage;
        private boolean supervisorApprovedForDefense;
    }

    private final Map<Long, StudentAcademicRecord> mockDatabase = new ConcurrentHashMap<>();

    public ExternalAcademicMockService() {
        // Sample seed data for testing
        mockDatabase.put(101L, StudentAcademicRecord.builder()
                .studentId(101L)
                .studentCode("SV2026101")
                .fullName("Nguyen Van A")
                .completedCredits(125)
                .gpa(3.2)
                .tuitionDebt(false)
                .underDisciplinaryAction(false)
                .missingPrerequisiteCount(0)
                .thesisProgressPercentage(100.0)
                .supervisorApprovedForDefense(true)
                .build());

        mockDatabase.put(102L, StudentAcademicRecord.builder()
                .studentId(102L)
                .studentCode("SV2026102")
                .fullName("Tran Thi B")
                .completedCredits(95) // not enough credits (<110)
                .gpa(1.8) // low GPA (<2.0)
                .tuitionDebt(true)
                .underDisciplinaryAction(false)
                .missingPrerequisiteCount(2)
                .thesisProgressPercentage(60.0)
                .supervisorApprovedForDefense(false)
                .build());

        mockDatabase.put(103L, StudentAcademicRecord.builder()
                .studentId(103L)
                .studentCode("SV2026103")
                .fullName("Le Van C")
                .completedCredits(130)
                .gpa(3.5)
                .tuitionDebt(false)
                .underDisciplinaryAction(false)
                .missingPrerequisiteCount(0)
                .thesisProgressPercentage(100.0)
                .supervisorApprovedForDefense(true)
                .build());
    }

    public StudentAcademicRecord getRecord(Long studentId) {
        return mockDatabase.computeIfAbsent(studentId, id -> StudentAcademicRecord.builder()
                .studentId(id)
                .studentCode("SV" + id)
                .fullName("Student " + id)
                .completedCredits(120)
                .gpa(2.8)
                .tuitionDebt(false)
                .underDisciplinaryAction(false)
                .missingPrerequisiteCount(0)
                .thesisProgressPercentage(100.0)
                .supervisorApprovedForDefense(true)
                .build());
    }

    public void setRecord(Long studentId, StudentAcademicRecord record) {
        mockDatabase.put(studentId, record);
    }
}
