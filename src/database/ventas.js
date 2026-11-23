import { ejecutarTransaccion, obtenerBD } from './conexion';

const METODOS_PAGO = ['efectivo', 'qr'];
const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function idsValidos(empresaId, usuarioId) {
  const empresa = Number(empresaId);
  const usuario = Number(usuarioId);
  return {
    empresa: Number.isInteger(empresa) && empresa > 0 ? empresa : null,
    usuario: Number.isInteger(usuario) && usuario > 0 ? usuario : null,
  };
}

export async function registrarVenta({
  empresaId,
  usuarioId,
  sesionCajaId = null,
  items,
  descuento = 0,
  metodoPago = 'efectivo',
}) {
  const { empresa, usuario } = idsValidos(empresaId, usuarioId);
  if (!empresa) throw new Error('No hay una empresa activa. Vuelve a seleccionar tu negocio.');
  if (!usuario) throw new Error('La sesión del usuario no es válida. Vuelve a iniciar sesión.');

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El carrito de venta está vacío.');
  }

  const metodoNormalizado = String(metodoPago).toLowerCase();
  if (!METODOS_PAGO.includes(metodoNormalizado)) {
    throw new Error('Método de pago no válido (solo efectivo o qr).');
  }

  const db = await obtenerBD();
  let resultadoVenta = null;

  await ejecutarTransaccion(db, async (txn) => {
    const cuenta = await txn.getFirstAsync('SELECT id FROM usuarios WHERE id = ?', usuario);
    if (!cuenta) {
      throw new Error('Tu cuenta ya no existe. Cierra sesión y vuelve a ingresar.');
    }

    let sesion = null;
    if (sesionCajaId) {
      sesion = await txn.getFirstAsync(
        "SELECT id FROM sesiones_caja WHERE id = ? AND empresa_id = ? AND estado = 'abierta'",
        Number(sesionCajaId),
        empresa
      );
    } else {
      sesion = await txn.getFirstAsync(
        "SELECT id FROM sesiones_caja WHERE empresa_id = ? AND estado = 'abierta' ORDER BY id DESC LIMIT 1",
        empresa
      );
    }

    if (!sesion) {
      throw new Error('La caja está cerrada. Abre un turno en Caja antes de registrar la venta.');
    }

    const lineas = [];
    let subtotal = 0;

    for (const item of items) {
      const prod = await txn.getFirstAsync(
        `SELECT id, nombre, precio_venta, stock_actual, activo
         FROM productos WHERE id = ? AND empresa_id = ?`,
        Number(item.productoId),
        empresa
      );

      if (!prod || Number(prod.activo) === 0) {
        throw new Error(`El producto #${item.productoId} no está disponible en esta empresa.`);
      }

      const cantidad = Number(item.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error(`Cantidad no válida para "${prod.nombre}".`);
      }

      const stockActual = Number(prod.stock_actual);
      if (stockActual < cantidad) {
        throw new Error(
          `Existencia insuficiente para "${prod.nombre}". Disponible: ${stockActual}, solicitado: ${cantidad}.`
        );
      }

      const lineaSubtotal = redondear(Number(prod.precio_venta) * cantidad);
      subtotal = redondear(subtotal + lineaSubtotal);

      lineas.push({
        productoId: prod.id,
        nombre: prod.nombre,
        precioUnitario: Number(prod.precio_venta),
        cantidad,
        subtotal: lineaSubtotal,
        stockAnterior: stockActual,
        stockNuevo: stockActual - cantidad,
      });
    }

    const desc = Math.max(0, redondear(descuento));
    const total = Math.max(0, redondear(subtotal - desc));

    const max = await txn.getFirstAsync('SELECT MAX(numero_venta) AS ultimo FROM ventas');
    const siguienteNumero = Number(max?.ultimo || 0) + 1;

    const cabecera = await txn.runAsync(
      `INSERT INTO ventas
        (empresa_id, usuario_id, sesion_caja_id, numero_venta, subtotal, descuento, total, metodo_pago, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completada')`,
      empresa,
      usuario,
      sesion.id,
      siguienteNumero,
      subtotal,
      desc,
      total,
      metodoNormalizado
    );

    const ventaId = cabecera.lastInsertRowId;

    await txn.runAsync(
      `INSERT INTO pagos_venta (venta_id, metodo_pago, monto, monto_recibido, cambio)
       VALUES (?, ?, ?, ?, 0)`,
      ventaId,
      metodoNormalizado,
      total,
      total
    );

    for (const linea of lineas) {
      await txn.runAsync(
        `INSERT INTO detalle_venta
          (venta_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ventaId,
        linea.productoId,
        linea.nombre,
        linea.precioUnitario,
        linea.cantidad,
        linea.subtotal
      );

      await txn.runAsync(
        'UPDATE productos SET stock_actual = ? WHERE id = ? AND empresa_id = ?',
        linea.stockNuevo,
        linea.productoId,
        empresa
      );

      await txn.runAsync(
        `INSERT INTO movimientos_inventario
          (empresa_id, producto_id, usuario_id, venta_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
         VALUES (?, ?, ?, ?, 'venta', ?, ?, ?, ?)`,
        empresa,
        linea.productoId,
        usuario,
        ventaId,
        linea.cantidad,
        linea.stockAnterior,
        linea.stockNuevo,
        `Venta #${siguienteNumero}`
      );
    }

    resultadoVenta = {
      id: ventaId,
      numero_venta: siguienteNumero,
      subtotal,
      descuento: desc,
      total,
      metodo_pago: metodoNormalizado,
      items: lineas.length,
      sesion_caja_id: sesion.id,
    };
  });

  return resultadoVenta;
}

