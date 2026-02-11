package com.example.lifethon.service;

import com.example.lifethon.entity.GachaItem;
import com.example.lifethon.repository.GachaItemRepository;
import com.example.lifethon.repository.GachaPullRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GachaAdminService {
    
    private final GachaItemRepository gachaItemRepository;
    private final GachaPullRepository gachaPullRepository;
    
    /**
     * Get all gacha items (including inactive)
     */
    public List<GachaItem> getAllItems() {
        return gachaItemRepository.findAll();
    }
    
    /**
     * Get item by ID
     */
    public GachaItem getItemById(Long id) {
        return gachaItemRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));
    }
    
    /**
     * Create new gacha item
     */
    @Transactional
    public GachaItem createItem(String name, String description, String imageUrl,
                               GachaItem.Rarity rarity, GachaItem.ItemType itemType,
                               Double dropRate, Integer bonusCoins, Integer bonusEnergy) {
        // Validation
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        
        if (gachaItemRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("Item with this name already exists");
        }
        
        if (dropRate == null || dropRate < 0 || dropRate > 1) {
            throw new IllegalArgumentException("Drop rate must be between 0 and 1");
        }
        
        // Create item
        GachaItem item = new GachaItem();
        item.setName(name);
        item.setDescription(description);
        item.setImageUrl(imageUrl);
        item.setRarity(rarity);
        item.setItemType(itemType);
        item.setDropRate(dropRate);
        item.setBonusCoins(bonusCoins != null ? bonusCoins : 0);
        item.setBonusEnergy(bonusEnergy != null ? bonusEnergy : 0);
        item.setIsActive(true);
        
        return gachaItemRepository.save(item);
    }
    
    /**
     * Update gacha item
     */
    @Transactional
    public GachaItem updateItem(Long id, String name, String description, String imageUrl,
                               GachaItem.Rarity rarity, GachaItem.ItemType itemType,
                               Double dropRate, Integer bonusCoins, Integer bonusEnergy,
                               Boolean isActive) {
        GachaItem item = getItemById(id);
        
        // Validation
        if (name != null && !name.equals(item.getName())) {
            if (gachaItemRepository.findByName(name).isPresent()) {
                throw new IllegalArgumentException("Item with this name already exists");
            }
            item.setName(name);
        }
        
        if (dropRate != null) {
            if (dropRate < 0 || dropRate > 1) {
                throw new IllegalArgumentException("Drop rate must be between 0 and 1");
            }
            item.setDropRate(dropRate);
        }
        
        // Update fields
        if (description != null) item.setDescription(description);
        if (imageUrl != null) item.setImageUrl(imageUrl);
        if (rarity != null) item.setRarity(rarity);
        if (itemType != null) item.setItemType(itemType);
        if (bonusCoins != null) item.setBonusCoins(bonusCoins);
        if (bonusEnergy != null) item.setBonusEnergy(bonusEnergy);
        if (isActive != null) item.setIsActive(isActive);
        
        return gachaItemRepository.save(item);
    }
    
    /**
     * Delete item (soft delete)
     */
    @Transactional
    public void deleteItem(Long id) {
        GachaItem item = getItemById(id);
        item.setIsActive(false);
        gachaItemRepository.save(item);
    }
    
    /**
     * Toggle item active status
     */
    @Transactional
    public GachaItem toggleItemActive(Long id) {
        GachaItem item = getItemById(id);
        item.setIsActive(!item.getIsActive());
        return gachaItemRepository.save(item);
    }
    
    /**
     * Validate drop rates sum to 1.0 (100%)
     */
    public boolean validateDropRates() {
        List<GachaItem> activeItems = gachaItemRepository.findByIsActiveTrue();
        double total = activeItems.stream()
            .mapToDouble(GachaItem::getDropRate)
            .sum();
        
        // Allow small floating point error (0.99 to 1.01)
        return total >= 0.99 && total <= 1.01;
    }
    
    /**
     * Get total drop rate
     */
    public double getTotalDropRate() {
        List<GachaItem> activeItems = gachaItemRepository.findByIsActiveTrue();
        return activeItems.stream()
            .mapToDouble(GachaItem::getDropRate)
            .sum();
    }
    
    /**
     * Get gacha statistics
     */
    public GachaStats getGachaStats() {
        List<GachaItem> allItems = gachaItemRepository.findAll();
        List<GachaItem> activeItems = gachaItemRepository.findByIsActiveTrue();
        long totalPulls = gachaPullRepository.count();
        
        long legendaryCount = activeItems.stream()
            .filter(i -> i.getRarity() == GachaItem.Rarity.LEGENDARY)
            .count();
        
        long epicCount = activeItems.stream()
            .filter(i -> i.getRarity() == GachaItem.Rarity.EPIC)
            .count();
        
        long rareCount = activeItems.stream()
            .filter(i -> i.getRarity() == GachaItem.Rarity.RARE)
            .count();
        
        return new GachaStats(
            (long) allItems.size(),
            (long) activeItems.size(),
            totalPulls,
            legendaryCount,
            epicCount,
            rareCount,
            validateDropRates()
        );
    }
    
    // DTO
    public static class GachaStats {
        private Long totalItems;
        private Long activeItems;
        private Long totalPulls;
        private Long legendaryCount;
        private Long epicCount;
        private Long rareCount;
        private Boolean ratesValid;
        
        public GachaStats(Long totalItems, Long activeItems, Long totalPulls,
                         Long legendaryCount, Long epicCount, Long rareCount, Boolean ratesValid) {
            this.totalItems = totalItems;
            this.activeItems = activeItems;
            this.totalPulls = totalPulls;
            this.legendaryCount = legendaryCount;
            this.epicCount = epicCount;
            this.rareCount = rareCount;
            this.ratesValid = ratesValid;
        }
        
        // Getters
        public Long getTotalItems() { return totalItems; }
        public Long getActiveItems() { return activeItems; }
        public Long getTotalPulls() { return totalPulls; }
        public Long getLegendaryCount() { return legendaryCount; }
        public Long getEpicCount() { return epicCount; }
        public Long getRareCount() { return rareCount; }
        public Boolean getRatesValid() { return ratesValid; }
    }
}