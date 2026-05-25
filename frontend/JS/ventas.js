
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

// Helper: total con el descuento seleccionado en el modal de cobro (si hay).
function calcularTotalConDescuentoActual() {
    var total = calcularTotal();
    var selDesc = document.getElementById("select-descuento-cobro");
    if (!selDesc || !selDesc.value) return total;
    var desc = null;
    for (var i = 0; i < listaDescuentos.length; i++) {
        if (listaDescuentos[i].id == selDesc.value) { desc = listaDescuentos[i]; break; }
    }
    if (!desc) return total;
    var monto = desc.tipo === "porcentaje" ? Math.round((total * desc.valor) / 100) : desc.valor;
    if (monto > total) monto = total;
    return total - monto;
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

        // Busco la imagen Y el código del producto en el catálogo. Antes aquí
        // se mostraba item.idProducto (un número del backend) que parecía un
        // stock; mostramos el código real del producto, que es lo útil.
        var imagenProducto = "";
        var codigoProducto = "";
        for (var p = 0; p < listaProductos.length; p++) {
            if (listaProductos[p].id == item.idProducto) {
                imagenProducto = listaProductos[p].imagen || "";
                codigoProducto = listaProductos[p].codigo || "";
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
                            '<div class="texto-mono" style="color:#9a9087;margin-top:2px">' + codigoProducto + '</div>' +
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
        // Buscamos el producto en memoria para enviar su estado completo al
        // backend con los campos editados (nombre y precio).
        var prod = null;
        for (var i = 0; i < listaProductos.length; i++) {
            if (listaProductos[i].id == id) { prod = listaProductos[i]; break; }
        }
        if (!prod) {
            mostrarNotificacion("No se encontró el producto", "error");
            ocultarLoader();
            return;
        }

        var cuerpo = {
            nombre: nombre,
            categoriaId: prod.categoriaId,
            precio: precio,
            costo: prod.costo,
            controlInventario: prod.controlInventario,
            stock: prod.controlInventario ? prod.stock : null,
            imagen: prod.imagen || null
        };
        await apiPut("/productos/" + id, cuerpo);

        // Recargamos productos para reflejar el cambio real del backend.
        await cargarProductosDesdeAPI();

        // Actualizo nombre y precio en el carrito actual (la venta en curso).
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
        // Buscamos por nombre y por código. Usamos String(...) para que
        // funcione tanto si el valor es texto como número (el id del backend
        // es numérico, así que prod.id.toLowerCase() reventaría). El código
        // (codigoInterno) es lo que el usuario suele escanear/escribir.
        var nombre = String(prod.nombre || "").toLowerCase();
        var codigo = String(prod.codigo || "").toLowerCase();
        var idTexto = String(prod.id || "").toLowerCase();
        if (nombre.includes(texto) || codigo.includes(texto) || idTexto.includes(texto)) {
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

        // Texto secundario: código · categoría · stock disponible. Mostrar el
        // stock aquí (en la búsqueda) sí es útil para el cajero. Antes mostraba
        // prod.id (número) que confundía.
        var infoStock = prod.controlInventario
            ? (prod.stock != null ? prod.stock + " und." : "Sin stock")
            : "Sin seguimiento";
        var codigoTxt = prod.codigo ? prod.codigo + " · " : "";

        html +=
            '<div class="item-resultado" onclick="seleccionarProductoDeBusqueda(' + indexReal + ')">' +
                imgHtml +
                '<div class="info-resultado">' +
                    '<div class="nombre-resultado">' + prod.nombre + '</div>' +
                    '<div class="codigo-resultado">' + codigoTxt + prod.categoria + ' · ' + infoStock + '</div>' +
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

    // Cargo clientes en el select del modal
    var selectCliente = document.getElementById("select-cliente-cobro");
    selectCliente.innerHTML = '<option value="">Sin cliente</option>';
    for (var c = 0; c < listaClientes.length; c++) {
        selectCliente.innerHTML += '<option value="' + listaClientes[c].id + '">' + listaClientes[c].nombre + '</option>';
    }

    document.querySelector('input[name="metodo"][value="efectivo"]').checked = true;
    cambiarMetodoPago();

    // Poblar el selector de descuentos activos (Fase 5).
    var selDesc = document.getElementById("select-descuento-cobro");
    if (selDesc) {
        selDesc.innerHTML = '<option value="">Sin descuento</option>';
        for (var d = 0; d < listaDescuentos.length; d++) {
            var desc = listaDescuentos[d];
            var etiqueta = desc.nombre + " (" +
                (desc.tipo === "porcentaje" ? desc.valor + "%" : formatearPrecio(desc.valor)) + ")";
            selDesc.innerHTML += '<option value="' + desc.id + '">' + etiqueta + '</option>';
        }
        selDesc.value = "";
        document.getElementById("info-descuento-cobro").classList.add("oculto");
    }

    document.getElementById("modal-cobro").classList.remove("oculto");
}

// Muestra el efecto del descuento seleccionado sobre el total (solo visual;
// el backend recalcula de forma autoritativa al cobrar).
function actualizarTotalConDescuento() {
    var selDesc = document.getElementById("select-descuento-cobro");
    var info = document.getElementById("info-descuento-cobro");
    var total = calcularTotal();
    var totalLabel = document.getElementById("total-en-modal");

    if (!selDesc || !selDesc.value) {
        totalLabel.textContent = formatearPrecio(total);
        info.classList.add("oculto");
        return;
    }

    // Buscar el descuento elegido.
    var desc = null;
    for (var i = 0; i < listaDescuentos.length; i++) {
        if (listaDescuentos[i].id == selDesc.value) { desc = listaDescuentos[i]; break; }
    }
    if (!desc) { totalLabel.textContent = formatearPrecio(total); info.classList.add("oculto"); return; }

    var montoDescuento = desc.tipo === "porcentaje"
        ? Math.round((total * desc.valor) / 100)
        : desc.valor;
    if (montoDescuento > total) montoDescuento = total; // no negativo

    var totalConDesc = total - montoDescuento;
    totalLabel.textContent = formatearPrecio(totalConDesc);
    info.textContent = "Descuento aplicado: −" + formatearPrecio(montoDescuento);
    info.classList.remove("oculto");

    // Si el método es efectivo, recalcular el cambio con el nuevo total.
    if (document.querySelector('input[name="metodo"]:checked').value === "efectivo") {
        calcularCambio();
    }
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
    var total = calcularTotalConDescuentoActual();
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
    // Total CON descuento aplicado (si hay uno seleccionado). El efectivo debe
    // cubrir este total, no el precio sin descuento. Antes se validaba contra
    // calcularTotal() (sin descuento), lo que exigía pagar de más.
    var total = calcularTotalConDescuentoActual();
    var metodo = document.querySelector('input[name="metodo"]:checked').value;
    var clienteId = document.getElementById("select-cliente-cobro").value;

    // Validacion previa de stock (chequeo rápido en cliente; el backend
    // vuelve a validar de forma autoritativa dentro de su transacción).
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

    // Validación de efectivo: debe cubrir el total (el backend recalcula y
    // valida también, pero damos feedback inmediato aquí).
    if (metodo === "efectivo") {
        var valorRecibidoTexto = document.getElementById("valor-recibido").value;
        var errorRecibidoCobro = validarPrecioCOP(valorRecibidoTexto, "El valor recibido");
        if (errorRecibidoCobro) {
            mostrarNotificacion(errorRecibidoCobro, "error");
            return;
        }
        if (parseInt(valorRecibidoTexto) < total) {
            mostrarNotificacion("El valor recibido es menor al total a cobrar (" + formatearPrecio(total) + ")", "error");
            return;
        }
    }

    // Construimos el cuerpo que espera el backend. NO calculamos total ni
    // descontamos stock aquí: el backend lo hace en una transacción y nos
    // devuelve la venta ya calculada. Solo enviamos la "intención".
    var cuerpo = {
        metodoPago: metodo,
        items: ventaActual.items.map(function (it) {
            return { productoId: it.idProducto, cantidad: it.cantidad };
        })
    };

    // Cliente: el backend usa clienteId numérico. Para "debe" es obligatorio.
    if (metodo === "debe") {
        // En "debe" exigimos un cliente REGISTRADO (el backend no acepta
        // nombres de texto libre, solo clienteId). Tomamos el del selector.
        var clienteDebe = document.getElementById("select-cliente-debe").value;
        if (!clienteDebe) {
            mostrarNotificacion("Para 'Debe' debes seleccionar un cliente registrado.", "error");
            return;
        }
        cuerpo.clienteId = parseInt(clienteDebe);
    } else if (clienteId) {
        // Para efectivo/nequi el cliente es opcional.
        cuerpo.clienteId = parseInt(clienteId);
    }

    // Efectivo recibido (el backend valida que cubra el total y calcula cambio).
    if (metodo === "efectivo") {
        cuerpo.efectivoRecibido = parseInt(document.getElementById("valor-recibido").value);
    }

    // Descuento opcional (si el modal tiene selector de descuento).
    var selDesc = document.getElementById("select-descuento-cobro");
    if (selDesc && selDesc.value) {
        cuerpo.descuentoId = parseInt(selDesc.value);
    }

    mostrarLoader("Registrando venta...");
    try {
        // El backend crea la venta, descuenta stock y devuelve la venta completa.
        var resp = await apiPost("/ventas", cuerpo);
        var ventaCreada = resp.venta ? resp.venta : resp; // tolerante al formato

        // Recargamos productos (su stock cambió en el backend) y ventas, para
        // que las pantallas reflejen el estado real. NO tocamos stock a mano.
        await cargarProductosDesdeAPI();
        await cargarVentasDesdeAPI();

        idUltimaVentaCerrada = ventaCreada.id;
        borrarVentaAbiertaLocal();
        cerrarModalCobro();
        mostrarVistaConfirmacion(ventaCreada.id);
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

        // Badges de estado (Hito 3): anulada, corregida, reembolsada.
        var badgesEstado = "";
        if (venta.estado === "anulada") {
            badgesEstado += '<span class="badge-estado badge-anulada">Anulada</span>';
        }
        if (venta.fueCorregida) {
            badgesEstado += '<span class="badge-estado badge-corregida">Corregida</span>';
        }
        if (venta.resumenReembolso && venta.resumenReembolso.tieneReembolsos) {
            var txtReemb = venta.resumenReembolso.esTotal ? "Reembolsada" : "Reemb. parcial";
            badgesEstado += '<span class="badge-estado badge-reembolsada">' + txtReemb + '</span>';
        }

        // Botones de acción. Solo ADMIN ve corregir/reembolsar/anular; cualquiera
        // puede ver factura y correcciones. (El backend igual valida el rol.)
        var acciones = '<button class="btn-tabla" onclick="verFactura(\'' + venta.id + '\', \'vista-historial\')">Factura</button>';

        var esAnulada = venta.estado === "anulada";
        var tieneReemb = venta.resumenReembolso && venta.resumenReembolso.tieneReembolsos;

        if (esAdmin() && !esAnulada) {
            // Corregir: solo si no tiene reembolsos (exclusión mutua del backend).
            if (!tieneReemb) {
                acciones += ' <button class="btn-tabla" onclick="abrirCorreccion(' + venta.id + ')">Corregir</button>';
            }
            // Reembolsar.
            acciones += ' <button class="btn-tabla" onclick="abrirReembolso(' + venta.id + ')">Reembolsar</button>';
            // Anular.
            acciones += ' <button class="btn-tabla peligro" onclick="confirmarAnularVenta(' + venta.id + ')">Anular</button>';
        }
        if (venta.fueCorregida) {
            acciones += ' <button class="btn-tabla" onclick="verCorrecciones(' + venta.id + ')">Historial</button>';
        }

        html +=
            '<tr>' +
                '<td class="texto-mono">' + venta.id + ' ' + badgesEstado + '</td>' +
                '<td>' + formatearFecha(venta.cerradoEn) + '</td>' +
                '<td>' + totalArticulos + ' items</td>' +
                '<td class="texto-precio">' + formatearPrecio(venta.total) + '</td>' +
                '<td><span class="' + claseBadge + '">' + metodo + '</span></td>' +
                '<td>' + (venta.cliente || "—") + '</td>' +
                '<td>' + acciones + '</td>' +
            '</tr>';
    }
    filas.innerHTML = html;
}
