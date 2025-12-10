package com.example.csit360.repository;

import com.example.csit360.entity.TransactionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for TransactionHistory entity
 * Provides access to blockchain transaction audit trail
 */
@Repository
public interface TransactionHistoryRepository extends JpaRepository<TransactionHistory, Long> {

    /**
     * Find all transactions for a specific note
     * @param noteId The note ID
     * @return List of all transactions related to the note
     */
    List<TransactionHistory> findByNoteId(Long noteId);

    /**
     * Find transaction by hash
     * @param txHash The transaction hash
     * @return The transaction if found
     */
    Optional<TransactionHistory> findByTxHash(String txHash);

    /**
     * Find all transactions by action type
     * @param actionType CREATE, UPDATE, or DELETE
     * @return List of transactions matching the action type
     */
    List<TransactionHistory> findByActionType(String actionType);

    /**
     * Find all transactions by status
     * @param status pending, confirmed, or failed
     * @return List of transactions with given status
     */
    List<TransactionHistory> findByStatus(String status);

    /**
     * Find all transactions for a wallet address
     * @param walletAddress The wallet address
     * @return List of transactions from the wallet
     */
    List<TransactionHistory> findByWalletAddress(String walletAddress);
}
