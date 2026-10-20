package com.example.thesis_hub_api.identity.repository;

import com.example.thesis_hub_api.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    Page<User> findByRoleId(Long roleId, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "(:roleId IS NULL OR u.role.id = :roleId) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive) AND " +
           "(:search IS NULL OR " +
           " LOWER(u.username) LIKE :search OR " +
           " LOWER(u.fullName) LIKE :search OR " +
           " LOWER(u.email) LIKE :search OR " +
           " LOWER(u.phone) LIKE :search)")
    Page<User> searchUsers(@Param("roleId") Long roleId,
                           @Param("isActive") Boolean isActive,
                           @Param("search") String search,
                           Pageable pageable);
}