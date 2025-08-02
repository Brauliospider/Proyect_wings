// Cargar ventas desde localStorage
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];

// Mostrar ventas al cargar
actualizarListaVentas();

// Función para agregar una nueva venta
function agregarVenta(venta) {
    const fechaActual = new Date();
    ventas.push({
        id: ventas.length + 1,
        producto: venta.producto,
        cantidad: venta.cantidad,
        precio: venta.precio,
        estado: "pendiente",
        fecha: fechaActual.toLocaleDateString(),
        hora: fechaActual.toLocaleTimeString()
    });
    localStorage.setItem('ventas', JSON.stringify(ventas));
    actualizarListaVentas();
}

// Función para actualizar la lista de ventas
function actualizarListaVentas() {
    const container = document.getElementById('ventasContainer');
    container.innerHTML = ''; // Limpiar el contenedor
    let total = 0;

    ventas.forEach(venta => {
        container.innerHTML += generarItemVenta(venta);
        if (venta.estado === 'completado') {
            total += venta.precio * venta.cantidad;
        }
    });

    document.getElementById('totalVendido').textContent = `$${total.toFixed(2)}`;
}

// Función para cambiar el estado
function cambiarEstado(id) {
    const venta = ventas.find(v => v.id === id);
    if (venta) {
        venta.estado = venta.estado === "pendiente" ? "completado" : "pendiente";
        localStorage.setItem('ventas', JSON.stringify(ventas));
        actualizarListaVentas();
    }
}

// Función para finalizar ventas
function finalizar() {
    const ventasCompletadas = ventas.filter(v => v.estado === "completado");
    const total = ventasCompletadas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    const fechaHora = new Date().toLocaleString();

    let contenido = `Resumen de Ventas - ${fechaHora}\n\n`;
    contenido += "Producto\tCantidad\tPrecio\tEstado\tFecha\tHora\n";
    contenido += "-----------------------------------------------------\n";

    ventasCompletadas.forEach(venta => {
        contenido += `${venta.producto}\t${venta.cantidad}\t$${venta.precio.toFixed(2)}\t${venta.estado}\t${venta.fecha}\t${venta.hora}\n`;
    });

    contenido += `\nTotal Vendido: $${total.toFixed(2)}`;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resumen_Ventas_${fechaHora.replace(/[:]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    resetearVentas();
}

// HTML para mostrar cada venta
function generarItemVenta(venta) {
    return `
        <div class="venta-item bg-gray-900 rounded-lg p-4 transition-all">
            <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h3 class="font-medium text-lg">Venta #${venta.id}</h3>
                    <div class="flex flex-wrap gap-4 mt-2 text-sm">
                        <p><span class="text-gray-400">Producto:</span> ${venta.producto}</p>
                        <p><span class="text-gray-400">Cantidad:</span> ${venta.cantidad}</p>
                        <p><span class="text-gray-400">Precio:</span> $${venta.precio.toFixed(2)}</p>
                        <p><span class="text-gray-400">Fecha:</span> ${venta.fecha}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${venta.estado === 'pendiente' ? 'bg-yellow-600' : 'bg-green-600'}">
                        ${venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
                    </span>
                    <button onclick="cambiarEstado(${venta.id})" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-all">Cambiar Estado</button>
                </div>
            </div>
        </div>`;
}

// Resetear ventas
function resetearVentas() {
    ventas.length = 0;
    localStorage.removeItem('ventas');
    actualizarListaVentas();
}