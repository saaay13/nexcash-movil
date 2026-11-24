import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { FilaConfiguracion } from '../components/molecules';
import { Pantalla } from '../components/templates';
import { colores, espacios, radios } from '../theme';
import { useConfiguracion, useSesion } from '../context';

export default function ConfiguracionScreen() {
  const navigation = useNavigation();
  const { empresa } = useSesion();
  const {
    sonidoEscaneo,
    vibracionEscaneo,
    mostrarCodigoEmpresa,
    cambiarPreferencia,
  } = useConfiguracion();

  const codigo = empresa?.codigo_vinculacion || empresa?.codigo_privado;

  return (
    <Pantalla
      titulo="Configuración"
      descripcion="Ajusta los avisos del escáner, decide si se ve el código de tu negocio y administra los productos ocultos."
    >
      <Text style={styles.seccionTitulo}>AVISOS AL ESCANEAR</Text>
      <View style={styles.tarjeta}>
        <FilaConfiguracion
          icono="volume-high-outline"
          colorIcono="#00539A"
          fondoIcono="#E8F1FC"
          titulo="Sonido al escanear"
          subtitulo="Pitido al agregar un producto a la venta"
          valor={sonidoEscaneo}
          onCambiar={(valor) => cambiarPreferencia('sonidoEscaneo', valor)}
        />
        <View style={styles.divisor} />
        <FilaConfiguracion
          icono="vibrate-outline"
          colorIcono="#5E0086"
          fondoIcono="#F5E8FF"
          titulo="Vibración al escanear"
          subtitulo="Aviso tangible en el mismo momento"
          valor={vibracionEscaneo}
          onCambiar={(valor) => cambiarPreferencia('vibracionEscaneo', valor)}
        />
      </View>

      <Text style={styles.seccionTitulo}>CÓDIGO DE LA EMPRESA</Text>
      <View style={styles.tarjeta}>
        <Pressable
          style={styles.filaBoton}
          onPress={() =>
            cambiarPreferencia('mostrarCodigoEmpresa', !mostrarCodigoEmpresa)
          }
          accessibilityLabel={
            mostrarCodigoEmpresa ? 'Ocultar código de empresa' : 'Mostrar código de empresa'
          }
        >
          <View style={[styles.iconoCaja, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="key-outline" size={20} color="#0369A1" />
          </View>
          <View style={styles.textos}>
            <Text style={styles.titulo}>
              {mostrarCodigoEmpresa ? 'Ocultar código de empresa' : 'Mostrar código de empresa'}
            </Text>
            <Text style={styles.subtitulo}>
              {mostrarCodigoEmpresa
                ? 'Toca el ojo para volver a ocultarlo.'
                : 'Toca el ojo para revelarlo en esta pantalla.'}
            </Text>
          </View>
          <Ionicons
            name={mostrarCodigoEmpresa ? 'eye-outline' : 'eye-off-outline'}
            size={22}
            color="#0369A1"
          />
        </Pressable>

        {mostrarCodigoEmpresa && codigo ? (
          <View style={styles.codigoCaja}>
            <Text style={styles.codigoEtiqueta}>Código de acceso</Text>
            <Text style={styles.codigoTexto}>{codigo}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.seccionTitulo}>PRODUCTOS</Text>
      <View style={styles.tarjeta}>
        <Pressable
          style={styles.filaBoton}
          onPress={() => navigation.navigate('ProductosEliminados')}
          accessibilityLabel="Abrir productos eliminados"
        >
          <View style={[styles.iconoCaja, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="trash-outline" size={20} color="#B45309" />
          </View>
          <View style={styles.textos}>
            <Text style={styles.titulo}>Productos eliminados</Text>
            <Text style={styles.subtitulo}>
              Revisa los productos ocultos y reactívalos cuando quieras.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colores.contornoSuave} />
        </Pressable>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  seccionTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: colores.textoSuave,
    letterSpacing: 0.8,
    marginTop: espacios.lg,
    marginBottom: espacios.sm,
    marginLeft: 2,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    borderWidth: 1,
    borderColor: colores.contornoSuave,
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xs,
  },
  divisor: {
    height: 1,
    backgroundColor: '#EEF0F6',
    marginHorizontal: espacios.sm,
  },
  filaBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.md,
    paddingVertical: 12,
    paddingHorizontal: espacios.sm,
    borderRadius: radios.lg,
  },
  iconoCaja: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.texto,
  },
  subtitulo: {
    fontSize: 11,
    color: colores.textoSuave,
    marginTop: 2,
    lineHeight: 16,
  },
  codigoCaja: {
    backgroundColor: colores.superficieBaja,
    borderRadius: radios.lg,
    padding: espacios.md,
    marginHorizontal: espacios.sm,
    marginBottom: espacios.md,
    alignItems: 'center',
  },
  codigoEtiqueta: {
    fontSize: 11,
    color: colores.textoSuave,
    fontWeight: '700',
  },
  codigoTexto: {
    fontSize: 18,
    fontWeight: '800',
    color: colores.texto,
    letterSpacing: 1,
    marginTop: 4,
  },
});
