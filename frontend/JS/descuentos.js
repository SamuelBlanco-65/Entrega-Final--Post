
// =====================================================================
//  GESTIÓN DE DESCUENTOS (CRUD) — pantalla de administración
//  El backend (Hito 2) ya tiene el CRUD; aquí está la interfaz.
//  Crear/editar/eliminar exige rol ADMIN (el backend valida con 403).
// =====================================================================

// Descuento que se está editando (null = creando uno nuevo).
var descuentoEditando = null;

function cargarTablaDescuentos() {
    var vacio = document.getElementById("descuentos-vacio");
    var tabla = document.getElementById("tabla-descuentos");
    var filas = document.getElementById("filas-descuentos");

    if (!listaDescuentosTodos || listaDescuentosTodos.length === 0) {
        if (vacio) vacio.classList.remove("oculto");
        if (tabla) tabla.classList.add("oculto");
        return;
    }
    if (vacio) vacio.classList.add("oculto");
    if (tabla) tabla.classList.remove("oculto");

    var html = "";
    for (var i = 0; i < listaDescuentosTodos.length; i++) {
        var d = listaDescuentosTodos[i];
        var valorTxt = d.tipo === "porcentaje" ? d.valor + "%" : formatearPrecio(d.valor);
        var tipoTxt = d.tipo === "porcentaje" ? "Porcentaje" : "Valor fijo";
        var estadoBadge = d.activo
            ? '<span class="badge-estado badge-corregida">Activo</span>'
            : '<span class="badge-estado badge-anulada">Inactivo</span>';

        // Botones: editar para todos; eliminar solo ADMIN.
        var acciones = '<button class="btn-tabla" onclick="abrirFormularioDescuento(\'' + d.id + '\')">✎ Editar</button>';
        acciones += botonEliminarSiAdmin("abrirModalEliminarDescuento(\'" + d.id + "\')");

        html +=
            '<tr>' +
                '<td>' + d.nombre + '</td>' +
                '<td>' + tipoTxt + '</td>' +
                '<td class="texto-precio">' + valorTxt + '</td>' +
                '<td>' + estadoBadge + '</td>' +
                '<td>' + acciones + '</td>' +
            '</tr>';
    }
    filas.innerHTML = html;
}

// Abre el formulario. idONuevo = "nuevo" para crear, o el id para editar.
function abrirFormularioDescuento(idONuevo) {
    var titulo = document.getElementById("titulo-form-descuento");
    var errores = document.getElementById("errores-descuento");
    errores.classList.add("oculto");
    errores.innerHTML = "";

    if (idONuevo === "nuevo" || idONuevo === undefined) {
        descuentoEditando = null;
        titulo.textContent = "Nuevo descuento";
        document.getElementById("descuento-nombre").value = "";
        document.getElementById("descuento-tipo").value = "porcentaje";
        document.getElementById("descuento-valor").value = "";
        document.getElementById("descuento-activo").checked = true;
    } else {
        // Editar: buscar el descuento y precargar.
        var d = null;
        for (var i = 0; i < listaDescuentosTodos.length; i++) {
            if (listaDescuentosTodos[i].id == idONuevo) { d = listaDescuentosTodos[i]; break; }
        }
        if (!d) { mostrarNotificacion("Descuento no encontrado", "error"); return; }
        descuentoEditando = d;
        titulo.textContent = "Editar descuento";
        document.getElementById("descuento-nombre").value = d.nombre;
        document.getElementById("descuento-tipo").value = d.tipo;
        document.getElementById("descuento-valor").value = d.valor;
        document.getElementById("descuento-activo").checked = d.activo;
    }
    actualizarPistaValorDescuento();
    document.getElementById("modal-descuento").classList.remove("oculto");
}

function cerrarFormularioDescuento() {
    document.getElementById("modal-descuento").classList.add("oculto");
    descuentoEditando = null;
}

// Muestra una pista según el tipo (% o $) para guiar al usuario.
function actualizarPistaValorDescuento() {
    var tipo = document.getElementById("descuento-tipo").value;
    var pista = document.getElementById("pista-valor-descuento");
    if (!pista) return;
    pista.textContent = tipo === "porcentaje"
        ? "Porcentaje entre 1 y 100 (ej. 20 = 20%)."
        : "Valor en pesos, múltiplo de 50 (ej. 1000).";
}

async function guardarDescuento() {
    var nombre = document.getElementById("descuento-nombre").value.trim();
    var tipo = document.getElementById("descuento-tipo").value;
    var valorTexto = document.getElementById("descuento-valor").value;
    var activo = document.getElementById("descuento-activo").checked;
    var errores = document.getElementById("errores-descuento");

    // Validaciones básicas en cliente (el backend valida de forma autoritativa).
    var listaErrores = [];
    if (nombre === "") listaErrores.push("El nombre es obligatorio.");
    var valor = parseInt(valorTexto);
    if (isNaN(valor) || valor <= 0) {
        listaErrores.push("El valor debe ser un número mayor a cero.");
    } else if (tipo === "porcentaje" && valor > 100) {
        listaErrores.push("Un porcentaje no puede ser mayor a 100.");
    } else if (tipo === "valor_fijo" && valor % 50 !== 0) {
        listaErrores.push("El valor fijo debe ser múltiplo de 50.");
    }
    if (listaErrores.length > 0) {
        errores.innerHTML = listaErrores.map(function (e) { return "• " + e; }).join("<br>");
        errores.classList.remove("oculto");
        return;
    }

    var cuerpo = { nombre: nombre, tipo: tipo, valor: valor, activo: activo };

    mostrarLoader("Guardando descuento...");
    try {
        if (descuentoEditando == null) {
            await apiPost("/descuentos", cuerpo);
            mostrarNotificacion("Descuento creado correctamente", "exito");
        } else {
            await apiPut("/descuentos/" + descuentoEditando.id, cuerpo);
            mostrarNotificacion("Descuento actualizado correctamente", "exito");
        }
        cerrarFormularioDescuento();
        await cargarDescuentosDesdeAPI();
        cargarTablaDescuentos();
    } catch (error) {
        errores.innerHTML = "• " + error.message;
        errores.classList.remove("oculto");
    } finally {
        ocultarLoader();
    }
}

// --- Eliminar descuento ---
var descuentoAEliminar = null;

function abrirModalEliminarDescuento(id) {
    descuentoAEliminar = id;
    document.getElementById("texto-eliminar-descuento").textContent =
        "¿Eliminar este descuento? Esta acción no se puede deshacer.";
    document.getElementById("modal-eliminar-descuento").classList.remove("oculto");
}

function cerrarModalEliminarDescuento() {
    document.getElementById("modal-eliminar-descuento").classList.add("oculto");
    descuentoAEliminar = null;
}

async function ejecutarEliminacionDescuento() {
    if (descuentoAEliminar == null) return;
    mostrarLoader("Eliminando descuento...");
    try {
        await apiDelete("/descuentos/" + descuentoAEliminar);
        await cargarDescuentosDesdeAPI();
        cargarTablaDescuentos();
        mostrarNotificacion("Descuento eliminado correctamente", "exito");
    } catch (error) {
        mostrarNotificacion("No se pudo eliminar: " + error.message, "error");
    } finally {
        ocultarLoader();
        descuentoAEliminar = null;
        cerrarModalEliminarDescuento();
    }
}
