import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Boton } from '../components/atoms';
import { Buscador, ChipFiltro } from '../components/molecules';
import { DrawerLateral, ProductoTarjeta } from '../components/organisms';
import { Pantalla } from '../components/templates';
import { colores, espacios } from '../theme';
import { obtenerProductos } from '../database';
import { useSesion } from '../context';

export default function ProductosScreen() {
  const navigation = useNavigation();
  const { empresaId } = useSesion();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [cantidades, setCantidades] = useState({});
  const [productos, setProductos] = useState([]);

  const cargarDesdeBD = useCallback(async () => {
    if (!empresaId) {
      setProductos([]);
      return;
    }
    try {
      const datosBD = await obtenerProductos({ empresaId, incluirInactivos: true });
      setProductos(Array.isArray(datosBD) ? datosBD : []);
    } catch (e) {
      console.warn('No se pudieron leer los productos:', e?.message);
      setProductos([]);
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      cargarDesdeBD();
    }, [cargarDesdeBD])
  );

  const categorias = useMemo(() => {
    const unicas = [];
    for (const producto of productos) {
      const nombre = (producto.categoria || '').trim();
      if (nombre && !unicas.includes(nombre)) unicas.push(nombre);
    }
    return [
      'Todos',
      ...unicas.sort((a, b) => a.localeCompare(b)),
      'Critico',
      'Inactivos',
    ];
  }, [productos]);

  const esInactivo = (producto) =>
    (producto.estado ?? (Number(producto.activo) === 0 ? 'inactivo' : 'activo')) === 'inactivo';

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideTexto =
        !texto ||
        (producto.nombre && producto.nombre.toLowerCase().includes(texto)) ||
        (producto.sku && producto.sku.toLowerCase().includes(texto));
      const coincideCategoria =
        categoria === 'Todos' ||
        (categoria === 'Critico'
          ? (producto.stock ?? 0) <= (producto.stock_minimo ?? 5)
          : categoria === 'Inactivos'
            ? esInactivo(producto)
            : producto.categoria === categoria);

      return coincideTexto && coincideCategoria;
    });
  }, [busqueda, categoria, productos]);

  const contarCategoria = (nombre) => {
    if (nombre === 'Todos') return productos.length;
    if (nombre === 'Critico') {
      return productos.filter((p) => (p.stock ?? 0) <= (p.stock_minimo ?? 5)).length;
    }
    if (nombre === 'Inactivos') {
      return productos.filter(esInactivo).length;
    }
    return productos.filter((p) => p.categoria === nombre).length;
  };

  const cambiarCantidad = (id, delta) => {
    setCantidades((actual) => ({
      ...actual,
      [id]: Math.max(0, (actual[id] ?? 0) + delta),
    }));
  };

  return (
    <>
      <Pantalla
        tienda
        titulo="Productos"
        onMoneda={() => {}}
        onPerfil={() => navigation.navigate('Perfil')}
        onMenu={() => setDrawerVisible(true)}
      >

      <View style={styles.buscadorFila}>
        <Buscador
          valor={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre, código o SKU..."
          style={{ flex: 1 }}
        />

        <Pressable
          style={({ pressed }) => [styles.botonEscaner, pressed && styles.presionado]}
          onPress={() => navigation.navigate('Vender')}
          accessibilityLabel="Escanear código de barras"
        >
          <Ionicons name="barcode-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {categorias.map((nombre) => (
          <ChipFiltro
            key={nombre}
            etiqueta={
              nombre === 'Critico'
                ? 'Existencia crítica'
                : nombre === 'Inactivos'
                  ? 'Inactivos'
                  : nombre
            }
            activo={categoria === nombre}
            alerta={nombre === 'Critico' || nombre === 'Inactivos'}
            conteo={contarCategoria(nombre)}
            onPress={() => setCategoria(nombre)}
          />
        ))}
      </ScrollView>

      <View style={styles.cabeceraCatalogo}>
        <View style={{ flex: 1 }}>
          <View style={styles.tituloLinea}>
            <Text style={styles.tituloCatalogo}>
              {categoria === 'Inactivos' ? 'Catálogo Inactivo' : 'Catálogo'}
            </Text>
            <View style={[styles.punto, categoria === 'Inactivos' && styles.puntoInactivo]} />
          </View>
          <Text style={styles.subtituloCatalogo}>
            {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'} en tu catálogo
          </Text>
        </View>

        <Boton
          titulo="Nuevo"
          icono="add"
          tamano="sm"
          style={styles.botonNuevo}
          onPress={() => navigation.navigate('ProductoForm')}
        />
      </View>

      {filtrados.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="search-outline" size={32} color={colores.contorno} />
          <Text style={styles.vacioTitulo}>Sin resultados</Text>
          <Text style={styles.vacioTexto}>
            Prueba con otro nombre, código o categoría.
          </Text>
        </View>
      ) : (
        filtrados.map((producto) => (
          <ProductoTarjeta
            key={producto.id}
            producto={producto}
            cantidad={cantidades[producto.id] ?? 0}
            onRestar={() => cambiarCantidad(producto.id, -1)}
            onSumar={() => cambiarCantidad(producto.id, 1)}
            onCobrar={() => {
              if (!esInactivo(producto)) {
                navigation.navigate('Vender', { productoId: producto.id });
              }
            }}
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
  </>
);
}

const styles = StyleSheet.create({
  buscadorFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
  },
  botonEscaner: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colores.terciario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: {
    opacity: 0.8,
  },
  chips: {
    paddingVertical: espacios.md,
    gap: espacios.xs,
  },
  cabeceraCatalogo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacios.md,
    marginTop: espacios.xs,
  },
  tituloLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloCatalogo: {
    fontSize: 18,
    fontWeight: '700',
    color: colores.texto,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colores.exito,
  },
  puntoInactivo: {
    backgroundColor: colores.error,
  },
  subtituloCatalogo: {
    fontSize: 12,
    color: colores.textoSuave,
    marginTop: 2,
  },
  botonNuevo: {
    minWidth: 84,
  },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
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
  },
});
