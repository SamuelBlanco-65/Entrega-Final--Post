
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
                        '<button class="btn-tabla peligro" onclick="abrirModalEliminarEntidad(\'cliente\', \'' + c.id + '\')">✕ Eliminar</button>' +
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
                        '<button class="btn-tabla peligro" onclick="abrirModalEliminarEntidad(\'proveedor\', \'' + p.id + '\')">✕ Eliminar</button>' +
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
                        '<button class="btn-tabla peligro" onclick="abrirModalEliminarEntidad(\'categoria\', \'' + cat.id + '\')">✕ Eliminar</button>' +
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
        if (entidadEditando.id == null) {
            // CREAR
            var objeto = { id: generarId(tipo[0].toUpperCase()), nombre: nombre, telefono: telefono, correo: correo };

            if (tipo == "cliente") {
                await guardarClienteEnAPI(objeto);
                listaClientes.push(objeto);
            } else if (tipo == "proveedor") {
                await guardarProveedorEnAPI(objeto);
                listaProveedores.push(objeto);
            } else if (tipo == "categoria") {
                var cat = { id: generarId("CAT"), nombre: nombre };
                await guardarCategoriaEnAPI(cat);
                listaCategorias.push(cat);
            }
            mostrarNotificacion("Creado correctamente", "exito");
        } else {
            // EDITAR — actualizo localmente
            if (tipo == "cliente") {
                for (var i = 0; i < listaClientes.length; i++) {
                    if (listaClientes[i].id == entidadEditando.id) {
                        listaClientes[i].nombre = nombre;
                        listaClientes[i].telefono = telefono;
                        listaClientes[i].correo = correo;
                        await guardarClienteEnAPI(listaClientes[i]);
                        break;
                    }
                }
            } else if (tipo == "proveedor") {
                for (var j = 0; j < listaProveedores.length; j++) {
                    if (listaProveedores[j].id == entidadEditando.id) {
                        listaProveedores[j].nombre = nombre;
                        listaProveedores[j].telefono = telefono;
                        listaProveedores[j].correo = correo;
                        await guardarProveedorEnAPI(listaProveedores[j]);
                        break;
                    }
                }
            } else if (tipo == "categoria") {
                for (var k = 0; k < listaCategorias.length; k++) {
                    if (listaCategorias[k].id == entidadEditando.id) {
                        listaCategorias[k].nombre = nombre;
                        await guardarCategoriaEnAPI(listaCategorias[k]);
                        break;
                    }
                }
            }
            mostrarNotificacion("Actualizado correctamente", "exito");
        }

        cerrarFormularioEntidad();
        if (tipo == "cliente") cargarTablaClientes();
        else if (tipo == "proveedor") cargarTablaProveedores();
        else if (tipo == "categoria") cargarTablaCategorias();

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

function ejecutarEliminacion() {
    if (entidadAEliminar != null) {
        var tipo = entidadAEliminar.tipo;
        var id = entidadAEliminar.id;

        if (tipo == "cliente") {
            listaClientes = listaClientes.filter(function(x) { return x.id != id; });
            cargarTablaClientes();
        } else if (tipo == "proveedor") {
            listaProveedores = listaProveedores.filter(function(x) { return x.id != id; });
            cargarTablaProveedores();
        } else if (tipo == "categoria") {
            listaCategorias = listaCategorias.filter(function(x) { return x.id != id; });
            cargarTablaCategorias();
        }
        entidadAEliminar = null;
        cerrarModalEliminar();
        mostrarNotificacion("Eliminado de la vista");
        return;
    }
    // Si no es entidad, es producto
    if (idProductoAEliminar != null) {
        var filtrados = [];
        for (var i = 0; i < listaProductos.length; i++) {
            if (listaProductos[i].id != idProductoAEliminar) filtrados.push(listaProductos[i]);
        }
        listaProductos = filtrados;
        cerrarModalEliminar();
        cargarTablaProductos();
        mostrarNotificacion("Producto eliminado de la vista");
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
