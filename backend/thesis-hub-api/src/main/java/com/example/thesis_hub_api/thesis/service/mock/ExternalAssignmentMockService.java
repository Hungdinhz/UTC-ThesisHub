package com.example.thesis_hub_api.thesis.service.mock;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Mock service to simulate data from Identity and Assignment modules.
 */
@Service
public class ExternalAssignmentMockService {

    @Data
    @Builder
    public static class MockStudent {
        private Long studentId;
        private String fullName;
        private String studentCode;
    }

    @Data
    @Builder
    public static class MockLecturer {
        private Long lecturerId;
        private String fullName;
        private String lecturerCode;
    }

    private final List<MockStudent> mockStudents = new ArrayList<>();
    private final List<MockLecturer> mockLecturers = new ArrayList<>();

    public ExternalAssignmentMockService() {
        mockStudents.add(MockStudent.builder().studentId(1L).fullName("Nguyễn Văn A").studentCode("SV001").build());
        mockStudents.add(MockStudent.builder().studentId(2L).fullName("Trần Thị B").studentCode("SV002").build());
        
        mockLecturers.add(MockLecturer.builder().lecturerId(101L).fullName("TS. Lê Văn C").lecturerCode("GV01").build());
        mockLecturers.add(MockLecturer.builder().lecturerId(102L).fullName("ThS. Phạm Thị D").lecturerCode("GV02").build());
    }

    public Optional<MockStudent> getStudent(Long studentId) {
        return mockStudents.stream().filter(s -> s.getStudentId().equals(studentId)).findFirst();
    }

    public Optional<MockLecturer> getLecturer(Long lecturerId) {
        return mockLecturers.stream().filter(l -> l.getLecturerId().equals(lecturerId)).findFirst();
    }
}
