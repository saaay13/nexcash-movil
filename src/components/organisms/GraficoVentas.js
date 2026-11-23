import { StyleSheet, Text, View } from 'react-native';
import { bs, colores, radios, sombras } from '../../theme';

const BLUE = colores.primarioContenedor;
const PURPLE = colores.terciario;

export default function GraficoVentas({ datos = [0, 0, 0, 0, 0, 0, 0] }) {
  const horas = ['08h', '10h', '12h', '14h', '16h', '18h', '20h'];
  const total = datos.reduce((acc, valor) => acc + Number(valor || 0), 0);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeading}>
        <View>
          <Text style={styles.sectionTitle}>Ventas por Hora</Text>
          <Text style={styles.chartSubtitle}>
            {total > 0 ? `Total de hoy: ${bs(total)}` : 'Sin ventas registradas hoy'}
          </Text>
        </View>

        <View style={styles.todayBadge}>
          <View style={styles.todayDot} />
          <Text style={styles.todayText}>Hoy</Text>
        </View>
      </View>

      {total === 0 ? (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>
            Registra tu primera venta para ver la actividad por hora.
          </Text>
        </View>
      ) : (
        <View style={styles.chartArea}>
          <View style={styles.chartGuideline} />
          <View style={styles.chartGuideline2} />

          <View style={styles.chartBars}>
            {datos.map((monto, i) => (
              <View key={i} style={styles.barColumn}>
                {monto > 0 ? (
                  <>
                    <View style={i % 2 === 0 ? styles.barValuePurple : styles.barValueBlue}>
                      <Text style={styles.barValueText}>Bs {Math.round(monto)}</Text>
                    </View>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.min(100, Math.max(20, monto * 2.8)),
                          backgroundColor: i % 2 === 0 ? PURPLE : BLUE,
                        },
                      ]}
                    />
                  </>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.chartLabels}>
        {horas.map((hora, i) => (
          <Text
            key={hora}
            style={[
              styles.chartLabel,
              datos[i] > 0 && {
                color: i % 2 === 0 ? PURPLE : BLUE,
                fontWeight: '700',
              },
            ]}
          >
            {hora}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: 17,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    marginBottom: 22,
    minHeight: 280,
    ...sombras.tarjeta,
  },
  chartHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colores.texto,
    fontSize: 17,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 2,
  },
  emptyChart: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyChartText: {
    textAlign: 'center',
    fontSize: 12,
    color: colores.textoSuave,
    lineHeight: 18,
  },
  todayBadge: {
    backgroundColor: '#E4EEFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  todayDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#65B5FF',
  },
  todayText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '600',
  },
  chartArea: {
    height: 165,
    marginTop: 10,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  chartGuideline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 55,
    borderTopWidth: 1,
    borderColor: '#F2F3F8',
  },
  chartGuideline2: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 110,
    borderTopWidth: 1,
    borderColor: '#F2F3F8',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
  },
  barColumn: {
    flex: 1,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 27,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barValuePurple: {
    backgroundColor: PURPLE,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 5,
  },
  barValueBlue: {
    backgroundColor: BLUE,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 5,
  },
  barValueText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 7,
  },
  chartLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#343B49',
    fontSize: 11,
  },
});
