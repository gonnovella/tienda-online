import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Verificar si el usuario es admin antes de cargar el dashboard
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("❌ Acceso denegado. Debes iniciar sesión como administrador.");
        window.location.href = "index.html";
        return;
    }

    console.log("✅ Usuario autenticado:", user.email);

    if (user.email !== "admin@tuweb.com") {
        alert("❌ Acceso denegado. Solo el administrador puede acceder.");
        window.location.href = "index.html";
        return;
    }

    // Intentar obtener productos después de la autenticación
    await cargarProductos();
});

// ✅ Función para cargar los productos en el panel de admin
async function cargarProductos() {
    console.log("🔄 Cargando productos...");
    const tablaProductos = document.getElementById("tablaProductos");
    tablaProductos.innerHTML = "";

    try {
        const tiendasSnapshot = await getDocs(collection(db, "stores"));
        if (tiendasSnapshot.empty) throw new Error("❌ No se encontró ninguna tienda en Firestore.");
        const storeId = tiendasSnapshot.docs[0].id;

        const productosSnapshot = await getDocs(collection(db, "stores", storeId, "products"));

        productosSnapshot.forEach((doc) => {
            const producto = doc.data();
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${producto.name}</td>
                <td>$${producto.price.toFixed(2)}</td>
                <td>${producto.stock}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editarProducto('${doc.id}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${doc.id}')">Eliminar</button>
                </td>
            `;

            tablaProductos.appendChild(row);
        });

        console.log("✅ Productos cargados correctamente.");
    } catch (error) {
        console.error("❌ Error cargando productos:", error);
    }
}

window.editarProducto = async function (id) {
    console.log("✏️ Editando producto ID:", id);

    const tiendasSnapshot = await getDocs(collection(db, "stores"));
    if (tiendasSnapshot.empty) {
        console.error("❌ No se encontró ninguna tienda en Firestore.");
        return;
    }

    const storeId = tiendasSnapshot.docs[0].id;
    const productoRef = doc(db, "stores", storeId, "products", id);

    try {
        // Obtener los datos actuales del producto
        const productoSnap = await getDoc(productoRef);
        if (!productoSnap.exists()) {
            console.error("❌ Producto no encontrado en Firestore.");
            return;
        }

        const producto = productoSnap.data();

        // Mostrar formulario de edición con los valores actuales
        const nuevoNombre = prompt("Nuevo nombre del producto:", producto.name);
        const nuevoPrecio = parseFloat(prompt("Nuevo precio:", producto.price));
        const nuevoStock = parseInt(prompt("Nuevo stock:", producto.stock));

        if (!nuevoNombre || isNaN(nuevoPrecio) || isNaN(nuevoStock)) {
            alert("❌ Datos inválidos. Inténtalo de nuevo.");
            return;
        }

        // Actualizar el producto en Firestore
        await updateDoc(productoRef, {
            name: nuevoNombre,
            price: nuevoPrecio,
            stock: nuevoStock
        });

        alert("✅ Producto actualizado correctamente.");
        window.location.reload();
    } catch (error) {
        console.error("❌ Error al actualizar producto:", error);
        alert("Hubo un error al actualizar el producto.");
    }
};

// ✅ Función para eliminar un producto
window.eliminarProducto = async function (id) {
    console.log("🗑️ Eliminando producto ID:", id);

    const tiendasSnapshot = await getDocs(collection(db, "stores"));
    if (tiendasSnapshot.empty) {
        console.error("❌ No se encontró ninguna tienda en Firestore.");
        return;
    }

    const storeId = tiendasSnapshot.docs[0].id;
    const productoRef = doc(db, "stores", storeId, "products", id);

    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        return;
    }

    try {
        await deleteDoc(productoRef);
        alert("✅ Producto eliminado correctamente.");
        window.location.reload();
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
        alert("Hubo un error al eliminar el producto.");
    }
};
