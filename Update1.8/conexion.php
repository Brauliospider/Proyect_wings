<?php
// Configuración de conexión
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pinches_alitas";

// Crear conexión
$conn = new mysqli($host, $user, $pass, $db);

// Verificar conexión
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

// Leer datos del carrito enviados por JavaScript (JSON)
$data = json_decode(file_get_contents("php://input"), true);

//Conexion a BD para el modulo de ventas
// Verificar si se recibieron datos del carrito
if (!empty($data['cart'])) {
    foreach ($data['cart'] as $item) {
        $nombre   = $conn->real_escape_string($item['name']);
        $cantidad = intval($item['quantity']);
        $precio   = floatval($item['price']);

        $sql = "INSERT INTO modulo_ventas (nombre_producto, cantidad, precio)
                VALUES ('$nombre', $cantidad, $precio)";
        $conn->query($sql);
    }

    echo json_encode(["success" => true, "message" => "Venta registrada correctamente"]);
} else {
    echo json_encode(["success" => false, "message" => "Carrito vacío o no recibido"]);
}

$conn->close();

//Conexion a BD para el modulo de inventario

?>