package com.example.csit360.service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.csit360.entity.Note;
import com.example.csit360.entity.TransactionHistory;
import com.example.csit360.repository.NoteRepository;
import com.example.csit360.repository.TransactionHistoryRepository;

/**
 * Service to handle blockchain transaction simulation and note status tracking
 * Implements requirement 5: Store notes immediately with "pending" status
 * while blockchain transactions are processed asynchronously
 */
@Service
public class BlockchainTransactionService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private TransactionHistoryRepository transactionHistoryRepository;

    /**
     * Store a note with pending status and simulate blockchain transaction
     * This method saves the note to the database immediately with status = "pending"
     * and returns a simulated transaction hash
     * 
     * @param note The note to store
     * @param walletAddress The wallet address (hex or bech32 format)
     * @param txhash The transaction hash provided by frontend (optional, will generate if null)
     * @param action The action type (CREATE, UPDATE, DELETE)
     * @return Map containing saved note and transaction info
     */
    public Map<String, Object> storeNoteWithBlockchainLogging(Note note, String walletAddress, String txhash, String action) {
        try {
            // Step 1: Use provided transaction hash, or generate if not provided
            String txHash = (txhash != null && !txhash.isEmpty()) ? txhash : generateTransactionHash();
            
            // Step 2: Set blockchain-related fields on the note
            note.setStatus("pending");
            note.setTxhash(txHash);
            note.setWalletAddress(walletAddress);
            
            // Step 3: Save the note to database immediately (fast cache for UX)
            Note savedNote = noteRepository.save(note);
            
            // Step 4: Log transaction to TransactionHistory (immutable audit trail)
            TransactionHistory transaction = new TransactionHistory(
                savedNote.getNoteId(),
                action,
                txHash,
                walletAddress,
                "pending"
            );
            transactionHistoryRepository.save(transaction);
            
            // Step 5: Simulate blockchain transaction (in background, this would be async)
            Map<String, Object> simulatedTx = blockchainService.simulateNoteTransaction(
                savedNote.getNoteId(),
                walletAddress,
                savedNote.getTitle()
            );
            
            // Step 6: Return response with both note and transaction info
            Map<String, Object> response = new HashMap<>();
            response.put("note", savedNote);
            response.put("transaction", simulatedTx);
            response.put("status", "pending");
            response.put("txHash", txHash);
            
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Error storing note with blockchain logging: " + e.getMessage(), e);
        }
    }

    /**
     * Store an updated note with pending status
     * 
     * @param note The updated note
     * @param walletAddress The wallet address (hex or bech32 format)
     * @param txhash The transaction hash provided by frontend (optional, will generate if null)
     * @return Map containing updated note and transaction info
     */
    public Map<String, Object> storeUpdatedNoteWithBlockchainLogging(Note note, String walletAddress, String txhash) {
        try {
            // Use provided transaction hash, or generate if not provided
            String txHash = (txhash != null && !txhash.isEmpty()) ? txhash : generateTransactionHash();
            
            // Set blockchain fields
            note.setStatus("pending");
            note.setTxhash(txHash);
            note.setWalletAddress(walletAddress);
            
            // Save updated note to database
            Note savedNote = noteRepository.save(note);
            
            // Log transaction to TransactionHistory (immutable audit trail)
            TransactionHistory transaction = new TransactionHistory(
                savedNote.getNoteId(),
                "UPDATE",
                txHash,
                walletAddress,
                "pending"
            );
            transactionHistoryRepository.save(transaction);
            
            // Simulate blockchain transaction
            Map<String, Object> simulatedTx = blockchainService.simulateNoteUpdateTransaction(
                savedNote.getNoteId(),
                walletAddress,
                savedNote.getTitle()
            );
            
            // Return response
            Map<String, Object> response = new HashMap<>();
            response.put("note", savedNote);
            response.put("transaction", simulatedTx);
            response.put("status", "pending");
            response.put("txHash", txHash);
            
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Error storing updated note with blockchain logging: " + e.getMessage(), e);
        }
    }

    /**
     * Store a note deletion with pending status
     * 
     * @param noteId The ID of the note being deleted
     * @param walletAddress The wallet address (hex or bech32 format)
     * @param txhash The transaction hash provided by frontend (optional, will generate if null)
     * @return Map containing transaction info
     */
    public Map<String, Object> storeDeletedNoteWithBlockchainLogging(
        Long noteId, 
        String walletAddress, 
        String txhash
) {
    try {
        // Fetch note
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found: " + noteId));

        // Use provided txhash or generate one
        String txHash = (txhash != null && !txhash.isEmpty()) 
                ? txhash 
                : generateTransactionHash();

        // Log transaction before deletion
        TransactionHistory transaction = new TransactionHistory(
                noteId,
                "DELETE",
                txHash,
                walletAddress,
                "pending"      // <-- important, not pending
        );
        transactionHistoryRepository.save(transaction);

        // DELETE the note from database
        noteRepository.deleteById(noteId);

        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "deleted");
        response.put("noteId", noteId);
        response.put("txHash", txHash);
        response.put("walletAddress", walletAddress);

        return response;

    } catch (Exception e) {
        throw new RuntimeException(
                "Error storing deleted note with blockchain logging: " + e.getMessage(), 
                e
        );
    }
}

    /**
     * Update note status from pending to confirmed
     * This is called by the background worker (Requirement 7)
     * 
     * @param noteId The note ID
     * @param newStatus The new status (e.g., "confirmed")
     */
    public void updateNoteStatus(Long noteId, String newStatus) {
        try {
            Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found: " + noteId));
            note.setStatus(newStatus);
            noteRepository.save(note);
        } catch (Exception e) {
            throw new RuntimeException("Error updating note status: " + e.getMessage(), e);
        }
    }

    /**
     * Generate a simulated transaction hash
     * In production, this would be a real Cardano transaction hash from Blaze/Blockfrost
     * 
     * @return Simulated transaction hash
     */
    private String generateTransactionHash() {
        // UUID without dashes is 32 characters, use all of it
        String uuidHash = UUID.randomUUID().toString().replace("-", "");
        return uuidHash;
    }
}
