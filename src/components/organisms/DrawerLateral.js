import React, { useEffect, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colores, espacios, radios, sombras } from '../../theme';
import { useConfiguracion, useSesion } from '../../context';

const ANCHO_DRAWER = Math.min(320, Dimensions.get('window').width * 0.82);

export default function DrawerLateral({ visible, onClose, navigation }) {
  const insets = useSafeAreaInsets();
  const { usuario, empresa, cerrarSesion } = useSesion();
  const {
    sonidoEscaneo,
    vibracionEscaneo,
    cambiarPreferencia,
  } = useConfiguracion();
  const animacionX = useMemo(() => new Animated.Value(-ANCHO_DRAWER), []);
  const opacidadFondo = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(animacionX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacidadFondo, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animacionX, {
          toValue: -ANCHO_DRAWER,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacidadFondo, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, animacionX, opacidadFondo]);

  function navegarA(ruta, params) {
    onClose();
    setTimeout(() => {
      navigation.navigate(ruta, params);
    }, 220);
  }

  function handleCerrarSesion() {
    onClose();
    setTimeout(() => {
      cerrarSesion();
      navigation.replace('Bienvenida');
    }, 220);
  }

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.contenedorModal}>

        <Animated.View style={[styles.fondoOscuro, { opacity: opacidadFondo }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            {
              width: ANCHO_DRAWER,
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateX: animacionX }],
            },
          ]}
        >

          <LinearGradient
            colors={['#003F78', '#00539A', '#5E0086']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cabecera}
          >
            <View style={styles.cabeceraTop}>
              <Image
                source={require('../../../assets/nexcash.jpg')}
                style={styles.logoEmpresa}
                resizeMode="contain"
              />
              <TouchableOpacity
                onPress={onClose}
                style={styles.botonCerrar}
                accessibilityLabel="Cerrar menú"
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.nombreEmpresa} numberOfLines={1}>
              {empresa?.nombre || 'Sin empresa'}
            </Text>

            <View style={styles.filaUsuario}>
              <View style={styles.badgeRol}>
                <Text style={styles.badgeRolTexto}>
                  {(empresa?.rol ?? usuario?.rol) === 'admin' ? 'ADMINISTRADOR' : 'VENDEDOR'}
                </Text>
              </View>
              <Text style={styles.nombreUsuario} numberOfLines={1}>
                {usuario?.nombre || 'Usuario'}
              </Text>
            </View>

            {empresa?.codigo_vinculacion || empresa?.codigo_privado ? (
              <View style={styles.codigoBadge}>
                <Ionicons name="key-outline" size={13} color="#D4E2FF" />
                <Text style={styles.codigoTexto}>
                  Código: {empresa.codigo_vinculacion || empresa.codigo_privado}
                </Text>
              </View>
            ) : null}
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listaMenu}
          >
            <Text style={styles.seccionTitulo}>MÓDULOS DE ADMINISTRACIÓN</Text>

            <ItemMenu
              icono="pricetags-outline"
              colorIcono="#00539A"
              fondoIcono="#E8F1FC"
              titulo="Categorías"
              subtitulo="Familias y clasificación"
              onPress={() => navegarA('Categorias')}
            />

            <ItemMenu
              icono="swap-horizontal-outline"
              colorIcono="#0061A3"
              fondoIcono="#E2F0FD"
              titulo="Kardex de Inventario"
              subtitulo="Entradas, salidas y ajustes"
              onPress={() => navegarA('MovimientosInventario')}
            />

            <ItemMenu
              icono="wallet-outline"
              colorIcono="#5E0086"
              fondoIcono="#F5E8FF"
              titulo="Caja y Arqueo"
              subtitulo="Turnos y movimientos de dinero"
              onPress={() => navegarA('Caja')}
            />

            <ItemMenu
              icono="receipt-outline"
              colorIcono="#0369A1"
              fondoIcono="#E0F2FE"
              titulo="Historial de Caja"
              subtitulo="Ingresos, egresos y responsables"
              onPress={() => navegarA('HistorialCaja')}
            />

            <View style={styles.divisor} />

            <Text style={styles.seccionTitulo}>CONFIGURACIÓN</Text>

            <FilaConfiguracion
              icono="volume-high-outline"
              colorIcono="#00539A"
              fondoIcono="#E8F1FC"
              titulo="Sonido al escanear"
              subtitulo="Pitido al agregar un producto a la venta"
              valor={sonidoEscaneo}
              onCambiar={(valor) => cambiarPreferencia('sonidoEscaneo', valor)}
            />

            <FilaConfiguracion
              icono="vibrate-outline"
              colorIcono="#5E0086"
              fondoIcono="#F5E8FF"
              titulo="Vibración al escanear"
              subtitulo="Aviso tangible en el mismo momento"
              valor={vibracionEscaneo}
              onCambiar={(valor) => cambiarPreferencia('vibracionEscaneo', valor)}
            />

            <View style={styles.divisor} />

            <Text style={styles.seccionTitulo}>ESPACIO Y CUENTA</Text>

            <ItemMenu
              icono="person-circle-outline"
              colorIcono="#00539A"
              fondoIcono="#E8F1FC"
              titulo="Mi perfil"
              subtitulo="Datos y opciones de tu cuenta"
              onPress={() => navegarA('Perfil')}
            />

            <ItemMenu
              icono="business-outline"
              colorIcono="#4338CA"
              fondoIcono="#EEF2FF"
              titulo="Cambiar de Empresa"
              subtitulo="Gestionar otros negocios"
              onPress={() => navegarA('EmpresaSeleccion')}
            />

            <ItemMenu
              icono="log-out-outline"
              colorIcono="#DC2626"
              fondoIcono="#FEE2E2"
              titulo="Cerrar Sesión"
              subtitulo="Salir de la cuenta activa"
              onPress={handleCerrarSesion}
              peligro
            />
          </ScrollView>

          <View style={styles.pieDrawer}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colores.textoSuave} />
            <Text style={styles.pieTexto}>NexCash SaaS · KJ</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ItemMenu({
  icono,
  colorIcono,
  fondoIcono,
  titulo,
  subtitulo,
  onPress,
  peligro = false,
}) {
  return (
    <TouchableOpacity
      style={styles.itemFila}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.iconoCaja, { backgroundColor: fondoIcono }]}>
        <Ionicons name={icono} size={20} color={colorIcono} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitulo, peligro && { color: '#DC2626' }]}>
          {titulo}
        </Text>
        {subtitulo ? <Text style={styles.itemSub}>{subtitulo}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colores.contornoSuave} />
    </TouchableOpacity>
  );
}

