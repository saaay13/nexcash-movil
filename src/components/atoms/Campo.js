import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colores, espacios, radios, tipografia } from '../../theme';

export default function Campo({
  etiqueta,
  valor,
  onChangeText,
  placeholder,
  icono,
  sufijo,
  onSufijoPress,
  prefijo,
  error,
  style,
  ...rest
}) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={[styles.contenedor, style]}>
      {etiqueta ? <Text style={styles.etiqueta}>{etiqueta}</Text> : null}

      <View
        style={[
          styles.caja,
          enfocado && styles.cajaEnfocada,
          error ? styles.cajaError : null,
        ]}
      >
        {icono ? (
          <Ionicons
            name={icono}
            size={18}
            color={enfocado ? colores.primario : colores.contorno}
          />
        ) : null}

        {prefijo ? <Text style={styles.prefijo}>{prefijo}</Text> : null}

        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colores.contorno}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          {...rest}
        />

        {sufijo ? (
          <Pressable onPress={onSufijoPress} hitSlop={8}>
            <Ionicons
              name={sufijo}
              size={18}
              color={colores.contorno}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: espacios.md,
  },
  etiqueta: {
    ...tipografia.etiqueta,
    color: colores.textoSuave,
    marginBottom: 6,
    marginLeft: 2,
  },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    minHeight: 50,
    paddingHorizontal: espacios.md,
    borderRadius: radios.lg,
    borderWidth: 1.5,
    borderColor: colores.contornoSuave,
    backgroundColor: colores.superficie,
  },
  cajaEnfocada: {
    borderColor: colores.primarioContenedor,
    backgroundColor: colores.superficie,
  },
  cajaError: {
    borderColor: colores.error,
    backgroundColor: colores.errorFondo,
  },
  prefijo: {
    ...tipografia.cuerpoFuerte,
    color: colores.textoSuave,
  },
  input: {
    flex: 1,
    ...tipografia.cuerpo,
    color: colores.texto,
    paddingVertical: espacios.sm,
  },
  error: {
    ...tipografia.micro,
    color: colores.errorTexto,
    marginTop: 4,
    marginLeft: 4,
  },
});
