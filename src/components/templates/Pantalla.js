import { useMemo } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EncabezadoTienda from '../organisms/EncabezadoTienda';
import { colores, espacios, radios } from '../../theme';

export default function Pantalla({
  titulo,
  descripcion,
  accion,
  tienda = false,
  deslizarAtras,
  turno,
  onTurno,
  onMoneda,
  onPerfil,
  onMenu,
  children,
  contenidoStyle,
  scroll = true,
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const puedeVolver = !tienda && navigation.canGoBack();
  const habilitarDeslizar = deslizarAtras !== undefined ? deslizarAtras : puedeVolver;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!navigation.canGoBack()) return false;
          return (
            gestureState.dx > 15 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 50 || (gestureState.dx > 25 && gestureState.vx > 0.3)) {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }
        },
      }),
    [navigation]
  );

  const volver = !tienda && navigation.canGoBack();

  const Contenido = scroll ? ScrollView : View;

  const contenidoProps = scroll
    ? {
        style: styles.scroll,
        contentContainerStyle: [
          styles.contenido,
          tienda && styles.contenidoConPestanas,
          contenidoStyle,
        ],
        showsVerticalScrollIndicator: false,
      }
    : {
        style: [
          styles.scroll,
          styles.contenido,
          tienda && styles.contenidoConPestanas,
          contenidoStyle,
        ],
      };

  return (
    <View
      style={styles.pantalla}
      {...(habilitarDeslizar ? panResponder.panHandlers : {})}
    >
      {tienda ? (
        <EncabezadoTienda
          titulo={titulo}
          turno={turno}
          onTurno={onTurno}
          onMoneda={onMoneda}
          onPerfil={onPerfil}
          onMenu={onMenu}
        />
      ) : (
        <View style={[styles.barra, { paddingTop: insets.top + 6 }]}>
          {volver ? (
            <Pressable
              style={({ pressed }) => [styles.botonVolver, pressed && { opacity: 0.6 }]}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Volver"
            >
              <Ionicons name="arrow-back" size={20} color={colores.primarioContenedor} />
            </Pressable>
          ) : (
            <View style={styles.botonVolver} />
          )}

          <Text style={styles.tituloBarra} numberOfLines={1}>
            {titulo}
          </Text>

          <View style={styles.accionBarra}>{accion}</View>
        </View>
      )}

      <Contenido {...contenidoProps}>
        {descripcion ? <Text style={styles.descripcion}>{descripcion}</Text> : null}
        {children}
      </Contenido>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingHorizontal: espacios.md,
    paddingBottom: espacios.sm,
    backgroundColor: colores.fondo,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  botonVolver: {
    width: 40,
    height: 40,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficieBaja,
  },
  tituloBarra: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colores.texto,
    textAlign: 'center',
  },
  accionBarra: {
    width: 40,
    alignItems: 'flex-end',
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: espacios.lg,
    paddingBottom: 40,
  },
  contenidoConPestanas: {
    paddingBottom: 24,
  },
  descripcion: {
    fontSize: 13,
    color: colores.textoSuave,
    marginBottom: espacios.md,
  },
});
