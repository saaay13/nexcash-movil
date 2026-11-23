import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Boton, Campo } from '../components/atoms';
import { colores, espacios, radios, sombras } from '../theme';
import { mensajeError, registrarUsuario } from '../database';

export default function RegistroScreen() {
  const navigation = useNavigation();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            gestureState.dx > 15 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 50 || (gestureState.dx > 25 && gestureState.vx > 0.3)) {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }
        },
      }),
    [navigation]
  );

  function limpiarError() {
    if (error) setError('');
  }

  function validar() {
    const n = nombre.trim();
    const c = correo.trim().toLowerCase();
    const p = password.trim();
    const cf = confirmar.trim();

    if (!n) return 'El nombre completo es obligatorio.';
    if (n.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (!c) return 'El correo electrónico es obligatorio.';
    if (!c.includes('@') || !c.includes('.')) return 'Ingresa un correo válido (ej. juan@correo.com).';
    if (!p) return 'La contraseña es obligatoria.';
    if (p.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (p !== cf) return 'Las contraseñas no coinciden. Verifica e intenta de nuevo.';
    return null;
  }

  async function registrar() {
    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setCargando(true);
    setError('');

    try {
      await registrarUsuario({
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        password: password.trim(),
        rol: 'admin',
      });
      setExito(true);
    } catch (e) {
      setError(mensajeError(e, 'No se pudo crear la cuenta. Intenta de nuevo.'));
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <LinearGradient
        colors={['#003F78', '#00539A', '#5E0086']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fondo}
      >
        <View style={styles.exitoContenedor}>
          <View style={styles.exitoIconoWrap}>
            <Ionicons name="checkmark-circle" size={64} color="#4ADE80" />
          </View>
          <Text style={styles.exitoTitulo}>¡Cuenta creada!</Text>
          <Text style={styles.exitoSubtitulo}>
            Tu cuenta fue registrada exitosamente.{'\n'}
            Ahora podés iniciar sesión con tus credenciales.
          </Text>
          <View style={styles.exitoDatos}>
            <Ionicons name="person-outline" size={15} color="#CFE1FF" />
            <Text style={styles.exitoDatosTexto}>{nombre.trim()}</Text>
          </View>
          <View style={styles.exitoDatos}>
            <Ionicons name="mail-outline" size={15} color="#CFE1FF" />
            <Text style={styles.exitoDatosTexto}>{correo.trim().toLowerCase()}</Text>
          </View>
          <Boton
            titulo="Ir a iniciar sesión"
            icono="log-in-outline"
            variante="acento"
            tamano="lg"
            onPress={() => navigation.replace('Login')}
            style={{ marginTop: espacios.xxl, width: '100%' }}
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#003F78', '#00539A', '#5E0086']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fondo}
      {...panResponder.panHandlers}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.botonVolver}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Volver a la bienvenida"
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <View style={styles.marca}>
            <Image
              source={require('../../assets/nexcash.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.titulo}>Crear cuenta</Text>
            <Text style={styles.lema}>Registrate para gestionar tu negocio</Text>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaTitulo}>Datos de tu cuenta</Text>
            <Text style={styles.tarjetaSubtitulo}>
              Completá el formulario para crear tu cuenta de administrador.
            </Text>

            <Campo
              etiqueta="Nombre completo"
              valor={nombre}
              onChangeText={(v) => { setNombre(v); limpiarError(); }}
              placeholder="Ej. Juan Pérez"
              icono="person-outline"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Campo
              etiqueta="Correo electrónico"
              valor={correo}
              onChangeText={(v) => { setCorreo(v); limpiarError(); }}
              placeholder="juan@correo.com"
              icono="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Campo
              etiqueta="Contraseña"
              valor={password}
              onChangeText={(v) => { setPassword(v); limpiarError(); }}
              placeholder="Mínimo 6 caracteres"
              icono="lock-closed-outline"
              sufijo={mostrarPass ? 'eye-off-outline' : 'eye-outline'}
              onSufijoPress={() => setMostrarPass((p) => !p)}
              secureTextEntry={!mostrarPass}
            />

            <Campo
              etiqueta="Confirmar contraseña"
              valor={confirmar}
              onChangeText={(v) => { setConfirmar(v); limpiarError(); }}
              placeholder="Repetí la contraseña"
              icono="shield-checkmark-outline"
              sufijo={mostrarConfirmar ? 'eye-off-outline' : 'eye-outline'}
              onSufijoPress={() => setMostrarConfirmar((p) => !p)}
              secureTextEntry={!mostrarConfirmar}
            />

            {password.length > 0 && (
              <IndicadorFuerza password={password} />
            )}

            {error ? (
              <View style={styles.errorCaja}>
                <Ionicons name="alert-circle-outline" size={18} color={colores.error} />
                <Text style={styles.errorTexto}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.avisoCaja}>
              <Ionicons name="information-circle-outline" size={16} color="#00539A" />
              <Text style={styles.avisoTexto}>
                Tu cuenta se creará como <Text style={{ fontWeight: '700' }}>Administrador</Text>.
                Podrás registrar o vincularte a una empresa al iniciar sesión.
              </Text>
            </View>

            <Boton
              titulo={cargando ? 'Creando cuenta...' : 'Crear mi cuenta'}
              icono="person-add-outline"
              variante="acento"
              deshabilitado={cargando}
              onPress={registrar}
              style={{ marginTop: espacios.sm }}
            />

            <View style={styles.separador} />

            <View style={styles.loginFila}>
              <Text style={styles.loginTexto}>¿Ya tenés una cuenta?</Text>
              <Pressable onPress={() => navigation.replace('Login')} style={styles.loginLink}>
                <Text style={styles.loginLinkTexto}>Iniciar sesión</Text>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function IndicadorFuerza({ password }) {
  function calcularFuerza(p) {
    let puntos = 0;
    if (p.length >= 6) puntos++;
    if (p.length >= 10) puntos++;
    if (/[A-Z]/.test(p)) puntos++;
    if (/[0-9]/.test(p)) puntos++;
    if (/[^a-zA-Z0-9]/.test(p)) puntos++;
    return puntos;
  }

  const fuerza = calcularFuerza(password);
  const niveles = [
    { label: 'Muy débil', color: '#EF4444' },
    { label: 'Débil',     color: '#F97316' },
    { label: 'Regular',   color: '#EAB308' },
    { label: 'Buena',     color: '#22C55E' },
    { label: 'Fuerte',    color: '#16A34A' },
  ];
  const nivel = niveles[Math.min(fuerza - 1, 4)] || niveles[0];
  const barras = Math.max(1, fuerza);

  return (
    <View style={fStyles.contenedor}>
      <View style={fStyles.barras}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              fStyles.barra,
              { backgroundColor: i <= barras ? nivel.color : '#E5E7EB' },
            ]}
          />
        ))}
      </View>
      <Text style={[fStyles.etiqueta, { color: nivel.color }]}>{nivel.label}</Text>
    </View>
  );
}

