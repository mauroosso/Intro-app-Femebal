import { useState } from 'react';
import { SplashScreen } from './SplashScreen';
// import MainNavigator from './navigation/MainNavigator'; // tu navegador principal

/**
 * Ejemplo de integración en el root de la app.
 *
 * Escenarios que maneja automáticamente:
 *   - Datos cargan antes que la animación  → espera a que termine la animación
 *   - Animación termina antes que los datos → espera a que terminen los datos
 *   - Error en la carga                    → igual navega (no traba la app)
 */
export default function App() {
  const [ready, setReady] = useState(false);

  async function loadInitialData() {
    // Reemplazá esto con tu lógica real: auth, prefetch, config, etc.
    await Promise.all([
      checkAuthSession(),
      fetchAppConfig(),
      prefetchHomeData(),
    ]);
  }

  if (!ready) {
    return (
      <SplashScreen
        loadData={loadInitialData}
        onReady={() => setReady(true)}
        variant="simple"   // 'simple' | 'complex'
      />
    );
  }

  return null; // <MainNavigator />
}

// ─── Ejemplos de funciones de carga ──────────────────────────────────────────

async function checkAuthSession() {
  // ej: await supabase.auth.getSession()
}

async function fetchAppConfig() {
  // ej: await fetch('https://api.femebal.com/config')
}

async function prefetchHomeData() {
  // ej: await queryClient.prefetchQuery(...)
}
