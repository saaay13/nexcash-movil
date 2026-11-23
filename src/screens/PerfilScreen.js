import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Boton, Campo } from '../components/atoms';
import { DialogoConfirmacion } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { colores, espacios, radios, sombras } from '../theme';
import { actualizarPerfil, mensajeError } from '../database';
import { useSesion } from '../context';

export default function PerfilScreen() {
  const navigation = useNavigation();
  const { usuario, empresa, actualizarUsuario, cerrarSesion } = useSesion();

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [correo, setCorreo] = useState(usuario?.correo ?? '');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [dialogo, setDialogo] = useState({
    visible: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Entendido',
    textoCancelar: null,
    onConfirmar: null,
    onCancelar: null,
  });

  function cerrarDialogo() {
    setDialogo((d) => ({ ...d, visible: false }));
  }

  function aviso(tipo, titulo, mensaje) {
    setDialogo({
      visible: true,
      tipo,
      titulo,
      mensaje,
      textoConfirmar: 'Entendido',
      textoCancelar: null,
      onConfirmar: cerrarDialogo,
      onCancelar: null,
    });
  }

  async function guardar() {
    if (!usuario?.id) return;

    setGuardando(true);
    try {
      const datos = await actualizarPerfil({
        id: usuario.id,
        nombre,
        correo,
        telefono,
      });
      actualizarUsuario(datos);
      setEditando(false);
      aviso('exito', 'Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch (e) {
      aviso('advertencia', 'No se pudo guardar', mensajeError(e, 'Revisa los datos e intenta de nuevo.'));
    } finally {
      setGuardando(false);
    }
  }

  function pedirCerrarSesion() {
    setDialogo({
      visible: true,
      tipo: 'advertencia',
      titulo: 'Cerrar sesión',
      mensaje: 'Se cerrará la sesión activa en este dispositivo. ¿Deseas continuar?',
      textoConfirmar: 'Cerrar sesión',
      textoCancelar: 'Cancelar',
      onConfirmar: () => {
        cerrarDialogo();
        cerrarSesion();
        navigation.replace('Bienvenida');
      },
      onCancelar: cerrarDialogo,
    });
  }

  const iniciales = String(usuario?.nombre ?? 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
  const rol = (empresa?.rol ?? usuario?.rol) === 'admin' ? 'Administrador' : 'Vendedor';
  const codigo = empresa?.codigo_vinculacion || empresa?.codigo_privado;

  return (
    <Pantalla
      titulo="Mi perfil"
      descripcion="Consulta y actualiza tus datos personales y tu espacio de trabajo."
    >
      <LinearGradient
        colors={['#003F78', '#00539A', '#5E0086']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tarjetaPerfil}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciales || 'U'}</Text>
        </View>
        <View style={styles.datosPerfil}>
          <Text style={styles.nombre} numberOfLines={1}>
            {usuario?.nombre || 'Usuario'}
          </Text>
          <Text style={styles.correo} numberOfLines={1}>
            {usuario?.correo || 'Sin correo registrado'}
          </Text>
          <View style={styles.badgeRol}>
            <Text style={styles.badgeRolTexto}>{rol}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tarjeta}>
        <View style={styles.cabeceraTarjeta}>
          <View style={styles.tituloTarjeta}>
            <Ionicons name="person-outline" size={17} color={colores.primarioContenedor} />
            <Text style={styles.titulo}>Datos personales</Text>
          </View>
          {!editando ? (
            <Pressable onPress={() => setEditando(true)} hitSlop={8}>
              <Text style={styles.enlace}>Editar</Text>
            </Pressable>
          ) : null}
        </View>

        {editando ? (
          <View style={styles.formulario}>
            <Campo
              etiqueta="Nombre"
              valor={nombre}
              onChangeText={setNombre}
              icono="person-outline"
              autoCapitalize="words"
            />
            <Campo
              etiqueta="Correo"
              valor={correo}
              onChangeText={setCorreo}
              icono="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Campo
              etiqueta="Teléfono"
              valor={telefono}
              onChangeText={setTelefono}
              icono="call-outline"
              keyboardType="phone-pad"
              placeholder="Opcional"
            />
            <View style={styles.filaBotones}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                tamano="sm"
                onPress={() => {
                  setNombre(usuario?.nombre ?? '');
                  setCorreo(usuario?.correo ?? '');
                  setTelefono(usuario?.telefono ?? '');
                  setEditando(false);
                }}
                style={styles.botonMedio}
              />
              <Boton
                titulo="Guardar"
                icono="save-outline"
                tamano="sm"
                cargando={guardando}
                onPress={guardar}
                style={styles.botonMedio}
              />
            </View>
          </View>
        ) : (
          <View style={styles.filas}>
            <FilaDato etiqueta="Nombre" valor={usuario?.nombre || '—'} />
            <FilaDato etiqueta="Correo" valor={usuario?.correo || '—'} />
            <FilaDato etiqueta="Teléfono" valor={usuario?.telefono || 'No registrado'} />
          </View>
        )}
      </View>

      <View style={styles.tarjeta}>
        <View style={styles.cabeceraTarjeta}>
          <View style={styles.tituloTarjeta}>
            <Ionicons name="business-outline" size={17} color={colores.primarioContenedor} />
            <Text style={styles.titulo}>Espacio de trabajo</Text>
          </View>
        </View>
        <View style={styles.filas}>
          <FilaDato etiqueta="Empresa" valor={empresa?.nombre || 'Sin empresa activa'} />
          <FilaDato etiqueta="Rol en la empresa" valor={rol} />
          {codigo ? <FilaDato etiqueta="Código de acceso" valor={codigo} /> : null}
          {empresa?.direccion ? (
            <FilaDato etiqueta="Dirección" valor={empresa.direccion} />
          ) : null}
          {empresa?.telefono ? (
            <FilaDato etiqueta="Teléfono" valor={empresa.telefono} />
          ) : null}
        </View>
      </View>

      <View style={styles.tarjeta}>
        <View style={styles.cabeceraTarjeta}>
          <View style={styles.tituloTarjeta}>
            <Ionicons name="settings-outline" size={17} color={colores.primarioContenedor} />
            <Text style={styles.titulo}>Opciones de la cuenta</Text>
          </View>
        </View>

        <Opcion
          icono="business-outline"
          titulo="Cambiar de empresa"
          detalle="Selecciona otro negocio o crea uno nuevo"
          onPress={() => navigation.navigate('EmpresaSeleccion')}
        />
        <Opcion
          icono="log-out-outline"
          titulo="Cerrar sesión"
          detalle="Salir de la cuenta activa"
          peligro
          onPress={pedirCerrarSesion}
        />
      </View>

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

function FilaDato({ etiqueta, valor }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Text style={styles.valor} numberOfLines={2}>
        {valor}
      </Text>
    </View>
  );
}

function Opcion({ icono, titulo, detalle, onPress, peligro = false }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.opcion, pressed && styles.opcionPresionada]}
      onPress={onPress}
    >
      <View style={[styles.iconoOpcion, peligro && styles.iconoPeligro]}>
        <Ionicons name={icono} size={19} color={peligro ? colores.error : colores.primarioContenedor} />
      </View>
      <View style={styles.opcionTextos}>
        <Text style={[styles.opcionTitulo, peligro && styles.textoPeligro]}>{titulo}</Text>
        <Text style={styles.opcionDetalle}>{detalle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={colores.contornoSuave} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjetaPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    padding: espacios.lg,
    borderRadius: radios.xxl,
    marginBottom: espacios.md,
    ...sombras.flotante,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  datosPerfil: {
    flex: 1,
    minWidth: 0,
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  correo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  badgeRol: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radios.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: espacios.sm,
  },
  badgeRolTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
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
  cabeceraTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacios.sm,
  },
  tituloTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '800',
    color: colores.texto,
  },
  enlace: {
    fontSize: 12,
    fontWeight: '800',
    color: colores.primarioContenedor,
  },
  filas: {
    gap: espacios.sm,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: espacios.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  etiqueta: {
    fontSize: 12,
    color: colores.textoSuave,
  },
  valor: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: colores.texto,
  },
  formulario: {
    marginTop: espacios.xs,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: espacios.sm,
    marginTop: espacios.xs,
  },
  botonMedio: {
    flex: 1,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingVertical: espacios.sm,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  opcionPresionada: {
    opacity: 0.65,
  },
  iconoOpcion: {
    width: 38,
    height: 38,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficieBaja,
  },
  iconoPeligro: {
    backgroundColor: colores.errorFondo,
  },
  opcionTextos: {
    flex: 1,
    minWidth: 0,
  },
  opcionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.texto,
  },
  textoPeligro: {
    color: colores.errorTexto,
  },
  opcionDetalle: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
  },
});
