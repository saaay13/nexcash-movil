import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from '../atoms';
import { colores, espacios, radios } from '../../theme';

const TIEMPO_ENFRIAMIENTO = 1500;

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

export default function EscaneadorCodigo({
  visible,
  onCerrar,
  onLeer,
  continuo = false,
  conteo = 0,
  ultimoEscaneo = null,
  onTerminar,
  onRegistrar,
}) {
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
    if (ultimo.current.codigo === codigo && ahora - ultimo.current.momento < TIEMPO_ENFRIAMIENTO) {
      return;
    }

    ultimo.current = { codigo, momento: ahora };
    onLeer?.(codigo);
  }

  function terminar() {
    if (onTerminar) onTerminar();
    else onCerrar?.();
  }

  const banner = (() => {
    if (!ultimoEscaneo) return null;

    if (ultimoEscaneo.tipo === 'ok') {
      return {
        icono: 'checkmark-circle',
        titulo: `${ultimoEscaneo.nombre ?? 'Producto'} +1`,
        detalle: 'Agregado al carrito',
        estilo: styles.bannerOk,
        color: '#6EE7B7',
      };
    }

    if (ultimoEscaneo.tipo === 'duplicado') {
      return {
        icono: 'information-circle-outline',
        titulo: `${ultimoEscaneo.nombre ?? 'Producto'} ya está en el carrito`,
        detalle: 'Para otra unidad, usa el contador +',
        estilo: styles.bannerDuplicado,
        color: '#93C5FD',
      };
    }

    if (ultimoEscaneo.tipo === 'sin_stock') {
      return {
        icono: 'alert-circle-outline',
        titulo: `${ultimoEscaneo.nombre ?? 'Producto'} sin existencia`,
        detalle: 'No se agregó al carrito',
        estilo: styles.bannerAlerta,
        color: '#FCD34D',
      };
    }

    return {
      icono: 'warning-outline',
      titulo: 'Código no registrado',
      detalle: String(ultimoEscaneo.codigo ?? ''),
      estilo: styles.bannerError,
      color: '#FCA5A5',
    };
  })();

  const puedeRegistrar =
    ultimoEscaneo?.tipo === 'error' && Boolean(ultimoEscaneo?.codigo) && Boolean(onRegistrar);

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
              <Pressable onPress={onCerrar} style={styles.cerrar} hitSlop={8}>
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </Pressable>

              <View style={[styles.marco, continuo && styles.marcoContinuo]} />

              {continuo ? (
                <>
                  <Text style={styles.instruccionContinua}>
                    Apunta al siguiente producto
                  </Text>

                  <View style={styles.panelInferior} pointerEvents="box-none">
                    {banner ? (
                      <View style={[styles.banner, banner.estilo]}>
                        <Ionicons name={banner.icono} size={22} color={banner.color} />
                        <View style={styles.bannerTextos}>
                          <Text style={styles.bannerTitulo} numberOfLines={1}>
                            {banner.titulo}
                          </Text>
                          <Text style={styles.bannerDetalle} numberOfLines={1}>
                            {banner.detalle}
                          </Text>
                        </View>
                        {puedeRegistrar ? (
                          <Pressable
                            onPress={() => onRegistrar(ultimoEscaneo.codigo)}
                            style={styles.bannerBoton}
                            hitSlop={6}
                          >
                            <Text style={styles.bannerBotonTexto}>Registrar</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}

                    <Text style={styles.contador}>
                      {conteo} {conteo === 1 ? 'producto escaneado' : 'productos escaneados'}
                    </Text>

                    <Boton
                      titulo="Terminar escaneo"
                      icono="checkmark-circle-outline"
                      variante="acento"
                      tamano="md"
                      onPress={terminar}
                      style={styles.botonTerminar}
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.instruccion}>
                  Apunta la cámara al código de barras
                </Text>
              )}
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
  marcoContinuo: {
    marginBottom: 110,
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
  instruccionContinua: {
    position: 'absolute',
    top: 104,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: espacios.xl,
  },
  panelInferior: {
    position: 'absolute',
    left: espacios.md,
    right: espacios.md,
    bottom: espacios.lg,
    gap: espacios.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radios.lg,
    paddingVertical: 12,
    paddingHorizontal: espacios.md,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
  },
  bannerOk: {
    backgroundColor: 'rgba(6, 78, 59, 0.9)',
  },
  bannerDuplicado: {
    backgroundColor: 'rgba(30, 64, 175, 0.9)',
  },
  bannerAlerta: {
    backgroundColor: 'rgba(120, 53, 15, 0.9)',
  },
  bannerError: {
    backgroundColor: 'rgba(127, 29, 29, 0.9)',
  },
  bannerTextos: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bannerDetalle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    marginTop: 2,
  },
  bannerBoton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radios.md,
    backgroundColor: '#FFFFFF',
  },
  bannerBotonTexto: {
    color: '#0B1B2B',
    fontSize: 12,
    fontWeight: '800',
  },
  contador: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  botonTerminar: {
    width: '100%',
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
