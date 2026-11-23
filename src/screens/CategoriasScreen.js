import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Boton, Campo, Etiqueta } from '../components/atoms';
import { Buscador, DialogoConfirmacion } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { colores, espacios, radios, sombras } from '../theme';
import {
  mensajeError,
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from '../database';
import { useSesion } from '../context';

export default function CategoriasScreen() {
  const { empresaId } = useSesion();
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
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
      setCategorias([]);
      return;
    }
    try {
      const lista = await obtenerCategorias(empresaId);
      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (e) {
      console.warn('Error al cargar categorías:', e);
      setCategorias([]);
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  function abrirCrear() {
    setCategoriaEditando(null);
    setNombre('');
    setDescripcion('');
    setErrorModal('');
    setModalVisible(true);
  }

  function abrirEditar(cat) {
    setCategoriaEditando(cat);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || '');
    setErrorModal('');
    setModalVisible(true);
  }

  async function guardar() {
    if (!nombre.trim()) {
      setErrorModal('El nombre de la categoría es obligatorio.');
      return;
    }
    if (!empresaId) {
      setErrorModal('No hay una empresa activa. Vuelve a seleccionar tu negocio.');
      return;
    }

    try {
      if (categoriaEditando) {
        await actualizarCategoria(
          categoriaEditando.id,
          {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
          },
          empresaId
        );
      } else {
        await crearCategoria({
          empresaId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
        });
      }

      setModalVisible(false);
      await cargar();

      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: categoriaEditando ? '¡Categoría actualizada!' : '¡Categoría creada!',
        mensaje: categoriaEditando
          ? 'Los cambios se han guardado con éxito.'
          : 'La nueva categoría está lista para organizar tus productos.',
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } catch (e) {
      setErrorModal(mensajeError(e, 'Error al guardar la categoría.'));
    }
  }

  function confirmarEliminar(cat) {
    setDialogo({
      visible: true,
      tipo: 'peligro',
      titulo: '¿Eliminar categoría?',
      mensaje:
        cat.total_productos > 0
          ? `La categoría "${cat.nombre}" tiene ${cat.total_productos} producto(s) asignado(s). ¿Deseas eliminarla igualmente?`
          : `¿Deseas eliminar "${cat.nombre}"? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      onConfirmar: () => ejecutarEliminar(cat.id),
      onCancelar: cerrarDialogo,
    });
  }

  async function ejecutarEliminar(id) {
    try {
      await eliminarCategoria(id, empresaId);
      await cargar();
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Categoría eliminada',
        mensaje: 'La categoría ha sido removida satisfactoriamente.',
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } catch (err) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo eliminar',
        mensaje: mensajeError(err, 'Ocurrió un error al intentar eliminar la categoría.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    }
  }

  const filtradas = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <Pantalla titulo="Gestión de Categorías">
      <View style={styles.cabeceraFila}>
        <Buscador
          valor={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar categoría..."
          style={{ flex: 1 }}
        />
        <Boton
          titulo="Nueva"
          icono="add"
          tamano="sm"
          variante="acento"
          onPress={abrirCrear}
        />
      </View>

      <View style={styles.conteoFila}>
        <Text style={styles.conteoTexto}>
          {filtradas.length} categoría{filtradas.length === 1 ? '' : 's'} disponible(s)
        </Text>
      </View>

      {filtradas.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="pricetags-outline" size={36} color={colores.contorno} />
          <Text style={styles.vacioTitulo}>Sin categorías</Text>
          <Text style={styles.vacioTexto}>
            {busqueda
              ? 'No coincide ninguna categoría con la búsqueda.'
              : 'Presiona "Nueva" para crear la primera categoría.'}
          </Text>
        </View>
      ) : (
        filtradas.map((cat) => (
          <View key={cat.id} style={styles.tarjeta}>
            <View style={styles.iconoCaja}>
              <Ionicons name="folder-outline" size={24} color={colores.primarioContenedor} />
            </View>

            <View style={styles.info}>
              <View style={styles.tituloFila}>
                <Text style={styles.nombre} numberOfLines={1}>
                  {cat.nombre}
                </Text>
                <Etiqueta
                  texto={`${cat.total_productos ?? 0} prod.`}
                  variante={cat.total_productos > 0 ? 'info' : 'neutro'}
                />
              </View>

              <Text style={styles.descripcion} numberOfLines={2}>
                {cat.descripcion || 'Sin descripción detallada'}
              </Text>
            </View>

            <View style={styles.acciones}>
              <TouchableOpacity
                onPress={() => abrirEditar(cat)}
                style={styles.botonAccion}
                hitSlop={6}
              >
                <Ionicons name="create-outline" size={19} color={colores.primarioContenedor} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => confirmarEliminar(cat)}
                style={[styles.botonAccion, { backgroundColor: '#FEE2E2' }]}
                hitSlop={6}
              >
                <Ionicons name="trash-outline" size={19} color={colores.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))
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
                <Ionicons name="pricetag" size={22} color={colores.primarioContenedor} />
                <Text style={styles.modalTitulo}>
                  {categoriaEditando ? 'Editar categoría' : 'Nueva categoría'}
                </Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colores.contorno} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Las categorías agrupan tus productos en el inventario y facilitan la venta rápida.
            </Text>

            <Campo
              etiqueta="Nombre de la categoría *"
              valor={nombre}
              onChangeText={(t) => {
                setNombre(t);
                if (errorModal) setErrorModal('');
              }}
              placeholder="Ej. Bebidas, Lácteos, Limpieza..."
              icono="pricetag-outline"
            />

            <Campo
              etiqueta="Descripción (opcional)"
              valor={descripcion}
              onChangeText={setDescripcion}
              placeholder="Breve detalle de los productos incluidos"
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
                titulo={categoriaEditando ? 'Guardar' : 'Crear'}
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
    gap: espacios.sm,
    marginBottom: espacios.xs,
  },
  conteoFila: {
    marginBottom: espacios.md,
    marginTop: 2,
  },
  conteoTexto: {
    fontSize: 12,
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
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  tituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombre: {
    fontSize: 14,
    fontWeight: '800',
    color: colores.texto,
    flexShrink: 1,
  },
  descripcion: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
  },
  acciones: {
    flexDirection: 'row',
    gap: 6,
  },
  botonAccion: {
    width: 34,
    height: 34,
    borderRadius: radios.md,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 240,
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