export async function obtenerVentas({
  empresaId,
  metodoPago,
  limite = 50,
  incluirAnuladas = false,
} = {}) {
  const empresa = Number(empresaId);
  if (!Number.isInteger(empresa) || empresa <= 0) return [];

  const db = await obtenerBD();
  const condiciones = ['v.empresa_id = ?'];
  const parametros = [empresa];

  if (!incluirAnuladas) {
    condiciones.push("v.estado = 'completada'");
  }

  if (metodoPago && METODOS_PAGO.includes(String(metodoPago).toLowerCase())) {
    condiciones.push('v.metodo_pago = ?');
    parametros.push(String(metodoPago).toLowerCase());
  }

  const sql = `
    SELECT v.*, u.nombre AS vendedor,
      (SELECT COALESCE(SUM(cantidad), 0) FROM detalle_venta d WHERE d.venta_id = v.id) AS total_items,
      (SELECT nombre_producto FROM detalle_venta d WHERE d.venta_id = v.id LIMIT 1) AS primer_producto
    FROM ventas v
    JOIN usuarios u ON u.id = v.usuario_id
    WHERE ${condiciones.join(' AND ')}
    ORDER BY v.id DESC
    LIMIT ?
  `;
  parametros.push(Number(limite) || 50);

  return db.getAllAsync(sql, ...parametros);
}

export async function obtenerVentaPorId(id, empresaId) {
  const db = await obtenerBD();
  const empresa = Number(empresaId);
  const filtroEmpresa = Number.isInteger(empresa) && empresa > 0;

  const venta = await db.getFirstAsync(
    `SELECT v.*, u.nombre AS vendedor
     FROM ventas v
     JOIN usuarios u ON u.id = v.usuario_id
     WHERE v.id = ?${filtroEmpresa ? ' AND v.empresa_id = ?' : ''}`,
    ...(filtroEmpresa ? [Number(id), empresa] : [Number(id)])
  );

  if (!venta) return null;

  const items = await db.getAllAsync(
    'SELECT * FROM detalle_venta WHERE venta_id = ? ORDER BY id ASC',
    Number(id)
  );

  return { ...venta, items };
}

