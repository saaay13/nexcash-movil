import { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
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
  usarApi = false,
  onCambiarUsarApi,
}) {
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const ultimo = useRef({ codigo: '', momento: 0 });
  const linea = useMemo(() => new Animated.Value(0), []);
  const pulso = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (!visible) return undefined;

    ultimo.current = { codigo: '', momento: 0 };
    linea.setValue(0);

    const recorrido = Animated.loop(
      Animated.sequence([
        Animated.timing(linea, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(linea, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    const latido = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulso, {
          toValue: 1,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    recorrido.start();
    latido.start();

    return () => {
      recorrido.stop();
      latido.stop();
    };
  }, [visible, linea, pulso]);

  function manejarLectura({ data }) {
    const codigo = String(data ?? '').trim();
    if (!codigo) return;

    const ahora = Date.now();
    if (
      ultimo.current.codigo === codigo &&
      ahora - ultimo.current.momento < TIEMPO_ENFRIAMIENTO
    ) {
      return;
    }

    ultimo.current = { codigo, momento: ahora };
    onLeer?.(codigo, usarApi);
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
        color: '#6EE7B7',
        fondo: 'rgba(6, 78, 59, 0.85)',
        borde: 'rgba(110, 231, 183, 0.35)',
      };
    }

    if (ultimoEscaneo.tipo === 'duplicado') {
      return {
        icono: 'information-circle-outline',
        titulo: `${ultimoEscaneo.nombre ?? 'Producto'} ya está en el carrito`,
        detalle: 'Para otra unidad, usa el contador +',
        color: '#93C5FD',
        fondo: 'rgba(30, 64, 175, 0.75)',
        borde: 'rgba(147, 197, 253, 0.32)',
      };
    }

    if (ultimoEscaneo.tipo === 'sin_stock') {
      return {
        icono: 'alert-circle-outline',
        titulo: `${ultimoEscaneo.nombre ?? 'Producto'} sin existencia`,
        detalle: 'No se agregó al carrito',
        color: '#FCD34D',
        fondo: 'rgba(120, 53, 15, 0.8)',
        borde: 'rgba(252, 211, 77, 0.32)',
      };
    }

    return {
      icono: 'warning-outline',
      titulo: 'Código no registrado',
      detalle:
        ultimoEscaneo.detalle ??
        (ultimoEscaneo.datosApi
          ? 'Datos de Open Food Facts listos para registrar'
          : String(ultimoEscaneo.codigo ?? '')),
      color: '#FCA5A5',
      fondo: 'rgba(127, 29, 29, 0.75)',
      borde: 'rgba(252, 165, 165, 0.32)',
    };
  })();

  const puedeRegistrar =
    ultimoEscaneo?.tipo === 'error' && Boolean(ultimoEscaneo?.codigo) && Boolean(onRegistrar);

  const desplazamientoLinea = linea.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 166],
  });

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.raiz}>
        {!permiso ? (
          <View style={styles.centro}>
            <View style={styles.iconoCentro}>
              <Ionicons name="camera-outline" size={34} color={colores.primarioContenedor} />
            </View>
            <Text style={styles.titulo}>Preparando la cámara</Text>
            <Text style={styles.texto}>Un momento mientras activamos el lector de códigos.</Text>
          </View>
        ) : !permiso.granted ? (
          <View style={styles.centro}>
            <View style={styles.iconoCentro}>
              <Ionicons name="camera-outline" size={34} color={colores.primarioContenedor} />
            </View>
            <Text style={styles.titulo}>Permiso de cámara</Text>
            <Text style={styles.texto}>
              NexCash necesita acceder a la cámara para leer códigos de barras.
            </Text>
            {permiso.canAskAgain ? (
              <Boton
                titulo="Permitir cámara"
                icono="camera-outline"
                onPress={solicitarPermiso}
                style={styles.botonPermiso}
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
              <LinearGradient
                colors={['rgba(3, 15, 35, 0.94)', 'rgba(3, 15, 35, 0.74)']}
                style={styles.cabecera}
              >
                <View style={styles.cabeceraTextos}>
                  <View style={styles.etiquetaModo}>
                    <Ionicons
                      name={continuo ? 'scan-outline' : 'barcode-outline'}
                      size={12}
                      color={colores.neon}
                    />
                    <Text style={styles.etiquetaModoTexto}>
                      {continuo ? 'Escaneo continuo' : 'Lectura única'}
                    </Text>
                  </View>
                  <Text style={styles.cabeceraTitulo}>
                    {continuo ? 'Escanear productos' : 'Escanear código'}
                  </Text>
                  <Text style={styles.cabeceraSubtitulo}>
                    {continuo
                      ? 'Apunta al código y sigue agregando productos'
                      : 'Coloca el código dentro del recuadro'}
                  </Text>
                </View>

                <Pressable onPress={onCerrar} style={styles.botonCerrar} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
              </LinearGradient>

              {onCambiarUsarApi ? (
                <Pressable
                  onPress={() => onCambiarUsarApi(!usarApi)}
                  style={[styles.controlApi, usarApi && styles.controlApiActivo]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: usarApi }}
                >
                  <View style={[styles.iconoApi, usarApi && styles.iconoApiActivo]}>
                    <Ionicons
                      name="sparkles-outline"
                      size={16}
                      color={usarApi ? colores.neon : 'rgba(255,255,255,0.9)'}
                    />
                  </View>
                  <View style={styles.controlApiTextos}>
                    <Text style={styles.controlApiTitulo}>Buscar datos en la API</Text>
                    <Text style={styles.controlApiDetalle} numberOfLines={1}>
                      {usarApi
                        ? 'Open Food Facts activo · máx. 15 consultas/min'
                        : 'Desactivado: solo lee el código y llenas los campos'}
                    </Text>
                  </View>
                  <View style={[styles.interruptor, usarApi && styles.interruptorActivo]}>
                    <View
                      style={[
                        styles.botonInterruptor,
                        usarApi && styles.botonInterruptorActivo,
                      ]}
                    />
                  </View>
                </Pressable>
              ) : null}

              <View style={styles.zonaCamara} pointerEvents="box-none">
                <View style={styles.tinte} />

                <View style={styles.filaMarco}>
                  <View style={[styles.tinte, styles.tinteLateral]} />

                  <View style={styles.ventana}>
                    <Ionicons
                      name="barcode-outline"
                      size={58}
                      color="rgba(255,255,255,0.14)"
                    />
                    <Animated.View
                      style={[
                        styles.lineaEscaneo,
                        { transform: [{ translateY: desplazamientoLinea }] },
                      ]}
                    />
                    <View style={[styles.esquina, styles.esquinaSuperiorIzquierda]} />
                    <View style={[styles.esquina, styles.esquinaSuperiorDerecha]} />
                    <View style={[styles.esquina, styles.esquinaInferiorIzquierda]} />
                    <View style={[styles.esquina, styles.esquinaInferiorDerecha]} />
                  </View>

                  <View style={[styles.tinte, styles.tinteLateral]} />
                </View>

                <View style={[styles.tinte, styles.tinteInferior]}>
                  {continuo ? (
                    <View style={styles.pista}>
                      <Ionicons name="radio-outline" size={13} color={colores.neon} />
                      <Text style={styles.pistaTexto}>Mantén el código dentro del recuadro</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <LinearGradient
                colors={['rgba(3, 15, 35, 0)', 'rgba(3, 15, 35, 0.95)']}
                style={styles.degradadoInferior}
                pointerEvents="box-none"
              >
                {continuo ? (
                  <View style={styles.panelInferior} pointerEvents="box-none">
                    {banner ? (
                      <View
                        style={[
                          styles.banner,
                          { backgroundColor: banner.fondo, borderColor: banner.borde },
                        ]}
                      >
                        <View style={[styles.bannerIcono, { backgroundColor: banner.fondo }]}>
                          <Ionicons name={banner.icono} size={19} color={banner.color} />
                        </View>
                        <View style={styles.bannerTextos}>
                          <Text style={styles.bannerTitulo} numberOfLines={1}>
                            {banner.titulo}
                          </Text>
                          <Text style={styles.bannerDetalle} numberOfLines={2}>
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
                    ) : (
                      <View style={styles.estadoListo}>
                        <Animated.View style={[styles.puntoActivo, { opacity: pulso }]} />
                        <Text style={styles.estadoTexto}>Cámara activa · esperando código</Text>
                      </View>
                    )}

                    <View style={styles.filaAcciones}>
                      <View style={styles.contadorCaja}>
                        <Ionicons name="cube-outline" size={17} color={colores.neon} />
                        <View style={styles.contadorTextos}>
                          <Text style={styles.contadorNumero}>{conteo}</Text>
                          <Text style={styles.contadorEtiqueta}>
                            {conteo === 1 ? 'producto' : 'productos'}
                          </Text>
                        </View>
                      </View>

                      <Boton
                        titulo="Terminar escaneo"
                        icono="checkmark-circle-outline"
                        variante="primario"
                        tamano="md"
                        onPress={terminar}
                        style={styles.botonTerminar}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.panelLecturaUnica}>
                    <View style={styles.tarjetaInstruccion}>
                      <View style={styles.iconoInstruccion}>
                        <Ionicons name="barcode-outline" size={22} color={colores.neon} />
                      </View>
                      <View style={styles.instruccionTextos}>
                        <Text style={styles.instruccionTitulo}>Apunta al código de barras</Text>
                        <Text style={styles.instruccionDetalle}>
                          La cámara se cierra automáticamente al leerlo.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </LinearGradient>
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
    backgroundColor: '#020A16',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.sm,
    padding: espacios.xl,
    backgroundColor: colores.fondo,
  },
  iconoCentro: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficieMedia,
    marginBottom: espacios.xs,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    color: colores.texto,
    textAlign: 'center',
  },
  texto: {
    fontSize: 13,
    lineHeight: 19,
    color: colores.textoSuave,
    textAlign: 'center',
    maxWidth: 300,
  },
  aviso: {
    fontSize: 12,
    fontWeight: '600',
    color: colores.errorTexto,
    textAlign: 'center',
  },
  botonPermiso: {
    marginTop: espacios.md,
    minWidth: 200,
  },
  botonSecundario: {
    marginTop: espacios.sm,
    minWidth: 200,
  },
  camara: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 48,
    paddingHorizontal: espacios.lg,
    paddingBottom: espacios.md,
  },
  cabeceraTextos: {
    flex: 1,
    minWidth: 0,
    paddingRight: espacios.sm,
  },
  etiquetaModo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radios.full,
    backgroundColor: 'rgba(151, 233, 255, 0.14)',
    marginBottom: espacios.xs,
  },
  etiquetaModoTexto: {
    color: colores.neon,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cabeceraTitulo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cabeceraSubtitulo: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 2,
  },
  botonCerrar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  controlApi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    marginHorizontal: espacios.lg,
    marginBottom: espacios.sm,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radios.xl,
    backgroundColor: 'rgba(8, 20, 40, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(151, 233, 255, 0.22)',
  },
  controlApiActivo: {
    backgroundColor: 'rgba(6, 78, 59, 0.82)',
    borderColor: 'rgba(110, 231, 183, 0.45)',
  },
  iconoApi: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconoApiActivo: {
    backgroundColor: 'rgba(110, 231, 183, 0.16)',
  },
  controlApiTextos: {
    flex: 1,
    minWidth: 0,
  },
  controlApiTitulo: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  controlApiDetalle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    marginTop: 2,
  },
  interruptor: {
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.22)',
    padding: 3,
    justifyContent: 'center',
  },
  interruptorActivo: {
    backgroundColor: colores.neon,
  },
  botonInterruptor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  botonInterruptorActivo: {
    alignSelf: 'flex-end',
    backgroundColor: colores.primario,
  },
  zonaCamara: {
    flex: 1,
    flexDirection: 'column',
  },
  tinte: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 20, 0.58)',
  },
  filaMarco: {
    height: 180,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tinteLateral: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 20, 0.58)',
  },
  tinteInferior: {
    alignItems: 'center',
    paddingTop: espacios.md,
  },
  ventana: {
    width: '80%',
    height: 180,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  esquina: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colores.neon,
    borderWidth: 3,
  },
  esquinaSuperiorIzquierda: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  esquinaSuperiorDerecha: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  esquinaInferiorIzquierda: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  esquinaInferiorDerecha: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  lineaEscaneo: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: colores.neon,
    shadowColor: colores.neon,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 4,
  },
  pista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radios.full,
    backgroundColor: 'rgba(3, 15, 35, 0.66)',
  },
  pistaTexto: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  degradadoInferior: {
    paddingHorizontal: espacios.lg,
    paddingTop: espacios.xl,
    paddingBottom: 28,
  },
  panelInferior: {
    gap: espacios.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    minHeight: 58,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radios.xl,
    borderWidth: 1,
  },
  bannerIcono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextos: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitulo: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bannerDetalle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  bannerBoton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radios.md,
    backgroundColor: '#FFFFFF',
  },
  bannerBotonTexto: {
    color: colores.primario,
    fontSize: 12,
    fontWeight: '800',
  },
  estadoListo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacios.sm,
    paddingVertical: espacios.sm,
  },
  puntoActivo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colores.neon,
  },
  estadoTexto: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  filaAcciones: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: espacios.sm,
  },
  contadorCaja: {
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: espacios.md,
    borderRadius: radios.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  contadorTextos: {
    alignItems: 'center',
  },
  contadorNumero: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 19,
  },
  contadorEtiqueta: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 9,
    fontWeight: '700',
  },
  botonTerminar: {
    flex: 1,
    borderRadius: radios.lg,
  },
  panelLecturaUnica: {
    alignItems: 'center',
  },
  tarjetaInstruccion: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    padding: espacios.md,
    borderRadius: radios.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  iconoInstruccion: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(151, 233, 255, 0.16)',
  },
  instruccionTextos: {
    flex: 1,
    minWidth: 0,
  },
  instruccionTitulo: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  instruccionDetalle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    marginTop: 2,
  },
});
