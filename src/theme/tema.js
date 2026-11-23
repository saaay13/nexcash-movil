
export const colores = {
  primario: '#003F78',
  primarioContenedor: '#00539A',
  secundario: '#0061A3',
  secundarioContenedor: '#67B4FF',
  neon: '#97E9FF',
  terciario: '#5E0086',
  terciarioContenedor: '#7B2BA2',
  lila: '#DAB2F4',

  fondo: '#F6F8FF',
  superficie: '#FFFFFF',
  superficieBaja: '#EDF3FF',
  superficieMedia: '#E1ECFF',
  superficieAlta: '#E2EBFA',
  superficieMax: '#DAE3F2',
  borde: '#EEF0F6',

  texto: '#17202E',
  textoSuave: '#4D5665',
  contorno: '#7C8491',
  contornoSuave: '#CBD5E1',
  textoSobrePrimario: '#FFFFFF',

  error: '#C51F27',
  errorFondo: '#FFE0E0',
  errorTexto: '#B00020',
  exito: '#065F46',
  exitoFondo: '#ECFDF5',
  alerta: '#B45309',
  alertaFondo: '#FEF3C7',
  alertaBorde: '#FDE68A',

  sombra: '#17365C',
};

export const tipografia = {
  marca: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  titulo: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  tituloSeccion: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  cuerpo: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  cuerpoGrande: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  cuerpoFuerte: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  etiqueta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  micro: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  moneda: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  monedaMedia: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  numero: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
};

export const espacios = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radios = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,
};

export const sombras = {
  tarjeta: {
    shadowColor: colores.sombra,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  flotante: {
    shadowColor: colores.sombra,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modal: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
};

export function bs(valor) {
  return `Bs ${Number(valor || 0).toFixed(2)}`;
}
