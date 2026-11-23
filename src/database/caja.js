import { ejecutarTransaccion, obtenerBD } from './conexion';

const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function idsValidos(empresaId, usuarioId) {
  const empresa = Number(empresaId);
  const usuario = Number(usuarioId);
  return {
    empresa: Number.isInteger(empresa) && empresa > 0 ? empresa : null,
    usuario: Number.isInteger(usuario) && usuario > 0 ? usuario : null,
  };
}

export async function obtenerSesionActiva(empresaId) {
  const empresa = Number(empresaId);
  if (!Number.isInteger(empresa) || empresa <= 0) return null;

  const db = await obtenerBD();
  return db.getFirstAsync(
    `SELECT s.*, u.nombre AS usuario_apertura
     FROM sesiones_caja s
     JOIN usuarios u ON u.id = s.usuario_apertura_id
     WHERE s.empresa_id = ? AND s.estado = 'abierta'
     ORDER BY s.id DESC
     LIMIT 1`,
    empresa
  );
}

export async function abrirSesionCaja({ usuarioId, empresaId, montoInicial = 0 }) {
  const { empresa, usuario } = idsValidos(empresaId, usuarioId);
  if (!empresa) throw new Error('No hay una empresa activa.');
  if (!usuario) throw new Error('La sesión del usuario no es válida.');

  const inicial = Number(String(montoInicial).replace(',', '.'));
  if (!Number.isFinite(inicial) || inicial < 0) {
    throw new Error('El fondo inicial debe ser un monto válido mayor o igual a cero.');
  }

  const db = await obtenerBD();
  let sesionId = null;

  await ejecutarTransaccion(db, async (txn) => {
    const abierta = await txn.getFirstAsync(
      "SELECT id FROM sesiones_caja WHERE empresa_id = ? AND estado = 'abierta'",
      empresa
    );
    if (abierta) {
      throw new Error('Ya existe un turno de caja abierto para esta empresa.');
    }

    const res = await txn.runAsync(
      `INSERT INTO sesiones_caja (empresa_id, usuario_apertura_id, monto_inicial, monto_esperado, estado)
       VALUES (?, ?, ?, ?, 'abierta')`,
      empresa,
      usuario,
      redondear(inicial),
      redondear(inicial)
    );

    sesionId = res.lastInsertRowId;
  });

  return { id: sesionId, monto_inicial: redondear(inicial), estado: 'abierta' };
}

export async function registrarMovimientoCaja({
  sesionCajaId,
  usuarioId,
  empresaId,
  tipo,
  concepto,
  monto,
}) {
  if (!sesionCajaId) throw new Error('ID de sesión de caja requerido.');
  if (!['ingreso', 'egreso'].includes(tipo)) {
    throw new Error('El tipo de movimiento debe ser ingreso o egreso.');
  }

  const montoNum = redondear(String(monto).replace(',', '.'));
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    throw new Error('El monto debe ser mayor a 0.');
  }
  if (!concepto?.trim()) throw new Error('El concepto es obligatorio.');

  const { empresa, usuario } = idsValidos(empresaId, usuarioId);
  if (!empresa) throw new Error('No hay una empresa activa.');
  if (!usuario) throw new Error('La sesión del usuario no es válida.');

  const db = await obtenerBD();
  const sesion = await db.getFirstAsync(
    "SELECT id FROM sesiones_caja WHERE id = ? AND empresa_id = ? AND estado = 'abierta'",
    Number(sesionCajaId),
    empresa
  );
  if (!sesion) {
    throw new Error('La caja ya está cerrada. Abre un nuevo turno para registrar movimientos.');
  }

  const res = await db.runAsync(
    `INSERT INTO movimientos_caja (empresa_id, sesion_caja_id, usuario_id, tipo, concepto, monto)
     VALUES (?, ?, ?, ?, ?, ?)`,
    empresa,
    Number(sesionCajaId),
    usuario,
    tipo,
    concepto.trim(),
    montoNum
  );

  return { id: res.lastInsertRowId, sesionCajaId, tipo, concepto, monto: montoNum };
}

export async function obtenerMovimientosCaja(sesionCajaId) {
  if (!sesionCajaId) return [];

  const db = await obtenerBD();
  return db.getAllAsync(
    `SELECT m.*, u.nombre AS usuario
     FROM movimientos_caja m
     JOIN usuarios u ON u.id = m.usuario_id
     WHERE m.sesion_caja_id = ?
     ORDER BY m.id DESC`,
    Number(sesionCajaId)
  );
}

export async function obtenerHistorialMovimientosCaja(empresaId, { limite = 100 } = {}) {
  const empresa = Number(empresaId);
  if (!Number.isInteger(empresa) || empresa <= 0) return [];

  const db = await obtenerBD();
  return db.getAllAsync(
    `SELECT
       m.id,
       m.tipo,
       m.concepto,
       m.monto,
       m.creado_en,
       m.sesion_caja_id,
       u.nombre AS usuario,
       s.estado AS sesion_estado
     FROM movimientos_caja m
     JOIN usuarios u ON u.id = m.usuario_id
     JOIN sesiones_caja s ON s.id = m.sesion_caja_id
     WHERE m.empresa_id = ?
     ORDER BY m.id DESC
     LIMIT ?`,
    empresa,
    Number(limite) || 100
  );
}

export async function cerrarSesionCaja({ sesionId, usuarioId, empresaId, montoReal }) {
  const { empresa, usuario } = idsValidos(empresaId, usuarioId);
  if (!empresa) throw new Error('No hay una empresa activa.');
  if (!usuario) throw new Error('La sesión del usuario no es válida.');

  const real = redondear(String(montoReal).replace(',', '.'));
  if (!Number.isFinite(real) || real < 0) {
    throw new Error('El monto contado debe ser un número mayor o igual a cero.');
  }

  const db = await obtenerBD();
  const sesion = await db.getFirstAsync(
    "SELECT * FROM sesiones_caja WHERE id = ? AND empresa_id = ? AND estado = 'abierta'",
    Number(sesionId),
    empresa
  );

  if (!sesion) throw new Error('No se encontró un turno de caja abierto para cerrar.');

  const resumen = await db.getFirstAsync(
    `SELECT COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS total_efectivo
     FROM ventas
     WHERE sesion_caja_id = ? AND estado = 'completada'`,
    Number(sesionId)
  );

  const movs = await db.getFirstAsync(
    `SELECT
      COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS total_ingresos,
      COALESCE(SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END), 0) AS total_egresos
     FROM movimientos_caja
     WHERE sesion_caja_id = ?`,
    Number(sesionId)
  );

  const totalEfectivo = Number(resumen?.total_efectivo || 0);
  const ingresos = Number(movs?.total_ingresos || 0);
  const egresos = Number(movs?.total_egresos || 0);

  const montoEsperado = redondear(Number(sesion.monto_inicial) + totalEfectivo + ingresos - egresos);
  const diferencia = redondear(real - montoEsperado);

  await db.runAsync(
    `UPDATE sesiones_caja
     SET usuario_cierre_id = ?,
         monto_esperado = ?,
         monto_real = ?,
         diferencia = ?,
         estado = 'cerrada',
         fecha_cierre = datetime('now', 'localtime')
     WHERE id = ? AND empresa_id = ?`,
    usuario,
    montoEsperado,
    real,
    diferencia,
    Number(sesionId),
    empresa
  );

  return {
    sesionId,
    montoInicial: Number(sesion.monto_inicial),
    montoEsperado,
    montoReal: real,
    diferencia,
    estado: 'cerrada',
  };
}
