package com.example.thesis_hub_api.security.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.security.dto.AuditLogFilterDTO;
import com.example.thesis_hub_api.security.dto.AuditLogResponseDTO;
import com.example.thesis_hub_api.security.dto.AuditLogStatsDTO;
import com.example.thesis_hub_api.security.entity.AuditLog;
import com.example.thesis_hub_api.security.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper = createObjectMapper();

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLogResponseDTO recordLog(
            Long actorId,
            String actorUsername,
            String actorFullName,
            String actorRole,
            String actionType,
            String moduleName,
            String targetEntity,
            String targetId,
            String summary,
            Object oldValues,
            Object newValues,
            String requestMethod,
            String requestUri,
            String ipAddress,
            String userAgent,
            String severity,
            String status,
            String errorMessage,
            Long executionTimeMs
    ) {
        try {
            AuditLog entity = AuditLog.builder()
                    .actorId(actorId)
                    .actorUsername(actorUsername)
                    .actorFullName(actorFullName)
                    .actorRole(actorRole)
                    .actionType(actionType != null ? actionType : "UNKNOWN")
                    .moduleName(moduleName != null ? moduleName : "SYSTEM")
                    .targetEntity(targetEntity)
                    .targetId(targetId)
                    .summary(StringUtils.hasText(summary) ? summary : actionType)
                    .oldValues(toJsonString(oldValues))
                    .newValues(toJsonString(newValues))
                    .requestMethod(requestMethod)
                    .requestUri(requestUri)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .severity(StringUtils.hasText(severity) ? severity.toUpperCase() : "INFO")
                    .status(StringUtils.hasText(status) ? status.toUpperCase() : "SUCCESS")
                    .errorMessage(errorMessage)
                    .executionTimeMs(executionTimeMs)
                    .build();

            AuditLog saved = auditLogRepository.save(entity);
            return toDTO(saved);
        } catch (Exception ex) {
            log.warn("Failed to persist audit log [{} - {}]: {}", moduleName, actionType, ex.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponseDTO> searchLogs(AuditLogFilterDTO filter, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

        Specification<AuditLog> spec = buildSpecification(filter);
        Page<AuditLog> result = auditLogRepository.findAll(spec, pageable);
        List<AuditLogResponseDTO> mapped = result.getContent().stream().map(this::toDTO).toList();
        return PageResponse.from(result, mapped);
    }

    @Transactional(readOnly = true)
    public AuditLogResponseDTO getLogById(Long id) {
        AuditLog entity = auditLogRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi nhật ký ID: " + id));
        return toDTO(entity);
    }

    @Transactional(readOnly = true)
    public AuditLogStatsDTO getAuditStats() {
        long total = auditLogRepository.count();
        Instant startOfToday = LocalDate.now(ZoneId.systemDefault()).atStartOfDay(ZoneId.systemDefault()).toInstant();
        long todayCount = auditLogRepository.countByCreatedAtAfter(startOfToday);
        long highSeverity = auditLogRepository.countBySeverityIn(List.of("HIGH", "CRITICAL"));
        long failedOrBlocked = auditLogRepository.countByStatusIn(List.of("FAILED", "BLOCKED"));

        Map<String, Long> moduleBreakdown = new LinkedHashMap<>();
        List<Object[]> grouped = auditLogRepository.countGroupedByModule();
        if (grouped != null) {
            for (Object[] row : grouped) {
                if (row != null && row.length >= 2 && row[0] != null) {
                    moduleBreakdown.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
                }
            }
        }

        return AuditLogStatsDTO.builder()
                .totalLogs(total)
                .todayLogs(todayCount)
                .highSeverityLogs(highSeverity)
                .failedOrBlockedLogs(failedOrBlocked)
                .moduleBreakdown(moduleBreakdown)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportLogsToCsv(AuditLogFilterDTO filter) {
        Specification<AuditLog> spec = buildSpecification(filter);
        Pageable top5000 = PageRequest.of(0, 5000, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        List<AuditLog> logs = auditLogRepository.findAll(spec, top5000).getContent();

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM for Microsoft Excel Vietnamese compatibility
        sb.append('\uFEFF');
        sb.append("ID,Thoi gian,Tai khoan,Ho ten,Vai tro,Phan he,Hanh dong,Muc do,Trang thai,Tom tat,Doi tuong,ID Doi tuong,IP,Phuong thuc,URI,Thoi gian xu ly (ms)\n");

        for (AuditLog item : logs) {
            sb.append(item.getId()).append(',')
                    .append(escapeCsv(item.getCreatedAt() != null ? item.getCreatedAt().toString() : "")).append(',')
                    .append(escapeCsv(item.getActorUsername())).append(',')
                    .append(escapeCsv(item.getActorFullName())).append(',')
                    .append(escapeCsv(item.getActorRole())).append(',')
                    .append(escapeCsv(item.getModuleName())).append(',')
                    .append(escapeCsv(item.getActionType())).append(',')
                    .append(escapeCsv(item.getSeverity())).append(',')
                    .append(escapeCsv(item.getStatus())).append(',')
                    .append(escapeCsv(item.getSummary())).append(',')
                    .append(escapeCsv(item.getTargetEntity())).append(',')
                    .append(escapeCsv(item.getTargetId())).append(',')
                    .append(escapeCsv(item.getIpAddress())).append(',')
                    .append(escapeCsv(item.getRequestMethod())).append(',')
                    .append(escapeCsv(item.getRequestUri())).append(',')
                    .append(item.getExecutionTimeMs() != null ? item.getExecutionTimeMs() : "")
                    .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public AuditLogResponseDTO toDTO(AuditLog entity) {
        return AuditLogResponseDTO.builder()
                .id(entity.getId())
                .actorId(entity.getActorId())
                .actorUsername(entity.getActorUsername())
                .actorFullName(entity.getActorFullName())
                .actorRole(entity.getActorRole())
                .actionType(entity.getActionType())
                .moduleName(entity.getModuleName())
                .targetEntity(entity.getTargetEntity())
                .targetId(entity.getTargetId())
                .summary(entity.getSummary())
                .oldValues(entity.getOldValues())
                .newValues(entity.getNewValues())
                .requestMethod(entity.getRequestMethod())
                .requestUri(entity.getRequestUri())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .severity(entity.getSeverity())
                .status(entity.getStatus())
                .errorMessage(entity.getErrorMessage())
                .executionTimeMs(entity.getExecutionTimeMs())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private Specification<AuditLog> buildSpecification(AuditLogFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter != null) {
                if (StringUtils.hasText(filter.getKeyword())) {
                    String pattern = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                    predicates.add(cb.or(
                            cb.like(cb.lower(cb.coalesce(root.get("actorUsername"), "")), pattern),
                            cb.like(cb.lower(cb.coalesce(root.get("actorFullName"), "")), pattern),
                            cb.like(cb.lower(cb.coalesce(root.get("summary"), "")), pattern),
                            cb.like(cb.lower(cb.coalesce(root.get("targetId"), "")), pattern),
                            cb.like(cb.lower(cb.coalesce(root.get("ipAddress"), "")), pattern),
                            cb.like(cb.lower(cb.coalesce(root.get("requestUri"), "")), pattern)
                    ));
                }
                if (StringUtils.hasText(filter.getModuleName()) && !"ALL".equalsIgnoreCase(filter.getModuleName())) {
                    predicates.add(cb.equal(cb.upper(root.get("moduleName")), filter.getModuleName().trim().toUpperCase()));
                }
                if (StringUtils.hasText(filter.getActionType()) && !"ALL".equalsIgnoreCase(filter.getActionType())) {
                    predicates.add(cb.equal(cb.upper(root.get("actionType")), filter.getActionType().trim().toUpperCase()));
                }
                if (StringUtils.hasText(filter.getSeverity()) && !"ALL".equalsIgnoreCase(filter.getSeverity())) {
                    predicates.add(cb.equal(cb.upper(root.get("severity")), filter.getSeverity().trim().toUpperCase()));
                }
                if (StringUtils.hasText(filter.getStatus()) && !"ALL".equalsIgnoreCase(filter.getStatus())) {
                    predicates.add(cb.equal(cb.upper(root.get("status")), filter.getStatus().trim().toUpperCase()));
                }
                if (StringUtils.hasText(filter.getActorRole()) && !"ALL".equalsIgnoreCase(filter.getActorRole())) {
                    predicates.add(cb.equal(cb.upper(cb.coalesce(root.get("actorRole"), "")), filter.getActorRole().trim().toUpperCase()));
                }
                if (filter.getFromDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate()));
                }
                if (filter.getToDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate()));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String toJsonString(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String str) {
            return str;
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return String.valueOf(value);
        }
    }

    private String escapeCsv(String input) {
        if (input == null) {
            return "\"\"";
        }
        String sanitized = input.replace("\"", "\"\"");
        return "\"" + sanitized + "\"";
    }
}
