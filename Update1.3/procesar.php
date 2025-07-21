<?php
session_start();

// Lista de productos
$productos = [
  1 => ['nombre' => 'Alitas 10 piezas', 'precio' => 105],
  2 => ['nombre' => 'Alitas 15 piezas', 'precio' => 160],
  3 => ['nombre' => 'Alitas 20 piezas', 'precio' => 210]
];

// Inicializar carrito
if (!isset($_SESSION['carrito'])) {
  $_SESSION['carrito'] = [];
}

$datos = json_decode(file_get_contents("php://input"), true);
$accion = $datos['accion'] ?? null;
$id = $datos['id'] ?? null;

if ($accion === 'agregar' && isset($productos[$id])) {
  if (!isset($_SESSION['carrito'][$id])) {
    $_SESSION['carrito'][$id] = ['cantidad' => 0];
  }
  $_SESSION['carrito'][$id]['cantidad'] += 1;
}

if ($accion === 'finalizar') {
  $_SESSION['carrito'] = [];
}

// Preparar respuesta
$response = ['items' => [], 'total' => 0];

foreach ($_SESSION['carrito'] as $id => $item) {
  $nombre = $productos[$id]['nombre'];
  $precio = $productos[$id]['precio'];
  $cantidad = $item['cantidad'];
  $subtotal = $precio * $cantidad;

  $response['items'][] = [
    'nombre' => $nombre,
    'cantidad' => $cantidad,
    'subtotal' => $subtotal
  ];

  $response['total'] += $subtotal;
}

$response['total'] = number_format($response['total'], 2);

header('Content-Type: application/json');
echo json_encode($response);