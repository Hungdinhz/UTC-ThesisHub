package com.example.thesis_hub_api.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileResponseDTO {

    private Long id;

    private String username;

    private String email;

    @JsonProperty("full_name")
    private String fullName;

    private String phone;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    private String role;

    @JsonProperty("role_display_name")
    private String roleDisplayName;

    // Frontend convenience: "student" | "supervisor" | "committee_member" | "admin"
    @JsonProperty("user_type")
    private String userType;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("created_at")
    private Instant createdAt;

    private StudentInfoDTO student;

    private LecturerInfoDTO lecturer;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentInfoDTO {
        private Long id;

        @JsonProperty("student_code")
        private String studentCode;

        @JsonProperty("registration_no")
        private String registrationNo; // Alias for frontend

        @JsonProperty("class_name")
        private String className;

        @JsonProperty("major_id")
        private Long majorId;

        @JsonProperty("training_program_id")
        private Long trainingProgramId;

        @JsonProperty("date_of_birth")
        private LocalDate dateOfBirth;

        private String gender;

        @JsonProperty("debt_credits")
        private Integer debtCredits;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LecturerInfoDTO {
        private Long id;

        @JsonProperty("lecturer_code")
        private String lecturerCode;

        @JsonProperty("supervisor_id")
        private String supervisorId; // Alias for frontend

        @JsonProperty("department_id")
        private Long departmentId;

        @JsonProperty("academic_degree")
        private String academicDegree;

        @JsonProperty("research_interests")
        private String researchInterests;

        @JsonProperty("max_thesis_quota")
        private Integer maxThesisQuota;
    }
}
