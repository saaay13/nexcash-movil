
export const TABLA_EMPRESAS = `
CREATE TABLE IF NOT EXISTS empresas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  correo_contacto TEXT,
  codigo_vinculacion TEXT NOT NULL UNIQUE,
  codigo_privado TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  propietario_id INTEGER,
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const TABLA_USUARIOS = `
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  telefono TEXT,
  foto_perfil TEXT,
  rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const TABLA_EMPRESA_USUARIO = `
CREATE TABLE IF NOT EXISTS empresa_usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor', 'cajero')),
  estado TEXT NOT NULL DEFAULT 'aprobado' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  aprobado_por INTEGER REFERENCES usuarios(id),
  fecha_aprobacion TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE(empresa_id, usuario_id)
);

CREATE VIEW IF NOT EXISTS empresa_usuario AS SELECT * FROM empresa_usuarios;
`;

export const TABLA_CATEGORIAS = `
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const TABLA_PRODUCTOS = `
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER REFERENCES empresas(id),
  categoria_id INTEGER REFERENCES categorias(id),
  categoria TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  codigo_barras TEXT,
  precio_compra REAL NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
  precio_venta REAL NOT NULL CHECK (precio_venta >= 0),
  stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  imagen TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  api_id INTEGER UNIQUE,
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const TABLA_MOVIMIENTOS_INVENTARIO = `
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER REFERENCES empresas(id),
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  venta_id INTEGER REFERENCES ventas(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'venta')),
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  motivo TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const TABLA_SESIONES_CAJA = `
CREATE TABLE IF NOT EXISTS sesiones_caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER REFERENCES empresas(id),
  usuario_apertura_id INTEGER NOT NULL REFERENCES usuarios(id),
  usuario_cierre_id INTEGER REFERENCES usuarios(id),
  monto_inicial REAL NOT NULL DEFAULT 0,
  monto_esperado REAL NOT NULL DEFAULT 0,
  monto_real REAL,
  diferencia REAL,
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  fecha_cierre TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const TABLA_MOVIMIENTOS_CAJA = `
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER REFERENCES empresas(id),
  sesion_caja_id INTEGER NOT NULL REFERENCES sesiones_caja(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  concepto TEXT NOT NULL,
  monto REAL NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const TABLA_VENTAS = `
CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER REFERENCES empresas(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  sesion_caja_id INTEGER REFERENCES sesiones_caja(id),
  numero_venta INTEGER NOT NULL UNIQUE,
  subtotal REAL NOT NULL,
  descuento REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  token_comprobante TEXT,
  metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
  estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'anulada', 'pendiente')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const TABLA_DETALLE_VENTA = `
CREATE TABLE IF NOT EXISTS detalle_venta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  nombre_producto TEXT NOT NULL,
  precio_unitario REAL NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  subtotal REAL NOT NULL
);
`;

export const TABLA_PAGOS_VENTA = `
CREATE TABLE IF NOT EXISTS pagos_venta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'qr', 'tarjeta', 'transferencia')),
  monto REAL NOT NULL,
  monto_recibido REAL,
  cambio REAL DEFAULT 0,
  referencia_pago TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

export const INDICES = `
CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(creado_en);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresas_vinculacion ON empresas(codigo_vinculacion);
CREATE INDEX IF NOT EXISTS idx_pagos_venta ON pagos_venta(venta_id);
`;

export const ESQUEMA_TABLAS = `
${TABLA_USUARIOS}
${TABLA_EMPRESAS}
${TABLA_EMPRESA_USUARIO}
${TABLA_CATEGORIAS}
${TABLA_PRODUCTOS}
${TABLA_SESIONES_CAJA}
${TABLA_MOVIMIENTOS_INVENTARIO}
${TABLA_MOVIMIENTOS_CAJA}
${TABLA_VENTAS}
${TABLA_DETALLE_VENTA}
${TABLA_PAGOS_VENTA}
`;

export const ESQUEMA_COMPLETO = `
${ESQUEMA_TABLAS}
${INDICES}
`;
