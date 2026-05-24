var itemsCompraActual = [];
var listaCompras = [];

function abrirVistaCompras() {
    itemsCompraActual = [];
    renderizarItemsCompra();

    // Cargo proveedores en el select
    var select = document.getElementById("select-proveedor-compra");
    select.innerHTML = '<option value="">Sin proveedor</option>';
    for (var i = 0; i < listaProveedores.length; i++) {
        select.innerHTML += '<option value="' + listaProveedores[i].id + '">' + listaProveedores[i].nombre + '</option>';
    }

    // Cargo productos en el select
    var selectProd = document.getElementById("select-producto-compra");
    selectProd.innerHTML = '<option value="">Selecciona un producto</option>';
    for (var j = 0; j < listaProductos.length; j++) {
        selectProd.innerHTML += '<option value="' + listaProductos[j].id + '">' + listaProductos[j].nombre + '</option>';
    }

    // Reset metodo de pago
    document.querySelector('input[name="metodo-compra"][value="efectivo"]').checked = true;

    mostrarVista("vista-compras");
}

function agregarItemCompra() {
    var idProducto = document.getElementById("select-producto-compra").value;
    var cantidad = parseInt(document.getElementById("cantidad-compra").value);
    var costo = parseInt(document.getElementById("costo-compra").value);

    if (!idProducto) {
        mostrarNotificacion("Selecciona un producto", "error");
        return;
    }

    // Validar cantidad: entero positivo, sin decimales, sin cero inicial
    var cantidadTexto = document.getElementById("cantidad-compra").value;
    var errorCantidad = validarCantidadEntera(cantidadTexto, "La cantidad");
    if (errorCantidad) {
        mostrarNotificacion(errorCantidad, "error");
        return;
    }

    // Validar costo: pesos colombianos (entero, multiplo de 50, mayor a 0)
    var costoTexto = document.getElementById("costo-compra").value;
    var errorCosto = validarPrecioCOP(costoTexto, "El costo");
    if (errorCosto) {
        mostrarNotificacion(errorCosto, "error");
        return;
    }

    var nombreProducto = "";
    for (var i = 0; i < listaProductos.length; i++) {
        if (listaProductos[i].id == idProducto) {
            nombreProducto = listaProductos[i].nombre;
            break;
        }
    }

    // Si ya estaba en la lista, sumo la cantidad
    var existente = null;
    for (var j = 0; j < itemsCompraActual.length; j++) {
        if (itemsCompraActual[j].idProducto == idProducto) {
            existente = itemsCompraActual[j];
            break;
        }
    }

    if (existente != null) {
        existente.cantidad += cantidad;
        existente.costo = costo;
    } else {
        itemsCompraActual.push({ idProducto: idProducto, nombre: nombreProducto, cantidad: cantidad, costo: costo });
    }

    document.getElementById("select-producto-compra").value = "";
    document.getElementById("cantidad-compra").value = "";
    document.getElementById("costo-compra").value = "";

    renderizarItemsCompra();
}

function quitarItemCompra(idProducto) {
    var nuevos = [];
    for (var i = 0; i < itemsCompraActual.length; i++) {
        if (itemsCompraActual[i].idProducto != idProducto) {
            nuevos.push(itemsCompraActual[i]);
        }
    }
    itemsCompraActual = nuevos;
    renderizarItemsCompra();
}

function calcularTotalCompra() {
    var total = 0;
    for (var i = 0; i < itemsCompraActual.length; i++) {
        total += itemsCompraActual[i].costo * itemsCompraActual[i].cantidad;
    }
    return total;
}

function renderizarItemsCompra() {
    var tabla = document.getElementById("tabla-items-compra");
    var filas = document.getElementById("filas-items-compra");
    var vacio = document.getElementById("compra-vacia");
    var totalDiv = document.getElementById("total-compra");

    if (itemsCompraActual.length == 0) {
        vacio.classList.remove("oculto");
        tabla.classList.add("oculto");
        totalDiv.textContent = "Total: $ 0";
        return;
    }

    vacio.classList.add("oculto");
    tabla.classList.remove("oculto");

    var html = "";
    for (var i = 0; i < itemsCompraActual.length; i++) {
        var item = itemsCompraActual[i];
        var subtotal = item.costo * item.cantidad;
        html +=
            '<tr>' +
                '<td>' + item.nombre + '</td>' +
                '<td>' + item.cantidad + '</td>' +
                '<td class="texto-mono">' + formatearPrecio(item.costo) + '</td>' +
                '<td class="texto-mono">' + formatearPrecio(subtotal) + '</td>' +
                '<td><button class="btn-tabla peligro" onclick="quitarItemCompra(\'' + item.idProducto + '\')">&#10005;</button></td>' +
            '</tr>';
    }
    filas.innerHTML = html;
    totalDiv.textContent = "Total: " + formatearPrecio(calcularTotalCompra());
}

