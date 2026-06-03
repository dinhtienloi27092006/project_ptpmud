package com.example.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.restaurant.entity.Food;

public interface FoodRepository extends JpaRepository<Food, Integer> {
}