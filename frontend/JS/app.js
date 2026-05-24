
// =====================================================================
//  ARRANQUE DE LA APLICACIÓN
// =====================================================================

// Se ejecuta al cargar la página. Decide si mostrar el login o la app.
window.onload = function () {
    // Permitir login con Enter en los campos de usuario/contraseña.
    var campoUser = document.getElementById("login-username");
    var campoPass = document.getElementById("login-password");
    if (campoUser) campoUser.addEventListener("keydown", loginAlPresionarEnter);
    if (campoPass) campoPass.addEventListener("keydown", loginAlPresionarEnter);

    // ¿Hay una sesión guardada (token) de una visita anterior?
    if (recuperarSesion()) {
        // Sí: ocultamos login y arrancamos la app directamente.
        ocultarVistaLogin();
        iniciarAplicacion();
    } else {
        // No: mostramos el login y esperamos a que el usuario entre.
        mostrarVistaLogin();
    }
};

// Carga todos los datos del backend y prepara la interfaz.
// Se llama tras un login exitoso, o al recargar con sesión activa.
// (En la Fase 2 conectaremos las funciones de carga reales; por ahora
//  esta función ya deja la app lista y la vista inicial visible.)
async function iniciarAplicacion() {
    mostrarLoader("Conectando con el servidor...");

    try {
        // Mostramos el nombre del usuario en el sidebar.
        actualizarInfoUsuario();

        // Carga de catálogos desde el backend (se implementa en Fase 2).
        // Dejamos el await preparado para que la Fase 2 solo rellene el cuerpo.
        await cargarTodosLosDatos();
    } catch (error) {
        mostrarNotificacion("Error al cargar datos: " + error.message, "error");
    } finally {
        ocultarLoader();
    }

    // Inicio una venta nueva vacía.
    crearNuevaVenta();
    actualizarBotonVentaAbierta();
    mostrarVista("vista-nueva-venta");

    // Cierro modales al hacer clic en el fondo oscuro.
    enlazarCierreModales();
}

// Muestra el nombre y rol del usuario logueado en el sidebar, y enlaza logout.
function actualizarInfoUsuario() {
    var cont = document.getElementById("info-usuario");
    if (!cont || !usuarioActual) return;
    cont.innerHTML =
        '<div class="usuario-nombre">' + usuarioActual.nombre + '</div>' +
        '<div class="usuario-rol">' + usuarioActual.role + '</div>' +
        '<button class="btn-logout" onclick="confirmarCerrarSesion()">Cerrar sesión</button>';
}

function confirmarCerrarSesion() {
    if (confirm("¿Cerrar sesión?")) {
        cerrarSesion(false);
    }
}

// Enlaza el cierre de modales al hacer clic en el fondo. Es tolerante: si un
// modal no existe (porque aún no está en el HTML), lo salta sin romperse.
function enlazarCierreModales() {
    var modales = [
        ["modal-cobro", cerrarModalCobro],
        ["modal-producto", cerrarFormularioProducto],
        ["modal-eliminar", cerrarModalEliminar],
        ["modal-entidad", cerrarFormularioEntidad],
        ["modal-editar-en-venta", cerrarFormularioProductoEnVenta]
    ];
    for (var i = 0; i < modales.length; i++) {
        (function (id, fnCerrar) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener("click", function (e) {
                    if (e.target === this) fnCerrar();
                });
            }
        })(modales[i][0], modales[i][1]);
    }
}
