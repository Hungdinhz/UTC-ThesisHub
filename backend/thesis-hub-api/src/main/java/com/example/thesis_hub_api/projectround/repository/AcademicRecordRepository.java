package com.example.thesis_hub_api.projectround.repository;

import com.example.thesis_hub_api.projectround.entity.AcademicRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicRecordRepository extends JpaRepository<AcademicRecord, Long> {

    Optional<AcademicRecord> findByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    Optional<AcademicRecord> findFirstByStudentIdOrderByImportedAtDesc(Long studentId);

    List<AcademicRecord> findByProjectRoundId(Long projectRoundId);

    boolean existsByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    @Query("SELECT ar FROM AcademicRecord ar " +
           "JOIN ar.student s " +
           "JOIN s.user u " +
           "WHERE (:roundId IS NULL OR ar.projectRound.id = :roundId) " +
           "AND (:tuitionDebt IS NULL OR ar.tuitionDebt = :tuitionDebt) " +
           "AND (:underDisciplinaryAction IS NULL OR ar.underDisciplinaryAction = :underDisciplinaryAction) " +
           "AND (:search IS NULL OR " +
           "     LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(s.className) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<AcademicRecord> searchAcademicRecords(
            @Param("roundId") Long roundId,
            @Param("tuitionDebt") Boolean tuitionDebt,
            @Param("underDisciplinaryAction") Boolean underDisciplinaryAction,
            @Param("search") String search,
            Pageable pageable);
}
