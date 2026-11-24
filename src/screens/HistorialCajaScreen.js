import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DialogoConfirmacion } from '../components/molecules';
import { DrawerLateral } from '../components/organisms';
import { Pantalla } from '../components/templates';
import { bs, colores, espacios, radios, sombras } from '../theme';
import { mensajeError, obtenerHistorialSesionesCaja } from '../database';
import { useSesion } from '../context';

function formatearFecha(valor) {
  if (!valor) return '';
  const texto = String(valor);
  const [fecha, hora] = texto.split(' ');
  if (!hora) return texto;
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio} ${hora.slice(0, 5)}`;
}

function formatearRango(inicio, fin) {
  const inicioTexto = formatearFecha(inicio);
  if (!fin) return `${inicioTexto} · en curso`;
  return `${inicioTexto} → ${formatearFecha(fin)}`;
}

export default function HistorialCajaScreen() {
  const navigation = useNavigation();
  const { empresaId } = useSesion();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sesiones, setSesiones] = useState([]);
  const [expandidos, setExpandidos] = useState({});
  const [dialogo, setDialogo] = useState({
    visible: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Aceptar',
    textoCancelar: null,
    onConfirmar: null,
    onCancelar: null,
  });

  function cerrarDialogo() {
    setDialogo((d) => ({ ...d, visible: false }));
  }

  const cargar = useCallback(async () => {
    if (!empresaId) {
      setSesiones([]);
      setExpandidos({});
      return;
    }
    try {
      const lista = await obtenerHistorialSesionesCaja(empresaId, { limite: 50 });
      const historial = Array.isArray(lista) ? lista : [];
      setSesiones(historial);
      setExpandidos((actual) =>
        Object.keys(actual).length > 0
          ? actual
          : historial.length > 0
            ? { [historial[0].id]: true }
            : {}
      );
    } catch (e) {
      setSesiones([]);
      setExpandidos({});
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudo cargar el historial',
        mensaje: mensajeError(e, 'Intenta nuevamente.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
        onCancelar: null,
      });
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const totales = useMemo(() => {
    const resultado = { ingresos: 0, egresos: 0, neto: 0, efectivo: 0, qr: 0 };
    sesiones.forEach((sesion) => {
      resultado.ingresos += Number(sesion.totalIngresos) || 0;
      resultado.egresos += Number(sesion.totalEgresos) || 0;
      resultado.efectivo += Number(sesion.totalEfectivo) || 0;
      resultado.qr += Number(sesion.totalQr) || 0;
    });
    resultado.neto = resultado.ingresos - resultado.egresos;
    return resultado;
  }, [sesiones]);

  function alternarSesion(id) {
    setExpandidos((actual) => ({ ...actual, [id]: !actual[id] }));
  }

  return (
    <>
      <Pantalla
        titulo="Historial de Caja"
        descripcion="Cada turno desde la apertura hasta el cierre, con cobros, movimientos y arqueo."
        accion={
          <TouchableOpacity
            onPress={() => setDrawerVisible(true)}
            accessibilityLabel="Abrir menú"
            style={styles.botonMenu}
          >
            <Ionicons name="menu" size={20} color={colores.primarioContenedor} />
          </TouchableOpacity>
        }
      >
        <View style={styles.resumen}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenEtiqueta}>Ingresos</Text>
            <Text style={[styles.resumenMonto, { color: colores.exito }]}>
              {bs(totales.ingresos)}
            </Text>
          </View>
          <View style={styles.resumenDivisor} />
          <View style={styles.resumenItem}>
            <Text style={styles.resumenEtiqueta}>Egresos</Text>
            <Text style={[styles.resumenMonto, { color: colores.error }]}>
              {bs(totales.egresos)}
            </Text>
          </View>
          <View style={styles.resumenDivisor} />
          <View style={styles.resumenItem}>
            <Text style={styles.resumenEtiqueta}>Neto</Text>
            <Text style={styles.resumenMonto}>{bs(totales.neto)}</Text>
          </View>
        </View>

        <Text style={styles.conteoTexto}>
          {sesiones.length} turno(s) registrado(s)
        </Text>

        {sesiones.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="cash-outline" size={38} color={colores.contorno} />
            <Text style={styles.vacioTitulo}>Sin turnos de caja</Text>
            <Text style={styles.vacioTexto}>
              Abre un turno en Caja y Arqueo para ver aquí su apertura, movimientos y cierre.
            </Text>
          </View>
        ) : (
          sesiones.map((sesion) => (
            <TarjetaSesion
              key={sesion.id}
              sesion={sesion}
              expandida={Boolean(expandidos[sesion.id])}
              onAlternar={() => alternarSesion(sesion.id)}
            />
          ))
        )}
      </Pantalla>

      <DrawerLateral
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />

      <DialogoConfirmacion
        visible={dialogo.visible}
        tipo={dialogo.tipo}
        titulo={dialogo.titulo}
        mensaje={dialogo.mensaje}
        textoConfirmar={dialogo.textoConfirmar}
        textoCancelar={dialogo.textoCancelar ?? null}
        onConfirmar={dialogo.onConfirmar}
        onCancelar={dialogo.onCancelar}
      />
    </>
  );
}

function TarjetaSesion({ sesion, expandida, onAlternar }) {
  const cerrada = sesion.estado === 'cerrada';
  const diferencia = Number(sesion.diferencia) || 0;
  const verificado = cerrada && Math.abs(diferencia) < 0.01;
  const estadoTexto = !cerrada
    ? 'Turno en curso'
    : verificado
      ? 'Caja verificada'
      : `Diferencia de ${bs(diferencia)}`;
  const estadoColor = !cerrada ? '#B45309' : verificado ? colores.exito : colores.error;
  const estadoFondo = !cerrada ? '#FEF3C7' : verificado ? '#ECFDF5' : '#FFE0E0';

  return (
    <View style={styles.tarjeta}>
      <TouchableOpacity
        style={styles.cabeceraSesion}
        activeOpacity={0.8}
        onPress={onAlternar}
        accessibilityLabel={`Turno ${sesion.id}, ${expandida ? 'ocultar' : 'ver'} detalle`}
      >
        <View
          style={[
            styles.iconoCaja,
            { backgroundColor: cerrada ? '#E0F2FE' : '#FEF3C7' },
          ]}
        >
          <Ionicons
            name={cerrada ? 'checkmark-circle-outline' : 'time-outline'}
            size={20}
            color={cerrada ? '#0369A1' : '#B45309'}
          />
        </View>
        <View style={styles.cabeceraInfo}>
          <Text style={styles.tituloTurno}>Turno #{sesion.id}</Text>
          <Text style={styles.subtituloTurno}>
            {formatearRango(sesion.creado_en, sesion.fecha_cierre)}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: estadoFondo }]}>
          <Text style={[styles.badgeTexto, { color: estadoColor }]}>
            {cerrada ? 'Cerrada' : 'Abierta'}
          </Text>
        </View>
        <Ionicons
          name={expandida ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colores.contorno}
        />
      </TouchableOpacity>

      <Text style={styles.usuariosTurno}>
        Abierta por {sesion.usuario_apertura || 'no identificado'} · Cerrada por{' '}
        {sesion.usuario_cierre || '—'}
      </Text>

      {expandida ? (
        <View style={styles.detalle}>
          <View style={styles.aperturaFila}>
            <Text style={styles.etiquetaFuerte}>Apertura de caja</Text>
            <Text style={styles.montoFuerte}>{bs(sesion.monto_inicial)}</Text>
          </View>

          <Text style={styles.seccionEtiqueta}>COBROS Y MOVIMIENTOS</Text>
          {sesion.eventos.length === 0 ? (
            <Text style={styles.sinEventos}>
              No se registraron cobros ni movimientos en este turno.
            </Text>
          ) : (
            sesion.eventos.map((evento) => (
              <FilaEvento key={`${evento.kind}-${evento.id}`} evento={evento} />
            ))
          )}

          <View style={styles.divisor} />

          <View style={styles.totalesGrid}>
            <DatoTotal etiqueta="Efectivo" valor={bs(sesion.totalEfectivo)} />
            <DatoTotal etiqueta="QR" valor={bs(sesion.totalQr)} color={colores.terciario} />
            <DatoTotal etiqueta="Ingresos" valor={bs(sesion.totalIngresos)} color={colores.exito} />
            <DatoTotal etiqueta="Egresos" valor={bs(sesion.totalEgresos)} color={colores.error} />
          </View>

          <View style={styles.divisor} />

          <View style={styles.cierreGrid}>
            <DatoTotal
              etiqueta="Total esperado"
              valor={bs(sesion.esperadoCalculado)}
            />
            <DatoTotal
              etiqueta="Caja física"
              valor={cerrada ? bs(sesion.monto_real) : '—'}
            />
            <DatoTotal
              etiqueta="Diferencia"
              valor={cerrada ? bs(diferencia) : '—'}
              color={cerrada && !verificado ? colores.error : undefined}
            />
          </View>

          <View style={[styles.estadoCierre, { backgroundColor: estadoFondo }]}>
            <Ionicons
              name={!cerrada ? 'time-outline' : verificado ? 'shield-checkmark-outline' : 'alert-circle-outline'}
              size={15}
              color={estadoColor}
            />
            <Text style={[styles.estadoCierreTexto, { color: estadoColor }]}>
              {estadoTexto}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function FilaEvento({ evento }) {
  const esMovimiento = evento.kind === 'movimiento';
  const esIngreso = esMovimiento && evento.tipo === 'ingreso';
  const anulada = !esMovimiento && evento.estado !== 'completada';
  const esQr = !esMovimiento && evento.metodo_pago === 'qr';

  let etiqueta;
  let detalle;
  let monto;
  let color;
  let fondo;
  let icono;

  if (esMovimiento) {
    etiqueta = esIngreso ? 'Ingreso' : 'Egreso';
    detalle = evento.concepto;
    monto = `${esIngreso ? '+' : '-'}${bs(evento.monto)}`;
    color = esIngreso ? '#15803D' : '#DC2626';
    fondo = esIngreso ? '#DCFCE7' : '#FEE2E2';
    icono = esIngreso ? 'arrow-down-outline' : 'arrow-up-outline';
  } else {
    etiqueta = anulada
      ? 'Venta anulada'
      : `Venta #${String(evento.numero_venta ?? '').padStart(3, '0')}`;
    detalle = `${evento.metodo_pago === 'qr' ? 'QR' : evento.metodo_pago}${
      evento.usuario ? ` · ${evento.usuario}` : ''
    }`;
    monto = anulada ? bs(evento.total) : `+${bs(evento.total)}`;
    color = anulada ? colores.contorno : esQr ? colores.terciario : '#15803D';
    fondo = anulada ? '#F1F5F9' : esQr ? '#F5E8FF' : '#DCFCE7';
    icono = esQr ? 'qr-code-outline' : 'receipt-outline';
  }

  return (
    <View style={styles.eventoFila}>
      <View style={[styles.eventoIcono, { backgroundColor: fondo }]}>
        <Ionicons name={icono} size={16} color={color} />
      </View>
      <View style={styles.eventoInfo}>
        <View style={styles.eventoTop}>
          <Text style={[styles.eventoEtiqueta, anulada && styles.textoAnulado]} numberOfLines={1}>
            {etiqueta}
          </Text>
          <Text style={[styles.eventoMonto, { color }]}>{monto}</Text>
        </View>
        <Text style={styles.eventoDetalle} numberOfLines={1}>
          {detalle}
        </Text>
        <Text style={styles.eventoHora}>{formatearFecha(evento.creado_en)}</Text>
      </View>
    </View>
  );
}

