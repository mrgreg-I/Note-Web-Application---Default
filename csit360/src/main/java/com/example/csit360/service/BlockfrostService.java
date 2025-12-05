package com.example.csit360.service;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Service to interact with Blockfrost API for Cardano blockchain queries
 * Implements requirement 6: Use Blockfrost to communicate with blockchain
 */
@Service
public class BlockfrostService {

    @Value("${blockfrost.projectId:}")
    private String blockfrostProjectId;

    private final String BLOCKFROST_API_BASE = "https://cardano-preview.blockfrost.io/api/v0";
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Query Blockfrost to check if a transaction is confirmed
     * Used by the background worker to verify transaction status
     * 
     * @param txHash The transaction hash to check
     * @return true if transaction is confirmed (included in a block), false otherwise
     */
    public boolean isTransactionConfirmed(String txHash) {
        try {
            String endpoint = BLOCKFROST_API_BASE + "/txs/" + txHash;
            URL url = new URL(endpoint);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            // Set Blockfrost API key header
            connection.setRequestProperty("project_id", blockfrostProjectId);
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            
            int responseCode = connection.getResponseCode();
            
            // 200 = transaction found and confirmed in a block
            if (responseCode == 200) {
                return true;
            }
            // 404 = transaction not yet confirmed
            else if (responseCode == 404) {
                return false;
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("Error checking transaction status: " + e.getMessage());
            return false;
        }
    }

    /**
     * Get transaction details from Blockfrost
     * 
     * @param txHash The transaction hash
     * @return Transaction details as JSON, or null if not found
     */
    public JsonNode getTransactionDetails(String txHash) {
        try {
            String endpoint = BLOCKFROST_API_BASE + "/txs/" + txHash;
            URL url = new URL(endpoint);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            connection.setRequestProperty("project_id", blockfrostProjectId);
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            
            int responseCode = connection.getResponseCode();
            
            if (responseCode == 200) {
                Scanner scanner = new Scanner(connection.getInputStream()).useDelimiter("\\A");
                String response = scanner.hasNext() ? scanner.next() : "";
                return objectMapper.readTree(response);
            }
            
            return null;
        } catch (Exception e) {
            System.err.println("Error fetching transaction details: " + e.getMessage());
            return null;
        }
    }

    /**
     * Get transaction metadata from Blockfrost
     * Used to reconstruct notes from blockchain if database is lost (Requirement 8)
     * 
     * @param txHash The transaction hash
     * @return Metadata as JSON, or null if not found
     */
    public JsonNode getTransactionMetadata(String txHash) {
        try {
            String endpoint = BLOCKFROST_API_BASE + "/txs/" + txHash + "/metadata";
            URL url = new URL(endpoint);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            connection.setRequestProperty("project_id", blockfrostProjectId);
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            
            int responseCode = connection.getResponseCode();
            
            if (responseCode == 200) {
                Scanner scanner = new Scanner(connection.getInputStream()).useDelimiter("\\A");
                String response = scanner.hasNext() ? scanner.next() : "";
                return objectMapper.readTree(response);
            }
            
            return null;
        } catch (Exception e) {
            System.err.println("Error fetching transaction metadata: " + e.getMessage());
            return null;
        }
    }

    /**
     * Query all transactions for a wallet address
     * Used to recover notes from blockchain (Requirement 8)
     * 
     * @param walletAddress The wallet address to query
     * @return Array of transactions, or empty array if none found
     */
    public JsonNode getWalletTransactions(String walletAddress) {
        try {
            String endpoint = BLOCKFROST_API_BASE + "/addresses/" + walletAddress + "/txs";
            URL url = new URL(endpoint);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            connection.setRequestProperty("project_id", blockfrostProjectId);
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            
            int responseCode = connection.getResponseCode();
            
            if (responseCode == 200) {
                Scanner scanner = new Scanner(connection.getInputStream()).useDelimiter("\\A");
                String response = scanner.hasNext() ? scanner.next() : "";
                return objectMapper.readTree(response);
            }
            
            return objectMapper.createArrayNode();
        } catch (Exception e) {
            System.err.println("Error fetching wallet transactions: " + e.getMessage());
            return objectMapper.createArrayNode();
        }
    }
}
