package com.example.csit360.service;

import java.util.List;
import java.util.NoSuchElementException;

import javax.naming.NameNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.csit360.entity.User;
import com.example.csit360.repository.UserRepository;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;

    public UserService() {
        super();
    }

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
       
    }

    // Create a new user
    public User createUser(User user) {
        return userRepository.save(user);
    }


    // Read all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }


    // Update user details
    @SuppressWarnings("finally")
    public User updateUserDetails(Long id, User newUserDetails) {
        User user = new User();

        try{
           user = userRepository.findById(id)
            .orElseThrow(() -> new NameNotFoundException("User " + id + " not found."));

            user.setUsername(newUserDetails.getUsername());
            user.setPassword(newUserDetails.getPassword());
        }
        catch(NoSuchElementException nex){
            throw new NameNotFoundException("User "+ id +" not found.");
        } finally{
            return userRepository.save(user);
        }
    }

    @SuppressWarnings("finally")
    public User putUserRecord(Long id, User newUserRecord) {
        User user = new User();

        try {
           user = userRepository.findById(id)
            .orElseThrow(() -> new NameNotFoundException("User " + id + " not found."));
            user.setUsername(newUserRecord.getUsername());
            user.setPassword(newUserRecord.getPassword());

        }catch(NoSuchElementException nex){
            throw new NameNotFoundException("User " + id + " not found.");
        }finally {
            return userRepository.save(user);

        }
    }

    // Delete a user
    public String deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return "User record successfully deleted.";
        } else {
            return "User with ID " + id + " not found!";
        }
    }

    // Read to-do list by ID
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User with ID " + id + " not found."));
    }

    //LOGIN
    public User loginUser(String username, String password) {
        return userRepository.findByUsernameAndPassword(username, password)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
    }

}
