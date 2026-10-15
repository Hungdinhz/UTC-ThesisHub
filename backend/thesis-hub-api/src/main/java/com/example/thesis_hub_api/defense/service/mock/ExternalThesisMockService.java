package com.example.thesis_hub_api.defense.service.mock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mock service providing thesis, student advisor, and lecturer pool data from external modules
 * (Thesis, Identity, Organization) for Module 4 defense operations.
 */
@Service
public class ExternalThesisMockService {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MockThesis {
        private Long thesisId;
        private String title;
        private Long studentId;
        private Long advisorId; // GVHD
        private Long projectRoundId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MockLecturer {
        private Long lecturerId;
        private String fullName;
        private String email;
        private String degree; // "PROFESSOR", "ASSOCIATE_PROFESSOR", "DOCTOR", "MASTER"
        private boolean canBePresident;
        private boolean canBeSecretary;
        private boolean canBeMember;
        private int currentLoad;
    }

    private final Map<Long, MockThesis> theses = new ConcurrentHashMap<>();
    private final Map<Long, MockLecturer> lecturers = new ConcurrentHashMap<>();

    public ExternalThesisMockService() {
        // Seed sample theses
        theses.put(1L, MockThesis.builder().thesisId(1L).title("He thong quan ly do an").studentId(101L).advisorId(501L).projectRoundId(10L).build());
        theses.put(2L, MockThesis.builder().thesisId(2L).title("Ung dung IoT trong giao thong").studentId(102L).advisorId(502L).projectRoundId(10L).build());
        theses.put(3L, MockThesis.builder().thesisId(3L).title("AI nhan dien bien so xe").studentId(103L).advisorId(501L).projectRoundId(10L).build());
        theses.put(4L, MockThesis.builder().thesisId(4L).title("Blockchain trong logistic").studentId(104L).advisorId(503L).projectRoundId(10L).build());

        // Seed sample lecturers
        lecturers.put(501L, MockLecturer.builder().lecturerId(501L).fullName("TS. Nguyen Van Huong").email("huong@utc.edu.vn").degree("DOCTOR").canBePresident(true).canBeSecretary(true).canBeMember(true).currentLoad(2).build());
        lecturers.put(502L, MockLecturer.builder().lecturerId(502L).fullName("PGS. Tran Van Binh").email("binh@utc.edu.vn").degree("ASSOCIATE_PROFESSOR").canBePresident(true).canBeSecretary(false).canBeMember(true).currentLoad(1).build());
        lecturers.put(503L, MockLecturer.builder().lecturerId(503L).fullName("TS. Le Thi Mai").email("mai@utc.edu.vn").degree("DOCTOR").canBePresident(true).canBeSecretary(true).canBeMember(true).currentLoad(0).build());
        lecturers.put(504L, MockLecturer.builder().lecturerId(504L).fullName("ThS. Pham Van Dong").email("dong@utc.edu.vn").degree("MASTER").canBePresident(false).canBeSecretary(true).canBeMember(true).currentLoad(0).build());
        lecturers.put(505L, MockLecturer.builder().lecturerId(505L).fullName("ThS. Hoang Thi Cuc").email("cuc@utc.edu.vn").degree("MASTER").canBePresident(false).canBeSecretary(true).canBeMember(true).currentLoad(1).build());
        lecturers.put(506L, MockLecturer.builder().lecturerId(506L).fullName("TS. Do Van Giang").email("giang@utc.edu.vn").degree("DOCTOR").canBePresident(true).canBeSecretary(true).canBeMember(true).currentLoad(0).build());
        lecturers.put(507L, MockLecturer.builder().lecturerId(507L).fullName("ThS. Vu Thi Lan").email("lan@utc.edu.vn").degree("MASTER").canBePresident(false).canBeSecretary(true).canBeMember(true).currentLoad(0).build());
        lecturers.put(508L, MockLecturer.builder().lecturerId(508L).fullName("TS. Nguyen Van Thanh").email("thanh@utc.edu.vn").degree("DOCTOR").canBePresident(true).canBeSecretary(true).canBeMember(true).currentLoad(0).build());
        lecturers.put(509L, MockLecturer.builder().lecturerId(509L).fullName("ThS. Pham Minh Tuan").email("tuan@utc.edu.vn").degree("MASTER").canBePresident(false).canBeSecretary(true).canBeMember(true).currentLoad(0).build());
    }

    public Optional<MockThesis> getThesis(Long thesisId) {
        return Optional.ofNullable(theses.get(thesisId));
    }

    public List<MockThesis> getThesesByProjectRound(Long projectRoundId) {
        List<MockThesis> result = new ArrayList<>();
        for (MockThesis t : theses.values()) {
            if (Objects.equals(t.getProjectRoundId(), projectRoundId)) {
                result.add(t);
            }
        }
        return result;
    }

    public List<MockLecturer> getAllLecturers() {
        return new ArrayList<>(lecturers.values());
    }

    public Optional<MockLecturer> getLecturer(Long lecturerId) {
        return Optional.ofNullable(lecturers.get(lecturerId));
    }

    public void addThesis(MockThesis thesis) {
        theses.put(thesis.getThesisId(), thesis);
    }

    public void addLecturer(MockLecturer lecturer) {
        lecturers.put(lecturer.getLecturerId(), lecturer);
    }
}
