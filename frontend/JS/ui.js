
var timerNotificacion;

function mostrarVista(idVista) {
    var todasLasVistas = document.querySelectorAll(".vista");
    for (var i = 0; i < todasLasVistas.length; i++) {
        todasLasVistas[i].classList.remove("activa");
    }
    var vistaObjetivo = document.getElementById(idVista);
    if (vistaObjetivo) vistaObjetivo.classList.add("activa");

    var todosLosBotones = document.querySelectorAll(".boton-nav");
    for (var j = 0; j < todosLosBotones.length; j++) {
        todosLosBotones[j].classList.remove("activo");
    }

    // Resaltamos el botón del menú cuyo onclick referencia esta vista.
    // Es robusto frente a cambios de orden o nuevos botones (no usa índices).
    for (var k = 0; k < todosLosBotones.length; k++) {
        var accion = todosLosBotones[k].getAttribute("onclick") || "";
        var dataVista = todosLosBotones[k].getAttribute("data-vista") || "";
        if (accion.indexOf("'" + idVista + "'") !== -1 || dataVista === idVista) {
            todosLosBotones[k].classList.add("activo");
            break;
        }
    }
}

function mostrarNotificacion(mensaje, tipo) {
    var caja = document.getElementById("notificacion");
    caja.textContent = mensaje;
    if (tipo == "exito") {
        caja.className = "visible exito";
    } else if (tipo == "error") {
        caja.className = "visible error";
    } else {
        caja.className = "visible";
    }
    clearTimeout(timerNotificacion);
    timerNotificacion = setTimeout(function () {
        caja.className = "";
    }, 2800);
}

// Muestra u oculta el loader global de la pagina
function mostrarLoader(mensaje) {
    document.getElementById("loader-global").classList.remove("oculto");
    document.getElementById("loader-global-texto").textContent = mensaje || "Cargando...";
}

function ocultarLoader() {
    document.getElementById("loader-global").classList.add("oculto");
}

// Reemplaza una imagen que falló al cargar por un placeholder (caja 📦) del
// mismo tamaño, para que el espacio se respete siempre. tam = lado en px.
function imgFallback(img, tam) {
    var ph = document.createElement("div");
    ph.textContent = "📦";
    ph.style.cssText = "width:" + tam + "px;height:" + tam + "px;background-color:var(--color-fondo-calido);" +
        "border:1px solid var(--color-borde);border-radius:6px;display:flex;align-items:center;" +
        "justify-content:center;font-size:" + Math.round(tam*0.4) + "px;flex-shrink:0;";
    if (img.parentNode) img.parentNode.replaceChild(ph, img);
}

// --- Menú hamburguesa para móvil ---
// Abre/cierra el panel de navegación en pantallas pequeñas. En desktop el
// sidebar siempre está visible y estas funciones no tienen efecto visible.
function alternarMenuMovil() {
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("overlay-menu");
    var abierto = sidebar.classList.toggle("menu-abierto");
    if (overlay) overlay.classList.toggle("visible", abierto);
}

function cerrarMenuMovil() {
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("overlay-menu");
    if (sidebar) sidebar.classList.remove("menu-abierto");
    if (overlay) overlay.classList.remove("visible");
}

// Al tocar cualquier botón de navegación en móvil, cerrar el menú automáticamente.
document.addEventListener("DOMContentLoaded", function () {
    var botones = document.querySelectorAll(".boton-nav");
    for (var i = 0; i < botones.length; i++) {
        botones[i].addEventListener("click", cerrarMenuMovil);
    }
});
