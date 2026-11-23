import { StyleSheet, Text, View } from 'react-native';
import { colores, radios, tipografia } from '../../theme';

const VARIANTES = {
  exito: {
    fondo: colores.exitoFondo,
    texto: colores.exito,
    punto: colores.exito,
  },
  alerta: {
    fondo: colores.alertaFondo,
    texto: colores.alerta,
    punto: colores.alerta,
  },
  error: {
    fondo: colores.errorFondo,
    texto: colores.errorTexto,
    punto: colores.error,
  },
  info: {
    fondo: '#E2EEFF',
    texto: colores.primarioContenedor,
    punto: colores.primarioContenedor,
  },
  pendiente: {
    fondo: '#F2D9FA',
    texto: colores.terciario,
    punto: colores.terciario,
  },
};

export default function Etiqueta({ texto, variante = 'info', punto = false, style }) {
  const v = VARIANTES[variante] ?? VARIANTES.info;

  return (
    <View style={[styles.contenedor, { backgroundColor: v.fondo }, style]}>
      {punto ? <View style={[styles.punto, { backgroundColor: v.punto }]} /> : null}
      <Text style={[styles.texto, { color: v.texto }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radios.full,
    alignSelf: 'flex-start',
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  texto: {
    ...tipografia.micro,
  },
});
