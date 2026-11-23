import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from '../atoms';
import { colores, espacios, radios } from '../../theme';

const TIPOS = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'itf14',
  'qr',
];

export default function EscaneadorCodigo({ visible, onCerrar, onLeer }) {
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const ultimo = useRef({ codigo: '', momento: 0 });

  useEffect(() => {
    if (visible) {
      ultimo.current = { codigo: '', momento: 0 };
    }
  }, [visible]);

  function manejarLectura({ data }) {
    const codigo = String(data ?? '').trim();
    if (!codigo) return;

    const ahora = Date.now();
    if (ultimo.current.codigo === codigo && ahora - ultimo.current.momento < 1500) return;

    ultimo.current = { codigo, momento: ahora };
    onLeer?.(codigo);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.raiz}>
        {!permiso ? (
          <View style={styles.centro}>
            <Text style={styles.texto}>Preparando la cámara...</Text>
          </View>
        ) : !permiso.granted ? (
          <View style={styles.centro}>
            <Ionicons name="camera-outline" size={44} color={colores.primario} />
            <Text style={styles.titulo}>Permiso de cámara</Text>
            <Text style={styles.texto}>
              NexCash necesita acceder a la cámara para leer códigos de barras.
            </Text>
            {permiso.canAskAgain ? (
              <Boton
                titulo="Permitir cámara"
                icono="camera-outline"
                onPress={solicitarPermiso}
              />
            ) : (
              <Text style={styles.aviso}>
                Activa el permiso de cámara desde los ajustes del dispositivo.
              </Text>
            )}
            <Boton
              titulo="Cancelar"
              variante="secundario"
              onPress={onCerrar}
              style={styles.botonSecundario}
            />
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camara}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: TIPOS }}
              onBarcodeScanned={manejarLectura}
            />

            <View style={styles.overlay} pointerEvents="box-none">
              <View style={styles.marco} />
              <Text style={styles.instruccion}>
                Apunta la cámara al código de barras
              </Text>
              <Pressable onPress={onCerrar} style={styles.cerrar} hitSlop={8}>
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.md,
    padding: espacios.xl,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colores.texto,
    textAlign: 'center',
  },
  texto: {
    fontSize: 13,
    color: colores.textoSuave,
    textAlign: 'center',
  },
  aviso: {
    fontSize: 12,
    fontWeight: '600',
    color: colores.errorTexto,
    textAlign: 'center',
  },
  camara: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marco: {
    width: '78%',
    height: 180,
    borderRadius: radios.lg,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  instruccion: {
    position: 'absolute',
    bottom: 96,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: espacios.xl,
  },
  cerrar: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSecundario: {
    marginTop: espacios.sm,
  },
});
