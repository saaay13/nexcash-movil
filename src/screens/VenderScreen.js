import { useCallback, useMemo, useRef, useState } from 'react';
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
import { Boton, Campo } from '../components/atoms';
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
import { useConfiguracion, useSesion } from '../context';
import {
  consultarProductoPorCodigo,
  crearEnlaceTicket,
  descargarReciboPdf,
} from '../services';

const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export default function VenderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { empresa, empresaId, usuario, usuarioId } = useSesion();
  const { notificarEscaneo } = useConfiguracion();
  const productoDesdeParametro = route.params?.productoId;

  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState({});
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [escaneoVisible, setEscaneoVisible] = useState(false);
  const [escaneoContinuo, setEscaneoContinuo] = useState(false);
  const [usarApi, setUsarApi] = useState(false);
  const [conteoEscaneos, setConteoEscaneos] = useState(0);
  const [escaneados, setEscaneados] = useState([]);
  const [ultimoEscaneo, setUltimoEscaneo] = useState(null);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [ticketQr, setTicketQr] = useState(null);

  const carritoRef = useRef({});
  const colaLecturas = useRef([]);
  const leyendoCodigo = useRef(false);

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

  const fijarCarrito = useCallback((actualizacion) => {
    const siguiente =
      typeof actualizacion === 'function'
        ? actualizacion(carritoRef.current)
        : actualizacion;
    carritoRef.current = siguiente;
    setCarrito(siguiente);
    return siguiente;
  }, []);

  function abrirEscaneo() {
    setBusqueda('');
    setConteoEscaneos(0);
    setEscaneados([]);
    setUltimoEscaneo(null);
    setEscaneoContinuo(true);
    setEscaneoVisible(true);
  }

  function cerrarEscaneo() {
    colaLecturas.current = [];
    setBusqueda('');
    setEscaneoVisible(false);
  }

  function registrarCodigo(codigo, datosApi) {
    cerrarEscaneo();
    navigation.navigate('ProductoForm', {
      codigoBarras: codigo,
      datosApi: datosApi ?? null,
    });
  }

  function marcarEscaneado(id) {
    setEscaneados((actual) => (actual.includes(id) ? actual : [...actual, id]));
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
        fijarCarrito((actual) => ({
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
  }, [empresaId, productoDesdeParametro, navigation, fijarCarrito]);

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [cargarProductos])
  );

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const filtrados = !texto
      ? productos
      : productos.filter(
          (producto) =>
            (producto.nombre || '').toLowerCase().includes(texto) ||
            (producto.sku || '').toLowerCase().includes(texto)
        );

    if (escaneados.length === 0) return filtrados;

    const orden = new Map(escaneados.map((id, indice) => [id, indice]));
    return [...filtrados].sort((a, b) => {
      const posA = orden.has(a.id) ? orden.get(a.id) : Number.MAX_SAFE_INTEGER;
      const posB = orden.has(b.id) ? orden.get(b.id) : Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
  }, [busqueda, productos, escaneados]);

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

  const total = redondear(lineas.reduce((suma, linea) => suma + linea.subtotal, 0));
  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  const esEfectivo = metodoPago.toLowerCase() !== 'qr';
  const montoRecibidoNum = Number(String(montoRecibido).replace(',', '.'));
  const montoEsValido =
    montoRecibido.trim() !== '' && Number.isFinite(montoRecibidoNum) && montoRecibidoNum >= 0;
  const montoSuficiente = esEfectivo && montoEsValido && redondear(montoRecibidoNum) >= total;
  const cambio = montoSuficiente ? redondear(montoRecibidoNum - total) : 0;
  const textoCambio = !esEfectivo
    ? ''
    : !montoEsValido
      ? '—'
      : montoSuficiente
        ? bs(cambio)
        : `Falta ${bs(Math.max(0, total - redondear(montoRecibidoNum)))}`;

  function cambiarCantidad(producto, delta) {
    const stock = Number(producto.stock ?? producto.stock_actual ?? 0);
    fijarCarrito((actual) => {
      const nueva = Math.max(0, Math.min(stock, (actual[producto.id] ?? 0) + delta));
      return { ...actual, [producto.id]: nueva };
    });
  }

  async function procesarCodigo(codigo, conApi = false) {
    try {
      const producto = await obtenerProductoPorCodigo(codigo, empresaId);

      if (!producto) {
        if (!conApi) {
          setUltimoEscaneo({ tipo: 'error', codigo });
          return;
        }

        try {
          const datosApi = await consultarProductoPorCodigo(codigo);
          if (datosApi) {
            setUltimoEscaneo({
              tipo: 'error',
              codigo,
              datosApi,
              detalle: 'Datos de Open Food Facts listos. Toca Registrar.',
            });
            return;
          }
          setUltimoEscaneo({
            tipo: 'error',
            codigo,
            detalle: 'No hay datos en la API. Completa los campos manualmente.',
          });
        } catch (e) {
          setUltimoEscaneo({
            tipo: 'error',
            codigo,
            detalle: mensajeError(e, 'No se pudo consultar la API.'),
          });
        }
        return;
      }

      const stock = Number(producto.stock ?? producto.stock_actual ?? 0);
      const cantidadActual = carritoRef.current[producto.id] ?? 0;
      const nombre = producto.nombre ?? 'Producto';

      if (cantidadActual > 0) {
        marcarEscaneado(producto.id);
        setUltimoEscaneo({ tipo: 'duplicado', nombre, codigo });
        return;
      }

      if (stock <= 0) {
        setUltimoEscaneo({ tipo: 'sin_stock', nombre, codigo });
        return;
      }

      fijarCarrito((actual) => ({
        ...actual,
        [producto.id]: 1,
      }));
      setConteoEscaneos((actual) => actual + 1);
      marcarEscaneado(producto.id);
      setUltimoEscaneo({ tipo: 'ok', nombre, codigo });
      notificarEscaneo();
    } catch (e) {
      setUltimoEscaneo({
        tipo: 'error',
        codigo,
        detalle: mensajeError(e, 'No se pudo buscar el producto.'),
      });
    }
  }

  async function procesarSiguienteCodigo() {
    if (leyendoCodigo.current) return;

    const lectura = colaLecturas.current.shift();
    if (!lectura) return;

    leyendoCodigo.current = true;
    try {
      await procesarCodigo(lectura.codigo, lectura.conApi);
    } finally {
      leyendoCodigo.current = false;
      if (colaLecturas.current.length > 0) {
        procesarSiguienteCodigo();
      }
    }
  }

  function encolarCodigo(codigo, conApi = false) {
    colaLecturas.current.push({ codigo, conApi: Boolean(conApi) });
    procesarSiguienteCodigo();
  }

  async function descargarPdf() {
    if (!ticketQr) return;

    setDescargandoPdf(true);
    try {
      await descargarReciboPdf(ticketQr);
    } catch (e) {
      console.error('Error al descargar el comprobante local', e);
      Alert.alert(
        'No se pudo descargar el PDF',
        mensajeError(e, 'Intenta nuevamente en unos segundos.')
      );
    } finally {
      setDescargandoPdf(false);
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

    if (esEfectivo) {
      if (!montoEsValido) {
        setDialogo({
          visible: true,
          tipo: 'advertencia',
          titulo: 'Monto recibido no válido',
          mensaje: 'Ingresa un monto recibido válido para el pago en efectivo.',
          textoConfirmar: 'Entendido',
          textoCancelar: null,
          onConfirmar: cerrarDialogo,
        });
        return;
      }
      if (!montoSuficiente) {
        setDialogo({
          visible: true,
          tipo: 'advertencia',
          titulo: 'Monto insuficiente',
          mensaje: `El monto recibido debe ser mayor o igual al total de la venta (${bs(total)}).`,
          textoConfirmar: 'Entendido',
          textoCancelar: null,
          onConfirmar: cerrarDialogo,
        });
        return;
      }
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
        metodoPago: esEfectivo ? 'efectivo' : 'qr',
        montoRecibido: esEfectivo ? montoRecibidoNum : null,
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
      fijarCarrito({});
      setEscaneados([]);
      setBusqueda('');
      setMontoRecibido('');
      cargarProductos();

      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: '¡Venta completada!',
        mensaje: `Ticket #${numeroTicket}\nTotal cobrado: ${bs(
          ventaGuardada.total
        )}${esEfectivo ? `\nCambio: ${bs(ventaGuardada.cambio ?? 0)}` : ''}\n¿Deseas generar el QR para que el cliente descargue su comprobante?`,
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
          onPerfil={() => navigation.navigate('Perfil')}
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
            onIconoDerechaPress={abrirEscaneo}
          />

          <Boton
            titulo="Escanear código de barras"
            icono="barcode-outline"
            variante="suave"
            tamano="sm"
            onPress={abrirEscaneo}
            style={styles.botonEscanear}
          />

          <View style={styles.cabecera}>
            <Text style={styles.tituloSeccion}>Productos disponibles</Text>
            <Text style={styles.contador}>
              {escaneados.length > 0
                ? `${escaneados.length} escaneado${escaneados.length === 1 ? '' : 's'} · ${unidades} en carrito`
                : `${unidades} en el carrito`}
            </Text>
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
              const fueEscaneado = escaneados.includes(producto.id);

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
                    <View style={styles.nombreFila}>
                      <Text style={[styles.nombre, fueEscaneado && styles.nombreEscaneado]} numberOfLines={1}>
                        {producto.nombre}
                      </Text>
                      {fueEscaneado ? (
                        <View style={styles.insigniaEscaneado}>
                          <Ionicons name="barcode-outline" size={10} color="#FFFFFF" />
                          <Text style={styles.textoInsignia}>Escaneado</Text>
                        </View>
                      ) : null}
                    </View>
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

          {esEfectivo ? (
            <View style={styles.cobroEfectivo}>
              <Campo
                etiqueta="Monto recibido (Bs)"
                valor={montoRecibido}
                onChangeText={setMontoRecibido}
                placeholder="0.00"
                icono="cash-outline"
                prefijo="Bs "
                keyboardType="decimal-pad"
                style={styles.campoMonto}
              />
              <View style={styles.cambioFila}>
                <Text style={styles.cambioEtiqueta}>Cambio</Text>
                <Text
                  style={[
                    styles.cambioMonto,
                    montoRecibido.trim() !== '' && !montoSuficiente && styles.cambioFalta,
                  ]}
                >
                  {textoCambio}
                </Text>
              </View>
            </View>
          ) : null}

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
          continuo={escaneoContinuo}
          conteo={conteoEscaneos}
          ultimoEscaneo={ultimoEscaneo}
          usarApi={usarApi}
          onCambiarUsarApi={setUsarApi}
          onCerrar={cerrarEscaneo}
          onTerminar={cerrarEscaneo}
          onRegistrar={(codigo) => registrarCodigo(codigo, ultimoEscaneo?.datosApi)}
          onLeer={encolarCodigo}
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
          descargando={descargandoPdf}
          onDescargarPdf={descargarPdf}
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
    paddingBottom: 250,
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
  nombreFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nombre: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colores.texto,
  },
  nombreEscaneado: {
    color: colores.primarioContenedor,
  },
  insigniaEscaneado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radios.sm,
    backgroundColor: colores.primarioContenedor,
  },
  textoInsignia: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
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
  cobroEfectivo: {
    marginBottom: espacios.md,
    paddingBottom: espacios.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF5',
  },
  campoMonto: {
    marginBottom: 0,
  },
  cambioFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espacios.sm,
  },
  cambioEtiqueta: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  cambioMonto: {
    fontSize: 16,
    fontWeight: '800',
    color: colores.exito,
  },
  cambioFalta: {
    color: colores.error,
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
