<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = trim($_POST["id"]);
    $password = trim($_POST["password"]);

    if (empty($id) || empty($password)) {
        echo "<h3 style='color:red; text-align:center;'>Error: Todos los campos son obligatorios.</h3>";
        echo "<p style='text-align:center;'><a href='inicio.html'>Volver</a></p>";
        exit;
    }

    // Validación simple de ID y contraseña
    if ($id === "123456789" && $password === "312005") {
        header("Location: paguina-inicial.html");
        exit;
    } else {
        echo "<h3 style='color:red; text-align:center;'>ID o contraseña incorrectos.</h3>";
        echo "<p style='text-align:center;'><a href='inicio.html'>Intentar de nuevo</a></p>";
        exit;
    }
} else {
    header("Location: inicio.html");
    exit;
}
?>