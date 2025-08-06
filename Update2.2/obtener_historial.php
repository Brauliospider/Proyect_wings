<?php
// obtener_historial.php
header('Content-Type: application/json');

// Configuración DB
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pinches_alitas";

$conexion = new mysqli($host, $user, $pass, $db);

if ($conexion->connect_error) {
    echo json_encode(["error" => "Error de conexión: " . $conexion->connect_error]);
    exit;
}

$sql = "SELECT id, nombre_producto AS producto, cantidad, precio, fecha_registro 
        FROM modulo_ventas ORDER BY id DESC";
$result = $conexion->query($sql);

$historial = [];

while ($row = $result->fetch_assoc()) {
    $historial[] = [
        "id" => $row["id"],
        "producto" => $row["producto"],
        "cantidad" => (int)$row["cantidad"],
        "precio" => (float)$row["precio"],
        "fecha" => $row["fecha_registro"]
    ];
}

echo json_encode($historial);

$conexion->close();
?>