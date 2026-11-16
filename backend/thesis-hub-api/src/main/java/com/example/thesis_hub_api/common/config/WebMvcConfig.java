package com.example.thesis_hub_api.common.config;

import com.example.thesis_hub_api.security.interceptor.AuditHttpInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.file.storage-path:./uploads}")
    private String uploadDir;

    @Autowired(required = false)
    private AuditHttpInterceptor auditHttpInterceptor;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadUri = uploadPath.toUri().toString();
        if (!uploadUri.endsWith("/")) {
            uploadUri += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadUri);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (auditHttpInterceptor != null) {
            registry.addInterceptor(auditHttpInterceptor)
                    .addPathPatterns("/api/v1/**");
        }
    }
}
