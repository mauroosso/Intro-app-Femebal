# intro-app-femebal

Animación intro/splash para la app de Femebal (Federación Metropolitana de Básquet).
Relacionada al ecosistema LarrySport.

## Objetivo

Loading screen estilo Uber: logo Femebal aparece con fade + scale sobre fondo negro,
para la pantalla de introducción de la app mobile.

## Assets disponibles

- `logo-femebal.svg` — logo Femebal (162x191px, paths en blanco #FEFEFE)
- `svg-vector-larrysportlogo.svg` — logo vectorial de LarrySport
- `Gemini_Generated_Image_vvwhbhvvwhbhvvwh.png` — imagen generada
- `larrysport-cah-web-300x155.png` — logo LarrySport versión web

## Stack / Plataforma

- **React Native** (mobile)
- Implementación: React Native `Animated` API (sin dependencias extra)
- SVG renderizado con `react-native-svg`

## Tipo de animación

- **Loading screen estilo Uber**: fade in + scale (0.7 → 1.0) del logo
- Versión simple, sin personajes animados
- Demo visual en HTML para prototipado rápido

## Colores

- Fondo: `#000000` (negro)
- Logo: `#FFFFFF` (blanco)
- Acento: `#004AD4` (azul Femebal/LarrySport)

## Notas técnicas

- El enfoque elegido es React Native Animated API (más rápido, sin deps extra)
- Demo HTML (`intro-animation.html`) sirve para previsualizar sin correr RN
- Componente RN: `FemebalSplash.jsx`
