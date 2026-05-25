
// CLIENTES

function cargarTablaClientes() {
    var vacio = document.getElementById("clientes-vacio");
    var tabla = document.getElementById("tabla-clientes");
    var filas = document.getElementById("filas-clientes");

    if (listaClientes.length == 0) {
        vacio.classList.remove("oculto");
        tabla.classList.add("oculto");
        return;
    }
    vacio.classList.add("oculto");
    tabla.classList.remove("oculto");

    var html = "";
    for (var i = 0; i < listaClientes.length; i++) {
        var c = listaClientes[i];
        html +=
            '<tr>' +
                '<td style="font-weight:500">' + c.nombre + '</td>' +
                '<td>' + (c.telefono || "—") + '</td>' +
                '<td>' + (c.correo || "—") + '</td>' +
                '<td>' +
                    '<div style="display:flex;gap:5px">' +
                        '<button class="btn-tabla" onclick="abrirFormularioEntidad(\'cliente\', \'' + c.id + '\')">✎ Editar</button>' +
                        botonEliminarSiAdmin("abrirModalEliminarEntidad(\'cliente\', \'" + c.id + "\')") +
                    '</div>' +
                '</td>' +
            '</tr>';
    }
    filas.innerHTML = html;
}


// =============================================
// PROVEEDORES
// =============================================

function cargarTablaProveedores() {
    var vacio = document.getElementById("proveedores-vacio");
    var tabla = document.getElementById("tabla-proveedores");
    var filas = document.getElementById("filas-proveedores");

    if (listaProveedores.length == 0) {
        vacio.classList.remove("oculto");
        tabla.classList.add("oculto");
        return;
    }
    vacio.classList.add("oculto");
    tabla.classList.remove("oculto");

    var html = "";
    for (var i = 0; i < listaProveedores.length; i++) {
        var p = listaProveedores[i];
        html +=
            '<tr>' +
                '<td style="font-weight:500">' + p.nombre + '</td>' +
                '<td>' + (p.telefono || "—") + '</td>' +
                '<td>' + (p.correo || "—") + '</td>' +
                '<td>' +
                    '<div style="display:flex;gap:5px">' +
                        '<button class="btn-tabla" onclick="abrirFormularioEntidad(\'proveedor\', \'' + p.id + '\')">✎ Editar</button>' +
                        botonEliminarSiAdmin("abrirModalEliminarEntidad(\'proveedor\', \'" + p.id + "\')") +
                    '</div>' +
                '</td>' +
            '</tr>';
    }
    filas.innerHTML = html;
}


// =============================================
// CATEGORIAS
// =============================================

function cargarTablaCategorias() {
    var vacio = document.getElementById("categorias-vacio");
    var tabla = document.getElementById("tabla-categorias");
    var filas = document.getElementById("filas-categorias");

    if (listaCategorias.length == 0) {
        vacio.classList.remove("oculto");
        tabla.classList.add("oculto");
        return;
    }
    vacio.classList.add("oculto");
    tabla.classList.remove("oculto");

    var html = "";
    for (var i = 0; i < listaCategorias.length; i++) {
        var cat = listaCategorias[i];
        html +=
            '<tr>' +
                '<td style="font-weight:500">' + cat.nombre + '</td>' +
                '<td>' +
                    '<div style="display:flex;gap:5px">' +
                        '<button class="btn-tabla" onclick="abrirFormularioEntidad(\'categoria\', \'' + cat.id + '\')">✎ Editar</button>' +
                        botonEliminarSiAdmin("abrirModalEliminarEntidad(\'categoria\', \'" + cat.id + "\')") +
                    '</div>' +
                '</td>' +
            '</tr>';
    }
    filas.innerHTML = html;
}

// FORMULARIO DE ENTIDADES

