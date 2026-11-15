# Verificación de ELDRITCH-404 v0.5.0

| Comprobación | Resultado |
|---|---|
| Base v0.4.0 | `2a6b2eb`. Pasaron 26 pruebas de simulación, 3 de compilación y la suite de Chromium. |
| Simulación | 29 pruebas correctas. Diez capítulos, seis condiciones de final, veinte jefes, modos alternativos, migración de perfil y restauración de expediciones suspendidas. |
| Innsmouth | Cuatro semillas en dificultad estándar por cada primera mejora (campana, arpón y escopeta). Doce victorias y doce avisos de resaca. Se comprobó el coste de la baliza en bajamar y pleamar, la trayectoria del arpón y el desplazamiento de la campana. |
| Resaca | La primera acción que la Sacristana prepara tras el cambio de fase deja un hueco. Un jugador en ese hueco evita el daño después de restaurar un guardado escrito durante el aviso. |
| Renderizado | Diez escenas distintas, prueba de carga con 225 enemigos y revisión de imágenes de bajamar, pleamar y el ataque de la Sacristana, incluido alto contraste y efectos reducidos. |
| Compilación | 3 pruebas correctas. El HTML incorpora el arte, inicia y restaura una partida. Todos los recursos de precaché están disponibles. |
| Navegador | Teclado, mando simulado, idioma, victoria, derrota y reinicio. Arranque portátil desde `file://`, pausa y guardado táctiles a 390 × 844 y PWA sin conexión. |
| Campaña en navegador | Diez capítulos y epílogo «La costa del amanecer». El piloto comienza por el menú y recarga antes de resolver cada decisión. |
| Actualización PWA | Una expedición suspendida en v0.4.0 se reanuda en v0.5.0 después de actualizar una instalación en subruta. La nueva versión también recarga sin conexión. |
| Hardware | Pendientes la prueba con mando físico, los fotogramas en Steam Deck y la escucha en hardware real. |

Ejecuta `npm test`, `npm run build`, `node --test tests/build.test.mjs`, `node tests/render.cjs`, `npm run test:browser` y `node tests/browser-campaign.cjs` para repetir las comprobaciones. El README describe las dependencias de desarrollo. Usa `CHROMIUM_PATH` para seleccionar un binario instalado.
