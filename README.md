# ELDRITCH-404 · v0.3.0

Juego de acción roguelite y horror cósmico. La expedición inaugural en **Innsmouth Olvidada** dura cinco minutos hasta la llegada de la Sacristana de la Marea. Sobrevive, reúne fragmentos y derrota al jefe para obtener la credencial de veterano.

En **Historia** hay diez capítulos conectados. Una victoria abre la decisión de ese capítulo y el siguiente mapa. Los rescates, las anclas y las marcas acumuladas cambian el epílogo. Puedes repetir capítulos para cambiar sus decisiones y conservar los finales descubiertos en el Cuaderno.

## Jugar

1. Extrae el ZIP y abre **ELDRITCH-404.html** con un navegador actual. El HTML incluye el arte, el audio se genera durante el juego y no requiere conexión.
2. Pulsa **Comenzar expedición → Entrar en el muelle**. En **Modos alternativos → Modo libre** puedes acceder desde el principio a todos los mapas y personajes. La sección **Campaña** permite volver a capítulos abiertos y consultar los finales descubiertos.
3. Aprovecha las primeras oleadas para recoger fragmentos cerca de los enemigos. Las flechas en el borde del escenario señalan los rituales o al jefe.
4. Cambia a dificultad **Historia** desde Opciones para reducir daño, velocidad y resistencia enemiga en la siguiente partida.

| Acción | Teclado | Mando estándar |
|---|---|---|
| Mover | WASD o flechas | Stick izquierdo o cruceta |
| Ataques | Automáticos | Automáticos |
| Esquivar | Espacio o Mayús | A o LB |
| Ritual | E | X |
| Pausa / volver | Esc | Menú o B |
| Menús | Tab y Enter, flechas en botones | Cruceta/stick y A/B |
| Elegir mejora | 1, 2 o 3, o Enter sobre la tarjeta | Cruceta/stick y A |

**Evoluciones.** Escopeta III + Resina negra desbloquea Temporal de sal. Campana III + Salmo de lastre desbloquea Coro de los ahogados. Las recetas se consultan en el Cuaderno de campo. La evolución aparece al subir de nivel una vez reunidos sus requisitos.

**Archivo.** Las bajas y victorias dan sellos para mejoras permanentes. Cada mapa tiene tres reliquias recuperables. Puedes equipar una antes de empezar. Los jefes alternativos se eligen en la preparación de modos ajenos a Historia.

**Modos.** Historia, Supervivencia, Partida rápida, Infinito, Pesadilla, Desafío y Modo libre. Infinito permite registrar la marca desde la pausa. Desafío usa semilla fija, una sola arma y dificultad estándar. Libre permite elegir un mapa, personaje, jefe y duración desde el principio.

## Servir, compilar y probar

Requiere Node.js 22 o superior para trabajar sobre el código. El HTML incluido funciona sin Node.js.

```sh
npm test
npm run build
npm start
```

`npm run build` actualiza el HTML autocontenido y construye `dist/` con la versión web y la caché offline. `npm start` sirve en `http://127.0.0.1:4040`. Para servir exactamente la compilación, usa `ELDRITCH_WEB_ROOT=dist node tools/serve.mjs` en Bash o asigna `$env:ELDRITCH_WEB_ROOT='dist'` en PowerShell y ejecuta `node tools/serve.mjs`.

El juego carece de dependencias de ejecución. Para pruebas opcionales, instala `playwright` y `@napi-rs/canvas` como herramientas de desarrollo (`npm install --no-save playwright @napi-rs/canvas`), prepara Chromium con `npx playwright install chromium` y ejecuta `npm run test:browser`, `node tests/browser-campaign.cjs` y `node tests/render.cjs`. `CHROMIUM_PATH` permite usar un Chromium instalado. Para regenerar PNG, usa `python3 tools/art.py` con Pillow.

## Perfiles

Opciones, estadísticas, decisiones, hallazgos y desbloqueos se guardan localmente. Desde Opciones puedes exportar o importar el JSON del perfil, incluso en formato v1. Usa la exportación si cambias de navegador, equipo, ruta del HTML u origen web. En pausa, **Guardar y salir** conserva el estado exacto de la expedición local. El archivo exportado contiene el perfil. La expedición suspendida se conserva en el navegador original.

## Plataformas

- **Navegador** · HTML portátil y versión estática preparada para un servidor HTTPS. GitHub Pages puede servir `dist/` desde una subruta.
- **Windows / Linux** · abre el HTML en un navegador reciente. Los lanzadores `JUGAR-WINDOWS.bat` y `JUGAR-LINUX.sh` abren ese mismo fichero. En Linux también puedes ejecutar `sh JUGAR-LINUX.sh` desde el directorio extraído.
- **Steam Deck** · desde el modo escritorio abre el HTML o la web con Chromium/Chrome. Para Steam Input selecciona un perfil de mando estándar. La interfaz apunta a 1280 × 800 y dispone de texto grande y efectos reducidos. La validación en hardware sigue pendiente.
- **PWA** · instalación mediante el navegador compatible sobre HTTPS o localhost. El Service Worker instala un paquete completo, activa las actualizaciones cuando se cierran las pestañas antiguas y conserva el perfil por origen.

## Empaquetar la aplicación de escritorio

Ejecuta `npm run build`, `npm install --prefix desktop` y `npm run package --prefix desktop` en un sistema de compilación compatible. El flujo **Desktop builds** ejecuta esas etapas en Windows y Linux y prepara, respectivamente, NSIS y portable, o AppImage. Los artefactos se generan en `desktop/release/` en una compilación local. La aplicación Electron conserva un origen propio y estable para guardar el perfil.

Consulta [diseño y campaña](docs/BIBLIA.md), [arquitectura y publicación](docs/TECNICA.md), [contenido](docs/CATALOGO.md) y [resultados de QA](docs/QA.md).
