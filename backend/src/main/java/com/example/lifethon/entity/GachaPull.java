package com.example.lifethon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "gacha_pulls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GachaPull {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gacha_item_id", nullable = false)
    private GachaItem gachaItem;
    
    @Column(name = "cost_coins", nullable = false)
    private Integer costCoins;
    
    @Column(name = "is_multi_pull")
    private Boolean isMultiPull = false;
    
    @CreationTimestamp
    @Column(name = "pulled_at", updatable = false)
    private LocalDateTime pulledAt;
}