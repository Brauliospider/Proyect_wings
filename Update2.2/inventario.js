// Variables globales
let inventory = JSON.parse(localStorage.getItem('inventory')) || [
    {
        id: 1,
        name: "Alitas 10 piezas",
        category: "alitas",
        stock: 50,
        minStock: 20,
        expiry: "2023-12-15",
    },
    {
        id: 2,
        name: "Alitas 15 piezas",
        category: "alitas",
        stock: 35,
        minStock: 15,
        cost: 105.00,
        price: 160.00,
        expiry: "2023-12-20",
        addedDate: "2023-10-05"
    },
    {
        id: 3,
        name: "Boneless (9 piezas)",
        category: "snacks",
        stock: 8,
        minStock: 10,
        cost: 60.00,
        price: 95.00,
        expiry: "2023-11-30",
        addedDate: "2023-09-15"
    },
    {
        id: 4,
        name: "Papas a la francesa",
        category: "snacks",
        stock: 25,
        minStock: 15,
        cost: 30.00,
        price: 70.00,
        expiry: "2023-10-25",
        addedDate: "2023-09-20"
    }
];

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
    // productCost: document.getElementById('product-cost'), // Removed
    // productPrice: document.getElementById('product-price'), // Removed
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

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg transition-opacity opacity-0';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('opacity-100'), 10);
    
    setTimeout(() => {
        notification.classList.remove('opacity-100');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
        
        const row = document.createElement('tr');
        row.className = `${rowClass} fade-in`;
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${product.name}</div>
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
    // Ensure cost and price fields are cleared/not set, though they are removed from HTML
    // elements.productCost.value = '';
    // elements.productPrice.value = '';
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
    // elements.productCost.value = product.cost; // Removed
    // elements.productPrice.value = product.price; // Removed
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
    // const cost = parseFloat(elements.productCost.value); // Removed
    // const price = parseFloat(elements.productPrice.value); // Removed
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
                // cost, // Removed
                // price, // Removed
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
            cost: 0, // Set default or null if no longer tracked
            price: 0, // Set default or null if no longer tracked
            expiry,
            addedDate: today
        });
    }
    
    saveInventory();
    renderInventory();
    hideModal();
    showNotification(id ? 'Producto actualizado' : 'Producto agregado');
    //manda a llamar a la función que guarda el producto en la base de datos
    saveProductToDB({ name, category, stock, expiry });
}

function deleteProduct(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        inventory = inventory.filter(product => product.id !== id);
        saveInventory();
        renderInventory();
        showNotification('Producto eliminado');
    }
}

function exportInventory() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nombre,Categoría,Stock,Stock Mínimo,Caducidad,Fecha de Agregado\n";
    
    inventory.forEach(product => {
        const row = [
            product.name,
            product.category,
            product.stock,
            product.minStock,
            product.expiry || 'N/A',
            product.addedDate || 'N/A'
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
    
    showNotification('Inventario exportado como CSV');
}

//Código para guardar el producto en la base de datos
function saveProductToDB(product) {
    const formData = new FormData();
    formData.append("producto", product.name);
    formData.append("categoria", product.category);
    formData.append("stock", product.stock);
    formData.append("caducidad", product.expiry);
    formData.append("estado", "Activo"); // Puedes cambiar esto si lo necesitas

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
    },
    editProduct,
    deleteProduct
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', app.init);

// Hacer funciones disponibles globalmente para los botones en las filas de la tabla
window.app = app;