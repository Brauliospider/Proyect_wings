<?php
// Iniciar el buffer de salida para evitar problemas con la descarga del PDF
ob_start();

// Configuración de conexión
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pinches_alitas";

// Crear conexión
$conexion = new mysqli($host, $user, $pass, $db);

// Verificar conexión
if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

// Leer datos JSON si vienen del módulo de ventas
$data = json_decode(file_get_contents("php://input"), true);

// ---------- MÓDULO VENTAS: REGISTRAR VENTA ----------
if (!empty($data['cart'])) {
    foreach ($data['cart'] as $item) {
        $nombre   = $conexion->real_escape_string($item['name']);
        $cantidad = intval($item['quantity']);
        $precio   = floatval($item['price']);

        $sql = "INSERT INTO modulo_ventas (nombre_producto, cantidad, precio)
                VALUES ('$nombre', $cantidad, $precio)";
        $conexion->query($sql);
    }

    echo json_encode(["success" => true, "message" => "Venta registrada correctamente"]);
    $conexion->close();
    exit;
}

// ---------- MÓDULO HISTORIAL DE VENTAS: GENERAR PDF (Nueva sección) ----------
// Esta sección se activa con el parámetro `accion=generar_historial_pdf`
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_GET['accion']) && $_GET['accion'] == 'generar_historial_pdf') {
    require_once 'autoload.php';
    use Dompdf\Dompdf;

    $ventasData = json_decode($_POST['ventas'] ?? '[]', true);

    $html = '<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: DejaVu Sans, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; }
        </style>
    </head>
    <body>';
    
    $html .= '<h1 style="text-align: center;">Reporte de Ventas Completadas</h1>';
    $html .= '<p style="text-align: center; color: #555;">Reporte generado el ' . date('d-m-Y H:i:s') . '</p>';
    $html .= '<hr>';
    $html .= '<table>';
    $html .= '<thead><tr><th>ID</th><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Total</th></tr></thead>';
    $html .= '<tbody>';

    $totalVendido = 0;

    if (!empty($ventasData)) {
        foreach ($ventasData as $venta) {
            $subtotal = $venta['cantidad'] * $venta['precio'];
            $totalVendido += $subtotal;
            $html .= '<tr>';
            $html .= '<td>' . htmlspecialchars($venta['id']) . '</td>';
            $html .= '<td>' . htmlspecialchars($venta['producto']) . '</td>';
            $html .= '<td>' . htmlspecialchars($venta['cantidad']) . '</td>';
            $html .= '<td>$' . number_format($venta['precio'], 2) . '</td>';
            $html .= '<td>$' . number_format($subtotal, 2) . '</td>';
            $html .= '</tr>';
        }
    }

    $html .= '</tbody>';
    $html .= '<tfoot>';
    $html .= '<tr>';
    $html .= '<td colspan="4" class="total">Total Vendido:</td>';
    $html .= '<td class="total">$' . number_format($totalVendido, 2) . '</td>';
    $html .= '</tr>';
    $html .= '</tfoot>';
    $html .= '</table>';
    $html .= '</body></html>';
    
    ob_end_clean();

    $dompdf = new Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    
    $dompdf->stream("reporte_ventas.pdf", ["Attachment" => 1]);

    $conexion->close();
    exit;
}

// ---------- MÓDULO INVENTARIO ----------
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_GET["accion"]) && $_GET["accion"] == "insertar_inventario") {
    $producto  = $_POST['producto']   ?? null;
    $categoria = $_POST['categoria']  ?? null;
    $stock     = $_POST['stock']      ?? null;
    $caducidad = $_POST['caducidad']  ?? null;
    $estado    = $_POST['estado']     ?? 'Activo';

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