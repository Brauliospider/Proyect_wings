<?php
// obtener_historial.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

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

// ✅ CONSULTA CORREGIDA - Sin fecha_registro si no existe el campo
$sql = "SELECT id, nombre_producto AS producto, cantidad, precio 
        FROM modulo_ventas ORDER BY id DESC";
$result = $conexion->query($sql);

if (!$result) {
    echo json_encode(["error" => "Error en consulta: " . $conexion->error]);
    exit;
}

$historial = [];
while ($row = $result->fetch_assoc()) {
    $historial[] = [
        "id" => (int)$row["id"],
        "producto" => $row["producto"],
        "cantidad" => (int)$row["cantidad"],
        "precio" => (float)$row["precio"],
        "fecha" => date('Y-m-d H:i:s'), // ✅ Fecha actual como fallback
        "estado" => "completado" // ✅ Estado por defecto
    ];
}

// ✅ DEBUG
error_log("Historial obtenido: " . count($historial) . " registros");
if (count($historial) > 0) {
    error_log("Primer registro: " . json_encode($historial[0]));
}

echo json_encode($historial);
$conexion->close();
?>