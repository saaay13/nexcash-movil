import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChipFiltro } from '../components/molecules';
import { DrawerLateral } from '../components/organisms';
import { Pantalla } from '../components/templates';
import { bs, colores, espacios, radios, sombras } from '../theme';
import { obtenerVentas } from '../database';
import { useSesion } from '../context';

const FILTROS = ['Todas', 'Efectivo', 'QR'];

export default function HistorialScreen() {
  const navigation = useNavigation();
  const { empresaId } = useSesion();
  const [filtro, setFiltro] = useState('Todas');
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const cargarVentas = useCallback(async () => {
    if (!empresaId) {
      setVentas([]);
      setCargando(false);
      return;
    }
    try {
      setCargando(true);
      const listaDB = await obtenerVentas({ empresaId, limite: 100 });
      setVentas(Array.isArray(listaDB) ? listaDB : []);
    } catch (error) {
      console.warn('Error al cargar historial de ventas SQLite:', error);
      setVentas([]);
    } finally {
      setCargando(false);
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      cargarVentas();
    }, [cargarVentas])
  );

  const listaFiltrada = useMemo(() => {
    return ventas.filter((v) => {
      if (filtro === 'Todas') return true;
      const metodo = (v.metodo_pago || v.metodo || '').toLowerCase();
      if (filtro === 'Efectivo') return metodo === 'efectivo';
      if (filtro === 'QR') return metodo === 'qr';
      return true;
    });
  }, [ventas, filtro]);

  const totalRecaudado = useMemo(() => {
    return ventas.reduce((suma, v) => suma + Number(v.total || 0), 0);
  }, [ventas]);

  const promedioVenta = ventas.length > 0 ? totalRecaudado / ventas.length : 0;

  return (
    <>
    <Pantalla
      tienda
      titulo="Ventas"
      onMoneda={() => {}}
      onPerfil={() => navigation.navigate('Perfil')}
      onMenu={() => setDrawerVisible(true)}
      onTurno={() => navigation.navigate('Caja')}
    >

      <LinearGradient
        colors={['#003F78', '#164B91', '#5E0086']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.resumen}
      >
        <View style={styles.resumenTop}>
          <View style={styles.resumenEtiquetaLinea}>
            <Ionicons name="receipt-outline" size={17} color="#FFFFFF" />
            <Text style={styles.resumenEtiqueta}>HISTORIAL DE VENTAS</Text>
          </View>
          <View style={styles.pillBlanca}>
            <Text style={styles.pillTexto}>{ventas.length} tickets</Text>
          </View>
        </View>

        <Text style={styles.resumenTotal}>{bs(totalRecaudado)}</Text>

        <View style={styles.resumenPie}>
          <Text style={styles.resumenPieTexto}>
            Promedio por venta {bs(promedioVenta)}
          </Text>
          <Ionicons name="checkmark-circle" size={16} color="#97E9FF" />
        </View>
      </LinearGradient>

      <View style={styles.chips}>
        {FILTROS.map((nombre) => (
          <ChipFiltro
            key={nombre}
            etiqueta={nombre}
            activo={filtro === nombre}
            onPress={() => setFiltro(nombre)}
          />
        ))}
      </View>

      {cargando && ventas.length === 0 ? (
        <View style={styles.cargandoContenedor}>
          <ActivityIndicator size="small" color={colores.primarioContenedor} />
          <Text style={styles.cargandoTexto}>Cargando ventas...</Text>
        </View>
      ) : null}

      {listaFiltrada.map((venta) => {
        const metodo = (venta.metodo_pago || venta.metodo || 'efectivo').toLowerCase();
        const esQr = metodo === 'qr';
        const numeroFolio = String(venta.numero_venta ?? venta.numero ?? venta.id).padStart(3, '0');
        const hora = venta.creado_en ? venta.creado_en.substring(11, 16) : (venta.fecha ?? 'Hoy');
        const cantidadItems = venta.total_items ?? venta.items ?? 1;
        const nombreProducto = venta.primer_producto ?? venta.detalle?.[0]?.nombre ?? 'Venta POS';

        return (
          <Pressable
            key={venta.id}
            style={({ pressed }) => [styles.fila, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('VentaDetalle', { ventaId: venta.id, venta })}
          >
            <View style={styles.folio}>
              <Text style={styles.folioTexto}>#{numeroFolio}</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.nombre} numberOfLines={1}>
                {nombreProducto}
              </Text>
              <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
                {`${hora} · ${cantidadItems} un. · ${venta.vendedor ?? 'Admin'}`}
              </Text>
              <View style={[styles.metodoTag, esQr ? styles.metodoQr : styles.metodoEfectivo]}>
                <Text style={[styles.metodoTexto, esQr ? styles.textoQr : styles.textoEfectivo]}>
                  {esQr ? 'QR Simple' : 'Efectivo'}
                </Text>
              </View>
            </View>

            <View style={styles.derecha}>
              <Text style={styles.monto} numberOfLines={1}>
                {bs(venta.total)}
              </Text>
              <View style={styles.estadoLinea}>
                <Ionicons name="checkmark-circle" size={13} color={colores.exito} />
                <Text style={styles.estado} numberOfLines={1}>
                  Completado
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colores.contornoSuave} />
            </View>
          </Pressable>
        );
      })}

      {!cargando && listaFiltrada.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="receipt-outline" size={36} color={colores.contorno} />
          <Text style={styles.vacioTitulo}>Sin ventas registradas</Text>
          <Text style={styles.vacioTexto}>
            {filtro === 'Todas'
              ? 'Realiza tu primera venta desde la pestaña "Vender".'
              : `No se encontraron ventas pagadas con ${filtro}.`}
          </Text>
        </View>
      ) : null}
    </Pantalla>

    <DrawerLateral
      visible={drawerVisible}
      onClose={() => setDrawerVisible(false)}
      navigation={navigation}
    />
    </>
  );
}

