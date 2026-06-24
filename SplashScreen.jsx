import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';
import { useSplashLoader } from './useSplashLoader';

/**
 * Pantalla de splash que espera tanto a que la animación termine
 * como a que los datos iniciales estén listos.
 *
 * Props:
 *   loadData  — función async con tu lógica de carga real
 *   onReady   — callback cuando todo está listo para navegar
 *   variant   — 'simple' (default) | 'complex'
 */
export function SplashScreen({ loadData, onReady, variant = 'simple' }) {
  const source =
    variant === 'complex'
      ? require('./femebal-splash-complex.json')
      : require('./femebal-splash-simple.json');

  const { ready, onAnimFinish } = useSplashLoader(loadData);

  // Navega en cuanto ambos (animación + datos) terminaron
  if (ready) {
    onReady();
    return null;
  }

  return (
    <View style={styles.container}>
      <LottieView
        source={source}
        autoPlay
        loop={false}
        onAnimationFinish={onAnimFinish}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
});
