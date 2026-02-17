package com.example.lifethon.controller;

import com.example.lifethon.service.CoinService;
import com.example.lifethon.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/coins")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CoinController {
    
    private final CoinService coinService;
    private final JwtUtil jwtUtil;
    
    /**
     * Get user's coin balance
     */
    @GetMapping
    public ResponseEntity<?> getCoins(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            CoinService.UserCoinsDTO coins = coinService.getUserCoins(userId);
            return ResponseEntity.ok(coins);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to get coins: " + e.getMessage()));
        }
    }
    
    /**
     * Add coins to user's balance (for admin or rewards)
     */
    @PostMapping("/add")
    public ResponseEntity<?> addCoins(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody AddCoinsRequest request) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            CoinService.UserCoinsDTO coins = coinService.addCoins(userId, request.getAmount(), request.getReason());
            return ResponseEntity.ok(coins);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to add coins: " + e.getMessage()));
        }
    }
    
    /**
     * Award daily login bonus
     */
    @PostMapping("/daily-bonus")
    public ResponseEntity<?> claimDailyBonus(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            CoinService.UserCoinsDTO coins = coinService.awardDailyBonus(userId);
            return ResponseEntity.ok(new DailyBonusResponse("Daily bonus claimed!", 50, coins));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to claim daily bonus: " + e.getMessage()));
        }
    }
    
    /**
     * Award coins for task completion
     */
    @PostMapping("/task-reward")
    public ResponseEntity<?> awardTaskReward(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody TaskRewardRequest request) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            CoinService.UserCoinsDTO coins = coinService.awardTaskCompletion(userId, request.getCoinReward());
            return ResponseEntity.ok(coins);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to award task reward: " + e.getMessage()));
        }
    }
    
    /**
     * Purchase coin package
     */
    @PostMapping("/purchase")
    public ResponseEntity<?> purchaseCoins(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody PurchaseRequest request) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            CoinService.CoinPackage coinPackage = CoinService.CoinPackage.valueOf(request.getPackageType());
            CoinService.UserCoinsDTO coins = coinService.purchaseCoins(userId, coinPackage);
            return ResponseEntity.ok(new PurchaseResponse("Purchase successful!", coinPackage, coins));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse("Invalid package type"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to purchase coins: " + e.getMessage()));
        }
    }
    
    /**
     * Extract user ID from JWT token
     */
    private Long extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid authorization header");
        }
        
        String token = authHeader.substring(7);
        return jwtUtil.extractUserId(token);
    }
    
    // DTOs
    public static class ErrorResponse {
        private String error;
        
        public ErrorResponse(String error) {
            this.error = error;
        }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    public static class AddCoinsRequest {
        private Integer amount;
        private String reason;
        
        public Integer getAmount() { return amount; }
        public void setAmount(Integer amount) { this.amount = amount; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
    
    public static class TaskRewardRequest {
        private Integer coinReward;
        
        public Integer getCoinReward() { return coinReward; }
        public void setCoinReward(Integer coinReward) { this.coinReward = coinReward; }
    }
    
    public static class PurchaseRequest {
        private String packageType; // SMALL, MEDIUM, LARGE, MEGA
        
        public String getPackageType() { return packageType; }
        public void setPackageType(String packageType) { this.packageType = packageType; }
    }
    
    public static class DailyBonusResponse {
        private String message;
        private Integer bonusAmount;
        private CoinService.UserCoinsDTO coins;
        
        public DailyBonusResponse(String message, Integer bonusAmount, CoinService.UserCoinsDTO coins) {
            this.message = message;
            this.bonusAmount = bonusAmount;
            this.coins = coins;
        }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public Integer getBonusAmount() { return bonusAmount; }
        public void setBonusAmount(Integer bonusAmount) { this.bonusAmount = bonusAmount; }
        public CoinService.UserCoinsDTO getCoins() { return coins; }
        public void setCoins(CoinService.UserCoinsDTO coins) { this.coins = coins; }
    }
    
    public static class PurchaseResponse {
        private String message;
        private String packageName;
        private Integer packageAmount;
        private CoinService.UserCoinsDTO coins;
        
        public PurchaseResponse(String message, CoinService.CoinPackage coinPackage, CoinService.UserCoinsDTO coins) {
            this.message = message;
            this.packageName = coinPackage.getName();
            this.packageAmount = coinPackage.getAmount();
            this.coins = coins;
        }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getPackageName() { return packageName; }
        public void setPackageName(String packageName) { this.packageName = packageName; }
        public Integer getPackageAmount() { return packageAmount; }
        public void setPackageAmount(Integer packageAmount) { this.packageAmount = packageAmount; }
        public CoinService.UserCoinsDTO getCoins() { return coins; }
        public void setCoins(CoinService.UserCoinsDTO coins) { this.coins = coins; }
    }
}