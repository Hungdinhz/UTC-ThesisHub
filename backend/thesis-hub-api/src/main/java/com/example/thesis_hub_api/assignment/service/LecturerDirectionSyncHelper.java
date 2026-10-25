package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.entity.LecturerDirection;
import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import com.example.thesis_hub_api.assignment.repository.LecturerDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.ProjectDirectionRepository;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Helper to automatically synchronize a lecturer's research directions into
 * lecturer_directions based on their researchInterests profile string or department fallback.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LecturerDirectionSyncHelper {

    private final LecturerDirectionRepository lecturerDirectionRepository;
    private final ProjectDirectionRepository projectDirectionRepository;

    @Transactional
    public void syncLecturerDirections(Lecturer lecturer) {
        if (lecturer == null || lecturer.getId() == null) {
            return;
        }

        List<ProjectDirection> allDirections = projectDirectionRepository.findByIsActiveTrue();
        if (allDirections == null || allDirections.isEmpty()) {
            allDirections = projectDirectionRepository.findAll();
        }
        if (allDirections == null || allDirections.isEmpty()) {
            return;
        }

        String interests = lecturer.getResearchInterests();
        List<ProjectDirection> matchedDirections = new ArrayList<>();

        if (StringUtils.hasText(interests)) {
            String[] tokens = interests.split("[,;\\n\\r/]+");
            for (ProjectDirection dir : allDirections) {
                if (matchesDirection(dir, interests, tokens)) {
                    if (!matchedDirections.contains(dir)) {
                        matchedDirections.add(dir);
                    }
                }
            }
        }

        // Fallback: If no directions matched from research interests,
        // use active directions under the lecturer's department so they are not left with 0 directions
        if (matchedDirections.isEmpty() && lecturer.getDepartmentId() != null) {
            matchedDirections = allDirections.stream()
                    .filter(d -> lecturer.getDepartmentId().equals(d.getDepartmentId()))
                    .collect(Collectors.toList());
        }

        if (matchedDirections.isEmpty()) {
            return;
        }

        boolean hasPrimary = lecturerDirectionRepository.findByLecturerId(lecturer.getId())
                .stream().anyMatch(ld -> Boolean.TRUE.equals(ld.getIsPrimary()));

        for (int i = 0; i < matchedDirections.size(); i++) {
            ProjectDirection dir = matchedDirections.get(i);
            if (!lecturerDirectionRepository.existsByLecturerIdAndDirectionId(lecturer.getId(), dir.getId())) {
                LecturerDirection ld = LecturerDirection.builder()
                        .lecturerId(lecturer.getId())
                        .directionId(dir.getId())
                        .isPrimary(!hasPrimary && i == 0)
                        .note("Tự động đồng bộ theo chuyên môn GV")
                        .build();
                lecturerDirectionRepository.save(ld);
                log.info("Auto-synced lecturer {} ({}) with direction {} ({})",
                        lecturer.getLecturerCode(), lecturer.getId(), dir.getCode(), dir.getName());
                if (!hasPrimary && i == 0) {
                    hasPrimary = true;
                }
            }
        }
    }

    public static boolean matchesDirection(ProjectDirection dir, String fullText, String[] tokens) {
        if (dir == null) return false;

        String codeUpper = dir.getCode() != null ? dir.getCode().trim().toUpperCase() : "";
        String codeLower = codeUpper.toLowerCase();
        String nameLower = dir.getName() != null ? dir.getName().trim().toLowerCase() : "";

        // Check fullText contains exact direction code
        if (StringUtils.hasText(fullText) && fullText.toUpperCase().contains(codeUpper)) {
            return true;
        }

        // Check against individual tokens
        if (tokens != null) {
            for (String rawTok : tokens) {
                if (!StringUtils.hasText(rawTok)) continue;
                String t = rawTok.trim().toLowerCase();

                if (t.equals(codeLower) || t.equals(nameLower) || nameLower.equals(t)) {
                    return true;
                }

                if (matchesByAlias(codeUpper, t)) {
                    return true;
                }
            }
        }

        // Check fullText by alias
        if (StringUtils.hasText(fullText)) {
            String fullLower = fullText.toLowerCase();
            if (matchesByAlias(codeUpper, fullLower)) {
                return true;
            }
        }

        return false;
    }

    private static boolean matchesByAlias(String codeUpper, String t) {
        switch (codeUpper) {
            case "HD_PM_APP":
                return t.contains("hd_pm_app") || t.contains("hd_pm") || t.contains("phần mềm") 
                        || t.contains("phát triển phần mềm") || t.contains("mobile") 
                        || t.contains("webapp") || t.contains("web/app") || t.contains("mobileapp")
                        || t.contains("phát triển ứng dụng") || t.contains("hd_cnpm_web")
                        || t.contains("web nâng cao") || t.contains("web") || t.contains("frontend")
                        || t.contains("backend");

            case "HD_DATA_AI":
                return t.contains("hd_data_ai") || t.contains("hd_dl_ai") || t.contains("hd_ai") 
                        || t.contains("dữ liệu") || t.contains("trí tuệ nhân tạo") || t.contains("học máy") 
                        || t.contains("machine learning") || t.contains("deep learning") 
                        || t.contains("khai phá dữ liệu") || t.contains("khoa học dữ liệu") 
                        || t.contains("big data") || t.contains("data ai") 
                        || t.equals("ai") || t.contains(" ai") || t.contains("ai ");

            case "HD_GAME":
                return t.contains("hd_game") || t.contains("game") || t.contains("trò chơi") 
                        || t.contains("unity") || t.contains("unreal");

            case "HD_TESTING":
                return t.contains("hd_testing") || t.contains("hd_test") || t.contains("kiểm thử") 
                        || t.contains("testing") || t.equals("qa") || t.equals("qc");

            case "HD_NET_INFRA":
                return t.contains("hd_net_infra") || t.contains("hd_net") || t.contains("hd_mang") 
                        || t.contains("hạ tầng") || t.contains("mạng máy tính") || t.contains("hệ thống mạng") 
                        || t.contains("mạng và hạ tầng") || t.contains("cloud") || t.contains("điện toán đám mây") 
                        || t.contains("linux") || t.contains("quản trị hệ thống");

            case "HD_SECURITY":
                return t.contains("hd_security") || t.contains("hd_an_ninh") || t.contains("hd_attt") 
                        || t.contains("an toàn thông tin") || t.contains("an ninh mạng") 
                        || t.contains("bảo mật") || t.contains("security") || t.equals("attt") 
                        || t.contains("attt") || t.contains("penetration");

            case "HD_ALGO":
                return t.contains("hd_algo") || t.contains("hd_thuat_toan") || t.contains("thuật toán") 
                        || t.contains("giải thuật") || t.contains("algorithm") || t.contains("tối ưu hóa");

            default:
                return false;
        }
    }
}
