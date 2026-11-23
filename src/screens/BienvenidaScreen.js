import { Image, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Boton } from '../components/atoms';
import { espacios, radios, sombras } from '../theme';

export default function BienvenidaScreen() {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['#003F78', '#00539A', '#5E0086']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fondo}
    >
      <View style={styles.contenedor}>

        <View style={styles.centro}>
          <View style={styles.logoContenedor}>
            <View style={styles.logoSombra} />
            <Image
              source={require('../../assets/nexcash.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.titulo}>NexCash</Text>
          <Text style={styles.lema}>Gestiona desde tu celular</Text>
          <View style={styles.badgeUbicacion}>
            <Ionicons name="location-outline" size={13} color="#FFFFFF" />
            <Text style={styles.badgeTexto}>Tarija · Bolivia</Text>
          </View>
        </View>

        <View style={styles.pie}>
          <Boton
            titulo="Iniciar sesión"
            icono="log-in-outline"
            variante="acento"
            tamano="lg"
            onPress={() => navigation.navigate('Login')}
            style={styles.botonIngreso}
          />

          <View style={styles.separadorFila}>
            <View style={styles.separadorLinea} />
            <Text style={styles.separadorTexto}>¿No tenés cuenta?</Text>
            <View style={styles.separadorLinea} />
          </View>

          <Boton
            titulo="Crear cuenta nueva"
            icono="person-add-outline"
            variante="outline"
            tamano="lg"
            onPress={() => navigation.navigate('Registro')}
            style={styles.botonIngreso}
          />

        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  contenedor: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 56,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContenedor: {
    position: 'relative',
    marginBottom: espacios.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSombra: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ scale: 1.1 }],
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 36,
    overflow: 'hidden',
    ...sombras.flotante,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  lema: {
    color: '#CFE1FF',
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  badgeUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radios.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: espacios.lg,
  },
  badgeTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pie: {
    width: '100%',
    alignItems: 'center',
    gap: espacios.md,
  },
  botonIngreso: {
    width: '100%',
  },
  separadorFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  separadorLinea: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  separadorTexto: {
    fontSize: 12,
    color: '#CFE1FF',
    fontWeight: '500',
  },
  pieAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: espacios.xs,
  },
  pieTexto: {
    fontSize: 11,
    color: '#D4E2FF',
    textAlign: 'center',
  },
});
