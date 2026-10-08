package com.example.thesis_hub_api.common.pagination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    @Builder.Default
    private List<T> content = Collections.emptyList();

    public static <T> PageResponse<T> from(Page<T> pageData) {
        return PageResponse.<T>builder()
                .page(pageData.getNumber())
                .size(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .content(pageData.getContent())
                .build();
    }

    public static <T, R> PageResponse<R> from(Page<T> pageData, List<R> mappedContent) {
        return PageResponse.<R>builder()
                .page(pageData.getNumber())
                .size(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .content(mappedContent)
                .build();
    }
}
