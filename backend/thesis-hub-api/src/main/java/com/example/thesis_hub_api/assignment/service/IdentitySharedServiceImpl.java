package com.example.thesis_hub_api.assignment.service;

import org.springframework.stereotype.Service;

@Service
public class IdentitySharedServiceImpl implements IdentitySharedService {

    @Override
    public boolean verifyRole(Integer userId, String expectedRole) {
        // TODO: Implement actual user role verification
        return true;
    }

    @Override
    public String getStudentProgram(Integer studentId) {
        // TODO: Implement actual training program retrieval
        return "Cử nhân";
    }

    @Override
    public String getLecturerDegree(Integer lecturerId) {
        // TODO: Implement actual degree retrieval
        return "ThS";
    }
}
