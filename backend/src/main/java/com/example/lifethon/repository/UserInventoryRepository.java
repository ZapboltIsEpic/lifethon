package com.example.lifethon.repository;

import com.example.lifethon.entity.UserInventory;
import com.example.lifethon.entity.User;
import com.example.lifethon.entity.GachaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInventoryRepository extends JpaRepository<UserInventory, Long> {
    
    List<UserInventory> findByUser(User user);
    
    List<UserInventory> findByUserId(Long userId);
    
    Optional<UserInventory> findByUserAndGachaItem(User user, GachaItem gachaItem);
    
    Optional<UserInventory> findByUserIdAndGachaItemId(Long userId, Long gachaItemId);
    
    @Query("SELECT i FROM UserInventory i WHERE i.user.id = :userId AND i.gachaItem.rarity = :rarity")
    List<UserInventory> findByUserIdAndRarity(@Param("userId") Long userId, @Param("rarity") GachaItem.Rarity rarity);
    
    @Query("SELECT i FROM UserInventory i WHERE i.user.id = :userId AND i.isEquipped = true")
    List<UserInventory> findEquippedItemsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(i) FROM UserInventory i WHERE i.user.id = :userId")
    Long countByUserId(@Param("userId") Long userId);
}