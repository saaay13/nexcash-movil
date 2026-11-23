import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'qrcode';
import { bs } from '../theme';

function escapar(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function obtenerSvgQr(valor) {
  try {
    const qr = QRCode.create(String(valor ?? ''), { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    let trazo = '';

    for (let fila = 0; fila < size; fila += 1) {
      for (let columna = 0; columna < size; columna += 1) {
        if (qr.modules.get(fila, columna)) {
          trazo += `M${columna} ${fila}h1v1h-1z`;
        }
      }
    }

    const silencio = 4;
    const total = size + silencio * 2;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">
      <rect width="${total}" height="${total}" fill="#FFFFFF" />
      <path d="${trazo}" fill="#0B1B2B" transform="translate(${silencio}, ${silencio})" />
    </svg>`;
  } catch (_e) {
    return null;
  }
}

function textoPlano(ticket) {
  const numero = String(ticket.numero ?? '').padStart(3, '0');
  const lineas = [
    `${ticket.empresa || 'NexCash'} - COMPROBANTE DE COMPRA`,
    `Ticket      : #${numero}`,
    `Fecha       : ${ticket.fecha ?? ''}`,
    `Empresa     : ${ticket.empresa ?? ''}`,
    `Vendedor    : ${ticket.vendedor ?? ''}`,
    `Forma de pago: ${ticket.metodo ?? ''}`,
    '',
    'CANT.   PRODUCTO                    PRECIO      SUBTOTAL',
  ];

  for (const item of Array.isArray(ticket.items) ? ticket.items : []) {
    const nombre = String(item.nombre ?? 'Producto').padEnd(26).slice(0, 26);
    lineas.push(
      `${String(item.cantidad ?? 0).padStart(4)}   ${nombre} ${bs(item.precio).padStart(10)} ${bs(item.subtotal).padStart(11)}`
    );
  }

  lineas.push(
    '',
    `Subtotal    : ${bs(ticket.subtotal)}`,
    `Descuento   : ${bs(ticket.descuento)}`,
    `TOTAL       : ${bs(ticket.total)}`
  );

  if (ticket.enlace) {
    lineas.push('', `Ver comprobante: ${ticket.enlace}`);
  }
  lineas.push('', 'Generado por NexCash');

  return lineas.join('\n');
}

export function generarHtmlRecibo(ticket) {
  const datos = ticket ?? {};
  const numero = String(datos.numero ?? '').padStart(3, '0');
  const qr = obtenerSvgQr(datos.enlace);
  const filas = (Array.isArray(datos.items) ? datos.items : [])
    .map(
      (item) => `
        <tr>
          <td>${escapar(item.nombre ?? 'Producto')}</td>
          <td class="numero">${escapar(item.cantidad ?? 0)}</td>
          <td class="numero">${escapar(bs(item.precio))}</td>
          <td class="numero">${escapar(bs(item.subtotal))}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Ticket #${escapar(numero)} | NexCash</title>
    <style>
      @page { size: A4; margin: 16mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #1B1B1B;
        font-family: Helvetica, Arial, sans-serif;
        font-size: 13px;
      }
      .cabecera {
        text-align: center;
        border-bottom: 2px solid #00539A;
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .cabecera h1 { margin: 0; font-size: 24px; color: #00539A; overflow-wrap: anywhere; }
      .cabecera p { margin: 4px 0 0; color: #6B7280; font-size: 12px; }
      .qr { text-align: center; margin: 14px 0; }
      .qr svg { width: 150px; height: 150px; }
      .datos { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      .datos td { padding: 3px 0; }
      .datos td:first-child { width: 95px; color: #6B7280; }
      table.items { width: 100%; border-collapse: collapse; }
      table.items th {
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        color: #6B7280;
        border-bottom: 1px solid #E5E7EB;
        padding: 6px 4px;
      }
      table.items td { padding: 7px 4px; border-bottom: 1px solid #F1F3F6; }
      .numero { text-align: right; white-space: nowrap; }
      .totales { margin: 16px 0 0 auto; width: 240px; }
      .fila { display: flex; justify-content: space-between; padding: 3px 0; }
      .fila span:first-child { color: #6B7280; }
      .gran-total {
        border-top: 2px solid #00539A;
        margin-top: 6px;
        padding-top: 8px;
        font-weight: 800;
        font-size: 16px;
        color: #00539A;
      }
      .texto-plano {
        margin-top: 22px;
        border-top: 1px dashed #CBD5E1;
        padding-top: 12px;
      }
      .texto-plano h2 {
        margin: 0 0 6px;
        font-size: 11px;
        text-transform: uppercase;
        color: #6B7280;
      }
      pre {
        margin: 0;
        font-family: "Courier New", Courier, monospace;
        font-size: 10px;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .pie { margin-top: 16px; text-align: center; color: #9CA3AF; font-size: 10px; }
    </style>
  </head>
  <body>
    <div class="cabecera">
      <h1>${escapar(datos.empresa || 'NexCash')}</h1>
      <p>NexCash · Comprobante de compra · Ticket #${escapar(numero)}</p>
    </div>

    <div class="qr">
      ${
        qr ??
        '<p>No se pudo generar el código QR. Usa el enlace de abajo.</p>'
      }
    </div>

    <table class="datos">
      <tr><td>Fecha</td><td>${escapar(datos.fecha ?? '')}</td></tr>
      <tr><td>Empresa</td><td>${escapar(datos.empresa ?? '')}</td></tr>
      <tr><td>Vendedor</td><td>${escapar(datos.vendedor ?? '')}</td></tr>
      <tr><td>Pago</td><td>${escapar(datos.metodo ?? '')}</td></tr>
    </table>

    <table class="items">
      <thead>
        <tr>
          <th>Producto</th>
          <th class="numero">Cant.</th>
          <th class="numero">Precio</th>
          <th class="numero">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div class="totales">
      <div class="fila"><span>Subtotal</span><span>${escapar(bs(datos.subtotal))}</span></div>
      <div class="fila"><span>Descuento</span><span>${escapar(bs(datos.descuento))}</span></div>
      <div class="fila gran-total"><span>Total</span><span>${escapar(bs(datos.total))}</span></div>
    </div>

    <div class="texto-plano">
      <h2>Detalle en texto plano</h2>
      <pre>${escapar(textoPlano(datos))}</pre>
    </div>

    <p class="pie">Generado por NexCash · No requiere escanear otro código</p>
  </body>
</html>`;
}

function imprimirEnWeb(html) {
  return new Promise((resolve, reject) => {
    const doc = globalThis.document;
    if (!doc?.body) {
      reject(new Error('No se pudo preparar el comprobante para descargar.'));
      return;
    }

    const iframe = doc.createElement('iframe');
    iframe.setAttribute('title', 'Comprobante NexCash');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.srcdoc = html;

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        globalThis.setTimeout(() => {
          iframe.remove();
          resolve();
        }, 1000);
      }
    };

    iframe.onerror = () => {
      iframe.remove();
      reject(new Error('No se pudo preparar el comprobante para descargar.'));
    };

    doc.body.appendChild(iframe);
  });
}

export async function descargarReciboPdf(ticket) {
  const html = generarHtmlRecibo(ticket);

  if (Platform.OS === 'web') {
    await imprimirEnWeb(html);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    try {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Comprobante de compra',
      });
      return;
    } catch (error) {
      console.warn('No se pudo compartir el PDF. Se abre la impresión.', error);
    }
  }

  await Print.printAsync({ uri });
}
