// Cargar ventas e historial desde localStorage
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
let historialVentas = JSON.parse(localStorage.getItem('historialVentas')) || [];

// Mostrar ventas al cargar
document.addEventListener('DOMContentLoaded', () => {
  actualizarListaVentas();
  cargarHistorialDesdeBD();
});

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

// Actualizar lista de ventas locales
function actualizarListaVentas() {
  const container = document.getElementById('ventasContainer');
  container.innerHTML = '';
  let total = 0;

  ventas.forEach((venta) => {
    container.innerHTML += generarItemVenta(venta, true);
    if (venta.estado === 'completado') total += venta.precio * venta.cantidad;
  });

  document.getElementById('totalVendido').textContent = `$${total.toFixed(2)}`;
}

// Cambiar estado de venta local
function cambiarEstado(id) {
  const venta = ventas.find((v) => v.id === id);
  if (venta) {
    venta.estado = venta.estado === 'pendiente' ? 'completado' : 'pendiente';
    localStorage.setItem('ventas', JSON.stringify(ventas));
    actualizarListaVentas();
  }
}

// Función para finalizar ventas y generar PDF
function finalizar() {
  const ventasCompletadas = ventas.filter(v => v.estado === "completado");

  const fechaHora = new Date().toLocaleString();
  const nombreArchivo = `Resumen_Ventas_${fechaHora.replace(/[:]/g, '-')}.pdf`;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(`Resumen de Ventas - ${fechaHora}`, 10, 10);
  doc.setFontSize(10);

  if (ventasCompletadas.length === 0) {
    doc.text("No hay ventas completadas para mostrar.", 10, 20);
  } else {
    let y = 20;
    doc.text("Producto\tCant.\tPrecio\tEstado\tFecha\tHora", 10, y);
    y += 6;
    doc.line(10, y, 200, y);
    y += 6;

    let total = 0;
    ventasCompletadas.forEach(venta => {
      const linea = `${venta.producto}\t${venta.cantidad}\t$${venta.precio.toFixed(2)}\t${venta.estado}\t${venta.fecha}\t${venta.hora}`;
      doc.text(linea, 10, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      total += venta.precio * venta.cantidad;
    });

    y += 10;
    doc.setFontSize(12);
    doc.text(`Total Vendido: $${total.toFixed(2)}`, 10, y);
  }

  doc.save(nombreArchivo);
  resetearVentas(); // <<<< Esto sí elimina después de guardar PDF
}

// Eliminar todas las ventas
function resetearVentas() {
  ventas.length = 0;
  localStorage.removeItem('ventas');
  actualizarListaVentas();
}

// Mostrar historial en la página
function renderizarHistorialLocal() {
  const contenedor = document.getElementById('historialContainer');
  historialVentas.forEach(venta => {
    contenedor.innerHTML += generarItemVenta(venta, false);
  });
}

// Obtener historial desde base de datos (PHP)
async function cargarHistorialDesdeBD() {
  try {
    const respuesta = await fetch('obtener_historial.php');
    const historialBD = await respuesta.json();
    const contenedor = document.getElementById('historialContainer');

    contenedor.innerHTML = '';

    historialBD.forEach((venta) => {
      venta.estado = 'completado';
      contenedor.innerHTML += generarItemVenta(venta, false);
    });
  } catch (error) {
    console.error('Error cargando historial:', error);
    document.getElementById('historialContainer').innerHTML = '<p>Error al cargar el historial.</p>';
  }
}

// Generar tarjeta HTML por cada venta
function generarItemVenta(venta, estadoEditable = true) {
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
            <p><span class="text-gray-400">Hora:</span> ${venta.hora}</p>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <span class="px-3 py-1 rounded-full text-sm font-medium ${venta.estado === 'pendiente' ? 'bg-yellow-600' : 'bg-green-600'}">
            ${venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
          </span>
          ${estadoEditable ? `<button onclick="cambiarEstado(${venta.id})" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-all">Cambiar Estado</button>` : ''}
        </div>
      </div>
    </div>`;
}
