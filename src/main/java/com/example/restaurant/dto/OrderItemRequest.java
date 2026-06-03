package com.example.restaurant.dto;

import lombok.Data;

@Data
public class OrderItemRequest {

    private Integer foodId;

    private Integer quantity;
}