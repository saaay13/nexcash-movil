import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Boton, Etiqueta } from '../components/atoms';
import { DialogoConfirmacion } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { bs, colores, espacios, radios, sombras } from '../theme';
import { obtenerCatalogo } from '../services';
import { importarDesdeApi, mensajeError } from '../database';
import { useSesion } from '../context';

export default function CatalogoScreen() {
  const { empresaId } = useSesion();
  const [estado, setEstado] = useState('cargando');
  const [productos, setProductos] = useState([]);
  const [importando, setImportando] = useState(false);

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
    try {
      const datos = await obtenerCatalogo();
      setProductos(datos);
      setEstado('listo');
    } catch (_e) {
      setEstado('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function handleImportar() {
    if (!empresaId) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Sin empresa activa',
        mensaje: 'Vuelve a seleccionar tu negocio antes de importar productos.',
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
      return;
    }
    setImportando(true);
    try {
      const insertados = await importarDesdeApi(productos, empresaId);
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Catálogo sincronizado',
        mensaje: `Se importaron ${insertados} productos nuevos al inventario.`,
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } catch (error) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo importar',
        mensaje: mensajeError(error, 'No se pudieron importar los productos del catálogo.'),
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setImportando(false);
    }
  }

  if (estado === 'cargando') {
    return (
      <Pantalla titulo="Catálogo sugerido">
        <View style={styles.estadoCaja}>
          <View style={styles.iconoEstado}>
            <ActivityIndicator size="small" color={colores.primarioContenedor} />
          </View>
          <Text style={styles.estadoTitulo}>Consultando la API pública</Text>
          <Text style={styles.estadoTexto}>Catálogo público DummyJSON</Text>

          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.esqueleto}>
              <View style={styles.esqueletoImagen} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={[styles.esqueletoLinea, { width: '70%' }]} />
                <View style={[styles.esqueletoLinea, { width: '40%' }]} />
              </View>
            </View>
          ))}
        </View>
      </Pantalla>
    );
  }

  if (estado === 'error') {
    return (
      <Pantalla titulo="Catálogo sugerido">
        <View style={styles.estadoCaja}>
          <View style={[styles.iconoEstado, styles.iconoError]}>
            <Ionicons name="cloud-offline-outline" size={32} color={colores.error} />
          </View>
          <Text style={styles.estadoTitulo}>No se pudo conectar a la API</Text>
          <Text style={styles.estadoTexto}>
            Revisa la conexión a internet y vuelve a intentarlo. Los datos locales siguen disponibles.
          </Text>
          <Boton
            titulo="Reintentar conexión"
            icono="refresh-outline"
            variante="secundario"
            onPress={() => {
              setEstado('cargando');
              cargar();
            }}
            style={{ marginTop: espacios.lg }}
          />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Catálogo sugerido"
      descripcion="Productos sugeridos listos para importar a tu inventario comercial."
    >
      <View style={styles.cabeceraAccion}>
        <Text style={styles.contadorTexto}>{productos.length} sugerencias disponibles</Text>
        <Boton
          titulo={importando ? 'Guardando...' : 'Importar al inventario'}
          icono="download-outline"
          tamano="sm"
          variante="acento"
          deshabilitado={importando}
          onPress={handleImportar}
        />
      </View>

      {productos.map((producto) => (
        <View key={producto.id} style={styles.tarjeta}>
          {producto.imagen ? (
            <Image source={{ uri: producto.imagen }} style={styles.imagen} />
          ) : (
            <View style={styles.sinImagen}>
              <Ionicons name="image-outline" size={24} color={colores.contorno} />
            </View>
          )}

          <View style={styles.info}>
            <Text style={styles.nombre} numberOfLines={2}>
              {producto.nombre}
            </Text>
            <View style={styles.meta}>
              <Etiqueta texto={producto.categoria} variante="info" />
              <Text style={styles.precio}>{bs(producto.precio)}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.pieAviso}>
        <Ionicons name="information-circle-outline" size={16} color={colores.textoSuave} />
        <Text style={styles.pieTexto}>
          Sincronización directa con el catálogo de tu negocio.
        </Text>
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
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cabeceraAccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espacios.md,
  },
  contadorTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  estadoCaja: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  iconoEstado: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacios.md,
  },
  iconoError: {
    backgroundColor: colores.errorFondo,
  },
  estadoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colores.texto,
    textAlign: 'center',
  },
  estadoTexto: {
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  esqueleto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginTop: espacios.md,
    width: '100%',
  },
  esqueletoImagen: {
    width: 52,
    height: 52,
    borderRadius: radios.lg,
    backgroundColor: colores.superficieBaja,
  },
  esqueletoLinea: {
    height: 12,
    borderRadius: radios.sm,
    backgroundColor: colores.superficieBaja,
  },
  tarjeta: {
    flexDirection: 'row',
    gap: espacios.md,
    alignItems: 'center',
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.sm,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    ...sombras.tarjeta,
  },
  imagen: {
    width: 56,
    height: 56,
    borderRadius: radios.lg,
    backgroundColor: colores.superficieBaja,
  },
  sinImagen: {
    width: 56,
    height: 56,
    borderRadius: radios.lg,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nombre: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.texto,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  precio: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.primarioContenedor,
  },
  pieAviso: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: espacios.lg,
    padding: espacios.md,
    backgroundColor: colores.superficieBaja,
    borderRadius: radios.lg,
  },
  pieTexto: {
    flex: 1,
    fontSize: 11,
    color: colores.textoSuave,
    lineHeight: 16,
  },
});
