
// =====================================================================
//  CAPA DE COMUNICACIÓN CON EL BACKEND REST (Express + JWT)
//  Reemplaza la antigua conexión a Google Sheets.
// =====================================================================

// ---- FUNCIÓN CENTRAL ----
// Todas las peticiones al backend pasan por aquí. Se encarga de:
//   1. Anteponer la URL base del backend (API_URL, definida en datos.js).
//   2. Adjuntar el token JWT en el header Authorization (si hay sesión).
//   3. Enviar y recibir JSON.
//   4. Interpretar los errores del backend ({ error: "..." }).
//   5. Si el backend responde 401 (token ausente o vencido), cerrar sesión
//      y devolver al login.
//
// Parámetros:
//   metodo  -> "GET" | "POST" | "PUT" | "DELETE"
//   ruta    -> ruta relativa que empieza con "/", ej. "/productos"
//   body    -> objeto JS a enviar (opcional; solo para POST/PUT)
async function apiRequest(metodo, ruta, body) {
    var opciones = {
        method: metodo,
        headers: { "Content-Type": "application/json" }
    };

    // Adjuntar token si existe una sesión iniciada.
    var token = obtenerToken();
    if (token) {
        opciones.headers["Authorization"] = "Bearer " + token;
    }

    // Adjuntar cuerpo en métodos que lo permiten.
    if (body !== undefined && body !== null) {
        opciones.body = JSON.stringify(body);
    }

    var respuesta;
    try {
        respuesta = await fetch(API_URL + ruta, opciones);
    } catch (errorRed) {
        // Falla de red: el backend no responde (apagado, CORS, URL mal).
        throw new Error("No se pudo conectar con el servidor. ¿Está encendido el backend?");
    }

    // 401 = no autenticado / token vencido -> cerrar sesión y volver al login.
    if (respuesta.status === 401) {
        cerrarSesion(true); // true = fue por sesión expirada
        throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
    }

    // Intentar parsear el cuerpo como JSON (puede venir vacío en algunos 204).
    var datos = null;
    var texto = await respuesta.text();
    if (texto) {
        try { datos = JSON.parse(texto); } catch (e) { datos = null; }
    }

    // Si el status no es 2xx, el backend manda { error: "..." } o
    // { errors: [...] } (express-validator). Extraemos el mensaje.
    if (!respuesta.ok) {
        var mensaje = "Error " + respuesta.status;
        if (datos) {
            if (datos.error) {
                mensaje = datos.error;
            } else if (datos.errors && datos.errors.length > 0) {
                // express-validator: tomamos el primer mensaje legible.
                mensaje = datos.errors.map(function (e) { return e.msg; }).join(" · ");
            }
        }
        throw new Error(mensaje);
    }

    return datos;
}

// Atajos legibles que usará el resto del código en las próximas fases.
function apiGet(ruta) { return apiRequest("GET", ruta, null); }
function apiPost(ruta, body) { return apiRequest("POST", ruta, body); }
function apiPut(ruta, body) { return apiRequest("PUT", ruta, body); }
function apiDelete(ruta, body) { return apiRequest("DELETE", ruta, body); }


// =====================================================================
//  SESIÓN: TOKEN Y USUARIO (en localStorage)
// =====================================================================

var CLAVE_TOKEN = "pos_token";
var CLAVE_USUARIO = "pos_usuario";

// Usuario actual en memoria (se llena al iniciar sesión o al recargar).
var usuarioActual = null;

function obtenerToken() {
    return localStorage.getItem(CLAVE_TOKEN);
}

function guardarSesion(token, usuario) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    usuarioActual = usuario;
}

