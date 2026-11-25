import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CLAVE_LICENCIA = 'nexcash_licencia_demo_v1';
const VERSION_LICENCIA = 1;
const DURACION_MS = 10 * 24 * 60 * 60 * 1000;
const TOLERANCIA_RELOJ_MS = 5 * 60 * 1000;
const SAL_FIRMA = 'nexcash-demo-2026-kehila-josue';

export const ESTADO = {
  VERIFICANDO: 'verificando',
  ACTIVA: 'activa',
  VENCIDA: 'vencida',
  INVALIDA: 'invalida',
};

function calcularFirma({ v, activacion, ultimaComprobacion }) {
  const contenido = `${SAL_FIRMA}|${v}|${activacion}|${ultimaComprobacion}`;
  let hash = 2166136261;

  for (let i = 0; i < contenido.length; i += 1) {
    hash ^= contenido.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function crearRegistro(activacion, ultimaComprobacion) {
  const registro = {
    v: VERSION_LICENCIA,
    activacion,
    ultimaComprobacion,
  };

  return { ...registro, firma: calcularFirma(registro) };
}

async function leerRegistroCrudo() {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(CLAVE_LICENCIA) ?? null;
  }

  return SecureStore.getItemAsync(CLAVE_LICENCIA);
}

async function guardarRegistroCrudo(texto) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(CLAVE_LICENCIA, texto);
    if (globalThis.localStorage?.getItem(CLAVE_LICENCIA) !== texto) {
      throw new Error('No se pudo guardar la licencia local.');
    }
    return;
  }

  await SecureStore.setItemAsync(CLAVE_LICENCIA, texto);
}

async function borrarRegistroCrudo() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(CLAVE_LICENCIA);
    return;
  }

  await SecureStore.deleteItemAsync(CLAVE_LICENCIA);
}

function esRegistroValido(registro) {
  if (!registro || typeof registro !== 'object' || Array.isArray(registro)) return false;

  const { v, activacion, ultimaComprobacion, firma } = registro;
  if (v !== VERSION_LICENCIA) return false;
  if (!Number.isSafeInteger(activacion) || !Number.isSafeInteger(ultimaComprobacion)) return false;
  if (activacion <= 0 || ultimaComprobacion <= 0) return false;
  if (typeof firma !== 'string' || firma.length !== 8) return false;

  return calcularFirma(registro) === firma;
}

export async function verificarLicencia() {
  const ahora = Date.now();
  let crudo;

  try {
    crudo = await leerRegistroCrudo();
  } catch {
    return ESTADO.INVALIDA;
  }

  if (crudo == null) {
    try {
      await guardarRegistroCrudo(JSON.stringify(crearRegistro(ahora, ahora)));
      return ESTADO.ACTIVA;
    } catch {
      return ESTADO.INVALIDA;
    }
  }

  let registro;
  try {
    registro = JSON.parse(crudo);
  } catch {
    return ESTADO.INVALIDA;
  }

  if (!esRegistroValido(registro)) return ESTADO.INVALIDA;
  if (registro.activacion > ahora + TOLERANCIA_RELOJ_MS) return ESTADO.INVALIDA;
  if (ahora < registro.ultimaComprobacion - TOLERANCIA_RELOJ_MS) return ESTADO.INVALIDA;

  const nuevaComprobacion = Math.max(registro.ultimaComprobacion, ahora);
  if (nuevaComprobacion !== registro.ultimaComprobacion) {
    try {
      await guardarRegistroCrudo(
        JSON.stringify(crearRegistro(registro.activacion, nuevaComprobacion))
      );
    } catch {
      return ESTADO.INVALIDA;
    }
  }

  return ahora - registro.activacion >= DURACION_MS ? ESTADO.VENCIDA : ESTADO.ACTIVA;
}

export function useLicencia() {
  const [estado, setEstado] = useState(ESTADO.VERIFICANDO);

  useEffect(() => {
    let montado = true;

    verificarLicencia()
      .then((resultado) => {
        if (montado) setEstado(resultado);
      })
      .catch(() => {
        if (montado) setEstado(ESTADO.INVALIDA);
      });

    return () => {
      montado = false;
    };
  }, []);

  return estado;
}

async function fijarRegistro(registro) {
  await guardarRegistroCrudo(JSON.stringify(registro));
}

export async function simularVencimiento() {
  if (!__DEV__) return;

  const ahora = Date.now();
  await fijarRegistro(crearRegistro(ahora - DURACION_MS - 60 * 1000, ahora));
}

export async function reiniciarLicencia() {
  if (!__DEV__) return;

  await borrarRegistroCrudo();
}

if (__DEV__ && typeof globalThis !== 'undefined') {
  globalThis.__nexcashLicencia = {
    vencer: simularVencimiento,
    reiniciar: reiniciarLicencia,
  };
}
