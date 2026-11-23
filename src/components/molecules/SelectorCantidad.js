import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colores, radios, tipografia } from '../../theme';

export default function SelectorCantidad({
  valor,
  onRestar,
  onSumar,
  compacto = false,
  deshabilitado = false,
}) {
  const tamano = compacto ? 30 : 34;
  const colorIcono = deshabilitado ? colores.contorno : colores.primario;

  return (
    <View style={styles.contenedor}>
      <Pressable
        onPress={deshabilitado ? undefined : onRestar}
        disabled={deshabilitado}
        accessibilityLabel="Quitar una unidad"
        style={({ pressed }) => [
          styles.boton,
          { width: tamano, height: tamano },
          deshabilitado && styles.botonDeshabilitado,
          !deshabilitado && pressed && styles.presionado,
        ]}
      >
        <Ionicons name="remove" size={16} color={colorIcono} />
      </Pressable>

      <Text style={[styles.valor, compacto && styles.valorCompacto]}>{valor}</Text>

      <Pressable
        onPress={deshabilitado ? undefined : onSumar}
        disabled={deshabilitado}
        accessibilityLabel="Agregar una unidad"
        style={({ pressed }) => [
          styles.boton,
          { width: tamano, height: tamano },
          deshabilitado && styles.botonDeshabilitado,
          !deshabilitado && pressed && styles.presionado,
        ]}
      >
        <Ionicons name="add" size={16} color={colorIcono} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  boton: {
    borderRadius: radios.md,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: {
    backgroundColor: colores.superficieMedia,
    transform: [{ scale: 0.94 }],
  },
  botonDeshabilitado: {
    backgroundColor: colores.borde,
    opacity: 0.7,
  },
  valor: {
    ...tipografia.numero,
    minWidth: 30,
    textAlign: 'center',
    color: colores.texto,
  },
  valorCompacto: {
    minWidth: 24,
  },
});
