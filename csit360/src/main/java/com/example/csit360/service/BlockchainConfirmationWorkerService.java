package com.example.csit360.service;

import com.example.csit360.entity.Note;
import com.example.csit360.entity.TransactionHistory;
import com.example.csit360.repository.NoteRepository;
import com.example.csit360.repository.TransactionHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * Background worker service for blockchain confirmation
 * Implements requirement 7: Async scheduled task to check Blockfrost every 20 seconds
 * 
 * Monitors notes with status="pending" and updates to "confirmed" when Blockfrost confirms the transaction
 */
@Service
public class BlockchainConfirmationWorkerService {

    private static final Logger logger = Logger.getLogger(BlockchainConfirmationWorkerService.class.getName());

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private BlockfrostService blockfrostService;

    @Autowired
    private BlockchainTransactionService blockchainTransactionService;

    @Autowired
    private TransactionHistoryRepository transactionHistoryRepository;

    /**
     * Scheduled task that runs every 20 seconds to check blockchain confirmation status
     * Queries all notes with status="pending" and checks Blockfrost for transaction confirmation
     * Updates status to "confirmed" when blockchain confirms the transaction
     */
    @Scheduled(fixedDelay = 20000) // Run every 20 seconds
    @Async
    public void checkPendingTransactionsConfirmation() {
        try {
            logger.info("🔍 Background worker: Checking pending transactions for blockchain confirmation...");

            // Find all notes with status="pending"
            List<Note> pendingNotes = noteRepository.findByStatus("pending");

            if (pendingNotes.isEmpty()) {
                logger.info("✓ No pending transactions to check");
                return;
            }

            logger.info("📋 Found " + pendingNotes.size() + " pending transaction(s)");

            // Check each pending note
            for (Note note : pendingNotes) {
                checkAndUpdateNoteStatus(note);
            }

        } catch (Exception e) {
            logger.severe("❌ Error in background worker: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Check a single note's transaction status and update if confirmed
     * 
     * @param note The note with pending status to check
     */
    private void checkAndUpdateNoteStatus(Note note) {
        try {
            String txHash = note.getTxhash();
            String noteId = note.getNoteId().toString();

            if (txHash == null || txHash.isEmpty()) {
                logger.warning("⚠️ Note " + noteId + " has no transaction hash, skipping...");
                return;
            }

            logger.info("🔗 Checking Blockfrost for transaction: " + txHash);

            // Query Blockfrost to check if transaction is confirmed
            boolean isConfirmed = blockfrostService.isTransactionConfirmed(txHash);

            if (isConfirmed) {
                logger.info("✅ Transaction confirmed on blockchain! Updating note " + noteId);
                
                // Update note status from "pending" to "confirmed"
                blockchainTransactionService.updateNoteStatus(note.getNoteId(), "confirmed");
                
                // Also update TransactionHistory status to "confirmed"
                updateTransactionHistoryStatus(txHash, "confirmed");
                
                logger.info("✓ Note " + noteId + " and transaction history updated to 'confirmed'");
            } else {
                logger.info("⏳ Transaction still pending for note " + noteId + ", will check again in 20 seconds");
            }

        } catch (Exception e) {
            logger.severe("❌ Error checking note status: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Update the transaction history status to confirmed
     * 
     * @param txHash The transaction hash to update
     * @param newStatus The new status (e.g., "confirmed")
     */
    private void updateTransactionHistoryStatus(String txHash, String newStatus) {
        try {
            // Find the transaction by hash
            Optional<TransactionHistory> transaction = transactionHistoryRepository.findByTxHash(txHash);
            
            if (transaction.isPresent()) {
                TransactionHistory tx = transaction.get();
                tx.setStatus(newStatus);
                transactionHistoryRepository.save(tx);
                logger.info("📝 Transaction history for " + txHash + " updated to status: " + newStatus);
            } else {
                logger.warning("⚠️ No transaction history found for hash: " + txHash);
            }
        } catch (Exception e) {
            logger.severe("❌ Error updating transaction history: " + e.getMessage());
            e.printStackTrace();
        }
    }
