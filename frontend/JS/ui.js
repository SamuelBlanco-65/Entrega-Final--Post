
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
