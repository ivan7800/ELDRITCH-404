# Verificación de ELDRITCH-404 v0.4.0

| Comprobación | Resultado |
|---|---|
| Base v0.3.0 | `2549fb1`. Compilación, 25 pruebas de simulación, suite de navegador y campaña completa correctas con Chromium Headless Shell. |
| Simulación | 26 pruebas. Diez capítulos desde un perfil nuevo con serialización entre capítulos, seis condiciones de final, veinte jefes, transición durante un ataque anunciado, registros y todos los modos. Migración de perfil v1 y restauración de una partida suspendida. Cuatro semillas completan la expedición inicial en dificultad estándar. |
| Compilación | 3 pruebas. El HTML incorpora sus gráficos, inicia y restaura una partida. El servidor entrega todos los recursos declarados por el Service Worker. |
| Renderizado | Los diez mapas generan cuadros diferentes. La prueba de carga dibuja 225 enemigos en modo de efectos reducidos. Es una medida de Canvas en Node. |
| Navegador | Teclado, mando simulado, idioma, victoria en Innsmouth, persistencia de decisión después de recargar, derrota y reinicio. PWA con red deshabilitada y HTML autónomo desde `file://`. Vista táctil de 390 × 844 con arranque, controles, pausa y guardado. |
| Campaña en navegador | El piloto entra por el menú normal, vence a los diez jefes principales en dificultad Historia, recarga antes de resolver cada decisión y comprueba el epílogo «La costa del amanecer» en la bitácora. Usa el reloj de pruebas local y entradas normales de combate. |
| Portada y audio | Menú revisado a 1280 × 800 y 390 × 844. El ajuste de movimiento reducido desactiva niebla y reflejos animados. Chromium inicia el sintetizador Web Audio mediante una interacción con el menú. |
| Progresión | En Historia, se recupera un registro con controles normales, se guarda, se reanuda y se comprueba que la siguiente expedición empieza con +12 de salud y consume el suministro. |
| Actualización PWA | En una subruta, al cerrar la pestaña de v0.3.0 se activa v0.4.0. Se reanuda el guardado anterior y se recarga sin conexión. |
| Hardware | Queda pendiente medir los fotogramas en Steam Deck, probar un mando físico y escuchar la mezcla en una sesión humana. |

Ejecuta `npm test`, `npm run build`, `node --test tests/build.test.mjs`, `node tests/render.cjs`, `npm run test:browser` y `node tests/browser-campaign.cjs` para repetir las comprobaciones. El README describe las dependencias de desarrollo. Usa `CHROMIUM_PATH` para seleccionar un binario instalado.