const fStyles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: espacios.sm,
  },
  barras: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  barra: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    padding: 22,
    paddingVertical: 36,
  },
  botonVolver: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacios.lg,
  },
  marca: {
    alignItems: 'center',
    marginBottom: espacios.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: espacios.md,
    ...sombras.flotante,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  lema: {
    color: '#CFE1FF',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: espacios.xl,
    ...sombras.modal,
  },
  tarjetaTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: colores.texto,
    marginBottom: 2,
  },
  tarjetaSubtitulo: {
    fontSize: 12,
    color: colores.textoSuave,
    marginBottom: espacios.md,
  },
  errorCaja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacios.sm,
    backgroundColor: colores.errorFondo,
    borderRadius: radios.md,
    padding: espacios.md,
    marginBottom: espacios.md,
  },
  errorTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colores.errorTexto,
  },
  avisoCaja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EAF2FB',
    borderRadius: radios.md,
    padding: espacios.md,
    borderWidth: 1,
    borderColor: '#C8DEF4',
    marginBottom: espacios.md,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 11,
    color: '#003F78',
    lineHeight: 16,
  },
  separador: {
    height: 1,
    backgroundColor: colores.borde,
    marginVertical: espacios.lg,
  },
  loginFila: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  loginTexto: {
    fontSize: 13,
    color: colores.textoSuave,
  },
  loginLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  loginLinkTexto: {
    fontSize: 13,
    fontWeight: '800',
    color: colores.primarioContenedor,
  },
  pieAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: espacios.xl,
  },
  pieTexto: {
    fontSize: 10,
    color: '#D4E2FF',
    textAlign: 'center',
  },
  exitoContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  exitoIconoWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacios.xl,
  },
  exitoTitulo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: espacios.md,
  },
  exitoSubtitulo: {
    color: '#CFE1FF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: espacios.xl,
  },
  exitoDatos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radios.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: espacios.sm,
  },
  exitoDatosTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
