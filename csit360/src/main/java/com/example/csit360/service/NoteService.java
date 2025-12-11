package com.example.csit360.service;

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

}
