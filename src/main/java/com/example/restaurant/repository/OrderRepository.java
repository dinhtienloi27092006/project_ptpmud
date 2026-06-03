package com.example.restaurant.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.restaurant.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    
    @Query("SELECT o FROM Order o WHERE o.table.id = :tableId AND o.status = 'PENDING'")
    Optional<Order> findPendingOrderByTableId(@Param("tableId") Integer tableId);
}