function FilaConfiguracion({
  icono,
  colorIcono,
  fondoIcono,
  titulo,
  subtitulo,
  valor,
  onCambiar,
}) {
  return (
    <View style={styles.itemFila}>
      <View style={[styles.iconoCaja, { backgroundColor: fondoIcono }]}>
        <Ionicons name={icono} size={20} color={colorIcono} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.itemSub}>{subtitulo}</Text> : null}
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
  contenedorModal: {
    flex: 1,
    flexDirection: 'row',
  },
  fondoOscuro: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    ...sombras.modal,
    justifyContent: 'space-between',
  },
  cabecera: {
    padding: espacios.lg,
    paddingTop: espacios.xl,
    borderBottomRightRadius: radios.xxl,
  },
  cabeceraTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacios.md,
  },
  logoEmpresa: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  botonCerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreEmpresa: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  badgeRol: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRolTexto: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nombreUsuario: {
    color: '#E0EDFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  codigoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: espacios.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radios.full,
  },
  codigoTexto: {
    color: '#D4E2FF',
    fontSize: 11,
    fontWeight: '700',
  },
  listaMenu: {
    padding: espacios.md,
    paddingTop: espacios.lg,
  },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: colores.textoSuave,
    letterSpacing: 0.8,
    marginBottom: espacios.sm,
    marginLeft: espacios.xs,
  },
  itemFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radios.lg,
    marginBottom: 2,
  },
  iconoCaja: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.texto,
  },
  itemSub: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 1,
  },
  divisor: {
    height: 1,
    backgroundColor: '#EEF0F6',
    marginVertical: espacios.md,
    marginHorizontal: espacios.xs,
  },
  pieDrawer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: espacios.sm,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F6',
  },
  pieTexto: {
    fontSize: 11,
    color: colores.textoSuave,
    fontWeight: '600',
  },
});
