package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.dto.LecturerCapacityRequest;
import com.example.thesis_hub_api.assignment.dto.LecturerCapacityResponse;
import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import com.example.thesis_hub_api.assignment.mapper.LecturerCapacityMapper;
import com.example.thesis_hub_api.assignment.repository.LecturerCapacityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CapacityCalculatorTest {

    @Mock
    private LecturerCapacityRepository repository;

    @Mock
    private IdentitySharedService identitySharedService;

    @Mock
    private LecturerCapacityMapper mapper;

    @InjectMocks
    private LecturerCapacityServiceImpl service;

    private LecturerCapacity testCapacity;

    @BeforeEach
    void setUp() {
        testCapacity = LecturerCapacity.builder()
                .id(1)
                .lecturerId(101)
                .projectRoundId(201)
                .baseQuota(10)
                .capacityCoefficient(new BigDecimal("1.50"))
                .assignedCount(0)
                .build();
        testCapacity.calculateEffectiveCapacity();
    }

    @Test
    void testEffectiveCapacityCalculation() {
        // Tính đúng effective_capacity khi có capacity_coefficient khác 1 (ví dụ 1.5).
        assertEquals(15, testCapacity.getEffectiveCapacity());
    }

    @Test
    void testRemainingCapacityDecrease() {
        // remaining_capacity giảm đúng khi có thêm 1 phân công mới.
        testCapacity.setAssignedCount(5);
        assertEquals(10, testCapacity.getRemainingCapacity());
    }

    @Test
    void testRemainingCapacityIncrease() {
        // remaining_capacity tăng lại khi 1 phân công bị hủy/override.
        testCapacity.setAssignedCount(5);
        assertEquals(10, testCapacity.getRemainingCapacity());

        testCapacity.setAssignedCount(4);
        assertEquals(11, testCapacity.getRemainingCapacity());
    }

    @Test
    void testAvailableLecturersFilter() {
        // Giảng viên có remaining_capacity = 0 không xuất hiện trong danh sách "còn khả năng nhận".
        LecturerCapacity fullCapacity = LecturerCapacity.builder()
                .id(2)
                .lecturerId(102)
                .projectRoundId(201)
                .baseQuota(10)
                .capacityCoefficient(new BigDecimal("1.00"))
                .assignedCount(10) // assigned == effective -> remaining = 0
                .build();
        fullCapacity.calculateEffectiveCapacity();

        when(repository.findByProjectRoundId(201)).thenReturn(List.of(testCapacity, fullCapacity));
        when(mapper.toResponse(any())).thenAnswer(invocation -> {
            LecturerCapacity c = invocation.getArgument(0);
            return LecturerCapacityResponse.builder().id(c.getId()).build();
        });

        List<LecturerCapacityResponse> available = service.getAvailableLecturers(201, null);

        assertEquals(1, available.size());
        assertEquals(1, available.get(0).getId()); // Only testCapacity should be returned
    }

    @Test
    void testPreventDuplicateCapacity() {
        // Không cho tạo chỉ tiêu trùng (lecturer_id + project_round_id đã tồn tại).
        LecturerCapacityRequest request = new LecturerCapacityRequest();
        request.setLecturerId(101);
        request.setProjectRoundId(201);
        request.setBaseQuota(10);
        request.setCapacityCoefficient(new BigDecimal("1.00"));

        when(identitySharedService.verifyRole(101, "LECTURER")).thenReturn(true);
        when(repository.findByLecturerIdAndProjectRoundId(101, 201)).thenReturn(Optional.of(testCapacity));

        Exception exception = assertThrows(IllegalArgumentException.class, () -> service.createCapacity(request));
        assertTrue(exception.getMessage().contains("Capacity already exists"));
    }
}
