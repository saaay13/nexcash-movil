import LZString from 'lz-string';

export const URL_BASE_TICKET = 'https://saaay13.github.io/nexcash-movil/ticket/';

function compactarTicket(datos) {
  const items = Array.isArray(datos?.items) ? datos.items : [];

  return {
    n: datos?.numero,
    f: datos?.fecha,
    e: datos?.empresa,
    v: datos?.vendedor,
    m: datos?.metodo,
    i: items.map((item) => [
      String(item?.nombre ?? 'Producto'),
      Number(item?.cantidad ?? 0),
      Number(item?.precio ?? 0),
      Number(item?.subtotal ?? 0),
    ]),
    s: Number(datos?.subtotal ?? 0),
    d: Number(datos?.descuento ?? 0),
    t: Number(datos?.total ?? 0),
  };
}

export function crearEnlaceTicket(datos) {
  const comprimido = LZString.compressToEncodedURIComponent(
    JSON.stringify(compactarTicket(datos))
  );

  return `${URL_BASE_TICKET}?d=${encodeURIComponent(comprimido)}`;
}
