import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from '../atoms';
import CodigoQr from './CodigoQr';
import { bs, colores, espacios, radios, sombras } from '../../theme';

export default function DialogoTicketQr({
  visible,
  ticket,
  onCerrar,
  onVerDetalle,
}) {
  if (!visible || !ticket) return null;

  const numero = String(ticket.numero ?? '').padStart(3, '0');

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
          contentContainerStyle={styles.contenidoScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tarjeta}>
            <View style={styles.circuloIcono}>
              <Ionicons
                name="qr-code-outline"
                size={26}
                color={colores.textoSobrePrimario}
              />
            </View>

            <Text style={styles.titulo}>Tu ticket está listo</Text>
            <Text style={styles.mensaje}>
              Escanea este código con la cámara de tu celular para ver tu compra y
              descargar el PDF.
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
              <CodigoQr valor={ticket.enlace} tamano={210} />
            </View>

            <Text style={styles.hiperlink}>{ticket.enlace}</Text>

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
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacios.lg,
  },
  contenidoScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  tarjeta: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colores.superficie,
    borderRadius: radios.xxl,
    padding: espacios.xl,
    alignItems: 'center',
    ...sombras.flotante,
  },
  circuloIcono: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.primarioContenedor,
    marginBottom: espacios.sm,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    color: colores.texto,
    textAlign: 'center',
  },
  mensaje: {
    fontSize: 13,
    lineHeight: 19,
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: espacios.xs,
    marginBottom: espacios.md,
  },
  resumen: {
    width: '100%',
    backgroundColor: colores.superficieBaja,
    borderRadius: radios.lg,
    padding: espacios.md,
    marginBottom: espacios.md,
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
    padding: espacios.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radios.lg,
  },
  hiperlink: {
    fontSize: 9,
    color: colores.primarioContenedor,
    textAlign: 'center',
    marginTop: espacios.sm,
    marginBottom: espacios.md,
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
