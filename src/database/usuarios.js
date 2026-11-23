import { mensajeError, obtenerBD } from './conexion';

function hashSimple(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export async function crearHash(password) {
  const sal = Math.random().toString(36).slice(2, 10);
  const hash = hashSimple(sal + password);
  return `${sal}:${hash}`;
}

export async function verificarPassword(password, almacenado) {
  if (!almacenado || !almacenado.includes(':')) return false;
  const [sal, hashOriginal] = almacenado.split(':');
  const hashCalculado = hashSimple(sal + password);
  return hashCalculado === hashOriginal;
}

export async function registrarUsuario({ nombre, correo, password, rol = 'vendedor' }) {
  if (!nombre || !String(nombre).trim()) {
    throw new Error('El nombre es obligatorio.');
  }
  const correoLimpio = String(correo || '').trim().toLowerCase();
  if (!correoLimpio || !correoLimpio.includes('@')) {
    throw new Error('El correo no tiene un formato válido.');
  }
  if (!password || String(password).length < 4) {
    throw new Error('La contraseña debe tener al menos 4 caracteres.');
  }
  if (!['admin', 'vendedor'].includes(rol)) {
    throw new Error('El rol debe ser admin o vendedor.');
  }

  const db = await obtenerBD();
  try {
    const hash = await crearHash(password);
    const resultado = await db.runAsync(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      String(nombre).trim(),
      correoLimpio,
      hash,
      rol
    );
    return {
      id: resultado.lastInsertRowId,
      nombre: String(nombre).trim(),
      correo: correoLimpio,
      rol,
    };
  } catch (error) {
    if (String(error?.message).includes('UNIQUE')) {
      throw new Error('Ya existe un usuario registrado con ese correo.');
    }
    throw new Error(mensajeError(error, 'No se pudo crear la cuenta. Intenta nuevamente.'));
  }
}

export async function iniciarSesion(correo, password) {
  const db = await obtenerBD();
  const usuario = await db.getFirstAsync(
    'SELECT * FROM usuarios WHERE correo = ?',
    String(correo || '').trim().toLowerCase()
  );

  if (!usuario || !(await verificarPassword(String(password || ''), usuario.password))) {
    throw new Error('Correo o contraseña incorrectos.');
  }

  const { password: _omitida, ...usuarioSeguro } = usuario;
  return usuarioSeguro;
}

export async function obtenerUsuarioPorId(id) {
  const db = await obtenerBD();
  return db.getFirstAsync(
    'SELECT id, nombre, correo, rol, creado_en FROM usuarios WHERE id = ?',
    Number(id)
  );
}

export async function listarUsuarios() {
  const db = await obtenerBD();
  return db.getAllAsync('SELECT id, nombre, correo, rol, creado_en FROM usuarios ORDER BY id ASC');
}
