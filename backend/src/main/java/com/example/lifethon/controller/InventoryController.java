package com.example.lifethon.controller;

import com.example.lifethon.service.InventoryService;
import com.example.lifethon.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InventoryController {
    
    private final InventoryService inventoryService;
    private final JwtUtil jwtUtil;
    
    /**
     * Get user's full inventory
     */
    @GetMapping
    public ResponseEntity<?> getInventory(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            List<InventoryService.InventoryItemDTO> inventory = inventoryService.getUserInventory(userId);
            return ResponseEntity.ok(inventory);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to get inventory: " + e.getMessage()));
        }
    }
    
    /**
     * Get equipped items
     */
    @GetMapping("/equipped")
    public ResponseEntity<?> getEquippedItems(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            List<InventoryService.InventoryItemDTO> equipped = inventoryService.getEquippedItems(userId);
            return ResponseEntity.ok(equipped);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to get equipped items: " + e.getMessage()));
        }
    }
    
    /**
     * Equip an item
     */
    @PostMapping("/{inventoryId}/equip")
    public ResponseEntity<?> equipItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long inventoryId) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            InventoryService.InventoryItemDTO item = inventoryService.equipItem(userId, inventoryId);
            return ResponseEntity.ok(item);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to equip item: " + e.getMessage()));
        }
    }
    
    /**
     * Unequip an item
     */
    @PostMapping("/{inventoryId}/unequip")
    public ResponseEntity<?> unequipItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long inventoryId) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            InventoryService.InventoryItemDTO item = inventoryService.unequipItem(userId, inventoryId);
            return ResponseEntity.ok(item);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to unequip item: " + e.getMessage()));
        }
    }
    
    /**
     * Use a consumable item
     */
    @PostMapping("/{inventoryId}/use")
    public ResponseEntity<?> useItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long inventoryId) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            InventoryService.UseItemResult result = inventoryService.useConsumable(userId, inventoryId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to use item: " + e.getMessage()));
        }
    }
    
    /**
     * Get inventory statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getInventoryStats(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            InventoryService.InventoryStats stats = inventoryService.getInventoryStats(userId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to get stats: " + e.getMessage()));
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
}