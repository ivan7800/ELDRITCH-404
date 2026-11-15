# ELDRITCH-404

- Conserva el bucle de simulación independiente del navegador y del dibujo.
- Usa datos en `src/content.mjs` y textos bilingües para las mecánicas nuevas.
- Respeta el guardado versionado. Si cambias su formato, añade su migración y una prueba de recuperación.
- Ejecuta `npm test` y `npm run build` antes de preparar una versión. Ejecuta también la suite de navegador cuando Chromium esté disponible.
- Mantén el proceso de compilación sin llamadas de red. Si se incorpora una dependencia, documenta su función y licencia.
- Registra por separado simulación, pruebas de navegador y pruebas con hardware real.
