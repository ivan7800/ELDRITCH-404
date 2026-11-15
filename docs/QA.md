# Verificación de ELDRITCH-404 v0.6.0

| Comprobación | Resultado |
|---|---|
| Base v0.5.0 | `64c7bf4`. Pasaron 29 pruebas de simulación, 3 de compilación y la suite de Chromium. |
| Simulación | 34 pruebas correctas. Cubren 20 jefes, seis condiciones de final, modos alternativos, restauración de expediciones y migración de perfil. |
| Equilibrio | Una pasada completa en Estándar con progresión de Archivo y consecuencias de Historia. Diez victorias y los diez ataques de segunda fase observados. |
| Segunda fase | En una pasada de Historia se observaron los diez ataques de segunda fase. Se restauraron avisos y peligros pendientes en nueve jefes y se comprobó por separado la resaca de Innsmouth. Los relojes del Manicomio avisan antes de invertir un proyectil, incluso después de reanudar el guardado. |
| Juramentos | Los tres se completaron en Innsmouth y en el Corazón del Caos en dificultad Historia. En Chromium, Contra la marea conservó el tiempo reducido tras guardar y recargar, concedió 16 sellos adicionales al ganar y preservó la decisión del capítulo. |
| Consecuencia de Historia | Pruebas de salud, resistencia, daño y cordura inicial. El menú del capítulo siguiente muestra la consecuencia de la decisión registrada. |
| Renderizado | Revisión visual de los nueve mapas nuevos, diez cuadros distintos y una prueba de carga de 225 enemigos con efectos reducidos. |
| Compilación | Tres pruebas de HTML portátil, guardado y disponibilidad de los recursos de precaché. |
| Navegador | Los diez capítulos, decisiones tras recargar y epílogo «La costa del amanecer». También teclado, mando simulado, táctil a 390 × 844, idioma, PWA sin conexión y arranque portátil. |
| Actualización PWA | Se restauró una expedición suspendida en v0.5.0 tras actualizar a v0.6.0 y se recargó la instalación sin conexión. |
| Hardware | Pendientes mando físico, fotogramas en Steam Deck y escucha de la mezcla en hardware real. |

Para repetir las pruebas, ejecuta `npm test`, `npm run build`, `node --test tests/build.test.mjs`, `node tests/render.cjs`, `npm run test:browser` y `node tests/browser-campaign.cjs`. Usa `CHROMIUM_PATH` para seleccionar un binario instalado.
