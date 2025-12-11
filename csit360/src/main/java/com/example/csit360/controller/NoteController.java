package com.example.csit360.controller;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.csit360.entity.Note;
import com.example.csit360.service.BlockchainRecoveryService;
import com.example.csit360.service.BlockchainTransactionService;
import com.example.csit360.service.NoteService;




@RestController
@RequestMapping("/api/note")
public class NoteController {
    @Autowired
    private NoteService noteServ;
    
    @Autowired
    private BlockchainTransactionService blockchainTransactionService;

    @Autowired
    private BlockchainRecoveryService blockchainRecoveryService;
    
    @GetMapping("/get/all")
    public List<Note> getAllNotes () {
        return noteServ.getAllNotes();
    }
    @GetMapping("/get/{id}")
    public Note findNoteById(@PathVariable Long id) {
        return noteServ.findNoteById(id);
    }
    @PostMapping("/post")
    public ResponseEntity<Map<String, Object>> postNote(
        @RequestBody Note note,
        @RequestParam(required = false) String walletAddress,
        @RequestParam(required = false) String txhash) {
        try {
            // If wallet address is provided, store with blockchain logging
            // txhash can be provided from frontend (from Blaze SDK transaction or simulated)
            if (walletAddress != null && !walletAddress.isEmpty()) {
                Map<String, Object> response = blockchainTransactionService.storeNoteWithBlockchainLogging(
                    note,
                    walletAddress,
                    txhash,
                    "CREATE"
                );
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                // Fallback to regular save without blockchain
                Note savedNote = noteServ.postNote(note);
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("note", savedNote);
                response.put("status", "saved");
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    @PutMapping("/put/{id}")
    public ResponseEntity<Map<String, Object>> updateNote(
        @PathVariable Long id,
        @RequestBody Note newNote,
        @RequestParam(required = false) String walletAddress,
        @RequestParam(required = false) String txhash) {
        try {
            // Set the ID to ensure we're updating the right note
            newNote.setNoteId(id);
            
            // If wallet address is provided, store with blockchain logging
            if (walletAddress != null && !walletAddress.isEmpty()) {
                Map<String, Object> response = blockchainTransactionService.storeUpdatedNoteWithBlockchainLogging(
                    newNote,
                    walletAddress,
                    txhash
                );
                return ResponseEntity.ok(response);
            } else {
                // Fallback to regular update without blockchain
                Note updatedNote = noteServ.updateNote(id, newNote);
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("note", updatedNote);
                response.put("status", "updated");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteNote(
        @PathVariable Long id,
        @RequestParam(required = false) String walletAddress,
        @RequestParam(required = false) String txhash) {
        try {
            // If wallet address is provided, store with blockchain logging
            if (walletAddress != null && !walletAddress.isEmpty()) {
                Map<String, Object> response = blockchainTransactionService.storeDeletedNoteWithBlockchainLogging(
                    id,
                    walletAddress,
                    txhash
                );
                return ResponseEntity.ok(response);
            } else {
                // Fallback to regular delete without blockchain
                noteServ.deleteNote(id);
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("status", "deleted");
                response.put("noteId", id);
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Requirement 8: Recover deleted notes from blockchain
     * Fetches deleted notes from blockchain metadata and optionally restores them
     * 
     * @param walletAddress The wallet address to recover deleted notes from
     * @return List of recovered deleted notes
     */
    @PostMapping("/recover-deleted-from-blockchain")
    public ResponseEntity<Map<String, Object>> recoverDeletedNotesFromBlockchain(
        @RequestParam String walletAddress) {
        try {
            if (walletAddress == null || walletAddress.isEmpty()) {
                Map<String, Object> error = new java.util.HashMap<>();
                error.put("error", "Wallet address is required");
                return ResponseEntity.badRequest().body(error);
            }

            List<Note> recoveredDeletedNotes = blockchainRecoveryService.recoverDeletedNotesFromBlockchain(walletAddress);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("status", "success");
            response.put("message", "Recovered " + recoveredDeletedNotes.size() + " deleted note(s) from blockchain");
            response.put("recoveredDeletedNotes", recoveredDeletedNotes);
            response.put("walletAddress", walletAddress);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    @GetMapping("/get/by-wallet/{wallet}")
    public List<Note> getNotesByWallet(@PathVariable String wallet) {
        return noteServ.getNotesByWallet(wallet);
    } 
}
