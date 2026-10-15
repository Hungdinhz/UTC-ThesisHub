package com.example.thesis_hub_api.defense.algorithm;

import com.example.thesis_hub_api.defense.dto.CouncilSchedulingRequestDTO;
import com.example.thesis_hub_api.defense.dto.CouncilSchedulingResultDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

public class CouncilAssignmentAlgorithmTest {

    private DefenseCouncilScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DefenseCouncilScheduler();
    }

    @Test
    void testSchedule_Success_StandardCase() {
        CouncilSchedulingRequestDTO req = new CouncilSchedulingRequestDTO();
        
        CouncilSchedulingRequestDTO.StudentInfo s1 = new CouncilSchedulingRequestDTO.StudentInfo();
        s1.setStudentId("S1");
        s1.setAdvisorId("L99");
        
        req.setStudents(Arrays.asList(s1));
        
        // 5 eligible lecturers
        CouncilSchedulingRequestDTO.LecturerInfo l1 = createLecturer("L1", true, false, false);
        CouncilSchedulingRequestDTO.LecturerInfo l2 = createLecturer("L2", false, true, false);
        CouncilSchedulingRequestDTO.LecturerInfo l3 = createLecturer("L3", false, true, false);
        CouncilSchedulingRequestDTO.LecturerInfo l4 = createLecturer("L4", false, false, true);
        CouncilSchedulingRequestDTO.LecturerInfo l5 = createLecturer("L5", false, false, true);
        
        req.setLecturers(Arrays.asList(l1, l2, l3, l4, l5));
        
        CouncilSchedulingResultDTO res = scheduler.schedule(req);
        
        assertEquals(1, res.getCouncils().size());
        assertEquals("L1", res.getCouncils().get(0).getPresidentId());
        assertTrue(Arrays.asList("L2", "L3").contains(res.getCouncils().get(0).getSecretary1Id()));
    }

    @Test
    void testSchedule_ConflictOfInterest_GVHD() {
        CouncilSchedulingRequestDTO req = new CouncilSchedulingRequestDTO();
        
        CouncilSchedulingRequestDTO.StudentInfo s1 = new CouncilSchedulingRequestDTO.StudentInfo();
        s1.setStudentId("S1");
        s1.setAdvisorId("L1"); // Advisor is L1
        
        req.setStudents(Arrays.asList(s1));
        
        // L1 is the only president initially, but is also advisor
        CouncilSchedulingRequestDTO.LecturerInfo l1 = createLecturer("L1", true, false, false);
        CouncilSchedulingRequestDTO.LecturerInfo l2 = createLecturer("L2", false, true, false);
        CouncilSchedulingRequestDTO.LecturerInfo l3 = createLecturer("L3", false, true, false);
        CouncilSchedulingRequestDTO.LecturerInfo l4 = createLecturer("L4", false, false, true);
        CouncilSchedulingRequestDTO.LecturerInfo l5 = createLecturer("L5", false, false, true);
        
        // Add a second president L6 so algorithm can backtrack to L6
        CouncilSchedulingRequestDTO.LecturerInfo l6 = createLecturer("L6", true, false, false);

        req.setLecturers(Arrays.asList(l1, l2, l3, l4, l5, l6));
        
        CouncilSchedulingResultDTO res = scheduler.schedule(req);
        
        assertEquals(1, res.getCouncils().size());
        assertEquals("L6", res.getCouncils().get(0).getPresidentId(), "Must backtrack and choose L6 since L1 is advisor");
    }

    @Test
    void testSchedule_Failure_NoEligiblePresident() {
        CouncilSchedulingRequestDTO req = new CouncilSchedulingRequestDTO();
        
        CouncilSchedulingRequestDTO.StudentInfo s1 = new CouncilSchedulingRequestDTO.StudentInfo();
        s1.setStudentId("S1");
        req.setStudents(Arrays.asList(s1));
        
        // No president
        CouncilSchedulingRequestDTO.LecturerInfo l2 = createLecturer("L2", false, true, false);
        CouncilSchedulingRequestDTO.LecturerInfo l3 = createLecturer("L3", false, true, false);
        CouncilSchedulingRequestDTO.LecturerInfo l4 = createLecturer("L4", false, false, true);
        CouncilSchedulingRequestDTO.LecturerInfo l5 = createLecturer("L5", false, false, true);
        CouncilSchedulingRequestDTO.LecturerInfo l6 = createLecturer("L6", false, false, true);
        
        req.setLecturers(Arrays.asList(l2, l3, l4, l5, l6));
        
        CouncilSchedulingResultDTO res = scheduler.schedule(req);
        
        assertTrue(res.getCouncils().isEmpty());
        assertFalse(res.getUnassignedStudentIds().isEmpty());
    }
    
    private CouncilSchedulingRequestDTO.LecturerInfo createLecturer(String id, boolean pres, boolean sec, boolean mem) {
        CouncilSchedulingRequestDTO.LecturerInfo l = new CouncilSchedulingRequestDTO.LecturerInfo();
        l.setLecturerId(id);
        l.setPresidentEligible(pres);
        l.setSecretaryEligible(sec);
        l.setMemberEligible(mem);
        l.setCurrentLoad(0);
        return l;
    }
}