function abrirFormularioEntidad(tipo, idONuevo) {
    entidadEditando = { tipo: tipo, id: idONuevo == "nuevo" ? null : idONuevo };

    var titulos = { cliente: "Cliente", proveedor: "Proveedor", categoria: "Categoría" };
    document.getElementById("titulo-form-entidad").textContent =
        (idONuevo == "nuevo" ? "Nueva " : "Editar ") + titulos[tipo];

    // Muestro u oculto el campo de telefono y correo segun el tipo
    var mostrarContacto = tipo == "cliente" || tipo == "proveedor";
    document.getElementById("grupo-telefono").style.display = mostrarContacto ? "" : "none";
    document.getElementById("grupo-correo").style.display = mostrarContacto ? "" : "none";

    document.getElementById("campo-entidad-nombre").value = "";
    document.getElementById("campo-entidad-telefono").value = "";
    document.getElementById("campo-entidad-correo").value = "";

    if (idONuevo != "nuevo") {
        var lista = tipo == "cliente" ? listaClientes : tipo == "proveedor" ? listaProveedores : listaCategorias;
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id == idONuevo) {
                document.getElementById("campo-entidad-nombre").value = lista[i].nombre;
                if (mostrarContacto) {
                    document.getElementById("campo-entidad-telefono").value = lista[i].telefono || "";
                    document.getElementById("campo-entidad-correo").value = lista[i].correo || "";
                }
                break;
            }
        }
    }

    document.getElementById("modal-entidad").classList.remove("oculto");
}

function cerrarFormularioEntidad() {
    document.getElementById("modal-entidad").classList.add("oculto");
    entidadEditando = null;
}

