import { View, StyleSheet } from 'react-native';
import { colores, espacios } from '../../theme';

export default function Separador({ style, margenVertical = espacios.md }) {
  return (
    <View
      style={[
        styles.linea,
        { marginVertical: margenVertical },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  linea: {
    height: 1,
    backgroundColor: colores.borde,
    width: '100%',
  },
});
