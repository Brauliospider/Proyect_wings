// ========== SISTEMA DE SINCRONIZACIÓN FORZADA ==========

// Variables globales para el sistema de sincronización
let ultimaSincronizacion = null;
let estadoSincronizacion = 'synced';
let intervalSincronizacion = null;

// Función para detectar palabras clave
function detectarPalabrasClave(nombreProducto) {
    const nombre = nombreProducto.toLowerCase();
    const palabrasClave = ['alitas', 'boneless', 'papas', 'dedos', 'queso', 'aros', 'cebolla', 'nuggets', 'palomitas'];
    
    for (let palabra of palabrasClave) {
        if (nombre.includes(palabra)) {
            return palabra;
        }
    }
    return null;
}

// Función para sincronizar producto por palabra clave
function sincronizarProductoPorPalabraClave(productoBD, inventarioLocal) {
    console.log(`🔍 Buscando producto: ${productoBD.producto}`);
    
    // Primero intentar por nombre exacto
    let productoLocal = inventarioLocal.find(p => p.name === productoBD.producto);
    
    if (productoLocal) {
        console.log(`✅ Encontrado por nombre exacto: ${productoLocal.name}`);
        return productoLocal;
    }
    
    // Si no se encuentra por nombre exacto, buscar por palabra clave
    const palabraClave = detectarPalabrasClave(productoBD.producto);
    if (palabraClave) {
        console.log(`🔍 Buscando por palabra clave: ${palabraClave}`);
        productoLocal = inventarioLocal.find(p => 
            detectarPalabrasClave(p.name) === palabraClave
        );
        
        if (productoLocal) {
            console.log(`✅ Encontrado por palabra clave: ${productoLocal.name}`);
            return productoLocal;
        }
    }
    
    console.log(`❌ No encontrado: ${productoBD.producto}`);
    return null;
}

// Función para actualizar indicador visual de sincronización
function actualizarIndicadorSync(estado, mensaje = '') {
    const indicator = document.getElementById('sync-status');
    const dot = document.getElementById('sync-dot');
    const text = document.getElementById('sync-text');
    
    if (!indicator || !dot || !text) return;
    
    estadoSincronizacion = estado;
    
    // Remover todas las clases de estado
    indicator.classList.remove('synced', 'syncing', 'error');
    
    switch (estado) {
        case 'syncing':
            indicator.classList.add('syncing');
            dot.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
            text.textContent = mensaje || 'Sincronizando...';
            break;
        case 'synced':
            indicator.classList.add('synced');
            dot.className = 'w-2 h-2 bg-green-500 rounded-full';
            text.textContent = mensaje || 'Sincronizado';
            ultimaSincronizacion = new Date();
            break;
        case 'error':
            indicator.classList.add('error');
            dot.className = 'w-2 h-2 bg-red-500 rounded-full';
            text.textContent = mensaje || 'Error de sincronización';
            break;
    }
}

