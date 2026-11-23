import { obtenerBD, registrarBD } from './conexion';
import { ESQUEMA_TABLAS, INDICES } from './esquema';

export * from './conexion';
export * from './esquema';
export * from './usuarios';
export * from './empresas';
export * from './categorias';
export * from './productos';
export * from './inventario';
export * from './caja';
export * from './ventas';

const VERSION_ESQUEMA = 3;

async function asegurarColumnas(db, tabla, definiciones) {
  const info = await db.getAllAsync(`PRAGMA table_info(${tabla})`);
  const existentes = new Set(info.map((columna) => columna.name));

  for (const [nombre, definicion] of definiciones) {
    if (!existentes.has(nombre)) {
      await db.execAsync(`ALTER TABLE ${tabla} ADD COLUMN ${nombre} ${definicion}`);
    }
  }
}

async function migrarColumnas(db) {
  await asegurarColumnas(db, 'empresas', [
    ['direccion', 'TEXT'],
    ['telefono', 'TEXT'],
    ['correo_contacto', 'TEXT'],
    ['codigo_vinculacion', "TEXT NOT NULL DEFAULT ''"],
    ['codigo_privado', 'TEXT'],
    ['estado', "TEXT NOT NULL DEFAULT 'activo'"],
    ['propietario_id', 'INTEGER'],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ]);

  await asegurarColumnas(db, 'usuarios', [
    ['telefono', 'TEXT'],
    ['foto_perfil', 'TEXT'],
    ['rol', "TEXT NOT NULL DEFAULT 'vendedor'"],
    ['estado', "TEXT NOT NULL DEFAULT 'activo'"],
    ['creado_en', "TEXT NOT NULL DEFAULT ''"],
  ]);
}

export async function iniciarBD(dbExterna) {
  const db = dbExterna ? registrarBD(dbExterna) : await obtenerBD();

  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await db.execAsync(ESQUEMA_TABLAS);
  await migrarColumnas(db);
  await db.execAsync(INDICES);

  const fila = await db.getFirstAsync('PRAGMA user_version');
  const version = Number(fila?.user_version ?? 0);

  if (version < VERSION_ESQUEMA) {
    await db.execAsync(`PRAGMA user_version = ${VERSION_ESQUEMA}`);
  }

  return db;
}
