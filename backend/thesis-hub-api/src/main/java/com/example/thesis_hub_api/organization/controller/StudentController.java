package com.example.thesis_hub_api.organization.controller;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.organization.dto.request.CreateStudentRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateStudentRequestDTO;
import com.example.thesis_hub_api.organization.dto.response.StudentResponseDTO;
import com.example.thesis_hub_api.organization.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
@Tag(name = "Student Management", description = "Các API tra cứu và quản lý hồ sơ sinh viên")
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    @Operation(summary = "Danh sách sinh viên phân trang", description = "Lọc theo ngành, chương trình đào tạo, đợt đồ án, lớp và tìm kiếm theo tên hoặc mã sinh viên")
    public ResponseEntity<ApiResponse<PageResponse<StudentResponseDTO>>> getStudents(
            @RequestParam(required = false) Long majorId,
            @RequestParam(required = false, name = "programId") Long programId,
            @RequestParam(required = false, name = "trainingProgramId") Long trainingProgramId,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long projectRoundId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
        
        Long effectiveProgramId = trainingProgramId != null ? trainingProgramId : programId;

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        PageResponse<StudentResponseDTO> result = studentService.getStudents(majorId, effectiveProgramId, className, search, projectRoundId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một sinh viên theo ID")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> getStudentById(@PathVariable Long id) {
        StudentResponseDTO student = studentService.getStudentById(id);
        return ResponseEntity.ok(ApiResponse.success(student));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Tạo mới hồ sơ sinh viên (Admin)")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> createStudent(
            @Valid @RequestBody CreateStudentRequestDTO dto) {
        StudentResponseDTO created = studentService.createStudent(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới sinh viên thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật hồ sơ sinh viên (Admin)")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStudentRequestDTO dto) {
        StudentResponseDTO updated = studentService.updateStudent(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin sinh viên thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Xóa sinh viên (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sinh viên thành công", null));
    }
}
