import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { bs, colores, radios } from '../../theme';

export default function FilaVenta({ venta, onPress }) {
  const primerItem = venta.detalle?.[0];
  const metodo = (venta.metodo_pago || venta.metodo || 'efectivo').toLowerCase();
  const esQr = metodo === 'qr';
  const nombreVenta = venta.primer_producto || primerItem?.nombre || `Venta #${venta.numero_venta ?? venta.numero ?? venta.id}`;
  const horaTexto = venta.creado_en ? venta.creado_en.substring(11, 16) : (venta.hora ?? venta.fecha ?? 'Hoy');
  const cantidadTexto = venta.total_items ? `${venta.total_items} un.` : (primerItem ? `${primerItem.cantidad} un.` : `${venta.items ?? 1} prod.`);

  return (
    <TouchableOpacity
      style={styles.saleRow}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View
        style={[
          styles.productThumb,
          { backgroundColor: esQr ? colores.terciario : colores.primarioContenedor },
        ]}
      >
        <MaterialCommunityIcons name="package-variant" size={25} color="#FFFFFF" />
      </View>

      <View style={styles.saleInfo}>
        <Text style={styles.saleName} numberOfLines={1}>
          {nombreVenta}
        </Text>

        <View style={styles.saleMeta}>
          <Text style={styles.saleMetaText}>
            {cantidadTexto}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text
            style={[
              styles.methodTag,
              {
                color: esQr ? colores.terciario : colores.primarioContenedor,
                backgroundColor: esQr ? '#F2D9FA' : '#E2EEFF',
              },
            ]}
          >
            {esQr ? 'QR Simple' : 'Efectivo'}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.saleMetaText}>{horaTexto}</Text>
        </View>
      </View>

      <View style={styles.saleAmountWrap}>
        <Text style={styles.saleAmount}>{bs(venta.total)}</Text>
        <Text style={[styles.saleStatus, { color: esQr ? colores.terciario : '#0066B5' }]}>
          {esQr ? 'QR Banco' : 'Completado'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  saleRow: {
    minHeight: 79,
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF0F6',
    gap: 9,
  },
  productThumb: {
    width: 49,
    height: 49,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleInfo: {
    flex: 1,
    minWidth: 0,
  },
  saleName: {
    color: colores.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  saleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  saleMetaText: {
    color: colores.textoSuave,
    fontSize: 10,
  },
  dot: {
    color: '#7C8491',
    fontSize: 11,
  },
  methodTag: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  saleAmountWrap: {
    alignItems: 'flex-end',
    marginLeft: 2,
  },
  saleAmount: {
    color: colores.texto,
    fontSize: 15,
    fontWeight: '700',
  },
  saleStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
});
