package com.trimurti.jaggery.controller;

import com.trimurti.jaggery.model.Order;
import com.trimurti.jaggery.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private com.trimurti.jaggery.repository.UserRepository userRepository;

    @Autowired
    private com.trimurti.jaggery.repository.ProductRepository productRepository;

    @GetMapping("/metrics")
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        List<Order> allOrders = orderRepository.findAll();
        
        // Lifetime Revenue (with null safety)
        java.math.BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o != null && !"CANCELLED".equals(o.getStatus()) && o.getTotalAmount() != null)
                .map(Order::getTotalAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Today's Revenue (with null safety)
        LocalDate today = LocalDate.now();
        java.math.BigDecimal todayRevenue = allOrders.stream()
                .filter(o -> o != null && !"CANCELLED".equals(o.getStatus()) && o.getTotalAmount() != null && o.getOrderDate() != null)
                .filter(o -> o.getOrderDate().toLocalDate().isEqual(today))
                .map(Order::getTotalAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Recent Orders
        List<Order> recentOrders = allOrders.stream()
                .filter(o -> o != null && o.getOrderDate() != null)
                .sorted(java.util.Comparator.comparing(Order::getOrderDate).reversed())
                .limit(5)
                .collect(Collectors.toList());

        // Low Stock (Threshold: 10, with null safety)
        List<com.trimurti.jaggery.model.Product> products = productRepository.findAll();
        List<com.trimurti.jaggery.model.Product> lowStock = products.stream()
                .filter(p -> p != null && p.getStockQuantity() != null && p.getStockQuantity() < 10)
                .collect(Collectors.toList());

        metrics.put("totalOrders", (long) allOrders.size());
        metrics.put("activeCoupons", 0);
        metrics.put("revenue", totalRevenue);
        metrics.put("todayRevenue", todayRevenue);
        metrics.put("userCount", userRepository.count());
        metrics.put("lowStockCount", (long) lowStock.size());
        metrics.put("lowStockProducts", lowStock);
        metrics.put("recentOrders", recentOrders);
        
        return metrics;
    }

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/users")
    public List<com.trimurti.jaggery.model.User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping("/upload")
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String uploadDir = "uploads/";
        try {
            Files.createDirectories(Paths.get(uploadDir));
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + filename);
            Files.write(filePath, file.getBytes());
            
            String scheme = request.getScheme();
            String serverName = request.getServerName();
            int serverPort = request.getServerPort();
            
            String baseUrl = scheme + "://" + serverName;
            if ((scheme.equals("http") && serverPort != 80) || (scheme.equals("https") && serverPort != 443)) {
                baseUrl += ":" + serverPort;
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", baseUrl + "/uploads/" + filename);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }
    @PutMapping("/users/{id}")
    public com.trimurti.jaggery.model.User updateUser(@PathVariable Long id, @RequestBody com.trimurti.jaggery.model.User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setName(userDetails.getName());
            user.setPhone(userDetails.getPhone());
            user.setAddress(userDetails.getAddress());
            if (userDetails.getRole() != null) {
                user.setRole(userDetails.getRole());
            }
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }

    // --- STAFF MANAGEMENT (SUPER ADMIN ONLY) ---

    @GetMapping("/staff")
    public List<com.trimurti.jaggery.model.User> getAllStaff() {
        return userRepository.findAll().stream()
                .filter(u -> "ROLE_ADMIN".equals(u.getRole()) || "ROLE_SUPER_ADMIN".equals(u.getRole()))
                .toList();
    }

    @PostMapping("/staff")
    public com.trimurti.jaggery.model.User createStaff(@RequestBody com.trimurti.jaggery.dto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use.");
        }
        com.trimurti.jaggery.model.User staff = new com.trimurti.jaggery.model.User();
        staff.setName(request.getName());
        staff.setEmail(request.getEmail());
        staff.setPhone(request.getPhone());
        staff.setPassword(passwordEncoder.encode(request.getPassword()));
        staff.setRole("ROLE_ADMIN"); // Default new staff to basic Admin
        return userRepository.save(staff);
    }

    // BOOTSTRAP: Promote specific user to Super Admin
    @PostMapping("/promote-initial")
    public void promoteInitialAdmin(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setRole("ROLE_SUPER_ADMIN");
            userRepository.save(user);
        });
    }

    @PutMapping("/users/{id}/reset-password")
    public com.trimurti.jaggery.model.User resetPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newPassword = payload.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new RuntimeException("Password cannot be empty.");
        }
        return userRepository.findById(id).map(user -> {
            user.setPassword(passwordEncoder.encode(newPassword));
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }
}
