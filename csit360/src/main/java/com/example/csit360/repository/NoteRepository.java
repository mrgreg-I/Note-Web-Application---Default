package com.example.csit360.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.csit360.entity.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long>{
    List<Note> findByStatus(String status);
    List<Note> findNotesByWalletAddress(String wallet);
}
