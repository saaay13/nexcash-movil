import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Boton, Campo } from '../components/atoms';
import { DialogoConfirmacion, EscaneadorCodigo } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { colores, espacios, radios } from '../theme';
import {
  agregarProducto,
  modificarProducto,
  eliminarProducto,
  mensajeError,
} from '../database';
import { useSesion } from '../context';

export default function ProductoFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { empresaId } = useSesion();
  const producto = route.params?.producto;
  const codigoInicial = route.params?.codigoBarras ?? '';

  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [categoria, setCategoria] = useState(producto?.categoria ?? '');
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

  async function guardar() {
    const precioNum = Number(String(precio).replace(',', '.'));
    const stockNum = Number(stock);

    if (!nombre.trim() || !precio.trim() || !stock.trim()) {
      setError('El nombre, el precio y la existencia son obligatorios.');
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
        categoria: categoria.trim() || 'General',
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

      <Campo
        etiqueta="Categoría"
        valor={categoria}
        onChangeText={setCategoria}
        placeholder="Bebidas, Lácteos, Abarrotes..."
        icono="folder-outline"
      />

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
