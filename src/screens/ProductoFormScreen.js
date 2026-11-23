import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Boton, Campo } from '../components/atoms';
import { DialogoConfirmacion, EscaneadorCodigo } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { colores, espacios, radios } from '../theme';
import {
  agregarProducto,
  modificarProducto,
  eliminarProducto,
  mensajeError,
  obtenerCategorias,
} from '../database';
import { useSesion } from '../context';

export default function ProductoFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { empresaId } = useSesion();
  const producto = route.params?.producto;
  const codigoInicial = route.params?.codigoBarras ?? '';
  const categoriaInicial = route.params?.categoria ?? '';

  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [categoria, setCategoria] = useState(producto?.categoria ?? categoriaInicial);
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id ?? null);
  const [categorias, setCategorias] = useState([]);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [sku, setSku] = useState(
    producto?.sku ?? producto?.codigo_barras ?? codigoInicial ?? ''
  );
  const [precio, setPrecio] = useState(
    producto ? String(producto.precio ?? producto.precio_venta ?? '') : ''
  );
  const [stock, setStock] = useState(
    producto ? String(producto.stock ?? producto.stock_actual ?? '') : ''
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [escaneoVisible, setEscaneoVisible] = useState(false);

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

  const cargarCategorias = useCallback(async () => {
    if (!empresaId) {
      setCategorias([]);
      return;
    }
    try {
      const lista = await obtenerCategorias(empresaId);
      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (e) {
      console.warn('No se pudieron cargar las categorías:', e?.message);
      setCategorias([]);
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
    }, [cargarCategorias])
  );

  const categoriaActiva =
    categorias.find((cat) => cat.id === categoriaId) ??
    categorias.find(
      (cat) =>
        cat.nombre.trim().toLowerCase() === String(categoria ?? '').trim().toLowerCase()
    );

  function seleccionarCategoria(cat) {
    setCategoriaId(cat.id);
    setCategoria(cat.nombre);
    setSelectorVisible(false);
  }

  async function guardar() {
    const precioNum = Number(String(precio).replace(',', '.'));
    const stockNum = Number(stock);

    if (!nombre.trim() || !precio.trim() || !stock.trim()) {
      setError('El nombre, el precio y la existencia son obligatorios.');
      return;
    }
    if (!categoriaActiva) {
      setError('Selecciona una categoría para el producto.');
      return;
    }
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      setError('El precio debe ser un número mayor a cero.');
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setError('La existencia debe ser un número entero mayor o igual a cero.');
      return;
    }
    if (!empresaId) {
      setError('No hay una empresa activa. Vuelve a seleccionar tu negocio.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      const datosProducto = {
        nombre: nombre.trim(),
        categoria: categoriaActiva.nombre,
        categoriaId: Number(categoriaActiva.id),
        sku: sku.trim() || null,
        precio: precioNum,
        stock: stockNum,
      };

      if (producto?.id) {
        await modificarProducto(producto.id, datosProducto, empresaId);
        setDialogo({
          visible: true,
          tipo: 'exito',
          titulo: '¡Cambios guardados!',
          mensaje: 'El producto ha sido actualizado exitosamente.',
          textoConfirmar: 'Aceptar',
          textoCancelar: null,
          onConfirmar: () => {
            cerrarDialogo();
            navigation.goBack();
          },
        });
      } else {
        await agregarProducto({ ...datosProducto, empresaId });
        setDialogo({
          visible: true,
          tipo: 'exito',
          titulo: '¡Producto registrado!',
          mensaje: 'El nuevo producto se ha añadido a tu inventario.',
          textoConfirmar: 'Aceptar',
          textoCancelar: null,
          onConfirmar: () => {
            cerrarDialogo();
            navigation.goBack();
          },
        });
      }
    } catch (e) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo guardar',
        mensaje: mensajeError(e, 'Ocurrió un inconveniente al procesar la solicitud.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setCargando(false);
    }
  }

  function confirmarEliminar() {
    setDialogo({
      visible: true,
      tipo: 'peligro',
      titulo: '¿Eliminar producto?',
      mensaje: `¿Estás seguro de que deseas quitar "${nombre}" del catálogo? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      onConfirmar: ejecutarEliminar,
      onCancelar: cerrarDialogo,
    });
  }

  async function ejecutarEliminar() {
    try {
      setCargando(true);
      await eliminarProducto(producto.id, empresaId);
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Producto eliminado',
        mensaje: 'El producto fue retirado de tu catálogo correctamente.',
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: () => {
          cerrarDialogo();
          navigation.goBack();
        },
      });
    } catch (err) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Error al eliminar',
        mensaje: mensajeError(err, 'No se pudo eliminar el producto.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setCargando(false);
    }
  }

  return (
    <Pantalla titulo={producto ? 'Editar producto' : 'Nuevo producto'}>
      <View style={styles.resumen}>
        <View style={styles.iconoCaja}>
          <Ionicons
            name={producto ? 'create-outline' : 'cube-outline'}
            size={24}
            color={colores.primarioContenedor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.resumenTitulo}>
            {producto ? producto.nombre : 'Producto del catálogo'}
          </Text>
          <Text style={styles.resumenTexto}>
            {producto
              ? 'Edita los datos y guarda los cambios.'
              : 'Registra nombre, precio y existencia para venderlo.'}
          </Text>
        </View>
      </View>

      <Campo
        etiqueta="Nombre del producto *"
        valor={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Arroz Grano de Oro 1kg"
        icono="pricetag-outline"
      />

      <View style={styles.categoriaBloque}>
        <Text style={styles.categoriaEtiqueta}>Categoría *</Text>
        <Pressable
          style={styles.selectorCategoria}
          onPress={() => setSelectorVisible(true)}
        >
          <Ionicons
            name="folder-outline"
            size={18}
            color={colores.primarioContenedor}
          />
          <Text
            style={[
              styles.selectorTexto,
              !categoria ? styles.selectorPlaceholder : null,
            ]}
          >
            {categoria || 'Selecciona una categoría'}
          </Text>
          <Ionicons
            name="chevron-down-outline"
            size={18}
            color={colores.textoSuave}
          />
        </Pressable>
        {categorias.length === 0 ? (
          <Text style={styles.categoriaAviso}>
            Aún no tienes categorías. Crea una antes de registrar productos.
          </Text>
        ) : null}
      </View>

      <Campo
        etiqueta="Código o SKU"
        valor={sku}
        onChangeText={setSku}
        placeholder="ARR-1000"
        sufijo="barcode-outline"
        onSufijoPress={() => setEscaneoVisible(true)}
        autoCapitalize="characters"
      />

      <Boton
        titulo="Escanear código de barras"
        icono="barcode-outline"
        variante="suave"
        tamano="sm"
        onPress={() => setEscaneoVisible(true)}
        style={styles.botonEscanear}
      />

      <Campo
        etiqueta="Precio de venta (Bs) *"
        valor={precio}
        onChangeText={setPrecio}
        placeholder="0.00"
        icono="cash-outline"
        prefijo="Bs "
        keyboardType="numeric"
      />

      <Campo
        etiqueta="Existencia actual (unidades) *"
        valor={stock}
        onChangeText={setStock}
        placeholder="0"
        icono="layers-outline"
        keyboardType="number-pad"
      />

      {error ? (
        <View style={styles.errorCaja}>
          <Ionicons name="alert-circle-outline" size={18} color={colores.error} />
          <Text style={styles.errorTexto}>{error}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: espacios.lg }}>
        <Boton
          titulo={cargando ? 'Guardando...' : producto ? 'Guardar cambios' : 'Registrar producto'}
          icono="save-outline"
          variante="acento"
          deshabilitado={cargando}
          onPress={guardar}
        />
      </View>

      {producto?.id ? (
        <View style={{ marginTop: espacios.md }}>
          <Boton
            titulo={cargando ? 'Eliminando...' : 'Eliminar producto'}
            icono="trash-outline"
            variante="peligro"
            deshabilitado={cargando}
            onPress={confirmarEliminar}
          />
        </View>
      ) : null}

      <Text style={styles.pieAviso}>
        Los datos se guardan de forma local y segura en este dispositivo.
      </Text>

      <EscaneadorCodigo
        visible={escaneoVisible}
        onCerrar={() => setEscaneoVisible(false)}
        onLeer={(codigo) => {
          setSku(codigo);
          setEscaneoVisible(false);
        }}
      />

      <Modal
        transparent
        visible={selectorVisible}
        animationType="fade"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.fondoModal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectorVisible(false)}
          />

          <View style={styles.tarjetaModal}>
            <Text style={styles.modalTitulo}>Seleccionar categoría</Text>
            <Text style={styles.modalSubtitulo}>
              Elige una de las categorías que registraste para tu negocio.
            </Text>

            <ScrollView style={styles.listaCategorias}>
              {categorias.length === 0 ? (
                <View style={styles.sinCategorias}>
                  <Ionicons
                    name="folder-open-outline"
                    size={32}
                    color={colores.contorno}
                  />
                  <Text style={styles.sinCategoriasTitulo}>
                    Todavía no hay categorías
                  </Text>
                  <Text style={styles.sinCategoriasTexto}>
                    Crea una categoría para poder asignarla a tus productos.
                  </Text>
                </View>
              ) : (
                categorias.map((cat) => {
                  const activa = cat.id === categoriaActiva?.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.opcion, activa && styles.opcionActiva]}
                      onPress={() => seleccionarCategoria(cat)}
                    >
                      <Ionicons
                        name={activa ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={activa ? colores.primarioContenedor : colores.contorno}
                      />
                      <View style={styles.opcionTextos}>
                        <Text
                          style={[styles.opcionNombre, activa && styles.opcionNombreActiva]}
                        >
                          {cat.nombre}
                        </Text>
                        {cat.descripcion ? (
                          <Text style={styles.opcionDescripcion} numberOfLines={1}>
                            {cat.descripcion}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.opcionConteo}>{cat.total_productos ?? 0}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <Boton
              titulo="Crear nueva categoría"
              icono="add"
              variante="tonal"
              tamano="sm"
              onPress={() => {
                setSelectorVisible(false);
                navigation.navigate('Categorias');
              }}
              style={styles.botonNuevaCategoria}
            />

            <Boton
              titulo="Cerrar"
              variante="suave"
              tamano="md"
              onPress={() => setSelectorVisible(false)}
            />
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
        cargando={cargando}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  resumen: {
    flexDirection: 'row',
    gap: espacios.md,
    alignItems: 'center',
    backgroundColor: colores.superficieBaja,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.lg,
  },
  iconoCaja: {
    width: 48,
    height: 48,
    borderRadius: radios.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumenTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.texto,
  },
  resumenTexto: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
  },
  categoriaBloque: {
    marginBottom: espacios.md,
  },
  categoriaEtiqueta: {
    fontSize: 12,
    fontWeight: '600',
    color: colores.textoSuave,
    marginBottom: 6,
    marginLeft: 2,
  },
  selectorCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    minHeight: 50,
    paddingHorizontal: espacios.md,
    borderRadius: radios.lg,
    borderWidth: 1.5,
    borderColor: colores.contornoSuave,
    backgroundColor: colores.superficie,
  },
  selectorTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colores.texto,
  },
  selectorPlaceholder: {
    color: colores.contorno,
    fontWeight: '400',
  },
  categoriaAviso: {
    fontSize: 11,
    color: colores.errorTexto,
    marginTop: 6,
    marginLeft: 4,
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacios.lg,
  },
  tarjetaModal: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: colores.superficie,
    borderRadius: radios.xxl,
    padding: espacios.xl,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: colores.texto,
  },
  modalSubtitulo: {
    fontSize: 12,
    color: colores.textoSuave,
    marginTop: 4,
    marginBottom: espacios.md,
  },
  listaCategorias: {
    maxHeight: 320,
  },
  sinCategorias: {
    alignItems: 'center',
    paddingVertical: espacios.xl,
  },
  sinCategoriasTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.texto,
    marginTop: espacios.sm,
  },
  sinCategoriasTexto: {
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: 4,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingVertical: espacios.md,
    paddingHorizontal: espacios.sm,
    borderRadius: radios.lg,
    borderBottomWidth: 1,
    borderBottomColor: colores.contornoSuave,
  },
  opcionActiva: {
    backgroundColor: colores.superficieBaja,
  },
  opcionTextos: {
    flex: 1,
  },
  opcionNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colores.texto,
  },
  opcionNombreActiva: {
    color: colores.primarioContenedor,
    fontWeight: '800',
  },
  opcionDescripcion: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
  },
  opcionConteo: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  botonNuevaCategoria: {
    marginTop: espacios.md,
    marginBottom: espacios.sm,
  },
  botonEscanear: {
    alignSelf: 'flex-start',
    marginTop: -espacios.sm,
    marginBottom: espacios.md,
  },
  errorCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    backgroundColor: colores.errorFondo,
    borderRadius: radios.md,
    padding: espacios.md,
    marginTop: espacios.sm,
  },
  errorTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colores.errorTexto,
  },
  pieAviso: {
    fontSize: 11,
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: espacios.xl,
  },
});
