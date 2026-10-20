package com.example.thesis_hub_api.common.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Tự động sửa chữa (repair) lịch sử schema trước khi migrate.
 * Giúp xóa các bản ghi migration bị lỗi (success = false) và cập nhật checksum
 * khi redeploy trên Render/Production mà không cần can thiệp thủ công vào database.
 */
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
