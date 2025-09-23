package com.example.csit360.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.csit360.entity.User;
import com.example.csit360.service.UserService;


@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins= "http://localhost:3000")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome to the User API!";
    }

    // Create a new user
    @PostMapping("/create")
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }

    @PostMapping("/postUser")
    public User postUser(@RequestBody User user) {
    
        return userService.createUser(user);
    }

    // Read all users
    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    //Read user by ID
    @GetMapping("/read/{id}")
    public User getUserById(@PathVariable Long id) {
         System.out.println("Attempting to fetch user with ID: " + id);
    return userService.getUserById(id);
    }

    // Update user details
    @PutMapping("/update")
    public User updateUserDetails(@RequestParam Long id, @RequestBody User newUserDetails) {
        return userService.updateUserDetails(id, newUserDetails);
    }

    @PutMapping("/putUser/{userId}")
    public User putUser(@PathVariable Long userId, @RequestBody User newUserRecord) {
        return userService.putUserRecord(userId, newUserRecord);
    }

    // Delete user by ID
    @DeleteMapping("/delete/{id}")
    public String deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id);
    }


    //LOGIN FUNCTIONALITY
    @PostMapping("/login")
    public User login(@RequestParam String email, @RequestParam String password) {
    try {
        return userService.loginUser(email, password);
    } catch (RuntimeException e) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
    }
    }

}
