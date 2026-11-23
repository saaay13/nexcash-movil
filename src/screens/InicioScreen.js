import { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AccionRapida, FilaVenta, StatCard } from '../components/molecules';
import { DrawerLateral, GraficoVentas, TarjetaRecaudacion } from '../components/organisms';
import { Pantalla } from '../components/templates';
import { bs, colores, radios } from '../theme';
import {
  obtenerProductos,
  obtenerResumenCaja,
  obtenerVentas,
  obtenerVentasPorDia,
} from '../database';
import { useSesion } from '../context';

const BLUE = colores.primarioContenedor;
const PURPLE = colores.terciario;

export default function InicioScreen() {
  const navigation = useNavigation();
  const { usuario, empresa, empresaId } = useSesion();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [listaProductos, setListaProductos] = useState([]);
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalRecaudado: 0,
    totalEfectivo: 0,
    totalQr: 0,
  });
  const [ventasPorDia, setVentasPorDia] = useState([0, 0, 0, 0, 0, 0, 0]);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      if (!empresaId) return undefined;

      Promise.all([
        obtenerProductos({ empresaId }),
        obtenerVentas({ empresaId, limite: 4 }),
        obtenerResumenCaja(empresaId, { soloHoy: true }),
        obtenerVentasPorDia(empresaId),
      ])
        .then(([prods, ventasDB, resumenDB, diasDB]) => {
          if (cancelado) return;
          setListaProductos(Array.isArray(prods) ? prods : []);
          setVentasRecientes(Array.isArray(ventasDB) ? ventasDB : []);
          setResumen(
            resumenDB ?? { totalVentas: 0, totalRecaudado: 0, totalEfectivo: 0, totalQr: 0 }
          );
          setVentasPorDia(Array.isArray(diasDB) ? diasDB : [0, 0, 0, 0, 0, 0, 0]);
        })
        .catch(() => {
          if (cancelado) return;
          setListaProductos([]);
          setVentasRecientes([]);
        });

      return () => {
        cancelado = true;
      };
    }, [empresaId])
  );

  const aviso = (nombre, detalle) => Alert.alert(nombre, detalle);

  const abrirPerfil = () => navigation.navigate('Perfil');

  const criticos = listaProductos.filter(
    (p) => (p.stock_actual ?? p.stock ?? 0) <= (p.stock_minimo ?? 5)
  );
  const critico = criticos[0];

  const totalAMostrar = resumen.totalRecaudado;
  const conteoVentas = resumen.totalVentas;
  const primerNombre = (usuario?.nombre ?? 'Usuario').split(' ')[0];
  const rolTexto = (empresa?.rol ?? usuario?.rol) === 'admin' ? 'Admin' : 'Vendedor';

  return (
    <>
      <Pantalla
        tienda
        titulo="Inicio"
        onTurno={() => navigation.navigate('Caja')}
        onMoneda={() => aviso('Moneda', 'Moneda configurada: Bolivianos (Bs)')}
        onPerfil={abrirPerfil}
        onMenu={() => setDrawerVisible(true)}
      >

      <View style={styles.greetingRow}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={32} color="#FFFFFF" />
        </View>

        <View style={styles.greetingText}>
          <View style={styles.nameLine}>
            <Text style={styles.greeting}>¡Hola, {primerNombre}!</Text>
            <Text style={styles.adminBadge}>{rolTexto}</Text>
          </View>

          <View style={styles.terminalLine}>
            <Ionicons name="settings-outline" size={16} color={BLUE} />
            <Text style={styles.terminalText} numberOfLines={1}>
              {empresa?.nombre ?? 'Sin empresa seleccionada'}
            </Text>
          </View>
        </View>

      </View>

      <TarjetaRecaudacion
        total={totalAMostrar}
        cantidadVentas={conteoVentas}
      />

      <View style={styles.statsRow}>
        <StatCard
          title="PRODUCTOS"
          value={String(listaProductos.length)}
          subtitle="En catálogo"
          icon="cube-outline"
          color="#0070C9"
        />

        <StatCard
          title="EXISTENCIA BAJA"
          value={String(criticos.length)}
          subtitle="Críticos"
          icon="warning-outline"
          color={colores.error}
          alert
        />

        <StatCard
          title="VENTAS HOY"
          value={String(conteoVentas)}
          subtitle={`Prom. ${bs(conteoVentas > 0 ? totalAMostrar / conteoVentas : 0)}`}
          icon="hourglass-outline"
          color={PURPLE}
        />
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <Text style={styles.sectionLink}>Terminal POS</Text>
      </View>

      <View style={styles.actionsGrid}>
        <AccionRapida
          title="Nueva Venta"
          subtitle="Cobro directo"
          icon="cart-outline"
          background="#005AA4"
          onPress={() => navigation.navigate('Vender')}
        />

        <AccionRapida
          title="Escanear"
          subtitle="Código de barra"
          icon="barcode-scan"
          background={PURPLE}
          onPress={() => navigation.navigate('Vender')}
        />

        <AccionRapida
          title="Inventario"
          subtitle="Ajustar existencia"
          icon="package-variant-closed"
          background="#0062A9"
          onPress={() => navigation.navigate('Productos')}
        />

        <AccionRapida
          title="Cierre de Caja"
          subtitle="Arqueo turno"
          icon="calculator-variant-outline"
          background="#F4D8FF"
          foreground={PURPLE}
          onPress={() => navigation.navigate('Caja')}
        />
      </View>

      {critico ? (
        <TouchableOpacity
          style={styles.lowStockBanner}
          onPress={() => navigation.navigate('Productos')}
          activeOpacity={0.85}
        >
          <View style={styles.lowStockIcon}>
            <MaterialCommunityIcons name="clipboard-alert-outline" size={23} color="#B00020" />
          </View>

          <View style={styles.lowStockText}>
            <Text style={styles.lowStockTitle}>
              {criticos.length} producto{criticos.length === 1 ? '' : 's'} por agotarse
            </Text>
            <Text style={styles.lowStockSubtitle} numberOfLines={1}>
              {criticos.map((p) => p.nombre).join(', ')}
            </Text>
          </View>

          <View style={styles.restockButton}>
            <Text style={styles.restockText}>Reponer</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <GraficoVentas datos={ventasPorDia} />

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Ventas Recientes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Historial')}>
          <Text style={styles.sectionLink}>Ver todas ({conteoVentas})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.salesList}>
        {ventasRecientes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={22} color={colores.contorno} />
            <Text style={styles.emptyText}>Aún no hay ventas registradas hoy.</Text>
          </View>
        ) : (
          ventasRecientes.map((venta) => (
            <FilaVenta
              key={venta.id}
              venta={venta}
              onPress={() => navigation.navigate('VentaDetalle', { ventaId: venta.id, venta })}
            />
          ))
        )}
      </View>
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 19,
    minHeight: 54,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: '#A9C5D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingText: {
    flex: 1,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    color: colores.texto,
    fontSize: 20,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: '#004F93',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  terminalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  terminalText: {
    color: '#464E5E',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 20,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  sectionTitle: {
    color: colores.texto,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionLink: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 20,
  },
  lowStockBanner: {
    minHeight: 74,
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FFD3D3',
    borderRadius: radios.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 22,
  },
  lowStockIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFD9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowStockText: {
    flex: 1,
  },
  lowStockTitle: {
    color: '#900010',
    fontSize: 14,
    fontWeight: '700',
  },
  lowStockSubtitle: {
    color: '#4E5868',
    fontSize: 11,
    marginTop: 2,
  },
  restockButton: {
    backgroundColor: colores.primario,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
  },
  restockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  salesList: {
    gap: 7,
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colores.superficie,
    borderRadius: radios.lg,
    padding: 16,
  },
  emptyText: {
    fontSize: 12,
    color: colores.textoSuave,
  },
});
