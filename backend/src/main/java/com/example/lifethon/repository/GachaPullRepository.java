package com.example.lifethon.repository;

import com.example.lifethon.entity.GachaPull;
import com.example.lifethon.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GachaPullRepository extends JpaRepository<GachaPull, Long> {
    
    List<GachaPull> findByUser(User user);
    
    List<GachaPull> findByUserId(Long userId);
    
    List<GachaPull> findByUserIdOrderByPulledAtDesc(Long userId);
    
    @Query("SELECT p FROM GachaPull p WHERE p.user.id = :userId AND p.pulledAt >= :since")
    List<GachaPull> findRecentPulls(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(p) FROM GachaPull p WHERE p.user.id = :userId")
    Long countByUserId(@Param("userId") Long userId);
    
    @Query("SELECT SUM(p.costCoins) FROM GachaPull p WHERE p.user.id = :userId")
    Long getTotalCoinsSpentByUserId(@Param("userId") Long userId);
}