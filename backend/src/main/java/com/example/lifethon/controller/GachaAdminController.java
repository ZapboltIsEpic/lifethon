package com.example.lifethon.controller;

import com.example.lifethon.entity.GachaItem;
import com.example.lifethon.service.GachaAdminService;
import com.example.lifethon.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/gacha")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class GachaAdminController {
    
    private final GachaAdminService gachaAdminService;
    private final JwtUtil jwtUtil;
    
    /**
     * Get all gacha items (including inactive)
     */
    @GetMapping("/items")
    public ResponseEntity<?> getAllItems(@RequestHeader("Authorization") String authHeader) {
        try {
            verifyAdmin(authHeader);
            List<GachaItem> items = gachaAdminService.getAllItems();
            return ResponseEntity.ok(items);
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to get items: " + e.getMessage()));
        }
    }
    
    /**
     * Get single gacha item by ID
     */
    @GetMapping("/items/{id}")
    public ResponseEntity<?> getItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            verifyAdmin(authHeader);
            GachaItem item = gachaAdminService.getItemById(id);
            return ResponseEntity.ok(item);
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to get item: " + e.getMessage()));
        }
    }
    
    /**
     * Create new gacha item
     */
    @PostMapping("/items")
    public ResponseEntity<?> createItem(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateGachaItemRequest request) {
        try {
            verifyAdmin(authHeader);
            GachaItem item = gachaAdminService.createItem(
                request.getName(),
                request.getDescription(),
                request.getImageUrl(),
                request.getRarity(),
                request.getItemType(),
                request.getDropRate(),
                request.getBonusCoins(),
                request.getBonusEnergy()
            );
            return ResponseEntity.status(201).body(item);
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to create item: " + e.getMessage()));
        }
    }
    
    /**
     * Update gacha item
     */
    @PutMapping("/items/{id}")
    public ResponseEntity<?> updateItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody UpdateGachaItemRequest request) {
        try {
            verifyAdmin(authHeader);
            GachaItem item = gachaAdminService.updateItem(
                id,
                request.getName(),
                request.getDescription(),
                request.getImageUrl(),
                request.getRarity(),
                request.getItemType(),
                request.getDropRate(),
                request.getBonusCoins(),
                request.getBonusEnergy(),
                request.getIsActive()
            );
            return ResponseEntity.ok(item);
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to update item: " + e.getMessage()));
        }
    }
    
    /**
     * Delete gacha item (soft delete - set inactive)
     */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            verifyAdmin(authHeader);
            gachaAdminService.deleteItem(id);
            return ResponseEntity.ok(new MessageResponse("Item deleted successfully"));
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to delete item: " + e.getMessage()));
        }
    }
    
    /**
     * Toggle item active status
     */
    @PatchMapping("/items/{id}/toggle-active")
    public ResponseEntity<?> toggleActive(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            verifyAdmin(authHeader);
            GachaItem item = gachaAdminService.toggleItemActive(id);
            return ResponseEntity.ok(item);
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to toggle status: " + e.getMessage()));
        }
    }
    
    /**
     * Get drop rate validation (checks if rates sum to 100%)
     */
    @GetMapping("/validate-rates")
    public ResponseEntity<?> validateRates(@RequestHeader("Authorization") String authHeader) {
        try {
            verifyAdmin(authHeader);
            boolean isValid = gachaAdminService.validateDropRates();
            double totalRate = gachaAdminService.getTotalDropRate();
            
            return ResponseEntity.ok(new DropRateValidation(isValid, totalRate));
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to validate rates: " + e.getMessage()));
        }
    }
    
    /**
     * Get gacha statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getGachaStats(@RequestHeader("Authorization") String authHeader) {
        try {
            verifyAdmin(authHeader);
            GachaAdminService.GachaStats stats = gachaAdminService.getGachaStats();
            return ResponseEntity.ok(stats);
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to get stats: " + e.getMessage()));
        }
    }
    
    /**
     * Verify admin access using JWT role
     */
    private void verifyAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid authorization header");
        }
        
        String token = authHeader.substring(7);
        
        if (!jwtUtil.validateToken(token)) {
            throw new UnauthorizedException("Invalid token");
        }
        
        if (!jwtUtil.isAdmin(token)) {
            throw new UnauthorizedException("Admin access required");
        }
    }
    
    // DTOs
    public static class CreateGachaItemRequest {
        private String name;
        private String description;
        private String imageUrl;
        private GachaItem.Rarity rarity;
        private GachaItem.ItemType itemType;
        private Double dropRate;
        private Integer bonusCoins;
        private Integer bonusEnergy;
        
        // Getters and Setters
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
        public Double getDropRate() { return dropRate; }
        public void setDropRate(Double dropRate) { this.dropRate = dropRate; }
        public Integer getBonusCoins() { return bonusCoins; }
        public void setBonusCoins(Integer bonusCoins) { this.bonusCoins = bonusCoins; }
        public Integer getBonusEnergy() { return bonusEnergy; }
        public void setBonusEnergy(Integer bonusEnergy) { this.bonusEnergy = bonusEnergy; }
    }
    
    public static class UpdateGachaItemRequest extends CreateGachaItemRequest {
        private Boolean isActive;
        
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }
    
    public static class DropRateValidation {
        private boolean isValid;
        private double totalRate;
        
        public DropRateValidation(boolean isValid, double totalRate) {
            this.isValid = isValid;
            this.totalRate = totalRate;
        }
        
        public boolean isValid() { return isValid; }
        public void setValid(boolean valid) { isValid = valid; }
        public double getTotalRate() { return totalRate; }
        public void setTotalRate(double totalRate) { this.totalRate = totalRate; }
    }
    
    public static class ErrorResponse {
        private String error;
        
        public ErrorResponse(String error) {
            this.error = error;
        }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    public static class MessageResponse {
        private String message;
        
        public MessageResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }
}