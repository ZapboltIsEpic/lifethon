package com.example.lifethon.controller;

import com.example.lifethon.service.GachaService;
import com.example.lifethon.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gacha")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class GachaController {
    
    private final GachaService gachaService;
    private final JwtUtil jwtUtil;
    
    /**
     * Perform a single gacha pull
     */
    @PostMapping("/pull/single")
    public ResponseEntity<?> singlePull(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            GachaService.GachaPullResult result = gachaService.performSinglePull(userId);
            return ResponseEntity.ok(result);
        } catch (GachaService.InsufficientCoinsException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Gacha pull failed: " + e.getMessage()));
        }
    }
    
    /**
     * Perform a multi-pull (10 pulls)
     */
    @PostMapping("/pull/multi")
    public ResponseEntity<?> multiPull(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            GachaService.GachaPullResult result = gachaService.performMultiPull(userId);
            return ResponseEntity.ok(result);
        } catch (GachaService.InsufficientCoinsException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Gacha pull failed: " + e.getMessage()));
        }
    }
    
    /**
     * Get gacha information (costs, rates, etc.)
     */
    @GetMapping("/info")
    public ResponseEntity<?> getGachaInfo() {
        GachaInfo info = new GachaInfo(
            100,  // Single pull cost
            900,  // Multi pull cost
            10,   // Multi pull count
            90,   // Pity threshold
            75    // Soft pity start
        );
        return ResponseEntity.ok(info);
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
    
    public static class GachaInfo {
        private Integer singlePullCost;
        private Integer multiPullCost;
        private Integer multiPullCount;
        private Integer pityThreshold;
        private Integer softPityStart;
        
        public GachaInfo(Integer singlePullCost, Integer multiPullCost, Integer multiPullCount,
                        Integer pityThreshold, Integer softPityStart) {
            this.singlePullCost = singlePullCost;
            this.multiPullCost = multiPullCost;
            this.multiPullCount = multiPullCount;
            this.pityThreshold = pityThreshold;
            this.softPityStart = softPityStart;
        }
        
        public Integer getSinglePullCost() { return singlePullCost; }
        public void setSinglePullCost(Integer singlePullCost) { this.singlePullCost = singlePullCost; }
        public Integer getMultiPullCost() { return multiPullCost; }
        public void setMultiPullCost(Integer multiPullCost) { this.multiPullCost = multiPullCost; }
        public Integer getMultiPullCount() { return multiPullCount; }
        public void setMultiPullCount(Integer multiPullCount) { this.multiPullCount = multiPullCount; }
        public Integer getPityThreshold() { return pityThreshold; }
        public void setPityThreshold(Integer pityThreshold) { this.pityThreshold = pityThreshold; }
        public Integer getSoftPityStart() { return softPityStart; }
        public void setSoftPityStart(Integer softPityStart) { this.softPityStart = softPityStart; }
    }
}