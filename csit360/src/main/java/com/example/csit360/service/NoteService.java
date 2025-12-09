package com.example.csit360.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.csit360.entity.Note;
import com.example.csit360.entity.User;
import com.example.csit360.repository.NoteRepository;
import com.example.csit360.repository.UserRepository;
@Service
public class NoteService {
    @Autowired
    private NoteRepository noteRepo;
    private UserRepository userRepo;

     public NoteService(){
        super();
    }
    @Autowired
    public NoteService(NoteRepository noteRepo,UserRepository userRepo) {
        this.noteRepo = noteRepo;
        this.userRepo = userRepo;
    }

public Note postNote(Note note, Long userId) {
    try {
        User user = userRepo.findById(userId).orElse(null);
        if (user != null) { 
            note.setUser(user);
            return noteRepo.save(note);  
        } else {
            throw new IllegalArgumentException("Invalid user ID: " + userId);
        }
    } catch (Exception e) {
        throw new RuntimeException("Error occurred while saving the Note: " + e.getMessage(), e);
    }
}
    
    public List<Note> getAllNotes(){
        return noteRepo.findAll();
    }

    public Note findNoteById(Long id){
        return noteRepo.findById(id).orElse(null);
    }

    public Note updateNote(Long id, Note newNote) {
    Note existingNote = findNoteById(id);
    if (existingNote == null) {
        throw new IllegalArgumentException("Note with id " + id + " not found.");
    }
    if (newNote != null) {
        if (newNote.getTitle() != null) {
            existingNote.setTitle(newNote.getTitle());
        }
        if (newNote.getNoteText() != null) {
            existingNote.setNoteText(newNote.getNoteText());
        }
        existingNote.setUpdatedAt(java.time.LocalDateTime.now());
        return noteRepo.save(existingNote);
    }
    return existingNote;
}
    
    public void deleteNote(Long id){
        noteRepo.deleteById(id);
    }

    public List<Note> findByUserUserId(Long userId) {
        return noteRepo.findByUserUserId(userId);
    }
}
