
var timerNotificacion;

function mostrarVista(idVista) {
    var todasLasVistas = document.querySelectorAll(".vista");
    for (var i = 0; i < todasLasVistas.length; i++) {
        todasLasVistas[i].classList.remove("activa");
    }
    document.getElementById(idVista).classList.add("activa");

    var todosLosBotones = document.querySelectorAll(".boton-nav");
    for (var j = 0; j < todosLosBotones.length; j++) {
        todosLosBotones[j].classList.remove("activo");
    }

    // Resalto el boton del menu que corresponde a la vista
    var mapa = {
        "vista-nueva-venta": 0,
        "vista-historial": 1,
        "vista-productos": 2,
        "vista-compras": 3,
        "vista-clientes": 4,
        "vista-proveedores": 5,
        "vista-categorias": 6
    };

    if (mapa[idVista] !== undefined) {
        todosLosBotones[mapa[idVista]].classList.add("activo");
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
