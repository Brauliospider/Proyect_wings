// Variables globales
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

// Elementos del DOM
const elements = {
    inventoryBody: document.getElementById('inventory-body'),
    searchInput: document.getElementById('search-inventory'),
    categoryFilter: document.getElementById('filter-category'),
    statusFilter: document.getElementById('filter-status'),
    addProductBtn: document.getElementById('add-product-btn'),
    exportBtn: document.getElementById('export-btn'),
    productModal: document.getElementById('product-modal'),
    productForm: document.getElementById('product-form'),
    modalTitle: document.getElementById('modal-title'),
    productId: document.getElementById('product-id'),
    productName: document.getElementById('product-name'),
    productCategory: document.getElementById('product-category'),
    productStock: document.getElementById('product-stock'),
    productMinStock: document.getElementById('product-min-stock'),
    productExpiry: document.getElementById('product-expiry'),
    cancelBtn: document.getElementById('cancel-btn'),
    submitProduct: document.getElementById('submit-product'),
    totalProducts: document.getElementById('total-products'),
    lowStock: document.getElementById('low-stock'),
    expiringSoon: document.getElementById('expiring-soon')
};

// Funciones de utilidad
function daysBetween(date1, date2) {
    const diffTime = date2 - date1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    let bgColor = 'bg-blue-500';
    
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'warning') bgColor = 'bg-yellow-500';
    
    notification.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg transition-opacity opacity-0 z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('opacity-100'), 10);
    
    setTimeout(() => {
        notification.classList.remove('opacity-100');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Función para crear botón de sincronización manual
function crearBotonSincronizacion() {
    const container = document.querySelector('.flex.justify-between.mb-6 .flex.gap-2');
    if (container && !document.getElementById('sync-btn')) {
        const syncBtn = document.createElement('button');
        syncBtn.id = 'sync-btn';
        syncBtn.className = 'bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition sync-button';
        syncBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Sincronizar';
        
        syncBtn.addEventListener('click', function() {
            this.disabled = true;
            this.classList.add('syncing');
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sincronizando...';
            
            // Usar la función de sincronización disponible
            if (typeof sincronizarInventarioConBD === 'function') {
                sincronizarInventarioConBD();
            }
            
            setTimeout(() => {
                this.disabled = false;
                this.classList.remove('syncing');
                this.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Sincronizar';
            }, 2000);
        });
        
        container.appendChild(syncBtn);
    }
}

// Funciones principales
function renderInventory() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const categoryFilter = elements.categoryFilter.value;
    const statusFilter = elements.statusFilter.value;
    
    let filteredProducts = inventory.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === '' || product.category === categoryFilter;
        
        const today = new Date();
        const expiryDate = product.expiry ? new Date(product.expiry) : null;
        let status = '';
        
        if (product.stock <= 0) {
            status = 'agotado';
        } else if (product.stock <= product.minStock) {
            status = 'stock-bajo';
        } else if (expiryDate && expiryDate < today) {
            status = 'caducado';
        } else if (expiryDate && daysBetween(today, expiryDate) <= 7) {
            status = 'por-caducar';
        } else {
            status = 'stock-ok';
        }
        
        const matchesStatus = statusFilter === '' || status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    elements.inventoryBody.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const today = new Date();
        const expiryDate = product.expiry ? new Date(product.expiry) : null;
        
        let status = '';
        let statusClass = '';
        let statusText = '';
        
        if (product.stock <= 0) {
            status = 'agotado';
            statusClass = 'bg-red-100 text-red-800';
            statusText = 'Agotado';
        } else if (product.stock <= product.minStock) {
            status = 'stock-bajo';
            statusClass = 'bg-yellow-100 text-yellow-800';
            statusText = 'Stock bajo';
        } else if (expiryDate && expiryDate < today) {
            status = 'caducado';
            statusClass = 'bg-red-100 text-red-800';
            statusText = 'Caducado';
        } else if (expiryDate && daysBetween(today, expiryDate) <= 7) {
            status = 'por-caducar';
            statusClass = 'bg-orange-100 text-orange-800';
            statusText = 'Por caducar';
        } else {
            status = 'stock-ok';
            statusClass = 'bg-green-100 text-green-800';
            statusText = 'OK';
        }
        
        let rowClass = '';
        if (status === 'por-caducar') rowClass = 'expiring-soon';
        if (status === 'caducado') rowClass = 'expired';
        
        // Mostrar palabra clave detectada
        const palabraClave = typeof detectarPalabrasClave === 'function' ? detectarPalabrasClave(product.name) : null;
        const palabraClaveInfo = palabraClave ? `<small class="text-gray-400">(${palabraClave})</small>` : '';
        
        const row = document.createElement('tr');
        row.className = `${rowClass} fade-in`;
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${product.name}</div>
                        ${palabraClaveInfo}
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 capitalize">${product.category}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${product.stock} <span class="text-gray-500">/ ${product.minStock}</span></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${product.expiry || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="app.editProduct(${product.id})" class="text-blue-600 hover:text-blue-900 mr-2">Editar</button>
                <button onclick="app.deleteProduct(${product.id})" class="text-red-600 hover:text-red-900">Eliminar</button>
            </td>
        `;
        
        elements.inventoryBody.appendChild(row);
    });
    
    updateInventoryMetrics();
}

function updateInventoryMetrics() {
    const today = new Date();
    
    const totalProducts = inventory.length;
    
    const lowStock = inventory.filter(product => 
        product.stock > 0 && product.stock <= product.minStock
    ).length;
    
    const expiringSoon = inventory.filter(product => {
        if (!product.expiry) return false;
        const expiryDate = new Date(product.expiry);
        return daysBetween(today, expiryDate) <= 7 && expiryDate >= today;
    }).length;
    
    elements.totalProducts.textContent = totalProducts;
    elements.lowStock.textContent = lowStock;
    elements.expiringSoon.textContent = expiringSoon;
}

function showAddProductModal() {
    elements.modalTitle.textContent = 'Agregar Producto';
    elements.productId.value = '';
    elements.productForm.reset();
    elements.productModal.classList.remove('hidden');
}

function editProduct(id) {
    const product = inventory.find(p => p.id === id);
    if (!product) return;
    
    elements.modalTitle.textContent = 'Editar Producto';
    elements.productId.value = product.id;
    elements.productName.value = product.name;
    elements.productCategory.value = product.category;
    elements.productStock.value = product.stock;
    elements.productMinStock.value = product.minStock;
    elements.productExpiry.value = product.expiry || '';
    
    elements.productModal.classList.remove('hidden');
}

function hideModal() {
    elements.productModal.classList.add('hidden');
}

function handleProductForm(event) {
    event.preventDefault();
    
    const id = elements.productId.value;
    const name = elements.productName.value;
    const category = elements.productCategory.value;
    const stock = parseInt(elements.productStock.value);
    const minStock = parseInt(elements.productMinStock.value);
    const expiry = elements.productExpiry.value;
    
    const today = new Date().toISOString().split('T')[0];
    
    if (id) {
        const index = inventory.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            inventory[index] = {
                ...inventory[index],
                name,
                category,
                stock,
                minStock,
                expiry
            };
        }
    } else {
        const newId = inventory.length > 0 ? Math.max(...inventory.map(p => p.id)) + 1 : 1;
        inventory.push({
            id: newId,
            name,
            category,
            stock,
            minStock,
            cost: 0,
            price: 0,
            expiry,
            addedDate: today
        });
    }
    
    saveInventory();
    renderInventory();
    hideModal();
    showNotification(id ? 'Producto actualizado' : 'Producto agregado', 'success');
    
    // Guardar en la base de datos
    saveProductToDB({ name, category, stock, expiry });
}

function deleteProduct(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        inventory = inventory.filter(product => product.id !== id);
        saveInventory();
        renderInventory();
        showNotification('Producto eliminado', 'success');
    }
}

function exportInventory() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nombre,Categoría,Stock,Stock Mínimo,Caducidad,Fecha de Agregado,Palabra Clave\n";
    
    inventory.forEach(product => {
        const palabraClave = typeof detectarPalabrasClave === 'function' ? detectarPalabrasClave(product.name) || 'N/A' : 'N/A';
        const row = [
            product.name,
            product.category,
            product.stock,
            product.minStock,
            product.expiry || 'N/A',
            product.addedDate || 'N/A',
            palabraClave
        ].join(',');
        csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventario_alitas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Inventario exportado como CSV', 'success');
}

// Código para guardar el producto en la base de datos
function saveProductToDB(product) {
    const formData = new FormData();
    formData.append("producto", product.name);
    formData.append("categoria", product.category);
    formData.append("stock", product.stock);
    formData.append("caducidad", product.expiry);
    formData.append("estado", "Activo");
    
    fetch("conexion.php?accion=insertar_inventario", {
        method: "POST",
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log("Respuesta del servidor:", data);
    })
    .catch(error => {
        console.error("Error al guardar en BD:", error);
    });
}

// ========== CÓDIGO DE DEBUG PARA AGREGAR AL FINAL ==========

// NUEVA: Función para crear botones de debug
function crearBotonesDebug() {
    const container = document.querySelector('.flex.justify-between.mb-6 .flex.gap-2');
    if (container && !document.getElementById('debug-container')) {
        const debugContainer = document.createElement('div');
        debugContainer.id = 'debug-container';
        debugContainer.className = 'flex gap-2';
        
        // Botón de sincronización manual
        const syncBtn = document.createElement('button');
        syncBtn.id = 'sync-btn';
        syncBtn.className = 'bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition';
        syncBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Sincronizar';
        
        syncBtn.addEventListener('click', function() {
            console.log("🔄 Sincronización manual iniciada");
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sincronizando...';
            
            if (typeof sincronizarInventarioConBD === 'function') {
                sincronizarInventarioConBD();
            }
            
            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Sincronizar';
            }, 3000);
        });
        
        // Botón de debug
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-btn';
        debugBtn.className = 'bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition';
        debugBtn.innerHTML = '<i class="fas fa-bug mr-2"></i>Debug';
        
        debugBtn.addEventListener('click', function() {
            if (typeof mostrarEstadoDebug === 'function') {
                mostrarEstadoDebug();
            }
            if (typeof verificarConexionBD === 'function') {
                verificarConexionBD().then(data => {
                    console.log("🔍 Test de conexión exitoso:", data);
                }).catch(error => {
                    console.error("❌ Test de conexión falló:", error);
                });
            }
        });
        
        // Botón de refrescar forzado
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refresh-btn';
        refreshBtn.className = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition';
        refreshBtn.innerHTML = '<i class="fas fa-redo mr-2"></i>Refrescar';
        
        refreshBtn.addEventListener('click', function() {
            console.log("🔄 Refrescando inventario...");
            renderInventory();
            showNotification('Inventario refrescado', 'info');
        });
        
        debugContainer.appendChild(syncBtn);
        debugContainer.appendChild(debugBtn);
        debugContainer.appendChild(refreshBtn);
        container.appendChild(debugContainer);
    }
}

// Modificar la función renderInventory existente para agregar logs
const renderInventoryOriginal = renderInventory;
renderInventory = function() {
    console.log(" === RENDERIZANDO INVENTARIO ===");
    console.log(" Inventario actual:", inventory);
    
    // Llamar a la función original
    renderInventoryOriginal();
    
    console.log(" Renderizado completado");
};

// Modificar la función saveInventory existente para agregar logs
const saveInventoryOriginal = saveInventory;
saveInventory = function() {
    console.log(" Guardando inventario:", inventory);
    
    // Llamar a la función original
    saveInventoryOriginal();
    
    console.log(" Inventario guardado en localStorage");
};

// Agregar a la inicialización existente
document.addEventListener('DOMContentLoaded', function() {
    // Crear botones de debug después de que todo esté cargado
    setTimeout(() => {
        crearBotonesDebug();
        console.log(" Sistema de debug cargado");
    }, 1000);
});

// Mejorar la sincronización cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && typeof sincronizarInventarioConBD === 'function') {
        console.log(" Página visible - Forzando sincronización");
        setTimeout(() => {
            sincronizarInventarioConBD();
        }, 500);
    }
});

console.log(" Código de debug cargado correctamente");

// Objeto principal de la aplicación
const app = {
    init: function() {
        // Event listeners
        elements.searchInput.addEventListener('input', renderInventory);
        elements.categoryFilter.addEventListener('change', renderInventory);
        elements.statusFilter.addEventListener('change', renderInventory);
        elements.addProductBtn.addEventListener('click', showAddProductModal);
        elements.exportBtn.addEventListener('click', exportInventory);
        elements.productForm.addEventListener('submit', handleProductForm);
        elements.cancelBtn.addEventListener('click', hideModal);
        
        // Renderizar inventario inicial
        renderInventory();
        
        // Crear botón de sincronización
        crearBotonSincronizacion();
        
        // Sincronización automática
        setTimeout(() => {
            console.log(" Iniciando sistema de sincronización desde inventario.js...");
            
            // Sincronización periódica cada 15 segundos
            setInterval(() => {
                if (!document.hidden && typeof sincronizarInventarioConBD === 'function') {
                    sincronizarInventarioConBD();
                }
            }, 15000);
            
        }, 2000);
    },
    editProduct,
    deleteProduct
};

// Sincronizar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && typeof sincronizarInventarioConBD === 'function') {
        console.log(" Página visible, sincronizando...");
        setTimeout(() => {
            sincronizarInventarioConBD();
        }, 500);
    }
});

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', app.init);

// Hacer funciones disponibles globalmente
window.app = app;
window.inventory = inventory;
window.renderInventory = renderInventory;