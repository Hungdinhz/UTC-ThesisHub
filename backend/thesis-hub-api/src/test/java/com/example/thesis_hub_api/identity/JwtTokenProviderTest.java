package com.example.thesis_hub_api.identity;

import com.example.thesis_hub_api.identity.security.JwtTokenProvider;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "TEST_SECRET_KEY_FOR_JWT_SIGNING_NEED_TO_BE_AT_LEAST_256_BITS_LONG_UTC_2026!");
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    void testGenerateAndValidateToken() {
        UserPrincipal principal = UserPrincipal.builder()
                .id(100L)
                .username("teststudent")
                .email("student@utc.edu.vn")
                .fullName("Nguyen Van A")
                .role("ROLE_STUDENT")
                .active(true)
                .authorities(Collections.emptyList())
                .build();

        String token = jwtTokenProvider.generateTokenFromUser(principal);
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));

        assertEquals("teststudent", jwtTokenProvider.getUsernameFromToken(token));
        assertEquals(100L, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals("ROLE_STUDENT", jwtTokenProvider.getRoleFromToken(token));
    }

    @Test
    void testValidateInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid.jwt.token"));
        assertFalse(jwtTokenProvider.validateToken(""));
    }

    @Test
    void testValidateExpiredToken() {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortLivedProvider, "jwtSecret", "TEST_SECRET_KEY_FOR_JWT_SIGNING_NEED_TO_BE_AT_LEAST_256_BITS_LONG_UTC_2026!");
        ReflectionTestUtils.setField(shortLivedProvider, "jwtExpirationMs", -1000L); // Already expired

        UserPrincipal principal = UserPrincipal.builder()
                .id(101L)
                .username("expireduser")
                .email("expired@utc.edu.vn")
                .fullName("Expired User")
                .role("ROLE_STUDENT")
                .active(true)
                .authorities(Collections.emptyList())
                .build();

        String token = shortLivedProvider.generateTokenFromUser(principal);
        assertNotNull(token);
        assertFalse(shortLivedProvider.validateToken(token));
    }
}
