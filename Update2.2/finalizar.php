<?php
header('Content-Type: application/json');

$host = "localhost";
$user = "root";
$pass = "";
$db   = "pinches_alitas";

$conexion = new mysqli($host, $user, $pass, $db);

if ($conexion->connect_error) {
    // Aquí damos más detalle en error para debug (no en producción)
    echo json_encode(["error" => "Error de conexión: " . $conexion->connect_error]);
    exit;
}

// Consulta para obtener todas las ventas
$query = "SELECT id, producto, cantidad, precio, estado, fecha FROM modulo_ventas";
$result = $conexion->query($query);

if (!$result) {
    echo json_encode(["error" => "Error en consulta SELECT: " . $conexion->error]);
    exit;
}

$ventas = [];
while ($row = $result->fetch_assoc()) {
    $ventas[] = $row;
}

// Si hay ventas, borrar registros
if (count($ventas) > 0) {
    $deleteResult = $conexion->query("DELETE FROM modulo_ventas");

    if (!$deleteResult) {
        echo json_encode(["error" => "Error al borrar registros: " . $conexion->error]);
        exit;
    }
}

// Enviar datos de vuelta
echo json_encode($ventas);

$conexion->close();
?>