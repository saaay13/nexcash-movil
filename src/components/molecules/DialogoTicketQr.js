import React, { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from '../atoms';
import CodigoQr from './CodigoQr';
import { bs, colores, espacios, radios, sombras } from '../../theme';

export default function DialogoTicketQr({
  visible,
  ticket,
  onCerrar,
  onVerDetalle,
  onDescargarPdf,
  descargando = false,
}) {
  const { width, height } = useWindowDimensions();
  const [centrar, setCentrar] = useState(true);
  const alturaVentana = useRef(0);
  const alturaContenido = useRef(0);

  if (!visible || !ticket) return null;

  const numero = String(ticket.numero ?? '').padStart(3, '0');
  const tamanoQr = Math.max(
    140,
    Math.min(260, Math.floor(Math.min(width - 112, height * 0.34)))
  );

  function sincronizarCentrado() {
    const disponible = alturaVentana.current;
    const contenido = alturaContenido.current;
    if (disponible > 0 && contenido > 0) {
      setCentrar(contenido <= disponible);
    }
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={styles.fondoOscuro}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contenidoScroll,
            centrar && styles.contenidoCentrado,
          ]}
          onLayout={(evento) => {
            alturaVentana.current = evento.nativeEvent.layout.height;
            sincronizarCentrado();
          }}
          onContentSizeChange={(_ancho, alto) => {
            alturaContenido.current = alto;
            sincronizarCentrado();
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.tarjeta}>
            <Pressable
              onPress={onCerrar}
              accessibilityLabel="Cerrar ticket"
              accessibilityRole="button"
              style={styles.botonCerrar}
            >
              <Ionicons name="close" size={18} color={colores.textoSuave} />
            </Pressable>

            <View style={styles.circuloIcono}>
              <Ionicons
                name="qr-code-outline"
                size={24}
                color={colores.textoSobrePrimario}
              />
            </View>

            <Text style={styles.titulo}>Tu ticket está listo</Text>
            <Text style={styles.mensaje}>
              Muestra este QR al cliente: con internet abre su comprobante y
              descarga el PDF. Aquí guardas tu copia local.
            </Text>

            <View style={styles.resumen}>
              <View style={styles.resumenFila}>
                <Text style={styles.resumenEtiqueta}>Ticket</Text>
                <Text style={styles.resumenValor}>#{numero}</Text>
              </View>
              <View style={styles.resumenFila}>
                <Text style={styles.resumenEtiqueta}>Total</Text>
                <Text style={styles.resumenValor}>{bs(ticket.total)}</Text>
              </View>
              <View style={styles.resumenFila}>
                <Text style={styles.resumenEtiqueta}>Pago</Text>
                <Text style={styles.resumenValor}>{ticket.metodo}</Text>
              </View>
            </View>

            <View style={styles.qrCaja}>
              <CodigoQr valor={ticket.enlace} tamano={tamanoQr} />
            </View>

            <Text style={styles.aviso}>
              El cliente necesita internet para abrir el comprobante.
            </Text>

            <Text
              style={styles.hiperlink}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {ticket.enlace}
            </Text>

            <Boton
              titulo="Descargar copia local"
              icono="document-attach-outline"
              variante="primario"
              tamano="md"
              cargando={descargando}
              deshabilitado={!onDescargarPdf || descargando}
              onPress={onDescargarPdf}
              style={styles.botonPdf}
            />

            <View style={styles.botonesContenedor}>
              <Boton
                titulo="Cerrar"
                variante="secundario"
                tamano="md"
                onPress={onCerrar}
                style={styles.botonMedio}
              />
              <Boton
                titulo="Ver detalle"
                icono="receipt-outline"
                variante="primario"
                tamano="md"
                onPress={onVerDetalle}
                style={styles.botonMedio}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondoOscuro: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: espacios.md,
  },
  scroll: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
    width: '100%',
    paddingVertical: espacios.md,
    alignItems: 'center',
  },
  contenidoCentrado: {
    justifyContent: 'center',
  },
  tarjeta: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colores.superficie,
    borderRadius: radios.xxl,
    padding: espacios.lg,
    alignItems: 'center',
    ...sombras.flotante,
  },
  botonCerrar: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficieBaja,
  },
  circuloIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.primarioContenedor,
    marginBottom: espacios.sm,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '800',
    color: colores.texto,
    textAlign: 'center',
  },
  mensaje: {
    fontSize: 12,
    lineHeight: 17,
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: espacios.xs,
    marginBottom: espacios.sm,
  },
  resumen: {
    width: '100%',
    backgroundColor: colores.superficieBaja,
    borderRadius: radios.lg,
    padding: espacios.sm,
    marginBottom: espacios.sm,
  },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  resumenEtiqueta: {
    fontSize: 12,
    color: colores.textoSuave,
  },
  resumenValor: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.texto,
  },
  qrCaja: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radios.lg,
  },
  aviso: {
    fontSize: 11,
    lineHeight: 16,
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: espacios.sm,
  },
  hiperlink: {
    fontSize: 9,
    color: colores.primarioContenedor,
    textAlign: 'center',
    marginTop: espacios.xs,
    marginBottom: espacios.sm,
  },
  botonPdf: {
    width: '100%',
    marginBottom: espacios.sm,
  },
  botonesContenedor: {
    width: '100%',
    flexDirection: 'row',
    gap: espacios.sm,
  },
  botonMedio: {
    flex: 1,
  },
});
