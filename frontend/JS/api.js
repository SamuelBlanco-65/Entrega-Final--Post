
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
function cerrarSesion(fueSesionExpirada) {
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
//  STUB TEMPORAL (FASE 1) — se reemplaza en la Fase 2
// =====================================================================
// La Fase 2 implementará la carga real de productos, ventas, clientes, etc.
// Por ahora esta función vacía permite que la app arranque tras el login
// sin error, para poder probar el login de forma aislada.
async function cargarTodosLosDatos() {
    // Fase 2: aquí irán las llamadas reales (apiGet("/productos"), etc.)
    return;
}
