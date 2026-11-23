import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colores, espacios, radios, sombras, tipografia } from '../../theme';

const VARIANTES = {
  primario: {
    fondo: colores.primarioContenedor,
    borde: 'transparent',
    texto: colores.textoSobrePrimario,
  },
  secundario: {
    fondo: colores.superficie,
    borde: colores.secundario,
    texto: colores.secundario,
  },
  outline: {
    fondo: 'rgba(255,255,255,0.15)',
    borde: 'rgba(255,255,255,0.6)',
    texto: '#FFFFFF',
  },
  acento: {
    fondo: colores.terciario,
    borde: 'transparent',
    texto: colores.textoSobrePrimario,
  },
  tonal: {
    fondo: colores.superficieMedia,
    borde: 'transparent',
    texto: colores.primarioContenedor,
  },
  suave: {
    fondo: colores.superficieMedia,
    borde: 'transparent',
    texto: colores.primario,
  },
  peligro: {
    fondo: colores.errorFondo,
    borde: 'transparent',
    texto: colores.errorTexto,
  },
  fantasma: {
    fondo: 'transparent',
    borde: 'transparent',
    texto: colores.secundario,
  },
};

const ALTURAS = { sm: 40, md: 48, lg: 52 };

export default function Boton({
  titulo,
  onPress,
  variante = 'primario',
  tamano = 'md',
  icono,
  iconoDerecha = false,
  deshabilitado = false,
  cargando = false,
  style,
  textoStyle,
  accessibilityLabel,
}) {
  const v = VARIANTES[variante] ?? VARIANTES.primario;
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={inactivo ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: ALTURAS[tamano] ?? ALTURAS.md,
          backgroundColor: v.fondo,
          borderColor: v.borde,
          borderWidth: v.borde === 'transparent' ? 0 : 1.5,
        },
        variante === 'primario' && sombras.tarjeta,
        pressed && !inactivo && styles.presionado,
        inactivo && styles.deshabilitado,
        style,
      ]}
    >
      <View style={styles.fila}>
        {cargando ? (
          <ActivityIndicator size="small" color={v.texto} style={{ marginRight: titulo ? 8 : 0 }} />
        ) : icono && !iconoDerecha ? (
          <Ionicons name={icono} size={18} color={v.texto} style={{ marginRight: titulo ? 6 : 0 }} />
        ) : null}
        {titulo ? (
          <Text style={[styles.texto, { color: v.texto }, textoStyle]}>
            {titulo}
          </Text>
        ) : null}
        {!cargando && icono && iconoDerecha ? (
          <Ionicons name={icono} size={18} color={v.texto} style={{ marginLeft: titulo ? 6 : 0 }} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacios.lg,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    ...tipografia.cuerpoFuerte,
  },
  presionado: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  deshabilitado: {
    opacity: 0.5,
  },
});
