package com.example.lifethon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "gacha_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GachaItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "image_url", length = 255)
    private String imageUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rarity rarity;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemType itemType;
    
    @Column(name = "drop_rate", nullable = false)
    private Double dropRate; // Percentage chance (0.01 = 1%)
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "bonus_coins")
    private Integer bonusCoins = 0;
    
    @Column(name = "bonus_energy")
    private Integer bonusEnergy = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum Rarity {
        COMMON,    // 60% - Gray
        UNCOMMON,  // 25% - Green
        RARE,      // 10% - Blue
        EPIC,      // 4% - Purple
        LEGENDARY  // 1% - Gold
    }
    
    public enum ItemType {
        CHARACTER,
        COSTUME,
        ACCESSORY,
        CONSUMABLE,
        RESOURCE
    }
}