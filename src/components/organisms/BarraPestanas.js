import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, sombras } from '../../theme';

const ITEMS = {
  Inicio: { etiqueta: 'Inicio', icono: 'home-outline' },
  Productos: { etiqueta: 'Productos', icono: 'file-tray-outline' },
  Vender: { etiqueta: 'Vender', icono: 'barcode-scan', centro: true },
  Historial: { etiqueta: 'Ventas', icono: 'receipt-outline' },
  Caja: { etiqueta: 'Caja', icono: 'cash-register', mci: true },
};

export default function BarraPestanas({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const activa = state.routes[state.index].name;

  return (
    <View style={[styles.barra, { height: 72 + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route) => {
        const item = ITEMS[route.name];
        if (!item) return null;

        const enfocada = activa === route.name;
        const color = enfocada ? colores.primarioContenedor : '#4A4F5B';

        const alPresionar = () => {
          const evento = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!enfocada && !evento.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (item.centro) {
          return (
            <Pressable
              key={route.name}
              style={styles.item}
              onPress={alPresionar}
              accessibilityRole="button"
              accessibilityLabel={item.etiqueta}
            >
              <View style={[styles.circulo, enfocada && styles.circuloActivo]}>
                <MaterialCommunityIcons name={item.icono} size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.etiquetaCentro}>{item.etiqueta}</Text>
            </Pressable>
          );
        }

        const Icono = item.mci ? MaterialCommunityIcons : Ionicons;

        return (
          <Pressable
            key={route.name}
            style={styles.item}
            onPress={alPresionar}
            accessibilityRole="button"
            accessibilityLabel={item.etiqueta}
          >
            <Icono name={item.icono} size={24} color={color} />
            <Text style={[styles.etiqueta, enfocada && styles.etiquetaActiva]}>
              {item.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    backgroundColor: colores.superficie,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
    ...sombras.flotante,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  etiqueta: {
    color: '#414957',
    fontSize: 10,
    fontWeight: '500',
  },
  etiquetaActiva: {
    color: colores.primarioContenedor,
    fontWeight: '700',
  },
  circulo: {
    width: 68,
    height: 68,
    borderRadius: 36,
    backgroundColor: colores.primarioContenedor,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -29,
    ...sombras.flotante,
  },
  circuloActivo: {
    backgroundColor: colores.terciario,
  },
  etiquetaCentro: {
    color: colores.texto,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
});
