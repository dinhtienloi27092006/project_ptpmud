CREATE DATABASE restaurant_order_system;
USE restaurant_order_system;
CREATE TABLE food (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    price DOUBLE,
    image VARCHAR(255),
    category VARCHAR(100)
);
CREATE TABLE restaurant_table (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_number INT,
    qr_code VARCHAR(255)
);
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_id INT,
    total_price DOUBLE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES restaurant_table(id)
);
CREATE TABLE order_item (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    food_id INT,
    quantity INT,
    subtotal DOUBLE,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (food_id) REFERENCES food(id)
);
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE order_item;

TRUNCATE TABLE orders;

TRUNCATE TABLE food;

SET FOREIGN_KEY_CHECKS = 1;