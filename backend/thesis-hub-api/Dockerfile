# ==============================================================================
# Stage 1: Build the application using JDK 25 and Maven Wrapper
# ==============================================================================
FROM eclipse-temurin:25-jdk AS builder

WORKDIR /build

# 1. Copy Maven Wrapper and pom.xml first to optimize Docker layer caching
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Fix CRLF line endings (if built on Windows) and ensure execution permissions
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Pre-fetch dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B || true

# 2. Copy application source code and build the executable JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# ==============================================================================
# Stage 2: Lightweight runtime environment using JRE 25
# ==============================================================================
FROM eclipse-temurin:25-jre

WORKDIR /app

# Create a dedicated non-root user and group for security
RUN useradd -r -u 1001 -m -s /bin/false spring && \
    chown -R spring:spring /app

# Copy the generated JAR file from the builder stage
COPY --from=builder --chown=spring:spring /build/target/*.jar app.jar

# Switch to the non-root user
USER spring

# Expose the default Spring Boot port
EXPOSE 8080

# Configure JVM flags optimized for containerized environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Launch the Spring Boot application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
