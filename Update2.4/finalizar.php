<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = "localhost";
$user = "root";
$pass = "";
$db   = "pinches_alitas";

$conexion = new mysqli($host, $user, $pass, $db);

if ($conexion->connect_error) {
    echo json_encode(["error" => "Error de conexión: " . $conexion->connect_error]);
    exit;
}

// ✅ CONSULTA CORREGIDA - Misma estructura que obtener_historial.php
$query = "SELECT id, nombre_producto AS producto, cantidad, precio 
          FROM modulo_ventas ORDER BY id DESC";
$result = $conexion->query($query);

if (!$result) {
    echo json_encode(["error" => "Error en consulta SELECT: " . $conexion->error]);
    exit;
}

$ventas = [];
while ($row = $result->fetch_assoc()) {
    $ventas[] = [
        "id" => (int)$row["id"],
        "producto" => $row["producto"],
        "cantidad" => (int)$row["cantidad"],
        "precio" => (float)$row["precio"],
        "fecha" => date('Y-m-d H:i:s'),
        "estado" => "completado"
    ];
}

// Si hay ventas, borrar registros
if (count($ventas) > 0) {
    $deleteResult = $conexion->query("DELETE FROM modulo_ventas");
    if (!$deleteResult) {
        echo json_encode(["error" => "Error al borrar registros: " . $conexion->error]);
        exit;
    }
}

// ✅ DEBUG
error_log("Finalizando con " . count($ventas) . " ventas");

echo json_encode($ventas);
$conexion->close();
?>