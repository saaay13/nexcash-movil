import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { bs, radios, sombras } from '../../theme';

export default function TarjetaRecaudacion({ total, cantidadVentas}) {
  return (
    <LinearGradient
      colors={['#00539A', '#164B91', '#5E0086']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.revenueCard}
    >
      <View style={styles.revenueTop}>
        <View style={styles.revenueLabelLine}>
          <Ionicons name="cash-outline" size={19} color="#FFFFFF" />
          <Text style={styles.revenueLabel}>CAJA · HOY</Text>
        </View>
      </View>

      <Text style={styles.revenueCaption}>Total Recaudado</Text>
      <Text style={styles.revenueAmount}>{bs(total)}</Text>

      <View style={styles.revenueBottom}>
        <View style={styles.revenueLabelLine}>
          <Ionicons name="receipt-outline" size={17} color="#FFFFFF" />
          <Text style={styles.revenueFoot}>
            {cantidadVentas} {cantidadVentas === 1 ? 'venta registrada' : 'ventas registradas'}
          </Text>
        </View>

        <View style={styles.revenueLabelLine}>
          <Ionicons name="save-outline" size={17} color="#D8C8FF" />
          <Text style={styles.syncText}>Guardado local</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  revenueCard: {
    borderRadius: radios.xxl,
    padding: 19,
    marginBottom: 17,
    ...sombras.flotante,
  },
  revenueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabelLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  revenueLabel: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  revenueCaption: {
    color: '#D4E2FF',
    fontSize: 12,
    marginTop: 15,
  },
  revenueAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  revenueBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  revenueFoot: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
  },
  syncText: {
    color: '#E0D2FF',
    fontSize: 11,
    fontWeight: '600',
  },
});
