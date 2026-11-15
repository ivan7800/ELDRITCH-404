# Verificación de ELDRITCH-404 v0.7.0

| Comprobación | Resultado |
|---|---|
| Base | v0.6.0, `52a1cc3`. |
| Simulación | 34 pruebas correctas. Cubren 20 jefes, seis condiciones de final, juramentos, modos alternativos, restauración de expediciones y migración de perfil. |
| Arte y renderizado | Se decodificaron los diez fondos. Las 33 celdas de las tres láminas tienen contenido y transparencia exterior. Diez cuadros distintos, prueba de carga con 225 enemigos y revisión de combate, avisos y navegación en modo de efectos reducidos. |
| Interfaz | Bestiario con 65 fichas y notas en vista táctil de 390 × 844, con retratos servidos tanto en la versión web como en el HTML portátil. |
| Compilación | Tres pruebas correctas del HTML integrado, restauración y recursos de precaché. |
| Navegador | Campaña completa de diez capítulos, decisiones tras recargar y epílogo «La costa del amanecer». Teclado, mando simulado, táctil, PWA sin conexión y arranque portátil desde `file://`. |
| Actualización PWA | Una expedición suspendida en v0.6.0 se reanudó en v0.7.0 tras actualizar en subruta. La instalación actualizada volvió a cargar sin red. |
| Hardware | Pendientes mando físico y mediciones en Steam Deck. |

Para repetir las pruebas, ejecuta `npm test`, `npm run build`, `node --test tests/build.test.mjs`, `node tests/render.cjs`, `npm run test:browser` y `node tests/browser-campaign.cjs`. Usa `CHROMIUM_PATH` para seleccionar un binario instalado.
