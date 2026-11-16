package com.example.thesis_hub_api.security.repository;

import com.example.thesis_hub_api.security.entity.SecurityPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityPolicyRepository extends JpaRepository<SecurityPolicy, Long> {

    Optional<SecurityPolicy> findByPolicyKey(String policyKey);

    List<SecurityPolicy> findAllByOrderByIdAsc();
}
