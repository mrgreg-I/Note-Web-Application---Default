package com.example.csit360.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.csit360.service.BlockchainService;

/**
 * Blockchain Controller for Cardano integration
 * Handles wallet connections and blockchain operations
 */
@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "http://localhost:5173")
public class BlockchainController {

    @Autowired
    private BlockchainService blockchainService;

    /**
     * Get network configuration
     */
    @GetMapping("/network-config")
    public ResponseEntity<Map<String, String>> getNetworkConfig() {
        try {
            Map<String, String> config = blockchainService.getNetworkConfig();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Validate wallet connection
     */
    @PostMapping("/validate-wallet")
    public ResponseEntity<Map<String, Object>> validateWallet(
            @RequestParam String walletAddress,
            @RequestParam String walletName) {
        try {
            if (!blockchainService.isValidCardanoAddress(walletAddress)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid Cardano address format"));
            }
            Map<String, Object> validation = blockchainService.validateWalletConnection(walletAddress, walletName);
            return ResponseEntity.ok(validation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Simulate note creation transaction on blockchain
     */
    @PostMapping("/simulate-note-transaction")
    public ResponseEntity<Map<String, Object>> simulateNoteTransaction(@RequestBody Map<String, Object> payload) {
        try {
            Long noteId = null;
            String walletAddress = null;
            String noteTitle = null;
            
            // Parse payload
            if (payload.get("noteId") instanceof Integer) {
                noteId = ((Integer) payload.get("noteId")).longValue();
            } else if (payload.get("noteId") instanceof Long) {
                noteId = (Long) payload.get("noteId");
            } else if (payload.get("noteId") != null) {
                noteId = Long.valueOf(payload.get("noteId").toString());
            }
            walletAddress = (String) payload.get("walletAddress");
            noteTitle = (String) payload.get("noteTitle");

            // Check if wallet address is null or invalid
            if (walletAddress == null || !isValidCardanoAddress(walletAddress)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid Cardano address format"));
            }

            // Simulate transaction
            Map<String, Object> transaction = blockchainService.simulateNoteTransaction(noteId, walletAddress, noteTitle);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Simulate note update transaction on blockchain
     */
    @PostMapping("/simulate-note-update-transaction")
    public ResponseEntity<Map<String, Object>> simulateNoteUpdateTransaction(
            @RequestParam Long noteId,
            @RequestParam String walletAddress,
            @RequestParam String noteTitle) {
        try {
            if (!blockchainService.isValidCardanoAddress(walletAddress)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid Cardano address format"));
            }
            Map<String, Object> transaction = blockchainService.simulateNoteUpdateTransaction(noteId, walletAddress, noteTitle);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Simulate note deletion transaction on blockchain
     */
    @PostMapping("/simulate-note-deletion-transaction")
    public ResponseEntity<Map<String, Object>> simulateNoteDeletionTransaction(
            @RequestParam Long noteId,
            @RequestParam String walletAddress) {
        try {
            if (!blockchainService.isValidCardanoAddress(walletAddress)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid Cardano address format"));
            }
            Map<String, Object> transaction = blockchainService.simulateNoteDeletionTransaction(noteId, walletAddress);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get Cardano Can I Use feature status
     */
    @GetMapping("/caniuse-features")
    public ResponseEntity<Map<String, Object>> getCardanoCanIUseFeatures() {
        try {
            Map<String, Object> features = blockchainService.getCardanoFeatureStatus();
            return ResponseEntity.ok(features);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Blockchain service is running");
    }
    
    private boolean isValidCardanoAddress(String address) {
        if (address == null || address.isEmpty()) {
            return false;
        }
        
        // Check if the address is a valid Bech32 address
        if (address.startsWith("addr") && address.matches("^addr[a-zA-Z0-9]{98,}$")) {
            return true; // Bech32 address validation
        }
        
        // Check if the address is a valid Hexadecimal address
        return isValidHexAddress(address); // Hex address validation
    }

    private boolean isValidHexAddress(String address) {
        // Hexadecimal address validation (usually 56 or more characters in length)
        return address.matches("[0-9a-fA-F]{56,}") && address.length() >= 56;
    }
}
