
// ---- TABLA ----

function cargarTablaProductos() {
    var vacioCaja = document.getElementById("productos-vacio");
    var tabla = document.getElementById("tabla-productos");
    var filas = document.getElementById("filas-productos");

    if (listaProductos.length == 0) {
        vacioCaja.classList.remove("oculto");
        tabla.classList.add("oculto");
        return;
    }

    vacioCaja.classList.add("oculto");
    tabla.classList.remove("oculto");

    var html = "";
    for (var i = 0; i < listaProductos.length; i++) {
        var prod = listaProductos[i];
        var textoStock = prod.controlInventario
            ? prod.stock + " und."
            : '<span style="color:#9a9087;font-size:11px">Sin seguimiento</span>';

        // Miniatura si el producto tiene imagen
        var imgHtml = prod.imagen && prod.imagen != ""
            ? '<img src="' + prod.imagen + '" class="img-producto-tabla" onerror="this.style.display=\'none\'">'
            : '<div class="img-producto-placeholder">\u{1F4E6}</div>';

        html +=
            '<tr>' +
                '<td>' + imgHtml + '</td>' +
                '<td style="font-weight:500">' + prod.nombre + '</td>' +
                '<td style="color:#9a9087">' + prod.categoria + '</td>' +
                '<td class="texto-mono">' + formatearPrecio(prod.precio) + '</td>' +
                '<td class="texto-mono" style="color:#9a9087">' + formatearPrecio(prod.costo) + '</td>' +
                '<td>' + textoStock + '</td>' +
                '<td>' +
                    '<div style="display:flex;gap:5px">' +
                        '<button class="btn-tabla" onclick="abrirFormularioProducto(\'' + prod.id + '\')">&#9998; Editar</button>' +
                        botonEliminarSiAdmin("abrirModalEliminar(\'" + prod.id + "\')", "&#10005; Eliminar") +
                    '</div>' +
                '</td>' +
            '</tr>';
    }
    filas.innerHTML = html;
}


// ---- FORMULARIO ----

function abrirFormularioProducto(idONuevo) {
    var erroresDiv = document.getElementById("errores-formulario");
    erroresDiv.innerHTML = "";
    erroresDiv.classList.add("oculto");

    // Cargo categorias en el select
    var selectCat = document.getElementById("campo-categoria");
    selectCat.innerHTML = '<option value="">Selecciona una categoría</option>';
    for (var c = 0; c < listaCategorias.length; c++) {
        selectCat.innerHTML += '<option value="' + listaCategorias[c].nombre + '">' + listaCategorias[c].nombre + '</option>';
    }

    if (idONuevo == "nuevo") {
        idProductoEditando = null;
        document.getElementById("titulo-form-producto").textContent = "Nuevo Producto";
        document.getElementById("campo-nombre").value = "";
        document.getElementById("campo-categoria").value = "";
        document.getElementById("campo-precio").value = "";
        document.getElementById("campo-costo").value = "";
        document.getElementById("campo-inventario").value = "si";
        document.getElementById("campo-stock").value = "0";
        document.getElementById("campo-imagen").value = "";
        document.getElementById("preview-imagen").innerHTML = "";
        document.getElementById("grupo-stock").classList.remove("oculto");
    } else {
        idProductoEditando = idONuevo;
        var producto = null;
        for (var i = 0; i < listaProductos.length; i++) {
            if (listaProductos[i].id == idONuevo) {
                producto = listaProductos[i];
                break;
            }
        }
        if (producto == null) {
            mostrarNotificacion("No se encontró el producto", "error");
            return;
        }
        document.getElementById("titulo-form-producto").textContent = "Editar Producto";
        document.getElementById("campo-nombre").value = producto.nombre;
        document.getElementById("campo-categoria").value = producto.categoria;
        document.getElementById("campo-precio").value = producto.precio;
        document.getElementById("campo-costo").value = producto.costo;
        document.getElementById("campo-inventario").value = producto.controlInventario ? "si" : "no";
        document.getElementById("campo-stock").value = producto.stock || 0;
        document.getElementById("campo-imagen").value = producto.imagen || "";
        previsualizarImagen();
        if (producto.controlInventario) {
            document.getElementById("grupo-stock").classList.remove("oculto");
        } else {
            document.getElementById("grupo-stock").classList.add("oculto");
        }
    }
    document.getElementById("modal-producto").classList.remove("oculto");
}

function cerrarFormularioProducto() {
    document.getElementById("modal-producto").classList.add("oculto");
    document.getElementById("preview-imagen").innerHTML = "";
    idProductoEditando = null;
}

function toggleCampoStock() {
    var valor = document.getElementById("campo-inventario").value;
    if (valor == "si") {
        document.getElementById("grupo-stock").classList.remove("oculto");
    } else {
        document.getElementById("grupo-stock").classList.add("oculto");
    }
}

// Muestra una miniatura mientras el usuario escribe la URL
function previsualizarImagen() {
    var url = document.getElementById("campo-imagen").value.trim();
    var preview = document.getElementById("preview-imagen");
    if (url == "") {
        preview.innerHTML = "";
        return;
    }
    // Uso createElement para evitar problemas de comillas anidadas
    var img = document.createElement("img");
    img.src = url;
    img.style.height = "80px";
    img.style.borderRadius = "6px";
    img.style.border = "1px solid #e0d8cc";
    img.style.objectFit = "cover";
    img.onerror = function() {
        preview.innerHTML = '<span style="color:#c0392b;font-size:12px">URL de imagen no válida</span>';
    };
    preview.innerHTML = "";
    preview.appendChild(img);
}

