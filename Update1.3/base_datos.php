<?php
header('Content-Type: application/json');
$conexion = new mysqli("localhost", "root", "", "inventario");

if ($conexion->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión"]);
    exit;
}

$accion = $_GET['accion'] ?? '';

switch ($accion) {
    case 'listar':
        $result = $conexion->query("SELECT * FROM productos");
        $productos = [];
        while ($row = $result->fetch_assoc()) {
            $productos[] = $row;
        }
        echo json_encode($productos);
        break;

    case 'agregar':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conexion->prepare("INSERT INTO productos (nombre, categoria, stock, stock_minimo, costo, precio, caducidad, fecha_agregado) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("ssiidds", $data['nombre'], $data['categoria'], $data['stock'], $data['stock_minimo'], $data['costo'], $data['precio'], $data['caducidad']);
        $stmt->execute();
        echo json_encode(["mensaje" => "Producto agregado"]);
        break;

    case 'editar':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conexion->prepare("UPDATE productos SET nombre=?, categoria=?, stock=?, stock_minimo=?, costo=?, precio=?, caducidad=? WHERE id=?");
        $stmt->bind_param("ssiiddsi", $data['nombre'], $data['categoria'], $data['stock'], $data['stock_minimo'], $data['costo'], $data['precio'], $data['caducidad'], $data['id']);
        $stmt->execute();
        echo json_encode(["mensaje" => "Producto actualizado"]);
        break;

    case 'eliminar':
        $id = $_GET['id'] ?? 0;
        $conexion->query("DELETE FROM productos WHERE id = " . intval($id));
        echo json_encode(["mensaje" => "Producto eliminado"]);
        break;

    default:
        echo json_encode(["error" => "Acción no válida"]);
        break;
}

$conexion->close();
?>
