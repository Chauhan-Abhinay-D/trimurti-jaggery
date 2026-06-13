package com.trimurti.jaggery.controller;

import com.trimurti.jaggery.model.Order;
import com.trimurti.jaggery.model.OrderItem;
import com.trimurti.jaggery.model.Product;
import com.trimurti.jaggery.model.User;
import com.trimurti.jaggery.repository.OrderRepository;
import com.trimurti.jaggery.repository.ProductRepository;
import com.trimurti.jaggery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import com.razorpay.RazorpayClient;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RazorpayClient razorpayClient;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @PostMapping
    public Order createOrder(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        User user = userRepository.findById(userId).orElseThrow();

        Order order = new Order();
        order.setUser(user);
        order.setCustomerName(user.getName());
        order.setPhoneNumber(user.getPhone());
        order.setShippingAddress(user.getAddress());
        order.setTotalAmount(new BigDecimal(payload.get("totalAmount").toString()));
        order.setStatus("PAID"); // Simulate successful payment for now
        
        // GENERATE UNIQUE TRACKING ID (Format: TRM-240414-XXXX)
        String datePart = java.time.format.DateTimeFormatter.ofPattern("yyMMdd").format(java.time.LocalDateTime.now());
        String randomPart = java.util.UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        order.setOrderTrackingId("TRM-" + datePart + "-" + randomPart);

        List<Map<String, Object>> itemsList = (List<Map<String, Object>>) payload.get("items");
        List<OrderItem> orderItems = new ArrayList<>();

        for (Map<String, Object> itemData : itemsList) {
            Long productId = Long.valueOf(itemData.get("id").toString());
            Product product = productRepository.findById(productId).orElseThrow();
            Integer requestedQty = (Integer) itemData.get("qty");

            // CHECK STOCK AVAILABILITY
            if (product.getStockQuantity() < requestedQty) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() + 
                                         ". Available: " + product.getStockQuantity());
            }

            // DEDUCT STOCK
            product.setStockQuantity(product.getStockQuantity() - requestedQty);
            productRepository.save(product);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(requestedQty);
            item.setPriceAtPurchase(new BigDecimal(itemData.get("price").toString()));
            orderItems.add(item);
        }

        order.setItems(orderItems);
        return orderRepository.save(order);
    }

    @GetMapping("/admin")
    public List<Order> getAllOrdersForAdmin() {
        List<Order> orders = orderRepository.findAll();
        System.out.println("Admin fetching orders, total found: " + orders.size());
        return orders.stream()
                .sorted(java.util.Comparator.comparing(Order::getOrderDate, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                .toList();
    }

    @GetMapping("/user/{userId}")
    public List<Order> getUserOrders(@PathVariable Long userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        System.out.println("User " + userId + " fetching orders, found: " + orders.size());
        return orders.stream()
                .sorted(java.util.Comparator.comparing(Order::getOrderDate, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                .toList();
    }

    @PatchMapping("/{id}/status")
    public Order updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setStatus(payload.get("status"));
        return orderRepository.save(order);
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        orderRepository.deleteById(id);
    }

    @PostMapping("/razorpay/create")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody Map<String, Object> payload) {
        try {
            double amountInInr = Double.parseDouble(payload.get("amount").toString());
            int amountInPaise = (int) Math.round(amountInInr * 100);

            org.json.JSONObject orderRequest = new org.json.JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

            com.razorpay.Order order = razorpayClient.orders.create(orderRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("razorpayOrderId", order.get("id"));
            response.put("amount", amountInPaise);
            response.put("currency", "INR");
            response.put("keyId", razorpayKeyId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create Razorpay Order: " + e.getMessage());
        }
    }

    @PostMapping("/razorpay/verify")
    public ResponseEntity<?> verifyRazorpayPayment(@RequestBody Map<String, Object> payload) {
        try {
            String paymentId = payload.get("razorpay_payment_id").toString();
            String orderId = payload.get("razorpay_order_id").toString();
            String signature = payload.get("razorpay_signature").toString();

            org.json.JSONObject options = new org.json.JSONObject();
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_signature", signature);

            boolean isValid = com.razorpay.Utils.verifyPaymentSignature(options, razorpayKeySecret);

            if (!isValid) {
                return ResponseEntity.badRequest().body("Signature verification failed.");
            }

            Map<String, Object> orderData = (Map<String, Object>) payload.get("orderData");
            
            Long userId = Long.valueOf(orderData.get("userId").toString());
            User user = userRepository.findById(userId).orElseThrow();

            Order order = new Order();
            order.setUser(user);
            order.setCustomerName(user.getName());
            order.setPhoneNumber(user.getPhone());
            order.setShippingAddress(user.getAddress());
            order.setTotalAmount(new BigDecimal(orderData.get("totalAmount").toString()));
            order.setStatus("PAID");
            
            String datePart = java.time.format.DateTimeFormatter.ofPattern("yyMMdd").format(java.time.LocalDateTime.now());
            String randomPart = java.util.UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            order.setOrderTrackingId("TRM-" + datePart + "-" + randomPart);

            List<Map<String, Object>> itemsList = (List<Map<String, Object>>) orderData.get("items");
            List<OrderItem> orderItems = new ArrayList<>();

            for (Map<String, Object> itemData : itemsList) {
                Long productId = Long.valueOf(itemData.get("id").toString());
                Product product = productRepository.findById(productId).orElseThrow();
                Integer requestedQty = (Integer) itemData.get("qty");

                if (product.getStockQuantity() < requestedQty) {
                    throw new RuntimeException("Insufficient stock for product: " + product.getName() + 
                                             ". Available: " + product.getStockQuantity());
                }

                product.setStockQuantity(product.getStockQuantity() - requestedQty);
                productRepository.save(product);

                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(requestedQty);
                item.setPriceAtPurchase(new BigDecimal(itemData.get("price").toString()));
                orderItems.add(item);
            }

            order.setItems(orderItems);
            Order savedOrder = orderRepository.save(order);
            return ResponseEntity.ok(savedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Payment verification/Order saving failed: " + e.getMessage());
        }
    }
}
