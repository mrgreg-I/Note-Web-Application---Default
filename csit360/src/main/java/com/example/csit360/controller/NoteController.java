package com.example.csit360.controller;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.csit360.entity.Note;
import com.example.csit360.service.NoteService;




@RestController
@RequestMapping("/api/note")
public class NoteController {
    @Autowired
    private NoteService noteServ;
    
    @GetMapping("/get/all")
    public List<Note> getAllNotes () {
        return noteServ.getAllNotes();
    }
    @GetMapping("/get/{id}")
    public Note findNoteById(@PathVariable int id) {
        return noteServ.findNoteById(id);
    }
    @PostMapping("/post")
    public Note postNote(@RequestBody Note note) {
        return noteServ.postNote(note,note.getUser().getId());
    }
    @PutMapping("/put/{id}")
    public Note updateNote(@PathVariable int id, @RequestBody Note newNote) {
        return noteServ.updateNote(id, newNote);
    }
    @DeleteMapping("/delete/{id}")
    public void deleteNote(@PathVariable int id){
        noteServ.deleteNote(id);
    }
}
