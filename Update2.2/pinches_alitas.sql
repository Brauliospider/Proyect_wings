  CREATE DATABASE IF NOT EXISTS pinches_alitas;
  USE pinches_alitas;

  CREATE TABLE modulo_inventario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      producto VARCHAR(100) NOT NULL,
      categoria VARCHAR(50) NOT NULL,
      stock INT NOT NULL,
      caducidad DATE NOT NULL,
      estado VARCHAR(100) NOT NULL
      
  );

  CREATE TABLE Historial_ventas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_producto VARCHAR(100) NOT NULL,
      cantidad INT NOT NULL,
      precio DECIMAL(10, 2) NOT NULL
      ALTER TABLE modulo_ventas ADD fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP;
  );