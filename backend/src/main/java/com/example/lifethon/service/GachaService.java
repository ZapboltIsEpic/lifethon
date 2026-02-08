package com.example.lifethon.service;

import com.example.lifethon.entity.*;
import com.example.lifethon.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GachaService {
    
    private final GachaItemRepository gachaItemRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final GachaPullRepository gachaPullRepository;
    private final UserCoinsRepository userCoinsRepository;
    private final UserRepository userRepository;
    
    // Gacha costs
    private static final int SINGLE_PULL_COST = 100;
    private static final int MULTI_PULL_COST = 900; // 10% discount for 10 pulls
    private static final int MULTI_PULL_COUNT = 10;
    
    // Pity system
    private static final int PITY_THRESHOLD = 90; // Guaranteed legendary every 90 pulls
    private static final int SOFT_PITY_START = 75; // Increased rates start here
    
    /**
     * Perform a single gacha pull
     */
    @Transactional
    public GachaPullResult performSinglePull(Long userId) {
        User user = getUserOrThrow(userId);
        UserCoins userCoins = getUserCoinsOrCreate(user);
        
        // Check if user has enough coins
        if (userCoins.getCoins() < SINGLE_PULL_COST) {
            throw new InsufficientCoinsException("Not enough coins. Required: " + SINGLE_PULL_COST + ", Available: " + userCoins.getCoins());
        }
        
        // Deduct coins
        deductCoins(userCoins, SINGLE_PULL_COST);
        
        // Check pity system
        long pullsSinceLastLegendary = getPullsSinceLastLegendary(userId);
        
        // Perform the pull
        GachaItem item = selectRandomItem(pullsSinceLastLegendary);
        
        // Add to inventory
        addToInventory(user, item);
        
        // Record the pull
        recordPull(user, item, SINGLE_PULL_COST, false);
        
        // Apply item bonuses
        applyItemBonuses(userCoins, item);
        
        return new GachaPullResult(
            Collections.singletonList(item),
            userCoins.getCoins(),
            isNewItem(user, item),
            pullsSinceLastLegendary + 1
        );
    }
    
    /**
     * Perform a multi-pull (10 pulls at once)
     */
    @Transactional
    public GachaPullResult performMultiPull(Long userId) {
        User user = getUserOrThrow(userId);
        UserCoins userCoins = getUserCoinsOrCreate(user);
        
        // Check if user has enough coins
        if (userCoins.getCoins() < MULTI_PULL_COST) {
            throw new InsufficientCoinsException("Not enough coins. Required: " + MULTI_PULL_COST + ", Available: " + userCoins.getCoins());
        }
        
        // Deduct coins
        deductCoins(userCoins, MULTI_PULL_COST);
        
        List<GachaItem> pulledItems = new ArrayList<>();
        long pullsSinceLastLegendary = getPullsSinceLastLegendary(userId);
        
        // Guaranteed at least one rare or better in multi-pull
        boolean hasRareOrBetter = false;
        
        for (int i = 0; i < MULTI_PULL_COUNT; i++) {
            GachaItem item;
            
            // Last pull in multi should be at least rare if no rare/epic/legendary yet
            if (i == MULTI_PULL_COUNT - 1 && !hasRareOrBetter) {
                item = selectGuaranteedRareOrBetter(pullsSinceLastLegendary + i);
            } else {
                item = selectRandomItem(pullsSinceLastLegendary + i);
            }
            
            pulledItems.add(item);
            
            if (item.getRarity() == GachaItem.Rarity.RARE ||
                item.getRarity() == GachaItem.Rarity.EPIC ||
                item.getRarity() == GachaItem.Rarity.LEGENDARY) {
                hasRareOrBetter = true;
            }
            
            // Reset pity counter if legendary pulled
            if (item.getRarity() == GachaItem.Rarity.LEGENDARY) {
                pullsSinceLastLegendary = 0;
            } else {
                pullsSinceLastLegendary++;
            }
            
            // Add to inventory
            addToInventory(user, item);
            
            // Record the pull
            recordPull(user, item, MULTI_PULL_COST / MULTI_PULL_COUNT, true);
            
            // Apply item bonuses
            applyItemBonuses(userCoins, item);
        }
        
        return new GachaPullResult(
            pulledItems,
            userCoins.getCoins(),
            true, // Multi-pull always considered to have "new" items for UI purposes
            pullsSinceLastLegendary
        );
    }
    
    /**
     * Select a random item based on drop rates and pity system
     */
    private GachaItem selectRandomItem(long pullsSinceLastLegendary) {
        List<GachaItem> activeItems = gachaItemRepository.findByIsActiveTrue();
        
        if (activeItems.isEmpty()) {
            throw new RuntimeException("No active gacha items available");
        }
        
        // Hard pity - guarantee legendary at threshold
        if (pullsSinceLastLegendary >= PITY_THRESHOLD - 1) {
            return selectRandomItemByRarity(GachaItem.Rarity.LEGENDARY, activeItems);
        }
        
        // Soft pity - increase legendary rate
        double legendaryBoost = 1.0;
        if (pullsSinceLastLegendary >= SOFT_PITY_START) {
            legendaryBoost = 1 + (pullsSinceLastLegendary - SOFT_PITY_START) * 0.1; // 10% increase per pull after soft pity
        }
        
        // Calculate total weight with soft pity boost
        double totalWeight = 0.0;
        Map<GachaItem, Double> weightMap = new HashMap<>();
        
        for (GachaItem item : activeItems) {
            double weight = item.getDropRate();
            if (item.getRarity() == GachaItem.Rarity.LEGENDARY) {
                weight *= legendaryBoost;
            }
            weightMap.put(item, weight);
            totalWeight += weight;
        }
        
        // Select random item based on weighted probability
        double random = Math.random() * totalWeight;
        double cumulative = 0.0;
        
        for (Map.Entry<GachaItem, Double> entry : weightMap.entrySet()) {
            cumulative += entry.getValue();
            if (random <= cumulative) {
                return entry.getKey();
            }
        }
        
        // Fallback (should never reach here)
        return activeItems.get(0);
    }
    
    /**
     * Select a guaranteed rare or better item
     */
    private GachaItem selectGuaranteedRareOrBetter(long pullsSinceLastLegendary) {
        List<GachaItem> activeItems = gachaItemRepository.findByIsActiveTrue();
        
        // Filter to rare or better
        List<GachaItem> rareOrBetter = activeItems.stream()
            .filter(item -> item.getRarity() == GachaItem.Rarity.RARE ||
                           item.getRarity() == GachaItem.Rarity.EPIC ||
                           item.getRarity() == GachaItem.Rarity.LEGENDARY)
            .collect(Collectors.toList());
        
        if (rareOrBetter.isEmpty()) {
            return selectRandomItem(pullsSinceLastLegendary);
        }
        
        // Hard pity check
        if (pullsSinceLastLegendary >= PITY_THRESHOLD - 1) {
            return selectRandomItemByRarity(GachaItem.Rarity.LEGENDARY, activeItems);
        }
        
        // Calculate weights for rare or better items
        double totalWeight = rareOrBetter.stream().mapToDouble(GachaItem::getDropRate).sum();
        double random = Math.random() * totalWeight;
        double cumulative = 0.0;
        
        for (GachaItem item : rareOrBetter) {
            cumulative += item.getDropRate();
            if (random <= cumulative) {
                return item;
            }
        }
        
        return rareOrBetter.get(0);
    }
    
    /**
     * Select random item by specific rarity
     */
    private GachaItem selectRandomItemByRarity(GachaItem.Rarity rarity, List<GachaItem> items) {
        List<GachaItem> rarityItems = items.stream()
            .filter(item -> item.getRarity() == rarity)
            .collect(Collectors.toList());
        
        if (rarityItems.isEmpty()) {
            throw new RuntimeException("No items found for rarity: " + rarity);
        }
        
        return rarityItems.get(new Random().nextInt(rarityItems.size()));
    }
    
    /**
     * Get number of pulls since last legendary
     */
    private long getPullsSinceLastLegendary(Long userId) {
        List<GachaPull> recentPulls = gachaPullRepository.findByUserIdOrderByPulledAtDesc(userId);
        
        long count = 0;
        for (GachaPull pull : recentPulls) {
            if (pull.getGachaItem().getRarity() == GachaItem.Rarity.LEGENDARY) {
                break;
            }
            count++;
        }
        
        return count;
    }
    
    /**
     * Add item to user's inventory
     */
    private void addToInventory(User user, GachaItem item) {
        Optional<UserInventory> existingItem = userInventoryRepository.findByUserAndGachaItem(user, item);
        
        if (existingItem.isPresent()) {
            // Increment quantity
            UserInventory inventory = existingItem.get();
            inventory.setQuantity(inventory.getQuantity() + 1);
            userInventoryRepository.save(inventory);
        } else {
            // Add new item
            UserInventory newInventory = new UserInventory();
            newInventory.setUser(user);
            newInventory.setGachaItem(item);
            newInventory.setQuantity(1);
            newInventory.setIsEquipped(false);
            userInventoryRepository.save(newInventory);
        }
    }
    
    /**
     * Record gacha pull in history
     */
    private void recordPull(User user, GachaItem item, int cost, boolean isMultiPull) {
        GachaPull pull = new GachaPull();
        pull.setUser(user);
        pull.setGachaItem(item);
        pull.setCostCoins(cost);
        pull.setIsMultiPull(isMultiPull);
        gachaPullRepository.save(pull);
    }
    
    /**
     * Check if item is new to user
     */
    private boolean isNewItem(User user, GachaItem item) {
        return userInventoryRepository.findByUserAndGachaItem(user, item).isEmpty();
    }
    
    /**
     * Deduct coins from user
     */
    private void deductCoins(UserCoins userCoins, int amount) {
        userCoins.setCoins(userCoins.getCoins() - amount);
        userCoins.setTotalSpent(userCoins.getTotalSpent() + amount);
        userCoinsRepository.save(userCoins);
    }
    
    /**
     * Apply bonus coins/energy from item
     */
    private void applyItemBonuses(UserCoins userCoins, GachaItem item) {
        if (item.getBonusCoins() > 0) {
            userCoins.setCoins(userCoins.getCoins() + item.getBonusCoins());
            userCoins.setTotalEarned(userCoins.getTotalEarned() + item.getBonusCoins());
            userCoinsRepository.save(userCoins);
        }
    }
    
    /**
     * Get user or throw exception
     */
    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }
    
    /**
     * Get user coins or create new record
     */
    private UserCoins getUserCoinsOrCreate(User user) {
        return userCoinsRepository.findByUser(user)
            .orElseGet(() -> {
                UserCoins newCoins = new UserCoins();
                newCoins.setUser(user);
                newCoins.setCoins(1000); // Starting coins
                newCoins.setTotalEarned(1000);
                return userCoinsRepository.save(newCoins);
            });
    }
    
    // Inner classes
    public static class GachaPullResult {
        private List<GachaItem> items;
        private Integer remainingCoins;
        private Boolean isNew;
        private Long pityCounter;
        
        public GachaPullResult(List<GachaItem> items, Integer remainingCoins, Boolean isNew, Long pityCounter) {
            this.items = items;
            this.remainingCoins = remainingCoins;
            this.isNew = isNew;
            this.pityCounter = pityCounter;
        }
        
        public List<GachaItem> getItems() { return items; }
        public void setItems(List<GachaItem> items) { this.items = items; }
        public Integer getRemainingCoins() { return remainingCoins; }
        public void setRemainingCoins(Integer remainingCoins) { this.remainingCoins = remainingCoins; }
        public Boolean getIsNew() { return isNew; }
        public void setIsNew(Boolean isNew) { this.isNew = isNew; }
        public Long getPityCounter() { return pityCounter; }
        public void setPityCounter(Long pityCounter) { this.pityCounter = pityCounter; }
    }
    
    public static class InsufficientCoinsException extends RuntimeException {
        public InsufficientCoinsException(String message) {
            super(message);
        }
    }
}