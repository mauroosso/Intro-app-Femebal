import { useEffect, useRef, useState } from 'react';

/**
 * Coordina la animación de splash con la carga real de datos.
 * Solo retorna ready=true cuando AMBAS terminaron.
 *
 * @param {() => Promise<void>} loadFn  función async con tu lógica de carga
 * @returns {{ ready: boolean, onAnimFinish: () => void }}
 */
export function useSplashLoader(loadFn) {
  const [animDone, setAnimDone] = useState(false);
  const [dataDone, setDataDone] = useState(false);
  const loadStarted = useRef(false);

  useEffect(() => {
    if (loadStarted.current) return;
    loadStarted.current = true;

    loadFn()
      .catch(err => console.warn('[useSplashLoader] loadFn error:', err))
      .finally(() => setDataDone(true));
  }, []);

  return {
    ready: animDone && dataDone,
    onAnimFinish: () => setAnimDone(true),
  };
}
