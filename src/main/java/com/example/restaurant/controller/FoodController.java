package com.example.restaurant.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.restaurant.entity.Food;
import com.example.restaurant.repository.FoodRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
@CrossOrigin
public class FoodController {

    private final FoodRepository foodRepository;

    @GetMapping
    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    @PostMapping
    public Food addFood(@RequestBody FoodCreateRequest request) {
        Food food = new Food();
        food.setName(request.getName());
        food.setPrice(request.getPrice());
        food.setImage(request.getImage());
        food.setCategory(request.getCategory());
        return foodRepository.save(food);
    }

    @PutMapping("/{id}")
    public Food updateFood(@PathVariable Integer id, @RequestBody FoodCreateRequest request) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy món ăn"));
        food.setName(request.getName());
        food.setPrice(request.getPrice());
        food.setImage(request.getImage());
        food.setCategory(request.getCategory());
        return foodRepository.save(food);
    }

    @DeleteMapping("/{id}")
    public void deleteFood(@PathVariable Integer id) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy món ăn"));
        foodRepository.delete(food);
    }

    public static class FoodCreateRequest {
        private String name;
        private double price;
        private String image;
        private String category;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public double getPrice() {
            return price;
        }

        public void setPrice(double price) {
            this.price = price;
        }

        public String getImage() {
            return image;
        }

        public void setImage(String image) {
            this.image = image;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }
    }
}