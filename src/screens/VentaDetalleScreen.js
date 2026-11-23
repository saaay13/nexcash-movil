import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Boton, Etiqueta, Separador } from '../components/atoms';
import { DialogoConfirmacion } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { bs, colores, espacios, radios, sombras } from '../theme';
import { anularVenta, mensajeError, obtenerVentaPorId } from '../database';
import { useSesion } from '../context';

export default function VentaDetalleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { empresa, empresaId } = useSesion();
  const ventaParam = route.params?.venta;
  const ventaId = route.params?.ventaId || ventaParam?.id;

  const [venta, setVenta] = useState(ventaParam || null);
  const [cargando, setCargando] = useState(!ventaParam?.items);
  const [anulando, setAnulando] = useState(false);

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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dx > 15 && gestureState.dx > Math.abs(gestureState.dy) * 1.2;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 60 && gestureState.vx > 0.2) {
            navigation.goBack();
          }
        },
      }),
    [navigation]
  );

  useEffect(() => {
    async function cargarDetalle() {
      if (!ventaId || !empresaId) {
        setCargando(false);
        return;
      }
      try {
        const data = await obtenerVentaPorId(ventaId, empresaId);
        if (data) {
          setVenta(data);
        }
      } catch (error) {
        console.warn('Error al cargar detalle de venta:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarDetalle();
  }, [ventaId, empresaId]);

  function handleConfirmarAnulacion() {
    const numeroFolio = String(venta?.numero_venta || venta?.numero || venta?.id).padStart(3, '0');
    setDialogo({
      visible: true,
      tipo: 'peligro',
      titulo: '¿Anular venta?',
      mensaje: `¿Deseas anular la venta #${numeroFolio}? Los artículos retornarán al inventario. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Anular venta',
      textoCancelar: 'Cancelar',
      onConfirmar: ejecutarAnulacion,
      onCancelar: cerrarDialogo,
    });
  }

  async function ejecutarAnulacion() {
    if (!empresaId) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Sesión no válida',
        mensaje: 'No hay una empresa activa. Vuelve a seleccionar tu negocio.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
      return;
    }
    try {
      setAnulando(true);
      await anularVenta(venta.id, empresaId);
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Venta anulada',
        mensaje: 'La venta ha sido anulada y la existencia fue devuelta al inventario.',
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: () => {
          cerrarDialogo();
          navigation.goBack();
        },
      });
    } catch (error) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Error',
        mensaje: mensajeError(error, 'No se pudo anular la venta.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setAnulando(false);
    }
  }

  if (cargando && !venta) {
    return (
      <Pantalla titulo="Detalle de venta">
        <View style={styles.vacio}>
          <ActivityIndicator size="large" color={colores.primarioContenedor} />
          <Text style={styles.vacioTexto}>Cargando comprobante...</Text>
        </View>
      </Pantalla>
    );
  }

  if (!venta) {
    return (
      <Pantalla titulo="Detalle de venta">
        <View style={styles.vacio}>
          <Ionicons name="alert-circle-outline" size={36} color={colores.error} />
          <Text style={styles.vacioTexto}>No se encontraron datos de la venta solicitada.</Text>
          <Boton
            titulo="Volver al historial"
            icono="arrow-back-outline"
            variante="secundario"
            onPress={() => navigation.goBack()}
            style={{ marginTop: espacios.md }}
          />
        </View>
      </Pantalla>
    );
  }

  const metodo = (venta.metodo_pago || venta.metodo || 'efectivo').toLowerCase();
  const esQr = metodo === 'qr';
  const numeroFolio = String(venta.numero_venta ?? venta.numero ?? venta.id).padStart(3, '0');
  const itemsLista = venta.items || venta.detalle || [];
  const totalCantidad = itemsLista.reduce((acc, i) => acc + (i.cantidad || 1), 0);

  async function compartirTicket() {
    const lineas = itemsLista
      .map((item) => {
        const nombre = item.nombre_producto || item.nombre || 'Producto';
        const cant = Number(item.cantidad || 1);
        const precio = Number(item.precio_unitario ?? item.precio ?? 0);
        return `${cant} x ${nombre} — ${bs(precio * cant)}`;
      })
      .join('\n');

    const mensaje = [
      `${empresa?.nombre || 'NexCash'} · Ticket #${numeroFolio}`,
      venta.creado_en ? `Fecha: ${venta.creado_en}` : '',
      lineas,
      `TOTAL: ${bs(venta.total)}`,
      `Pago: ${esQr ? 'QR' : 'Efectivo'}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({ message: mensaje });
    } catch (_error) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo compartir',
        mensaje: 'El dispositivo no pudo abrir las opciones para compartir el ticket.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    }
  }

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Pantalla titulo={`Venta #${numeroFolio}`}>
        <View style={styles.ticket}>
          <View style={styles.ticketCabecera}>
            <View style={styles.iconoTicket}>
              <Ionicons name="receipt-outline" size={22} color={colores.primarioContenedor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ticketTitulo}>{empresa?.nombre || 'NexCash'}</Text>
              <Text style={styles.ticketSub}>
                Atendido por {venta.vendedor || 'Usuario'}
              </Text>
            </View>
            <Etiqueta texto="Pagado" variante="exito" punto />
          </View>

          <Separador margenVertical={espacios.md} />

          <View style={styles.fila}>
            <Text style={styles.etiqueta}>Fecha y hora</Text>
            <Text style={styles.valor}>{venta.creado_en || venta.fecha || 'Hoy'}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.etiqueta}>Método de cobro</Text>
            <Etiqueta
              texto={esQr ? 'QR Simple' : 'Efectivo'}
              variante={esQr ? 'pendiente' : 'info'}
            />
          </View>
          <View style={styles.fila}>
            <Text style={styles.etiqueta}>Unidades vendidas</Text>
            <Text style={styles.valor}>{totalCantidad} un.</Text>
          </View>

          <Separador margenVertical={espacios.md} />

          <Text style={styles.seccionTitulo}>Productos del ticket</Text>

          {itemsLista.map((item, index) => {
            const nombre = item.nombre_producto || item.nombre || 'Producto';
            const precio = Number(item.precio_unitario ?? item.precio ?? 0);
            const cant = Number(item.cantidad || 1);
            const subtotal = Number(item.subtotal ?? (precio * cant));

            return (
              <View key={item.id || index} style={styles.productoFila}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productoNombre}>{nombre}</Text>
                  <Text style={styles.productoDetalle}>
                    {cant} x {bs(precio)}
                  </Text>
                </View>
                <Text style={styles.productoSubtotal}>{bs(subtotal)}</Text>
              </View>
            );
          })}

          <Separador margenVertical={espacios.md} />

          {Number(venta.descuento || 0) > 0 ? (
            <View style={styles.fila}>
              <Text style={styles.etiqueta}>Descuento aplicado</Text>
              <Text style={[styles.valor, { color: colores.exito }]}>- {bs(venta.descuento)}</Text>
            </View>
          ) : null}

          <View style={styles.totalFila}>
            <Text style={styles.totalEtiqueta}>TOTAL PAGADO</Text>
            <Text style={styles.totalMonto}>{bs(venta.total)}</Text>
          </View>
        </View>

        <View style={styles.acciones}>
          <Boton
            titulo="Compartir ticket"
            icono="share-outline"
            variante="secundario"
            onPress={compartirTicket}
          />
          <Boton
            titulo={anulando ? 'Anulando...' : 'Anular venta'}
            icono="trash-outline"
            variante="peligro"
            cargando={anulando}
            deshabilitado={anulando}
            onPress={handleConfirmarAnulacion}
          />
          <Boton
            titulo="Volver al historial"
            icono="arrow-back-outline"
            variante="primario"
            onPress={() => navigation.goBack()}
          />
        </View>

        <DialogoConfirmacion
          visible={dialogo.visible}
          tipo={dialogo.tipo}
          titulo={dialogo.titulo}
          mensaje={dialogo.mensaje}
          textoConfirmar={dialogo.textoConfirmar}
          textoCancelar={dialogo.textoCancelar}
          onConfirmar={dialogo.onConfirmar}
          onCancelar={dialogo.onCancelar}
          cargando={anulando}
        />
      </Pantalla>
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xxl,
    padding: espacios.lg,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    ...sombras.tarjeta,
  },
  ticketCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
  },
  iconoTicket: {
    width: 44,
    height: 44,
    borderRadius: radios.lg,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
  },
  ticketSub: {
    fontSize: 12,
    color: colores.textoSuave,
    marginTop: 2,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espacios.sm,
  },
  etiqueta: {
    fontSize: 13,
    color: colores.textoSuave,
  },
  valor: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.texto,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.texto,
    marginBottom: espacios.sm,
  },
  productoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  productoNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.texto,
  },
  productoDetalle: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
  },
  productoSubtotal: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.texto,
  },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: espacios.xs,
  },
  totalEtiqueta: {
    fontSize: 13,
    fontWeight: '800',
    color: colores.texto,
    letterSpacing: 0.5,
  },
  totalMonto: {
    fontSize: 22,
    fontWeight: '800',
    color: colores.primarioContenedor,
  },
  acciones: {
    marginTop: espacios.xl,
    gap: espacios.sm,
    paddingBottom: espacios.xxl,
  },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  vacioTexto: {
    fontSize: 14,
    color: colores.textoSuave,
  },
});
