const URL_OPEN_FOOD_FACTS = 'https://world.openfoodfacts.org/api/v3/product';
const CAMPOS_OPEN_FOOD_FACTS = [
  'code',
  'product_name',
  'product_name_es',
  'product_name_en',
  'generic_name',
  'abbreviated_product_name',
  'brands',
  'categories',
  'quantity',
  'image_front_url',
].join(',');
const AGENTE_USUARIO = 'NexCash/1.0 (https://github.com/saaay13/nexcash-movil)';
const LIMITE_CONSULTAS = 15;
const VENTANA_CONSULTAS_MS = 60 * 1000;
const marcasDeConsulta = [];

function limpiarConsultasAntiguas(ahora) {
  while (
    marcasDeConsulta.length > 0 &&
    ahora - marcasDeConsulta[0] >= VENTANA_CONSULTAS_MS
  ) {
    marcasDeConsulta.shift();
  }
}

function quitarPalabrasRepetidas(texto) {
  const palabras = String(texto ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return palabras
    .filter(
      (palabra, indice) =>
        indice === 0 ||
        palabra.toLowerCase() !== palabras[indice - 1].toLowerCase()
    )
    .join(' ');
}

export function segundosParaConsultarApi() {
  const ahora = Date.now();
  limpiarConsultasAntiguas(ahora);
  if (marcasDeConsulta.length < LIMITE_CONSULTAS) return 0;
  return Math.ceil((VENTANA_CONSULTAS_MS - (ahora - marcasDeConsulta[0])) / 1000);
}

export async function consultarProductoPorCodigo(codigo) {
  const codigoLimpio = String(codigo ?? '').replace(/\s+/g, '');
  if (!codigoLimpio) return null;

  const ahora = Date.now();
  limpiarConsultasAntiguas(ahora);

  if (marcasDeConsulta.length >= LIMITE_CONSULTAS) {
    const espera = segundosParaConsultarApi();
    const error = new Error(
      `Se alcanzó el límite de 15 consultas por minuto. Espera ${espera} s o registra el producto manualmente.`
    );
    error.esLimite = true;
    throw error;
  }

  marcasDeConsulta.push(ahora);

  const url =
    `${URL_OPEN_FOOD_FACTS}/${encodeURIComponent(codigoLimpio)}.json` +
    `?fields=${encodeURIComponent(CAMPOS_OPEN_FOOD_FACTS)}&lc=es&product_type=all`;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-User-Agent': AGENTE_USUARIO,
      },
    });
  } catch (e) {
    const error = new Error(
      'No se pudo conectar con Open Food Facts. Revisa tu conexión e intenta de nuevo.'
    );
    error.causa = e;
    throw error;
  }

  if (respuesta.status === 404) return null;

  if (!respuesta.ok) {
    throw new Error(`Open Food Facts respondió con estado ${respuesta.status}.`);
  }

  const datos = await respuesta.json();
  const estado = String(datos?.status ?? '');
  if (estado && estado !== 'success' && !estado.startsWith('success')) return null;

  const producto = datos?.product;
  if (!producto) return null;

  const marca = String(producto.brands ?? '').trim();
  const presentacion = String(producto.quantity ?? '').trim();

  let nombre = String(
    producto.product_name ||
      producto.product_name_es ||
      producto.generic_name ||
      producto.abbreviated_product_name ||
      ''
  ).trim();

  let esFallback = false;
  if (!nombre) {
    nombre = quitarPalabrasRepetidas(producto.product_name_en);
    esFallback = true;
  }
  if (!nombre) {
    nombre = [marca, presentacion].filter(Boolean).join(' ');
    esFallback = true;
  }
  if (!nombre) return null;

  nombre = esFallback
    ? nombre
        .split(/\s+/)
        .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
        .join(' ')
    : nombre.charAt(0).toUpperCase() + nombre.slice(1);

  const detalles = [];
  if (marca) detalles.push(`Marca: ${marca}`);
  if (presentacion) detalles.push(`Presentación: ${presentacion}`);
  detalles.push('Fuente: Open Food Facts');

  return {
    codigo: String(producto.code ?? codigoLimpio),
    nombre,
    descripcion: detalles.join(' · '),
    marca,
    categoria: String(producto.categories ?? '').trim(),
    imagen: String(producto.image_front_url ?? '').trim(),
  };
}
