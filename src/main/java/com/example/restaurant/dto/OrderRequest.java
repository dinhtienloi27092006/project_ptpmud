package com.example.restaurant.dto;

import java.util.List;

import lombok.Data;

@Data
public class OrderRequest {

    private Integer tableId;

    private List<OrderItemRequest> items;
}