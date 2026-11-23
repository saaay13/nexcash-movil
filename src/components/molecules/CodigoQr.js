import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';
import { colores, radios } from '../../theme';

export default function CodigoQr({ valor, tamano = 220 }) {
  const qr = useMemo(() => {
    try {
      return QRCode.create(String(valor ?? ''), { errorCorrectionLevel: 'L' });
    } catch (_e) {
      return null;
    }
  }, [valor]);

  const trazo = useMemo(() => {
    if (!qr) return '';

    const size = qr.modules.size;
    let resultado = '';

    for (let fila = 0; fila < size; fila += 1) {
      for (let columna = 0; columna < size; columna += 1) {
        if (qr.modules.get(fila, columna)) {
          resultado += `M${columna} ${fila}h1v1h-1z`;
        }
      }
    }

    return resultado;
  }, [qr]);

  if (!qr) {
    return (
      <View style={[styles.contenedor, { width: tamano, height: tamano }, styles.error]}>
        <Text style={styles.errorTexto}>No se pudo generar el código QR.</Text>
      </View>
    );
  }

  const size = qr.modules.size;
  const silencio = 4;
  const total = size + silencio * 2;

  return (
    <View style={[styles.contenedor, { width: tamano, height: tamano }]}>
      <Svg width={tamano} height={tamano} viewBox={`0 0 ${total} ${total}`}>
        <Rect x="0" y="0" width={total} height={total} fill="#FFFFFF" />
        <Path
          d={trazo}
          fill="#0B1B2B"
          transform={`translate(${silencio}, ${silencio})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: '#FFFFFF',
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  error: {
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
  },
  errorTexto: {
    color: colores.rojo,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
