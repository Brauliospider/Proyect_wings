let cart = [];

function addToCart(name, price, image) {
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, image, quantity: 1 });
  }
  updateCart();
  showNotification(`${name} agregado al carrito`);
}

function removeFromCart(name) {
  cart = cart.filter(item => item.name !== name);
  updateCart();
  showNotification(`${name} eliminado del carrito`);
}

function updateQuantity(name, newQuantity) {
  const item = cart.find(item => item.name === name);
  if (item) {
    item.quantity = parseInt(newQuantity);
    if (item.quantity <= 0) {
      removeFromCart(name);
    } else {
      updateCart();
    }
  }
}

function updateCart() {
  const cartItemsDiv = document.getElementById('cart-items');
  const totalElement = document.getElementById('total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const emptyCartMessage = document.getElementById('empty-cart-message');

  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
  });

  const total = subtotal;
  totalElement.textContent = `$${total.toFixed(2)}`;

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<p id="empty-cart-message" class="text-gray-500 text-center py-4">El carrito está vacío</p>';
    checkoutBtn.disabled = true;
    checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
    checkoutBtn.classList.remove('opacity-100');
  } else {
    emptyCartMessage?.remove();
    let cartHTML = '';
    cart.forEach(item => {
      cartHTML += `
        <div class="cart-item flex items-center justify-between mb-3 pb-3 border-b border-gray-100 fade-in">
          <div class="flex items-center">
            <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded-md mr-3">
            <div>
              <h4 class="font-medium">${item.name}</h4>
              <p class="text-sm text-gray-600">$${item.price.toFixed(2)}</p>
            </div>
          </div>
          <div class="flex items-center">
            <button onclick="updateQuantity('${item.name}', ${item.quantity - 1})"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 w-6 h-6 rounded-l-md transition">-</button>
            <input type="number" value="${item.quantity}" min="1"
              onchange="updateQuantity('${item.name}', this.value)"
              class="quantity-input border-t border-b border-gray-300 h-6 text-center">
            <button onclick="updateQuantity('${item.name}', ${item.quantity + 1})"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 w-6 h-6 rounded-r-md transition">+</button>
            <button onclick="removeFromCart('${item.name}')"
              class="ml-2 text-red-500 hover:text-red-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>`;
    });
    cartItemsDiv.innerHTML = cartHTML;
    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    checkoutBtn.classList.add('opacity-100');
  }
}

//Funcion a BD
function checkout() {
  if (cart.length === 0) return;

  fetch('conexion.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const total = document.getElementById('total').textContent;
        alert(`¡Compra exitosa!\nTotal: ${total}\n\nGracias por su compra.`);
        cart = [];
        updateCart();
        showNotification('Compra registrada en la base de datos');
      } else {
        alert("Error al registrar la compra: " + data.message);
      }
    })
    .catch(error => {
      alert("Error al conectar con el servidor");
      console.error("Error:", error);
    });
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

document.getElementById('search-product').addEventListener('input', function (e) {
  const searchTerm = e.target.value.toLowerCase();
  const productCards = document.querySelectorAll('.product-card');

  productCards.forEach(card => {
    const productName = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = productName.includes(searchTerm) ? 'block' : 'none';
  });
});
function irAInicio() {
    console.log('Botón de Inicio clickeado');
    window.location.href = '#';
    // Aquí puedes redirigir o ejecutar más lógica si lo deseas
}