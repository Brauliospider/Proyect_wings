<?php
$servidor = "localhost";
$usuario = "root";
$contraseña = "";
//agregar el nombre de la base de datos
$base_datos = "";

// Conectar a la base de datos
$conexion = mysqli_connect($servidor, $usuario, $contraseña, $base_datos);

// Verificar la conexión
if(isset($_POST['registro'])) {
  $nombre = $_POST['nombre'];
  $cantidad = $_POST['cantidad'];
  $precio = $_POST['precio'];

  // Asegurarse de que los campos no estén vacíos OJO CAMBIAR historial_ventas por el nombre de la tabla correcta
  $insertar = "INSERT INTO historial_ventas (nombre, cantidad, precio) VALUES ('$nombre', '$cantidad', '$precio', '')";

  // Ejecutar la consulta
  $ejecutar = mysqli_query($conexion, $insertar);
}

?>