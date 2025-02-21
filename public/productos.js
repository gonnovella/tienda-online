import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const productosContainer = document.getElementById("productosContainer");
const searchBar = document.getElementById("searchBar");
const precioSlider = document.getElementById("precioSlider");
const precioMinSpan = document.getElementById("precioMin");
const precioMaxSpan = document.getElementById("precioMax");

let productos = []; // Array para almacenar productos

// Obtener dinámicamente el storeId
async function obtenerIdTienda() {
    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (!tiendasSnapshot.empty) {
            const tienda = tiendasSnapshot.docs[0]; // Tomar la primera tienda encontrada
            console.log("ID de la tienda obtenida:", tienda.id);
            return tienda.id;
        }
    } catch (error) {
        console.error("Error obteniendo el ID de la tienda:", error);
    }
    return null;
}

async function verificarTienda() {
    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) {
            console.error("❌ No se encontró ninguna tienda en Firestore.");
            return;
        }

        const storeId = tiendasSnapshot.docs[0].id;
        console.log("✅ Tienda encontrada en Firestore con ID:", storeId);
    } catch (error) {
        console.error("❌ Error al obtener la tienda:", error);
    }
}

verificarTienda();


// **Escuchar cambios en los productos en tiempo real**
async function escucharCambiosProductos() {
    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) throw new Error("No se encontró una tienda en Firestore.");
        const storeId = tiendasSnapshot.docs[0].id;

        const productosRef = collection(db, "stores", storeId, "products");

        console.log("👂 Escuchando cambios en productos...");

        onSnapshot(productosRef, (snapshot) => {
            console.log("🔄 Productos actualizados en Firestore!");
            
            let nuevosProductos = [];
            snapshot.forEach((doc) => {
                nuevosProductos.push({ id: doc.id, ...doc.data() });
            });

            console.log("📦 Nuevos productos obtenidos:", nuevosProductos);
            productos = nuevosProductos;
            mostrarProductos(nuevosProductos);
        });
    } catch (error) {
        console.error("❌ Error escuchando cambios en Firestore:", error);
    }
}

