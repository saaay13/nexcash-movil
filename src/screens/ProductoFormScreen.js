import React, { useCallback, useState } from 'react';
import {
  Image,
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
  cambiarEstadoProducto,
  modificarProducto,
  mensajeError,
  obtenerCategorias,
} from '../database';
import { useSesion } from '../context';
import { consultarProductoPorCodigo, elegirImagen } from '../services';

export default function ProductoFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { empresaId } = useSesion();
  const producto = route.params?.producto;
  const datosApi = route.params?.datosApi ?? null;
  const codigoInicial = route.params?.codigoBarras ?? '';
  const categoriaInicial = datosApi?.categoria ?? route.params?.categoria ?? '';

  const [nombre, setNombre] = useState(producto?.nombre ?? datosApi?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(
    producto?.descripcion ?? datosApi?.descripcion ?? ''
  );
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
  const [stockMinimo, setStockMinimo] = useState(
    producto ? String(producto.stock_minimo ?? 5) : '5'
  );
  const [imagen, setImagen] = useState(producto?.imagen ?? datosApi?.imagen ?? null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [escaneoVisible, setEscaneoVisible] = useState(false);
  const [usarApi, setUsarApi] = useState(false);

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

  const estadoProducto =
    producto?.estado ?? (Number(producto?.activo) === 0 ? 'inactivo' : 'activo');
  const estaInactivo = estadoProducto === 'inactivo';
  const estaEliminado = estadoProducto === 'eliminado';

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

  async function elegirFotoProducto() {
    if (cargando || cargandoFoto) return;

    setCargandoFoto(true);
    try {
      const uri = await elegirImagen({ prefijo: 'producto' });
      if (uri) setImagen(uri);
    } catch (e) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo guardar la foto',
        mensaje: mensajeError(e, 'Intenta nuevamente.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setCargandoFoto(false);
    }
  }

  function pedirQuitarFoto() {
    setDialogo({
      visible: true,
      tipo: 'advertencia',
      titulo: '¿Quitar la foto?',
      mensaje: 'La foto se quitará cuando guardes los cambios del producto.',
      textoConfirmar: 'Quitar foto',
      textoCancelar: 'Cancelar',
      onConfirmar: () => {
        cerrarDialogo();
        setImagen(null);
      },
      onCancelar: cerrarDialogo,
    });
  }

  async function guardar() {
    const precioNum = Number(String(precio).replace(',', '.'));
    const stockNum = Number(stock);
    const minimoNum = stockMinimo.trim() === '' ? 5 : Number(stockMinimo);

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
    if (!Number.isInteger(minimoNum) || minimoNum < 0) {
      setError('El mínimo de alerta debe ser un número entero mayor o igual a cero.');
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
        descripcion: descripcion.trim(),
        categoria: categoriaActiva.nombre,
        categoriaId: Number(categoriaActiva.id),
        sku: sku.trim() || null,
        precio: precioNum,
        stock: stockNum,
        stockMinimo: minimoNum,
        imagen,
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

  function confirmarCambioEstado() {
    setDialogo({
      visible: true,
      tipo: estaInactivo ? 'exito' : 'peligro',
      titulo: estaInactivo ? '¿Habilitar producto?' : '¿Deshabilitar producto?',
      mensaje: estaInactivo
        ? `"${nombre}" volverá a estar disponible para la venta.`
        : `"${nombre}" dejará de estar disponible para la venta. Podrás habilitarlo nuevamente cuando quieras.`,
      textoConfirmar: estaInactivo ? 'Habilitar' : 'Deshabilitar',
      textoCancelar: 'Cancelar',
      onConfirmar: ejecutarCambioEstado,
      onCancelar: cerrarDialogo,
    });
  }

  async function ejecutarCambioEstado() {
    try {
      setCargando(true);
      await cambiarEstadoProducto(
        producto.id,
        estaInactivo ? 'activo' : 'inactivo',
        empresaId
      );
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: estaInactivo ? 'Producto habilitado' : 'Producto deshabilitado',
        mensaje: estaInactivo
          ? 'El producto ya está disponible para la venta.'
          : 'El producto ya no aparecerá para vender, pero seguirá en tu catálogo.',
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
        titulo: 'No se pudo cambiar el estado',
        mensaje: mensajeError(err, 'No se pudo actualizar el producto.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setCargando(false);
    }
  }

  function confirmarEliminacion() {
    setDialogo({
      visible: true,
      tipo: 'peligro',
      titulo: '¿Eliminar producto?',
      mensaje: `"${nombre}" dejará de aparecer en el catálogo. Podrás reactivarlo desde Configuración → Productos eliminados.`,
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      onConfirmar: ejecutarEliminacion,
      onCancelar: cerrarDialogo,
    });
  }

  async function ejecutarEliminacion() {
    try {
      setCargando(true);
      await cambiarEstadoProducto(producto.id, 'eliminado', empresaId);
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Producto eliminado',
        mensaje: 'El producto ya no aparece en el catálogo. Puedes reactivarlo desde Configuración.',
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: () => {
          cerrarDialogo();
          navigation.goBack();
        },
        onCancelar: null,
      });
    } catch (err) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo eliminar',
        mensaje: mensajeError(err, 'No se pudo actualizar el producto.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
        onCancelar: null,
      });
    } finally {
      setCargando(false);
    }
  }

  function confirmarReactivacion() {
    setDialogo({
      visible: true,
      tipo: 'exito',
      titulo: '¿Reactivar producto?',
      mensaje: `"${nombre}" volverá a estar disponible para la venta.`,
      textoConfirmar: 'Reactivar',
      textoCancelar: 'Cancelar',
      onConfirmar: ejecutarReactivacion,
      onCancelar: cerrarDialogo,
    });
  }

  async function ejecutarReactivacion() {
    try {
      setCargando(true);
      await cambiarEstadoProducto(producto.id, 'activo', empresaId);
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Producto reactivado',
        mensaje: 'El producto ya está disponible para la venta.',
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: () => {
          cerrarDialogo();
          navigation.goBack();
        },
        onCancelar: null,
      });
    } catch (err) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo reactivar',
        mensaje: mensajeError(err, 'No se pudo actualizar el producto.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
        onCancelar: null,
      });
    } finally {
      setCargando(false);
    }
  }

  async function procesarLectura(codigo, conApi) {
    setSku(codigo);
    setEscaneoVisible(false);

    if (!conApi) return;

    try {
      const datos = await consultarProductoPorCodigo(codigo);
      if (!datos) {
        setDialogo({
          visible: true,
          tipo: 'info',
          titulo: 'Sin datos en la API',
          mensaje:
            'Open Food Facts no tiene información para este código. Completa los campos manualmente.',
          textoConfirmar: 'Entendido',
          textoCancelar: null,
          onConfirmar: cerrarDialogo,
        });
        return;
      }

      setNombre((actual) => actual || datos.nombre);
      setDescripcion((actual) => actual || datos.descripcion);
      setCategoria((actual) => actual || datos.categoria);
      setImagen((actual) => actual || datos.imagen || null);
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Datos obtenidos de la API',
        mensaje: datos.imagen
          ? 'Se completaron nombre, descripción, categoría y foto sugerida. Verifica la información y agrega precio, existencia y tu categoría.'
          : 'Se completaron nombre, descripción y categoría sugerida. La API no incluyó foto; puedes agregarla manualmente. Verifica la información y agrega precio, existencia y tu categoría.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } catch (e) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo consultar la API',
        mensaje: mensajeError(e, 'Completa los campos manualmente.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
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
            {datosApi && !producto
              ? 'Datos sugeridos por Open Food Facts. Revisa la categoría y agrega precio y existencia.'
              : producto
                ? 'Edita los datos y guarda los cambios.'
                : 'Registra nombre, precio y existencia para venderlo.'}
          </Text>
        </View>
      </View>

      {estaEliminado ? (
        <View style={styles.avisoEliminado}>
          <Ionicons name="trash-outline" size={18} color="#B45309" />
          <Text style={styles.avisoEliminadoTexto}>
            Este producto está eliminado: no aparece en el catálogo ni se puede vender.
            Reactívalo para volver a usarlo.
          </Text>
        </View>
      ) : null}

      <View style={styles.fotoBloque}>
        <Text style={styles.categoriaEtiqueta}>Foto del producto (opcional)</Text>
        <Pressable
          style={styles.fotoBoton}
          onPress={elegirFotoProducto}
          disabled={cargando || cargandoFoto}
          accessibilityLabel={imagen ? 'Cambiar foto del producto' : 'Agregar foto del producto'}
        >
          {imagen ? (
            <Image source={{ uri: imagen }} style={styles.fotoImagen} />
          ) : (
            <Ionicons name="camera-outline" size={24} color={colores.primarioContenedor} />
          )}
          <View style={styles.fotoAccion}>
            <Ionicons name="camera-outline" size={13} color="#FFFFFF" />
          </View>
        </Pressable>
        <Text style={styles.fotoAyuda}>
          {cargandoFoto
            ? 'Guardando foto...'
            : imagen
              ? 'Toca la foto para elegir otra.'
              : 'Agrega una foto para identificarlo más rápido.'}
        </Text>
        {imagen ? (
          <Boton
            titulo="Quitar foto"
            icono="trash-outline"
            variante="peligro"
            tamano="sm"
            onPress={pedirQuitarFoto}
            style={styles.botonQuitarFoto}
          />
        ) : null}
      </View>

      <Campo
        etiqueta="Nombre del producto *"
        valor={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Cuaderno A4 100 hojas"
        icono="pricetag-outline"
      />

      <Campo
        etiqueta="Descripción"
        valor={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej. Tamaño A4, 100 hojas, empaque de 10 unidades"
        icono="document-text-outline"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
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
        etiqueta="Código o SKU (opcional)"
        valor={sku}
        onChangeText={setSku}
        placeholder="SKU-1000"
        sufijo="barcode-outline"
        onSufijoPress={() => setEscaneoVisible(true)}
        autoCapitalize="characters"
      />
      <Text style={styles.ayudaSku}>
        Déjalo vacío si el producto no tiene código de barras.
      </Text>

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

      <Campo
        etiqueta="Mínimo para alerta (unidades)"
        valor={stockMinimo}
        onChangeText={setStockMinimo}
        placeholder="5"
        icono="alert-circle-outline"
        keyboardType="number-pad"
      />
      <Text style={styles.ayudaMinimo}>
        Cuando la existencia llegue a este número, el producto se marca como crítico.
      </Text>

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
        <View style={styles.accionesEstado}>
          {estaEliminado ? (
            <Boton
              titulo={cargando ? 'Reactivando...' : 'Reactivar producto'}
              icono="refresh-outline"
              variante="acento"
              deshabilitado={cargando}
              onPress={confirmarReactivacion}
            />
          ) : (
            <>
              <Boton
                titulo={
                  estaInactivo
                    ? 'Habilitar producto'
                    : cargando
                      ? 'Deshabilitando...'
                      : 'Deshabilitar producto'
                }
                icono={estaInactivo ? 'eye-outline' : 'eye-off-outline'}
                variante={estaInactivo ? 'tonal' : 'peligro'}
                deshabilitado={cargando}
                onPress={confirmarCambioEstado}
              />

              <Boton
                titulo="Eliminar producto"
                icono="trash-outline"
                variante="peligro"
                deshabilitado={cargando}
                onPress={confirmarEliminacion}
                style={styles.botonEliminar}
              />
            </>
          )}
        </View>
      ) : null}

      <Text style={styles.pieAviso}>
        Los datos se guardan de forma local y segura en este dispositivo.
      </Text>

      <EscaneadorCodigo
        visible={escaneoVisible}
        usarApi={usarApi}
        onCambiarUsarApi={setUsarApi}
        onCerrar={() => setEscaneoVisible(false)}
        onLeer={procesarLectura}
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
  avisoEliminado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacios.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: radios.lg,
    padding: espacios.md,
    marginBottom: espacios.lg,
  },
  avisoEliminadoTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#92400E',
  },
  accionesEstado: {
    marginTop: espacios.md,
    gap: espacios.sm,
  },
  botonEliminar: {
    marginTop: 0,
  },
  fotoBloque: {
    marginBottom: espacios.md,
  },
  fotoBoton: {
    width: 92,
    height: 92,
    borderRadius: radios.xl,
    borderWidth: 1.5,
    borderColor: colores.contornoSuave,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  fotoImagen: {
    width: '100%',
    height: '100%',
  },
  fotoAccion: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.terciario,
    borderWidth: 2,
    borderColor: colores.superficie,
  },
  fotoAyuda: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 6,
    marginLeft: 2,
  },
  botonQuitarFoto: {
    alignSelf: 'flex-start',
    marginTop: espacios.sm,
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
  ayudaMinimo: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: -espacios.sm,
    marginBottom: espacios.md,
    marginLeft: 4,
  },
  ayudaSku: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: -espacios.sm,
    marginBottom: espacios.md,
    marginLeft: 4,
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
