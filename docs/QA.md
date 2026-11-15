# Verificación de ELDRITCH-404 v0.2.0

| Comprobación | Resultado |
|---|---|
| Simulación automatizada | La campaña recorre diez capítulos desde un perfil vacío en dificultad Historia con mejoras ganadas. El piloto combate con las reglas normales. El perfil se serializa y recupera entre capítulos. |
| Contenido | Se comprueban 12 investigadores, 10 escenarios, 60 armas, 120 mejoras de familia, 45 criaturas presentes en las oleadas, 20 jefes, 30 reliquias, 40 logros y 7 modos. |
| Combate | Cada arma se prueba sobre un objetivo. Cada receta ampliada se puede completar. Los veinte jefes emiten un ataque y alcanzan la segunda fase. |
| Rejugabilidad | Los seis modos alternativos se ejercitan en simulación. Infinito repite jefes y registra una marca al retirarse. Las seis condiciones de final se verifican por separado. |
| Persistencia | Se comprueba la migración de v1 a v2 y la equivalencia de dos simulaciones tras guardar, restaurar y repetir las mismas entradas. |
| Renderizado | Canvas en Node dibuja cuadros distintos de los diez escenarios con personajes, jefes y señales de contraste. La prueba de carga dibuja 225 enemigos activos. |
| Web | Compilación autónoma, arranque y navegación básica mediante DOM simulado. Se comprueba que los recursos para caché se sirven por HTTP. |
| Navegador real | El Chromium instalado aborta cuando intenta abrir un socket Unix. La descarga del motor headless alternativo quedó bloqueada en el entorno. Playwright se conserva para ejecutarlo en CI o en otra máquina. |
| Escritorio | Se comprueba el empaquetado previo del HTML, iconos y licencia. La instalación de las dependencias de Electron quedó bloqueada, por lo que el ZIP contiene el proyecto y el flujo para producir los ejecutables. |
| En equipos de destino | Pendientes las sesiones humanas de equilibrio, la escucha, los mandos físicos, Steam Deck, la instalación offline de la PWA y la prueba de actualización entre versiones en el navegador. |
| GitHub | La consulta de `ivan7800/ELDRITCH-404` devolvió 404 y el entorno carece de una sesión autenticada de GitHub CLI. El proyecto conserva los flujos de calidad, Pages y escritorio. |

Para repetir las pruebas, ejecuta `npm test`, `npm run build`, `node --test tests/build.test.mjs` y `node tests/render.cjs`. Para los recorridos de navegador, instala Playwright y Chromium según README y ejecuta `npm run test:browser`.

La simulación mide reglas y continuidad. Valorar la dificultad, la diversidad de partidas y la sensación de los controles requiere jugar en el navegador y los dispositivos de destino.
