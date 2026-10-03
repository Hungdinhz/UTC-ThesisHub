package com.example.thesis_hub_api.assignment.algorithm;

import com.example.thesis_hub_api.assignment.entity.*;
import com.example.thesis_hub_api.assignment.repository.LecturerCapacityRepository;
import com.example.thesis_hub_api.assignment.repository.PreferenceRepository;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AssignmentAlgorithmTest {

    @Mock
    private PreferenceRepository preferenceRepository;
    @Mock
    private LecturerCapacityRepository capacityRepository;
    @Mock
    private SupervisorAssignmentRepository assignmentRepository;
    @Mock
    private HardConstraintRule hardConstraintRule;
    @Mock
    private SoftConstraintScorer softConstraintScorer;

    @InjectMocks
    private AssignmentAlgorithmEngine engine;

    private Integer roundId = 1;

    @BeforeEach
    void setUp() {
        when(hardConstraintRule.isValid(any(), any(), anyBoolean())).thenReturn(true);
    }

    @Test
    void testNV1DuocDapUng() {
        // Setup 1 student with NV1, lecturer has enough capacity
        DirectionRegistration reg = new DirectionRegistration();
        reg.setStudentId(101);
        ProjectDirection pd = new ProjectDirection(); pd.setId(1);
        reg.setProjectDirection(pd);

        Preference pref1 = new Preference();
        pref1.setDirectionRegistration(reg);
        pref1.setLecturerId(201);
        pref1.setPriorityOrder(1);

        LecturerCapacity cap = new LecturerCapacity();
        cap.setLecturerId(201);
        cap.setEffectiveCapacity(2);

        when(preferenceRepository.findByDirectionRegistrationProjectRoundId(roundId))
                .thenReturn(List.of(pref1));
        when(capacityRepository.findByProjectRoundId(roundId))
                .thenReturn(List.of(cap));
        when(softConstraintScorer.calculateScore(pref1)).thenReturn(100);

        List<SupervisorAssignment> results = engine.generateProposals(roundId);

        assertEquals(1, results.size());
        assertEquals(101, results.get(0).getStudentId());
        assertEquals(201, results.get(0).getLecturerId());
        assertEquals(1, results.get(0).getPreferenceOrder());
    }

    @Test
    void testHetCapacityChuyenNV2() {
        // Lecturer 201 capacity = 0, so student moves to NV2 (Lecturer 202)
        DirectionRegistration reg = new DirectionRegistration();
        reg.setStudentId(101);
        ProjectDirection pd = new ProjectDirection(); pd.setId(1);
        reg.setProjectDirection(pd);

        Preference pref1 = new Preference(); pref1.setDirectionRegistration(reg); pref1.setLecturerId(201); pref1.setPriorityOrder(1);
        Preference pref2 = new Preference(); pref2.setDirectionRegistration(reg); pref2.setLecturerId(202); pref2.setPriorityOrder(2);

        LecturerCapacity cap1 = new LecturerCapacity(); cap1.setLecturerId(201); cap1.setEffectiveCapacity(0); // Full
        LecturerCapacity cap2 = new LecturerCapacity(); cap2.setLecturerId(202); cap2.setEffectiveCapacity(1); // Available

        when(preferenceRepository.findByDirectionRegistrationProjectRoundId(roundId))
                .thenReturn(Arrays.asList(pref1, pref2));
        when(capacityRepository.findByProjectRoundId(roundId))
                .thenReturn(Arrays.asList(cap1, cap2));
        when(softConstraintScorer.calculateScore(pref1)).thenReturn(100);
        when(softConstraintScorer.calculateScore(pref2)).thenReturn(60);

        List<SupervisorAssignment> results = engine.generateProposals(roundId);

        assertEquals(1, results.size());
        assertEquals(202, results.get(0).getLecturerId()); // Assigned to NV2
        assertEquals(2, results.get(0).getPreferenceOrder());
    }

    @Test
    void testNhieuSvcungChonGiangVien_UuTienDiemCao() {
        // SV1 has 100 points, SV2 has 110 points. Lecturer capacity = 1.
        DirectionRegistration reg1 = new DirectionRegistration(); reg1.setStudentId(101);
        ProjectDirection pd = new ProjectDirection(); pd.setId(1); reg1.setProjectDirection(pd);
        
        DirectionRegistration reg2 = new DirectionRegistration(); reg2.setStudentId(102);
        reg2.setProjectDirection(pd);

        Preference pref1 = new Preference(); pref1.setDirectionRegistration(reg1); pref1.setLecturerId(201); pref1.setPriorityOrder(1);
        Preference pref2 = new Preference(); pref2.setDirectionRegistration(reg2); pref2.setLecturerId(201); pref2.setPriorityOrder(1);

        LecturerCapacity cap = new LecturerCapacity(); cap.setLecturerId(201); cap.setEffectiveCapacity(1);

        when(preferenceRepository.findByDirectionRegistrationProjectRoundId(roundId))
                .thenReturn(Arrays.asList(pref1, pref2));
        when(capacityRepository.findByProjectRoundId(roundId))
                .thenReturn(List.of(cap));
        when(softConstraintScorer.calculateScore(pref1)).thenReturn(100);
        when(softConstraintScorer.calculateScore(pref2)).thenReturn(110);

        List<SupervisorAssignment> results = engine.generateProposals(roundId);

        // Capacity is 1, so only 1 should be assigned to 201
        assertEquals(1, results.size());
        assertEquals(102, results.get(0).getStudentId()); // SV2 wins
    }
}
