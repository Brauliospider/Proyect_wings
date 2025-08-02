CREATE TABLE historial_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    precio DECIMAL(10,2),
    cantidad INT,
    subtotal DECIMAL(10,2)
);
