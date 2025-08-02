<?php
// Configuración de conexión
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pinches_alitas";

// Crear conexión
$conexion = new mysqli($host, $user, $pass, $db);

// Verificar conexión
if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

// Leer datos JSON si vienen del módulo de ventas
$data = json_decode(file_get_contents("php://input"), true);

// ---------- MÓDULO VENTAS ----------
if (!empty($data['cart'])) {
    foreach ($data['cart'] as $item) {
        $nombre   = $conexion->real_escape_string($item['name']);
        $cantidad = intval($item['quantity']);
        $precio   = floatval($item['price']);

        $sql = "INSERT INTO modulo_ventas (nombre_producto, cantidad, precio)
                VALUES ('$nombre', $cantidad, $precio)";
        $conexion->query($sql);
    }

    echo json_encode(["success" => true, "message" => "Venta registrada correctamente"]);
    $conexion->close();
    exit;
}

// ---------- MÓDULO INVENTARIO ----------
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_GET["accion"]) && $_GET["accion"] == "insertar_inventario") {
    $producto  = $_POST['producto']   ?? null;
    $categoria = $_POST['categoria']  ?? null;
    $stock     = $_POST['stock']      ?? null;
    $caducidad = $_POST['caducidad']  ?? null;
    $estado    = $_POST['estado']     ?? 'Activo';

    // --- OPCIONAL: Guardar en un archivo para depurar (debug_log.txt)
    file_put_contents("debug_log.txt", print_r($_POST, true));

    // Validación básica
    if (!$producto || !$categoria || $stock === null || $caducidad === null || !$estado) {
        echo "Faltan campos requeridos";
        $conexion->close();
        exit;
    }

    // Preparar consulta segura
    $stmt = $conexion->prepare("INSERT INTO modulo_inventario (producto, categoria, stock, caducidad, estado)
                                VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssiss", $producto, $categoria, $stock, $caducidad, $estado);

    if ($stmt->execute()) {
        echo "Producto insertado correctamente";
    } else {
        echo "Error al insertar producto: " . $stmt->error;
    }

    $stmt->close();
    $conexion->close();
    exit;
}

// Cerrar conexión por defecto si no hubo acción
$conexion->close();
?>
