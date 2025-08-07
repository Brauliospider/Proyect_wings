// SCRIPT-HISTORIAL.PHP COMPLETO Y CORREGIDO

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
  if (!container) return;
  
  container.innerHTML = '';
  let total = 0;
  
  ventas.forEach((venta) => {
    container.innerHTML += generarItemVenta(venta, true);
    if (venta.estado === 'completado') total += venta.precio * venta.cantidad;
  });
  
  const totalElement = document.getElementById('totalVendido');
  if (totalElement) {
    totalElement.textContent = `$${total.toFixed(2)}`;
  }
}

// Renderizar historial local
function renderizarHistorialLocal() {
  const contenedor = document.getElementById('historialContainer');
  if (!contenedor) return;
  
  historialVentas.forEach(venta => {
    contenedor.innerHTML += generarItemVenta(venta, false);
  });
}

// FUNCIÓN CORREGIDA - Convertir datos de BD a arreglo manipulable
function convertirDatosBDaArreglo(datosBD) {
    console.log('🔄 Convirtiendo datos de BD:', datosBD);
    
    if (!Array.isArray(datosBD)) {
        console.warn('Los datos de BD no son un array:', datosBD);
        return [];
    }
    
    return datosBD.map(venta => {
        if (!venta || typeof venta !== 'object') {
            console.warn('Venta inválida encontrada:', venta);
            return null;
        }
        
        // MAPEO EXACTO - Los datos ya vienen formateados desde PHP
        const ventaConvertida = {
            id: parseInt(venta.id) || Date.now() + Math.random(),
            producto: venta.producto || 'Producto sin nombre',
            cantidad: parseInt(venta.cantidad) || 1,
            precio: parseFloat(venta.precio) || 0,
            estado: venta.estado || 'completado',
            fecha: venta.fecha ? 
                (venta.fecha.includes('-') ? 
                    new Date(venta.fecha).toLocaleDateString() : 
                    venta.fecha) : 
                new Date().toLocaleDateString()
        };
        
        console.log('Venta convertida:', ventaConvertida);
        return ventaConvertida;
    }).filter(venta => venta !== null);
}

// FUNCIÓN CORREGIDA - Sincronizar datos de BD con localStorage
function sincronizarConBD(datosConvertidos) {
    // Limpiar duplicados basándose en ID
    const idsExistentes = new Set(historialVentas.map(v => v.id));
    const datosNuevos = datosConvertidos.filter(venta => !idsExistentes.has(venta.id));
    
    if (datosNuevos.length > 0) {
        historialVentas = [...historialVentas, ...datosNuevos];
        localStorage.setItem('historialVentas', JSON.stringify(historialVentas));
        console.log(`Sincronizados ${datosNuevos.length} registros nuevos`);
    }
    
    return datosConvertidos;
}

// FUNCIÓN CORREGIDA - Preparar datos para PDF con cálculos
function prepararDatosParaPDF(datos) {
    const datosPreparados = convertirDatosBDaArreglo(datos);
    
    // Calcular totales y estadísticas
    let totalGeneral = 0;
    let totalCompletadas = 0;
    let totalPendientes = 0;
    
    datosPreparados.forEach(venta => {
        const subtotal = venta.precio * venta.cantidad;
        totalGeneral += subtotal;
        
        if (venta.estado === 'completado') {
            totalCompletadas += subtotal;
        } else {
            totalPendientes += subtotal;
        }
    });
    
    return {
        datos: datosPreparados,
        totales: {
            general: totalGeneral,
            completadas: totalCompletadas,
            pendientes: totalPendientes
        }
    };
}

// FUNCIÓN CORREGIDA - Cargar historial desde BD con mejor manejo de errores
async function cargarHistorialDesdeBD() {
    try {
        console.log('Iniciando carga de historial...');
        
        const respuesta = await fetch('obtener_historial.php');
        console.log('Status de respuesta:', respuesta.status);
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        
        const historialBD = await respuesta.json();
        console.log('Datos recibidos de BD:', historialBD);
        
        // Verificar si hay error en la respuesta
        if (historialBD.error) {
            throw new Error(historialBD.error);
        }
        
        if (!historialBD || historialBD.length === 0) {
            console.log('No hay datos en el historial de BD');
            const contenedor = document.getElementById('historialContainer');
            if (contenedor) {
                contenedor.innerHTML = '<p class="text-gray-400 text-center py-4">No hay historial disponible.</p>';
            }
            return;
        }
        
        const datosConvertidos = convertirDatosBDaArreglo(historialBD);
        console.log('Datos convertidos finales:', datosConvertidos);
        
        const contenedor = document.getElementById('historialContainer');
        if (contenedor) {
            contenedor.innerHTML = '';
            
            datosConvertidos.forEach((venta) => {
                venta.estado = 'completado';
                contenedor.innerHTML += generarItemVenta(venta, false);
            });
        }
        
        sincronizarConBD(datosConvertidos);
        console.log(' Historial cargado correctamente');
        
    } catch (error) {
        console.error(' Error cargando historial:', error);
        const contenedor = document.getElementById('historialContainer');
        if (contenedor) {
            contenedor.innerHTML = `<p class="text-red-400 text-center py-4">Error al cargar historial: ${error.message}</p>`;
        }
    }
}

