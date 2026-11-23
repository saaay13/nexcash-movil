import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export const NOMBRE_BD = 'nexcash.db';

let promesaBD = null;

export function registrarBD(db) {
  if (!db) return promesaBD;
  promesaBD = Promise.resolve(db);
  return db;
}

export function obtenerBD() {
  if (!promesaBD) {
    promesaBD = SQLite.openDatabaseAsync(NOMBRE_BD).catch((error) => {
      promesaBD = null;
      throw error;
    });
  }
  return promesaBD;
}

export async function ejecutarTransaccion(db, tarea) {
  const exclusiva =
    Platform.OS !== 'web' && typeof db.withExclusiveTransactionAsync === 'function';

  if (exclusiva) {
    return db.withExclusiveTransactionAsync(tarea);
  }

  if (typeof db.withTransactionAsync === 'function') {
    return db.withTransactionAsync(async () => tarea(db));
  }

  return tarea(db);
}

const TEXTOS_INGLES = [
  {
    patron: /withExclusiveTransactionAsync is not supported on web/i,
    texto: 'Las transacciones exclusivas no están disponibles en la versión web. Se aplicó una transacción compatible.',
  },
  {
    patron: /cannot start a transaction within a transaction/i,
    texto: 'Ya hay una operación en curso. Intenta nuevamente.',
  },
  {
    patron: /foreign key constraint failed/i,
    texto: 'No se pudo guardar porque el registro está relacionado con otros datos.',
  },
  {
    patron: /unique constraint failed/i,
    texto: 'Ya existe un registro con esos datos. Intenta con otro valor.',
  },
  {
    patron: /database (table )?is locked/i,
    texto: 'La base de datos está ocupada. Intenta nuevamente.',
  },
  {
    patron: /no such table/i,
    texto: 'Falta una tabla en la base de datos. Reinicia la aplicación.',
  },
  {
    patron: /no such column/i,
    texto: 'La base de datos necesita actualizarse. Cierra y abre la aplicación para continuar.',
  },
  {
    patron: /syntax error|near\s+["']/i,
    texto: 'La consulta de la base de datos no es válida.',
  },
  {
    patron: /sqlite_constraint/i,
    texto: 'Los datos no cumplen las reglas de la base de datos.',
  },
  {
    patron: /network request failed|failed to fetch|load failed/i,
    texto: 'No se pudo conectar con el servicio. Revisa tu conexión a internet.',
  },
  {
    patron: /not supported|unsupported/i,
    texto: 'Esta acción no está disponible en esta versión de la aplicación.',
  },
];

const ESPANOL =
  /\b(no|el|la|los|las|un|una|de|del|que|para|con|por|es|ya|debe|intenta|sesion|sesión|caja|empresa|producto|venta|registro|datos|obligatorio|válido|valido|insuficiente|disponible|solicitado|requerido|cuenta|correo|contraseña|categoría|movimiento|turno|existencia)\b/i;

export function mensajeError(error, predeterminado = 'Ocurrió un error. Intenta nuevamente.') {
  const texto = String(error?.message ?? error ?? '').trim();
  if (!texto) return predeterminado;

  for (const item of TEXTOS_INGLES) {
    if (item.patron.test(texto)) return item.texto;
  }

  if (ESPANOL.test(texto)) return texto;

  return predeterminado;
}
