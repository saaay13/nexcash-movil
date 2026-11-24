import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { preload, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import {
  guardarPreferenciaEscaneo,
  obtenerPreferenciasEscaneo,
} from '../database';

const sonidoEscaneo = require('../../assets/sounds/pitido.wav');
preload(sonidoEscaneo);

const PREFERENCIAS_INICIALES = {
  sonidoEscaneo: true,
  vibracionEscaneo: true,
  mostrarCodigoEmpresa: false,
};

const ConfiguracionContext = createContext(null);

export function ConfiguracionProvider({ children }) {
  const [preferencias, setPreferencias] = useState(PREFERENCIAS_INICIALES);
  const reproductor = useAudioPlayer(sonidoEscaneo);

  useEffect(() => {
    let activo = true;
    obtenerPreferenciasEscaneo()
      .then((datos) => {
        if (activo) setPreferencias(datos);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  const cambiarPreferencia = useCallback(async (nombre, valor) => {
    setPreferencias((actual) => ({ ...actual, [nombre]: valor }));
    try {
      await guardarPreferenciaEscaneo(nombre, valor);
    } catch {
      // El cambio sigue activo durante la sesión aunque no se pueda guardar.
    }
  }, []);

  const notificarEscaneo = useCallback(() => {
    if (preferencias.sonidoEscaneo) {
      reproductor.seekTo(0);
      reproductor.play();
    }
    if (preferencias.vibracionEscaneo) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, [preferencias, reproductor]);

  const valor = useMemo(
    () => ({
      sonidoEscaneo: preferencias.sonidoEscaneo,
      vibracionEscaneo: preferencias.vibracionEscaneo,
      mostrarCodigoEmpresa: preferencias.mostrarCodigoEmpresa,
      cambiarPreferencia,
      notificarEscaneo,
    }),
    [preferencias, cambiarPreferencia, notificarEscaneo]
  );

  return (
    <ConfiguracionContext.Provider value={valor}>
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracion() {
  const contexto = useContext(ConfiguracionContext);
  if (!contexto) {
    throw new Error('useConfiguracion debe utilizarse dentro de ConfiguracionProvider.');
  }
  return contexto;
}
