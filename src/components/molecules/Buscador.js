import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colores, espacios, radios, sombras, tipografia } from '../../theme';

export default function Buscador({
  valor,
  onChangeText,
  onLimpiar,
  placeholder = 'Buscar...',
  style,
  iconoDerecha,
  onIconoDerechaPress,
}) {
  return (
    <View style={[styles.buscador, style]}>
      <Ionicons name="search" size={20} color={colores.contorno} />
      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colores.contorno}
      />
      {valor ? (
        <Pressable
          onPress={onLimpiar || (() => onChangeText(''))}
          accessibilityLabel="Limpiar búsqueda"
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={colores.contorno} />
        </Pressable>
      ) : iconoDerecha ? (
        <Pressable onPress={onIconoDerechaPress} hitSlop={8}>
          <Ionicons name={iconoDerecha} size={22} color={colores.primarioContenedor} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  buscador: {
    height: 48,
    borderRadius: radios.lg,
    backgroundColor: colores.superficie,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingHorizontal: espacios.md,
    ...sombras.tarjeta,
  },
  input: {
    flex: 1,
    ...tipografia.cuerpo,
    color: colores.texto,
    paddingVertical: 0,
  },
});
