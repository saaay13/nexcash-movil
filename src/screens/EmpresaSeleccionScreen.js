import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Boton, Campo, Etiqueta, Separador } from '../components/atoms';
import { DialogoConfirmacion } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { colores, espacios, radios, sombras } from '../theme';
import {
  mensajeError,
  obtenerEmpresasDeUsuario,
  registrarEmpresa,
  vincularseAEmpresa,
} from '../database';
import { useSesion } from '../context';

export default function EmpresaSeleccionScreen() {
  const navigation = useNavigation();
  const { usuario, seleccionarEmpresa, cerrarSesion: limpiarSesion } = useSesion();

  const [empresas, setEmpresas] = useState([]);
  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalVinculo, setModalVinculo] = useState(false);

  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [direccionEmpresa, setDireccionEmpresa] = useState('');
  const [telefonoEmpresa, setTelefonoEmpresa] = useState('');
  const [errorRegistro, setErrorRegistro] = useState('');
  const [creando, setCreando] = useState(false);

  const [codigoPrivado, setCodigoPrivado] = useState('');
  const [errorVinculo, setErrorVinculo] = useState('');
  const [vinculando, setVinculando] = useState(false);

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

  const cerrarDialogo = useCallback(() => {
    setDialogo((d) => ({ ...d, visible: false }));
  }, []);

  const cargarEmpresas = useCallback(async () => {
    if (!usuario?.id) return;
    try {
      const lista = await obtenerEmpresasDeUsuario(usuario.id);
      setEmpresas(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setEmpresas([]);
      setDialogo({
        visible: true,
        tipo: 'advertencia',
        titulo: 'No se pudieron cargar tus empresas',
        mensaje: mensajeError(e, 'Ocurrió un problema al consultar tus espacios de trabajo.'),
        textoConfirmar: 'Entendido',
        textoCancelar: null,
        onConfirmar: cerrarDialogo,
      });
    }
  }, [usuario, cerrarDialogo]);

  useFocusEffect(
    useCallback(() => {
      if (!usuario?.id) {
        navigation.replace('Login');
        return;
      }
      cargarEmpresas();
    }, [usuario, navigation, cargarEmpresas])
  );

  async function handleCrearEmpresa() {
    if (creando) return;
    if (!nombreEmpresa.trim()) {
      setErrorRegistro('Ingresa el nombre del negocio.');
      return;
    }

    setCreando(true);
    try {
      setErrorRegistro('');
      const nueva = await registrarEmpresa({
        nombre: nombreEmpresa.trim(),
        direccion: direccionEmpresa.trim(),
        telefono: telefonoEmpresa.trim(),
        propietarioId: usuario?.id,
      });

      setModalRegistro(false);
      setNombreEmpresa('');
      setDireccionEmpresa('');
      setTelefonoEmpresa('');
      await cargarEmpresas();

      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: '¡Empresa registrada!',
        mensaje: 'Tu negocio ha sido creado exitosamente. Ya puedes entrar y comenzar a registrar tus productos.\n\nSi necesitas el código de acceso para vincular empleados, revélalo desde Configuración con el ícono del ojo.',
        textoConfirmar: 'Entrar al negocio',
        textoCancelar: null,
        onConfirmar: () => {
          cerrarDialogo();
          seleccionarEmpresa(nueva);
          navigation.replace('Principal');
        },
      });
    } catch (e) {
      setErrorRegistro(mensajeError(e, 'Error al registrar la empresa.'));
    } finally {
      setCreando(false);
    }
  }

  async function handleVincularEmpresa() {
    if (vinculando) return;
    const cod = codigoPrivado.trim().toUpperCase();
    if (!cod) {
      setErrorVinculo('Ingresa el código privado de la empresa.');
      return;
    }

    setVinculando(true);
    try {
      setErrorVinculo('');
      const vinculada = await vincularseAEmpresa({
        codigoPrivado: cod,
        usuarioId: usuario?.id,
      });

      setModalVinculo(false);
      setCodigoPrivado('');
      await cargarEmpresas();

      setDialogo({
        visible: true,
        tipo: 'exito',
        titulo: '¡Vinculación completada!',
        mensaje: `Te has vinculado exitosamente a "${vinculada.nombre}" con el rol de Vendedor.`,
        textoConfirmar: 'Entrar al punto de venta',
        textoCancelar: null,
        onConfirmar: () => {
          cerrarDialogo();
          seleccionarEmpresa(vinculada);
          navigation.replace('Principal');
        },
      });
    } catch (e) {
      setErrorVinculo(mensajeError(e, 'Código de empresa no válido.'));
    } finally {
      setVinculando(false);
    }
  }

  function entrarAEmpresa(empresa) {
    seleccionarEmpresa(empresa);
    navigation.replace('Principal');
  }

  function cerrarSesion() {
    setDialogo({
      visible: true,
      tipo: 'advertencia',
      titulo: 'Cerrar sesión',
      mensaje: '¿Deseas salir a la pantalla de bienvenida?',
      textoConfirmar: 'Salir',
      textoCancelar: 'Cancelar',
      onConfirmar: () => {
        cerrarDialogo();
        limpiarSesion();
        navigation.replace('Bienvenida');
      },
      onCancelar: cerrarDialogo,
    });
  }

  return (
    <Pantalla titulo="Espacios de Trabajo">

      <View style={styles.perfilCard}>
        <View style={styles.perfilAvatar}>
          <Ionicons name="person" size={26} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.perfilNombre}>{usuario?.nombre || 'Usuario'}</Text>
          <Text style={styles.perfilCorreo}>{usuario?.correo || ''}</Text>
        </View>
        <TouchableOpacity style={styles.botonSalir} onPress={cerrarSesion}>
          <Ionicons name="log-out-outline" size={20} color={colores.error} />
        </TouchableOpacity>
      </View>

      <Text style={styles.seccionSubtitulo}>
        Selecciona tu negocio activo o incorpora una nueva empresa al sistema.
      </Text>

      <View style={styles.accionesFila}>
        <TouchableOpacity
          style={[styles.accionCard, styles.accionRegistro]}
          activeOpacity={0.85}
          onPress={() => setModalRegistro(true)}
        >
          <View style={[styles.accionIcono, { backgroundColor: '#E2EEFF' }]}>
            <Ionicons name="add-circle" size={26} color={colores.primarioContenedor} />
          </View>
          <Text style={styles.accionTitulo}>Registrar empresa</Text>
          <Text style={styles.accionDesc}>Soy dueño de un nuevo negocio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accionCard, styles.accionVinculo]}
          activeOpacity={0.85}
          onPress={() => setModalVinculo(true)}
        >
          <View style={[styles.accionIcono, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="link-outline" size={26} color={colores.terciario} />
          </View>
          <Text style={styles.accionTitulo}>Vincularme</Text>
          <Text style={styles.accionDesc}>Tengo un código de mi empleador</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.empresasHeader}>
        <Text style={styles.seccionTitulo}>Tus empresas vinculadas</Text>
        <Etiqueta texto={`${empresas.length} activa(s)`} variante="info" />
      </View>

      {empresas.map((emp) => (
        <View key={emp.id} style={styles.empresaCard}>
          <View style={styles.empresaTop}>
            <View style={styles.empresaIcono}>
              <Ionicons name="storefront-outline" size={24} color={colores.primarioContenedor} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.empresaNombreFila}>
                <Text style={styles.empresaNombre} numberOfLines={1}>
                  {emp.nombre}
                </Text>
              </View>

              <Text style={styles.empresaDireccion} numberOfLines={1}>
                {emp.direccion || 'Tarija · Bolivia'}
              </Text>
            </View>

            <Etiqueta
              texto={emp.rol === 'admin' ? 'Propietario' : 'Vendedor'}
              variante={emp.rol === 'admin' ? 'exito' : 'pendiente'}
              punto
            />
          </View>

          <Separador margenVertical={espacios.sm} />

          <Boton
            titulo="Entrar al espacio de trabajo"
            icono="arrow-forward-outline"
            iconoDerecha
            tamano="sm"
            variante="primario"
            onPress={() => entrarAEmpresa(emp)}
          />
        </View>
      ))}

      <Modal
        visible={modalRegistro}
        animationType="slide"
        transparent
        onRequestClose={() => setModalRegistro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <View style={styles.modalCabecera}>
              <View style={styles.modalTituloFila}>
                <Ionicons name="business" size={22} color={colores.primarioContenedor} />
                <Text style={styles.modalTitulo}>Registrar nueva empresa</Text>
              </View>
              <Pressable onPress={() => setModalRegistro(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colores.contorno} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Crea el espacio de trabajo de tu negocio. Se generará un código privado para tus empleados.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              <Campo
                etiqueta="Nombre del negocio *"
                valor={nombreEmpresa}
                onChangeText={setNombreEmpresa}
                placeholder="Ej. Mi negocio"
                icono="storefront-outline"
              />

              <Campo
                etiqueta="Dirección o ubicación"
                valor={direccionEmpresa}
                onChangeText={setDireccionEmpresa}
                placeholder="Calle, número y ciudad"
                icono="location-outline"
              />

              <Campo
                etiqueta="Teléfono / WhatsApp"
                valor={telefonoEmpresa}
                onChangeText={setTelefonoEmpresa}
                placeholder="Número de contacto"
                icono="call-outline"
                keyboardType="phone-pad"
              />

              {errorRegistro ? (
                <View style={styles.errorCaja}>
                  <Ionicons name="alert-circle" size={16} color={colores.error} />
                  <Text style={styles.errorTexto}>{errorRegistro}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalBotones}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                style={{ flex: 1 }}
                onPress={() => setModalRegistro(false)}
              />
              <Boton
                titulo="Crear empresa"
                variante="acento"
                style={{ flex: 1 }}
                cargando={creando}
                onPress={handleCrearEmpresa}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVinculo}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVinculo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <View style={styles.modalCabecera}>
              <View style={styles.modalTituloFila}>
                <Ionicons name="key" size={22} color={colores.terciario} />
                <Text style={styles.modalTitulo}>Vincularme a una empresa</Text>
              </View>
              <Pressable onPress={() => setModalVinculo(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colores.contorno} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Introduce el código privado único que te entregó tu empleador (formato NC-XXXXXXXXXXXX).
            </Text>

            <Campo
              etiqueta="Código privado de la empresa *"
              valor={codigoPrivado}
              onChangeText={setCodigoPrivado}
              placeholder="NC-XXXXXXXXXXXX"
              icono="key-outline"
              autoCapitalize="characters"
            />

            {errorVinculo ? (
              <View style={styles.errorCaja}>
                <Ionicons name="alert-circle" size={16} color={colores.error} />
                <Text style={styles.errorTexto}>{errorVinculo}</Text>
              </View>
            ) : null}

            <View style={styles.modalBotones}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                style={{ flex: 1 }}
                onPress={() => setModalVinculo(false)}
              />
              <Boton
                titulo="Vincularme"
                variante="acento"
                style={{ flex: 1 }}
                cargando={vinculando}
                onPress={handleVincularEmpresa}
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
  );
}

const styles = StyleSheet.create({
  perfilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.md,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    ...sombras.tarjeta,
  },
  perfilAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colores.primarioContenedor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfilNombre: {
    fontSize: 16,
    fontWeight: '800',
    color: colores.texto,
  },
  perfilCorreo: {
    fontSize: 12,
    color: colores.textoSuave,
    marginTop: 1,
  },
  botonSalir: {
    padding: espacios.sm,
    borderRadius: radios.md,
    backgroundColor: '#FFEAEA',
  },
  seccionSubtitulo: {
    fontSize: 13,
    color: colores.textoSuave,
    marginBottom: espacios.lg,
    lineHeight: 18,
  },
  accionesFila: {
    flexDirection: 'row',
    gap: espacios.md,
    marginBottom: espacios.xl,
  },
  accionCard: {
    flex: 1,
    borderRadius: radios.xl,
    padding: espacios.md,
    borderWidth: 1.5,
    backgroundColor: colores.superficie,
    ...sombras.tarjeta,
  },
  accionRegistro: {
    borderColor: '#C3DCFC',
  },
  accionVinculo: {
    borderColor: '#E8CCFB',
  },
  accionIcono: {
    width: 44,
    height: 44,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacios.sm,
  },
  accionTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: colores.texto,
  },
  accionDesc: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 3,
    lineHeight: 15,
  },
  empresasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacios.md,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: colores.texto,
  },
  empresaCard: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espacios.md,
    marginBottom: espacios.md,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    ...sombras.tarjeta,
  },
  empresaTop: {
    flexDirection: 'row',
    gap: espacios.md,
    alignItems: 'flex-start',
  },
  empresaIcono: {
    width: 48,
    height: 48,
    borderRadius: radios.lg,
    backgroundColor: colores.superficieBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empresaNombreFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  empresaNombre: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
  },
  empresaDireccion: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
  },
  codigoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  codigoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: colores.primarioContenedor,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContenido: {
    backgroundColor: colores.superficie,
    borderTopLeftRadius: radios.xxl,
    borderTopRightRadius: radios.xxl,
    padding: espacios.xl,
    paddingBottom: 36,
    ...sombras.modal,
  },
  modalCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espacios.sm,
  },
  modalTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: colores.texto,
  },
  modalSub: {
    fontSize: 12,
    color: colores.textoSuave,
    marginBottom: espacios.lg,
    lineHeight: 17,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: espacios.sm,
    marginTop: espacios.lg,
  },
  errorCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colores.errorFondo,
    borderRadius: radios.md,
    padding: espacios.sm,
    marginTop: espacios.xs,
  },
  errorTexto: {
    fontSize: 12,
    color: colores.errorTexto,
    fontWeight: '600',
  },
});
