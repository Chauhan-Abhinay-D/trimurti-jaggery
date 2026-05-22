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

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

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
}
