package com.example.csit360.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.csit360.entity.Note;


@Repository
public interface NoteRepository extends JpaRepository<Note, Integer>{
    public Note findById(int noteId);
}
