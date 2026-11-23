import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Boton } from '../components/atoms';
import {
  Buscador,
  DialogoConfirmacion,
  DialogoTicketQr,
  EscaneadorCodigo,
  SelectorCantidad,
} from '../components/molecules';
import { DrawerLateral, EncabezadoTienda } from '../components/organisms';
import { bs, colores, espacios, radios, sombras } from '../theme';
import {
  mensajeError,
  obtenerProductoPorCodigo,
  obtenerProductos,
  registrarVenta,
} from '../database';
import { useSesion } from '../context';
import { crearEnlaceTicket } from '../services';

export default function VenderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { empresa, empresaId, usuario, usuarioId } = useSesion();
  const productoDesdeParametro = route.params?.productoId;

  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState({});
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [procesando, setProcesando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [escaneoVisible, setEscaneoVisible] = useState(false);
  const [ticketQr, setTicketQr] = useState(null);

  const [dialogo, setDialogo] = useState({
    visible: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Aceptar',
    textoCancelar: null,
    onConfirmar: null,
    onCancelar: null,
  });

  function cerrarDialogo() {
    setDialogo((d) => ({ ...d, visible: false }));
  }

  const cargarProductos = useCallback(async () => {
    if (!empresaId) {
      setProductos([]);
      return;
    }
    try {
      setCargando(true);
      const datos = await obtenerProductos({ empresaId });
      setProductos(Array.isArray(datos) ? datos : []);

      if (productoDesdeParametro) {
        setCarrito((actual) => ({
          ...actual,
          [productoDesdeParametro]: Math.max(1, actual[productoDesdeParametro] ?? 0),
        }));
        navigation.setParams({ productoId: undefined });
      }
    } catch (e) {
      console.warn('No se pudo cargar el catálogo para vender:', e?.message);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  }, [empresaId, productoDesdeParametro, navigation]);

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [cargarProductos])
  );

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return productos;
    return productos.filter(
      (producto) =>
        (producto.nombre || '').toLowerCase().includes(texto) ||
        (producto.sku || '').toLowerCase().includes(texto)
    );
  }, [busqueda, productos]);

  const lineas = useMemo(
    () =>
      productos
        .filter((producto) => (carrito[producto.id] ?? 0) > 0)
        .map((producto) => ({
          ...producto,
          cantidad: carrito[producto.id],
          subtotal: Number(producto.precio || 0) * carrito[producto.id],
        })),
    [productos, carrito]
  );

  const total = lineas.reduce((suma, linea) => suma + linea.subtotal, 0);
  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);

  function cambiarCantidad(producto, delta) {
    const stock = Number(producto.stock ?? producto.stock_actual ?? 0);
    setCarrito((actual) => {
      const nueva = Math.max(0, Math.min(stock, (actual[producto.id] ?? 0) + delta));
      return { ...actual, [producto.id]: nueva };
    });
  }

  async function procesarCodigo(codigo) {
    setEscaneoVisible(false);

    try {
      const producto = await obtenerProductoPorCodigo(codigo, empresaId);

      if (!producto) {
        setDialogo({
          visible: true,
          tipo: 'advertencia',
          titulo: 'Código no registrado',
          mensaje: `No hay un producto con el código ${codigo}. ¿Deseas registrarlo?`,
          textoConfirmar: 'Registrar',
          textoCancelar: 'Cancelar',
          onConfirmar: () => {
            cerrarDialogo();
            navigation.navigate('ProductoForm', { codigoBarras: codigo });
          },
          onCancelar: cerrarDialogo,
        });
        return;
      }

      const stock = Number(producto.stock ?? producto.stock_actual ?? 0);

      if (stock <= 0) {
        setDialogo({
          visible: true,
          tipo: 'advertencia',
          titulo: 'Sin existencia',
          mensaje: `${producto.nombre} no tiene unidades disponibles.`,
          textoConfirmar: 'Entendido',
          textoCancelar: null,
          onConfirmar: cerrarDialogo,
        });
        return;
      }

      setCarrito((actual) => ({
        ...actual,
        [producto.id]: Math.min(stock, (actual[producto.id] ?? 0) + 1),
      }));
      setBusqueda(producto.nombre ?? '');
    } catch (e) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo leer el código',
        mensaje: mensajeError(e, 'No se pudo buscar el producto.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    }
  }

  async function confirmar() {
    if (total <= 0) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Carrito vacío',
        mensaje: 'Selecciona al menos un producto para proceder con el cobro.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
      return;
    }

    if (!empresaId || !usuarioId) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Sesión no válida',
        mensaje: 'Vuelve a iniciar sesión y selecciona una empresa para vender.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
      return;
    }

    try {
      setProcesando(true);
      const itemsVenta = lineas.map((l) => ({
        productoId: l.id,
        cantidad: l.cantidad,
      }));

      const ventaGuardada = await registrarVenta({
        empresaId,
        usuarioId,
        items: itemsVenta,
        descuento: 0,
        metodoPago: metodoPago.toLowerCase() === 'qr' ? 'qr' : 'efectivo',
      });

      const ahora = new Date();
      const fecha = `${String(ahora.getDate()).padStart(2, '0')}/${String(
        ahora.getMonth() + 1
      ).padStart(2, '0')}/${ahora.getFullYear()} ${String(
        ahora.getHours()
      ).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      const numeroTicket = String(ventaGuardada.numero_venta).padStart(3, '0');

      const datosTicket = {
        numero: numeroTicket,
        fecha,
        empresa: empresa?.nombre ?? 'NexCash',
        vendedor: usuario?.nombre ?? 'Vendedor',
        metodo: ventaGuardada.metodo_pago === 'qr' ? 'QR Simple' : 'Efectivo',
        items: lineas.map((linea) => ({
          nombre: String(linea.nombre ?? 'Producto'),
          cantidad: Number(linea.cantidad ?? 0),
          precio: Number(linea.precio ?? linea.precio_venta ?? 0),
          subtotal: Number(linea.subtotal ?? 0),
        })),
        subtotal: Number(ventaGuardada.subtotal ?? 0),
        descuento: Number(ventaGuardada.descuento ?? 0),
        total: Number(ventaGuardada.total ?? 0),
      };

      setTicketQr({
        ...datosTicket,
        enlace: crearEnlaceTicket(datosTicket),
        ventaId: ventaGuardada.id,
        visible: false,
      });
      setCarrito({});
      cargarProductos();

      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: '¡Venta completada!',
        mensaje: `Ticket #${numeroTicket}\nTotal cobrado: ${bs(
          ventaGuardada.total
        )}\n¿Deseas generar el QR para que el cliente descargue su comprobante?`,
        textoConfirmar: 'Generar QR',
        textoCancelar: 'Ahora no',
        onConfirmar: () => {
          cerrarDialogo();
          setTicketQr((actual) => (actual ? { ...actual, visible: true } : null));
        },
        onCancelar: () => {
          cerrarDialogo();
          setTicketQr(null);
        },
      });
    } catch (e) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Inconveniente en la venta',
        mensaje: mensajeError(e, 'No se pudo procesar la venta.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <View style={styles.pantalla}>
        <EncabezadoTienda
          titulo="Vender"
          onMoneda={() => Alert.alert('Moneda', 'Moneda configurada: Bolivianos (Bs)')}
          onPerfil={() => setDrawerVisible(true)}
          onMenu={() => setDrawerVisible(true)}
          onTurno={() => navigation.navigate('Caja')}
        />

        <ScrollView
          contentContainerStyle={styles.contenido}
          showsVerticalScrollIndicator={false}
        >

          <Buscador
            valor={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar producto para agregar..."
            iconoDerecha="barcode-outline"
            onIconoDerechaPress={() => setEscaneoVisible(true)}
          />

          <Boton
            titulo="Escanear código de barras"
            icono="barcode-outline"
            variante="suave"
            tamano="sm"
            onPress={() => setEscaneoVisible(true)}
            style={styles.botonEscanear}
          />

          <View style={styles.cabecera}>
            <Text style={styles.tituloSeccion}>Productos disponibles</Text>
            <Text style={styles.contador}>{unidades} en el carrito</Text>
          </View>

          {cargando ? (
            <Text style={styles.estadoTexto}>Cargando catálogo...</Text>
          ) : productos.length === 0 ? (
            <View style={styles.vacio}>
              <Ionicons name="cube-outline" size={32} color={colores.contorno} />
              <Text style={styles.vacioTitulo}>Tu catálogo está vacío</Text>
              <Text style={styles.vacioTexto}>
                Registra productos en Inventario para poder venderlos.
              </Text>
              <Boton
                titulo="Agregar producto"
                icono="add"
                tamano="sm"
                variante="primario"
                onPress={() => navigation.navigate('ProductoForm')}
              />
            </View>
          ) : visibles.length === 0 ? (
            <Text style={styles.estadoTexto}>No hay productos que coincidan con la búsqueda.</Text>
          ) : (
            visibles.map((producto) => {
              const cantidad = carrito[producto.id] ?? 0;
              const stock = Number(producto.stock ?? producto.stock_actual ?? 0);

              return (
                <View key={producto.id} style={[styles.fila, cantidad > 0 && styles.filaActiva]}>
                  <View
                    style={[
                      styles.miniatura,
                      { backgroundColor: producto.color ?? colores.superficieBaja },
                    ]}
                  >
                    <Ionicons name="cube-outline" size={22} color="#FFFFFF" />
                  </View>

                  <View style={styles.info}>
                    <Text style={styles.nombre} numberOfLines={1}>
                      {producto.nombre}
                    </Text>
                    <Text style={styles.detalle} numberOfLines={1}>
                      {producto.sku ? `${producto.sku} · ` : ''}Quedan {stock}
                    </Text>
                    <Text style={styles.precio}>{bs(producto.precio)}</Text>
                  </View>

                  <SelectorCantidad
                    valor={cantidad}
                    onRestar={() => cambiarCantidad(producto, -1)}
                    onSumar={() => cambiarCantidad(producto, 1)}
                  />
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.panelCobro}>
          <View style={styles.metodos}>
            {['Efectivo', 'QR'].map((metodo) => {
              const activo = metodoPago === metodo;
              return (
                <Pressable
                  key={metodo}
                  style={[styles.botonMetodo, activo && styles.botonMetodoActivo]}
                  onPress={() => setMetodoPago(metodo)}
                >
                  <Ionicons
                    name={metodo === 'QR' ? 'qr-code-outline' : 'cash-outline'}
                    size={18}
                    color={activo ? '#FFFFFF' : colores.textoSuave}
                  />
                  <Text style={[styles.textoMetodo, activo && styles.textoMetodoActivo]}>
                    {metodo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.filaTotal}>
            <View>
              <Text style={styles.totalEtiqueta}>TOTAL A COBRAR</Text>
              <Text style={styles.totalMonto}>{bs(total)}</Text>
            </View>

            <Boton
              titulo={procesando ? 'Guardando...' : 'Confirmar cobro'}
              icono="checkmark-circle-outline"
              variante="acento"
              cargando={procesando}
              deshabilitado={total <= 0}
              onPress={confirmar}
              style={styles.botonCobro}
            />
          </View>
        </View>

        <EscaneadorCodigo
          visible={escaneoVisible}
          onCerrar={() => setEscaneoVisible(false)}
          onLeer={procesarCodigo}
        />

        <DialogoConfirmacion
          visible={dialogo.visible}
          tipo={dialogo.tipo}
          titulo={dialogo.titulo}
          mensaje={dialogo.mensaje}
          textoConfirmar={dialogo.textoConfirmar}
          textoCancelar={dialogo.textoCancelar}
          onConfirmar={dialogo.onConfirmar}
          onCancelar={dialogo.onCancelar}
          cargando={procesando}
        />

        <DialogoTicketQr
          visible={ticketQr?.visible ?? false}
          ticket={ticketQr}
          onCerrar={() => setTicketQr(null)}
          onVerDetalle={() => {
            const ventaId = ticketQr?.ventaId;
            setTicketQr(null);
            if (ventaId) navigation.navigate('VentaDetalle', { ventaId });
          }}
        />
      </View>

      <DrawerLateral
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: espacios.lg,
    paddingBottom: 160,
  },
  botonEscanear: {
    alignSelf: 'flex-start',
    marginTop: -espacios.sm,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espacios.lg,
    marginBottom: espacios.sm,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '700',
    color: colores.texto,
  },
  contador: {
    fontSize: 12,
    fontWeight: '600',
    color: colores.primarioContenedor,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.sm,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    ...sombras.tarjeta,
  },
  filaActiva: {
    borderColor: colores.primarioContenedor,
    backgroundColor: '#F7FAFF',
  },
  miniatura: {
    width: 44,
    height: 44,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
  detalle: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 1,
  },
  precio: {
    fontSize: 13,
    fontWeight: '800',
    color: colores.primarioContenedor,
    marginTop: 2,
  },
  panelCobro: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colores.superficie,
    borderTopLeftRadius: radios.xxl,
    borderTopRightRadius: radios.xxl,
    padding: espacios.lg,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF5',
    ...sombras.modal,
  },
  metodos: {
    flexDirection: 'row',
    gap: espacios.sm,
    marginBottom: espacios.md,
  },
  botonMetodo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radios.lg,
    borderWidth: 1.5,
    borderColor: colores.contornoSuave,
    backgroundColor: colores.superficie,
  },
  botonMetodoActivo: {
    borderColor: colores.terciario,
    backgroundColor: colores.terciario,
  },
  textoMetodo: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  textoMetodoActivo: {
    color: '#FFFFFF',
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalEtiqueta: {
    fontSize: 10,
    fontWeight: '800',
    color: colores.textoSuave,
    letterSpacing: 0.5,
  },
  totalMonto: {
    fontSize: 22,
    fontWeight: '800',
    color: colores.texto,
    marginTop: 2,
  },
  botonCobro: {
    minWidth: 160,
  },
  estadoTexto: {
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: 'center',
    paddingVertical: espacios.lg,
  },
  vacio: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 30,
    paddingHorizontal: espacios.lg,
  },
  vacioTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.texto,
  },
  vacioTexto: {
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: 'center',
    marginBottom: espacios.sm,
  },
});