const styles = StyleSheet.create({
  resumen: {
    borderRadius: radios.xxl,
    padding: espacios.lg,
    marginBottom: espacios.md,
    ...sombras.flotante,
  },
  resumenTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resumenEtiquetaLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resumenEtiqueta: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pillBlanca: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radios.full,
  },
  pillTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  resumenTotal: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginVertical: espacios.md,
  },
  resumenPie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: espacios.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  resumenPieTexto: {
    color: '#D4E2FF',
    fontSize: 11,
  },
  chips: {
    flexDirection: 'row',
    gap: espacios.xs,
    marginBottom: espacios.md,
  },
  cargandoContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  cargandoTexto: {
    fontSize: 12,
    color: colores.textoSuave,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.sm,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    gap: espacios.md,
    ...sombras.tarjeta,
  },
  folio: {
    width: 48,
    height: 48,
    borderRadius: radios.lg,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  folioTexto: {
    color: colores.primarioContenedor,
    fontSize: 12,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nombre: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.texto,
  },
  meta: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
    flexShrink: 1,
  },
  metodoTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 4,
  },
  metodoQr: {
    backgroundColor: '#F2D9FA',
  },
  metodoEfectivo: {
    backgroundColor: '#E2EEFF',
  },
  metodoTexto: {
    fontSize: 9,
    fontWeight: '700',
  },
  textoQr: {
    color: colores.terciario,
  },
  textoEfectivo: {
    color: colores.primarioContenedor,
  },
  derecha: {
    alignItems: 'flex-end',
    gap: 3,
    minWidth: 96,
    flexShrink: 0,
  },
  monto: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
  },
  estadoLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  estado: {
    fontSize: 10,
    fontWeight: '600',
    color: colores.exito,
  },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 6,
  },
  vacioTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.texto,
    marginTop: 6,
  },
  vacioTexto: {
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: 'center',
    maxWidth: 240,
  },
});
