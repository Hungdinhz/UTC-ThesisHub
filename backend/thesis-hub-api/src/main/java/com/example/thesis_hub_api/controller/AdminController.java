package com.example.thesis_hub_api.controller;

import com.example.thesis_hub_api.entity.Council;
import com.example.thesis_hub_api.entity.Semester;
import com.example.thesis_hub_api.entity.ThesisTopic;
import com.example.thesis_hub_api.entity.User;
import com.example.thesis_hub_api.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/semesters")
    public ResponseEntity<Semester> createSemester(@RequestBody Semester semester) {
        return ResponseEntity.ok(adminService.createSemester(semester));
    }

    @PostMapping("/councils")
    public ResponseEntity<Council> createCouncil(@RequestBody Council council) {
        return ResponseEntity.ok(adminService.createCouncil(council));
    }

    @PutMapping("/topics/{id}/assign-supervisor")
    public ResponseEntity<ThesisTopic> assignSupervisor(
            @PathVariable Long id,
            @RequestParam Long supervisorId) {
        return ResponseEntity.ok(adminService.assignSupervisor(id, supervisorId));
    }
}
