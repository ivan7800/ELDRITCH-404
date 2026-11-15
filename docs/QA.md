# Verificación de ELDRITCH-404 v0.3.0

| Comprobación | Resultado |
|---|---|
| Antes de editar | 25 pruebas de simulación y 3 de compilación correctas en el estado de `main` en `b31a1bc`. Chromium del sistema no pudo abrir un socket Unix. Se ejecutaron las pruebas de la candidata con el binario Chromium Headless Shell. |
| Simulación | 25 pruebas. Diez capítulos desde un perfil nuevo con serialización entre capítulos, seis condiciones de final, veinte jefes, todos los modos y migración de perfil v1. Cuatro semillas completan la expedición inicial en dificultad estándar. |
| Compilación | 3 pruebas. El HTML incorpora sus gráficos, inicia y restaura una partida. El servidor entrega todos los recursos declarados por el Service Worker. |
| Renderizado | Los diez mapas generan cuadros diferentes. La prueba de carga dibuja 225 enemigos en modo de efectos reducidos. Es una medida de Canvas en Node. |
| Navegador | Teclado, mando simulado, idioma, victoria en Innsmouth, persistencia de decisión después de recargar, derrota y reinicio. PWA con red deshabilitada y HTML autónomo desde `file://`. Vista táctil de 390 × 844 con arranque, controles, pausa y guardado. |
| Campaña en navegador | El piloto entra por el menú normal, vence a los diez jefes principales en dificultad Historia, recarga antes de resolver cada decisión y comprueba el epílogo «La costa del amanecer» en la bitácora. Usa el reloj de pruebas local y entradas normales de combate. |
| Hardware | Queda pendiente medir los fotogramas en Steam Deck, probar un mando físico y escuchar la mezcla en una sesión humana. |

Ejecuta `npm test`, `npm run build`, `node --test tests/build.test.mjs`, `node tests/render.cjs`, `npm run test:browser` y `node tests/browser-campaign.cjs` para repetir las comprobaciones. El README describe las dependencias de desarrollo. Usa `CHROMIUM_PATH` para seleccionar un binario instalado.