async function registrarCompra() {
    if (itemsCompraActual.length == 0) {
        mostrarNotificacion("Agrega al menos un producto a la compra", "error");
        return;
    }

    var proveedorId = document.getElementById("select-proveedor-compra").value;
    var metodoPago = document.querySelector('input[name="metodo-compra"]:checked').value;

    var compra = {
        id: generarId("C"),
        fecha: new Date().toISOString(),
        proveedorId: proveedorId,
        metodoPago: metodoPago,
        total: calcularTotalCompra(),
        items: itemsCompraActual
    };

    mostrarLoader("Registrando compra...");
    try {
        await guardarCompraEnAPI(compra);

        // Guardo la compra localmente para el historial
        listaCompras.unshift({
            id: compra.id,
            fecha: compra.fecha,
            proveedorId: compra.proveedorId,
            metodoPago: compra.metodoPago,
            total: compra.total,
            items: compra.items.slice()
        });

        // Actualizo el stock de cada producto comprado
        for (var i = 0; i < itemsCompraActual.length; i++) {
            var item = itemsCompraActual[i];
            for (var j = 0; j < listaProductos.length; j++) {
                if (listaProductos[j].id == item.idProducto) {
                    if (listaProductos[j].controlInventario && listaProductos[j].stock != null) {
                        listaProductos[j].stock += item.cantidad;
                    }
                    break;
                }
            }
        }

        // Muestro confirmacion clara
        mostrarConfirmacionCompra(compra);

        itemsCompraActual = [];
        renderizarItemsCompra();

    } catch (error) {
        mostrarNotificacion("Error al registrar la compra: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

// Muestra una confirmacion visible tras registrar la compra
function mostrarConfirmacionCompra(compra) {
    var nombresMetodo = { efectivo: "Efectivo", nequi: "Nequi", consignacion: "En Consignación" };
    var metodo = nombresMetodo[compra.metodoPago] || compra.metodoPago;

    var nombreProveedor = "Sin proveedor";
    for (var i = 0; i < listaProveedores.length; i++) {
        if (listaProveedores[i].id == compra.proveedorId) {
            nombreProveedor = listaProveedores[i].nombre;
            break;
        }
    }

    document.getElementById("confirmacion-compra-id").textContent = compra.id;
    document.getElementById("confirmacion-compra-total").textContent = formatearPrecio(compra.total);
    document.getElementById("confirmacion-compra-metodo").textContent = metodo;
    document.getElementById("confirmacion-compra-proveedor").textContent = nombreProveedor;
    document.getElementById("confirmacion-compra-items").textContent = compra.items.length + " producto(s)";
    document.getElementById("modal-confirmacion-compra").classList.remove("oculto");
}

function cerrarConfirmacionCompra() {
    document.getElementById("modal-confirmacion-compra").classList.add("oculto");
}


// ---- HISTORIAL DE COMPRAS ----

function cargarHistorialCompras() {
    var vacio = document.getElementById("historial-compras-vacio");
    var tabla = document.getElementById("tabla-historial-compras");
    var filas = document.getElementById("filas-historial-compras");
    var filtroProveedor = document.getElementById("filtro-proveedor-compras").value;

    // Filtro por proveedor si se selecciono uno
    var comprasFiltradas = [];
    for (var i = 0; i < listaCompras.length; i++) {
        if (filtroProveedor == "" || listaCompras[i].proveedorId == filtroProveedor) {
            comprasFiltradas.push(listaCompras[i]);
        }
    }

    if (comprasFiltradas.length == 0) {
        vacio.classList.remove("oculto");
        tabla.classList.add("oculto");
        return;
    }

    vacio.classList.add("oculto");
    tabla.classList.remove("oculto");

    var nombresMetodo = { efectivo: "Efectivo", nequi: "Nequi", consignacion: "En Consignación" };

    var html = "";
    for (var i = 0; i < comprasFiltradas.length; i++) {
        var compra = comprasFiltradas[i];
        var metodo = nombresMetodo[compra.metodoPago] || compra.metodoPago || "—";
        var claseBadge = "badge-pago badge-" + (compra.metodoPago || "");

        var nombreProveedor = "Sin proveedor";
        for (var j = 0; j < listaProveedores.length; j++) {
            if (listaProveedores[j].id == compra.proveedorId) {
                nombreProveedor = listaProveedores[j].nombre;
                break;
            }
        }

        var totalItems = 0;
        for (var k = 0; k < compra.items.length; k++) {
            totalItems += compra.items[k].cantidad;
        }

        html +=
            '<tr>' +
                '<td class="texto-mono">' + compra.id + '</td>' +
                '<td>' + formatearFecha(compra.fecha) + '</td>' +
                '<td>' + nombreProveedor + '</td>' +
                '<td>' + totalItems + ' items</td>' +
                '<td class="texto-precio">' + formatearPrecio(compra.total) + '</td>' +
                '<td><span class="' + claseBadge + '">' + metodo + '</span></td>' +
            '</tr>';
    }
    filas.innerHTML = html;
}

function abrirHistorialCompras() {
    // Cargo proveedores en el filtro
    var selectFiltro = document.getElementById("filtro-proveedor-compras");
    selectFiltro.innerHTML = '<option value="">Todos los proveedores</option>';
    for (var i = 0; i < listaProveedores.length; i++) {
        selectFiltro.innerHTML += '<option value="' + listaProveedores[i].id + '">' + listaProveedores[i].nombre + '</option>';
    }
    cargarHistorialCompras();
    mostrarVista("vista-historial-compras");
}
