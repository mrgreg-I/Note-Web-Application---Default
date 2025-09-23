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

    public Note postNote(Note note) {
        return noteRepo.save(note);   
    }
    
    public List<Note> getAllNotes(){
        return noteRepo.findAll();
    }

    public Note findNoteById(int id){
        return noteRepo.findById(id);
    }

    public Note updateNote(int id,Note newNote){
        Note existingNote=findNoteById(id);
        if(newNote!=null){
            if(newNote.getTitle()!=null){
                existingNote.setTitle(newNote.getTitle());
            }
            if(newNote.getNoteText()!=null){
                existingNote.setNoteText(newNote.getNoteText());
            }
            if(newNote.getCreatedAt()!=null){
                existingNote.setCreatedAt(newNote.getCreatedAt());
            }
            if(newNote.getUpdatedAt()!=null){
                existingNote.setUpdatedAt(newNote.getUpdatedAt());
            }
            return noteRepo.save(existingNote);
        }
        return null;
    }
    
    public void deleteNote(int id){
        noteRepo.deleteById(id);
    }
}
