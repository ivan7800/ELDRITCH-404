# Verificación de ELDRITCH-404 v0.10.0

| Comprobación | Resultado |
|---|---|
| Guardar y cargar | Guardado manual conserva la expedición en pausa; Guardar y salir vuelve al título; Cargar partida restaura hora, estado de juego y campaña. |
| Animación | Doce filas de investigador usan cuadros de reposo, carrera, daño y esquiva; el gesto de ataque toma el arma activa. Render comprobado para los diez escenarios y carga máxima de 225 enemigos. |
| Base | v0.7.0, árbol `eb5ac6f`. |
| Investigadores | Doce rasgos bilingües visibles en la preparación; pruebas de protección, esquiva y coste de cordura. |
| Simulación | 35 pruebas correctas. Cubren campaña de diez capítulos, 20 jefes, seis finales, juramentos, modos, rasgos, restauración y migración de perfil. |
| Arte y renderizado | Se decodificaron los diez fondos. Las 33 celdas de las tres láminas tienen contenido y transparencia exterior. Diez cuadros distintos; carga con 225 enemigos y revisión de combate, avisos y alto contraste. |
| Interfaz | Bestiario con 65 fichas y notas. La preparación muestra el arma y el rasgo exclusivo del personaje. Vista móvil de 390 × 844. |
| Compilación | `npm run build` y tres pruebas correctas del HTML integrado, guardado y recursos de precaché. |
| Navegador | Campaña de diez capítulos y epílogo; mando simulado, teclado, táctil, PWA instalada y sin conexión, y arranque portátil desde `file://`. |
| Rendimiento simulado | Victoria en 309,87 s, 1.377 bajas, pico de 33 enemigos, carga de prueba con 225 enemigos y p95 de 1,17 ms en el renderizador aislado. |
| Hardware | Pendientes mando físico y mediciones en Steam Deck. |

Para repetir las pruebas, ejecuta `npm test`, `npm run build`, `node --test tests/build.test.mjs`, `node tests/render.cjs`, `npm run test:browser` y `node tests/browser-campaign.cjs`. Usa `CHROMIUM_PATH` para seleccionar un binario instalado.
