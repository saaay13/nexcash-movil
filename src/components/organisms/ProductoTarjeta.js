import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { bs, colores, espacios, radios, sombras, tipografia } from '../../theme';
import SelectorCantidad from '../molecules/SelectorCantidad';
import Boton  from '../atoms/Boton';
import Etiqueta from '../atoms/Etiqueta';

export default function ProductoTarjeta({
  producto,
  cantidad = 0,
  onRestar,
  onSumar,
  onCobrar,
  onPress,
  accionReactivar = null,
}) {
  const stock = producto.stock ?? producto.stock_actual ?? 0;
  const stockMinimo = producto.stock_minimo ?? 5;
  const esCritico = stock <= stockMinimo;
  const estado = producto.estado ?? (Number(producto.activo) === 0 ? 'inactivo' : 'activo');
  const estaInactivo = estado === 'inactivo';
  const estaEliminado = estado === 'eliminado';
  const noDisponible = estaInactivo || estaEliminado;

  return (
    <Pressable
      style={({ pressed }) => [styles.tarjeta, pressed && styles.presionado]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.filaPrincipal}>

        <View
          style={[
            styles.miniatura,
            { backgroundColor: producto.color ?? colores.superficieBaja },
          ]}
        >
          {producto.imagen ? (
            <Image source={{ uri: producto.imagen }} style={styles.miniaturaImagen} />
          ) : (
            <Ionicons name="cube-outline" size={24} color="#FFFFFF" />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>
            {producto.nombre}
          </Text>

          <View style={styles.metaFila}>
            {estaEliminado ? (
              <>
                <Etiqueta texto="Eliminado" variante="error" punto />
                <Text style={styles.punto}>·</Text>
              </>
            ) : estaInactivo ? (
              <>
                <Etiqueta texto="Inactivo" variante="error" punto />
                <Text style={styles.punto}>·</Text>
              </>
            ) : null}
            <Text style={styles.sku}>
              {producto.sku || producto.codigo_barras || 'Sin código'}
            </Text>
            {producto.unidad ? (
              <>
                <Text style={styles.punto}>·</Text>
                <Text style={styles.unidad}>{producto.unidad}</Text>
              </>
            ) : null}
            {producto.categoria ? (
              <>
                <Text style={styles.punto}>·</Text>
                <Text style={styles.categoria}>{producto.categoria}</Text>
              </>
            ) : null}
          </View>

          {producto.descripcion ? (
            <Text style={styles.descripcion} numberOfLines={1}>
              {producto.descripcion}
            </Text>
          ) : null}

          <View style={styles.precioStockFila}>
            <Text style={styles.precio}>{bs(producto.precio ?? producto.precio_venta)}</Text>
            <Etiqueta
              texto={esCritico ? `Quedan ${stock}` : `${stock} en existencia`}
              variante={esCritico ? 'error' : 'exito'}
              punto
            />
          </View>
        </View>
      </View>

      <View style={styles.pieFila}>
        {accionReactivar ? (
          <Boton
            titulo="Reactivar"
            icono="refresh-outline"
            tamano="sm"
            variante="acento"
            onPress={accionReactivar}
            style={styles.botonReactivar}
          />
        ) : (
          <>
            <SelectorCantidad
              valor={cantidad}
              onRestar={onRestar}
              onSumar={onSumar}
              deshabilitado={noDisponible}
            />

            <Boton
              titulo={
                noDisponible
                  ? 'No disponible'
                  : cantidad > 0
                    ? `Cobrar (${cantidad})`
                    : 'Cobrar'
              }
              icono={noDisponible ? 'eye-off-outline' : 'cart-outline'}
              tamano="sm"
              variante={noDisponible ? 'suave' : cantidad > 0 ? 'acento' : 'primario'}
              deshabilitado={noDisponible}
              onPress={onCobrar}
            />
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.sm,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    ...sombras.tarjeta,
  },
  presionado: {
    opacity: 0.95,
  },
  filaPrincipal: {
    flexDirection: 'row',
    gap: espacios.md,
    alignItems: 'center',
  },
  miniatura: {
    width: 52,
    height: 52,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniaturaImagen: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nombre: {
    ...tipografia.cuerpoFuerte,
    color: colores.texto,
    fontSize: 14,
  },
  metaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sku: {
    ...tipografia.micro,
    color: colores.textoSuave,
  },
  punto: {
    color: colores.contorno,
    fontSize: 10,
  },
  unidad: {
    ...tipografia.micro,
    color: colores.textoSuave,
  },
  categoria: {
    ...tipografia.micro,
    color: colores.secundario,
  },
  descripcion: {
    ...tipografia.micro,
    color: colores.textoSuave,
    marginTop: 3,
  },
  precioStockFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    marginTop: 4,
  },
  precio: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
  },
  pieFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: espacios.md,
    paddingTop: espacios.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F3FA',
  },
  botonReactivar: {
    width: '100%',
  },
});
