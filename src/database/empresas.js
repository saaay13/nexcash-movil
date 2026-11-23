import { ejecutarTransaccion, mensajeError, obtenerBD } from './conexion';

export function generarCodigoPrivado(prefijo = 'NC') {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const longitud = 12;
  let aleatorio = '';
  for (let i = 0; i < longitud; i++) {
    aleatorio += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return `${prefijo}-${aleatorio}`;
}

function normalizarTexto(valor) {
  return String(valor ?? '').trim();
}

function mensajeAmigable(error) {
  const mensaje = String(error?.message ?? '');

  if (mensaje.includes('FOREIGN KEY constraint failed')) {
    return 'La sesión del usuario no es válida. Cierra sesión y vuelve a ingresar.';
  }
  return mensajeError(error, 'No se pudo completar la operación. Intenta nuevamente.');
}

export async function registrarEmpresa({
  nombre,
  direccion = '',
  telefono = '',
  propietarioId,
}) {
  const nombreLimpio = normalizarTexto(nombre);
  if (!nombreLimpio) {
    throw new Error('El nombre de la empresa o negocio es obligatorio.');
  }

  const propietario = Number(propietarioId);
  if (!Number.isInteger(propietario) || propietario <= 0) {
    throw new Error('Debes iniciar sesión con una cuenta válida para registrar una empresa.');
  }

  const db = await obtenerBD();
  const usuario = await db.getFirstAsync('SELECT id, correo FROM usuarios WHERE id = ?', propietario);
  if (!usuario) {
    throw new Error('Tu cuenta ya no existe. Cierra sesión y regístrate nuevamente.');
  }

  let empresaCreada = null;
  let ultimoError = null;

  for (let intento = 0; intento < 5 && !empresaCreada; intento++) {
    const codigoPrivado = generarCodigoPrivado();

    try {
      await ejecutarTransaccion(db, async (txn) => {
        const resEmpresa = await txn.runAsync(
          `INSERT INTO empresas
             (nombre, direccion, telefono, correo_contacto, codigo_vinculacion, codigo_privado, estado, propietario_id)
           VALUES (?, ?, ?, ?, ?, ?, 'activo', ?)`,
          nombreLimpio,
          normalizarTexto(direccion),
          normalizarTexto(telefono),
          normalizarTexto(usuario.correo) || null,
          codigoPrivado,
          codigoPrivado,
          propietario
        );

        const empresaId = resEmpresa.lastInsertRowId;

        await txn.runAsync(
          `INSERT INTO empresa_usuarios (empresa_id, usuario_id, rol, estado, fecha_aprobacion)
           VALUES (?, ?, 'admin', 'aprobado', datetime('now', 'localtime'))`,
          empresaId,
          propietario
        );

        empresaCreada = {
          id: empresaId,
          nombre: nombreLimpio,
          direccion: normalizarTexto(direccion),
          telefono: normalizarTexto(telefono),
          correo_contacto: normalizarTexto(usuario.correo) || null,
          codigo_vinculacion: codigoPrivado,
          codigo_privado: codigoPrivado,
          rol: 'admin',
          estado: 'aprobado',
        };
      });
    } catch (error) {
      ultimoError = error;
      const mensaje = String(error?.message ?? '');
      const esCodigoDuplicado = mensaje.includes('empresas.codigo_vinculacion');
      if (!esCodigoDuplicado) {
        throw new Error(mensajeAmigable(error));
      }
    }
  }

  if (!empresaCreada) {
    throw new Error(
      mensajeAmigable(ultimoError) || 'No se pudo generar un código único. Intenta nuevamente.'
    );
  }

  return empresaCreada;
}

export async function vincularseAEmpresa({ codigoPrivado, usuarioId }) {
  const codigoLimpio = normalizarTexto(codigoPrivado).toUpperCase();
  if (!codigoLimpio) {
    throw new Error('Debes ingresar el código privado de la empresa.');
  }

  const usuario = Number(usuarioId);
  if (!Number.isInteger(usuario) || usuario <= 0) {
    throw new Error('Debes iniciar sesión con una cuenta válida para vincularte.');
  }

  const db = await obtenerBD();

  const cuenta = await db.getFirstAsync('SELECT id FROM usuarios WHERE id = ?', usuario);
  if (!cuenta) {
    throw new Error('Tu cuenta ya no existe. Cierra sesión y regístrate nuevamente.');
  }

  const empresa = await db.getFirstAsync(
    `SELECT * FROM empresas
     WHERE estado = 'activo'
       AND (UPPER(codigo_vinculacion) = ? OR UPPER(codigo_privado) = ?)
     LIMIT 1`,
    codigoLimpio,
    codigoLimpio
  );

  if (!empresa) {
    throw new Error('No se encontró ninguna empresa activa con el código ingresado.');
  }

  const vinculoExistente = await db.getFirstAsync(
    'SELECT * FROM empresa_usuarios WHERE empresa_id = ? AND usuario_id = ?',
    empresa.id,
    usuario
  );

  if (vinculoExistente) {
    throw new Error(`Ya estás vinculado a "${empresa.nombre}".`);
  }

  try {
    await db.runAsync(
      `INSERT INTO empresa_usuarios (empresa_id, usuario_id, rol, estado, fecha_aprobacion)
       VALUES (?, ?, 'vendedor', 'aprobado', datetime('now', 'localtime'))`,
      empresa.id,
      usuario
    );
  } catch (error) {
    throw new Error(mensajeAmigable(error));
  }

  return {
    id: empresa.id,
    nombre: empresa.nombre,
    direccion: empresa.direccion,
    telefono: empresa.telefono,
    codigo_vinculacion: empresa.codigo_vinculacion,
    codigo_privado: empresa.codigo_privado,
    rol: 'vendedor',
    estado: 'aprobado',
  };
}

export async function obtenerEmpresasDeUsuario(usuarioId) {
  const usuario = Number(usuarioId);
  if (!Number.isInteger(usuario) || usuario <= 0) return [];

  const db = await obtenerBD();
  const sql = `
    SELECT e.*, eu.rol, eu.estado AS estado_vinculo
    FROM empresas e
    JOIN empresa_usuarios eu ON eu.empresa_id = e.id
    WHERE eu.usuario_id = ?
      AND eu.estado = 'aprobado'
      AND e.estado = 'activo'
    ORDER BY e.id ASC
  `;
  return db.getAllAsync(sql, usuario);
}

export async function obtenerEmpresaPorId(id) {
  const db = await obtenerBD();
  return db.getFirstAsync('SELECT * FROM empresas WHERE id = ?', Number(id));
}
