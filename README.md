# Femebal — Animaciones de Splash Screen

Animaciones Lottie de producción para la pantalla de intro de la app de **Femebal** (Federación Metropolitana de Básquet).

Generadas a partir del logo oficial SVG de Femebal, sin librerías externas.

---

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `femebal-splash-simple.json` | Versión 1 — fade + scale suave |
| `femebal-splash-complex.json` | Versión 2 — reveal de izquierda a derecha |
| `logo-femebal.svg` | Logo original SVG |
| `femebal-logo-optimized.svg` | Logo SVG limpio, sin metadata |
| `FemebalSplash.jsx` | Componente React Native (sin Lottie, usa `Animated` API) |
| `intro-animation.html` | Demo visual para previsualizar en el browser |
| `generate-lottie.js` | Script Node.js que genera los archivos JSON desde el SVG |

---

## Animaciones

### Versión 1 — Simple

> Estilo Uber: el logo aparece limpio y rápido.

- **Duración:** 1100 ms
- **Canvas:** 1080 × 1920 px
- **FPS:** 60
- **Fondo:** `#0D0D0D`

**Estructura de capas:**

```
Layer 0 — FEMEBAL Logo (shape layer)
  └─ 14 paths del logo (icono + wordmark juntos)
  └─ Fill: #FEFEFE
  └─ Keyframes:
       opacity  0 → 100  frames 9–33  (ease-out)
       scale   90 → 100  frames 9–33  (ease-out)

Layer 1 — Background (solid #0D0D0D)
```

**Timeline:**

| Tiempo | Frames | Acción |
|--------|--------|--------|
| 0–150 ms | 0–9 | Pantalla vacía |
| 150–550 ms | 9–33 | Logo aparece con fade + scale |
| 550–1100 ms | 33–66 | Logo en estado final, sin movimiento |

---

### Versión 2 — Complex

> El logo se construye de izquierda a derecha con máscara de barrido.

- **Duración:** 1500 ms
- **Canvas:** 1080 × 1920 px
- **FPS:** 60
- **Fondo:** `#0D0D0D`

**Estructura de capas:**

```
Layer 0 — Icon (shape layer)
  └─ 3 paths del emblema principal
  └─ Máscara: rect sweep izquierda → derecha  frames 9–48

Layer 1 — Wordmark (shape layer)
  └─ 11 paths de las letras F E M E B A L
  └─ Máscara: rect sweep izquierda → derecha  frames 48–72

Layer 2 — Background (solid #0D0D0D)
```

**Timeline:**

| Tiempo | Frames | Acción |
|--------|--------|--------|
| 0–150 ms | 0–9 | Pantalla vacía |
| 150–800 ms | 9–48 | Icono se revela de izquierda a derecha |
| 800–1200 ms | 48–72 | Wordmark se revela de izquierda a derecha |
| 1200–1500 ms | 72–90 | Logo completo, sin movimiento |

---

## Cómo previsualizar

**Opción A — LottieFiles (sin instalar nada)**

1. Ir a [lottiefiles.com/preview](https://lottiefiles.com/preview)
2. Arrastrar `femebal-splash-simple.json` o `femebal-splash-complex.json`

**Opción B — Browser local**

Abrir `intro-animation.html` directamente en el browser.
Incluye botón **Replay** para repetir la animación.

---

## Integración en React Native

### Instalación

```bash
# npm
npm install lottie-react-native

# Expo
npx expo install lottie-react-native
```

### Componente

```jsx
import LottieView from 'lottie-react-native';

// Versión simple
export function SplashSimple({ onFinish }) {
  return (
    <LottieView
      source={require('./femebal-splash-simple.json')}
      autoPlay
      loop={false}
      onAnimationFinish={onFinish}
      style={{ flex: 1 }}
      resizeMode="cover"
    />
  );
}

// Versión complex
export function SplashComplex({ onFinish }) {
  return (
    <LottieView
      source={require('./femebal-splash-complex.json')}
      autoPlay
      loop={false}
      onAnimationFinish={onFinish}
      style={{ flex: 1 }}
      resizeMode="cover"
    />
  );
}
```

### Navegación (React Navigation)

```jsx
// App.js
function RootNavigator() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashSimple onFinish={() => setSplashDone(true)} />;
  }
  return <MainNavigator />;
}
```

### Alternativa sin Lottie (solo Animated API)

Si no querés agregar `lottie-react-native`, usá el componente incluido:

```jsx
import FemebalSplash from './FemebalSplash';

// Requiere: npm install react-native-svg
<FemebalSplash onFinish={() => navigation.replace('Home')} />
```

---

## Regenerar los JSON

Si modificás el SVG del logo, regenerá los archivos Lottie:

```bash
node generate-lottie.js
```

Esto actualiza `femebal-splash-simple.json` y `femebal-splash-complex.json`
a partir de `logo-femebal.svg`.

---

## Stack

- **Formato de animación:** Lottie JSON v5.9.0
- **Generación:** Node.js (sin dependencias externas)
- **Plataforma target:** React Native (iOS + Android)
- **Reproductor:** `lottie-react-native` / `lottie-web`

---

## Licencia

Assets de Femebal — uso interno.
