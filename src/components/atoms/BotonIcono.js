import { TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colores } from '../../theme';

export default function BotonIcono({
  name,
  color = colores.primarioContenedor,
  size = 21,
  onPress,
  style,
  accessibilityLabel,
}) {
  return (
    <TouchableOpacity
      onPress={onPress || (() => {})}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      style={[styles.boton, style]}
      activeOpacity={0.7}
    >
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF5',
  },
});
