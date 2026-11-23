import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [empresa, setEmpresa] = useState(null);

  const iniciarSesion = useCallback((usuarioLogueado) => {
    setUsuario(usuarioLogueado ?? null);
    setEmpresa(null);
  }, []);

  const seleccionarEmpresa = useCallback((empresaSeleccionada) => {
    setEmpresa(empresaSeleccionada ?? null);
  }, []);

  const cerrarSesion = useCallback(() => {
    setUsuario(null);
    setEmpresa(null);
  }, []);

  const actualizarUsuario = useCallback((datos) => {
    setUsuario((actual) => (actual ? { ...actual, ...datos } : actual));
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      empresa,
      usuarioId: usuario?.id ?? null,
      empresaId: empresa?.id ?? null,
      iniciarSesion,
      seleccionarEmpresa,
      actualizarUsuario,
      cerrarSesion,
    }),
    [usuario, empresa, iniciarSesion, seleccionarEmpresa, actualizarUsuario, cerrarSesion]
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error('useSesion debe utilizarse dentro de SesionProvider.');
  }
  return contexto;
}
