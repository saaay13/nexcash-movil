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
          <Text style={styles.saleMetaText} numberOfLines={1}>
            {cantidadTexto}
          </Text>
          <Text style={styles.dot}>·</Text>
          <View
            style={[
              styles.methodTag,
              {
                backgroundColor: esQr ? '#F2D9FA' : '#E2EEFF',
              },
            ]}
          >
            <Text
              style={[
                styles.methodTagTexto,
                { color: esQr ? colores.terciario : colores.primarioContenedor },
              ]}
              numberOfLines={1}
            >
              {esQr ? 'QR Simple' : 'Efectivo'}
            </Text>
          </View>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.saleMetaText} numberOfLines={1}>
            {horaTexto}
          </Text>
        </View>
      </View>

      <View style={styles.saleAmountWrap}>
        <Text style={styles.saleAmount} numberOfLines={1}>
          {bs(venta.total)}
        </Text>
        <Text
          style={[styles.saleStatus, { color: esQr ? colores.terciario : '#0066B5' }]}
          numberOfLines={1}
        >
          {esQr ? 'QR Banco' : 'Completado'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  saleRow: {
    minHeight: 84,
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
    flexShrink: 0,
  },
  saleInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 2,
  },
  saleName: {
    color: colores.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  saleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    minWidth: 0,
  },
  saleMetaText: {
    color: colores.textoSuave,
    fontSize: 10,
    flexShrink: 1,
  },
  dot: {
    color: '#7C8491',
    fontSize: 11,
    flexShrink: 0,
  },
  methodTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
    flexShrink: 0,
  },
  methodTagTexto: {
    fontSize: 9,
    fontWeight: '700',
  },
  saleAmountWrap: {
    alignItems: 'flex-end',
    marginLeft: 2,
    minWidth: 84,
    flexShrink: 0,
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
