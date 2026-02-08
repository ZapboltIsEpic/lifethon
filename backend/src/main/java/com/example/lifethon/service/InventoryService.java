package com.example.lifethon.service;

import com.example.lifethon.entity.*;
import com.example.lifethon.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {
    
    private final UserInventoryRepository userInventoryRepository;
    private final UserRepository userRepository;
    private final GachaItemRepository gachaItemRepository;
    
    /**
     * Get user's full inventory
     */
    public List<InventoryItemDTO> getUserInventory(Long userId) {
        List<UserInventory> inventory = userInventoryRepository.findByUserId(userId);
        
        return inventory.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Get user's equipped items
     */
    public List<InventoryItemDTO> getEquippedItems(Long userId) {
        List<UserInventory> equippedItems = userInventoryRepository.findEquippedItemsByUserId(userId);
        
        return equippedItems.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Equip an item
     */
    @Transactional
    public InventoryItemDTO equipItem(Long userId, Long inventoryId) {
        UserInventory inventory = userInventoryRepository.findById(inventoryId)
            .orElseThrow(() -> new RuntimeException("Inventory item not found"));
        
        if (!inventory.getUser().getId().equals(userId)) {
            throw new RuntimeException("This item does not belong to the user");
        }
        
        // Check if it's an equippable type
        GachaItem.ItemType itemType = inventory.getGachaItem().getItemType();
        if (itemType == GachaItem.ItemType.CONSUMABLE || itemType == GachaItem.ItemType.RESOURCE) {
            throw new RuntimeException("This item type cannot be equipped");
        }
        
        // Unequip other items of the same type
        List<UserInventory> equippedOfSameType = userInventoryRepository.findEquippedItemsByUserId(userId)
            .stream()
            .filter(item -> item.getGachaItem().getItemType() == itemType)
            .collect(Collectors.toList());
        
        for (UserInventory item : equippedOfSameType) {
            item.setIsEquipped(false);
            userInventoryRepository.save(item);
        }
        
        // Equip the new item
        inventory.setIsEquipped(true);
        userInventoryRepository.save(inventory);
        
        return convertToDTO(inventory);
    }
    
    /**
     * Unequip an item
     */
    @Transactional
    public InventoryItemDTO unequipItem(Long userId, Long inventoryId) {
        UserInventory inventory = userInventoryRepository.findById(inventoryId)
            .orElseThrow(() -> new RuntimeException("Inventory item not found"));
        
        if (!inventory.getUser().getId().equals(userId)) {
            throw new RuntimeException("This item does not belong to the user");
        }
        
        inventory.setIsEquipped(false);
        userInventoryRepository.save(inventory);
        
        return convertToDTO(inventory);
    }
    
    /**
     * Use a consumable item
     */
    @Transactional
    public UseItemResult useConsumable(Long userId, Long inventoryId) {
        UserInventory inventory = userInventoryRepository.findById(inventoryId)
            .orElseThrow(() -> new RuntimeException("Inventory item not found"));
        
        if (!inventory.getUser().getId().equals(userId)) {
            throw new RuntimeException("This item does not belong to the user");
        }
        
        if (inventory.getGachaItem().getItemType() != GachaItem.ItemType.CONSUMABLE) {
            throw new RuntimeException("This item is not consumable");
        }
        
        if (inventory.getQuantity() <= 0) {
            throw new RuntimeException("No items remaining");
        }
        
        // Decrease quantity
        inventory.setQuantity(inventory.getQuantity() - 1);
        
        if (inventory.getQuantity() == 0) {
            userInventoryRepository.delete(inventory);
        } else {
            userInventoryRepository.save(inventory);
        }
        
        // Apply effects (this would integrate with your game logic)
        GachaItem item = inventory.getGachaItem();
        
        return new UseItemResult(
            item.getName(),
            item.getBonusCoins(),
            item.getBonusEnergy(),
            inventory.getQuantity()
        );
    }
    
    /**
     * Get inventory statistics
     */
    public InventoryStats getInventoryStats(Long userId) {
        List<UserInventory> inventory = userInventoryRepository.findByUserId(userId);
        
        long totalItems = inventory.stream().mapToLong(UserInventory::getQuantity).sum();
        long uniqueItems = inventory.size();
        
        long commonCount = inventory.stream()
            .filter(i -> i.getGachaItem().getRarity() == GachaItem.Rarity.COMMON)
            .mapToLong(UserInventory::getQuantity)
            .sum();
        
        long uncommonCount = inventory.stream()
            .filter(i -> i.getGachaItem().getRarity() == GachaItem.Rarity.UNCOMMON)
            .mapToLong(UserInventory::getQuantity)
            .sum();
        
        long rareCount = inventory.stream()
            .filter(i -> i.getGachaItem().getRarity() == GachaItem.Rarity.RARE)
            .mapToLong(UserInventory::getQuantity)
            .sum();
        
        long epicCount = inventory.stream()
            .filter(i -> i.getGachaItem().getRarity() == GachaItem.Rarity.EPIC)
            .mapToLong(UserInventory::getQuantity)
            .sum();
        
        long legendaryCount = inventory.stream()
            .filter(i -> i.getGachaItem().getRarity() == GachaItem.Rarity.LEGENDARY)
            .mapToLong(UserInventory::getQuantity)
            .sum();
        
        return new InventoryStats(
            totalItems,
            uniqueItems,
            commonCount,
            uncommonCount,
            rareCount,
            epicCount,
            legendaryCount
        );
    }
    
    /**
     * Convert inventory entity to DTO
     */
    private InventoryItemDTO convertToDTO(UserInventory inventory) {
        return new InventoryItemDTO(
            inventory.getId(),
            inventory.getGachaItem().getId(),
            inventory.getGachaItem().getName(),
            inventory.getGachaItem().getDescription(),
            inventory.getGachaItem().getImageUrl(),
            inventory.getGachaItem().getRarity(),
            inventory.getGachaItem().getItemType(),
            inventory.getQuantity(),
            inventory.getIsEquipped(),
            inventory.getObtainedAt()
        );
    }
    
    // DTOs
    public static class InventoryItemDTO {
        private Long inventoryId;
        private Long itemId;
        private String name;
        private String description;
        private String imageUrl;
        private GachaItem.Rarity rarity;
        private GachaItem.ItemType itemType;
        private Integer quantity;
        private Boolean isEquipped;
        private java.time.LocalDateTime obtainedAt;
        
        public InventoryItemDTO(Long inventoryId, Long itemId, String name, String description, 
                               String imageUrl, GachaItem.Rarity rarity, GachaItem.ItemType itemType,
                               Integer quantity, Boolean isEquipped, java.time.LocalDateTime obtainedAt) {
            this.inventoryId = inventoryId;
            this.itemId = itemId;
            this.name = name;
            this.description = description;
            this.imageUrl = imageUrl;
            this.rarity = rarity;
            this.itemType = itemType;
            this.quantity = quantity;
            this.isEquipped = isEquipped;
            this.obtainedAt = obtainedAt;
        }
        
        // Getters and Setters
        public Long getInventoryId() { return inventoryId; }
        public void setInventoryId(Long inventoryId) { this.inventoryId = inventoryId; }
        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public GachaItem.Rarity getRarity() { return rarity; }
        public void setRarity(GachaItem.Rarity rarity) { this.rarity = rarity; }
        public GachaItem.ItemType getItemType() { return itemType; }
        public void setItemType(GachaItem.ItemType itemType) { this.itemType = itemType; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public Boolean getIsEquipped() { return isEquipped; }
        public void setIsEquipped(Boolean isEquipped) { this.isEquipped = isEquipped; }
        public java.time.LocalDateTime getObtainedAt() { return obtainedAt; }
        public void setObtainedAt(java.time.LocalDateTime obtainedAt) { this.obtainedAt = obtainedAt; }
    }
    
    public static class UseItemResult {
        private String itemName;
        private Integer bonusCoins;
        private Integer bonusEnergy;
        private Integer remainingQuantity;
        
        public UseItemResult(String itemName, Integer bonusCoins, Integer bonusEnergy, Integer remainingQuantity) {
            this.itemName = itemName;
            this.bonusCoins = bonusCoins;
            this.bonusEnergy = bonusEnergy;
            this.remainingQuantity = remainingQuantity;
        }
        
        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }
        public Integer getBonusCoins() { return bonusCoins; }
        public void setBonusCoins(Integer bonusCoins) { this.bonusCoins = bonusCoins; }
        public Integer getBonusEnergy() { return bonusEnergy; }
        public void setBonusEnergy(Integer bonusEnergy) { this.bonusEnergy = bonusEnergy; }
        public Integer getRemainingQuantity() { return remainingQuantity; }
        public void setRemainingQuantity(Integer remainingQuantity) { this.remainingQuantity = remainingQuantity; }
    }
    
    public static class InventoryStats {
        private Long totalItems;
        private Long uniqueItems;
        private Long commonCount;
        private Long uncommonCount;
        private Long rareCount;
        private Long epicCount;
        private Long legendaryCount;
        
        public InventoryStats(Long totalItems, Long uniqueItems, Long commonCount, 
                            Long uncommonCount, Long rareCount, Long epicCount, Long legendaryCount) {
            this.totalItems = totalItems;
            this.uniqueItems = uniqueItems;
            this.commonCount = commonCount;
            this.uncommonCount = uncommonCount;
            this.rareCount = rareCount;
            this.epicCount = epicCount;
            this.legendaryCount = legendaryCount;
        }
        
        public Long getTotalItems() { return totalItems; }
        public void setTotalItems(Long totalItems) { this.totalItems = totalItems; }
        public Long getUniqueItems() { return uniqueItems; }
        public void setUniqueItems(Long uniqueItems) { this.uniqueItems = uniqueItems; }
        public Long getCommonCount() { return commonCount; }
        public void setCommonCount(Long commonCount) { this.commonCount = commonCount; }
        public Long getUncommonCount() { return uncommonCount; }
        public void setUncommonCount(Long uncommonCount) { this.uncommonCount = uncommonCount; }
        public Long getRareCount() { return rareCount; }
        public void setRareCount(Long rareCount) { this.rareCount = rareCount; }
        public Long getEpicCount() { return epicCount; }
        public void setEpicCount(Long epicCount) { this.epicCount = epicCount; }
        public Long getLegendaryCount() { return legendaryCount; }
        public void setLegendaryCount(Long legendaryCount) { this.legendaryCount = legendaryCount; }
    }
}