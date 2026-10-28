package com.example.thesis_hub_api.file.repository;

import com.example.thesis_hub_api.file.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, String> {
}
