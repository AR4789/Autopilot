package com.autopilot.backend.controller;

import com.autopilot.backend.model.User;
import com.autopilot.backend.repository.UserRepository;
import com.autopilot.backend.service.AuthService;
import com.autopilot.backend.service.TaskProcessorService;
import com.autopilot.backend.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.time.Duration;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api")
// @CrossOrigin(origins = "http://localhost:3000")
public class ConfigController {

    @Autowired
    private TaskProcessorService taskProcessorService;
    @Autowired
    private AuthService authService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;
    @Value("${google.client.id}")
    private String googleClientId;
    @Value("${spring.profiles.active:}")
    private String activeProfile;

    public boolean isProd() {
    return !"dev".equals(activeProfile);
}
    @PostMapping("/auth/run-config")
    public ResponseEntity<String> runConfig(@RequestBody Map<String, Object> configMap) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(configMap);
            Path filePath = Paths.get("config.json");
            Files.write(filePath, json.getBytes());
            String configPath = filePath.toAbsolutePath().toString();
            StringBuilder output = new StringBuilder();

            if (configMap.containsKey("basic")) {
                output.append("🚀 Running Basic Tasks...\n");
                String basicOutput = taskProcessorService.processTasks(configPath, "basic");
                output.append(basicOutput).append("✅ Basic tasks completed.\n");
            } else {
                output.append("🚀 Running Pre Tasks...\n");
                String preOutput = taskProcessorService.processTasks(configPath, "pre");
                output.append(preOutput).append("✅ Pre tasks completed.\n\n");

                output.append("🚀 Running Post Tasks...\n");
                String postOutput = taskProcessorService.processTasks(configPath, "post");
                output.append(postOutput).append("✅ Post tasks completed.\n");
            }

            return ResponseEntity.ok(output.toString());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Automation failed: " + e.getMessage());
        }
    }

    @PostMapping("/auth/upload-file")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {
        try {
            String suffix = type.equals("pem") ? ".pem" : ".sh";
            File localFile = File.createTempFile("upload_", suffix);
            file.transferTo(localFile);

            // Optional: Set permissions if PEM
            if (suffix.equals(".pem")) {
                Process chmod = Runtime.getRuntime().exec(new String[] { "chmod", "600", localFile.getAbsolutePath() });
                chmod.waitFor();
            }

            return ResponseEntity.ok(localFile.getAbsolutePath());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Failed to upload file: " + e.getMessage());
        }
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@RequestBody User user, HttpServletResponse response) {
        try {
            authService.register(user);

            // 🔐 Generate token
            String token = jwtUtil.generateToken(user.getEmail());

            // 🍪 Set JWT as HttpOnly cookie
            ResponseCookie cookie = ResponseCookie.from("token", token)
                    .httpOnly(true)
                    .secure(isProd()) // Use true in production (HTTPS)
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // 7 days
                    .sameSite("Lax")
                    .build();

            // 🌐 Send cookie + 200 response
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Collections.singletonMap("message", "Registered and logged in"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "Server error"));
        }
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletResponse response) {
        String token = authService.login(credentials.get("username"), credentials.get("password"));

        Cookie cookie = new Cookie("token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(isProd()); // Set to false if not using HTTPS in local dev
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        response.addCookie(cookie);

        return ResponseEntity.ok("Login successful");
    }

    @PostMapping("/auth/google")
    public ResponseEntity<?> handleGoogleAuthLogin(@RequestBody Map<String, String> body,
            HttpServletResponse response) {
        String idTokenString = body.get("idToken");

        if (idTokenString == null || idTokenString.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing idToken"));
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JacksonFactory.getDefaultInstance())
                    .setAudience(Collections
                            .singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid Google ID token"));
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            System.out.println("Emaill==== " + email + "  User  ==" + name);

            // 🔎 Check if user exists
            User user = userRepository.findByEmail(email);
            System.out.println("User before save ---" + user);

            boolean alreadyRegistered = true;

            if (user == null) {
                // 🧾 Register new user
                user = new User();
                user.setEmail(email);
                user.setUsername(email); // Or generate a unique one
                user.setName(name);
                user.setPassword(""); // Optional: No password for Google users
                user.setRole("USER"); // ✅ Add this!
                user.setSubscribed(false);
                userRepository.save(user);
                alreadyRegistered = false;
            }

            System.out.println("User after save ---" + user);

            // 🔐 Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail());

            // 🍪 Set token in HttpOnly cookie
            ResponseCookie cookie = ResponseCookie.from("token", token)
                    .httpOnly(true)
                    .secure(isProd()) // Set to false for local dev, true in prod
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of("alreadyRegistered", alreadyRegistered));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Google login error: " + e.getMessage()));
        }
    }

    @PostMapping("/auth/login/google")
    public ResponseEntity<?> handleGoogleAuthLogin(@RequestBody Map<String, String> body) {

        String idTokenString = body.get("idToken");

        if (idTokenString == null || idTokenString.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing idToken"));
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JacksonFactory.getDefaultInstance())
                    .setAudience(Collections
                            .singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();

                User existingUser = userRepository.findByEmail(email);
                if (existingUser == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                            "message", "User not registered. Please register first."));
                }

                String token = authService.generateToken(existingUser);

                ResponseCookie cookie = ResponseCookie.from("token", token)
                        .httpOnly(true) // Set to true in production
                        .secure(isProd())
                        .path("/")
                        .maxAge(Duration.ofDays(7))
                        .sameSite("None") // or "None" if cross-origin
                        .build();


                return ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, cookie.toString())
                        .body(Map.of(
                                "message", "Google login successful",
                                "token", token,
                                "email", existingUser.getEmail(),
                                "username", existingUser.getUsername()));
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid idToken"));
            }

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Google token verification failed",
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/auth/status")
    public ResponseEntity<?> checkAuthStatus(@CookieValue(value = "token", required = false) String token) {
        System.out.println("Status is called");
        System.out.println("Tokennnnnnnnnnnnnnnnnnn=============" + token);
        boolean test = jwtUtil.validateToken(token);
        System.out.println("Test Result" + test);
        if (token != null && jwtUtil.validateToken(token)) {
            return ResponseEntity.ok(Map.of("isLoggedIn", true));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("isLoggedIn", false));
        }
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(isProd()); // true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(0); // <- Invalidate
        response.addCookie(cookie);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

}
