package com.example.lifethon.repository;

import com.example.lifethon.entity.GachaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GachaItemRepository extends JpaRepository<GachaItem, Long> {
    
    List<GachaItem> findByIsActiveTrue();
    
    List<GachaItem> findByRarity(GachaItem.Rarity rarity);
    
    List<GachaItem> findByItemType(GachaItem.ItemType itemType);
    
    Optional<GachaItem> findByName(String name);
    
    @Query("SELECT g FROM GachaItem g WHERE g.isActive = true ORDER BY g.dropRate DESC")
    List<GachaItem> findAllActiveOrderedByDropRate();
}