package com.example.thesis_hub_api.common.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

public final class PaginationUtils {

    public static final int DEFAULT_MAX_PAGE_SIZE = 200;

    private PaginationUtils() {
    }

    public static Pageable createSafePageable(
            int page,
            int size,
            String sortParam,
            String defaultSortField,
            Sort.Direction defaultDirection,
            Set<String> allowedSortFields) {
        return createSafePageable(page, size, DEFAULT_MAX_PAGE_SIZE, sortParam, defaultSortField, defaultDirection, allowedSortFields);
    }

    public static Pageable createSafePageable(
            int page,
            int size,
            int maxPageSize,
            String sortParam,
            String defaultSortField,
            Sort.Direction defaultDirection,
            Set<String> allowedSortFields) {

        int safePage = Math.max(0, page);
        int safeSize = size <= 0 ? 10 : Math.min(size, maxPageSize);

        String sortField = defaultSortField;
        Sort.Direction direction = defaultDirection != null ? defaultDirection : Sort.Direction.DESC;

        if (sortParam != null && !sortParam.isBlank()) {
            String[] parts = sortParam.split(",");
            String candidateField = parts[0].trim();
            if (allowedSortFields == null || allowedSortFields.isEmpty() || allowedSortFields.contains(candidateField)) {
                sortField = candidateField;
            }
            if (parts.length > 1) {
                direction = "asc".equalsIgnoreCase(parts[1].trim()) ? Sort.Direction.ASC : Sort.Direction.DESC;
            }
        }

        return PageRequest.of(safePage, safeSize, Sort.by(direction, sortField));
    }

    public static Pageable clampPageable(Pageable pageable, int maxPageSize, String defaultSortField, Set<String> allowedSortFields) {
        if (pageable == null || pageable.isUnpaged()) {
            return PageRequest.of(0, maxPageSize, Sort.by(Sort.Direction.DESC, defaultSortField));
        }
        int safePage = Math.max(0, pageable.getPageNumber());
        int safeSize = pageable.getPageSize() <= 0 ? 20 : Math.min(pageable.getPageSize(), maxPageSize);

        Sort safeSort = Sort.unsorted();
        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                if (allowedSortFields == null || allowedSortFields.isEmpty() || allowedSortFields.contains(order.getProperty())) {
                    safeSort = safeSort.and(Sort.by(order));
                }
            }
        }
        if (safeSort.isUnsorted() && defaultSortField != null) {
            safeSort = Sort.by(Sort.Direction.DESC, defaultSortField);
        }
        return PageRequest.of(safePage, safeSize, safeSort);
    }
}
