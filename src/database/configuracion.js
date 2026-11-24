import { obtenerBD } from './conexion';

const CLAVES = {
  sonidoEscaneo: 'sonido_escaneo',
  vibracionEscaneo: 'vibracion_escaneo',
};

export async function obtenerPreferenciasEscaneo() {
  const db = await obtenerBD();
  const filas = await db.getAllAsync(
    'SELECT clave, valor FROM configuracion WHERE clave IN (?, ?)',
    CLAVES.sonidoEscaneo,
    CLAVES.vibracionEscaneo
  );
  const valores = new Map(filas.map((fila) => [fila.clave, Number(fila.valor) !== 0]));

  return {
    sonidoEscaneo: valores.get(CLAVES.sonidoEscaneo) ?? true,
    vibracionEscaneo: valores.get(CLAVES.vibracionEscaneo) ?? true,
  };
}

export async function guardarPreferenciaEscaneo(nombre, valor) {
  const clave = CLAVES[nombre];
  if (!clave) throw new Error('Preferencia desconocida.');

  const db = await obtenerBD();
  await db.runAsync(
    `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
    clave,
    valor ? 1 : 0
  );
}