export async function obtenerResumenCaja(
  empresaId,
  { sesionCajaId = null, soloHoy = false } = {}
) {
  const empresa = Number(empresaId);
  if (!Number.isInteger(empresa) || empresa <= 0) {
    return { totalVentas: 0, totalRecaudado: 0, totalEfectivo: 0, totalQr: 0 };
  }

  const db = await obtenerBD();
  const condiciones = ["empresa_id = ?", "estado = 'completada'"];
  const parametros = [empresa];

  if (sesionCajaId) {
    condiciones.push('sesion_caja_id = ?');
    parametros.push(Number(sesionCajaId));
  } else if (soloHoy) {
    condiciones.push("date(creado_en) = date('now', 'localtime')");
  }

  const fila = await db.getFirstAsync(
    `SELECT
       COUNT(*) AS total_ventas,
       COALESCE(SUM(total), 0) AS total_recaudado,
       COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS total_efectivo,
       COALESCE(SUM(CASE WHEN metodo_pago = 'qr' THEN total ELSE 0 END), 0) AS total_qr
     FROM ventas
     WHERE ${condiciones.join(' AND ')}`,
    ...parametros
  );

  return {
    totalVentas: Number(fila?.total_ventas ?? 0),
    totalRecaudado: Number(fila?.total_recaudado ?? 0),
    totalEfectivo: Number(fila?.total_efectivo ?? 0),
    totalQr: Number(fila?.total_qr ?? 0),
  };
}

export async function obtenerVentasPorHora(empresaId) {
  const empresa = Number(empresaId);
  const datos = [0, 0, 0, 0, 0, 0, 0];
  if (!Number.isInteger(empresa) || empresa <= 0) return datos;

  const db = await obtenerBD();
  const filas = await db.getAllAsync(
    `SELECT CAST(strftime('%H', creado_en) AS INTEGER) AS hora,
            COALESCE(SUM(total), 0) AS total
     FROM ventas
     WHERE empresa_id = ?
       AND estado = 'completada'
       AND date(creado_en) = date('now', 'localtime')
     GROUP BY hora`,
    empresa
  );

  for (const fila of filas) {
    const hora = Number(fila.hora);
    let indice = 0;
    if (hora >= 20) indice = 6;
    else if (hora >= 18) indice = 5;
    else if (hora >= 16) indice = 4;
    else if (hora >= 14) indice = 3;
    else if (hora >= 12) indice = 2;
    else if (hora >= 10) indice = 1;
    datos[indice] = redondear(datos[indice] + Number(fila.total || 0));
  }

  return datos;
}

export async function anularVenta(ventaId, empresaId) {
  const empresa = Number(empresaId);
  if (!Number.isInteger(empresa) || empresa <= 0) {
    throw new Error('No hay una empresa activa.');
  }

  const db = await obtenerBD();
  let anulada = false;

  await ejecutarTransaccion(db, async (txn) => {
    const venta = await txn.getFirstAsync(
      'SELECT id FROM ventas WHERE id = ? AND empresa_id = ?',
      Number(ventaId),
      empresa
    );

    if (!venta) {
      throw new Error('La venta no existe o no pertenece a tu empresa.');
    }

    const items = await txn.getAllAsync(
      'SELECT producto_id, cantidad FROM detalle_venta WHERE venta_id = ?',
      Number(ventaId)
    );

    for (const item of items) {
      await txn.runAsync(
        'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ? AND empresa_id = ?',
        Number(item.cantidad),
        Number(item.producto_id),
        empresa
      );
    }

    await txn.runAsync('DELETE FROM detalle_venta WHERE venta_id = ?', Number(ventaId));
    await txn.runAsync('DELETE FROM pagos_venta WHERE venta_id = ?', Number(ventaId));
    await txn.runAsync('DELETE FROM movimientos_inventario WHERE venta_id = ?', Number(ventaId));
    await txn.runAsync('DELETE FROM ventas WHERE id = ? AND empresa_id = ?', Number(ventaId), empresa);
    anulada = true;
  });

  return { id: ventaId, anulada };
}
