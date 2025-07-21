CREATE DATABASE inventario_db;

USE inventario_db;

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    categoria VARCHAR(50),
    stock INT,
    stock_minimo INT,
    costo DOUBLE,
    precio DOUBLE,
    caducidad DATE,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);