async function guardarEntidad() {
    var nombre = document.getElementById("campo-entidad-nombre").value.trim();
    var tipo = entidadEditando.tipo;
    var telefono = document.getElementById("campo-entidad-telefono").value.trim();
    var correo = document.getElementById("campo-entidad-correo").value.trim();

    // Validaciones
    if (nombre == "") {
        mostrarNotificacion("El nombre es obligatorio", "error");
        return;
    }
    if (nombre.length < 2) {
        mostrarNotificacion("El nombre debe tener al menos 2 caracteres", "error");
        return;
    }

    // Validar telefono usando la funcion robusta de datos.js
    if (tipo == "cliente" || tipo == "proveedor") {
        var errorTel = validarTelefono(telefono);
        if (errorTel) {
            mostrarNotificacion(errorTel, "error");
            return;
        }

        // Validar correo usando la funcion robusta de datos.js (RFC 5321)
        var errorCorreo = validarCorreo(correo);
        if (errorCorreo) {
            mostrarNotificacion(errorCorreo, "error");
            return;
        }
    }

    mostrarLoader("Guardando...");
    try {
        var rutaBase = { cliente: "/clientes", proveedor: "/proveedores", categoria: "/categorias" };

        // Cuerpo según tipo. Categoría solo tiene nombre.
        var cuerpo;
        if (tipo == "categoria") {
            cuerpo = { nombre: nombre };
        } else {
            cuerpo = { nombre: nombre, telefono: telefono || null, correo: correo || null };
        }

        if (entidadEditando.id == null) {
            // CREAR: el backend asigna el id.
            await apiPost(rutaBase[tipo], cuerpo);
            mostrarNotificacion("Creado correctamente", "exito");
        } else {
            // EDITAR
            await apiPut(rutaBase[tipo] + "/" + entidadEditando.id, cuerpo);
            mostrarNotificacion("Actualizado correctamente", "exito");
        }

        cerrarFormularioEntidad();
        // Recargar desde backend y refrescar la tabla correspondiente.
        if (tipo == "cliente") { await cargarClientesDesdeAPI(); cargarTablaClientes(); }
        else if (tipo == "proveedor") { await cargarProveedoresDesdeAPI(); cargarTablaProveedores(); }
        else if (tipo == "categoria") { await cargarCategoriasDesdeAPI(); cargarTablaCategorias(); }

    } catch (error) {
        mostrarNotificacion("Error al guardar: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

function abrirModalEliminarEntidad(tipo, id) {
    entidadAEliminar = { tipo: tipo, id: id };
    var lista = tipo == "cliente" ? listaClientes : tipo == "proveedor" ? listaProveedores : listaCategorias;
    var nombre = "este registro";
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id == id) {
            nombre = '"' + lista[i].nombre + '"';
            break;
        }
    }
    document.getElementById("mensaje-eliminar").textContent =
        "¿Estás seguro de que quieres eliminar " + nombre + "?";
    document.getElementById("modal-eliminar").classList.remove("oculto");
}

async function ejecutarEliminacion() {
    // ELIMINAR ENTIDAD (cliente / proveedor / categoría)
    if (entidadAEliminar != null) {
        var tipo = entidadAEliminar.tipo;
        var id = entidadAEliminar.id;
        // Ruta REST según el tipo. El backend exige rol ADMIN para DELETE.
        var rutaPorTipo = { cliente: "/clientes/", proveedor: "/proveedores/", categoria: "/categorias/" };

        mostrarLoader("Eliminando...");
        try {
            await apiDelete(rutaPorTipo[tipo] + id);
            // Recargamos la lista correspondiente desde el backend.
            if (tipo == "cliente") { await cargarClientesDesdeAPI(); cargarTablaClientes(); }
            else if (tipo == "proveedor") { await cargarProveedoresDesdeAPI(); cargarTablaProveedores(); }
            else if (tipo == "categoria") { await cargarCategoriasDesdeAPI(); cargarTablaCategorias(); }
            mostrarNotificacion("Eliminado correctamente", "exito");
        } catch (error) {
            // Ej.: 403 si no es ADMIN, o error de FK si tiene registros asociados.
            mostrarNotificacion("No se pudo eliminar: " + error.message, "error");
        } finally {
            ocultarLoader();
            entidadAEliminar = null;
            cerrarModalEliminar();
        }
        return;
    }

    // ELIMINAR PRODUCTO
    if (idProductoAEliminar != null) {
        var idProd = idProductoAEliminar;
        mostrarLoader("Eliminando producto...");
        try {
            await apiDelete("/productos/" + idProd);
            await cargarProductosDesdeAPI();
            cargarTablaProductos();
            mostrarNotificacion("Producto eliminado correctamente", "exito");
        } catch (error) {
            mostrarNotificacion("No se pudo eliminar: " + error.message, "error");
        } finally {
            ocultarLoader();
            idProductoAEliminar = null;
            cerrarModalEliminar();
        }
    }
}

function cerrarModalEliminar() {
    document.getElementById("modal-eliminar").classList.add("oculto");
    idProductoAEliminar = null;
    entidadAEliminar = null;
}

// BUSQUEDA EN ENTIDADES

function buscarEnClientes() {
    var texto = document.getElementById("buscador-clientes").value.trim().toLowerCase();
    var filas = document.getElementById("filas-clientes").querySelectorAll("tr");
    var hayResultados = false;

    for (var i = 0; i < filas.length; i++) {
        var contenido = filas[i].textContent.toLowerCase();
        if (contenido.includes(texto)) {
            filas[i].style.display = "";
            hayResultados = true;
        } else {
            filas[i].style.display = "none";
        }
    }

    // Muestro mensaje si no hay resultados
    var sinResultados = document.getElementById("clientes-sin-resultados");
    if (!hayResultados && texto != "") {
        sinResultados.classList.remove("oculto");
    } else {
        sinResultados.classList.add("oculto");
    }
}

function buscarEnProveedores() {
    var texto = document.getElementById("buscador-proveedores").value.trim().toLowerCase();
    var filas = document.getElementById("filas-proveedores").querySelectorAll("tr");
    var hayResultados = false;

    for (var i = 0; i < filas.length; i++) {
        var contenido = filas[i].textContent.toLowerCase();
        if (contenido.includes(texto)) {
            filas[i].style.display = "";
            hayResultados = true;
        } else {
            filas[i].style.display = "none";
        }
    }

    var sinResultados = document.getElementById("proveedores-sin-resultados");
    if (!hayResultados && texto != "") {
        sinResultados.classList.remove("oculto");
    } else {
        sinResultados.classList.add("oculto");
    }
}

function buscarEnCategorias() {
    var texto = document.getElementById("buscador-categorias").value.trim().toLowerCase();
    var filas = document.getElementById("filas-categorias").querySelectorAll("tr");
    var hayResultados = false;

    for (var i = 0; i < filas.length; i++) {
        var contenido = filas[i].textContent.toLowerCase();
        if (contenido.includes(texto)) {
            filas[i].style.display = "";
            hayResultados = true;
        } else {
            filas[i].style.display = "none";
        }
    }

    var sinResultados = document.getElementById("categorias-sin-resultados");
    if (!hayResultados && texto != "") {
        sinResultados.classList.remove("oculto");
    } else {
        sinResultados.classList.add("oculto");
    }
}