function DatoTotal({ etiqueta, valor, color }) {
  return (
    <View style={styles.datoTotal}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={[styles.datoValor, color && { color }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  botonMenu: {
    width: 40,
    height: 40,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficieBaja,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombras.tarjeta,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenDivisor: {
    width: 1,
    height: 34,
    backgroundColor: colores.borde,
  },
  resumenEtiqueta: {
    fontSize: 10,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  resumenMonto: {
    fontSize: 13,
    fontWeight: '900',
    color: colores.texto,
    marginTop: 3,
  },
  conteoTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.textoSuave,
    marginBottom: espacios.sm,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombras.tarjeta,
  },
  cabeceraSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
  },
  iconoCaja: {
    width: 40,
    height: 40,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabeceraInfo: {
    flex: 1,
    minWidth: 0,
  },
  tituloTurno: {
    fontSize: 14,
    fontWeight: '800',
    color: colores.texto,
  },
  subtituloTurno: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radios.full,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: '800',
  },
  usuariosTurno: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 8,
  },
  detalle: {
    marginTop: espacios.md,
  },
  aperturaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colores.superficieBaja,
    borderRadius: radios.lg,
    paddingHorizontal: espacios.md,
    paddingVertical: 10,
  },
  etiquetaFuerte: {
    fontSize: 12,
    fontWeight: '800',
    color: colores.texto,
  },
  montoFuerte: {
    fontSize: 14,
    fontWeight: '900',
    color: colores.primarioContenedor,
  },
  seccionEtiqueta: {
    fontSize: 10,
    fontWeight: '800',
    color: colores.textoSuave,
    letterSpacing: 0.7,
    marginTop: espacios.md,
    marginBottom: espacios.sm,
  },
  sinEventos: {
    fontSize: 12,
    color: colores.contorno,
    fontStyle: 'italic',
  },
  eventoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingVertical: 6,
  },
  eventoIcono: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventoInfo: {
    flex: 1,
    minWidth: 0,
  },
  eventoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  eventoEtiqueta: {
    fontSize: 12,
    fontWeight: '800',
    color: colores.texto,
    flex: 1,
  },
  textoAnulado: {
    color: colores.contorno,
    textDecorationLine: 'line-through',
  },
  eventoMonto: {
    fontSize: 12,
    fontWeight: '900',
  },
  eventoDetalle: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 1,
  },
  eventoHora: {
    fontSize: 10,
    color: colores.contorno,
    marginTop: 1,
  },
  divisor: {
    height: 1,
    backgroundColor: colores.borde,
    marginVertical: espacios.md,
  },
  totalesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: espacios.md,
  },
  cierreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: espacios.sm,
  },
  datoTotal: {
    width: '25%',
    alignItems: 'center',
  },
  datoEtiqueta: {
    fontSize: 10,
    fontWeight: '700',
    color: colores.textoSuave,
    textAlign: 'center',
  },
  datoValor: {
    fontSize: 12,
    fontWeight: '900',
    color: colores.texto,
    marginTop: 3,
    textAlign: 'center',
  },
  estadoCierre: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radios.lg,
    paddingVertical: 9,
    marginTop: espacios.md,
  },
  estadoCierreTexto: {
    fontSize: 12,
    fontWeight: '800',
  },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  vacioTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
  },
  vacioTexto: {
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: 'center',
    maxWidth: 260,
  },
});
