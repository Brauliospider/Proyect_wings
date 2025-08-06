// Cargar ventas desde localStorage
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];

// Mostrar ventas al cargar
actualizarListaVentas();

// Historial desde localStorage
let historialVentas = JSON.parse(localStorage.getItem('historialVentas')) || [];

// Función para generar el HTML de un item venta/historial
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
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <span class="px-3 py-1 rounded-full text-sm font-medium ${
            venta.estado === 'pendiente' ? 'bg-yellow-600' : 'bg-green-600'
          }">
            ${venta.estado ? venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1) : 'Completado'}
          </span>
          ${
            estadoEditable
              ? `<button onclick="cambiarEstado(${venta.id})" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-all">Cambiar Estado</button>`
              : ''
          }
        </div>
      </div>
    </div>`;
}

// Actualizar lista ventas locales
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

// Renderizar historial local
function renderizarHistorialLocal() {
  const contenedor = document.getElementById('historialContainer');
  historialVentas.forEach(venta => {
    contenedor.innerHTML += generarItemVenta(venta, false);
  });
}

// Cargar historial desde BD
async function cargarHistorialDesdeBD() {
  try {
    const respuesta = await fetch('obtener_historial.php');
    const historialBD = await respuesta.json();
    const contenedor = document.getElementById('historialContainer');

    // Limpiar antes de insertar BD
    contenedor.innerHTML = '';

    historialBD.forEach((venta) => {
      // Forzar estado completado y sin botón cambiar estado para historial BD
      venta.estado = 'completado';
      contenedor.innerHTML += generarItemVenta(venta, false);
    });
  } catch (error) {
    console.error('Error cargando historial:', error);
    document.getElementById('historialContainer').innerHTML = '<p>Error al cargar el historial.</p>';
  }
}

// ✅ Nueva función para finalizar y generar PDF desde BD
async function finalizar() {
    try {
        const respuesta = await fetch('finalizar.php', { method: 'POST' });
        const datos = await respuesta.json();

        if (!datos || datos.length === 0) {
            alert("No hay ventas en la base de datos para generar el PDF.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fechaHora = new Date().toLocaleString();
        const nombreArchivo = `Resumen_Ventas_${fechaHora.replace(/[:]/g, '-')}.pdf`;

        doc.setFontSize(14);
        doc.text(`Resumen de Ventas - ${fechaHora}`, 10, 10);
        doc.setFontSize(10);

        let y = 20;

        // Encabezados
        doc.text("Producto", 10, y);
        doc.text("Cant.", 60, y);
        doc.text("Precio", 80, y);
        doc.text("Estado", 110, y);
        doc.text("Fecha", 150, y);
        y += 6;
        doc.line(10, y, 200, y);
        y += 6;

        let total = 0;
        datos.forEach(venta => {
            doc.text(venta.producto, 10, y);
            doc.text(String(venta.cantidad), 60, y);
            doc.text(`$${parseFloat(venta.precio).toFixed(2)}`, 80, y);
            doc.text(venta.estado, 110, y);
            doc.text(venta.fecha, 150, y);
            total += parseFloat(venta.precio) * parseInt(venta.cantidad);
            y += 6;

            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });

        y += 10;
        doc.setFontSize(12);
        doc.text(`Total Vendido: $${total.toFixed(2)}`, 10, y);

        doc.save(nombreArchivo);

        alert("✅ PDF generado y registros eliminados correctamente.");

        // Limpia UI y localStorage
        document.getElementById('historialContainer').innerHTML = '';
        localStorage.removeItem('ventas');
        localStorage.removeItem('historialVentas');
        cargarHistorialDesdeBD();

    } catch (error) {
        console.error("Error al finalizar:", error);
        alert("Ocurrió un error al generar el PDF.");
    }
}

// Evento cuando DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  actualizarListaVentas();
  cargarHistorialDesdeBD();
});

// Cambiar estado de venta local
function cambiarEstado(id) {
  const venta = ventas.find((v) => v.id === id);
  if (venta) {
    venta.estado = venta.estado === 'pendiente' ? 'completado' : 'pendiente';
    localStorage.setItem('ventas', JSON.stringify(ventas));
    actualizarListaVentas();
  }
}

// Resetear ventas locales
function resetearVentas() {
  ventas.length = 0;
  localStorage.removeItem('ventas');
  actualizarListaVentas();
}

// (Opcional) Si quieres reaccionar a cambios desde otros scripts con localStorage
window.addEventListener('storage', (event) => {
  if (event.key === 'ultimaVenta') {
    const nuevaVenta = JSON.parse(event.newValue);
    historialVentas.push(nuevaVenta);
    localStorage.setItem('historialVentas', JSON.stringify(historialVentas));
  }
});