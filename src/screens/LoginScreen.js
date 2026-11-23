import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
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
import { iniciarSesion, iniciarBD } from '../database';
import { useSesion } from '../context';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { iniciarSesion: guardarSesion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

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

  async function ingresar() {
    const correoLimpio = correo.trim().toLowerCase();
    const passLimpio = password.trim();

    if (!correoLimpio || !passLimpio) {
      setError('Completa el correo y la contraseña.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (passLimpio.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      await iniciarBD();
      const usuarioLogueado = await iniciarSesion(correoLimpio, passLimpio);
      guardarSesion(usuarioLogueado);
      navigation.replace('EmpresaSeleccion');
    } catch (e) {
      const mensaje = String(e?.message ?? '').toLowerCase();
      if (mensaje.includes('incorrectos') || mensaje.includes('contraseña')) {
        setError('Correo o contraseña incorrectos. Verifica tus datos.');
      } else {
        setError('No se pudo iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setCargando(false);
    }
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
        <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.titulo}>NexCash</Text>
            <Text style={styles.lema}>Gestiona desde tu celular</Text>
            <View style={styles.ubicacion}>
              <Ionicons name="location-outline" size={13} color="#FFFFFF" />
              <Text style={styles.ubicacionTexto}>Tarija · Bolivia</Text>
            </View>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaTitulo}>Iniciar sesión</Text>
            <Text style={styles.tarjetaTexto}>Accede al punto de venta de tu negocio.</Text>

            <View style={{ marginTop: espacios.sm }}>
              <Campo
                etiqueta="Correo electrónico"
                valor={correo}
                onChangeText={(val) => {
                  setCorreo(val);
                  if (error) setError('');
                }}
                placeholder="tu@correo.com"
                icono="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Campo
                etiqueta="Contraseña"
                valor={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                icono="lock-closed-outline"
                sufijo={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                onSufijoPress={() => setMostrarPassword((prev) => !prev)}
                secureTextEntry={!mostrarPassword}
              />
            </View>

            {error ? (
              <View style={styles.errorCaja}>
                <Ionicons name="alert-circle-outline" size={18} color={colores.error} />
                <Text style={styles.errorTexto}>{error}</Text>
              </View>
            ) : null}

            <Boton
              titulo={cargando ? 'Verificando...' : 'Iniciar Sesión'}
              icono="log-in-outline"
              variante="acento"
              deshabilitado={cargando}
              onPress={ingresar}
            />

            <View style={styles.separador} />

            <View style={styles.pieFila}>
              <Ionicons name="shield-checkmark-outline" size={15} color={colores.textoSuave} />
              <Text style={styles.pieTexto}>
                NexCash Móvil · KJ
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginBottom: espacios.md,
  },
  marca: {
    alignItems: 'center',
    marginBottom: espacios.xl,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: espacios.md,
    ...sombras.flotante,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  lema: {
    color: '#CFE1FF',
    fontSize: 13,
    marginTop: 4,
  },
  ubicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radios.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: espacios.md,
  },
  ubicacionTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: espacios.xl,
    ...sombras.modal,
  },
  tarjetaTitulo: {
    fontSize: 20,
    fontWeight: '800',
    color: colores.texto,
  },
  tarjetaTexto: {
    fontSize: 12,
    color: colores.textoSuave,
    marginTop: 3,
    marginBottom: espacios.sm,
  },
  errorCaja: {
    flexDirection: 'row',
    alignItems: 'center',
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
  separador: {
    height: 1,
    backgroundColor: colores.borde,
    marginVertical: espacios.lg,
  },
  pieFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  pieTexto: {
    fontSize: 10,
    color: colores.textoSuave,
    textAlign: 'center',
  },
});
