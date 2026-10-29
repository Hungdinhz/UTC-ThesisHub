package com.example.thesis_hub_api.assignment;

import com.example.thesis_hub_api.assignment.algorithm.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Assignment Algorithm Unit Tests")
class AssignmentAlgorithmTest {

    private AssignmentAlgorithm algorithm;
    private AssignmentConstraints constraints;

    @BeforeEach
    void setUp() {
        constraints = new AssignmentConstraints();
        algorithm = new AssignmentAlgorithm(constraints);
    }

    @Test
    @DisplayName("Case 1: NV1 is satisfied when capacity and constraints allow")
    void testCase1_NV1_Satisfied() {
        // Lecturer 101 has capacity 2, teaches direction 1
        LecturerAssignmentInput l1 = LecturerAssignmentInput.builder()
                .lecturerId(101L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(2)
                .currentAssigned(0)
                .directionIds(Collections.singletonList(1L))
                .build();

        // Student 1 picks Lecturer 101 as NV1
        StudentAssignmentInput s1 = StudentAssignmentInput.builder()
                .studentId(1L)
                .directionId(1L)
                .trainingProgramCode("CU_NHAN")
                .gpa(3.5)
                .preferences(Collections.singletonList(
                        new StudentAssignmentInput.PreferenceEntry(1, 101L)
                ))
                .build();

        List<AssignmentMatchResult> results = algorithm.executeMatching(
                Collections.singletonList(s1),
                Collections.singletonList(l1)
        );

        assertEquals(1, results.size());
        AssignmentMatchResult match = results.get(0);
        assertEquals(101L, match.getLecturerId());
        assertEquals(1, match.getMatchedPriority()); // NV1
        assertEquals("PROPOSED", match.getStatus());
    }

    @Test
    @DisplayName("Case 2: NV1 is full, but NV2 is satisfied")
    void testCase2_NV1_Full_NV2_Satisfied() {
        // Lecturer 101 has capacity 1, Lecturer 102 has capacity 2
        LecturerAssignmentInput l1 = LecturerAssignmentInput.builder()
                .lecturerId(101L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(1)
                .currentAssigned(0)
                .directionIds(Collections.singletonList(1L))
                .build();

        LecturerAssignmentInput l2 = LecturerAssignmentInput.builder()
                .lecturerId(102L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(2)
                .currentAssigned(0)
                .directionIds(Collections.singletonList(1L))
                .build();

        // Student 1 has higher GPA (3.8), chooses L101 as NV1
        StudentAssignmentInput s1 = StudentAssignmentInput.builder()
                .studentId(1L)
                .directionId(1L)
                .trainingProgramCode("CU_NHAN")
                .gpa(3.8)
                .preferences(Collections.singletonList(new StudentAssignmentInput.PreferenceEntry(1, 101L)))
                .build();

        // Student 2 has GPA 3.2, chooses L101 as NV1, L102 as NV2
        StudentAssignmentInput s2 = StudentAssignmentInput.builder()
                .studentId(2L)
                .directionId(1L)
                .trainingProgramCode("CU_NHAN")
                .gpa(3.2)
                .preferences(Arrays.asList(
                        new StudentAssignmentInput.PreferenceEntry(1, 101L),
                        new StudentAssignmentInput.PreferenceEntry(2, 102L)
                ))
                .build();

        List<AssignmentMatchResult> results = algorithm.executeMatching(
                Arrays.asList(s1, s2),
                Arrays.asList(l1, l2)
        );

        Map<Long, AssignmentMatchResult> resultMap = new HashMap<>();
        results.forEach(r -> resultMap.put(r.getStudentId(), r));

        // S1 gets L101 via NV1
        assertEquals(101L, resultMap.get(1L).getLecturerId());
        assertEquals(1, resultMap.get(1L).getMatchedPriority());

        // S2 misses NV1 (L101 full) and gets L102 via NV2
        assertEquals(102L, resultMap.get(2L).getLecturerId());
        assertEquals(2, resultMap.get(2L).getMatchedPriority());
    }

    @Test
    @DisplayName("Case 3: Insufficient capacity resulting in fallback or unassigned")
    void testCase3_InsufficientCapacity() {
        // Lecturer 101 has capacity 1 only
        LecturerAssignmentInput l1 = LecturerAssignmentInput.builder()
                .lecturerId(101L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(1)
                .currentAssigned(0)
                .directionIds(Collections.singletonList(1L))
                .build();

        // Two students both choose L101, neither has NV2/NV3 and no other lecturer exists in direction 1
        StudentAssignmentInput s1 = StudentAssignmentInput.builder()
                .studentId(1L)
                .directionId(1L)
                .trainingProgramCode("CU_NHAN")
                .gpa(3.9)
                .preferences(Collections.singletonList(new StudentAssignmentInput.PreferenceEntry(1, 101L)))
                .build();

        StudentAssignmentInput s2 = StudentAssignmentInput.builder()
                .studentId(2L)
                .directionId(1L)
                .trainingProgramCode("CU_NHAN")
                .gpa(3.0)
                .preferences(Collections.singletonList(new StudentAssignmentInput.PreferenceEntry(1, 101L)))
                .build();

        List<AssignmentMatchResult> results = algorithm.executeMatching(
                Arrays.asList(s1, s2),
                Collections.singletonList(l1)
        );

        Map<Long, AssignmentMatchResult> resultMap = new HashMap<>();
        results.forEach(r -> resultMap.put(r.getStudentId(), r));

        assertEquals(101L, resultMap.get(1L).getLecturerId());
        assertEquals("PROPOSED", resultMap.get(1L).getStatus());

        // S2 cannot be assigned due to no available slots
        assertNull(resultMap.get(2L).getLecturerId());
        assertEquals("UNASSIGNED", resultMap.get(2L).getStatus());
    }

    @Test
    @DisplayName("Case 4: Engineering (KY_SU) degree constraint rejection")
    void testCase4_DegreeConstraintViolation() {
        // Lecturer 101 is only Master (THAC_SI)
        LecturerAssignmentInput l1 = LecturerAssignmentInput.builder()
                .lecturerId(101L)
                .academicDegree("THAC_SI")
                .effectiveCapacity(5)
                .currentAssigned(0)
                .directionIds(Collections.singletonList(1L))
                .build();

        // Lecturer 102 is Doctor (TIEN_SI)
        LecturerAssignmentInput l2 = LecturerAssignmentInput.builder()
                .lecturerId(102L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(5)
                .currentAssigned(0)
                .directionIds(Collections.singletonList(1L))
                .build();

        // Student is Engineering program (KY_SU), chooses L101 (THAC_SI) as NV1 and L102 (TIEN_SI) as NV2
        StudentAssignmentInput s = StudentAssignmentInput.builder()
                .studentId(1L)
                .directionId(1L)
                .trainingProgramCode("KY_SU")
                .gpa(3.5)
                .preferences(Arrays.asList(
                        new StudentAssignmentInput.PreferenceEntry(1, 101L),
                        new StudentAssignmentInput.PreferenceEntry(2, 102L)
                ))
                .build();

        List<AssignmentMatchResult> results = algorithm.executeMatching(
                Collections.singletonList(s),
                Arrays.asList(l1, l2)
        );

        assertEquals(1, results.size());
        // NV1 (THAC_SI) must be skipped because student is KY_SU; student gets NV2 (TIEN_SI)
        assertEquals(102L, results.get(0).getLecturerId());
        assertEquals(2, results.get(0).getMatchedPriority());
    }

    @Test
    @DisplayName("Case 5: Multiple students competing for one lecturer resolved by GPA")
    void testCase5_MultipleStudents_Compete_ResolvedByGpa() {
        LecturerAssignmentInput l = LecturerAssignmentInput.builder()
                .lecturerId(101L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(2) // Only 2 slots
                .currentAssigned(0)
                .directionIds(Collections.singletonList(1L))
                .build();

        // 3 students all want Lecturer 101 for NV1
        StudentAssignmentInput s1 = StudentAssignmentInput.builder()
                .studentId(1L).directionId(1L).trainingProgramCode("CU_NHAN").gpa(3.1)
                .preferences(Collections.singletonList(new StudentAssignmentInput.PreferenceEntry(1, 101L)))
                .build();

        StudentAssignmentInput s2 = StudentAssignmentInput.builder()
                .studentId(2L).directionId(1L).trainingProgramCode("CU_NHAN").gpa(3.9)
                .preferences(Collections.singletonList(new StudentAssignmentInput.PreferenceEntry(1, 101L)))
                .build();

        StudentAssignmentInput s3 = StudentAssignmentInput.builder()
                .studentId(3L).directionId(1L).trainingProgramCode("CU_NHAN").gpa(3.6)
                .preferences(Collections.singletonList(new StudentAssignmentInput.PreferenceEntry(1, 101L)))
                .build();

        List<AssignmentMatchResult> results = algorithm.executeMatching(
                Arrays.asList(s1, s2, s3),
                Collections.singletonList(l)
        );

        Map<Long, AssignmentMatchResult> map = new HashMap<>();
        results.forEach(r -> map.put(r.getStudentId(), r));

        // S2 (3.9) and S3 (3.6) should win the 2 slots
        assertEquals(101L, map.get(2L).getLecturerId());
        assertEquals(101L, map.get(3L).getLecturerId());

        // S1 (3.1) loses slot
        assertNull(map.get(1L).getLecturerId());
    }

    @Test
    @DisplayName("Case 6: Load balancing when fallback assigning unplaced students")
    void testCase6_LoadBalancing_Fallback() {
        // Lecturer A has 1 assigned out of 3 (load = 0.33)
        LecturerAssignmentInput lA = LecturerAssignmentInput.builder()
                .lecturerId(101L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(3)
                .currentAssigned(1)
                .directionIds(Collections.singletonList(1L))
                .build();

        // Lecturer B has 0 assigned out of 3 (load = 0.0) -> lower load
        LecturerAssignmentInput lB = LecturerAssignmentInput.builder()
                .lecturerId(102L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(3)
                .currentAssigned(0)
                .directionIds(Collections.singletonList(1L))
                .build();

        // Student has no preferences (e.g. didn't submit or preferences were full)
        StudentAssignmentInput s = StudentAssignmentInput.builder()
                .studentId(1L)
                .directionId(1L)
                .trainingProgramCode("CU_NHAN")
                .gpa(3.0)
                .preferences(Collections.emptyList())
                .build();

        List<AssignmentMatchResult> results = algorithm.executeMatching(
                Collections.singletonList(s),
                Arrays.asList(lA, lB)
        );

        assertEquals(1, results.size());
        // Should balance load to Lecturer B who currently has 0 load
        assertEquals(102L, results.get(0).getLecturerId());
        assertEquals(0, results.get(0).getMatchedPriority());
    }

    @Test
    @DisplayName("Case 7: Student registered lecturer full -> assigned to lecturer with most remaining capacity and any direction")
    void testCase7_RegisteredLecturerFull_AssignedToLecturerWithMostRemainingCapacityAndAnyDirection() {
        // L1 is in Direction 10, capacity 1
        LecturerAssignmentInput l1 = LecturerAssignmentInput.builder()
                .lecturerId(101L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(1)
                .currentAssigned(0)
                .directionIds(Collections.singletonList(10L))
                .build();

        // L2 is in Direction 10, remaining capacity 1
        LecturerAssignmentInput l2 = LecturerAssignmentInput.builder()
                .lecturerId(102L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(2)
                .currentAssigned(1) // remaining = 1
                .directionIds(Collections.singletonList(10L))
                .build();

        // L3 is in Direction 20, remaining capacity 5 (nhiều chỉ tiêu nhất)
        LecturerAssignmentInput l3 = LecturerAssignmentInput.builder()
                .lecturerId(103L)
                .academicDegree("TIEN_SI")
                .effectiveCapacity(5)
                .currentAssigned(0) // remaining = 5
                .directionIds(Collections.singletonList(20L))
                .build();

        // S1 has GPA 3.8, picks L1
        StudentAssignmentInput s1 = StudentAssignmentInput.builder()
                .studentId(1L)
                .directionId(10L)
                .trainingProgramCode("CU_NHAN")
                .gpa(3.8)
                .preferences(Collections.singletonList(new StudentAssignmentInput.PreferenceEntry(1, 101L)))
                .build();

        // S2 has GPA 3.2, picks L1 (hết chỉ tiêu vì S1 lấy rồi)
        StudentAssignmentInput s2 = StudentAssignmentInput.builder()
                .studentId(2L)
                .directionId(10L)
                .trainingProgramCode("CU_NHAN")
                .gpa(3.2)
                .preferences(Collections.singletonList(new StudentAssignmentInput.PreferenceEntry(1, 101L)))
                .build();

        List<AssignmentMatchResult> results = algorithm.executeMatching(
                Arrays.asList(s1, s2),
                Arrays.asList(l1, l2, l3)
        );

        Map<Long, AssignmentMatchResult> map = new HashMap<>();
        results.forEach(r -> map.put(r.getStudentId(), r));

        // S1 gets L1 via NV1
        assertEquals(101L, map.get(1L).getLecturerId());
        assertEquals(10L, map.get(1L).getDirectionId());
        assertEquals(1, map.get(1L).getMatchedPriority());

        // S2 misses L1 (hết chỉ tiêu), gets L3 who has most remaining capacity (5 > 1), and assigned direction 20 (hướng bất kì)
        assertEquals(103L, map.get(2L).getLecturerId());
        assertEquals(20L, map.get(2L).getDirectionId());
        assertEquals(0, map.get(2L).getMatchedPriority());
        assertEquals("PROPOSED", map.get(2L).getStatus());
        assertTrue(map.get(2L).getNotes().contains("hướng bất kì"));
    }
}
