<?php
// Versión con debugging - úsala solo para pruebas
// Copia todo el código de arriba y agrega estos logs:

function calcular_descuento_stock($nombre_producto, $cantidad_vendida, $reglas_conversion_palabras) {
    // Guardar logs en archivo en lugar de echo
    $log = " Calculando: $nombre_producto (Cantidad: $cantidad_vendida)\n";
    file_put_contents("debug_ventas.log", $log, FILE_APPEND);
    
    // ... resto del código igual
}