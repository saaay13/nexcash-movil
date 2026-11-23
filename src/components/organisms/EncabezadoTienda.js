import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colores } from '../../theme';
import { obtenerSesionActiva } from '../../database';
import { useSesion } from '../../context';

export default function EncabezadoTienda({
  titulo,
  turno,
  onMoneda,
  onPerfil,
  onTurno,
  onMenu,
}) {
  const insets = useSafeAreaInsets();
  const { empresa, empresaId } = useSesion();
  const [turnoAbierto, setTurnoAbierto] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      if (!empresaId) {
        setTurnoAbierto(false);
        return undefined;
      }
      obtenerSesionActiva(empresaId)
        .then((sesion) => {
          if (!cancelado) setTurnoAbierto(Boolean(sesion));
        })
        .catch(() => {
          if (!cancelado) setTurnoAbierto(false);
        });
      return () => {
        cancelado = true;
      };
    }, [empresaId])
  );

  const activo = turno !== undefined ? turno : turnoAbierto;

  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
      <Pressable
        style={({ pressed }) => [styles.storeIcon, pressed && styles.presionado]}
        onPress={onMenu}
        accessibilityLabel="Abrir menú de administración"
      >
        <Ionicons name="menu" size={24} color={colores.primarioContenedor} />
      </Pressable>

      <View style={styles.topHeading}>
        <View style={styles.storeNameLine}>
          <View style={styles.onlineDot} />
          <Text style={styles.storeName} numberOfLines={1}>
            {empresa?.nombre || 'NexCash'}
          </Text>
        </View>

        <View style={styles.homeLine}>
          <Text style={styles.homeTitle} numberOfLines={1}>
            {titulo}
          </Text>
          <Pressable onPress={onTurno} disabled={!onTurno}>
            <Text style={styles.turnBadge}>Caja {activo ? 'abierta' : 'cerrada'}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.currencyButton, pressed && styles.presionado]}
        onPress={onMoneda}
        accessibilityLabel="Moneda"
      >
        <Ionicons name="lock-closed-outline" size={17} color={colores.terciario} />
        <Text style={styles.currencyText}>Bs</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.userButton, pressed && styles.presionado]}
        onPress={onPerfil}
        accessibilityLabel="Mi perfil"
      >
        <Ionicons name="person-outline" size={20} color={colores.textoSobrePrimario} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: 68,
    paddingHorizontal: 17,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.fondo,
    gap: 10,
  },
  storeIcon: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeading: {
    flex: 1,
    minWidth: 0,
  },
  storeNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colores.secundarioContenedor,
  },
  storeName: {
    color: colores.primarioContenedor,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.35,
    flexShrink: 1,
  },
  homeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  homeTitle: {
    color: colores.texto,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  turnBadge: {
    backgroundColor: '#EDF4FF',
    color: colores.primarioContenedor,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currencyButton: {
    minWidth: 54,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  currencyText: {
    color: colores.terciario,
    fontSize: 13,
    fontWeight: '800',
  },
  userButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colores.primarioContenedor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: {
    opacity: 0.7,
  },
});