// Recupera la sesión guardada (al recargar la página). Devuelve true si hay
// sesión válida en almacenamiento.
function recuperarSesion() {
    var token = localStorage.getItem(CLAVE_TOKEN);
    var usuarioStr = localStorage.getItem(CLAVE_USUARIO);
    if (token && usuarioStr) {
        try {
            usuarioActual = JSON.parse(usuarioStr);
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

// Cierra la sesión: borra token/usuario y muestra el login.
// Si fueSesionExpirada = true, avisamos al usuario del motivo.
// Es idempotente: si ya no hay token, no vuelve a ejecutar (evita que varias
// peticiones en paralelo que reciben 401 disparen el cierre muchas veces).
var cerrandoSesion = false;
function cerrarSesion(fueSesionExpirada) {
    if (cerrandoSesion && !obtenerToken()) return;
    cerrandoSesion = true;

    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    usuarioActual = null;
    mostrarVistaLogin();
    if (fueSesionExpirada) {
        var err = document.getElementById("login-error");
        if (err) {
            err.textContent = "Tu sesión expiró. Inicia sesión de nuevo.";
            err.classList.remove("oculto");
        }
    }
    cerrandoSesion = false;
}

// ¿El usuario actual es ADMIN? (se usará en la Fase 6 para roles en la UI).
function esAdmin() {
    return usuarioActual != null && usuarioActual.role === "ADMIN";
}


// =====================================================================
//  LOGIN
// =====================================================================

// Llama a POST /api/login. Si tiene éxito, guarda la sesión y arranca la app.
async function iniciarSesion() {
    var username = document.getElementById("login-username").value.trim();
    var password = document.getElementById("login-password").value;
    var errorDiv = document.getElementById("login-error");
    var boton = document.getElementById("btn-login");

    errorDiv.classList.add("oculto");
    errorDiv.textContent = "";

    if (username === "" || password === "") {
        errorDiv.textContent = "Escribe usuario y contraseña.";
        errorDiv.classList.remove("oculto");
        return;
    }

    boton.disabled = true;
    boton.textContent = "Ingresando...";

    try {
        // El backend responde { token, tipo, user: {...} }.
        var resp = await apiPost("/login", { username: username, password: password });
        guardarSesion(resp.token, resp.user);

        // Limpio el formulario por seguridad.
        document.getElementById("login-password").value = "";

        // Oculto el login y arranco la aplicación (definida en app.js).
        ocultarVistaLogin();
        await iniciarAplicacion();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove("oculto");
    } finally {
        boton.disabled = false;
        boton.textContent = "Ingresar";
    }
}

// Permite enviar el formulario con la tecla Enter.
function loginAlPresionarEnter(evento) {
    if (evento.key === "Enter") {
        iniciarSesion();
    }
}

function mostrarVistaLogin() {
    document.getElementById("pantalla-login").classList.remove("oculto");
    document.getElementById("app-completa").classList.add("oculto");
}

function ocultarVistaLogin() {
    document.getElementById("pantalla-login").classList.add("oculto");
    document.getElementById("app-completa").classList.remove("oculto");
}




// =====================================================================
//  CARGA DE DATOS DESDE EL BACKEND (FASE 2)
//  Cada función pide datos al backend REST y los TRADUCE al formato que
//  las pantallas existentes ya esperan (capa de traducción). Así no hay
//  que reescribir los renders de productos.js, ventas.js, etc.
// =====================================================================

// Orquesta la carga inicial. ORDEN IMPORTANTE: categorías primero, porque
// la traducción de productos necesita convertir categoriaId -> nombre.
async function cargarTodosLosDatos() {
    // Categorías y entidades primero (productos dependen de categorías).
    await cargarCategoriasDesdeAPI();
    await Promise.all([
        cargarProductosDesdeAPI(),
        cargarClientesDesdeAPI(),
        cargarProveedoresDesdeAPI()
    ]);
    // Ventas y compras al final (no bloquean el catálogo principal).
    await Promise.all([
        cargarVentasDesdeAPI(),
        cargarComprasDesdeAPI(),
        cargarDescuentosDesdeAPI()
    ]);
}

// ---- DESCUENTOS (Hito 2, usados en el cobro - Fase 5) ----
async function cargarDescuentosDesdeAPI() {
    try {
        var datos = await apiGet("/descuentos");
        // Solo descuentos activos sirven para aplicar a una venta.
        listaDescuentos = datos
            .filter(function (d) { return d.activo; })
            .map(function (d) {
                return { id: d.id, nombre: d.nombre, tipo: d.tipo, valor: Number(d.valor), activo: d.activo };
            });
    } catch (error) {
        // Si falla, dejamos la lista vacía (la venta simplemente no ofrecerá descuento).
        listaDescuentos = [];
    }
}

// ---- CATEGORÍAS ----
// El frontend usa { id, nombre }. El backend devuelve lo mismo, pero id es
// número; lo dejamos como número porque el resto del código compara con ==.
async function cargarCategoriasDesdeAPI() {
    try {
        var datos = await apiGet("/categorias");
        listaCategorias = datos.map(function (c) {
            return { id: c.id, nombre: c.nombre };
        });
    } catch (error) {
        mostrarNotificacion("Error al cargar categorías: " + error.message, "error");
        listaCategorias = [];
    }
}

// Helper: dado un categoriaId del backend, devuelve el NOMBRE de la categoría
// (lo que las pantallas muestran). Si no la encuentra (p. ej. la categoría fue
// borrada y quedó un id huérfano), devuelve "Sin categoría" para no mostrar
// un espacio en blanco.
function nombreCategoriaPorId(categoriaId) {
    if (categoriaId == null) return "Sin categoría";
    for (var i = 0; i < listaCategorias.length; i++) {
        if (listaCategorias[i].id == categoriaId) return listaCategorias[i].nombre;
    }
    return "Sin categoría";
}

// Helper inverso: dado un NOMBRE de categoría, devuelve su id (para guardar).
// Se usará en la Fase 3 al crear/editar productos.
function idCategoriaPorNombre(nombre) {
    for (var i = 0; i < listaCategorias.length; i++) {
        if (listaCategorias[i].nombre == nombre) return listaCategorias[i].id;
    }
    return null;
}

// ---- PRODUCTOS ----
// Backend: { id, nombre, categoriaId, precio, costo, stock, controlInventario,
//            codigoInterno, codigoBarras, imagen, unidadVenta }
// Frontend espera: { id, nombre, categoria(texto), precio, costo, stock,
//                    controlInventario, codigo, imagen }
async function cargarProductosDesdeAPI() {
    try {
        var datos = await apiGet("/productos");
        listaProductos = datos.map(function (p) {
            return {
                id: p.id,
                nombre: p.nombre,
                categoria: nombreCategoriaPorId(p.categoriaId), // traducción id->nombre
                categoriaId: p.categoriaId,                     // guardamos el id por si hace falta
                precio: Number(p.precio),
                costo: Number(p.costo),
                stock: (p.stock === null || p.stock === undefined) ? null : Number(p.stock),
                controlInventario: p.controlInventario === true,
                codigo: p.codigoInterno || String(p.id),
                imagen: p.imagen || ""
            };
        });
    } catch (error) {
        mostrarNotificacion("Error al cargar productos: " + error.message, "error");
        listaProductos = [];
    }
}

// ---- CLIENTES ----
async function cargarClientesDesdeAPI() {
    try {
        var datos = await apiGet("/clientes");
        listaClientes = datos.map(function (c) {
            return {
                id: c.id,
                nombre: c.nombre,
                telefono: c.telefono || "",
                correo: c.correo || ""
            };
        });
    } catch (error) {
        mostrarNotificacion("Error al cargar clientes: " + error.message, "error");
        listaClientes = [];
    }
}

// ---- PROVEEDORES ----
async function cargarProveedoresDesdeAPI() {
    try {
        var datos = await apiGet("/proveedores");
        listaProveedores = datos.map(function (p) {
            return {
                id: p.id,
                nombre: p.nombre,
                telefono: p.telefono || "",
                correo: p.correo || ""
            };
        });
    } catch (error) {
        mostrarNotificacion("Error al cargar proveedores: " + error.message, "error");
        listaProveedores = [];
    }
}

// ---- VENTAS ----
// Backend: lista con { id, estado, metodoPago, clienteId, total, createdAt,
//   modificadaPor, descuentoMonto, items:[{ productoId, nombreSnapshot,
//   precioUnitario, cantidad, subtotal }] }  (el list puede no traer items;
//   por eso normalizamos con cuidado).
// Frontend espera: { id, cerradoEn, total, cliente(texto), pago:{metodo,...},
//   items:[{ idProducto, nombre, precio, cantidad }], estado }
async function cargarVentasDesdeAPI() {
    try {
        var datos = await apiGet("/ventas");
        listaVentas = datos.map(traducirVenta);
    } catch (error) {
        mostrarNotificacion("Error al cargar ventas: " + error.message, "error");
        listaVentas = [];
    }
}

// Traduce UNA venta del backend al formato del frontend. Se reutiliza en
// fases posteriores (corrección, reembolsos) al recargar una venta concreta.
function traducirVenta(v) {
    var items = (v.items || []).map(function (it) {
        return {
            idProducto: it.productoId,
            nombre: it.nombreSnapshot,
            precio: Number(it.precioUnitario),
            cantidad: Number(it.cantidad),
            ventaItemId: it.id   // id real del VentaItem, necesario para reembolsos (Fase 5)
        };
    });

    // Nombre de cliente: el backend da clienteId; buscamos su nombre si lo tenemos.
    var nombreCliente = "";
    if (v.clienteId) {
        for (var i = 0; i < listaClientes.length; i++) {
            if (listaClientes[i].id == v.clienteId) { nombreCliente = listaClientes[i].nombre; break; }
        }
    }

    return {
        id: v.id,
        cerradoEn: v.createdAt,
        total: Number(v.total),
        estado: v.estado,
        clienteId: v.clienteId,
        cliente: nombreCliente,
        pago: {
            metodo: v.metodoPago,
            valorRecibido: v.efectivoRecibido,
            cambio: v.cambio
        },
        descuentoMonto: Number(v.descuentoMonto || 0),
        modificadaPor: v.modificadaPor || null,
        fueCorregida: v.fueCorregida === true,          // bandera del Hito 3
        resumenReembolso: v.resumenReembolso || null,   // resumen del Hito 3
        items: items
    };
}

// ---- COMPRAS ----
// Backend: { id, proveedorId, metodoPago, total, createdAt,
//   items:[{ productoId, nombreSnapshot, costoUnitario, cantidad }] }
// Frontend (compras.js) espera: { id, fecha, proveedorId, metodoPago, total,
//   items:[{ idProducto, nombre, costo, cantidad }] }
async function cargarComprasDesdeAPI() {
    try {
        var datos = await apiGet("/compras");
        listaCompras = datos.map(function (c) {
            var items = (c.items || []).map(function (it) {
                return {
                    idProducto: it.productoId,
                    nombre: it.nombreSnapshot,
                    costo: Number(it.costoUnitario),
                    cantidad: Number(it.cantidad)
                };
            });
            return {
                id: c.id,
                fecha: c.createdAt,
                proveedorId: c.proveedorId,
                metodoPago: c.metodoPago,
                total: Number(c.total),
                items: items
            };
        });
    } catch (error) {
        mostrarNotificacion("Error al cargar compras: " + error.message, "error");
        listaCompras = [];
    }
}
