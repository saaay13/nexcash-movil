import { ejecutarTransaccion, obtenerBD } from './conexion';

const TIPOS = ['entrada', 'salida', 'ajuste'];

export async function obtenerMovimientosInventario(empresaId, limite = 100) {
  const empresa = Number(empresaId);
  if (!Number.isInteger(empresa) || empresa <= 0) return [];

  const db = await obtenerBD();
  const sql = `
    SELECT
      m.id,
      m.tipo,
      m.cantidad,
      m.stock_anterior,
      m.stock_nuevo,
      m.motivo,
      m.creado_en,
      p.nombre AS nombre_producto,
      u.nombre AS nombre_usuario
    FROM movimientos_inventario m
    JOIN productos p ON p.id = m.producto_id
    LEFT JOIN usuarios u ON u.id = m.usuario_id
    WHERE m.empresa_id = ?
    ORDER BY m.id DESC
    LIMIT ?
  `;
  return db.getAllAsync(sql, empresa, Number(limite) || 100);
}

export async function registrarMovimientoInventario({
  empresaId,
  productoId,
  usuarioId,
  tipo = 'entrada',
  cantidad,
  motivo = '',
}) {
  const empresa = Number(empresaId);
  const usuario = Number(usuarioId);

  if (!Number.isInteger(empresa) || empresa <= 0) {
    throw new Error('No hay una empresa activa. Vuelve a seleccionar tu negocio.');
  }
  if (!Number.isInteger(usuario) || usuario <= 0) {
    throw new Error('La sesión del usuario no es válida. Vuelve a iniciar sesión.');
  }
  if (!productoId) {
    throw new Error('Debes seleccionar un producto.');
  }
  if (!TIPOS.includes(tipo)) {
    throw new Error('Tipo de movimiento no válido.');
  }

  const cant = Number(cantidad);
  if (!Number.isInteger(cant) || cant <= 0) {
    throw new Error('La cantidad debe ser un número entero mayor a cero.');
  }

  const db = await obtenerBD();
  let resultado = null;

  await ejecutarTransaccion(db, async (txn) => {
    const prod = await txn.getFirstAsync(
      'SELECT id, stock_actual, nombre FROM productos WHERE id = ? AND empresa_id = ?',
      Number(productoId),
      empresa
    );

    if (!prod) {
      throw new Error('Producto no encontrado en esta empresa.');
    }

    const stockAnterior = Number(prod.stock_actual);
    let stockNuevo = stockAnterior;

    if (tipo === 'entrada') {
      stockNuevo = stockAnterior + cant;
    } else if (tipo === 'salida') {
      if (stockAnterior < cant) {
        throw new Error(`Existencia insuficiente. Disponible: ${stockAnterior}, requerido: ${cant}`);
      }
      stockNuevo = stockAnterior - cant;
    } else {
      stockNuevo = cant;
    }

    const res = await txn.runAsync(
      `INSERT INTO movimientos_inventario
        (empresa_id, producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      empresa,
      Number(productoId),
      usuario,
      tipo,
      cant,
      stockAnterior,
      stockNuevo,
      String(motivo || 'Ajuste manual de inventario').trim()
    );

    await txn.runAsync(
      'UPDATE productos SET stock_actual = ? WHERE id = ? AND empresa_id = ?',
      stockNuevo,
      Number(productoId),
      empresa
    );

    resultado = {
      id: res.lastInsertRowId,
      producto_id: prod.id,
      nombre_producto: prod.nombre,
      tipo,
      cantidad: cant,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      motivo,
    };
  });

  return resultado;
}
