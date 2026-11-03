package com.example.thesis_hub_api.defense.algorithm;

import com.example.thesis_hub_api.defense.dto.CouncilSchedulingRequestDTO;
import com.example.thesis_hub_api.defense.dto.CouncilSchedulingResultDTO;
import com.example.thesis_hub_api.defense.dto.CouncilSchedulingRequestDTO.LecturerInfo;
import com.example.thesis_hub_api.defense.dto.CouncilSchedulingRequestDTO.StudentInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DefenseCouncilSchedulerTest {

    private DefenseCouncilScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DefenseCouncilScheduler();
    }

    @Test
    void testSchedule_Success() {
        // Arrange
        StudentInfo s1 = new StudentInfo();
        s1.setStudentId("student1");
        s1.setAdvisorId("lec_advisor");

        LecturerInfo l1 = createLecturer("lec1", true, false, false, 2); // President
        LecturerInfo l2 = createLecturer("lec2", false, true, false, 1); // Secretary
        LecturerInfo l3 = createLecturer("lec3", false, false, true, 3); // Reviewer 1
        LecturerInfo l4 = createLecturer("lec4", false, false, true, 0); // Reviewer 2
        LecturerInfo l5 = createLecturer("lec5", false, false, true, 0); // Member
        LecturerInfo lAdvisor = createLecturer("lec_advisor", true, true, true, 0); // Advisor, should be excluded

        CouncilSchedulingRequestDTO request = new CouncilSchedulingRequestDTO();
        request.setStudents(List.of(s1));
        request.setLecturers(Arrays.asList(l1, l2, l3, l4, l5, lAdvisor));

        // Act
        CouncilSchedulingResultDTO result = scheduler.schedule(request);

        // Assert
        assertTrue(result.getUnassignedStudentIds().isEmpty());
        assertEquals(1, result.getCouncils().size());

        CouncilSchedulingResultDTO.CouncilResult council = result.getCouncils().get(0);
        assertEquals("lec1", council.getPresidentId());
        assertEquals("lec2", council.getSecretaryId());
        
        // Assert advisor is not in the council
        assertNotEquals("lec_advisor", council.getPresidentId());
        assertNotEquals("lec_advisor", council.getSecretaryId());
        assertNotEquals("lec_advisor", council.getReviewer1Id());
        assertNotEquals("lec_advisor", council.getReviewer2Id());
        assertNotEquals("lec_advisor", council.getMemberId());

        assertTrue(council.getStudentIds().contains("student1"));
    }

    @Test
    void testSchedule_FailureDueToConstraints() {
        // Arrange
        StudentInfo s1 = new StudentInfo();
        s1.setStudentId("student1");
        s1.setAdvisorId("lec_advisor");

        // Not enough members
        LecturerInfo l1 = createLecturer("lec1", true, false, false, 2);
        LecturerInfo l2 = createLecturer("lec2", false, true, false, 1);
        LecturerInfo lAdvisor = createLecturer("lec_advisor", false, false, true, 0);

        CouncilSchedulingRequestDTO request = new CouncilSchedulingRequestDTO();
        request.setStudents(List.of(s1));
        request.setLecturers(Arrays.asList(l1, l2, lAdvisor));

        // Act
        CouncilSchedulingResultDTO result = scheduler.schedule(request);

        // Assert
        assertFalse(result.getUnassignedStudentIds().isEmpty());
        assertTrue(result.getUnassignedStudentIds().contains("student1"));
        assertNotNull(result.getErrorMessage());
        assertTrue(result.getCouncils().isEmpty());
    }
    
    @Test
    void testSchedule_GreedyLoadBalancing() {
        // Arrange
        StudentInfo s1 = new StudentInfo();
        s1.setStudentId("student1");
        s1.setAdvisorId("other_adv");

        // Two possible presidents, one with load 10, one with load 1
        LecturerInfo pHighLoad = createLecturer("p_high", true, false, false, 10);
        LecturerInfo pLowLoad = createLecturer("p_low", true, false, false, 1);
        
        LecturerInfo l2 = createLecturer("lec2", false, true, false, 1);
        LecturerInfo l3 = createLecturer("lec3", false, false, true, 3);
        LecturerInfo l4 = createLecturer("lec4", false, false, true, 0);
        LecturerInfo l5 = createLecturer("lec5", false, false, true, 0);

        CouncilSchedulingRequestDTO request = new CouncilSchedulingRequestDTO();
        request.setStudents(List.of(s1));
        request.setLecturers(Arrays.asList(pHighLoad, pLowLoad, l2, l3, l4, l5));

        // Act
        CouncilSchedulingResultDTO result = scheduler.schedule(request);

        // Assert
        assertEquals(1, result.getCouncils().size());
        CouncilSchedulingResultDTO.CouncilResult council = result.getCouncils().get(0);
        
        // pLowLoad should be chosen because of greedy load sorting
        assertEquals("p_low", council.getPresidentId());
    }

    private LecturerInfo createLecturer(String id, boolean p, boolean s, boolean m, int load) {
        LecturerInfo l = new LecturerInfo();
        l.setLecturerId(id);
        l.setPresidentEligible(p);
        l.setSecretaryEligible(s);
        l.setMemberEligible(m);
        l.setCurrentLoad(load);
        return l;
    }
}
