package com.example.csit360.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.csit360.entity.Note;
import com.example.csit360.repository.NoteRepository;

@Service
public class NoteService {
    @Autowired
    private NoteRepository noteRepo;

    public NoteService(){
        super();
    }

    @Autowired
    public NoteService(NoteRepository noteRepo) {
        this.noteRepo = noteRepo;
    }

    public Note postNote(Note note) {
        try {
            return noteRepo.save(note);  
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
}
