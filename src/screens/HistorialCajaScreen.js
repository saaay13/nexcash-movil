import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DialogoConfirmacion } from '../components/molecules';
import { DrawerLateral } from '../components/organisms';
import { Pantalla } from '../components/templates';
import { bs, colores, espacios, radios, sombras } from '../theme';
import { mensajeError, obtenerHistorialMovimientosCaja } from '../database';
import { useSesion } from '../context';

const FILTROS = ['Todos', 'Ingresos', 'Egresos'];

function formatearFecha(valor) {
  if (!valor) return '';
  const texto = String(valor);
  const [fecha, hora] = texto.split(' ');
  if (!hora) return texto;
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio} ${hora.slice(0, 5)}`;
}

export default function HistorialCajaScreen() {
  const navigation = useNavigation();
  const { empresaId } = useSesion();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
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
      setMovimientos([]);
      return;
    }
    try {
      const lista = await obtenerHistorialMovimientosCaja(empresaId, { limite: 100 });
      setMovimientos(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setMovimientos([]);
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

  const movimientosVisibles = useMemo(() => {
    if (filtro === 'Ingresos') return movimientos.filter((m) => m.tipo === 'ingreso');
    if (filtro === 'Egresos') return movimientos.filter((m) => m.tipo === 'egreso');
    return movimientos;
  }, [movimientos, filtro]);

  const totales = useMemo(() => {
    const resultado = { ingresos: 0, egresos: 0, neto: 0 };
    movimientos.forEach((m) => {
      const monto = Number(m.monto) || 0;
      if (m.tipo === 'ingreso') resultado.ingresos += monto;
      else resultado.egresos += monto;
    });
    resultado.neto = resultado.ingresos - resultado.egresos;
    return resultado;
  }, [movimientos]);

  return (
    <>
      <Pantalla
        titulo="Historial de Caja"
        descripcion="Consulta los ingresos y egresos de todos tus turnos, con la persona que registró cada movimiento."
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
          {movimientosVisibles.length} movimiento(s) registrado(s)
        </Text>

        <View style={styles.filtros}>
          {FILTROS.map((opcion) => (
            <TouchableOpacity
              key={opcion}
              style={[styles.chip, filtro === opcion && styles.chipActivo]}
              onPress={() => setFiltro(opcion)}
            >
              <Text style={[styles.chipTexto, filtro === opcion && styles.chipTextoActivo]}>
                {opcion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {movimientosVisibles.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="receipt-outline" size={38} color={colores.contorno} />
            <Text style={styles.vacioTitulo}>Sin movimientos</Text>
            <Text style={styles.vacioTexto}>
              Los ingresos y egresos que registres en Caja y Arqueo aparecerán aquí.
            </Text>
          </View>
        ) : (
          movimientosVisibles.map((m) => {
            const esIngreso = m.tipo === 'ingreso';
            const color = esIngreso ? '#15803D' : '#DC2626';
            const fondo = esIngreso ? '#DCFCE7' : '#FEE2E2';

            return (
              <View key={m.id} style={styles.tarjeta}>
                <View style={[styles.iconoCaja, { backgroundColor: fondo }]}>
                  <Ionicons
                    name={esIngreso ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={color}
                  />
                </View>
                <View style={styles.info}>
                  <View style={styles.topFila}>
                    <Text style={styles.concepto} numberOfLines={1}>
                      {m.concepto}
                    </Text>
                    <Text style={[styles.monto, { color }]}>
                      {esIngreso ? '+' : '-'}
                      {bs(m.monto)}
                    </Text>
                  </View>
                  <Text style={styles.usuario} numberOfLines={1}>
                    Registrado por {m.usuario || 'usuario no identificado'}
                  </Text>
                  <View style={styles.pieFila}>
                    <Text style={styles.turno}>
                      Turno #{m.sesion_caja_id} · {m.sesion_estado === 'cerrada' ? 'Cerrado' : 'Abierto'}
                    </Text>
                    <Text style={styles.fecha}>{formatearFecha(m.creado_en)}</Text>
                  </View>
                </View>
              </View>
            );
          })
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
        textoCancelar={dialogo.textoCancelar}
        onConfirmar={dialogo.onConfirmar}
        onCancelar={dialogo.onCancelar}
      />
    </>
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
  filtros: {
    flexDirection: 'row',
    gap: espacios.sm,
    marginBottom: espacios.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radios.full,
    borderWidth: 1,
    borderColor: colores.contornoSuave,
    backgroundColor: colores.superficie,
  },
  chipActivo: {
    backgroundColor: colores.primarioContenedor,
    borderColor: colores.primarioContenedor,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  chipTextoActivo: {
    color: '#FFFFFF',
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.sm,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombras.tarjeta,
  },
  iconoCaja: {
    width: 44,
    height: 44,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  topFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  concepto: {
    fontSize: 14,
    fontWeight: '800',
    color: colores.texto,
    flex: 1,
  },
  monto: {
    fontSize: 14,
    fontWeight: '900',
  },
  usuario: {
    fontSize: 12,
    color: colores.textoSuave,
    marginTop: 2,
  },
  pieFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  turno: {
    fontSize: 11,
    fontWeight: '700',
    color: colores.primarioContenedor,
  },
  fecha: {
    fontSize: 10,
    color: colores.contorno,
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
