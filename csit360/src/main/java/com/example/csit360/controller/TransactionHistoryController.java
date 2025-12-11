package com.example.csit360.controller;

import com.example.csit360.entity.TransactionHistory;
import com.example.csit360.repository.TransactionHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for TransactionHistory operations
 * Provides endpoints to query the immutable audit trail of blockchain transactions
 */
@RestController
@RequestMapping("/api/transaction-history")
@CrossOrigin(origins = "http://localhost:5173")
public class TransactionHistoryController {

    @Autowired
    private TransactionHistoryRepository transactionHistoryRepository;

    /**
     * Get all transactions for a specific note
     * @param noteId The note ID
     * @return List of all transactions related to the note
     */
    @GetMapping("/note/{noteId}")
    public ResponseEntity<List<TransactionHistory>> getTransactionsByNoteId(@PathVariable Long noteId) {
        try {
            List<TransactionHistory> transactions = transactionHistoryRepository.findByNoteId(noteId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all transactions by action type
     * @param actionType CREATE, UPDATE, or DELETE
     * @return List of transactions of the specified action type
     */
    @GetMapping("/action/{actionType}")
    public ResponseEntity<List<TransactionHistory>> getTransactionsByActionType(@PathVariable String actionType) {
        try {
            List<TransactionHistory> transactions = transactionHistoryRepository.findByActionType(actionType);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all transactions by status
     * @param status pending, confirmed, or failed
     * @return List of transactions with the specified status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<TransactionHistory>> getTransactionsByStatus(@PathVariable String status) {
        try {
            List<TransactionHistory> transactions = transactionHistoryRepository.findByStatus(status);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all transactions by wallet address
     * @param walletAddress The wallet address
     * @return List of transactions from the wallet
     */
    @GetMapping("/wallet/{walletAddress}")
    public ResponseEntity<List<TransactionHistory>> getTransactionsByWalletAddress(@PathVariable String walletAddress) {
        try {
            List<TransactionHistory> transactions = transactionHistoryRepository.findByWalletAddress(walletAddress);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all transactions (complete audit trail)
     * @return List of all transactions in the system
     */
    @GetMapping("/all")
    public ResponseEntity<List<TransactionHistory>> getAllTransactions() {
        try {
            List<TransactionHistory> transactions = transactionHistoryRepository.findAll();
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get transaction statistics
     * @return Map containing counts of transactions by type and status
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        try {
            List<TransactionHistory> allTransactions = transactionHistoryRepository.findAll();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTransactions", allTransactions.size());
            stats.put("createCount", transactionHistoryRepository.findByActionType("CREATE").size());
            stats.put("updateCount", transactionHistoryRepository.findByActionType("UPDATE").size());
            stats.put("deleteCount", transactionHistoryRepository.findByActionType("DELETE").size());
            stats.put("pendingCount", transactionHistoryRepository.findByStatus("pending").size());
            stats.put("confirmedCount", transactionHistoryRepository.findByStatus("confirmed").size());
            stats.put("failedCount", transactionHistoryRepository.findByStatus("failed").size());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
