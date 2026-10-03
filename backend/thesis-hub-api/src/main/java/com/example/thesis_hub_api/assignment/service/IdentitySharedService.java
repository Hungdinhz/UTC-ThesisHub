package com.example.thesis_hub_api.assignment.service;

public interface IdentitySharedService {
    
    /**
     * Verify if the user has the specified role.
     * @param userId the user ID
     * @param expectedRole the expected role (e.g. "STUDENT", "LECTURER")
     * @return true if the user has the role, false otherwise
     */
    boolean verifyRole(Integer userId, String expectedRole);

    /**
     * Get the student's training program.
     * @param studentId the student ID
     * @return the training program string (e.g. "Kỹ sư", "Cử nhân")
     */
    String getStudentProgram(Integer studentId);

    /**
     * Get the lecturer's degree.
     * @param lecturerId the lecturer ID
     * @return the degree string (e.g. "ThS", "TS")
     */
    String getLecturerDegree(Integer lecturerId);
}
