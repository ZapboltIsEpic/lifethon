package com.example.lifethon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_inventory", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "gacha_item_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInventory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gacha_item_id", nullable = false)
    private GachaItem gachaItem;
    
    @Column(nullable = false)
    private Integer quantity = 1;
    
    @Column(name = "is_equipped")
    private Boolean isEquipped = false;
    
    @CreationTimestamp
    @Column(name = "obtained_at", updatable = false)
    private LocalDateTime obtainedAt;
}