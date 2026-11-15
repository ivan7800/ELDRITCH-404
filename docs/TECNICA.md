# Arquitectura y entrega

## Decisiones

JavaScript modular y Canvas 2D permiten distribuir un HTML portátil que incluye sus gráficos. Los módulos ES se ejecutan sin transformaciones durante desarrollo. El compilador para el HTML autónomo empaqueta exclusivamente el subconjunto de declaraciones `import` y `export` usado por el proyecto.

| Módulo | Responsabilidad |
|---|---|
| `src/content.mjs` | Armas, recetas, estadísticas, tabla de oleadas, hitos del mapa y textos de contenido |
| `src/campaign.mjs` | Sellos, árbol permanente, logros, reliquias, desbloqueos, decisiones y finales |
| `src/simulation.mjs` | Entidades, IA, aparición, combate, rituales, experiencia, estados y eventos |
| `src/math.mjs` | Distancias, RNG por semilla, índice espacial y pools |
| `src/render.mjs` | Cámara, atlas, orden en profundidad, señales y dibujo de efectos |
| `src/input.mjs` | Teclas, diagonales, cruceta, sticks, zonas muertas y pulsaciones de flanco |
| `src/app.mjs` | Escenas, entrada de interfaz, bucle, HUD y flujo de expediente |
| `src/storage.mjs` | Validación del perfil, recuperación y registro de resultados |
| `src/audio.mjs` | Audio bajo gesto de usuario, síntesis, mezcla y secuencias |
| `tools/build.mjs` | Web estática, Service Worker versionado por hash y edición portátil |

## Datos y reglas

La simulación recibe paso, intención de movimiento y dimensiones de cámara. El paso fijo es 1/60 s. La interfaz desacopla el tiempo real del tiempo de juego en pausa y en pantallas de elección. La semilla gobierna decisiones de combate y generación. Los ataques publican eventos efímeros para el audio y para transiciones. Cambiar vecindario, telegráficos o cadencia añade pruebas por patrón.

Los proyectiles consultan un índice espacial de celdas de 64 unidades. El renderizador usa un atlas, recorta por cámara, reutiliza imágenes y dibuja a media resolución del mundo. Los pools limitan proyectiles propios a 300, peligros a 110, fragmentos a 360 y efectos a 240. La oleada deja de solicitar enemigos a partir de 225. Una oleada ya iniciada puede superar ese umbral por el remanente de la misma y la llegada del jefe. El tablero de pausa presenta FPS medio y p95 del intervalo entre los últimos 360 fotogramas activos, sin enviar datos.

El perfil local versión 2 añade la campaña y las opciones de control. La carga admite versión 1 y conserva sus datos previos. Se validan enumeraciones, límites, identificadores conocidos y tamaño de importación. La clave primaria tiene una copia del último perfil válido. **Guardar y salir** escribe una segunda clave con las entidades, la configuración y el estado del generador aleatorio. El perfil exportado se puede trasladar a otro origen.

## Riesgos y comprobaciones

| Riesgo | Medida y puerta de salida |
|---|---|
| Todas las armas piden la misma distancia | Contrastar control de pasillos, armas de proximidad y esquiva en partidas humanas grabadas |
| El jefe desaparece bajo una construcción potente | Comprobar ambas fases y al menos tres emisiones de patrón en cuatro semillas de referencia |
| La reducción de cordura oculta telegráficos | Comparar los mismos ataques con efectos reducidos y habituales |
| Stutter tardío, sobre todo en Deck | Capturar intervalos entre frames en 1280 × 800 tras el minuto tres y en el jefe; objetivo p95 de 16,7 ms en equipo de referencia por definir y medir |
| Datos corruptos o actualización a medias | Respaldo, importación validada, caché de todos los recursos y activación tras cerrar pestañas anteriores |
| Regresiones de mando | Probar movimiento, selección, ajustes, pausa, desconexión y recuperación en navegador con mando físico |
| Escalado de producción | Añadir una zona por entrega, recuperar el perfil previo y registrar una victoria completa antes de sumar la próxima |

## GitHub y builds

GitHub Pages publica el sitio estático del repositorio desde `main`. Ejecuta la compilación y conserva alineados el sitio de la raíz, su copia en `dist/`, la caché y el HTML portátil. Tras subir los cambios comprueba la ejecución de `pages build and deployment`, el SHA que desplegó y la versión visible en la portada.

La carpeta `desktop/` empaqueta el HTML con Electron. El protocolo local mantiene constante el origen del guardado y sirve únicamente el HTML del juego. El flujo Desktop builds solicita los destinos NSIS y portable para Windows y AppImage para Linux. Los resultados se validan en el sistema de destino tras compilar. [Configuración de destinos de electron-builder](https://www.electron.build/docs/targets/)
