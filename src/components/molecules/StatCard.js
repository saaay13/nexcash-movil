import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colores, radios, sombras } from '../../theme';

export default function StatCard({ title, value, subtitle, icon, color, alert }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <Text style={styles.statTitle}>{title}</Text>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={[styles.statValue, alert && styles.alertValue]}>
        {value}
      </Text>
      <Text style={[styles.statSubtitle, alert && styles.criticalTag]}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    minHeight: 97,
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: 11,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    ...sombras.tarjeta,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTitle: {
    color: '#3B4351',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statValue: {
    color: colores.texto,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 3,
  },
  alertValue: {
    color: colores.error,
  },
  statSubtitle: {
    color: colores.textoSuave,
    fontSize: 10,
    marginTop: 2,
  },
  criticalTag: {
    color: colores.errorTexto,
    fontWeight: '700',
  },
});
