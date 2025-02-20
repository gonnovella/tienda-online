import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Obtener el primer ID de tienda en Firestore dinámicamente
async function obtenerIdTienda() {
    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (!tiendasSnapshot.empty) {
            const tienda = tiendasSnapshot.docs[0]; // Tomar la primera tienda encontrada
            return tienda.id; // Retornar el ID de la tienda
        }
    } catch (error) {
        console.error("Error obteniendo el ID de la tienda:", error);
    }
    return null;
}

// Cargar productos destacados en la página principal
async function cargarProductosDestacados() {
    const productosContainer = document.getElementById("productosDestacados");

    try {
        const storeId = await obtenerIdTienda();
        if (!storeId) {
            console.error("No se encontró ninguna tienda en Firestore.");
            return;
        }

        const productosSnapshot = await getDocs(collection(db, "stores", storeId, "products"));
        productosContainer.innerHTML = ""; // Limpiar antes de mostrar productos

        productosSnapshot.forEach((doc) => {
            const producto = doc.data();
            productosContainer.innerHTML += `
                <div class="col">
                    <div class="card h-100">
                        <img src="${producto.imageUrl}" class="card-img-top" alt="${producto.name}">
                        <div class="card-body">
                            <h5 class="card-title">${producto.name}</h5>
                            <p class="card-text">$${producto.price.toFixed(2)}</p>
                            <a href="productos.html" class="btn btn-primary">Ver Producto</a>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

// Ejecutar la función al cargar la página
window.onload = cargarProductosDestacados;
