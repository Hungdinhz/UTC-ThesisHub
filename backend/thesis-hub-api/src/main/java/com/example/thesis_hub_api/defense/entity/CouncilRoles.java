package com.example.thesis_hub_api.defense.entity;

import java.util.List;
import java.util.Map;

/**
 * Vai trò chuẩn trong Hội đồng bảo vệ: mỗi vai trò đúng 1 người (tổng 5 người).
 * 1 Chủ tịch hội đồng, 1 Thư ký hội đồng, 1 Ủy viên Phản biện 1, 1 Ủy viên Phản biện 2, 1 Ủy viên thông thường.
 */
public final class CouncilRoles {

    public static final String PRESIDENT = "PRESIDENT";
    public static final String SECRETARY = "SECRETARY";
    public static final String REVIEWER_1 = "REVIEWER_1";
    public static final String REVIEWER_2 = "REVIEWER_2";
    public static final String MEMBER = "MEMBER";

    /** Thứ tự hiển thị/ký biên bản chuẩn. */
    public static final List<String> ORDERED = List.of(PRESIDENT, SECRETARY, REVIEWER_1, REVIEWER_2, MEMBER);

    private static final Map<String, String> LABELS = Map.of(
            PRESIDENT, "Chủ tịch hội đồng",
            SECRETARY, "Thư ký hội đồng",
            REVIEWER_1, "Ủy viên Phản biện 1",
            REVIEWER_2, "Ủy viên Phản biện 2",
            MEMBER, "Ủy viên thông thường");

    private CouncilRoles() {
    }

    public static String normalize(String role) {
        return role == null ? null : role.trim().toUpperCase();
    }

    public static int order(String role) {
        int idx = ORDERED.indexOf(normalize(role));
        return idx < 0 ? ORDERED.size() : idx;
    }

    public static String label(String role) {
        return LABELS.getOrDefault(normalize(role), role == null ? "" : role);
    }

    public static boolean isValid(String role) {
        return ORDERED.contains(normalize(role));
    }
}
