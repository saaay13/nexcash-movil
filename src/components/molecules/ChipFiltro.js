import { Pressable, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colores, espacios, radios } from '../../theme';

export default function ChipFiltro({
  etiqueta,
  activo = false,
  alerta = false,
  conteo,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        activo && styles.chipActivo,
        alerta && styles.chipAlerta,
        activo && alerta && styles.chipAlertaActivo,
      ]}
    >
      {alerta ? (
        <Ionicons
          name="warning-outline"
          size={13}
          color={activo ? '#FFFFFF' : colores.errorTexto}
        />
      ) : null}
      <Text
        style={[
          styles.texto,
          activo && styles.textoActivo,
          alerta && !activo && styles.textoAlerta,
        ]}
      >
        {etiqueta} {conteo !== undefined ? `(${conteo})` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: espacios.md,
    paddingVertical: 7,
    borderRadius: radios.full,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    marginRight: espacios.xs,
  },
  chipActivo: {
    backgroundColor: colores.primarioContenedor,
    borderColor: colores.primarioContenedor,
  },
  chipAlerta: {
    backgroundColor: colores.errorFondo,
    borderColor: '#FFCDD2',
  },
  chipAlertaActivo: {
    backgroundColor: colores.error,
    borderColor: colores.error,
  },
  texto: {
    fontSize: 12,
    fontWeight: '600',
    color: colores.textoSuave,
  },
  textoActivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textoAlerta: {
    color: colores.errorTexto,
  },
});
