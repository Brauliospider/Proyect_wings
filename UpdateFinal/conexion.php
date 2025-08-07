<?php
// Iniciar el buffer de salida para evitar problemas con la descarga del PDF
ob_start();

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

// ========== REGLAS DE CONVERSIÓN CON PALABRAS CLAVE ==========
$reglas_conversion_palabras = [
    "alitas" => [
        "tipo" => "alitas",
        "piezas_por_orden" => 10,
        "piezas_por_kilo" => 53,
        "kilos_por_unidad" => 2
    ],
    "papas" => [
        "tipo" => "papas",
        "ordenes_por_bolsa" => 6
    ],
    "boneless" => [
        "tipo" => "booles",
        "ordenes_por_unidad" => 7,
        "kilos_por_unidad" => 2
    ],
    "dedos" => [
        "tipo" => "dedos_queso",
        "ordenes_por_unidad" => 5,
        "piezas_por_unidad" => 45
    ],
    "queso" => [
        "tipo" => "dedos_queso",
        "ordenes_por_unidad" => 5,
        "piezas_por_unidad" => 45
    ],
    "aros" => [
        "tipo" => "aros_cebolla",
        "ordenes_por_unidad" => 7,
        "gramos_por_unidad" => 907
    ],
    "cebolla" => [
        "tipo" => "aros_cebolla",
        "ordenes_por_unidad" => 7,
        "gramos_por_unidad" => 907
    ],
    "nuggets" => [
        "tipo" => "nuggets",
        "ordenes_por_unidad" => 14
    ],
    "palomitas" => [
        "tipo" => "palomitas",
        "ordenes_por_paquete" => 4
    ]
];

// Función para detectar tipo de producto por palabras clave
function detectar_tipo_producto($nombre_producto) {
    global $reglas_conversion_palabras;
    
    $nombre_lower = strtolower($nombre_producto);
    
    foreach ($reglas_conversion_palabras as $palabra_clave => $regla) {
        if (strpos($nombre_lower, $palabra_clave) !== false) {
            return $regla;
        }
    }
    
    return null;
}

// Función para calcular descuento de stock
function calcular_descuento_stock($nombre_producto, $cantidad_vendida, $reglas_conversion_palabras) {
    $regla = detectar_tipo_producto($nombre_producto);
    
    if (!$regla) {
        return 0;
    }
    
    $descuento = 0;
    
    switch ($regla["tipo"]) {
        case "alitas":
            $piezas_por_orden = $regla["piezas_por_orden"];
            
            if (preg_match('/(\d+)\s*(piezas?|pzs?)/i', $nombre_producto, $matches)) {
                $piezas_por_orden = intval($matches[1]);
            }
            
            $piezas_vendidas = $cantidad_vendida * $piezas_por_orden;
            $kilos_necesarios = ($piezas_vendidas / $regla["piezas_por_kilo"]) * $regla["kilos_por_unidad"];
            $descuento = ceil($kilos_necesarios);
            break;
            
        case "papas":
            $descuento = ceil($cantidad_vendida / $regla["ordenes_por_bolsa"]);
            break;
            
        case "booles":
            $unidades_necesarias = ceil($cantidad_vendida / $regla["ordenes_por_unidad"]);
            $descuento = $unidades_necesarias * $regla["kilos_por_unidad"];
            break;
            
        case "dedos_queso":
            $unidades_necesarias = ceil($cantidad_vendida / $regla["ordenes_por_unidad"]);
            $descuento = $unidades_necesarias * $regla["piezas_por_unidad"];
            break;
            
        case "aros_cebolla":
            $unidades_necesarias = ceil($cantidad_vendida / $regla["ordenes_por_unidad"]);
            $descuento = $unidades_necesarias * $regla["gramos_por_unidad"];
            break;
            
        case "nuggets":
            $descuento = ceil($cantidad_vendida / $regla["ordenes_por_unidad"]);
            break;
            
        case "palomitas":
            $descuento = ceil($cantidad_vendida / $regla["ordenes_por_paquete"]);
            break;
    }
    
    return $descuento;
}

