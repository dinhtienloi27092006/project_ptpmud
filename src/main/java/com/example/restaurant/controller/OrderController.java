package com.example.restaurant.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.restaurant.dto.OrderRequest;
import com.example.restaurant.dto.PaymentResponse;
import com.example.restaurant.entity.Order;
import com.example.restaurant.entity.OrderItem;
import com.example.restaurant.repository.OrderItemRepository;
import com.example.restaurant.repository.OrderRepository;
import com.example.restaurant.repository.PaymentHistoryRepository;
import com.example.restaurant.service.MomoService;
import com.example.restaurant.service.OrderService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin
public class OrderController {

    private final OrderService orderService;

    private final OrderRepository orderRepository;

    private final OrderItemRepository orderItemRepository;

    private final PaymentHistoryRepository paymentHistoryRepository;

    private final MomoService momoService;

    @PostMapping
    public Map<String, Object> createOrder(@RequestBody OrderRequest request) {
        Order order = orderService.createOrder(request);
        return Map.of(
                "message", "Đặt món thành công",
                "orderId", order.getId(),
                "status", order.getStatus(),
                "totalPrice", order.getTotalPrice());
    }

    @GetMapping
    public List<Order> getOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/tables/{tableId}/pending")
    public Order getPendingOrderByTable(@PathVariable Integer tableId) {
        return orderRepository.findPendingOrderByTableId(tableId).orElse(null);
    }

    @GetMapping("/{orderId}/payment")
    public PaymentResponse createPaymentQr(@PathVariable Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy order"));

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order không ở trạng thái PENDING");
        }

        return momoService.createPayment(order);
    }

    @PostMapping("/{orderId}/payment/notify")
    public String handlePaymentNotify(@PathVariable Integer orderId) {
        var order = orderService.confirmPayment(orderId, "MOMO");
        return "Thanh toán thành công bàn " + order.getTable().getTableNumber();
    }

    @PostMapping("/{orderId}/payment/cash")
    public String handleCashPayment(@PathVariable Integer orderId) {
        var order = orderService.confirmPayment(orderId, "CASH");
        return "Thanh toán tiền mặt bàn " + order.getTable().getTableNumber() + " thành công";
    }

    @PostMapping("/momo/notify")
    public String handleMomoNotify(@RequestBody Map<String, Object> payload) {
        String extraData = payload.getOrDefault("extraData", "").toString();
        Integer orderId = parseOrderIdFromExtraData(extraData);
        Integer resultCode = payload.containsKey("resultCode")
                ? Integer.valueOf(payload.get("resultCode").toString())
                : null;

        if (orderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy orderId trong thông báo");
        }

        if (resultCode != null && resultCode == 0) {
            var order = orderService.confirmPayment(orderId, "MOMO");
            return "Thanh toán MoMo đã được xác nhận cho bàn " + order.getTable().getTableNumber();
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thanh toán MoMo không thành công");
    }

    private Integer parseOrderIdFromExtraData(String extraData) {
        if (extraData == null || extraData.isEmpty()) {
            return null;
        }

        String[] parts = extraData.split("&");
        for (String part : parts) {
            if (part.startsWith("orderId=")) {
                try {
                    return Integer.valueOf(part.substring("orderId=".length()));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return null;
    }

    @GetMapping("/payment-history")
    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentHistory() {
        LocalDate today = LocalDate.now();
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to = from.plusDays(1);

        var history = paymentHistoryRepository.findByPaidAtBetween(from, to);
        double totalToday = history.stream()
                .mapToDouble(item -> item.getTotalPrice() != null ? item.getTotalPrice() : 0.0)
                .sum();

        return Map.of(
                "history", history,
                "totalToday", totalToday);
    }

    @PutMapping("/items/{itemId}/done")
    public OrderItem updateOrderItemDone(@PathVariable Integer itemId, @RequestBody Map<String, Boolean> body) {
        boolean done = body.getOrDefault("done", false);

        OrderItem item = orderItemRepository.findById(itemId).orElseThrow();
        item.setDone(done);

        return orderItemRepository.save(item);
    }

    @DeleteMapping("/items/{itemId}")
    public String deleteOrderItem(@PathVariable Integer itemId) {
        orderItemRepository.deleteById(itemId);
        return "Xóa món thành công";
    }

    @DeleteMapping("/{orderId}")
    public String deleteOrder(@PathVariable Integer orderId) {
        try {
            orderRepository.deleteById(orderId);
            return "Xóa bàn thành công";
        } catch (Exception e) {
            return "Lỗi xóa bàn: " + e.getMessage();
        }
    }
}