async function guardarProducto() {
    var nombre = document.getElementById("campo-nombre").value.trim();
    var categoria = document.getElementById("campo-categoria").value.trim();
    var precioTexto = document.getElementById("campo-precio").value;
    var costoTexto = document.getElementById("campo-costo").value;
    var controlInventario = document.getElementById("campo-inventario").value == "si";
    var stockTexto = document.getElementById("campo-stock").value;
    var imagen = document.getElementById("campo-imagen").value.trim();

    var precio = parseInt(precioTexto);
    var costo = parseInt(costoTexto);
    var stock = parseInt(stockTexto);

    var errores = [];

    // Nombre: obligatorio, minimo 2 caracteres
    if (nombre == "") {
        errores.push("El nombre del producto es obligatorio.");
    } else if (nombre.length < 2) {
        errores.push("El nombre debe tener al menos 2 caracteres.");
    }

    if (categoria == "") errores.push("La categoría es obligatoria.");

    // Precio en pesos colombianos: entero, multiplo de 50, mayor a 0
    var errorPrecio = validarPrecioCOP(precioTexto, "El precio");
    if (errorPrecio) errores.push(errorPrecio);

    // Costo en pesos colombianos: entero, multiplo de 50, mayor a 0
    var errorCosto = validarPrecioCOP(costoTexto, "El costo");
    if (errorCosto) errores.push(errorCosto);

    // El costo no puede superar el precio de venta
    var precioNum = parseInt(precioTexto);
    var costoNum = parseInt(costoTexto);
    if (!isNaN(precioNum) && !isNaN(costoNum) && costoNum > precioNum && precioNum > 0) {
        errores.push("El costo de compra no puede ser mayor al precio de venta.");
    }

    // Stock: entero positivo, sin cero inicial
    if (controlInventario) {
        var errorStock = validarCantidadEntera(stockTexto, "El stock");
        if (errorStock) errores.push(errorStock);
    }

    if (errores.length > 0) {
        var erroresDiv = document.getElementById("errores-formulario");
        var lista = "";
        for (var e = 0; e < errores.length; e++) lista += "• " + errores[e] + "<br>";
        erroresDiv.innerHTML = lista;
        erroresDiv.classList.remove("oculto");
        return;
    }

    mostrarLoader("Guardando producto...");

    try {
        // Traducimos del formato del formulario al formato que espera el backend.
        // categoria (nombre) -> categoriaId (número); codigo -> codigoInterno.
        var categoriaId = idCategoriaPorNombre(categoria);
        if (categoriaId == null) {
            ocultarLoader();
            var ed = document.getElementById("errores-formulario");
            ed.innerHTML = "• La categoría seleccionada no existe. Créala primero en Categorías.";
            ed.classList.remove("oculto");
            return;
        }

        var cuerpo = {
            nombre: nombre,
            categoriaId: categoriaId,
            precio: precio,
            costo: costo,
            controlInventario: controlInventario,
            stock: controlInventario ? stock : null,
            imagen: imagen || null
        };

        if (idProductoEditando == null) {
            // CREAR: el backend asigna el id. No generamos id en el cliente.
            await apiPost("/productos", cuerpo);
            mostrarNotificacion("Producto creado correctamente", "exito");
        } else {
            // EDITAR
            await apiPut("/productos/" + idProductoEditando, cuerpo);
            mostrarNotificacion("Producto actualizado correctamente", "exito");
        }

        cerrarFormularioProducto();
        // Recargamos desde el backend para reflejar exactamente lo guardado
        // (incluido el id real, el código generado en backend, etc.).
        await cargarProductosDesdeAPI();
        cargarTablaProductos();
    } catch (error) {
        // Errores del backend (validación COP, permisos, etc.) se muestran aquí.
        var erroresDiv = document.getElementById("errores-formulario");
        erroresDiv.innerHTML = "• " + error.message;
        erroresDiv.classList.remove("oculto");
    } finally {
        ocultarLoader();
    }
}


// ---- ELIMINAR ----

function abrirModalEliminar(idProducto) {
    idProductoAEliminar = idProducto;
    var nombreProducto = "este producto";
    for (var i = 0; i < listaProductos.length; i++) {
        if (listaProductos[i].id == idProducto) {
            nombreProducto = '"' + listaProductos[i].nombre + '"';
            break;
        }
    }
    document.getElementById("mensaje-eliminar").textContent =
        "¿Estás seguro de que quieres eliminar " + nombreProducto + "? Esta acción no se puede deshacer.";
    document.getElementById("modal-eliminar").classList.remove("oculto");
}

function cerrarModalEliminar() {
    document.getElementById("modal-eliminar").classList.add("oculto");
    idProductoAEliminar = null;
}

function ejecutarEliminacion() {
    if (idProductoAEliminar == null) return;
    var filtrados = [];
    for (var i = 0; i < listaProductos.length; i++) {
        if (listaProductos[i].id != idProductoAEliminar) {
            filtrados.push(listaProductos[i]);
        }
    }
    listaProductos = filtrados;
    cerrarModalEliminar();
    cargarTablaProductos();
    mostrarNotificacion("Producto eliminado de la vista");
}
