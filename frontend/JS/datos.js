
// URL base del backend REST (Express).
// Detecta automáticamente el entorno:
//   - En local (localhost / 127.0.0.1 / Live Server): usa el backend local.
//   - En producción (cualquier otro dominio): usa la URL del backend desplegado.
// IMPORTANTE: reemplaza la URL de producción por la de TU backend en Render
// una vez lo hayas desplegado (termina en .onrender.com).
var API_URL = (function () {
    var host = window.location.hostname;
    var esLocal = host === "localhost" || host === "127.0.0.1" || host === "";
    if (esLocal) {
        return "http://localhost:3000/api";
    }
    // <-- CAMBIA ESTA URL por la de tu backend desplegado en Render:
    return "https://papel-y-luna-backend.onrender.com/api";
})();

// ---- VARIABLES GLOBALES ----

// Lista de productos cargada desde la API
var listaProductos = [];

// Lista de ventas cargada desde la API
var listaVentas = [];

// Lista de clientes, proveedores y categorias
var listaClientes = [];
var listaProveedores = [];
var listaCategorias = [];
var listaDescuentos = [];
var listaDescuentosTodos = [];

// La venta que está abierta en este momento
var ventaActual = null;

// Venta en estado "abierta" (guardada para retomar)
var ventaAbierta = null;

// IDs para edicion y eliminacion
var idProductoEditando = null;
var idProductoAEliminar = null;
var entidadEditando = null;      // para clientes, proveedores, categorias
var entidadAEliminar = null;

// Para navegacion de factura
var vistaAnteriorFactura = "vista-historial";
var idUltimaVentaCerrada = null;


// ---- VENTA ABIERTA EN LOCALSTORAGE ----
// La unica cosa que guardamos localmente es la venta
// que esta en curso, para poder retomar si el usuario
// cierra y vuelve a abrir la pagina

function guardarVentaAbiertaLocal() {
    if (ventaActual && ventaActual.items.length > 0) {
        localStorage.setItem("venta_abierta_pos", JSON.stringify(ventaActual));
    } else {
        localStorage.removeItem("venta_abierta_pos");
    }
}

function cargarVentaAbiertaLocal() {
    var guardada = localStorage.getItem("venta_abierta_pos");
    if (guardada != null) {
        ventaAbierta = JSON.parse(guardada);
    }
}

function borrarVentaAbiertaLocal() {
    localStorage.removeItem("venta_abierta_pos");
    ventaAbierta = null;
}


// ---- FUNCIONES DE UTILIDAD ----

function formatearPrecio(numero) {
    var n = Number(numero);
    if (isNaN(n)) return "$ 0";
    return "$ " + n.toLocaleString("es-CO");
}

function formatearFecha(fechaISO) {
    var fecha = new Date(fechaISO);
    var dia = fecha.toLocaleDateString("es-CO");
    var hora = fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    return dia + " " + hora;
}

function generarId(prefijo) {
    return prefijo + "-" + Date.now();
}

function generarCodigoProducto() {
    var numero = listaProductos.length + 1;
    return "PROD-" + String(numero).padStart(4, "0");
}

// ---- FUNCIONES DE VALIDACION ----

// Valida que un valor sea un precio valido en pesos colombianos:
// - Sin decimales (no existen centavos en Colombia)
// - Multiplo de 50 (denominacion minima: moneda de 50 pesos)
// - Mayor a 0
// Retorna un mensaje de error o null si es valido
function validarPrecioCOP(texto, etiqueta) {
    texto = String(texto).trim();

    if (texto == "") {
        return etiqueta + " es obligatorio.";
    }

    // No permite decimales
    if (texto.indexOf(".") != -1 || texto.indexOf(",") != -1) {
        return etiqueta + " no puede tener decimales. En Colombia no existen centavos.";
    }

    // No permite cero inicial (ej: 0500 no es valido)
    if (texto.length > 1 && texto[0] == "0") {
        return etiqueta + " no puede empezar con cero. Ejemplo válido: 4500";
    }

    var numero = parseInt(texto);

    if (isNaN(numero)) {
        return etiqueta + " debe ser un número válido.";
    }

    if (numero < 0) {
        return etiqueta + " no puede ser negativo.";
    }

    if (numero == 0) {
        return etiqueta + " debe ser mayor a cero.";
    }

    // La denominacion minima en Colombia es 50 pesos
    if (numero % 50 != 0) {
        return etiqueta + " debe ser múltiplo de 50 (denominación mínima en Colombia). Ejemplo: 50, 100, 4500, 18000.";
    }

    return null; // Sin errores
}

