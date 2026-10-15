package com.example.thesis_hub_api.thesis;

import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.thesis.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Thesis & Proposal Entities Unit Tests - Module 3 (Owner: Ngo Minh Quyet)")
class ThesisEntitiesTest {

    @Test
    @DisplayName("Should create Proposal with default draft status")
    void testProposalEntity() {
        Proposal proposal = Proposal.builder()
                .titleVn("Nghiên cứu kiến trúc Modular Monolith")
                .titleEn("Research on Modular Monolith Architecture")
                .description("Phân tích lợi ích và cách phân chia bounded context")
                .objectives("Xây dựng mô hình kiến trúc sạch")
                .status("DRAFT")
                .supervisorApproved(false)
                .version(1)
                .build();

        assertEquals("Nghiên cứu kiến trúc Modular Monolith", proposal.getTitleVn());
        assertEquals("DRAFT", proposal.getStatus());
        assertFalse(proposal.getSupervisorApproved());
        assertEquals(1, proposal.getVersion());

        // Update status and supervisor approval
        proposal.setStatus("APPROVED");
        proposal.setSupervisorApproved(true);
        proposal.setSupervisorComment("Đạt yêu cầu thông qua");

        assertEquals("APPROVED", proposal.getStatus());
        assertTrue(proposal.getSupervisorApproved());
        assertEquals("Đạt yêu cầu thông qua", proposal.getSupervisorComment());
    }

    @Test
    @DisplayName("Should create ReviewGroup and members")
    void testReviewGroupAndMember() {
        ReviewGroup group = ReviewGroup.builder()
                .code("RG_CNPM_01")
                .name("Tiểu ban KTPM 01")
                .status("ACTIVE")
                .build();

        assertEquals("RG_CNPM_01", group.getCode());
        assertEquals("Tiểu ban KTPM 01", group.getName());
        assertEquals("ACTIVE", group.getStatus());

        ReviewGroupMember member = ReviewGroupMember.builder()
                .reviewGroup(group)
                .role("LEADER")
                .build();

        assertEquals("LEADER", member.getRole());
        assertEquals(group, member.getReviewGroup());
    }

    @Test
    @DisplayName("Should create Thesis and track completion rate and defense eligibility")
    void testThesisEntity() {
        Thesis thesis = Thesis.builder()
                .thesisCode("DT_2026_CNTT_001")
                .titleVn("Hệ thống UTC-ThesisHub")
                .status("IN_PROGRESS")
                .completionRate(BigDecimal.valueOf(85.50))
                .defenseEligible(true)
                .build();

        assertEquals("DT_2026_CNTT_001", thesis.getThesisCode());
        assertEquals("Hệ thống UTC-ThesisHub", thesis.getTitleVn());
        assertEquals("IN_PROGRESS", thesis.getStatus());
        assertEquals(BigDecimal.valueOf(85.50), thesis.getCompletionRate());
        assertTrue(thesis.getDefenseEligible());
    }

    @Test
    @DisplayName("Should create Document with type and versioning")
    void testDocumentEntity() {
        Document doc = Document.builder()
                .name("Bao_cao_giua_ky.pdf")
                .documentType("INTERIM_REPORT")
                .fileUrl("/uploads/theses/bao_cao.pdf")
                .version(1)
                .isLatest(true)
                .build();

        assertEquals("Bao_cao_giua_ky.pdf", doc.getName());
        assertEquals("INTERIM_REPORT", doc.getDocumentType());
        assertEquals(1, doc.getVersion());
        assertTrue(doc.getIsLatest());
    }
}