// Función para actualizar stock en inventario
function actualizar_stock_inventario($nombre_producto, $descuento, $conexion) {
    // Buscar por nombre exacto
    $stmt = $conexion->prepare("SELECT id, stock, producto FROM modulo_inventario WHERE producto = ? AND estado = 'Activo'");
    $stmt->bind_param("s", $nombre_producto);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    // Si no se encuentra por nombre exacto, buscar por palabras clave
    if ($resultado->num_rows == 0) {
        $stmt->close();
        
        $regla = detectar_tipo_producto($nombre_producto);
        if ($regla) {
            global $reglas_conversion_palabras;
            
            $palabra_clave = "";
            foreach ($reglas_conversion_palabras as $palabra => $regla_temp) {
                if ($regla_temp['tipo'] == $regla['tipo']) {
                    $palabra_clave = $palabra;
                    break;
                }
            }
            
            if ($palabra_clave) {
                $stmt = $conexion->prepare("SELECT id, stock, producto FROM modulo_inventario WHERE LOWER(producto) LIKE ? AND estado = 'Activo' LIMIT 1");
                $busqueda = "%" . $palabra_clave . "%";
                $stmt->bind_param("s", $busqueda);
                $stmt->execute();
                $resultado = $stmt->get_result();
            }
        }
    }
    
    if ($fila = $resultado->fetch_assoc()) {
        $stock_anterior = $fila['stock'];
        $nuevo_stock = max(0, $stock_anterior - $descuento);
        
        $stmt_update = $conexion->prepare("UPDATE modulo_inventario SET stock = ? WHERE id = ?");
        $stmt_update->bind_param("ii", $nuevo_stock, $fila['id']);
        
        if ($stmt_update->execute()) {
            $stmt_update->close();
            
            return [
                'actualizado' => true,
                'producto_encontrado' => $fila['producto'],
                'stock_anterior' => $stock_anterior,
                'stock_nuevo' => $nuevo_stock,
                'descuento_aplicado' => $descuento
            ];
        } else {
            $stmt_update->close();
        }
    }
    
    $stmt->close();
    return ['actualizado' => false, 'mensaje' => 'Producto no encontrado en inventario'];
}

// Leer datos JSON si vienen del módulo de ventas
$data = json_decode(file_get_contents("php://input"), true);

// ---------- MÓDULO VENTAS: REGISTRAR VENTA CON DESCUENTO AUTOMÁTICO ----------
if (!empty($data['cart'])) {
    $ventas_registradas = [];
    $actualizaciones_inventario = [];
    
    foreach ($data['cart'] as $item) {
        $nombre   = $conexion->real_escape_string($item['name']);
        $cantidad = intval($item['quantity']);
        $precio   = floatval($item['price']);
        
        // Registrar la venta
        $sql = "INSERT INTO modulo_ventas (nombre_producto, cantidad, precio) VALUES ('$nombre', $cantidad, $precio)";
        if ($conexion->query($sql)) {
            $ventas_registradas[] = $nombre;
            
            // Calcular descuento con palabras clave
            $descuento = calcular_descuento_stock($nombre, $cantidad, $reglas_conversion_palabras);
            
            if ($descuento > 0) {
                $resultado_actualizacion = actualizar_stock_inventario($nombre, $descuento, $conexion);
                $actualizaciones_inventario[] = [
                    'producto' => $nombre,
                    'cantidad_vendida' => $cantidad,
                    'descuento_calculado' => $descuento,
                    'resultado' => $resultado_actualizacion
                ];
            }
        }
    }
    
    // Respuesta LIMPIA en JSON
    echo json_encode([
        "success" => true, 
        "message" => "Venta registrada correctamente",
        "ventas_registradas" => $ventas_registradas,
        "actualizaciones_inventario" => $actualizaciones_inventario
    ]);
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

    if (!$producto || !$categoria || $stock === null || $caducidad === null || !$estado) {
        echo "Faltan campos requeridos";
        $conexion->close();
        exit;
    }

    $stmt = $conexion->prepare("INSERT INTO modulo_inventario (producto, categoria, stock, caducidad, estado) VALUES (?, ?, ?, ?, ?)");
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

// Obtener inventario actualizado
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["accion"]) && $_GET["accion"] == "obtener_inventario") {
    $sql = "SELECT id, producto, categoria, stock, caducidad, estado FROM modulo_inventario WHERE estado = 'Activo' ORDER BY producto";
    $resultado = $conexion->query($sql);
    
    $inventario = [];
    while ($fila = $resultado->fetch_assoc()) {
        $inventario[] = $fila;
    }
    
    echo json_encode($inventario);
    $conexion->close();
    exit;
}

// Cerrar conexión por defecto
$conexion->close();
?>