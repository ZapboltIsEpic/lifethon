package com.example.lifethon.repository;

import com.example.lifethon.entity.UserCoins;
import com.example.lifethon.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCoinsRepository extends JpaRepository<UserCoins, Long> {
    
    Optional<UserCoins> findByUser(User user);
    
    Optional<UserCoins> findByUserId(Long userId);
    
    Boolean existsByUserId(Long userId);
}