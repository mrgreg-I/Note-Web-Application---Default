package com.example.csit360.service;

import com.example.csit360.entity.Note;
import com.example.csit360.repository.NoteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * Service to recover notes from blockchain
 * Implements requirement 8: Fetch notes from blockchain metadata and restore to local DB
 * 
 * If the database is lost or corrupted, this service can reconstruct notes from blockchain metadata
 * using the custom metadata label 42819n that was attached to each blockchain transaction
 */
@Service
public class BlockchainRecoveryService {

    private static final Logger logger = Logger.getLogger(BlockchainRecoveryService.class.getName());
    private static final String METADATA_LABEL = "42819"; // Custom label for app notes (converted from 42819n)

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private BlockfrostService blockfrostService;

    /**
     * Recover notes from blockchain for a specific wallet address
     * Queries all transactions from the wallet, extracts metadata, and reconstructs notes
     * 
     * This is useful if the database is lost or needs to be synced with blockchain state
     * 
     * @param walletAddress The wallet address to recover notes from (bech32 format, starts with "addr")
     * @return List of recovered notes
     */
    public List<Note> recoverNotesFromBlockchain(String walletAddress) {
        List<Note> recoveredNotes = new ArrayList<>();

        try {
            logger.info("🔄 Starting blockchain recovery for wallet: " + walletAddress);

            // Get all transactions for the wallet
            JsonNode transactions = blockfrostService.getWalletTransactions(walletAddress);

            if (transactions == null || !transactions.isArray()) {
                logger.warning("⚠️ No transactions found for wallet");
                return recoveredNotes;
            }

            logger.info("📊 Found " + transactions.size() + " transactions for wallet");

            // Process each transaction
            for (JsonNode txNode : transactions) {
                String txHash = txNode.asText();
                
                // Get transaction metadata
                JsonNode metadata = blockfrostService.getTransactionMetadata(txHash);
                
                if (metadata != null && metadata.isArray() && metadata.size() > 0) {
                    // Process metadata entries
                    JsonNode metadataEntry = metadata.get(0);
                    
                    if (metadataEntry.has(METADATA_LABEL)) {
                        JsonNode noteData = metadataEntry.get(METADATA_LABEL);
                        
                        try {
                            Note recoveredNote = reconstructNoteFromMetadata(noteData, walletAddress, txHash);
                            
                            if (recoveredNote != null) {
                                // Check if note already exists (by txhash)
                                Optional<Note> existingNote = noteRepository.findAll().stream()
                                    .filter(n -> txHash.equals(n.getTxhash()))
                                    .findFirst();
                                
                                if (existingNote.isEmpty()) {
                                    // Save the recovered note to database
                                    Note savedNote = noteRepository.save(recoveredNote);
                                    recoveredNotes.add(savedNote);
                                    logger.info("✅ Recovered note: " + savedNote.getTitle() + " (from tx: " + txHash + ")");
                                } else {
                                    logger.info("ℹ️ Note already exists in database: " + recoveredNote.getTitle());
                                }
                            }
                        } catch (Exception e) {
                            logger.warning("⚠️ Error reconstructing note from metadata: " + e.getMessage());
                        }
                    }
                }
            }

            logger.info("✓ Blockchain recovery completed. Recovered " + recoveredNotes.size() + " note(s)");

        } catch (Exception e) {
            logger.severe("❌ Error during blockchain recovery: " + e.getMessage());
            e.printStackTrace();
        }

        return recoveredNotes;
    }

    /**
     * Reconstruct a note from blockchain metadata
     * The metadata should contain fields like title, content, action, and timestamp
     * 
     * @param metadataNode The metadata JSON node from blockchain
     * @param walletAddress The wallet that created the note
     * @param txHash The transaction hash for reference
     * @return Reconstructed Note object, or null if reconstruction fails
     */
    private Note reconstructNoteFromMetadata(JsonNode metadataNode, String walletAddress, String txHash) {
        try {
            Note note = new Note();

            // Extract note properties from metadata
            String title = metadataNode.has("title") ? metadataNode.get("title").asText() : "Recovered Note";
            String noteText = metadataNode.has("content") ? metadataNode.get("content").asText() : "";
            String action = metadataNode.has("action") ? metadataNode.get("action").asText() : "CREATE";

            note.setTitle(title);
            note.setNoteText(noteText);
            note.setWalletAddress(walletAddress);
            note.setTxhash(txHash);
            
            // Set status as confirmed since it's coming from blockchain
            note.setStatus("confirmed");

            // Set timestamps
            LocalDateTime now = LocalDateTime.now();
            note.setCreatedAt(now);
            note.setUpdatedAt(now);

            logger.info("📝 Reconstructed note from metadata: title='" + title + "', action=" + action);

            return note;

        } catch (Exception e) {
            logger.severe("❌ Error reconstructing note: " + e.getMessage());
            return null;
        }
    }

    /**
     * Recover all deleted notes from blockchain
     * Looks for transactions with action="DELETE" in metadata and recovers the deleted notes
     * 
     * This allows users to restore notes they accidentally deleted, since blockchain is immutable
     * 
     * @param walletAddress The wallet address to recover deleted notes from
     * @return List of recovered deleted notes
     */
    public List<Note> recoverDeletedNotesFromBlockchain(String walletAddress) {
        List<Note> recoveredDeletedNotes = new ArrayList<>();

        try {
            logger.info("🗑️ Starting recovery of deleted notes from blockchain for wallet: " + walletAddress);

            JsonNode transactions = blockfrostService.getWalletTransactions(walletAddress);

            if (transactions == null || !transactions.isArray()) {
                logger.warning("⚠️ No transactions found for wallet");
                return recoveredDeletedNotes;
            }

            // Process transactions looking for delete actions
            for (JsonNode txNode : transactions) {
                String txHash = txNode.asText();
                JsonNode metadata = blockfrostService.getTransactionMetadata(txHash);

                if (metadata != null && metadata.isArray() && metadata.size() > 0) {
                    JsonNode metadataEntry = metadata.get(0);

                    if (metadataEntry.has(METADATA_LABEL)) {
                        JsonNode noteData = metadataEntry.get(METADATA_LABEL);
                        
                        if (noteData.has("action") && "DELETE".equals(noteData.get("action").asText())) {
                            logger.info("🔍 Found deleted note in transaction: " + txHash);
                            
                            // Try to reconstruct the deleted note
                            Note deletedNote = reconstructNoteFromMetadata(noteData, walletAddress, txHash);
                            if (deletedNote != null) {
                                deletedNote.setStatus("deleted_recovered");
                                recoveredDeletedNotes.add(deletedNote);
                            }
                        }
                    }
                }
            }

            logger.info("✓ Deleted notes recovery completed. Recovered " + recoveredDeletedNotes.size() + " deleted note(s)");

        } catch (Exception e) {
            logger.severe("❌ Error during deleted notes recovery: " + e.getMessage());
            e.printStackTrace();
        }

        return recoveredDeletedNotes;
    }
}
