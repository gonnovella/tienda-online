import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// ✅ Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const resumenPedido = document.getElementById("resumenPedido");
const montoPagar = document.getElementById("montoPagar");
const formPago = document.getElementById("formPago");

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let total = 0;

// ✅ Función para mostrar el resumen del pedido
function mostrarResumenPedido() {
    resumenPedido.innerHTML = "";
    total = 0;

    if (carrito.length === 0) {
        resumenPedido.innerHTML = `<li class="list-group-item text-danger">No hay productos en el carrito.</li>`;
        montoPagar.textContent = "$0.00";
        return;
    }

    carrito.forEach(producto => {
        let totalProducto = producto.price * producto.cantidad;
        total += totalProducto;

        resumenPedido.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${producto.name} (Talla: ${producto.talla}) x${producto.cantidad}
                <span>$${totalProducto.toFixed(2)}</span>
            </li>
        `;
    });

    montoPagar.textContent = `$${total.toFixed(2)}`;
}

// ✅ Función para actualizar stock en Firestore después de la compra
async function actualizarStock() {
    try {
        console.log("🔄 Iniciando actualización de stock...");

        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) throw new Error("❌ No se encontró una tienda en Firestore.");
        const storeId = tiendasSnapshot.docs[0].id;

        console.log("✅ Tienda encontrada:", storeId);
        console.log("🛒 Carrito actual:", carrito);

        for (const producto of carrito) {
            const productoRef = doc(db, "stores", storeId, "products", producto.id);
            const productoSnap = await getDoc(productoRef);

            if (!productoSnap.exists()) {
                console.error(`❌ Producto no encontrado en Firestore: ${producto.name}`);
                continue;
            }

            let stockActual = productoSnap.data().sizes || {};
            console.log(`📦 Stock antes de la compra (${producto.name}, Talla ${producto.talla}):`, stockActual[producto.talla]);

            if (stockActual[producto.talla] !== undefined) {
                stockActual[producto.talla] -= producto.cantidad;

                if (stockActual[producto.talla] <= 0) {
                    delete stockActual[producto.talla];
                    console.log(`🚨 La talla ${producto.talla} se ha agotado y se eliminará del producto.`);
                }

                // **Actualizar Firestore**
                await updateDoc(productoRef, { sizes: stockActual });
                console.log(`✅ Stock actualizado en Firestore para ${producto.name}, Talla ${producto.talla}:`, stockActual[producto.talla] || "Eliminada");
            } else {
                console.warn(`⚠️ La talla ${producto.talla} no existe en el producto ${producto.name}`);
            }
        }
    } catch (error) {
        console.error("❌ Error al actualizar stock:", error);
    }
}

// ✅ Función para procesar el pago y guardar el pedido en Firestore
async function procesarPago(email, nombre, direccion) {
    try {
        if (!email || !nombre || !direccion) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        console.log("💳 Procesando pago para:", email);

        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) throw new Error("❌ No se encontró una tienda en Firestore.");
        const storeId = tiendasSnapshot.docs[0].id;

        console.log("📌 Tienda detectada:", storeId);

        // **Guardar el pedido en Firestore**
        await addDoc(collection(db, "stores", storeId, "orders"), {
            email: email,
            nombre: nombre,
            direccion: direccion,
            total: total,
            items: carrito,
            status: "Pendiente",
            timestamp: serverTimestamp()
        });

        console.log("📦 Pedido guardado en Firestore");

        // **Actualizar stock antes de vaciar el carrito**
        await actualizarStock();

        console.log("✅ Stock actualizado correctamente en Firestore");

        // **Vaciar carrito después del pago**
        localStorage.removeItem("carrito");

        alert("¡Pago realizado con éxito! Recibirás un correo con los detalles del pedido.");
        window.location.href = "index.html"; // Redirigir al inicio
    } catch (error) {
        console.error("❌ Error al procesar el pedido:", error);
        alert("Hubo un error al procesar el pago. Inténtalo nuevamente.");
    }
}

// ✅ Manejo del pago en el formulario
formPago.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const nombre = document.getElementById("nombre").value;
    const direccion = document.getElementById("direccion").value;

    if (!email || !nombre || !direccion) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    if (carrito.length === 0) {
        alert("No puedes realizar un pago sin productos en el carrito.");
        return;
    }

    console.log("💳 Iniciando proceso de pago...");

    setTimeout(async () => {
        await procesarPago(email, nombre, direccion);
    }, 2000);
});

// ✅ Cargar el resumen del pedido al abrir la página
mostrarResumenPedido();
