package com.example.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.restaurant.entity.RestaurantTable;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Integer> {
}