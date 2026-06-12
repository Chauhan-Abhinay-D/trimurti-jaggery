package com.trimurti.jaggery.controller;

import com.trimurti.jaggery.dto.AuthRequest;
import com.trimurti.jaggery.dto.AuthResponse;
import com.trimurti.jaggery.dto.RegisterRequest;
import com.trimurti.jaggery.model.User;
import com.trimurti.jaggery.repository.UserRepository;
import com.trimurti.jaggery.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already registered.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_USER");
        
        String sessionId = java.util.UUID.randomUUID().toString();
        user.setActiveSessionId(sessionId);

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), sessionId);
        return ResponseEntity.ok(new AuthResponse(token, user.getName(), user.getRole(), user.getPhone(), user.getAddress(), user.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest request) {
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                String sessionId = java.util.UUID.randomUUID().toString();
                user.setActiveSessionId(sessionId);
                userRepository.save(user);
                
                String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), sessionId);
                return ResponseEntity.ok(new AuthResponse(token, user.getName(), user.getRole(), user.getPhone(), user.getAddress(), user.getId()));
            }
        }
        return ResponseEntity.status(401).body("Error: Invalid email or password");
    }
}
