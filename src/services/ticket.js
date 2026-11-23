import LZString from 'lz-string';

export const URL_BASE_TICKET = 'https://saaay13.github.io/nexcash-movil/ticket/';

export function crearEnlaceTicket(datos) {
  const comprimido = LZString.compressToEncodedURIComponent(JSON.stringify(datos));
  return `${URL_BASE_TICKET}?d=${encodeURIComponent(comprimido)}`;
}
