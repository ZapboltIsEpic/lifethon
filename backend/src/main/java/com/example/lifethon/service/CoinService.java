package com.example.lifethon.service;

import com.example.lifethon.entity.User;
import com.example.lifethon.entity.UserCoins;
import com.example.lifethon.repository.UserCoinsRepository;
import com.example.lifethon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CoinService {
    
    private final UserCoinsRepository userCoinsRepository;
    private final UserRepository userRepository;
    
    /**
     * Get user's coin balance
     */
    public UserCoinsDTO getUserCoins(Long userId) {
        UserCoins userCoins = getUserCoinsOrCreate(userId);
        return convertToDTO(userCoins);
    }
    
    /**
     * Add coins to user's balance
     */
    @Transactional
    public UserCoinsDTO addCoins(Long userId, Integer amount, String reason) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        
        UserCoins userCoins = getUserCoinsOrCreate(userId);
        userCoins.setCoins(userCoins.getCoins() + amount);
        userCoins.setTotalEarned(userCoins.getTotalEarned() + amount);
        
        userCoinsRepository.save(userCoins);
        
        return convertToDTO(userCoins);
    }
    
    /**
     * Deduct coins from user's balance
     */
    @Transactional
    public UserCoinsDTO deductCoins(Long userId, Integer amount, String reason) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        
        UserCoins userCoins = getUserCoinsOrCreate(userId);
        
        if (userCoins.getCoins() < amount) {
            throw new InsufficientCoinsException("Insufficient coins. Required: " + amount + ", Available: " + userCoins.getCoins());
        }
        
        userCoins.setCoins(userCoins.getCoins() - amount);
        userCoins.setTotalSpent(userCoins.getTotalSpent() + amount);
        
        userCoinsRepository.save(userCoins);
        
        return convertToDTO(userCoins);
    }
    
    /**
     * Award daily login bonus
     */
    @Transactional
    public UserCoinsDTO awardDailyBonus(Long userId) {
        int dailyBonus = 50; // 50 coins per day
        return addCoins(userId, dailyBonus, "Daily login bonus");
    }
    
    /**
     * Award coins for completing tasks/goals
     */
    @Transactional
    public UserCoinsDTO awardTaskCompletion(Long userId, Integer coinReward) {
        return addCoins(userId, coinReward, "Task completion");
    }
    
    /**
     * Purchase coins (in-app purchase simulation)
     */
    @Transactional
    public UserCoinsDTO purchaseCoins(Long userId, CoinPackage coinPackage) {
        return addCoins(userId, coinPackage.getAmount(), "Coin purchase: " + coinPackage.getName());
    }
    
    /**
     * Get or create user coins record
     */
    private UserCoins getUserCoinsOrCreate(Long userId) {
        return userCoinsRepository.findByUserId(userId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                UserCoins newCoins = new UserCoins();
                newCoins.setUser(user);
                newCoins.setCoins(1000); // Starting coins
                newCoins.setTotalEarned(1000);
                newCoins.setTotalSpent(0);
                
                return userCoinsRepository.save(newCoins);
            });
    }
    
    /**
     * Convert entity to DTO
     */
    private UserCoinsDTO convertToDTO(UserCoins userCoins) {
        return new UserCoinsDTO(
            userCoins.getCoins(),
            userCoins.getTotalEarned(),
            userCoins.getTotalSpent()
        );
    }
    
    // DTOs
    public static class UserCoinsDTO {
        private Integer coins;
        private Integer totalEarned;
        private Integer totalSpent;
        
        public UserCoinsDTO(Integer coins, Integer totalEarned, Integer totalSpent) {
            this.coins = coins;
            this.totalEarned = totalEarned;
            this.totalSpent = totalSpent;
        }
        
        public Integer getCoins() { return coins; }
        public void setCoins(Integer coins) { this.coins = coins; }
        public Integer getTotalEarned() { return totalEarned; }
        public void setTotalEarned(Integer totalEarned) { this.totalEarned = totalEarned; }
        public Integer getTotalSpent() { return totalSpent; }
        public void setTotalSpent(Integer totalSpent) { this.totalSpent = totalSpent; }
    }
    
    public enum CoinPackage {
        SMALL("Small Pack", 500),
        MEDIUM("Medium Pack", 1200),
        LARGE("Large Pack", 2500),
        MEGA("Mega Pack", 5500);
        
        private final String name;
        private final Integer amount;
        
        CoinPackage(String name, Integer amount) {
            this.name = name;
            this.amount = amount;
        }
        
        public String getName() { return name; }
        public Integer getAmount() { return amount; }
    }
    
    public static class InsufficientCoinsException extends RuntimeException {
        public InsufficientCoinsException(String message) {
            super(message);
        }
    }
}