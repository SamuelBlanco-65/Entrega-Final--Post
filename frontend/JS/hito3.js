
// =====================================================================
//  HITO 3 — Corrección de ventas, reembolsos y reportes
//  Lógica del frontend que consume los endpoints del Hito 3.
// =====================================================================

// ---------------------------------------------------------------------
//  ANULAR VENTA  (DELETE /api/ventas/:id, solo ADMIN)
// ---------------------------------------------------------------------
function confirmarAnularVenta(idVenta) {
    if (!confirm("¿Anular la venta " + idVenta + "? Se restaurará el stock de sus productos. Esta acción no se puede deshacer.")) {
        return;
    }
    anularVenta(idVenta);
}

async function anularVenta(idVenta) {
    mostrarLoader("Anulando venta...");
    try {
        await apiDelete("/ventas/" + idVenta);
        // El backend restaura stock; recargamos productos y ventas.
        await cargarProductosDesdeAPI();
        await cargarVentasDesdeAPI();
        cargarHistorial();
        mostrarNotificacion("Venta anulada y stock restaurado.", "exito");
    } catch (error) {
        mostrarNotificacion("No se pudo anular: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

// ---------------------------------------------------------------------
//  REEMBOLSOS  (POST /api/ventas/:id/reembolsos, solo ADMIN)
// ---------------------------------------------------------------------

// Venta sobre la que se está trabajando un reembolso (cargada del backend).
var ventaReembolsoActual = null;

async function abrirReembolso(idVenta) {
    mostrarLoader("Cargando venta...");
    try {
        // Traemos la venta completa del backend (con items y ventaItemId reales,
        // y el resumen de lo ya reembolsado).
        var venta = await apiGet("/ventas/" + idVenta);
        ventaReembolsoActual = venta;
        construirModalReembolso(venta);
        document.getElementById("modal-reembolso").classList.remove("oculto");
    } catch (error) {
        mostrarNotificacion("No se pudo abrir el reembolso: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

function cerrarModalReembolso() {
    document.getElementById("modal-reembolso").classList.add("oculto");
    ventaReembolsoActual = null;
}

// Construye el cuerpo del modal: una fila por ítem de la venta, con cuánto
// queda por reembolsar, un input de cantidad y un check de "retorna a inventario".
function construirModalReembolso(venta) {
    document.getElementById("reembolso-venta-id").textContent = venta.id;

    // Factor de descuento de la venta: total pagado / subtotal sin descuento.
    // Se usa para que el monto mostrado coincida con el que reembolsará el
    // backend (proporcional a lo que el cliente realmente pagó).
    var descMonto = venta.descuentoMonto || 0;
    var subtotalSinDesc = venta.total + descMonto;
    window.__factorReembolso = subtotalSinDesc > 0 ? venta.total / subtotalSinDesc : 1;

    // Mapa de cuánto ya se reembolsó por ventaItemId (de los reembolsos previos).
    var yaReembolsado = {};
    (venta.reembolsos || []).forEach(function (r) {
        (r.items || []).forEach(function (it) {
            if (it.ventaItemId != null) {
                yaReembolsado[it.ventaItemId] = (yaReembolsado[it.ventaItemId] || 0) + it.cantidad;
            }
        });
    });

    var filas = "";
    (venta.items || []).forEach(function (it) {
        var reemb = yaReembolsado[it.id] || 0;
        var disponible = it.cantidad - reemb;
        var deshabilitado = disponible <= 0 ? "disabled" : "";
        filas +=
            '<tr data-venta-item-id="' + it.id + '" data-precio="' + it.precioUnitario + '" data-disponible="' + disponible + '">' +
                '<td>' + it.nombreSnapshot + '</td>' +
                '<td style="text-align:center">' + it.cantidad + '</td>' +
                '<td style="text-align:center">' + reemb + '</td>' +
                '<td style="text-align:center">' + disponible + '</td>' +
                '<td style="text-align:center">' +
                    '<input type="number" class="campo-input reembolso-cantidad" min="0" max="' + disponible + '" value="0" ' + deshabilitado +
                        ' style="width:70px;text-align:center" oninput="recalcularMontoReembolso()">' +
                '</td>' +
                '<td style="text-align:center">' +
                    '<label style="display:inline-flex;align-items:center;gap:4px;font-size:13px">' +
                        '<input type="checkbox" class="reembolso-retorna" checked ' + deshabilitado + '> Devolver a stock' +
                    '</label>' +
                '</td>' +
            '</tr>';
    });
    document.getElementById("filas-reembolso").innerHTML = filas;

    // Fuente del reembolso (RF-63), Caja por defecto.
    document.getElementById("reembolso-fuente").value = "caja";
    document.getElementById("reembolso-observaciones").value = "";
    recalcularMontoReembolso();
}

// Suma el monto a reembolsar según las cantidades escritas, aplicando el
// factor de descuento de la venta (para reflejar lo que el cliente pagó).
function recalcularMontoReembolso() {
    var filas = document.querySelectorAll("#filas-reembolso tr");
    var factor = window.__factorReembolso || 1;
    var monto = 0;
    filas.forEach(function (fila) {
        var precio = parseInt(fila.getAttribute("data-precio"));
        var disponible = parseInt(fila.getAttribute("data-disponible"));
        var input = fila.querySelector(".reembolso-cantidad");
        var cant = parseInt(input.value) || 0;
        // Clamp visual: no permitir más de lo disponible.
        if (cant > disponible) { cant = disponible; input.value = disponible; }
        if (cant < 0) { cant = 0; input.value = 0; }
        monto += Math.round(precio * cant * factor);
    });
    document.getElementById("reembolso-monto-total").textContent = formatearPrecio(monto);
}

async function confirmarReembolso() {
    if (!ventaReembolsoActual) return;

    // Recolectar items con cantidad > 0.
    var items = [];
    var filas = document.querySelectorAll("#filas-reembolso tr");
    filas.forEach(function (fila) {
        var cant = parseInt(fila.querySelector(".reembolso-cantidad").value) || 0;
        if (cant > 0) {
            items.push({
                ventaItemId: parseInt(fila.getAttribute("data-venta-item-id")),
                cantidad: cant,
                retornaInventario: fila.querySelector(".reembolso-retorna").checked
            });
        }
    });

    if (items.length === 0) {
        mostrarNotificacion("Indica la cantidad a reembolsar de al menos un producto.", "error");
        return;
    }

    // ¿Es total? Si la suma de cantidades reembolsadas (incluyendo previas)
    // cubre toda la venta. Para simplificar, lo marcamos parcial salvo que el
    // usuario reembolse todo lo disponible de todos los items.
    var todoDisponibleCubierto = true;
    filas.forEach(function (fila) {
        var disp = parseInt(fila.getAttribute("data-disponible"));
        var cant = parseInt(fila.querySelector(".reembolso-cantidad").value) || 0;
        if (disp > 0 && cant < disp) todoDisponibleCubierto = false;
    });

    var cuerpo = {
        tipo: todoDisponibleCubierto ? "total" : "parcial",
        fuente: document.getElementById("reembolso-fuente").value,
        observaciones: document.getElementById("reembolso-observaciones").value.trim() || null,
        items: items
    };

    mostrarLoader("Registrando reembolso...");
    try {
        await apiPost("/ventas/" + ventaReembolsoActual.id + "/reembolsos", cuerpo);
        // El backend pudo devolver stock; recargamos.
        await cargarProductosDesdeAPI();
        await cargarVentasDesdeAPI();
        cerrarModalReembolso();
        cargarHistorial();
        mostrarNotificacion("Reembolso registrado correctamente.", "exito");
    } catch (error) {
        mostrarNotificacion("No se pudo reembolsar: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

// ---------------------------------------------------------------------
//  CORRECCIÓN DE VENTAS  (PUT /api/ventas/:id/corregir, solo ADMIN)
// ---------------------------------------------------------------------

// Estado de la corrección en curso: la venta y sus items editables.
var correccionActual = null;

async function abrirCorreccion(idVenta) {
    mostrarLoader("Cargando venta...");
    try {
        // "Reabrir" valida que la venta sea corregible y trae sus datos.
        var resp = await apiGet("/ventas/" + idVenta + "/reabrir");
        var venta = resp.venta ? resp.venta : resp;

        // Estado editable: copiamos los items a un formato de trabajo.
        correccionActual = {
            id: venta.id,
            metodoPago: venta.metodoPago,
            clienteId: venta.clienteId || "",
            // Descuento que tenía la venta: lo conservamos para mostrarlo y para
            // que el total mostrado coincida con lo que el backend recalculará.
            descuentoId: venta.descuentoId || null,
            items: (venta.items || []).map(function (it) {
                return { productoId: it.productoId, nombre: it.nombreSnapshot, precio: it.precioUnitario, cantidad: it.cantidad };
            })
        };
        construirVistaCorreccion();
        mostrarVista("vista-correccion");
    } catch (error) {
        mostrarNotificacion("No se puede corregir: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

function construirVistaCorreccion() {
    document.getElementById("correccion-venta-id").textContent = correccionActual.id;

    // Método de pago.
    document.getElementById("correccion-metodo").value = correccionActual.metodoPago;

    // Cliente (poblar select con clientes registrados).
    var selCli = document.getElementById("correccion-cliente");
    selCli.innerHTML = '<option value="">Sin cliente</option>';
    for (var c = 0; c < listaClientes.length; c++) {
        selCli.innerHTML += '<option value="' + listaClientes[c].id + '">' + listaClientes[c].nombre + '</option>';
    }
    selCli.value = correccionActual.clienteId || "";

    renderItemsCorreccion();
    poblarSelectAgregarProductoCorreccion();
}

function renderItemsCorreccion() {
    var filas = "";
    var subtotalBruto = 0;
    correccionActual.items.forEach(function (it, idx) {
        var subtotal = it.precio * it.cantidad;
        subtotalBruto += subtotal;
        filas +=
            '<tr>' +
                '<td>' + it.nombre + '</td>' +
                '<td class="texto-mono">' + formatearPrecio(it.precio) + '</td>' +
                '<td style="text-align:center">' +
                    '<input type="number" class="campo-input" min="1" value="' + it.cantidad + '" ' +
                        'style="width:70px;text-align:center" onchange="cambiarCantidadCorreccion(' + idx + ', this.value)">' +
                '</td>' +
                '<td class="texto-precio">' + formatearPrecio(subtotal) + '</td>' +
                '<td><button class="btn-tabla peligro" onclick="quitarItemCorreccion(' + idx + ')">✕</button></td>' +
            '</tr>';
    });
    document.getElementById("filas-correccion").innerHTML = filas;

    // Calcular descuento sobre el nuevo subtotal (igual que hará el backend),
    // para que el total mostrado coincida con el que quedará guardado.
    var montoDescuento = calcularDescuentoCorreccion(subtotalBruto);
    var totalFinal = subtotalBruto - montoDescuento;

    // Mostrar el desglose: si hay descuento, lo indicamos.
    var infoDesc = document.getElementById("correccion-info-descuento");
    if (montoDescuento > 0) {
        infoDesc.textContent = "Subtotal " + formatearPrecio(subtotalBruto) +
            " · Descuento −" + formatearPrecio(montoDescuento);
        infoDesc.classList.remove("oculto");
    } else {
        infoDesc.classList.add("oculto");
    }
    document.getElementById("correccion-total").textContent = formatearPrecio(totalFinal);
}

// Calcula el monto de descuento que aplicaría sobre un subtotal dado, usando
// el descuento que tenía la venta (mismo criterio que el backend al corregir).
function calcularDescuentoCorreccion(subtotal) {
    if (!correccionActual.descuentoId) return 0;
    var desc = null;
    for (var i = 0; i < listaDescuentos.length; i++) {
        if (listaDescuentos[i].id == correccionActual.descuentoId) { desc = listaDescuentos[i]; break; }
    }
    if (!desc) return 0;
    var monto = desc.tipo === "porcentaje" ? Math.round((subtotal * desc.valor) / 100) : desc.valor;
    if (monto > subtotal) monto = subtotal;
    return monto;
}

function cambiarCantidadCorreccion(idx, valor) {
    var cant = parseInt(valor);
    if (isNaN(cant) || cant < 1) cant = 1;
    correccionActual.items[idx].cantidad = cant;
    renderItemsCorreccion();
}

function quitarItemCorreccion(idx) {
    correccionActual.items.splice(idx, 1);
    renderItemsCorreccion();
}

// Select para agregar un producto nuevo a la venta corregida.
function poblarSelectAgregarProductoCorreccion() {
    var sel = document.getElementById("correccion-agregar-producto");
    sel.innerHTML = '<option value="">+ Agregar producto…</option>';
    for (var i = 0; i < listaProductos.length; i++) {
        sel.innerHTML += '<option value="' + listaProductos[i].id + '">' + listaProductos[i].nombre + ' (' + formatearPrecio(listaProductos[i].precio) + ')</option>';
    }
    sel.value = "";
}

function agregarProductoACorreccion() {
    var sel = document.getElementById("correccion-agregar-producto");
    var idProd = parseInt(sel.value);
    if (!idProd) return;

    // ¿Ya está en la lista? Subir cantidad.
    for (var i = 0; i < correccionActual.items.length; i++) {
        if (correccionActual.items[i].productoId == idProd) {
            correccionActual.items[i].cantidad += 1;
            renderItemsCorreccion();
            sel.value = "";
            return;
        }
    }
    // Si no, buscar el producto en el catálogo y agregarlo.
    for (var j = 0; j < listaProductos.length; j++) {
        if (listaProductos[j].id == idProd) {
            correccionActual.items.push({
                productoId: listaProductos[j].id,
                nombre: listaProductos[j].nombre,
                precio: listaProductos[j].precio,
                cantidad: 1
            });
            break;
        }
    }
    renderItemsCorreccion();
    sel.value = "";
}

function cancelarCorreccion() {
    correccionActual = null;
    cargarHistorial();
    mostrarVista("vista-historial");
}

async function guardarCorreccion() {
    if (!correccionActual || correccionActual.items.length === 0) {
        mostrarNotificacion("La venta corregida debe tener al menos un producto.", "error");
        return;
    }

    var metodo = document.getElementById("correccion-metodo").value;
    var clienteId = document.getElementById("correccion-cliente").value;

    if (metodo === "debe" && !clienteId) {
        mostrarNotificacion("El método 'Debe' requiere seleccionar un cliente.", "error");
        return;
    }

    var cuerpo = {
        metodoPago: metodo,
        clienteId: clienteId ? parseInt(clienteId) : null,
        descuentoId: correccionActual.descuentoId || null,
        items: correccionActual.items.map(function (it) {
            return { productoId: it.productoId, cantidad: it.cantidad };
        }),
        motivo: document.getElementById("correccion-motivo").value.trim() || null
    };

    // Si el método es efectivo, el backend exige efectivoRecibido. Usamos el
    // total CON descuento (el que se muestra), no el subtotal bruto.
    if (metodo === "efectivo") {
        var totalTexto = document.getElementById("correccion-total").textContent.replace(/[^0-9]/g, "");
        cuerpo.efectivoRecibido = parseInt(totalTexto) || 0;
    }

    mostrarLoader("Guardando corrección...");
    try {
        await apiPut("/ventas/" + correccionActual.id + "/corregir", cuerpo);
        await cargarProductosDesdeAPI();
        await cargarVentasDesdeAPI();
        correccionActual = null;
        cargarHistorial();
        mostrarVista("vista-historial");
        mostrarNotificacion("Venta corregida correctamente.", "exito");
    } catch (error) {
        mostrarNotificacion("No se pudo corregir: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

// ---------------------------------------------------------------------
//  HISTORIAL DE CORRECCIONES  (GET /api/ventas/:id/correcciones)
// ---------------------------------------------------------------------
async function verCorrecciones(idVenta) {
    mostrarLoader("Cargando historial...");
    try {
        var correcciones = await apiGet("/ventas/" + idVenta + "/correcciones");
        var html = "";
        if (correcciones.length === 0) {
            html = "<p style='color:#9a9087'>Esta venta no tiene correcciones.</p>";
        } else {
            correcciones.forEach(function (c, i) {
                var ant = c.estadoAnterior || {};
                var pos = c.estadoPosterior || {};
                html +=
                    '<div class="correccion-item">' +
                        '<div class="correccion-cabecera">Corrección #' + (i + 1) +
                            ' · por ' + c.corregidaPor + ' · ' + formatearFecha(c.createdAt) + '</div>' +
                        (c.motivo ? '<div class="correccion-motivo">Motivo: ' + c.motivo + '</div>' : '') +
                        '<div class="correccion-comparativa">' +
                            '<div><strong>Antes:</strong> ' + resumenSnapshot(ant) + '</div>' +
                            '<div><strong>Después:</strong> ' + resumenSnapshot(pos) + '</div>' +
                        '</div>' +
                    '</div>';
            });
        }
        document.getElementById("contenido-correcciones").innerHTML = html;
        document.getElementById("modal-correcciones").classList.remove("oculto");
    } catch (error) {
        mostrarNotificacion("No se pudo cargar el historial: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

function cerrarModalCorrecciones() {
    document.getElementById("modal-correcciones").classList.add("oculto");
}

// Resume un snapshot (antes/después) a texto legible: total + lista de items.
function resumenSnapshot(snap) {
    var items = (snap.items || []).map(function (it) {
        return it.nombreSnapshot + " x" + it.cantidad;
    }).join(", ");
    return formatearPrecio(snap.total || 0) + " (" + (items || "sin items") + ")";
}

// ---------------------------------------------------------------------
//  REPORTES  (GET /api/reportes/...)
// ---------------------------------------------------------------------
function abrirReportes() {
    mostrarVista("vista-reportes");
    // Fechas por defecto: del primer día del mes actual a hoy.
    var hoy = new Date();
    var primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById("reporte-desde").value = primero.toISOString().slice(0, 10);
    document.getElementById("reporte-hasta").value = hoy.toISOString().slice(0, 10);
    document.getElementById("resultado-reportes").innerHTML =
        '<p style="color:#9a9087">Elige un rango de fechas y un reporte.</p>';
}

function rangoFechasReporte() {
    var desde = document.getElementById("reporte-desde").value;
    var hasta = document.getElementById("reporte-hasta").value;
    if (!desde || !hasta) {
        mostrarNotificacion("Indica las fechas desde y hasta.", "error");
        return null;
    }
    return "?desde=" + desde + "&hasta=" + hasta;
}

async function reporteVentas() {
    var rango = rangoFechasReporte();
    if (!rango) return;
    mostrarLoader("Generando reporte...");
    try {
        var r = await apiGet("/reportes/ventas" + rango);
        document.getElementById("resultado-reportes").innerHTML =
            '<div class="reporte-tarjetas">' +
                tarjetaReporte("Ventas totales", r.numeroVentas) +
                tarjetaReporte("Monto vendido", formatearPrecio(r.totalVendido)) +
                tarjetaReporte("Descuentos dados", formatearPrecio(r.totalDescuentos)) +
            '</div>';
    } catch (error) {
        mostrarNotificacion("Error: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

async function reporteProductos() {
    var rango = rangoFechasReporte();
    if (!rango) return;
    mostrarLoader("Generando reporte...");
    try {
        var filas = await apiGet("/reportes/productos-mas-vendidos" + rango + "&limite=10");
        var html = '<table><thead><tr><th>Producto</th><th>Unidades</th><th>Ingreso</th></tr></thead><tbody>';
        if (filas.length === 0) {
            html += '<tr><td colspan="3" style="color:#9a9087">Sin ventas en el rango.</td></tr>';
        } else {
            filas.forEach(function (f) {
                html += '<tr><td>' + f.nombre + '</td><td style="text-align:center">' + f.cantidadVendida +
                        '</td><td class="texto-precio">' + formatearPrecio(f.ingresoTotal) + '</td></tr>';
            });
        }
        html += '</tbody></table>';
        document.getElementById("resultado-reportes").innerHTML = html;
    } catch (error) {
        mostrarNotificacion("Error: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

async function reporteCompras() {
    var rango = rangoFechasReporte();
    if (!rango) return;
    mostrarLoader("Generando reporte...");
    try {
        var r = await apiGet("/reportes/compras" + rango);
        var html =
            '<div class="reporte-tarjetas">' +
                tarjetaReporte("Compras totales", r.numeroCompras) +
                tarjetaReporte("Monto invertido", formatearPrecio(r.totalComprado)) +
            '</div>';
        if (r.porMetodoPago && r.porMetodoPago.length > 0) {
            html += '<table style="margin-top:16px"><thead><tr><th>Método de pago</th><th>Compras</th><th>Total</th></tr></thead><tbody>';
            r.porMetodoPago.forEach(function (m) {
                html += '<tr><td>' + m.metodoPago + '</td><td style="text-align:center">' + m.numeroCompras +
                        '</td><td class="texto-precio">' + formatearPrecio(m.total) + '</td></tr>';
            });
            html += '</tbody></table>';
        }
        document.getElementById("resultado-reportes").innerHTML = html;
    } catch (error) {
        mostrarNotificacion("Error: " + error.message, "error");
    } finally {
        ocultarLoader();
    }
}

function tarjetaReporte(titulo, valor) {
    return '<div class="reporte-tarjeta"><div class="reporte-tarjeta-titulo">' + titulo +
           '</div><div class="reporte-tarjeta-valor">' + valor + '</div></div>';
}
