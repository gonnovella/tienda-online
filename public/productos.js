import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

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

// Obtener productos desde Firestore
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

        if (productos.length === 0) {
            console.warn("No hay productos en Firestore.");
        }

        mostrarProductos(productos);
        cargarFiltros();
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

// Mostrar productos en la página con botón de detalles
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
                        <button class="btn btn-primary" onclick="mostrarDetalles(${index})">Ver Detalles</button>
                    </div>
                </div>
            </div>
        `;
    });
}



// Función para abrir el modal con los detalles del producto seleccionado
window.mostrarDetalles = function(index) {
    const producto = productos[index];

    // Verificar si `images` existe y es un array, si no, usar una imagen por defecto
    const imagenesContainer = document.getElementById("productoImagenes");
    imagenesContainer.innerHTML = "";

    const imagenes = producto.images && Array.isArray(producto.images) ? producto.images : [producto.imageUrl];

    imagenes.forEach((img, i) => {
        imagenesContainer.innerHTML += `
            <div class="carousel-item ${i === 0 ? "active" : ""}">
                <img src="${img}" class="d-block w-100" alt="${producto.name}">
            </div>
        `;
    });

    // Cargar detalles del producto en el modal
    document.getElementById("productoNombre").textContent = producto.name;
    document.getElementById("productoDescripcion").textContent = producto.description || "Descripción no disponible.";
    document.getElementById("productoPrecio").textContent = `$${producto.price.toFixed(2)}`;

    // Cargar las tallas disponibles
    const tallaSelect = document.getElementById("tallaSelect");
    tallaSelect.innerHTML = "";
    Object.keys(producto.sizes || {}).forEach(talla => {
        tallaSelect.innerHTML += `<option value="${talla}">${talla} - Stock: ${producto.sizes[talla]}</option>`;
    });

    // Configurar el botón "Agregar al Carrito"
    document.getElementById("agregarCarritoBtn").onclick = function() {
        agregarAlCarrito(producto.id, tallaSelect.value);
    };

    // Mostrar el modal
    new bootstrap.Modal(document.getElementById("productoModal")).show();
};

// Función para agregar producto al carrito
window.agregarAlCarrito = function(productId, talla) {
    alert(`Producto ${productId} (Talla: ${talla}) agregado al carrito`);
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


// Cargar productos al iniciar
window.onload = cargarProductos;
