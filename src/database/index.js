import { obtenerBD, registrarBD } from './conexion';
import { ESQUEMA_TABLAS, INDICES } from './esquema';

export * from './conexion';
export * from './configuracion';
export * from './esquema';
export * from './usuarios';
export * from './empresas';
export * from './categorias';
export * from './productos';
export * from './inventario';
export * from './caja';
export * from './ventas';

const VERSION_ESQUEMA = 4;

const COLUMNAS_TABLAS = {
  empresas: [
    ['nombre', "TEXT NOT NULL DEFAULT ''"],
    ['direccion', 'TEXT'],
    ['telefono', 'TEXT'],
    ['correo_contacto', 'TEXT'],
    ['codigo_vinculacion', "TEXT NOT NULL DEFAULT ''"],
    ['codigo_privado', 'TEXT'],
    ['estado', "TEXT NOT NULL DEFAULT 'activo'"],
    ['propietario_id', 'INTEGER'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  usuarios: [
    ['nombre', "TEXT NOT NULL DEFAULT ''"],
    ['correo', "TEXT NOT NULL DEFAULT ''"],
    ['password', "TEXT NOT NULL DEFAULT ''"],
    ['telefono', 'TEXT'],
    ['foto_perfil', 'TEXT'],
    ['rol', "TEXT NOT NULL DEFAULT 'vendedor'"],
    ['estado', "TEXT NOT NULL DEFAULT 'activo'"],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  empresa_usuarios: [
    ['empresa_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['usuario_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['rol', "TEXT NOT NULL DEFAULT 'vendedor'"],
    ['estado', "TEXT NOT NULL DEFAULT 'aprobado'"],
    ['aprobado_por', 'INTEGER'],
    ['fecha_aprobacion', 'TEXT'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  categorias: [
    ['empresa_id', 'INTEGER'],
    ['nombre', "TEXT NOT NULL DEFAULT ''"],
    ['descripcion', 'TEXT'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  productos: [
    ['empresa_id', 'INTEGER'],
    ['categoria_id', 'INTEGER'],
    ['categoria', 'TEXT'],
    ['nombre', "TEXT NOT NULL DEFAULT ''"],
    ['descripcion', 'TEXT'],
    ['codigo_barras', 'TEXT'],
    ['precio_compra', 'REAL NOT NULL DEFAULT 0'],
    ['precio_venta', 'REAL NOT NULL DEFAULT 0'],
    ['stock_actual', 'INTEGER NOT NULL DEFAULT 0'],
    ['stock_minimo', 'INTEGER NOT NULL DEFAULT 5'],
    ['imagen', 'TEXT'],
    ['estado', "TEXT NOT NULL DEFAULT 'activo'"],
    ['activo', 'INTEGER NOT NULL DEFAULT 1'],
    ['api_id', 'INTEGER'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  movimientos_inventario: [
    ['empresa_id', 'INTEGER'],
    ['producto_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['usuario_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['venta_id', 'INTEGER'],
    ['tipo', "TEXT NOT NULL DEFAULT 'ajuste'"],
    ['cantidad', 'INTEGER NOT NULL DEFAULT 0'],
    ['stock_anterior', 'INTEGER NOT NULL DEFAULT 0'],
    ['stock_nuevo', 'INTEGER NOT NULL DEFAULT 0'],
    ['motivo', 'TEXT'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  sesiones_caja: [
    ['empresa_id', 'INTEGER'],
    ['usuario_apertura_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['usuario_cierre_id', 'INTEGER'],
    ['monto_inicial', 'REAL NOT NULL DEFAULT 0'],
    ['monto_esperado', 'REAL NOT NULL DEFAULT 0'],
    ['monto_real', 'REAL'],
    ['diferencia', 'REAL'],
    ['estado', "TEXT NOT NULL DEFAULT 'abierta'"],
    ['fecha_cierre', 'TEXT'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  movimientos_caja: [
    ['empresa_id', 'INTEGER'],
    ['sesion_caja_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['usuario_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['tipo', "TEXT NOT NULL DEFAULT 'ingreso'"],
    ['concepto', "TEXT NOT NULL DEFAULT ''"],
    ['monto', 'REAL NOT NULL DEFAULT 0'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  ventas: [
    ['empresa_id', 'INTEGER'],
    ['usuario_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['sesion_caja_id', 'INTEGER'],
    ['numero_venta', 'INTEGER NOT NULL DEFAULT 0'],
    ['subtotal', 'REAL NOT NULL DEFAULT 0'],
    ['descuento', 'REAL NOT NULL DEFAULT 0'],
    ['total', 'REAL NOT NULL DEFAULT 0'],
    ['token_comprobante', 'TEXT'],
    ['metodo_pago', "TEXT NOT NULL DEFAULT 'efectivo'"],
    ['estado', "TEXT NOT NULL DEFAULT 'completada'"],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
  detalle_venta: [
    ['venta_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['producto_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['nombre_producto', "TEXT NOT NULL DEFAULT ''"],
    ['precio_unitario', 'REAL NOT NULL DEFAULT 0'],
    ['cantidad', 'INTEGER NOT NULL DEFAULT 1'],
    ['subtotal', 'REAL NOT NULL DEFAULT 0'],
  ],
  pagos_venta: [
    ['venta_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['metodo_pago', "TEXT NOT NULL DEFAULT 'efectivo'"],
    ['monto', 'REAL NOT NULL DEFAULT 0'],
    ['monto_recibido', 'REAL'],
    ['cambio', 'REAL DEFAULT 0'],
    ['referencia_pago', 'TEXT'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ],
};

async function asegurarColumnas(db, tabla, definiciones) {
  const info = await db.getAllAsync(`PRAGMA table_info("${tabla}")`);
  const existentes = new Set(info.map((columna) => columna.name));

  for (const [nombre, definicion] of definiciones) {
    if (existentes.has(nombre)) continue;

    try {
      await db.execAsync(`ALTER TABLE "${tabla}" ADD COLUMN "${nombre}" ${definicion}`);
    } catch (error) {
      const mensaje = String(error?.message ?? '');
      if (!/duplicate column name/i.test(mensaje)) throw error;
    }
  }
}

async function migrarColumnas(db) {
  for (const [tabla, definiciones] of Object.entries(COLUMNAS_TABLAS)) {
    await asegurarColumnas(db, tabla, definiciones);
  }
}

export async function iniciarBD(dbExterna) {
  const db = dbExterna ? registrarBD(dbExterna) : await obtenerBD();

  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await db.execAsync(ESQUEMA_TABLAS);
  await migrarColumnas(db);
  await db.runAsync(
    `UPDATE empresas
     SET correo_contacto = (
       SELECT u.correo FROM usuarios u WHERE u.id = empresas.propietario_id
     )
     WHERE (correo_contacto IS NULL OR correo_contacto = '')
       AND propietario_id IS NOT NULL`
  );
  await db.execAsync(INDICES);

  const fila = await db.getFirstAsync('PRAGMA user_version');
  const version = Number(fila?.user_version ?? 0);

  if (version < VERSION_ESQUEMA) {
    await db.execAsync(`PRAGMA user_version = ${VERSION_ESQUEMA}`);
  }

  return db;
}
