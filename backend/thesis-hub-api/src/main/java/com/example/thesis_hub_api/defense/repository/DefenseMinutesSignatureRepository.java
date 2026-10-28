package com.example.thesis_hub_api.defense.repository;

import com.example.thesis_hub_api.defense.entity.DefenseMinutesSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DefenseMinutesSignatureRepository extends JpaRepository<DefenseMinutesSignature, Long> {
    List<DefenseMinutesSignature> findByThesisId(Long thesisId);
    Optional<DefenseMinutesSignature> findByThesisIdAndLecturerId(Long thesisId, Long lecturerId);
}
