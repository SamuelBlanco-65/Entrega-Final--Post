
// ---- CARRITO ----

function crearNuevaVenta() {
    ventaActual = {
        id: generarId("V"),
        items: [],
        creadoEn: new Date().toISOString()
    };
    document.getElementById("id-venta-actual").textContent = ventaActual.id;
    document.getElementById("input-busqueda").value = "";
    ocultarResultadosBusqueda();
    actualizarVistaCarrito();
    actualizarBotonVentaAbierta();
}

// Retoma la venta guardada como abierta
function retomarVentaAbierta() {
    if (ventaAbierta == null) return;
    ventaActual = ventaAbierta;
    borrarVentaAbiertaLocal();
    document.getElementById("id-venta-actual").textContent = ventaActual.id;
    actualizarVistaCarrito();
    actualizarBotonVentaAbierta();
    mostrarNotificacion("Venta retomada correctamente", "exito");
}

// Guarda la venta actual como "abierta" para retomar despues
function guardarVentaComoAbierta() {
    if (ventaActual.items.length == 0) {
        mostrarNotificacion("No hay productos en la venta para guardar", "error");
        return;
    }
    guardarVentaAbiertaLocal();
    mostrarNotificacion("Venta guardada — puedes retomar cuando quieras");
    crearNuevaVenta();
}

// Muestra u oculta el boton de retomar segun si hay venta abierta
function actualizarBotonVentaAbierta() {
    cargarVentaAbiertaLocal();
    var btn = document.getElementById("btn-retomar-venta");
    if (ventaAbierta != null && ventaActual.items.length == 0) {
        btn.classList.remove("oculto");
    } else {
        btn.classList.add("oculto");
    }
}

