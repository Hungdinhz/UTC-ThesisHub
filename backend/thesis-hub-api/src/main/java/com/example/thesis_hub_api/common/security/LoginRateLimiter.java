package com.example.thesis_hub_api.common.security;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 7;
    private static final long WINDOW_SECONDS = 300; // 5 minutes
    private static final int MAX_CACHE_SIZE = 5000;

    private static class AttemptRecord {
        final AtomicInteger count = new AtomicInteger(0);
        volatile long windowStartEpochSec = Instant.now().getEpochSecond();
    }

    private final Map<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    public void checkAllowed(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        String normalized = key.trim().toLowerCase();
        long now = Instant.now().getEpochSecond();
        AttemptRecord record = attempts.get(normalized);
        if (record != null) {
            if (now - record.windowStartEpochSec > WINDOW_SECONDS) {
                attempts.remove(normalized);
            } else if (record.count.get() >= MAX_ATTEMPTS) {
                throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
            }
        }
    }

    public void recordFailure(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        if (attempts.size() > MAX_CACHE_SIZE) {
            evictExpired();
        }
        String normalized = key.trim().toLowerCase();
        long now = Instant.now().getEpochSecond();
        attempts.compute(normalized, (k, existing) -> {
            if (existing == null || now - existing.windowStartEpochSec > WINDOW_SECONDS) {
                AttemptRecord fresh = new AttemptRecord();
                fresh.count.set(1);
                return fresh;
            }
            existing.count.incrementAndGet();
            return existing;
        });
    }

    public void reset(String key) {
        if (key != null && !key.isBlank()) {
            attempts.remove(key.trim().toLowerCase());
        }
    }

    private void evictExpired() {
        long now = Instant.now().getEpochSecond();
        attempts.entrySet().removeIf(entry -> now - entry.getValue().windowStartEpochSec > WINDOW_SECONDS);
    }
}
