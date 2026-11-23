import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Boton, Campo } from '../components/atoms';
import { DialogoConfirmacion } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { colores, espacios, radios, sombras } from '../theme';
import {
  mensajeError,
  obtenerMovimientosInventario,
  registrarMovimientoInventario,
  obtenerProductos,
} from '../database';
import { useSesion } from '../context';

export default function MovimientosInventarioScreen() {
  const { empresaId, usuarioId } = useSesion();
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [tipo, setTipo] = useState('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [errorModal, setErrorModal] = useState('');

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

  const cargar = useCallback(async () => {
    if (!empresaId) {
      setMovimientos([]);
      setProductos([]);
      return;
    }
    try {
      const [movs, prods] = await Promise.all([
        obtenerMovimientosInventario(empresaId),
        obtenerProductos({ empresaId }),
      ]);
      setMovimientos(Array.isArray(movs) ? movs : []);
      setProductos(Array.isArray(prods) ? prods : []);
      if (Array.isArray(prods) && prods.length > 0) {
        setProductoSeleccionado((actual) => actual ?? prods[0].id);
      }
    } catch (e) {
      console.warn('Error al cargar movimientos de inventario:', e);
      setMovimientos([]);
      setProductos([]);
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  function abrirModal() {
    setTipo('entrada');
    setCantidad('');
    setMotivo('');
    setErrorModal('');
    if (productos.length > 0 && !productoSeleccionado) {
      setProductoSeleccionado(productos[0].id);
    }
    setModalVisible(true);
  }

  async function guardar() {
    const cantNum = Number(cantidad);
    if (!productoSeleccionado) {
      setErrorModal('Selecciona un producto.');
      return;
    }
    if (!Number.isInteger(cantNum) || cantNum <= 0) {
      setErrorModal('Ingresa una cantidad entera mayor a cero.');
      return;
    }
    if (!empresaId || !usuarioId) {
      setErrorModal('La sesión no es válida. Vuelve a iniciar sesión.');
      return;
    }

    try {
      await registrarMovimientoInventario({
        empresaId,
        productoId: productoSeleccionado,
        usuarioId,
        tipo,
        cantidad: cantNum,
        motivo: motivo.trim() || `Registro manual de ${tipo}`,
      });

      setModalVisible(false);
      await cargar();
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Movimiento registrado',
        mensaje: `Se ha registrado el movimiento de ${tipo} y la existencia fue actualizada correctamente.`,
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } catch (e) {
      setErrorModal(mensajeError(e, 'Error al registrar el movimiento.'));
    }
  }

  return (
    <Pantalla titulo="Kardex de Inventario">
      <View style={styles.cabeceraFila}>
        <View style={{ flex: 1 }}>
          <Text style={styles.conteoTexto}>
            {movimientos.length} movimiento(s) registrado(s)
          </Text>
        </View>
        <Boton
          titulo="Ajustar existencia"
          icono="add-circle-outline"
          tamano="sm"
          variante="acento"
          onPress={abrirModal}
        />
      </View>

      {movimientos.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="swap-horizontal-outline" size={38} color={colores.contorno} />
          <Text style={styles.vacioTitulo}>Sin movimientos</Text>
          <Text style={styles.vacioTexto}>
            Los ingresos por compras, mermas o ajustes de existencia quedarán registrados aquí.
          </Text>
        </View>
      ) : (
        movimientos.map((m) => {
          const esEntrada = m.tipo === 'entrada';
          const esSalida = m.tipo === 'salida' || m.tipo === 'venta';
          const signo = esEntrada ? '+' : esSalida ? '-' : '⇄';
          const colorTipo = esEntrada ? '#16A34A' : esSalida ? '#DC2626' : '#0284C7';
          const fondoTipo = esEntrada ? '#DCFCE7' : esSalida ? '#FEE2E2' : '#E0F2FE';

          return (
            <View key={m.id} style={styles.tarjeta}>
              <View style={[styles.iconoCaja, { backgroundColor: fondoTipo }]}>
                <Ionicons
                  name={esEntrada ? 'arrow-down' : esSalida ? 'arrow-up' : 'repeat'}
                  size={20}
                  color={colorTipo}
                />
              </View>

              <View style={styles.info}>
                <View style={styles.topFila}>
                  <Text style={styles.nombre} numberOfLines={1}>
                    {m.nombre_producto}
                  </Text>
                  <Text style={[styles.cantidadTexto, { color: colorTipo }]}>
                    {signo} {m.cantidad} un.
                  </Text>
                </View>

                <Text style={styles.motivo} numberOfLines={1}>
                  {m.motivo || 'Movimiento de inventario'}
                </Text>

                <View style={styles.pieFila}>
                  <Text style={styles.stockCambio}>
                    Existencia: {m.stock_anterior} → {m.stock_nuevo}
                  </Text>
                  <Text style={styles.fecha}>{m.creado_en}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <View style={styles.modalCabecera}>
              <View style={styles.modalTituloFila}>
                <Ionicons name="swap-horizontal" size={22} color={colores.primarioContenedor} />
                <Text style={styles.modalTitulo}>Registrar movimiento</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colores.contorno} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Actualiza el inventario físico con una entrada por compra o salida por merma/ajuste.
            </Text>

            <View style={styles.tipoFila}>
              {[
                { id: 'entrada', label: 'Entrada (+)', icon: 'arrow-down' },
                { id: 'salida', label: 'Salida (-)', icon: 'arrow-up' },
                { id: 'ajuste', label: 'Ajuste (=)', icon: 'repeat' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.botonTipo, tipo === t.id && styles.botonTipoActivo]}
                  onPress={() => setTipo(t.id)}
                >
                  <Ionicons
                    name={t.icon}
                    size={16}
                    color={tipo === t.id ? '#FFFFFF' : colores.textoSuave}
                  />
                  <Text
                    style={[styles.botonTipoTexto, tipo === t.id && styles.botonTipoTextoActivo]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.etiquetaCampo}>Seleccionar producto *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollProductos}
            >
              {productos.map((p) => {
                const activo = productoSeleccionado === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chipProd, activo && styles.chipProdActivo]}
                    onPress={() => setProductoSeleccionado(p.id)}
                  >
                    <Text style={[styles.chipProdTexto, activo && styles.chipProdTextoActivo]}>
                      {p.nombre}
                    </Text>
                    <Text style={[styles.chipProdStock, activo && { color: '#E0EDFF' }]}>
                      (Existencia: {p.stock ?? 0})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Campo
              etiqueta="Cantidad de unidades *"
              valor={cantidad}
              onChangeText={(c) => {
                setCantidad(c);
                if (errorModal) setErrorModal('');
              }}
              placeholder="Ej. 10"
              icono="layers-outline"
              keyboardType="number-pad"
            />

            <Campo
              etiqueta="Motivo / Justificación"
              valor={motivo}
              onChangeText={setMotivo}
              placeholder="Ej. Compra proveedor, producto vencido..."
              icono="document-text-outline"
            />

            {errorModal ? (
              <View style={styles.errorCaja}>
                <Ionicons name="alert-circle" size={16} color={colores.error} />
                <Text style={styles.errorTexto}>{errorModal}</Text>
              </View>
            ) : null}

            <View style={styles.modalBotones}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                style={{ flex: 1 }}
                onPress={() => setModalVisible(false)}
              />
              <Boton
                titulo="Confirmar"
                variante="acento"
                style={{ flex: 1 }}
                onPress={guardar}
              />
            </View>
          </View>
        </View>
      </Modal>

      <DialogoConfirmacion
        visible={dialogo.visible}
        tipo={dialogo.tipo}
        titulo={dialogo.titulo}
        mensaje={dialogo.mensaje}
        textoConfirmar={dialogo.textoConfirmar}
        textoCancelar={dialogo.textoCancelar}
        onConfirmar={dialogo.onConfirmar}
        onCancelar={dialogo.onCancelar}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cabeceraFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacios.md,
  },
  conteoTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  tarjeta: {
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
  iconoCaja: {
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
  topFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  nombre: {
    fontSize: 14,
    fontWeight: '800',
    color: colores.texto,
    flex: 1,
  },
  cantidadTexto: {
    fontSize: 14,
    fontWeight: '900',
  },
  motivo: {
    fontSize: 12,
    color: colores.textoSuave,
    marginTop: 2,
  },
  pieFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stockCambio: {
    fontSize: 11,
    fontWeight: '700',
    color: colores.primarioContenedor,
  },
  fecha: {
    fontSize: 10,
    color: colores.contorno,
  },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  vacioTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
  },
  vacioTexto: {
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: 'center',
    maxWidth: 250,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContenido: {
    backgroundColor: colores.superficie,
    borderTopLeftRadius: radios.xxl,
    borderTopRightRadius: radios.xxl,
    padding: espacios.xl,
    paddingBottom: 36,
    ...sombras.modal,
  },
  modalCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espacios.xs,
  },
  modalTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: colores.texto,
  },
  modalSub: {
    fontSize: 12,
    color: colores.textoSuave,
    marginBottom: espacios.md,
    lineHeight: 17,
  },
  tipoFila: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: espacios.md,
  },
  botonTipo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radios.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  botonTipoActivo: {
    backgroundColor: colores.primarioContenedor,
    borderColor: colores.primarioContenedor,
  },
  botonTipoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  botonTipoTextoActivo: {
    color: '#FFFFFF',
  },
  etiquetaCampo: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.texto,
    marginBottom: 6,
  },
  scrollProductos: {
    gap: 6,
    paddingBottom: espacios.md,
  },
  chipProd: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipProdActivo: {
    backgroundColor: colores.primarioContenedor,
    borderColor: colores.primarioContenedor,
  },
  chipProdTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.texto,
  },
  chipProdTextoActivo: {
    color: '#FFFFFF',
  },
  chipProdStock: {
    fontSize: 10,
    color: colores.textoSuave,
    marginTop: 2,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: espacios.sm,
    marginTop: espacios.md,
  },
  errorCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colores.errorFondo,
    borderRadius: radios.md,
    padding: espacios.sm,
    marginTop: espacios.xs,
  },
  errorTexto: {
    fontSize: 12,
    color: colores.errorTexto,
    fontWeight: '600',
  },
});
