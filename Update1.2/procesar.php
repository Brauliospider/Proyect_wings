<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $producto = trim($_POST['producto']);
    $cantidad = trim($_POST['cantidad']);
    $precio = trim($_POST['precio']);

    if (empty($producto) || empty($cantidad) || empty($precio)) {
        echo "Todos los campos son obligatorios.";
        exit;
    }

    // En el futuro aquí puedes conectar a la base de datos
    // y guardar la venta

    echo "Venta registrada correctamente: <br>";
    echo "Producto: $producto <br>";
    echo "Cantidad: $cantidad <br>";
    echo "Precio unitario: $precio <br>";
} else {
    echo "Acceso no permitido.";
}
?>
