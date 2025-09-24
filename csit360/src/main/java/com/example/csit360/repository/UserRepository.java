package com.example.csit360.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.csit360.entity.User;

@Repository
public interface  UserRepository extends JpaRepository<User, Long>  {
    Optional<User> findByUsernameAndPassword(String username, String password);
    
}
