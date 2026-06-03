package com.example.restaurant.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.restaurant.dto.OrderItemRequest;
import com.example.restaurant.dto.OrderRequest;
import com.example.restaurant.entity.Food;
import com.example.restaurant.entity.Order;
import com.example.restaurant.entity.OrderItem;
import com.example.restaurant.entity.RestaurantTable;
import com.example.restaurant.repository.FoodRepository;
import com.example.restaurant.repository.OrderRepository;
import com.example.restaurant.repository.RestaurantTableRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final FoodRepository foodRepository;
    private final RestaurantTableRepository tableRepository;

    @Transactional
    public Order createOrder(OrderRequest request) {

        RestaurantTable table = tableRepository
                .findById(request.getTableId())
                .orElseGet(() -> {
                    RestaurantTable newTable = new RestaurantTable();
                    newTable.setTableNumber(request.getTableId());
                    return tableRepository.save(newTable);
                });

        // Kiểm tra xem bàn này đã có Order PENDING chưa
        Order order = orderRepository.findPendingOrderByTableId(request.getTableId())
                .orElseGet(() -> {
                    Order newOrder = new Order();
                    newOrder.setTable(table);
                    newOrder.setStatus("PENDING");
                    newOrder.setTotalPrice(0.0);
                    newOrder.setItems(new ArrayList<>());
                    return newOrder;
                });

        double addedTotal = 0;
        List<OrderItem> allItems = new ArrayList<>(order.getItems());

        for (OrderItemRequest itemRequest : request.getItems()) {

            Food food = foodRepository
                    .findById(itemRequest.getFoodId())
                    .orElseThrow();

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setFood(food);
            orderItem.setQuantity(itemRequest.getQuantity());

            double subtotal = food.getPrice() * itemRequest.getQuantity();
            orderItem.setSubtotal(subtotal);

            addedTotal += subtotal;

            allItems.add(orderItem);
        }

        // Cập nhật tổng giá
        Double currentTotal = order.getTotalPrice();
        order.setTotalPrice((currentTotal != null ? currentTotal : 0.0) + addedTotal);
        order.setItems(allItems);

        return orderRepository.save(order);
    }

    @Transactional
    public Order confirmPayment(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy order"));

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException("Order không ở trạng thái PENDING");
        }

        orderRepository.delete(order);
        return order;
    }
}