// NUEVA: Función para verificar conexión con la base de datos
function verificarConexionBD() {
    console.log("🔗 Verificando conexión con base de datos...");
    
    return fetch("conexion.php?accion=obtener_inventario", {
        method: "GET",
        cache: 'no-cache',
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
    .then(response => {
        console.log(`📡 Respuesta del servidor: ${response.status}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        console.log("📄 Respuesta cruda:", text);
        try {
            const data = JSON.parse(text);
            console.log("✅ JSON válido recibido:", data);
            return data;
        } catch (e) {
            console.error("❌ Error al parsear JSON:", e);
            console.error("📄 Texto recibido:", text);
            throw new Error("Respuesta no es JSON válido");
        }
    });
}

// Función principal de sincronización MEJORADA
function sincronizarInventarioConBD() {
    console.log("🔄 === INICIANDO SINCRONIZACIÓN FORZADA ===");
    actualizarIndicadorSync('syncing');
    
    verificarConexionBD()
    .then(inventarioBD => {
        console.log("📦 Datos de BD recibidos:", inventarioBD);
        
        if (!Array.isArray(inventarioBD)) {
            throw new Error("Los datos recibidos no son un array");
        }
        
        let inventarioLocal = JSON.parse(localStorage.getItem('inventory')) || [];
        console.log("💾 Inventario local actual:", inventarioLocal);
        
        let productosActualizados = 0;
        let detallesActualizacion = [];
        
        // Sincronizar cada producto de la BD
        inventarioBD.forEach((productoBD, index) => {
            console.log(`\n--- Procesando producto ${index + 1}/${inventarioBD.length} ---`);
            console.log("🏷️ Producto BD:", productoBD);
            
            const productoLocal = sincronizarProductoPorPalabraClave(productoBD, inventarioLocal);
            
            if (productoLocal) {
                const stockAnterior = productoLocal.stock;
                const stockNuevo = parseInt(productoBD.stock);
                
                console.log(`📊 Stock anterior: ${stockAnterior}, Stock nuevo: ${stockNuevo}`);
                
                if (stockAnterior !== stockNuevo) {
                    productoLocal.stock = stockNuevo;
                    productosActualizados++;
                    
                    detallesActualizacion.push({
                        nombre: productoLocal.name,
                        stockAnterior: stockAnterior,
                        stockNuevo: stockNuevo,
                        diferencia: stockNuevo - stockAnterior
                    });
                    
                    console.log(`✅ ACTUALIZADO: ${productoLocal.name}: ${stockAnterior} → ${stockNuevo}`);
                } else {
                    console.log(`ℹ️ Sin cambios: ${productoLocal.name}`);
                }
            }
        });
        
        console.log(`\n RESUMEN: ${productosActualizados} productos actualizados`);
        
        // Guardar inventario actualizado
        localStorage.setItem('inventory', JSON.stringify(inventarioLocal));
        console.log(" Inventario guardado en localStorage");
        
        // Actualizar variable global
        if (typeof window.inventory !== 'undefined') {
            window.inventory = inventarioLocal;
            console.log(" Variable global actualizada");
        }
        
        // FORZAR re-renderizado
        setTimeout(() => {
            if (typeof renderInventory === 'function') {
                console.log(" Forzando re-renderizado...");
                renderInventory();
            }
        }, 100);
        
        // Mostrar resultado
        if (productosActualizados > 0) {
            mostrarNotificacionSincronizacion(detallesActualizacion);
            actualizarIndicadorSync('synced', `${productosActualizados} actualizados`);
            console.log(` ÉXITO: ${productosActualizados} productos sincronizados`);
        } else {
            actualizarIndicadorSync('synced', 'Sin cambios');
            console.log(" Sincronización completada: Sin cambios");
        }
        
        // Volver a estado normal después de 3 segundos
        setTimeout(() => {
            if (estadoSincronizacion === 'synced') {
                actualizarIndicadorSync('synced');
            }
        }, 3000);
        
    })
    .catch(error => {
        console.error(" ERROR EN SINCRONIZACIÓN:", error);
        actualizarIndicadorSync('error', 'Error de conexión');
        mostrarNotificacionError(`Error: ${error.message}`);
    });
}

// NUEVA: Función para sincronización forzada cada 5 segundos
function iniciarSincronizacionAgresiva() {
    console.log(" Iniciando sincronización agresiva cada 5 segundos");
    
    // Limpiar intervalo anterior si existe
    if (intervalSincronizacion) {
        clearInterval(intervalSincronizacion);
    }
    
    // Sincronización cada 5 segundos
    intervalSincronizacion = setInterval(() => {
        if (!document.hidden) {
            console.log(" Sincronización automática (5s)");
            sincronizarInventarioConBD();
        }
    }, 5000);
}

// NUEVA: Función para detener sincronización agresiva
function detenerSincronizacionAgresiva() {
    if (intervalSincronizacion) {
        clearInterval(intervalSincronizacion);
        intervalSincronizacion = null;
        console.log(" Sincronización agresiva detenida");
    }
}

// Función para mostrar notificación de sincronización exitosa
function mostrarNotificacionSincronizacion(detalles) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-40 max-w-md';
    
    let contenido = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium">¡Stock Actualizado!</h3>
                <div class="mt-1 text-xs">
                    <div> ${detalles.length} productos sincronizados</div>
    `;
    
    // Mostrar todos los productos actualizados
    detalles.forEach(detalle => {
        const icono = detalle.diferencia > 0 ? '' : '';
        contenido += `<div>${icono} ${detalle.nombre}: ${detalle.stockAnterior} → ${detalle.stockNuevo}</div>`;
    });
    
    contenido += `
                </div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
            </button>
        </div>
    `;
    
    notification.innerHTML = contenido;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Función para mostrar notificación de error
function mostrarNotificacionError(mensaje) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-40 max-w-md';
    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium">Error de Sincronización</h3>
                <div class="mt-1 text-xs">${mensaje}</div>
                <button onclick="sincronizarInventarioConBD()" class="mt-2 text-xs underline">Reintentar</button>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 8000);
}

// Función para mostrar notificación de stock actualizado (para ventas)
function mostrarNotificacionStock(actualizaciones) {
    if (actualizaciones && actualizaciones.length > 0) {
        let detalles = [];
        
        actualizaciones.forEach(act => {
            if (act.resultado.actualizado) {
                detalles.push({
                    nombre: act.producto,
                    stockAnterior: act.resultado.stock_anterior,
                    stockNuevo: act.resultado.stock_nuevo,
                    diferencia: act.resultado.stock_nuevo - act.resultado.stock_anterior
                });
            }
        });
        
        if (detalles.length > 0) {
            mostrarNotificacionSincronizacion(detalles);
            // Forzar sincronización después de 1 segundo
            setTimeout(() => {
                sincronizarInventarioConBD();
            }, 1000);
        }
    }
}

// NUEVA: Función de debugging para mostrar estado actual
function mostrarEstadoDebug() {
    console.log("=== ESTADO DE DEBUG ===");
    console.log(" Inventario localStorage:", JSON.parse(localStorage.getItem('inventory') || '[]'));
    console.log(" Variable global inventory:", window.inventory);
    console.log(" Última sincronización:", ultimaSincronizacion);
    console.log(" Estado sincronización:", estadoSincronizacion);
    console.log("========================");
}

// Hacer funciones disponibles globalmente
window.sincronizarInventarioConBD = sincronizarInventarioConBD;
window.mostrarNotificacionStock = mostrarNotificacionStock;
window.mostrarNotificacionSincronizacion = mostrarNotificacionSincronizacion;
window.detectarPalabrasClave = detectarPalabrasClave;
window.sincronizarProductoPorPalabraClave = sincronizarProductoPorPalabraClave;
window.actualizarIndicadorSync = actualizarIndicadorSync;
window.verificarConexionBD = verificarConexionBD;
window.iniciarSincronizacionAgresiva = iniciarSincronizacionAgresiva;
window.detenerSincronizacionAgresiva = detenerSincronizacionAgresiva;
window.mostrarEstadoDebug = mostrarEstadoDebug;

// Auto-ejecutar al cargar el script
document.addEventListener('DOMContentLoaded', function() {
    console.log(" Sistema de sincronización FORZADA cargado");
    
    // Inicializar indicador
    actualizarIndicadorSync('synced');
    
    // Sincronización inicial inmediata
    setTimeout(() => {
        console.log(" Ejecutando sincronización inicial...");
        sincronizarInventarioConBD();
    }, 500);
    
    // Iniciar sincronización agresiva
    setTimeout(() => {
        iniciarSincronizacionAgresiva();
    }, 2000);
});

// Sincronizar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log(" Página visible - Sincronización forzada");
        sincronizarInventarioConBD();
    }
});