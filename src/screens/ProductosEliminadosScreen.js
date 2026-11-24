import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Buscador, DialogoConfirmacion } from '../components/molecules';
import { DrawerLateral, ProductoTarjeta } from '../components/organisms';
import { Pantalla } from '../components/templates';
import { colores, espacios, radios } from '../theme';
import { mensajeError, obtenerProductos, reactivarProducto } from '../database';
import { useSesion } from '../context';

export default function ProductosEliminadosScreen() {
  const navigation = useNavigation();
  const { empresaId } = useSesion();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]);
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
      setProductos([]);
      return;
    }
    try {
      const datos = await obtenerProductos({
        empresaId,
        incluirInactivos: true,
        incluirEliminados: true,
        estado: 'eliminado',
      });
      setProductos(Array.isArray(datos) ? datos : []);
    } catch (e) {
      setProductos([]);
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo cargar la lista',
        mensaje: mensajeError(e, 'Intenta nuevamente.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
        onCancelar: null,
      });
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return productos;
    return productos.filter(
      (producto) =>
        String(producto.nombre ?? '').toLowerCase().includes(texto) ||
        String(producto.sku ?? producto.codigo_barras ?? '').toLowerCase().includes(texto)
    );
  }, [busqueda, productos]);

  function pedirReactivacion(producto) {
    setDialogo({
      visible: true,
      tipo: 'info',
      titulo: '¿Reactivar producto?',
      mensaje: `"${producto.nombre}" volverá a aparecer en tu catálogo y podrás venderlo nuevamente.`,
      textoConfirmar: 'Reactivar',
      textoCancelar: 'Cancelar',
      onConfirmar: () => reactivar(producto),
      onCancelar: cerrarDialogo,
    });
  }

  async function reactivar(producto) {
    cerrarDialogo();
    try {
      await reactivarProducto(producto.id, empresaId);
      setProductos((actual) => actual.filter((p) => p.id !== producto.id));
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Producto reactivado',
        mensaje: `"${producto.nombre}" ya está disponible para la venta.`,
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
        onCancelar: null,
      });
    } catch (e) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo reactivar',
        mensaje: mensajeError(e, 'Intenta nuevamente.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
        onCancelar: null,
      });
    }
  }

  return (
    <>
      <Pantalla
        titulo="Productos eliminados"
        descripcion="Reactiva los productos que ocultaste del catálogo."
        accion={
          <TouchableOpacity
            onPress={() => setDrawerVisible(true)}
            accessibilityLabel="Abrir menú"
            style={styles.botonMenu}
          >
            <Ionicons name="menu" size={20} color={colores.primarioContenedor} />
          </TouchableOpacity>
        }
      >
        <Buscador
          valor={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar producto eliminado..."
        />

        <Text style={styles.conteo}>
          {filtrados.length} {filtrados.length === 1 ? 'producto oculto' : 'productos ocultos'}
        </Text>

        {filtrados.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="trash-outline" size={36} color={colores.contorno} />
            <Text style={styles.vacioTitulo}>Sin productos eliminados</Text>
            <Text style={styles.vacioTexto}>
              Los productos que elimines desde su formulario aparecerán aquí para que
              puedas reactivarlos.
            </Text>
          </View>
        ) : (
          filtrados.map((producto) => (
            <ProductoTarjeta
              key={producto.id}
              producto={producto}
              accionReactivar={() => pedirReactivacion(producto)}
              onPress={() => navigation.navigate('ProductoForm', { producto })}
            />
          ))
        )}
      </Pantalla>

      <DrawerLateral
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
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
      />
    </>
  );
}

const styles = StyleSheet.create({
  botonMenu: {
    width: 40,
    height: 40,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficieBaja,
  },
  conteo: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSuave,
    marginVertical: espacios.md,
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
    maxWidth: 280,
    lineHeight: 18,
  },
});
