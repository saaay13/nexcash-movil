import { obtenerBD } from './conexion';

function esNumero(valor) {
  return valor !== '' && valor !== null && valor !== undefined && Number.isFinite(Number(valor));
}

function empresaValida(empresaId) {
  const id = Number(empresaId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function validarProducto(p, { parcial = false } = {}) {
  if (!parcial || 'nombre' in p) {
    if (!p.nombre || !String(p.nombre).trim()) {
      throw new Error('El nombre del producto es obligatorio.');
    }
  }
  if (!parcial || 'precio_venta' in p) {
    if (!esNumero(p.precio_venta) || Number(p.precio_venta) < 0) {
      throw new Error('El precio de venta debe ser un número mayor o igual a 0.');
    }
  }
  if ('precio_compra' in p && (!esNumero(p.precio_compra) || Number(p.precio_compra) < 0)) {
    throw new Error('El precio de compra debe ser un número mayor o igual a 0.');
  }
  for (const campo of ['stock_actual', 'stock_minimo']) {
    if (
      campo in p &&
      (!esNumero(p[campo]) || !Number.isInteger(Number(p[campo])) || Number(p[campo]) < 0)
    ) {
      throw new Error('La existencia debe ser un número entero mayor o igual a 0.');
    }
  }
}

export async function crearProducto(p) {
  const empresaId = empresaValida(p.empresaId);
  if (!empresaId) {
    throw new Error('No hay una empresa activa. Vuelve a seleccionar tu negocio.');
  }

  validarProducto(p);
  const db = await obtenerBD();
  const resultado = await db.runAsync(
    `INSERT INTO productos
      (empresa_id, nombre, descripcion, categoria_id, categoria, codigo_barras,
       precio_compra, precio_venta, stock_actual, stock_minimo, imagen, api_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    empresaId,
    String(p.nombre).trim(),
    p.descripcion ? String(p.descripcion).trim() : null,
    p.categoriaId ?? p.categoria_id ?? null,
    p.categoria ? String(p.categoria).trim() : null,
    p.codigo_barras ? String(p.codigo_barras).trim() : null,
    Number(p.precio_compra ?? 0),
    Number(p.precio_venta),
    Number(p.stock_actual ?? 0),
    Number(p.stock_minimo ?? 5),
    p.imagen ? String(p.imagen).trim() : null,
    p.api_id ? Number(p.api_id) : null
  );

  return {
    id: resultado.lastInsertRowId,
    empresa_id: empresaId,
    nombre: String(p.nombre).trim(),
    descripcion: p.descripcion ? String(p.descripcion).trim() : null,
    categoria_id: p.categoriaId ?? p.categoria_id ?? null,
    categoria: p.categoria ?? null,
    sku: p.codigo_barras ?? null,
    precio: Number(p.precio_venta),
    stock: Number(p.stock_actual ?? 0),
    stock_minimo: Number(p.stock_minimo ?? 5),
  };
}

export async function agregarProducto({
  empresaId,
  nombre,
  descripcion = '',
  categoria = 'General',
  categoriaId = null,
  sku = '',
  precio = 0,
  stock = 0,
  stockMinimo = 5,
  precioCompra = 0,
}) {
  return crearProducto({
    empresaId,
    nombre,
    descripcion,
    categoria,
    categoriaId,
    codigo_barras: sku,
    precio_compra: precioCompra,
    precio_venta: precio,
    stock_actual: stock,
    stock_minimo: stockMinimo,
  });
}

export async function obtenerProductos({
  empresaId,
  busqueda = '',
  categoria = '',
  soloCriticos = false,
  incluirInactivos = false,
} = {}) {
  const empresa = empresaValida(empresaId);
  if (!empresa) return [];

  const db = await obtenerBD();
  const condiciones = ['p.empresa_id = ?'];
  const parametros = [empresa];

  if (!incluirInactivos) {
    condiciones.push('p.activo = 1');
  }

  if (categoria && categoria !== 'Todos' && categoria !== 'Critico') {
    condiciones.push('p.categoria = ?');
    parametros.push(categoria);
  }

  if (busqueda && busqueda.trim()) {
    condiciones.push('(p.nombre LIKE ? OR p.codigo_barras LIKE ?)');
    const comodin = `%${busqueda.trim()}%`;
    parametros.push(comodin, comodin);
  }

  if (soloCriticos || categoria === 'Critico') {
    condiciones.push('p.stock_actual <= p.stock_minimo');
  }

  const sql = `
    SELECT
      p.*,
      p.codigo_barras AS sku,
      p.precio_venta AS precio,
      p.stock_actual AS stock
    FROM productos p
    WHERE ${condiciones.join(' AND ')}
    ORDER BY p.nombre ASC
  `;

  return db.getAllAsync(sql, ...parametros);
}

export async function obtenerProductoPorId(id, empresaId) {
  const empresa = empresaValida(empresaId);
  const db = await obtenerBD();

  if (empresa) {
    return db.getFirstAsync(
      'SELECT * FROM productos WHERE id = ? AND empresa_id = ?',
      Number(id),
      empresa
    );
  }

  return db.getFirstAsync('SELECT * FROM productos WHERE id = ?', Number(id));
}

export async function obtenerProductoPorCodigo(codigo, empresaId) {
  const empresa = empresaValida(empresaId);
  const valor = String(codigo ?? '').trim();

  if (!empresa || !valor) return null;

  const db = await obtenerBD();
  return db.getFirstAsync(
    `SELECT
       *,
       codigo_barras AS sku,
       precio_venta AS precio,
       stock_actual AS stock
     FROM productos
     WHERE empresa_id = ?
       AND activo = 1
       AND codigo_barras = ? COLLATE NOCASE
     LIMIT 1`,
    empresa,
    valor
  );
}

export async function actualizarProducto(id, cambios, empresaId) {
  validarProducto(cambios, { parcial: true });
  const camposPermitidos = [
    'nombre',
    'descripcion',
    'categoria_id',
    'categoria',
    'codigo_barras',
    'precio_compra',
    'precio_venta',
    'stock_actual',
    'stock_minimo',
    'imagen',
    'activo',
  ];

  const asignaciones = [];
  const valores = [];

  for (const campo of camposPermitidos) {
    if (campo in cambios) {
      asignaciones.push(`${campo} = ?`);
      valores.push(cambios[campo]);
    }
  }

  if (asignaciones.length === 0) return;

  valores.push(Number(id));
  const empresa = empresaValida(empresaId);
  if (empresa) {
    valores.push(empresa);
  }

  const db = await obtenerBD();
  await db.runAsync(
    `UPDATE productos SET ${asignaciones.join(', ')} WHERE id = ?${
      empresa ? ' AND empresa_id = ?' : ''
    }`,
    ...valores
  );
}

export async function modificarProducto(
  id,
  {
    nombre,
    descripcion = '',
    categoria,
    categoriaId = null,
    sku,
    precio,
    stock,
    stockMinimo = 5,
  },
  empresaId
) {
  if (!id) throw new Error('ID de producto no válido.');

  await actualizarProducto(
    id,
    {
      nombre: String(nombre).trim(),
      descripcion: descripcion ? String(descripcion).trim() : null,
      categoria_id: categoriaId ? Number(categoriaId) : null,
      categoria: categoria ? String(categoria).trim() : 'General',
      codigo_barras: sku ? String(sku).trim() : null,
      precio_venta: Number(precio),
      stock_actual: Number(stock),
      stock_minimo: Number(stockMinimo),
    },
    empresaId
  );

  return {
    id,
    nombre,
    descripcion,
    categoria,
    categoriaId,
    sku,
    precio,
    stock,
    stockMinimo,
  };
}

export async function eliminarProducto(id, empresaId) {
  if (!id) throw new Error('ID de producto no válido.');

  const empresa = empresaValida(empresaId);
  const db = await obtenerBD();

  if (empresa) {
    await db.runAsync(
      'UPDATE productos SET activo = 0, estado = ? WHERE id = ? AND empresa_id = ?',
      'inactivo',
      Number(id),
      empresa
    );
  } else {
    await db.runAsync(
      'UPDATE productos SET activo = 0, estado = ? WHERE id = ?',
      'inactivo',
      Number(id)
    );
  }

  return { id, eliminado: true };
}
