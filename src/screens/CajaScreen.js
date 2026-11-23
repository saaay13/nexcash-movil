import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Boton, Campo, Separador } from '../components/atoms';
import { DialogoConfirmacion } from '../components/molecules';
import { DrawerLateral } from '../components/organisms';
import { Pantalla } from '../components/templates';
import { bs, colores, espacios, radios, sombras } from '../theme';
import {
  abrirSesionCaja,
  cerrarSesionCaja,
  mensajeError,
  obtenerMovimientosCaja,
  obtenerResumenCaja,
  obtenerSesionActiva,
  registrarMovimientoCaja,
} from '../database';
import { useSesion } from '../context';

export default function CajaScreen() {
  const navigation = useNavigation();
  const { empresaId, usuarioId } = useSesion();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sesion, setSesion] = useState(null);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalRecaudado: 0,
    totalEfectivo: 0,
    totalQr: 0,
  });
  const [movimientos, setMovimientos] = useState([]);

  const [modalCierre, setModalCierre] = useState(false);
  const [montoContado, setMontoContado] = useState('');
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [tipoMov, setTipoMov] = useState('egreso');
  const [conceptoMov, setConceptoMov] = useState('');
  const [montoMov, setMontoMov] = useState('');
  const [guardandoMov, setGuardandoMov] = useState(false);

  const [modalApertura, setModalApertura] = useState(false);
  const [montoInicialApertura, setMontoInicialApertura] = useState('0');
  const [guardandoApertura, setGuardandoApertura] = useState(false);

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

  const cargarDatosCaja = useCallback(async () => {
    if (!empresaId) {
      setSesion(null);
      setResumen({ totalVentas: 0, totalRecaudado: 0, totalEfectivo: 0, totalQr: 0 });
      setMovimientos([]);
      return;
    }
    try {
      const sesionActiva = await obtenerSesionActiva(empresaId);
      const resumenVentas = await obtenerResumenCaja(
        empresaId,
        sesionActiva?.id ? { sesionCajaId: sesionActiva.id } : { soloHoy: true }
      );

      setSesion(sesionActiva);
      setResumen(resumenVentas || { totalVentas: 0, totalRecaudado: 0, totalEfectivo: 0, totalQr: 0 });

      if (sesionActiva?.id) {
        const movs = await obtenerMovimientosCaja(sesionActiva.id);
        setMovimientos(Array.isArray(movs) ? movs : []);
      } else {
        setMovimientos([]);
      }
    } catch (error) {
      console.warn('Error al cargar datos de caja en SQLite:', error);
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      cargarDatosCaja();
    }, [cargarDatosCaja])
  );

  const montoInicial = Number(sesion?.monto_inicial || 0);

  const ingresosManuales = useMemo(() => {
    return movimientos
      .filter((m) => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }, [movimientos]);

  const egresosManuales = useMemo(() => {
    return movimientos
      .filter((m) => m.tipo === 'egreso')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }, [movimientos]);

  const dineroEsperado = useMemo(() => {
    return montoInicial + Number(resumen.totalEfectivo || 0) + ingresosManuales - egresosManuales;
  }, [montoInicial, resumen.totalEfectivo, ingresosManuales, egresosManuales]);

  const esCajaAbierta = sesion?.estado === 'abierta';

  function abrirArqueo() {
    setMontoContado(String(dineroEsperado));
    setModalCierre(true);
  }

  async function handleConfirmarCierre() {
    const valorReal = parseFloat(montoContado.replace(',', '.'));
    if (isNaN(valorReal) || valorReal < 0) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Valor inválido',
        mensaje: 'Por favor ingresa un monto físico válido en Bolivianos.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
      return;
    }

    try {
      setGuardandoCierre(true);
      const resultado = await cerrarSesionCaja({
        sesionId: sesion.id,
        usuarioId,
        empresaId,
        montoReal: valorReal,
      });

      setModalCierre(false);
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Turno de Caja Cerrado',
        mensaje: `Arqueo completado exitosamente.\nEsperado: ${bs(resultado.montoEsperado)}\nReal: ${bs(resultado.montoReal)}\nDiferencia: ${bs(resultado.diferencia)}`,
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: () => {
          cerrarDialogo();
          cargarDatosCaja();
        },
      });
    } catch (error) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Error',
        mensaje: mensajeError(error, 'No se pudo cerrar la caja.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setGuardandoCierre(false);
    }
  }

  async function handleConfirmarApertura() {
    const inicial = parseFloat(montoInicialApertura.replace(',', '.'));
    if (isNaN(inicial) || inicial < 0) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Valor inválido',
        mensaje: 'Ingresa un fondo de caja inicial válido.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
      return;
    }

    try {
      setGuardandoApertura(true);
      await abrirSesionCaja({ usuarioId, empresaId, montoInicial: inicial });
      setModalApertura(false);
      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Turno Iniciado',
        mensaje: `Se inició un nuevo turno con un fondo de ${bs(inicial)}.`,
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: () => {
          cerrarDialogo();
          cargarDatosCaja();
        },
      });
    } catch (error) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Error',
        mensaje: mensajeError(error, 'No se pudo abrir la caja.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setGuardandoApertura(false);
    }
  }

  async function handleGuardarMovimiento() {
    const monto = parseFloat(montoMov.replace(',', '.'));
    if (!conceptoMov.trim()) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Campo requerido',
        mensaje: 'Por favor escribe un concepto para el movimiento.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
      return;
    }
    if (isNaN(monto) || monto <= 0) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Monto inválido',
        mensaje: 'El monto debe ser un número mayor a cero.',
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
      return;
    }

    try {
      setGuardandoMov(true);
      await registrarMovimientoCaja({
        sesionCajaId: sesion.id,
        usuarioId,
        empresaId,
        tipo: tipoMov,
        concepto: conceptoMov.trim(),
        monto,
      });

      setModalMovimiento(false);
      setConceptoMov('');
      setMontoMov('');
      await cargarDatosCaja();

      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: 'Movimiento Registrado',
        mensaje: `${tipoMov === 'ingreso' ? 'Ingreso de dinero' : 'Egreso de dinero'} registrado correctamente.`,
        textoConfirmar: 'Aceptar',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } catch (error) {
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Error',
        mensaje: mensajeError(error, 'No se pudo registrar el movimiento.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    } finally {
      setGuardandoMov(false);
    }
  }

  return (
    <>
    <Pantalla
      tienda
      titulo="Caja y Arqueo"
      onMoneda={() => {}}
      onPerfil={() => navigation.navigate('Perfil')}
      onMenu={() => setDrawerVisible(true)}
      onTurno={() => {}}
    >

      <LinearGradient
        colors={['#003F78', '#164B91', '#5E0086']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tarjeta}
      >
        <View style={styles.filaTop}>
          <View style={styles.etiquetaLinea}>
            <Ionicons
              name={esCajaAbierta ? 'lock-open-outline' : 'lock-closed-outline'}
              size={17}
              color="#FFFFFF"
            />
            <Text style={styles.etiqueta}>
              {esCajaAbierta ? 'TURNO ACTIVO' : 'CAJA CERRADA'}
            </Text>
          </View>
          <View style={[styles.pill, !esCajaAbierta && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <View
              style={[
                styles.pillPunto,
                { backgroundColor: esCajaAbierta ? '#86EFAC' : '#FCA5A5' },
              ]}
            />
            <Text style={styles.pillTexto}>
              {esCajaAbierta ? 'Abierta' : 'Cerrada'}
            </Text>
          </View>
        </View>

        <Text style={styles.caption}>Dinero esperado en caja (Efectivo)</Text>
        <Text style={styles.monto}>{bs(dineroEsperado)}</Text>

        <View style={styles.filaPie}>
          <Text style={styles.pieTexto}>Fondo inicial {bs(montoInicial)}</Text>
          <Text style={styles.pieTexto}>{resumen.totalVentas} venta(s) hoy</Text>
        </View>
      </LinearGradient>

      <Text style={styles.tituloSeccion}>Desglose del turno</Text>

      <View style={styles.desgloseCaja}>

        <View style={styles.desgloseItem}>
          <View style={styles.iconoMetodo}>
            <Ionicons name="cash-outline" size={20} color={colores.primarioContenedor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.desgloseNombre}>Ventas en Efectivo</Text>
            <Text style={styles.desgloseSub}>Cobrado en moneda física</Text>
          </View>
          <Text style={styles.desgloseMonto}>{bs(resumen.totalEfectivo)}</Text>
        </View>

        <Separador margenVertical={espacios.sm} />

        <View style={styles.desgloseItem}>
          <View style={[styles.iconoMetodo, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="qr-code-outline" size={20} color={colores.terciario} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.desgloseNombre}>Ventas por QR Simple</Text>
            <Text style={styles.desgloseSub}>Transferencia bancaria directa</Text>
          </View>
          <Text style={[styles.desgloseMonto, { color: colores.terciario }]}>
            {bs(resumen.totalQr)}
          </Text>
        </View>

        <Separador margenVertical={espacios.sm} />

        <View style={styles.desgloseItem}>
          <View style={[styles.iconoMetodo, { backgroundColor: '#E2EEFF' }]}>
            <Ionicons name="wallet-outline" size={20} color="#005AA4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.desgloseNombre}>Fondo Inicial de Caja</Text>
            <Text style={styles.desgloseSub}>Monto asignado al abrir</Text>
          </View>
          <Text style={styles.desgloseMonto}>{bs(montoInicial)}</Text>
        </View>

        {ingresosManuales > 0 || egresosManuales > 0 ? (
          <>
            <Separador margenVertical={espacios.sm} />
            <View style={styles.desgloseItem}>
              <View style={[styles.iconoMetodo, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="swap-vertical-outline" size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.desgloseNombre}>Movimientos Manuales</Text>
                <Text style={styles.desgloseSub}>
                  +{bs(ingresosManuales)} / -{bs(egresosManuales)}
                </Text>
              </View>
              <Text style={styles.desgloseMonto}>
                {bs(ingresosManuales - egresosManuales)}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.botonesAccion}>
        {esCajaAbierta ? (
          <>
            <Boton
              titulo="Registrar Ingreso / Egreso"
              icono="add-circle-outline"
              variante="secundario"
              onPress={() => setModalMovimiento(true)}
            />
            <Boton
              titulo="Realizar Arqueo y Cierre"
              icono="calculator-outline"
              variante="acento"
              onPress={abrirArqueo}
            />
          </>
        ) : (
          <Boton
            titulo="Abrir Nuevo Turno de Caja"
            icono="lock-open-outline"
            variante="acento"
            onPress={() => setModalApertura(true)}
          />
        )}
      </View>

      {movimientos.length > 0 ? (
        <View style={styles.seccionMovimientos}>
          <Text style={styles.tituloSeccion}>Movimientos de la sesión</Text>
          {movimientos.map((m) => {
            const esIngreso = m.tipo === 'ingreso';
            return (
              <View key={m.id} style={styles.movimientoFila}>
                <View
                  style={[
                    styles.iconoMovimiento,
                    { backgroundColor: esIngreso ? '#DCFCE7' : '#FEE2E2' },
                  ]}
                >
                  <Ionicons
                    name={esIngreso ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={esIngreso ? '#15803D' : '#DC2626'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movimientoConcepto}>{m.concepto}</Text>
                  <Text style={styles.movimientoFecha}>
                    {m.creado_en ? m.creado_en.substring(11, 16) : 'Hoy'} · {m.usuario || 'Usuario'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.movimientoMonto,
                    { color: esIngreso ? '#15803D' : '#DC2626' },
                  ]}
                >
                  {esIngreso ? '+' : '-'} {bs(m.monto)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <Modal visible={modalCierre} transparent animationType="fade" onRequestClose={() => setModalCierre(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <View style={styles.modalHeader}>
              <Ionicons name="calculator-outline" size={24} color={colores.primarioContenedor} />
              <Text style={styles.modalTitulo}>Arqueo y Cierre de Turno</Text>
            </View>

            <View style={styles.resumenArqueo}>
              <Text style={styles.resumenArqueoLabel}>Efectivo esperado por el sistema:</Text>
              <Text style={styles.resumenArqueoMonto}>{bs(dineroEsperado)}</Text>
            </View>

            <Campo
              etiqueta="Monto físico en gaveta (Bs)"
              placeholder="0.00"
              valor={montoContado}
              onChangeText={setMontoContado}
              keyboardType="numeric"
              icono="cash-outline"
            />

            {(() => {
              const valorReal = parseFloat(montoContado.replace(',', '.')) || 0;
              const dif = valorReal - dineroEsperado;
              const esCero = Math.abs(dif) < 0.01;
              const esSobrante = dif > 0.01;
              return (
                <View
                  style={[
                    styles.diferenciaBox,
                    {
                      backgroundColor: esCero ? '#DCFCE7' : esSobrante ? '#E0F2FE' : '#FEE2E2',
                    },
                  ]}
                >
                  <Text style={styles.diferenciaLabel}>
                    {esCero ? 'Cuadre exacto' : esSobrante ? 'Sobrante de caja' : 'Faltante de caja'}:
                  </Text>
                  <Text
                    style={[
                      styles.diferenciaValor,
                      { color: esCero ? '#15803D' : esSobrante ? '#0369A1' : '#DC2626' },
                    ]}
                  >
                    {dif >= 0 ? `+${bs(dif)}` : `- ${bs(Math.abs(dif))}`}
                  </Text>
                </View>
              );
            })()}

            <View style={styles.modalBotones}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                tamano="sm"
                onPress={() => setModalCierre(false)}
                style={{ flex: 1 }}
              />
              <Boton
                titulo="Confirmar Cierre"
                variante="acento"
                tamano="sm"
                cargando={guardandoCierre}
                onPress={handleConfirmarCierre}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalMovimiento} transparent animationType="fade" onRequestClose={() => setModalMovimiento(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <View style={styles.modalHeader}>
              <Ionicons name="swap-vertical-outline" size={24} color={colores.primarioContenedor} />
              <Text style={styles.modalTitulo}>Movimiento de Caja</Text>
            </View>

            <View style={styles.tipoSelector}>
              <TouchableOpacity
                style={[styles.tipoBoton, tipoMov === 'egreso' && styles.tipoBotonActivoEgreso]}
                onPress={() => setTipoMov('egreso')}
              >
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={tipoMov === 'egreso' ? '#FFFFFF' : colores.textoSuave}
                />
                <Text style={[styles.tipoBotonTexto, tipoMov === 'egreso' && styles.tipoTextoActivo]}>
                  Egreso (Gasto)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoBoton, tipoMov === 'ingreso' && styles.tipoBotonActivoIngreso]}
                onPress={() => setTipoMov('ingreso')}
              >
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={tipoMov === 'ingreso' ? '#FFFFFF' : colores.textoSuave}
                />
                <Text style={[styles.tipoBotonTexto, tipoMov === 'ingreso' && styles.tipoTextoActivo]}>
                  Ingreso (Aporte)
                </Text>
              </TouchableOpacity>
            </View>

            <Campo
              etiqueta="Concepto / Motivo"
              placeholder="Ej. Pago de flete, cambio de monedas"
              valor={conceptoMov}
              onChangeText={setConceptoMov}
              icono="document-text-outline"
            />

            <Campo
              etiqueta="Monto (Bs)"
              placeholder="0.00"
              valor={montoMov}
              onChangeText={setMontoMov}
              keyboardType="numeric"
              icono="cash-outline"
            />

            <View style={styles.modalBotones}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                tamano="sm"
                onPress={() => setModalMovimiento(false)}
                style={{ flex: 1 }}
              />
              <Boton
                titulo="Guardar"
                variante="acento"
                tamano="sm"
                cargando={guardandoMov}
                onPress={handleGuardarMovimiento}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalApertura} transparent animationType="fade" onRequestClose={() => setModalApertura(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <View style={styles.modalHeader}>
              <Ionicons name="lock-open-outline" size={24} color={colores.primarioContenedor} />
              <Text style={styles.modalTitulo}>Abrir Nuevo Turno</Text>
            </View>

            <Campo
              etiqueta="Fondo Inicial de Caja (Bs)"
              placeholder="0.00"
              valor={montoInicialApertura}
              onChangeText={setMontoInicialApertura}
              keyboardType="numeric"
              icono="wallet-outline"
            />

            <View style={styles.modalBotones}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                tamano="sm"
                onPress={() => setModalApertura(false)}
                style={{ flex: 1 }}
              />
              <Boton
                titulo="Abrir Caja"
                variante="acento"
                tamano="sm"
                cargando={guardandoApertura}
                onPress={handleConfirmarApertura}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

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
    </Pantalla>

    <DrawerLateral
      visible={drawerVisible}
      onClose={() => setDrawerVisible(false)}
      navigation={navigation}
    />
    </>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: radios.xxl,
    padding: espacios.lg,
    marginBottom: espacios.lg,
    ...sombras.flotante,
  },
  filaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiquetaLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etiqueta: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radios.full,
  },
  pillPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  caption: {
    color: '#D4E2FF',
    fontSize: 12,
    marginTop: espacios.md,
  },
  monto: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginVertical: 4,
  },
  filaPie: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: espacios.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    marginTop: espacios.sm,
  },
  pieTexto: {
    color: '#D4E2FF',
    fontSize: 11,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '700',
    color: colores.texto,
    marginBottom: espacios.sm,
  },
  desgloseCaja: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xxl,
    padding: espacios.lg,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    ...sombras.tarjeta,
  },
  desgloseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
  },
  iconoMetodo: {
    width: 44,
    height: 44,
    borderRadius: radios.lg,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desgloseNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.texto,
  },
  desgloseSub: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 1,
  },
  desgloseMonto: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
  },
  botonesAccion: {
    marginTop: espacios.lg,
    gap: espacios.sm,
  },
  seccionMovimientos: {
    marginTop: espacios.xl,
  },
  movimientoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.superficie,
    padding: espacios.md,
    borderRadius: radios.lg,
    marginBottom: espacios.xs,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    gap: espacios.md,
  },
  iconoMovimiento: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movimientoConcepto: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.texto,
  },
  movimientoFecha: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 1,
  },
  movimientoMonto: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: espacios.lg,
  },
  modalCaja: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xxl,
    padding: espacios.xl,
    ...sombras.flotante,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: espacios.md,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '800',
    color: colores.texto,
  },
  resumenArqueo: {
    backgroundColor: colores.superficieBaja,
    borderRadius: radios.lg,
    padding: espacios.md,
    marginBottom: espacios.md,
    alignItems: 'center',
  },
  resumenArqueoLabel: {
    fontSize: 12,
    color: colores.textoSuave,
  },
  resumenArqueoMonto: {
    fontSize: 22,
    fontWeight: '800',
    color: colores.primarioContenedor,
    marginTop: 2,
  },
  diferenciaBox: {
    padding: espacios.sm,
    borderRadius: radios.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: espacios.sm,
  },
  diferenciaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colores.texto,
  },
  diferenciaValor: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalBotones: {
    flexDirection: 'row',
    gap: espacios.sm,
    marginTop: espacios.lg,
  },
  tipoSelector: {
    flexDirection: 'row',
    gap: espacios.xs,
    marginBottom: espacios.md,
  },
  tipoBoton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    backgroundColor: colores.superficieBaja,
  },
  tipoBotonActivoEgreso: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  tipoBotonActivoIngreso: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  tipoBotonTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSuave,
  },
  tipoTextoActivo: {
    color: '#FFFFFF',
  },
});
