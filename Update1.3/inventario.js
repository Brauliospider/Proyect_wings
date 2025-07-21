// Variables globales
let inventory = [];

document.addEventListener("DOMContentLoaded", () => {
  obtenerInventario();

  document.getElementById("formulario-producto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nuevoProducto = {
      nombre: document.getElementById("nombre").value,
      categoria: document.getElementById("categoria").value,
      stock: parseInt(document.getElementById("stock").value),
      stock_minimo: parseInt(document.getElementById("stock-minimo").value),
      costo: parseFloat(document.getElementById("costo").value),
      precio: parseFloat(document.getElementById("precio").value),
      caducidad: document.getElementById("caducidad").value
    };

    await agregarProducto(nuevoProducto);
    e.target.reset();
  });

  document.getElementById("inventario").addEventListener("click", async (e) => {
    if (e.target.classList.contains("eliminar-btn")) {
      const id = e.target.dataset.id;
      await eliminarProducto(id);
    } else if (e.target.classList.contains("editar-btn")) {
      const id = e.target.dataset.id;
      const producto = inventory.find(p => p.id === id || p.id == id);
      llenarFormularioEditar(producto);
    }
  });

  document.getElementById("buscar").addEventListener("input", (e) => {
    renderInventory(e.target.value.toLowerCase());
  });
});

async function obtenerInventario() {
  const res = await fetch("base_datos.php?accion=listar");
  inventory = await res.json();
  renderInventory();
}

async function agregarProducto(producto) {
  await fetch("base_datos.php?accion=agregar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto)
  });
  obtenerInventario();
}

async function eliminarProducto(id) {
  await fetch(`base_datos.php?accion=eliminar&id=${id}`);
  obtenerInventario();
}

function llenarFormularioEditar(producto) {
  document.getElementById("nombre").value = producto.nombre;
  document.getElementById("categoria").value = producto.categoria;
  document.getElementById("stock").value = producto.stock;
  document.getElementById("stock-minimo").value = producto.stock_minimo;
  document.getElementById("costo").value = producto.costo;
  document.getElementById("precio").value = producto.precio;
  document.getElementById("caducidad").value = producto.caducidad;

  const form = document.getElementById("formulario-producto");
  form.removeEventListener("submit", handleSubmit);
  form.addEventListener("submit", async function editarHandler(e) {
    e.preventDefault();
    const productoEditado = {
      id: producto.id,
      nombre: form.nombre.value,
      categoria: form.categoria.value,
      stock: parseInt(form.stock.value),
      stock_minimo: parseInt(form["stock-minimo"].value),
      costo: parseFloat(form.costo.value),
      precio: parseFloat(form.precio.value),
      caducidad: form.caducidad.value
    };

    await fetch("base_datos.php?accion=editar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productoEditado)
    });

    form.reset();
    form.removeEventListener("submit", editarHandler);
    form.addEventListener("submit", handleSubmit);
    obtenerInventario();
  });
}

function handleSubmit(e) {
  e.preventDefault();
}

function renderInventory(filtro = "") {
  const tbody = document.getElementById("inventario");
  tbody.innerHTML = "";

  inventory
    .filter(p => p.nombre.toLowerCase().includes(filtro) || p.categoria.toLowerCase().includes(filtro))
    .forEach((producto) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${producto.nombre}</td>
        <td>${producto.categoria}</td>
        <td>${producto.stock}</td>
        <td>${producto.stock_minimo}</td>
        <td>${producto.costo}</td>
        <td>${producto.precio}</td>
        <td>${producto.caducidad}</td>
        <td>${producto.fecha_agregado}</td>
        <td>
          <button class="editar-btn bg-blue-500 text-white px-2 py-1 rounded mr-2" data-id="${producto.id}">Editar</button>
          <button class="eliminar-btn bg-red-500 text-white px-2 py-1 rounded" data-id="${producto.id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
}