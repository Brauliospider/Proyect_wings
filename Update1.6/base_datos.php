<?php
$servidor = "localhost";
$usuario = "root";
$contraseña = "";
//agregar el nombre de la base de datos
$base_datos = "";

// Conectar a la base de datos
$conexionBD = mysqli_connect($servidor, $usuario, $contraseña, $base_datos);

// Verificar la conexión
if(isset($_POST['registro'])) {
  $name = $_POST['Nombre del producto'];
  $category = $_POST['categoria'];
  $stock = $_POST['stock'];
  $minStock = $_POST['stock minimo'];
  $Cost = $_POST['costo unitario'];
  $price = $_POST['precio de venta'];
  $expiry = $_POST['fecha de caducidad'];

  // Asegurarse de que los campos no estén vacíos OJO CAMBIAR INVENTARIO por el nombre de la tabla correcta
  $insertarBD = "INSERT INTO inventario (Nombre_del_producto, categoria, stock, stock_minimo, costo_unitario, precio_de_venta fecha_de_caducidad) VALUES ('', '$name', '$category', '$stock', '$minStock', '$Cost', '$price', '$expiry')";

  // Ejecutar la consulta
  $ejecutar = mysqli_query($conexionBD, $insertarBD);
}

?>