function agregarAlCarrito(producto) {
    var itemExistente = null;
    for (var i = 0; i < ventaActual.items.length; i++) {
        if (ventaActual.items[i].idProducto == producto.id) {
            itemExistente = ventaActual.items[i];
            break;
        }
    }
    var cantidadEnCarrito = itemExistente != null ? itemExistente.cantidad : 0;

    if (producto.controlInventario && producto.stock != null) {
        if (producto.stock <= 0) {
            mostrarNotificacion("'" + producto.nombre + "' no tiene stock disponible", "error");
            return;
        }
        if (cantidadEnCarrito >= producto.stock) {
            mostrarNotificacion("Solo hay " + producto.stock + " unidad(es) disponibles de '" + producto.nombre + "'", "error");
            return;
        }
    }

    if (itemExistente != null) {
        itemExistente.cantidad++;
    } else {
        ventaActual.items.push({
            idProducto: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }

    document.getElementById("input-busqueda").value = "";
    ocultarResultadosBusqueda();
    actualizarVistaCarrito();
}

function cambiarCantidad(idProducto, nuevaCantidad) {
    var cantidad = parseInt(nuevaCantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
        quitarDelCarrito(idProducto);
        return;
    }
    var productoEnCatalogo = null;
    for (var j = 0; j < listaProductos.length; j++) {
        if (listaProductos[j].id == idProducto) {
            productoEnCatalogo = listaProductos[j];
            break;
        }
    }
    if (productoEnCatalogo != null && productoEnCatalogo.controlInventario && productoEnCatalogo.stock != null) {
        if (cantidad > productoEnCatalogo.stock) {
            mostrarNotificacion("Solo hay " + productoEnCatalogo.stock + " unidad(es) disponibles", "error");
            cantidad = productoEnCatalogo.stock;
        }
    }
    for (var i = 0; i < ventaActual.items.length; i++) {
        if (ventaActual.items[i].idProducto == idProducto) {
            ventaActual.items[i].cantidad = cantidad;
            break;
        }
    }
    actualizarVistaCarrito();
}

function quitarDelCarrito(idProducto) {
    var nuevoItems = [];
    for (var i = 0; i < ventaActual.items.length; i++) {
        if (ventaActual.items[i].idProducto != idProducto) {
            nuevoItems.push(ventaActual.items[i]);
        }
    }
    ventaActual.items = nuevoItems;
    actualizarVistaCarrito();
}

function calcularTotal() {
    var total = 0;
    for (var i = 0; i < ventaActual.items.length; i++) {
        total += ventaActual.items[i].precio * ventaActual.items[i].cantidad;
    }
    return total;
}

function contarArticulos() {
    var total = 0;
    for (var i = 0; i < ventaActual.items.length; i++) {
        total += ventaActual.items[i].cantidad;
    }
    return total;
}

function actualizarVistaCarrito() {
    var items = ventaActual.items;
    var total = calcularTotal();
    var cantArticulos = contarArticulos();

    document.getElementById("mostrar-subtotal").textContent = formatearPrecio(total);
    document.getElementById("mostrar-total").textContent = formatearPrecio(total);
    document.getElementById("contador-items").textContent = cantArticulos + " artículos";
    document.getElementById("boton-cobrar").disabled = items.length == 0;

    var carritoVacio = document.getElementById("carrito-vacio");
    var tablaCarrito = document.getElementById("tabla-carrito");

    if (items.length == 0) {
        carritoVacio.classList.remove("oculto");
        tablaCarrito.classList.add("oculto");
        return;
    }

    carritoVacio.classList.add("oculto");
    tablaCarrito.classList.remove("oculto");

    var filasHTML = "";
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var subtotal = item.precio * item.cantidad;

        // Busco la imagen del producto en el catalogo
        var imagenProducto = "";
        for (var p = 0; p < listaProductos.length; p++) {
            if (listaProductos[p].id == item.idProducto) {
                imagenProducto = listaProductos[p].imagen || "";
                break;
            }
        }
        var imgCarritoHtml = imagenProducto != ""
            ? '<img src="' + imagenProducto + '" class="img-carrito" onerror="this.style.display=\'none\'">'
            : '<div class="img-carrito-placeholder">📦</div>';

        filasHTML +=
            '<tr>' +
                '<td>' +
                    '<div style="display:flex;align-items:center;gap:10px">' +
                        imgCarritoHtml +
                        '<div>' +
                            '<div style="font-weight:500">' + item.nombre + '</div>' +
                            '<div class="texto-mono" style="color:#9a9087;margin-top:2px">' + item.idProducto + '</div>' +
                        '</div>' +
                    '</div>' +
                '</td>' +
                '<td>' +
                    '<div class="control-cantidad">' +
                        '<button class="btn-cantidad" onclick="cambiarCantidad(\'' + item.idProducto + '\', ' + (item.cantidad - 1) + ')">−</button>' +
                        '<input type="number" value="' + item.cantidad + '" min="1" ' +
                            'onchange="cambiarCantidad(\'' + item.idProducto + '\', this.value)" ' +
                            'onblur="cambiarCantidad(\'' + item.idProducto + '\', this.value)">' +
                        '<button class="btn-cantidad" onclick="cambiarCantidad(\'' + item.idProducto + '\', ' + (item.cantidad + 1) + ')">+</button>' +
                    '</div>' +
                '</td>' +
                '<td class="texto-mono">' + formatearPrecio(item.precio) + '</td>' +
                '<td class="texto-precio">' + formatearPrecio(subtotal) + '</td>' +
                '<td>' +
                    '<button class="btn-tabla" onclick="abrirFormularioProductoEnVenta(\'' + item.idProducto + '\')" title="Editar producto">✎</button> ' +
                    '<button class="btn-tabla peligro" onclick="quitarDelCarrito(\'' + item.idProducto + '\')">✕</button>' +
                '</td>' +
            '</tr>';
    }
    document.getElementById("filas-carrito").innerHTML = filasHTML;
}

function descartarVenta() {
    if (ventaActual.items.length > 0) {
        var confirmar = confirm("¿Seguro que quieres descartar esta venta?");
        if (!confirmar) return;
    }
    crearNuevaVenta();
    mostrarNotificacion("Venta descartada");
}

function empezarNuevaVenta() {
    crearNuevaVenta();
    mostrarVista("vista-nueva-venta");
}

// ---- EDICION DE PRODUCTO DESDE VENTA ----

function abrirFormularioProductoEnVenta(idProducto) {
    var producto = null;
    for (var i = 0; i < listaProductos.length; i++) {
        if (listaProductos[i].id == idProducto) {
            producto = listaProductos[i];
            break;
        }
    }
    if (producto == null) return;

    document.getElementById("edit-venta-nombre").value = producto.nombre;
    document.getElementById("edit-venta-precio").value = producto.precio;
    document.getElementById("edit-venta-id-oculto").value = producto.id;
    document.getElementById("modal-editar-en-venta").classList.remove("oculto");
}

function cerrarFormularioProductoEnVenta() {
    document.getElementById("modal-editar-en-venta").classList.add("oculto");
}

async function guardarEdicionProductoEnVenta() {
    var id = document.getElementById("edit-venta-id-oculto").value;
    var nombre = document.getElementById("edit-venta-nombre").value.trim();

    if (nombre == "" || nombre.trim().length < 2) {
        mostrarNotificacion("El nombre debe tener al menos 2 caracteres", "error");
        return;
    }
    var precioTextoEdicion = document.getElementById("edit-venta-precio").value;
    var errorPrecioEdicion = validarPrecioCOP(precioTextoEdicion, "El precio");
    if (errorPrecioEdicion) {
        mostrarNotificacion(errorPrecioEdicion, "error");
        return;
    }
    var precio = parseInt(precioTextoEdicion);

    mostrarLoader("Actualizando producto...");
    try {
        for (var i = 0; i < listaProductos.length; i++) {
            if (listaProductos[i].id == id) {
                listaProductos[i].nombre = nombre;
                listaProductos[i].precio = precio;
                await guardarProductoEnAPI(listaProductos[i]);
                break;
            }
        }
        // Actualizo tambien el nombre y precio en el carrito actual
        for (var j = 0; j < ventaActual.items.length; j++) {
            if (ventaActual.items[j].idProducto == id) {
                ventaActual.items[j].nombre = nombre;
                ventaActual.items[j].precio = precio;
                break;
            }
        }
        cerrarFormularioProductoEnVenta();
        actualizarVistaCarrito();
        mostrarNotificacion("Producto actualizado correctamente", "exito");
    } catch (error) {
        mostrarNotificacion("Error al actualizar: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}


// ---- BUSQUEDA ----

function buscarProducto() {
    var texto = document.getElementById("input-busqueda").value.trim().toLowerCase();
    if (texto == "") {
        ocultarResultadosBusqueda();
        return;
    }
    var resultados = [];
    for (var i = 0; i < listaProductos.length; i++) {
        var prod = listaProductos[i];
        if (prod.nombre.toLowerCase().includes(texto) || prod.id.toLowerCase().includes(texto)) {
            resultados.push(prod);
        }
    }
    mostrarResultadosBusqueda(resultados, texto);
}

function mostrarResultadosBusqueda(resultados, textoBuscado) {
    var contenedor = document.getElementById("resultados-busqueda");
    if (resultados.length == 0) {
        contenedor.innerHTML = '<div class="sin-resultados">Sin resultados para "' + textoBuscado + '"</div>';
        contenedor.classList.remove("oculto");
        return;
    }
    var html = "";
    for (var i = 0; i < resultados.length; i++) {
        var prod = resultados[i];
        var indexReal = listaProductos.indexOf(prod);

        // Miniatura del producto si tiene imagen
        var imgHtml = prod.imagen && prod.imagen != ""
            ? '<img src="' + prod.imagen + '" class="img-resultado" onerror="this.style.display=\'none\'">'
            : '<div class="img-resultado-placeholder">📦</div>';

        html +=
            '<div class="item-resultado" onclick="seleccionarProductoDeBusqueda(' + indexReal + ')">' +
                imgHtml +
                '<div class="info-resultado">' +
                    '<div class="nombre-resultado">' + prod.nombre + '</div>' +
                    '<div class="codigo-resultado">' + prod.id + ' · ' + prod.categoria + '</div>' +
                '</div>' +
                '<div class="precio-resultado">' + formatearPrecio(prod.precio) + '</div>' +
            '</div>';
    }
    contenedor.innerHTML = html;
    contenedor.classList.remove("oculto");
}

function seleccionarProductoDeBusqueda(index) {
    agregarAlCarrito(listaProductos[index]);
}

function ocultarResultadosBusqueda() {
    document.getElementById("resultados-busqueda").classList.add("oculto");
}

document.addEventListener("click", function (evento) {
    var cajaBusqueda = document.getElementById("caja-busqueda");
    if (cajaBusqueda && !cajaBusqueda.contains(evento.target)) {
        ocultarResultadosBusqueda();
    }
});


// ---- MODAL DE COBRO ----

function abrirModalCobro() {
    var total = calcularTotal();
    document.getElementById("total-en-modal").textContent = formatearPrecio(total);
    document.getElementById("valor-recibido").value = "";
    document.getElementById("mostrar-cambio").textContent = formatearPrecio(0);
    document.getElementById("input-cliente-debe").value = "";

    // Cargo clientes en el select del modal
    var selectCliente = document.getElementById("select-cliente-cobro");
    selectCliente.innerHTML = '<option value="">Sin cliente</option>';
    for (var c = 0; c < listaClientes.length; c++) {
        selectCliente.innerHTML += '<option value="' + listaClientes[c].id + '">' + listaClientes[c].nombre + '</option>';
    }

    document.querySelector('input[name="metodo"][value="efectivo"]').checked = true;
    cambiarMetodoPago();
    document.getElementById("modal-cobro").classList.remove("oculto");
}

function cerrarModalCobro() {
    document.getElementById("modal-cobro").classList.add("oculto");
}

function cambiarMetodoPago() {
    var metodo = document.querySelector('input[name="metodo"]:checked').value;
    document.getElementById("seccion-efectivo").classList.add("oculto");
    document.getElementById("seccion-debe").classList.add("oculto");
    if (metodo == "efectivo") {
        document.getElementById("seccion-efectivo").classList.remove("oculto");
    } else if (metodo == "debe") {
        // Poblo el select de clientes registrados
        var selectDebe = document.getElementById("select-cliente-debe");
        selectDebe.innerHTML = '<option value="">Selecciona un cliente registrado</option>';
        for (var i = 0; i < listaClientes.length; i++) {
            selectDebe.innerHTML += '<option value="' + listaClientes[i].id + '">' + listaClientes[i].nombre + '</option>';
        }
        document.getElementById("seccion-debe").classList.remove("oculto");
    }
}

function calcularCambio() {
    var total = calcularTotal();
    var campo = document.getElementById("valor-recibido");
    var valorEscrito = campo.value;

    // Valido el valor recibido como pesos colombianos
    if (valorEscrito.trim() == "") {
        document.getElementById("mostrar-cambio").textContent = formatearPrecio(0);
        return;
    }

    var errorRecibido = validarPrecioCOP(valorEscrito, "El valor recibido");
    if (errorRecibido) {
        document.getElementById("mostrar-cambio").textContent = formatearPrecio(0);
        return;
    }

    var recibido = parseInt(valorEscrito);

    var cambio = recibido - total;
    if (cambio < 0) {
        document.getElementById("mostrar-cambio").textContent = "Falta: " + formatearPrecio(Math.abs(cambio));
        document.getElementById("mostrar-cambio").style.color = "#c0392b";
    } else {
        document.getElementById("mostrar-cambio").textContent = formatearPrecio(cambio);
        document.getElementById("mostrar-cambio").style.color = "#2d7a4f";
    }
}

async function confirmarCobro() {
    var total = calcularTotal();
    var metodo = document.querySelector('input[name="metodo"]:checked').value;
    var clienteId = document.getElementById("select-cliente-cobro").value;

    // Validacion de stock
    for (var k = 0; k < ventaActual.items.length; k++) {
        var item = ventaActual.items[k];
        for (var m = 0; m < listaProductos.length; m++) {
            if (listaProductos[m].id == item.idProducto) {
                var prod = listaProductos[m];
                if (prod.controlInventario && prod.stock != null && item.cantidad > prod.stock) {
                    mostrarNotificacion("Stock insuficiente: '" + item.nombre + "' solo tiene " + prod.stock + " unidad(es)", "error");
                    return;
                }
                break;
            }
        }
    }

    if (metodo == "efectivo") {
        var valorRecibidoTexto = document.getElementById("valor-recibido").value;
        var errorRecibidoCobro = validarPrecioCOP(valorRecibidoTexto, "El valor recibido");
        if (errorRecibidoCobro) {
            mostrarNotificacion(errorRecibidoCobro, "error");
            return;
        }
        var recibido = parseInt(valorRecibidoTexto);
        if (recibido < total) {
            mostrarNotificacion("El valor recibido (" + formatearPrecio(recibido) + ") es menor al total a cobrar (" + formatearPrecio(total) + ")", "error");
            return;
        }
        ventaActual.pago = { metodo: "efectivo", valorRecibido: recibido, cambio: recibido - total };
    } else if (metodo == "debe") {
        // Si se selecciono un cliente del sistema lo uso, si no exijo el campo de texto
        var clienteSeleccionado = document.getElementById("select-cliente-cobro").value;
        var nombreCliente = "";
        if (clienteSeleccionado != "") {
            // Busco el nombre del cliente en la lista
            for (var cx = 0; cx < listaClientes.length; cx++) {
                if (listaClientes[cx].id == clienteSeleccionado) {
                    nombreCliente = listaClientes[cx].nombre;
                    break;
                }
            }
        } else {
            nombreCliente = document.getElementById("input-cliente-debe").value.trim();
        }
        if (nombreCliente == "") {
            mostrarNotificacion("Selecciona o escribe el nombre del cliente para 'Debe'", "error");
            return;
        }
        ventaActual.pago = { metodo: "debe", cliente: nombreCliente };
        ventaActual.cliente = nombreCliente;
    } else if (metodo == "nequi") {
        ventaActual.pago = { metodo: "nequi" };
    }

    ventaActual.total = total;
    ventaActual.cerradoEn = new Date().toISOString();
    ventaActual.estado = "cerrada";
    ventaActual.clienteId = clienteId;

    mostrarLoader("Registrando venta...");
    try {
        await guardarVentaEnAPI(ventaActual);

        listaVentas.unshift(ventaActual);

        // Descuento stock localmente
        for (var i = 0; i < ventaActual.items.length; i++) {
            var it = ventaActual.items[i];
            for (var j = 0; j < listaProductos.length; j++) {
                if (listaProductos[j].id == it.idProducto) {
                    if (listaProductos[j].controlInventario && listaProductos[j].stock != null) {
                        listaProductos[j].stock -= it.cantidad;
                        if (listaProductos[j].stock < 0) listaProductos[j].stock = 0;
                    }
                    break;
                }
            }
        }

        idUltimaVentaCerrada = ventaActual.id;
        borrarVentaAbiertaLocal();
        cerrarModalCobro();
        mostrarVistaConfirmacion(ventaActual.id);
    } catch (error) {
        mostrarNotificacion("Error al registrar la venta: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}


// ---- CONFIRMACION ----

function mostrarVistaConfirmacion(idVenta) {
    var venta = null;
    for (var i = 0; i < listaVentas.length; i++) {
        if (listaVentas[i].id == idVenta) {
            venta = listaVentas[i];
            break;
        }
    }
    if (venta == null) return;
    var nombresMetodo = { efectivo: "Efectivo", nequi: "Nequi", debe: "Debe" };
    var metodo = nombresMetodo[venta.pago.metodo] || venta.pago.metodo;
    var texto = "Venta " + venta.id + " · " + formatearPrecio(venta.total) + " · " + metodo;
    if (venta.pago.metodo == "efectivo") {
        texto += " · Cambio: " + formatearPrecio(venta.pago.cambio);
    }
    document.getElementById("texto-confirmacion").textContent = texto;
    mostrarVista("vista-confirmacion");
}


// ---- FACTURA ----

function verFactura(idVenta, vistaOrigen) {
    var venta = null;
    for (var i = 0; i < listaVentas.length; i++) {
        if (listaVentas[i].id == idVenta) {
            venta = listaVentas[i];
            break;
        }
    }
    if (venta == null) {
        mostrarNotificacion("No se encontró la venta", "error");
        return;
    }
    vistaAnteriorFactura = vistaOrigen || "vista-historial";
    construirFactura(venta);
    mostrarVista("vista-factura");
}

function verFacturaDesdeConfirmacion() {
    verFactura(idUltimaVentaCerrada, "vista-confirmacion");
}

function volverDesdeFactura() {
    if (vistaAnteriorFactura == "vista-confirmacion") {
        mostrarVista("vista-confirmacion");
    } else {
        cargarHistorial();
        mostrarVista("vista-historial");
    }
}

function construirFactura(venta) {
    var nombresMetodo = { efectivo: "Efectivo", nequi: "Nequi", debe: "Debe" };
    var metodo = nombresMetodo[venta.pago.metodo] || venta.pago.metodo;

    var filasProductos = "";
    for (var i = 0; i < venta.items.length; i++) {
        var item = venta.items[i];
        var subtotal = item.precio * item.cantidad;
        filasProductos +=
            '<tr>' +
                '<td>' + item.nombre + '</td>' +
                '<td style="text-align:right">' + item.cantidad + '</td>' +
                '<td style="text-align:right">' + formatearPrecio(item.precio) + '</td>' +
                '<td style="text-align:right">' + formatearPrecio(subtotal) + '</td>' +
            '</tr>';
    }

    var filaCliente = venta.cliente
        ? '<div class="factura-etiqueta">Cliente</div><div class="factura-valor">' + venta.cliente + '</div>'
        : "";

    var filasCambio = "";
    if (venta.pago.metodo == "efectivo") {
        filasCambio =
            '<tr><td colspan="3" style="text-align:right;color:#9a9087">Recibido</td><td style="text-align:right">' + formatearPrecio(venta.pago.valorRecibido) + '</td></tr>' +
            '<tr><td colspan="3" style="text-align:right;color:#9a9087">Cambio</td><td style="text-align:right">' + formatearPrecio(venta.pago.cambio) + '</td></tr>';
    }

    var html =
        '<div class="factura-encabezado">' +
            '<div class="factura-nombre-negocio"><span>Papel</span> y Luna</div>' +
            '<div class="factura-info-negocio">Papelería y Miscelánea<br>NIT: 900.123.456-7 · Tel: (601) 555-0000</div>' +
            '<div class="factura-numero">FACTURA #' + venta.id + '</div>' +
        '</div>' +
        '<div class="factura-datos">' +
            '<div class="factura-etiqueta">Fecha</div>' +
            '<div class="factura-valor">' + formatearFecha(venta.cerradoEn) + '</div>' +
            '<div class="factura-etiqueta">Método de pago</div>' +
            '<div class="factura-valor">' + metodo + '</div>' +
            filaCliente +
        '</div>' +
        '<table class="tabla-factura"><thead><tr>' +
            '<th style="text-align:left">Producto</th>' +
            '<th style="text-align:right">Cant.</th>' +
            '<th style="text-align:right">P. Unit.</th>' +
            '<th style="text-align:right">Subtotal</th>' +
        '</tr></thead><tbody>' +
            filasProductos +
            '<tr class="fila-total-factura"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">' + formatearPrecio(venta.total) + '</td></tr>' +
            filasCambio +
        '</tbody></table>' +
        '<div class="factura-pie">¡Gracias por tu compra! · Papel y Luna</div>';

    document.getElementById("contenido-factura").innerHTML = html;
}


// ---- HISTORIAL ----

function cargarHistorial() {
    var vacioCaja = document.getElementById("historial-vacio");
    var tabla = document.getElementById("tabla-historial");
    var filas = document.getElementById("filas-historial");

    if (listaVentas.length == 0) {
        vacioCaja.classList.remove("oculto");
        tabla.classList.add("oculto");
        return;
    }

    vacioCaja.classList.add("oculto");
    tabla.classList.remove("oculto");

    var html = "";
    for (var i = 0; i < listaVentas.length; i++) {
        var venta = listaVentas[i];
        var metodo = venta.pago ? venta.pago.metodo : "—";
        var totalArticulos = 0;
        for (var j = 0; j < venta.items.length; j++) totalArticulos += venta.items[j].cantidad;
        var claseBadge = "badge-pago badge-" + metodo;
        html +=
            '<tr>' +
                '<td class="texto-mono">' + venta.id + '</td>' +
                '<td>' + formatearFecha(venta.cerradoEn) + '</td>' +
                '<td>' + totalArticulos + ' items</td>' +
                '<td class="texto-precio">' + formatearPrecio(venta.total) + '</td>' +
                '<td><span class="' + claseBadge + '">' + metodo + '</span></td>' +
                '<td>' + (venta.cliente || "—") + '</td>' +
                '<td><button class="btn-tabla" onclick="verFactura(\'' + venta.id + '\', \'vista-historial\')">Ver factura →</button></td>' +
            '</tr>';
    }
    filas.innerHTML = html;
}
