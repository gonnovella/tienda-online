// Obtener elementos del DOM
const carritoContainer = document.getElementById("carrito-items");
const totalGeneralSpan = document.getElementById("total-general");
const contadorCarrito = document.getElementById("contadorCarrito");

// Cargar carrito desde localStorage
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function actualizarContadorCarrito() {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let totalProductos = carrito.reduce((sum, producto) => sum + producto.cantidad, 0);
    if (contadorCarrito) {
        contadorCarrito.textContent = totalProductos;
    }
}

// Asegurar que el contador se actualiza al cargar la página
actualizarContadorCarrito();

// Función para mostrar los productos en el carrito
function mostrarCarrito() {
    carritoContainer.innerHTML = "";
    let totalGeneral = 0;

    carrito.forEach((producto, index) => {
        let totalProducto = producto.price * producto.cantidad;
        totalGeneral += totalProducto;

        carritoContainer.innerHTML += `
            <tr>
                <td>${producto.name}</td>
                <td>${producto.talla}</td> <!-- Mostrar la talla del producto -->
                <td>$${producto.price.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <span class="mx-2">${producto.cantidad}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="cambiarCantidad(${index}, 1)">+</button>
                </td>
                <td>$${totalProducto.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${index})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    totalGeneralSpan.textContent = `$${totalGeneral.toFixed(2)}`;
    actualizarContadorCarrito();
}


// Función para modificar la cantidad de un producto en el carrito
window.cambiarCantidad = function(index, cambio) {
    if (carrito[index].cantidad + cambio > 0) {
        carrito[index].cantidad += cambio;
    } else {
        carrito.splice(index, 1); // Si la cantidad es 0, eliminar el producto
    }
    actualizarCarrito();
}

// Función para eliminar un producto del carrito
window.eliminarProducto = function(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

// Función para actualizar el carrito en localStorage y en la página
window.actualizarCarrito = function () {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let totalGeneral = 0;

    const carritoItems = document.getElementById("carrito-items");
    carritoItems.innerHTML = "";

    carrito.forEach((producto, index) => {
        let totalProducto = producto.price * producto.cantidad;
        totalGeneral += totalProducto;

        let fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${producto.name} (Talla: ${producto.talla})</td>
            <td>$${producto.price.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="modificarCantidad(${index}, -1)">-</button>
                ${producto.cantidad}
                <button class="btn btn-sm btn-outline-secondary" onclick="modificarCantidad(${index}, 1)">+</button>
            </td>
            <td>$${totalProducto.toFixed(2)}</td>
            <td><button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${index})">Eliminar</button></td>
        `;

        carritoItems.appendChild(fila);
    });

    document.getElementById("total-general").textContent = `$${totalGeneral.toFixed(2)}`;
    localStorage.setItem("carrito", JSON.stringify(carrito));
};

window.modificarCantidad = function (index, cambio) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let producto = carrito[index];

    // Obtener stock disponible en Firestore
    obtenerStockDisponible(producto.id, producto.talla).then(stockDisponible => {
        if ((producto.cantidad + cambio) > stockDisponible) {
            alert(`No puedes agregar más de ${stockDisponible} unidades.`);
            return;
        }

        producto.cantidad += cambio;
        if (producto.cantidad <= 0) {
            carrito.splice(index, 1); // Eliminar producto si llega a 0
        }

        localStorage.setItem("carrito", JSON.stringify(carrito));
        actualizarCarrito();
    }).catch(error => {
        console.error("❌ Error al obtener stock:", error);
    });
};

async function obtenerStockDisponible(productId, talla) {
    const tiendasSnapshot = await getDocs(collection(db, "stores"));
    if (tiendasSnapshot.empty) throw new Error("No se encontró una tienda en Firestore.");
    const storeId = tiendasSnapshot.docs[0].id;

    const productoRef = doc(db, "stores", storeId, "products", productId);
    const productoSnap = await getDoc(productoRef);

    if (productoSnap.exists()) {
        const stock = productoSnap.data().sizes || {};
        return stock[talla] ?? 0;
    }

    return 0;
}

window.eliminarDelCarrito = function (index) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarrito();
};

// Cargar carrito al abrir la página
actualizarCarrito();


// Cargar el carrito al iniciar
window.onload = mostrarCarrito;
