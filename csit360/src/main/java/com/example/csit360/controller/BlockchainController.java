package com.example.csit360.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.csit360.service.CardanoBlockchainService;
import java.util.Map;

@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BlockchainController {

    @Autowired
    private CardanoBlockchainService blockchainService;

    /**
     * Verify wallet connection
     * POST /api/blockchain/verify-wallet
     */
    @PostMapping("/verify-wallet")
    public Map<String, Object> verifyWallet(@RequestBody Map<String, String> request) {
        String walletAddress = request.get("walletAddress");
        return blockchainService.verifyWalletConnection(walletAddress);
    }

    /**
     * Get wallet balance
     * GET /api/blockchain/balance/{walletAddress}
     */
    @GetMapping("/balance/{walletAddress}")
    public Map<String, Object> getWalletBalance(@PathVariable String walletAddress) {
        return blockchainService.getWalletBalance(walletAddress);
    }

    /**
     * Simulate note transaction
     * POST /api/blockchain/simulate-transaction
     */
    @PostMapping("/simulate-transaction")
    public Map<String, Object> simulateTransaction(@RequestBody Map<String, String> request) {
        String walletAddress = request.get("walletAddress");
        String noteContent = request.get("noteContent");
        String noteTitle = request.get("noteTitle");
        return blockchainService.simulateNoteTransaction(walletAddress, noteContent, noteTitle);
    }

    /**
     * Create note transaction on blockchain
     * POST /api/blockchain/create-transaction
     */
    @PostMapping("/create-transaction")
    public Map<String, Object> createTransaction(@RequestBody Map<String, Object> request) {
        String walletAddress = (String) request.get("walletAddress");
        Long noteId = ((Number) request.get("noteId")).longValue();
        String noteTitle = (String) request.get("noteTitle");
        return blockchainService.createNoteTransaction(walletAddress, noteId, noteTitle);
    }

    /**
     * Verify transaction on blockchain
     * GET /api/blockchain/verify-transaction/{transactionHash}
     */
    @GetMapping("/verify-transaction/{transactionHash}")
    public Map<String, Object> verifyTransaction(@PathVariable String transactionHash) {
        return blockchainService.verifyTransaction(transactionHash);
    }

    /**
     * Get transaction history for wallet
     * GET /api/blockchain/transaction-history/{walletAddress}
     */
    @GetMapping("/transaction-history/{walletAddress}")
    public Map<String, Object> getTransactionHistory(@PathVariable String walletAddress) {
        return blockchainService.getTransactionHistory(walletAddress);
    }

    /**
     * Estimate transaction fees
     * POST /api/blockchain/estimate-fees
     */
    @PostMapping("/estimate-fees")
    public Map<String, Object> estimateFees(@RequestBody Map<String, String> request) {
        String walletAddress = request.get("walletAddress");
        return blockchainService.estimateTransactionFees(walletAddress);
    }

    /**
     * Health check endpoint
     * GET /api/blockchain/health
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", "ok");
        response.put("service", "Cardano Blockchain Integration");
        response.put("network", "preprod (testnet)");
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
}
