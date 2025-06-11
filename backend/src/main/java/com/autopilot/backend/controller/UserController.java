package com.autopilot.backend.controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.autopilot.backend.model.User;
import com.autopilot.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

@GetMapping("/me")
public ResponseEntity<?> getCurrentUser(Principal principal) {
    if (principal == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
    }

    User user = userRepository.findByEmail(principal.getName());
    if (user == null)
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");

    Map<String, Object> response = new HashMap<>();
    response.put("name", user.getName());
    response.put("username", user.getUsername());
    response.put("email", user.getEmail());
    response.put("phone", user.getPhone()); // can be null

    return ResponseEntity.ok(response);
}


    @PutMapping("/update")
    public ResponseEntity<?> updateUser(@RequestBody Map<String, String> updates, Principal principal) {
        User user = userRepository.findByEmail(principal.getName());
        if (user == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User  not found");
        if (updates.containsKey("name"))
            user.setName(updates.get("name"));
        if (updates.containsKey("phone"))
            user.setPhone(updates.get("phone"));
        if (updates.containsKey("currentPassword")) {
            String currentPassword = updates.get("currentPassword");
            String newPassword = updates.get("newPassword");
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Incorrect current password");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }
        userRepository.save(user);
        return ResponseEntity.ok("User  updated successfully");
    }
}
