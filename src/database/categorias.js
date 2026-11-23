import { obtenerBD } from './conexion';

function empresaValida(empresaId) {
  const id = Number(empresaId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function obtenerCategorias(empresaId) {
  const empresa = empresaValida(empresaId);
  if (!empresa) return [];

  const db = await obtenerBD();
  const sql = `
    SELECT
      c.id,
      c.empresa_id,
      c.nombre,
      c.descripcion,
      (SELECT COUNT(*) FROM productos p
       WHERE p.empresa_id = c.empresa_id
         AND (p.categoria_id = c.id OR p.categoria = c.nombre)
         AND p.activo = 1) AS total_productos
    FROM categorias c
    WHERE c.empresa_id = ?
    ORDER BY c.nombre ASC
  `;
  return db.getAllAsync(sql, empresa);
}

export async function crearCategoria({ empresaId, nombre, descripcion = '' }) {
  const empresa = empresaValida(empresaId);
  if (!empresa) {
    throw new Error('No hay una empresa activa. Vuelve a seleccionar tu negocio.');
  }
  if (!nombre || !String(nombre).trim()) {
    throw new Error('El nombre de la categoría es obligatorio.');
  }

  const nombreLimpio = String(nombre).trim();
  const db = await obtenerBD();

  const duplicada = await db.getFirstAsync(
    'SELECT id FROM categorias WHERE empresa_id = ? AND LOWER(nombre) = LOWER(?)',
    empresa,
    nombreLimpio
  );
  if (duplicada) {
    throw new Error('Ya existe una categoría con ese nombre en tu empresa.');
  }

  const resultado = await db.runAsync(
    'INSERT INTO categorias (empresa_id, nombre, descripcion) VALUES (?, ?, ?)',
    empresa,
    nombreLimpio,
    String(descripcion || '').trim()
  );

  return {
    id: resultado.lastInsertRowId,
    empresa_id: empresa,
    nombre: nombreLimpio,
    descripcion: String(descripcion || '').trim(),
    total_productos: 0,
  };
}

export async function actualizarCategoria(id, { nombre, descripcion = '' }, empresaId) {
  if (!id) throw new Error('ID de categoría no válido.');
  if (!nombre || !String(nombre).trim()) {
    throw new Error('El nombre de la categoría es obligatorio.');
  }

  const nombreLimpio = String(nombre).trim();
  const descripcionLimpia = String(descripcion || '').trim();
  const empresa = empresaValida(empresaId);
  const db = await obtenerBD();

  if (empresa) {
    const duplicada = await db.getFirstAsync(
      'SELECT id FROM categorias WHERE empresa_id = ? AND LOWER(nombre) = LOWER(?) AND id <> ?',
      empresa,
      nombreLimpio,
      Number(id)
    );
    if (duplicada) {
      throw new Error('Ya existe otra categoría con ese nombre.');
    }

    await db.runAsync(
      'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ? AND empresa_id = ?',
      nombreLimpio,
      descripcionLimpia,
      Number(id),
      empresa
    );
  } else {
    await db.runAsync(
      'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
      nombreLimpio,
      descripcionLimpia,
      Number(id)
    );
  }

  return { id, nombre: nombreLimpio, descripcion: descripcionLimpia };
}

export async function eliminarCategoria(id, empresaId) {
  if (!id) throw new Error('ID de categoría no válido.');

  const empresa = empresaValida(empresaId);
  const db = await obtenerBD();

  if (empresa) {
    await db.runAsync(
      'DELETE FROM categorias WHERE id = ? AND empresa_id = ?',
      Number(id),
      empresa
    );
  } else {
    await db.runAsync('DELETE FROM categorias WHERE id = ?', Number(id));
  }

  return { id, eliminado: true };
}