// **Cargar productos desde Firestore**
async function cargarProductos() {
    try {
        const storeId = await obtenerIdTienda();
        if (!storeId) {
            console.error("No se encontró ninguna tienda en Firestore.");
            return;
        }

        const productosSnapshot = await getDocs(collection(db, "stores", storeId, "products"));
        
        productos = [];
        productosSnapshot.forEach((doc) => {
            productos.push({ id: doc.id, ...doc.data() });
        });

        console.log("Productos obtenidos de Firestore:", productos);
        mostrarProductos(productos);
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}
// Función para mostrar los productos en la página
function mostrarProductos(lista) {
    productosContainer.innerHTML = "";
    lista.forEach((producto, index) => {
        productosContainer.innerHTML += `
            <div class="col fade-in">
                <div class="card h-100">
                    <img src="${producto.imageUrl}" class="card-img-top lazyload" alt="${producto.name}" loading="lazy">
                    <div class="card-body">
                        <h5 class="card-title">${producto.name}</h5>
                        <p class="card-text">$${producto.price.toFixed(2)}</p>
                        <button class="btn btn-primary" onclick="mostrarDetalles('${producto.id}')">Ver Detalles</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// Mostrar detalles del producto
window.mostrarDetalles = async function (id) {
    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) throw new Error("No se encontró una tienda en Firestore.");
        const storeId = tiendasSnapshot.docs[0].id;

        const productoRef = doc(db, "stores", storeId, "products", id);
        const productoSnap = await getDoc(productoRef);

        if (!productoSnap.exists()) {
            console.error("❌ Producto no encontrado.");
            return;
        }

        const producto = productoSnap.data();
        document.getElementById("productoNombre").textContent = producto.name;
        document.getElementById("productoPrecio").textContent = `$${producto.price.toFixed(2)}`;

        console.log("🔍 Producto obtenido:", producto);

        const tallaSelect = document.getElementById("tallaSelect");
        tallaSelect.innerHTML = "";

        if (!producto.sizes || Object.keys(producto.sizes).length === 0) {
            tallaSelect.innerHTML = `<option disabled selected>No hay tallas disponibles</option>`;
        } else {
            for (const talla in producto.sizes) {
                let option = document.createElement("option");
                option.value = talla;
                option.textContent = `${talla} (${producto.sizes[talla]} disponibles)`;

                if (producto.sizes[talla] <= 0) {
                    option.textContent = `${talla} (NO HAY STOCK)`;
                    option.disabled = true;
                }

                tallaSelect.appendChild(option);
            }
        }

        const modal = new bootstrap.Modal(document.getElementById("productoModal"));
        modal.show();
    } catch (error) {
        console.error("❌ Error al cargar detalles del producto:", error);
    }
}

// Escuchar cambios en productos y recargar la página si hay modificaciones
escucharCambiosProductos();


// Función para abrir el modal con los detalles del producto seleccionado
window.mostrarDetalles = async function (id) {
    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) throw new Error("No se encontró una tienda en Firestore.");
        const storeId = tiendasSnapshot.docs[0].id;

        const productoRef = doc(db, "stores", storeId, "products", id);
        const productoSnap = await getDoc(productoRef);

        if (!productoSnap.exists()) {
            console.error("❌ Producto no encontrado.");
            return;
        }

        const producto = productoSnap.data();
        document.getElementById("productoNombre").textContent = producto.name;
        document.getElementById("productoPrecio").textContent = `$${producto.price.toFixed(2)}`;

        console.log("🔍 Producto obtenido:", producto);

        // **Verificar si hay imágenes y cargarlas correctamente**
        const imagenesContainer = document.getElementById("productoImagenes");
        imagenesContainer.innerHTML = "";

        const imagenes = producto.images && Array.isArray(producto.images) && producto.images.length > 0
            ? producto.images
            : [producto.imageUrl || "https://via.placeholder.com/300"];

        imagenes.forEach((img, i) => {
            imagenesContainer.innerHTML += `
                <div class="carousel-item ${i === 0 ? "active" : ""}">
                    <img src="${img}" class="d-block w-100" alt="${producto.name}">
                </div>
            `;
        });

        // Cargar las tallas disponibles
        const tallaSelect = document.getElementById("tallaSelect");
        tallaSelect.innerHTML = "";

        if (!producto.sizes || Object.keys(producto.sizes).length === 0) {
            tallaSelect.innerHTML = `<option disabled selected>No hay tallas disponibles</option>`;
        } else {
            for (const talla in producto.sizes) {
                let option = document.createElement("option");
                option.value = talla;
                option.textContent = `${talla} (${producto.sizes[talla]} disponibles)`;

                if (producto.sizes[talla] <= 0) {
                    option.textContent = `${talla} (NO HAY STOCK)`;
                    option.disabled = true;
                }

                tallaSelect.appendChild(option);
            }
        }

        // **Asignar evento al botón de "Agregar al carrito"**
        const agregarCarritoBtn = document.getElementById("agregarCarritoBtn");
        agregarCarritoBtn.onclick = function () {
            const tallaSeleccionada = tallaSelect.value;
            if (!tallaSeleccionada) {
                alert("Por favor, selecciona una talla antes de agregar al carrito.");
                return;
            }
            agregarAlCarrito(id, tallaSeleccionada, producto.name, producto.price);
        };

        const modal = new bootstrap.Modal(document.getElementById("productoModal"));
        modal.show();
    } catch (error) {
        console.error("❌ Error al cargar detalles del producto:", error);
    }
};


// Función para agregar producto al carrito
window.agregarAlCarrito = async function (id, talla, nombre, precio) {
    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) throw new Error("No se encontró una tienda en Firestore.");
        const storeId = tiendasSnapshot.docs[0].id;

        const productoRef = doc(db, "stores", storeId, "products", id);
        const productoSnap = await getDoc(productoRef);

        if (!productoSnap.exists()) {
            console.error("❌ Producto no encontrado en Firestore.");
            return;
        }

        const producto = productoSnap.data();
        console.log("📦 Producto obtenido:", producto);

        let stockDisponible = producto.sizes?.[talla] ?? -1; // Si no existe la talla, stock es -1 (para detectar errores)

        if (stockDisponible < 0) {
            alert("Error: La talla seleccionada no existe.");
            return;
        }

        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        let productoEnCarrito = carrito.find(item => item.id === id && item.talla === talla);

        if (productoEnCarrito) {
            if (productoEnCarrito.cantidad < stockDisponible) {
                productoEnCarrito.cantidad += 1;
            } else {
                alert(`No puedes agregar más de ${stockDisponible} unidades de este producto.`);
                return;
            }
        } else {
            if (stockDisponible > 0) {
                carrito.push({ id, name: nombre, price: precio, talla, cantidad: 1 });
            } else {
                alert("Este producto está agotado.");
                return;
            }
        }

        localStorage.setItem("carrito", JSON.stringify(carrito));
        actualizarContadorCarrito();
        alert("Producto agregado al carrito.");
    } catch (error) {
        console.error("❌ Error en agregarAlCarrito:", error);
    }
};


// Cargar los filtros dinámicamente
function cargarFiltros() {
    const filtroMarcas = document.getElementById("filtroMarcas");
    const filtroTallas = document.getElementById("filtroTallas");

    let marcasUnicas = new Set();
    let tallasUnicas = new Set();

    productos.forEach((producto) => {
        marcasUnicas.add(producto.brand); // Agregar marca al conjunto
        Object.keys(producto.sizes).forEach((talla) => {
            tallasUnicas.add(talla); // Agregar talla al conjunto
        });
    });

    // Crear checkboxes de marcas
    filtroMarcas.innerHTML = "";
    marcasUnicas.forEach((marca) => {
        filtroMarcas.innerHTML += `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${marca}" id="marca-${marca}">
                <label class="form-check-label" for="marca-${marca}">${marca}</label>
            </div>
        `;
    });

    // Crear checkboxes de tallas
    filtroTallas.innerHTML = "";
    tallasUnicas.forEach((talla) => {
        filtroTallas.innerHTML += `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${talla}" id="talla-${talla}">
                <label class="form-check-label" for="talla-${talla}">${talla}</label>
            </div>
        `;
    });

    // Agregar evento para actualizar productos cuando se seleccionen filtros
    document.querySelectorAll("#filtroMarcas input, #filtroTallas input").forEach((checkbox) => {
        checkbox.addEventListener("change", filtrarProductos);
    });
}


// Aplicar filtros
searchBar.addEventListener("input", () => filtrarProductos());
precioSlider.addEventListener("input", () => {
    precioMaxSpan.textContent = precioSlider.value;
    filtrarProductos();
});

function filtrarProductos() {
    let filtroTexto = searchBar.value.toLowerCase();
    let filtroPrecio = parseFloat(precioSlider.value);
    
    // Obtener marcas y tallas seleccionadas
    let marcasSeleccionadas = [...document.querySelectorAll("#filtroMarcas input:checked")].map(el => el.value);
    let tallasSeleccionadas = [...document.querySelectorAll("#filtroTallas input:checked")].map(el => el.value);

    let productosFiltrados = productos.filter(p =>
        p.name.toLowerCase().includes(filtroTexto) &&
        p.price <= filtroPrecio &&
        (marcasSeleccionadas.length === 0 || marcasSeleccionadas.includes(p.brand)) &&
        (tallasSeleccionadas.length === 0 || Object.keys(p.sizes).some(talla => tallasSeleccionadas.includes(talla)))
    );

    mostrarProductos(productosFiltrados);
}

// Agregar eventos para la barra de búsqueda y el filtro de precio
searchBar.addEventListener("input", filtrarProductos);
precioSlider.addEventListener("input", () => {
    precioMaxSpan.textContent = precioSlider.value;
    filtrarProductos();
});

// Función para actualizar el contador del carrito en el navbar
function actualizarContadorCarrito() {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let totalProductos = carrito.reduce((sum, producto) => sum + producto.cantidad, 0);
    const contadorCarrito = document.getElementById("contadorCarrito");
    if (contadorCarrito) {
        contadorCarrito.textContent = totalProductos;
    }
}



// Asegurar que el contador se actualiza al cargar la página
actualizarContadorCarrito();


// Cargar productos al iniciar
window.onload = cargarProductos;

async function mostrarDetalles(id) {
    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) throw new Error("No se encontró una tienda en Firestore.");
        const storeId = tiendasSnapshot.docs[0].id;

        const productoRef = doc(db, "stores", storeId, "products", id);
        const productoSnap = await getDoc(productoRef);

        if (!productoSnap.exists()) {
            console.error("❌ Producto no encontrado.");
            return;
        }

        const producto = productoSnap.data();
        document.getElementById("productoNombre").textContent = producto.name;
        document.getElementById("productoPrecio").textContent = `$${producto.price.toFixed(2)}`;

        console.log("🔍 Producto obtenido:", producto);

        const tallaSelect = document.getElementById("tallaSelect");
        tallaSelect.innerHTML = "";

        if (!producto.sizes || Object.keys(producto.sizes).length === 0) {
            tallaSelect.innerHTML = `<option disabled selected>No hay tallas disponibles</option>`;
        } else {
            for (const talla in producto.sizes) {
                let option = document.createElement("option");
                option.value = talla;
                option.textContent = `${talla} (${producto.sizes[talla]} disponibles)`;

                if (producto.sizes[talla] <= 0) {
                    option.textContent = `${talla} (NO HAY STOCK)`;
                    option.disabled = true;
                }

                tallaSelect.appendChild(option);
            }
        }

        const modal = new bootstrap.Modal(document.getElementById("productoModal"));
        modal.show();
    } catch (error) {
        console.error("❌ Error al cargar detalles del producto:", error);
    }
}
