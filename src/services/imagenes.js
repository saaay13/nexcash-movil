import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const CARPETA_IMAGENES = 'nexcash-imagenes';

function extensionDe(asset) {
  const nombre = String(asset?.fileName ?? asset?.uri ?? '').split('?')[0];
  const coincidencia = nombre.match(/\.(jpe?g|png|webp|heic|gif)$/i);
  if (coincidencia) {
    const extension = coincidencia[1].toLowerCase();
    return extension === 'jpeg' ? 'jpg' : extension;
  }

  const mime = String(asset?.mimeType ?? '');
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('heic')) return 'heic';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

async function guardarImagen(asset, prefijo) {
  if (!asset?.uri) return null;

  if (Platform.OS === 'web') {
    if (asset.base64) {
      return `data:image/jpeg;base64,${asset.base64}`;
    }
    return asset.uri;
  }

  const { Directory, File, Paths } = require('expo-file-system');
  const carpeta = new Directory(Paths.document, CARPETA_IMAGENES);
  if (!carpeta.exists) carpeta.create();

  const destino = new File(carpeta, `${prefijo}-${Date.now()}.${extensionDe(asset)}`);

  try {
    await new File(asset.uri).copy(destino);
  } catch (_error) {
    if (!asset.base64) throw new Error('No se pudo guardar la imagen en el dispositivo.');
    await destino.write(asset.base64, { encoding: 'base64' });
  }

  return destino.uri;
}

async function abrirGaleria(prefijo, aspecto) {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    throw new Error('Necesitamos permiso para acceder a tus fotos.');
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: aspecto,
    quality: 0.7,
    base64: true,
  });

  if (resultado.canceled || !resultado.assets?.[0]) return null;
  return guardarImagen(resultado.assets[0], prefijo);
}

async function abrirCamara(prefijo, aspecto) {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) {
    throw new Error('Necesitamos permiso para usar la cámara.');
  }

  const resultado = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: aspecto,
    quality: 0.7,
    base64: true,
  });

  if (resultado.canceled || !resultado.assets?.[0]) return null;
  return guardarImagen(resultado.assets[0], prefijo);
}

export function elegirImagen({ prefijo = 'imagen', aspecto = [1, 1] } = {}) {
  if (Platform.OS === 'web') {
    return abrirGaleria(prefijo, aspecto);
  }

  return new Promise((resolve, reject) => {
    Alert.alert(
      'Seleccionar foto',
      '¿De dónde quieres tomar la foto?',
      [
        {
          text: 'Galería',
          onPress: () => abrirGaleria(prefijo, aspecto).then(resolve, reject),
        },
        {
          text: 'Cámara',
          onPress: () => abrirCamara(prefijo, aspecto).then(resolve, reject),
        },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true }
    );
  });
}