// Valida que un valor sea una cantidad entera positiva sin cero inicial
function validarCantidadEntera(texto, etiqueta) {
    texto = String(texto).trim();

    if (texto == "") {
        return etiqueta + " es obligatoria.";
    }

    // No permite decimales
    if (texto.indexOf(".") != -1 || texto.indexOf(",") != -1) {
        return etiqueta + " debe ser un número entero, sin decimales.";
    }

    // No permite cero inicial
    if (texto.length > 1 && texto[0] == "0") {
        return etiqueta + " no puede empezar con cero. Ejemplo válido: 10";
    }

    var numero = parseInt(texto);

    if (isNaN(numero) || numero <= 0) {
        return etiqueta + " debe ser mayor a cero.";
    }

    return null;
}

// Valida formato de correo electronico segun estandar RFC 5321
// - Local part: letras, numeros, puntos, guiones, guiones bajos (max 64 chars)
// - No puede empezar ni terminar con punto
// - No puede tener puntos consecutivos
// - Dominio: letras, numeros, guiones (max 253 chars total)
// - Dominio debe tener al menos un punto
// - Extension minima de 2 caracteres
function validarCorreo(correo) {
    correo = String(correo).trim();

    if (correo == "") return null; // El correo es opcional

    // Longitud total maxima segun RFC 5321
    if (correo.length > 254) {
        return "El correo es demasiado largo (máximo 254 caracteres).";
    }

    // Debe tener exactamente un arroba
    var partes = correo.split("@");
    if (partes.length != 2) {
        return "El correo debe tener exactamente un símbolo @.";
    }

    var local = partes[0];
    var dominio = partes[1];

    // Validar parte local (antes del @)
    if (local.length == 0 || local.length > 64) {
        return "La parte antes del @ debe tener entre 1 y 64 caracteres.";
    }

    // No puede empezar ni terminar con punto
    if (local[0] == "." || local[local.length - 1] == ".") {
        return "El correo no puede empezar ni terminar con punto antes del @.";
    }

    // No puede tener puntos consecutivos
    if (local.indexOf("..") != -1) {
        return "El correo no puede tener puntos consecutivos.";
    }

    // Solo caracteres permitidos en la parte local
    var regexLocal = /^[a-zA-Z0-9._%+\-]+$/;
    if (!regexLocal.test(local)) {
        return "El correo contiene caracteres no permitidos antes del @.";
    }

    // Validar dominio (despues del @)
    if (dominio.length == 0 || dominio.length > 253) {
        return "El dominio del correo no es válido.";
    }

    // Dominio debe tener al menos un punto
    if (dominio.indexOf(".") == -1) {
        return "El dominio del correo debe tener al menos un punto. Ejemplo: gmail.com";
    }

    // No puede empezar ni terminar con punto o guion
    if (dominio[0] == "." || dominio[0] == "-" || dominio[dominio.length - 1] == "." || dominio[dominio.length - 1] == "-") {
        return "El dominio del correo no puede empezar ni terminar con punto o guion.";
    }

    // Extension minima de 2 caracteres (ej: .co, .com)
    var extension = dominio.split(".").pop();
    if (extension.length < 2) {
        return "La extensión del correo debe tener al menos 2 caracteres. Ejemplo: .com, .co";
    }

    // Solo caracteres validos en el dominio
    var regexDominio = /^[a-zA-Z0-9.\-]+$/;
    if (!regexDominio.test(dominio)) {
        return "El dominio del correo contiene caracteres no permitidos.";
    }

    return null; // Sin errores
}

// Valida un numero de telefono colombiano
// Acepta: moviles (3XX), fijos (60X), con o sin indicativo internacional
function validarTelefono(telefono) {
    telefono = String(telefono).trim();

    if (telefono == "") return null; // El telefono es opcional

    // Elimino espacios, guiones y parentesis para contar digitos
    var soloNumeros = telefono.replace(/[\s\-\(\)\+]/g, "");

    if (!/^\d+$/.test(soloNumeros)) {
        return "El teléfono solo puede contener números, espacios, guiones y paréntesis.";
    }

    // Con indicativo internacional de Colombia (+57) son 12 digitos
    // Sin indicativo: movil 10 digitos, fijo 7-8 digitos
    if (soloNumeros.length < 7 || soloNumeros.length > 12) {
        return "El teléfono debe tener entre 7 y 12 dígitos.";
    }

    return null;
}