// FUNCIÓN CORREGIDA - Finalizar y generar PDF con mejor manejo de errores
async function finalizar() {
    try {
        console.log(' Iniciando proceso de finalización...');
        
        // Mostrar indicador de carga
        const btnFinalizar = document.querySelector('[onclick="finalizar()"]');
        if (btnFinalizar) {
            btnFinalizar.textContent = 'Generando PDF...';
            btnFinalizar.disabled = true;
        }
        
        const respuesta = await fetch('finalizar.php', { method: 'POST' });
        console.log(' Status de finalizar:', respuesta.status);
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        console.log(' Datos para PDF:', datos);
        
        // Verificar si hay error en la respuesta
        if (datos.error) {
            throw new Error(datos.error);
        }
        
        if (!datos || datos.length === 0) {
            alert("No hay ventas en la base de datos para generar el PDF.");
            return;
        }

        // Preparar datos con cálculos automáticos
        const { datos: datosPreparados, totales } = prepararDatosParaPDF(datos);
        console.log(' Datos preparados para PDF:', datosPreparados);
        console.log(' Totales calculados:', totales);

        // Verificar que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF no está cargado. Asegúrate de incluir la librería.');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fechaHora = new Date().toLocaleString();
        const nombreArchivo = `Resumen_Ventas_${fechaHora.replace(/[:/]/g, '-').replace(/,/g, '')}.pdf`;

        // Configurar PDF
        doc.setFontSize(16);
        doc.text('Resumen de Ventas', 10, 15);
        doc.setFontSize(10);
        doc.text(`Generado: ${fechaHora}`, 10, 25);

        let y = 40;
        
        // Encabezados de tabla
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text("Producto", 10, y);
        doc.text("Cant.", 60, y);
        doc.text("Precio", 80, y);
        doc.text("Subtotal", 110, y);
        doc.text("Estado", 140, y);
        doc.text("Fecha", 170, y);
        
        y += 5;
        doc.line(10, y, 200, y); // Línea separadora
        y += 8;

        // Contenido de la tabla
        doc.setFont(undefined, 'normal');
        datosPreparados.forEach(venta => {
            const subtotal = venta.precio * venta.cantidad;
            
            // Truncar texto largo para que quepa en el PDF
            const productoTruncado = venta.producto.length > 20 ? 
                venta.producto.substring(0, 17) + '...' : venta.producto;
            
            doc.text(productoTruncado, 10, y);
            doc.text(String(venta.cantidad), 60, y);
            doc.text(`$${venta.precio.toFixed(2)}`, 80, y);
            doc.text(`$${subtotal.toFixed(2)}`, 110, y);
            doc.text(venta.estado, 140, y);
            doc.text(venta.fecha.substring(0, 10), 170, y); // Solo fecha, sin hora
            
            y += 6;
            
            // Nueva página si es necesario
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });

        // Totales
        y += 10;
        doc.line(10, y, 200, y); // Línea separadora
        y += 8;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Total General: $${totales.general.toFixed(2)}`, 10, y);
        y += 8;
        doc.text(`Total Completadas: $${totales.completadas.toFixed(2)}`, 10, y);
        y += 8;
        doc.text(`Total Pendientes: $${totales.pendientes.toFixed(2)}`, 10, y);

        // Guardar PDF
        doc.save(nombreArchivo);
        console.log(' PDF generado:', nombreArchivo);
        
        alert(" PDF generado y registros eliminados correctamente.");

        // Limpiar UI y localStorage
        const historialContainer = document.getElementById('historialContainer');
        if (historialContainer) {
            historialContainer.innerHTML = '<p class="text-gray-400 text-center py-4">Historial limpiado después de generar PDF.</p>';
        }
        
        localStorage.removeItem('ventas');
        localStorage.removeItem('historialVentas');
        
        // Recargar historial (debería estar vacío después del DELETE)
        setTimeout(() => {
            cargarHistorialDesdeBD();
        }, 1000);

    } catch (error) {
        console.error(" Error al finalizar:", error);
        alert("Ocurrió un error al generar el PDF: " + error.message);
    } finally {
        // Restaurar botón
        const btnFinalizar = document.querySelector('[onclick="finalizar()"]');
        if (btnFinalizar) {
            btnFinalizar.textContent = 'Finalizar y Generar PDF';
            btnFinalizar.disabled = false;
        }
    }
}

// Evento cuando DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  console.log(' DOM cargado, inicializando...');
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
    console.log(` Estado cambiado para venta ${id}:`, venta.estado);
  }
}

// Resetear ventas locales
function resetearVentas() {
  if (confirm('¿Estás seguro de que quieres resetear todas las ventas locales?')) {
    ventas.length = 0;
    localStorage.removeItem('ventas');
    actualizarListaVentas();
    console.log(' Ventas locales reseteadas');
  }
}

// Reaccionar a cambios desde otros scripts con localStorage
window.addEventListener('storage', (event) => {
  if (event.key === 'ultimaVenta') {
    const nuevaVenta = JSON.parse(event.newValue);
    historialVentas.push(nuevaVenta);
    localStorage.setItem('historialVentas', JSON.stringify(historialVentas));
    console.log(' Nueva venta agregada desde otro script:', nuevaVenta);
  }
});

// FUNCIÓN DE DEBUG - Para troubleshooting
function debugEstado() {
    console.log('=== DEBUG ESTADO ACTUAL ===');
    console.log('Ventas locales:', ventas);
    console.log('Historial local:', historialVentas);
    console.log('Elementos DOM:');
    console.log('  - ventasContainer:', document.getElementById('ventasContainer'));
    console.log('  - historialContainer:', document.getElementById('historialContainer'));
    console.log('  - totalVendido:', document.getElementById('totalVendido'));
    console.log('==============================');
}

// Hacer función debug disponible globalmente para troubleshooting
window.debugEstado = debugEstado;

console.log('Script historial cargado correctamente');