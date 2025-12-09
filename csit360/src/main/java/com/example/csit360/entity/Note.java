package com.example.csit360.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
@Entity
@Table(name="notes")
public class Note {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long noteId;
    private String title;
    private String noteText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "userId")
    @JsonBackReference
	private User user;

    public Note() {
    }

    public Note(Long noteId, String title, String noteText, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.noteId = noteId;
        this.title = title;
        this.noteText = noteText;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    public Long getNoteId() {
        return noteId;
    }
    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public String getNoteText() {
        return noteText;
    }
    public void setNoteText(String noteText) {
        this.noteText = noteText;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    @PrePersist
    protected void onCreate(){
        this.createdAt=LocalDateTime.now();
        this.updatedAt=LocalDateTime.now();
    }
    @PreUpdate
    protected void onUpdate(){
        this.updatedAt=LocalDateTime.now();
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    
}
