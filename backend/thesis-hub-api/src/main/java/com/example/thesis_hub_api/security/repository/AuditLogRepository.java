package com.example.thesis_hub_api.security.repository;

import com.example.thesis_hub_api.security.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    long countBySeverityIn(Collection<String> severities);

    long countByStatusIn(Collection<String> statuses);

    long countByCreatedAtAfter(Instant since);

    long countByActionTypeAndCreatedAtAfter(String actionType, Instant since);

    List<AuditLog> findTop10BySeverityInOrderByCreatedAtDesc(Collection<String> severities);

    @Query("SELECT a.moduleName, COUNT(a) FROM AuditLog a GROUP BY a.moduleName")
    List<Object[]> countGroupedByModule();
}
