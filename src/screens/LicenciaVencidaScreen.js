import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { colores, espacios, radios, sombras, tipografia } from '../theme';
import { ESTADO } from '../services/licencia';

export default function LicenciaVencidaScreen({ estado = ESTADO.VENCIDA }) {
  const cargando = estado === ESTADO.VERIFICANDO;
  const invalida = estado === ESTADO.INVALIDA;

  return (
    <LinearGradient
      colors={['#003F78', '#00539A', '#5E0086']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.contenedor}
    >
      <StatusBar style="light" />

      <View style={styles.marca}>
        <Image source={require('../../assets/nexcash.jpg')} style={styles.logo} />
        <Text style={styles.nombreMarca}>NexCash</Text>
      </View>

      <View style={styles.tarjeta}>
        {cargando ? (
          <View style={styles.cuerpoCarga}>
            <ActivityIndicator size="large" color={colores.primario} />
            <Text style={styles.titulo}>Verificando licencia</Text>
            <Text style={styles.mensaje}>
              Comprobando la licencia de demostración de NexCash...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.circuloBloqueo}>
              <Ionicons name="lock-closed-outline" size={38} color={colores.error} />
            </View>

            <Text style={styles.titulo}>Período de demostración finalizado</Text>
            <Text style={styles.mensaje}>
              Esta versión de NexCash ha finalizado su período de demostración. El acceso al sistema está restringido
            </Text>

            {invalida ? (
              <Text style={styles.avisoInvalida}>
                No se pudo verificar la licencia almacenada en este dispositivo. El acceso permanece restringido por seguridad.
              </Text>
            ) : null}

            <View style={styles.separador} />

            <Text style={styles.avisoPropiedad}>
              Software de autoría propia. Uso académico y demostrativo. Su redistribución como versión de producción no está autorizada.
            </Text>
          </>
        )}
      </View>

      <View style={styles.pie}>
        <Text style={styles.piePrincipal}>NexCash · Software de autoría propia</Text>
        <Text style={styles.pieSecundario}>Kehila Molina · Josue Arroyo</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    paddingHorizontal: espacios.xl,
    paddingVertical: espacios.xxl,
    justifyContent: 'space-between',
  },
  marca: {
    alignItems: 'center',
    gap: espacios.sm,
    marginTop: espacios.xl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  nombreMarca: {
    ...tipografia.marca,
    color: colores.textoSobrePrimario,
    textAlign: 'center',
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.lg,
    padding: espacios.xl,
    ...sombras.tarjeta,
  },
  circuloBloqueo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.errorFondo,
    alignSelf: 'center',
    marginBottom: espacios.lg,
  },
  titulo: {
    ...tipografia.titulo,
    color: colores.texto,
    textAlign: 'center',
    marginBottom: espacios.md,
  },
  mensaje: {
    ...tipografia.cuerpoGrande,
    color: colores.textoSuave,
    textAlign: 'center',
    lineHeight: 24,
  },
  avisoInvalida: {
    ...tipografia.cuerpo,
    color: colores.errorTexto,
    textAlign: 'center',
    marginTop: espacios.md,
  },
  separador: {
    height: 1,
    backgroundColor: colores.borde,
    marginVertical: espacios.lg,
  },
  avisoPropiedad: {
    ...tipografia.cuerpo,
    color: colores.contorno,
    textAlign: 'center',
    lineHeight: 20,
  },
  cuerpoCarga: {
    alignItems: 'center',
    paddingVertical: espacios.lg,
  },
  pie: {
    alignItems: 'center',
    gap: espacios.xs,
    marginBottom: espacios.md,
  },
  piePrincipal: {
    ...tipografia.etiqueta,
    color: colores.textoSobrePrimario,
    textAlign: 'center',
  },
  pieSecundario: {
    ...tipografia.micro,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },
});
