package com.example.csit360.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * TransactionHistory Entity
 * Maintains complete audit trail of all blockchain transactions
 * Never deleted, only appended - provides immutable record for blockchain reconciliation
 */
@Entity
@Table(name = "transaction_history")
public class TransactionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "note_id", nullable = true)
    private Long noteId;

    @Column(name = "action_type", nullable = false)
    private String actionType; // CREATE, UPDATE, DELETE

    @Column(name = "tx_hash", nullable = false, unique = true)
    private String txHash;

    @Column(name = "wallet_address", nullable = false)
    private String walletAddress;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "status", nullable = false)
    private String status; // pending, confirmed, failed

    // Constructors
    public TransactionHistory() {
    }

    public TransactionHistory(Long noteId, String actionType, String txHash, String walletAddress, String status) {
        this.noteId = noteId;
        this.actionType = actionType;
        this.txHash = txHash;
        this.walletAddress = walletAddress;
        this.timestamp = LocalDateTime.now();
        this.status = status;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getTxHash() {
        return txHash;
    }

    public void setTxHash(String txHash) {
        this.txHash = txHash;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "TransactionHistory{" +
                "id=" + id +
                ", noteId=" + noteId +
                ", actionType='" + actionType + '\'' +
                ", txHash='" + txHash + '\'' +
                ", walletAddress='" + walletAddress + '\'' +
                ", timestamp=" + timestamp +
                ", status='" + status + '\'' +
                '}';
    }
}
