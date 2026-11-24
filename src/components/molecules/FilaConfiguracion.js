import { StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colores, espacios, radios } from '../../theme';

export default function FilaConfiguracion({
  icono,
  colorIcono,
  fondoIcono,
  titulo,
  subtitulo,
  valor,
  onCambiar,
}) {
  return (
    <View style={styles.fila}>
      <View style={[styles.iconoCaja, { backgroundColor: fondoIcono }]}>
        <Ionicons name={icono} size={20} color={colorIcono} />
      </View>
      <View style={styles.textos}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
      <Switch
        value={Boolean(valor)}
        onValueChange={onCambiar}
        trackColor={{ false: '#CBD5E1', true: colores.primarioContenedor }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#CBD5E1"
        accessibilityLabel={titulo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    paddingVertical: 12,
    paddingHorizontal: espacios.sm,
    borderRadius: radios.lg,
  },
  iconoCaja: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.texto,
  },
  subtitulo: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
    lineHeight: 16,
  },
});
