import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Boton from '../atoms/Boton';
import { colores, espacios, radios, sombras } from '../../theme';

const CONFIG_TIPOS = {
  peligro: {
    icono: 'trash-outline',
    colorIcono: '#DC2626',
    fondoIcono: '#FEE2E2',
    varianteBoton: 'peligro',
  },
  exito: {
    icono: 'checkmark-circle-outline',
    colorIcono: '#16A34A',
    fondoIcono: '#DCFCE7',
    varianteBoton: 'primario',
  },
  advertencia: {
    icono: 'alert-circle-outline',
    colorIcono: '#D97706',
    fondoIcono: '#FEF3C7',
    varianteBoton: 'acento',
  },
  info: {
    icono: 'information-circle-outline',
    colorIcono: '#0284C7',
    fondoIcono: '#E0F2FE',
    varianteBoton: 'primario',
  },
};

export default function DialogoConfirmacion({
  visible,
  tipo = 'info',
  titulo,
  mensaje,
  icono,
  textoConfirmar = 'Aceptar',
  textoCancelar,
  onConfirmar,
  onCancelar,
  cargando = false,
}) {
  if (!visible) return null;

  const cfg = CONFIG_TIPOS[tipo] || CONFIG_TIPOS.info;
  const nombreIcono = icono || cfg.icono;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancelar || onConfirmar}
    >
      <View style={styles.fondoOscuro}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancelar || onConfirmar}
        />

        <View style={styles.tarjeta}>
          <View style={[styles.circuloIcono, { backgroundColor: cfg.fondoIcono }]}>
            <Ionicons name={nombreIcono} size={30} color={cfg.colorIcono} />
          </View>

          <Text style={styles.titulo}>{titulo}</Text>
          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

          <View style={styles.botonesContenedor}>
            {textoCancelar ? (
              <Boton
                titulo={textoCancelar}
                variante="secundario"
                tamano="md"
                onPress={onCancelar}
                deshabilitado={cargando}
                style={styles.botonMedio}
              />
            ) : null}

            <Boton
              titulo={textoConfirmar}
              variante={cfg.varianteBoton}
              tamano="md"
              onPress={onConfirmar}
              cargando={cargando}
              deshabilitado={cargando}
              style={textoCancelar ? styles.botonMedio : styles.botonCompleto}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondoOscuro: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacios.lg,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colores.superficie,
    borderRadius: radios.xxl,
    padding: espacios.xl,
    alignItems: 'center',
    ...sombras.flotante,
  },
  circuloIcono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacios.md,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    color: colores.texto,
    textAlign: 'center',
    marginBottom: espacios.xs,
  },
  mensaje: {
    fontSize: 14,
    color: colores.textoSuave,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: espacios.lg,
  },
  botonesContenedor: {
    width: '100%',
    flexDirection: 'row',
    gap: espacios.sm,
  },
  botonMedio: {
    flex: 1,
  },
  botonCompleto: {
    width: '100%',
  },
});
