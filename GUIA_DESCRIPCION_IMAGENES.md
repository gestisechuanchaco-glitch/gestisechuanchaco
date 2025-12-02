# GUÍA PARA DESCRIBIR IMÁGENES EN EL MANUAL DE APLICACIÓN DEL CÓDIGO FUENTE

Esta guía detalla cómo capturar y describir cada imagen que debe incluirse en el Manual de Aplicación del Código Fuente del Sistema de Gestión de Defensa Civil.

---

## FORMATO GENERAL PARA DESCRIBIR IMÁGENES

Cada imagen debe tener:
1. **Título de la Figura:** "Figura X.Y: [Descripción breve]"
2. **Descripción detallada:** Explicación completa de lo que se muestra en la imagen
3. **Elementos clave resaltados:** Mención de los elementos importantes
4. **Líneas de conexión:** Si es necesario, mencionar líneas punteadas o anotaciones

---

## EJEMPLOS DETALLADOS DE DESCRIPCIONES DE IMÁGENES

### 1. PORTADA DEL MANUAL

**Título:** Portada del Manual de Aplicación del Código Fuente

**Descripción:**
"La portada del manual presenta un diseño limpio y profesional, dividida verticalmente en dos secciones principales: una izquierda de color blanco y una derecha de color azul oscuro (similar al estilo del ejemplo MAPIM).

En la **sección izquierda (blanca)**, se observa:
- En la parte superior izquierda, un patrón sutil de puntos grises claros que se desvanece hacia abajo
- Una línea horizontal corta de color rojo que actúa como acento visual
- El título principal en dos líneas:
  - "MANUAL DE APLICACIÓN" en color azul oscuro, mayúsculas, negrita
  - "DEL CÓDIGO FUENTE_" en color rojo, mayúsculas, negrita, con guion bajo al final
- Un subtítulo en gris: "Sistema de Gestión de Defensa Civil - Huanchaco"
- En la parte inferior, información sobre el equipo desarrollador y la fecha

En la **sección derecha (azul oscuro)**, se observa:
- En la parte superior, un logo blanco estilizado que representa un escudo o un libro abierto (logo de Defensa Civil)
- En la parte inferior derecha, el texto "Manual de Aplicación del Código Fuente - Sistema de Gestión de Defensa Civil - Huanchaco" en blanco y rojo, con el número de página "1" en grande y blanco"

---

### 2. CAPTURA DE PANTALLA DE INSTALACIÓN DE DEPENDENCIAS

**Título:** Figura 3.3: Instalación de dependencias del backend

**Descripción:**
"Esta captura de pantalla muestra la terminal de comandos (PowerShell en Windows o Terminal en Linux/macOS) durante la ejecución del comando `npm install` en el directorio `banckend`.

En la parte superior, se observa la ruta del directorio actual: `C:\Users\[Usuario]\defensacivil-frontend\banckend>` o similar.

El comando `npm install` se muestra ejecutándose, y en la salida se observan:
- Mensajes de progreso como "npm WARN" (advertencias menores) en amarillo
- Lista de paquetes siendo instalados: `express@4.18.2`, `mysql2@3.14.4`, `cors@2.8.5`, `dotenv@16.4.5`, `multer@2.0.2`
- Barras de progreso animadas para cada paquete
- Al final, un mensaje de éxito: "added X packages in Y seconds" o similar
- La creación de la carpeta `node_modules` con su contenido

En la parte inferior de la terminal, se muestra el prompt listo para el siguiente comando, indicando que la instalación se completó exitosamente.

**Elementos a resaltar:** El comando `npm install`, los nombres de los paquetes instalados, y el mensaje de éxito final."

---

### 3. CONFIGURACIÓN DEL ARCHIVO .ENV

**Título:** Figura 3.4: Configuración del archivo `.env` del backend

**Descripción:**
"Esta captura de pantalla muestra Visual Studio Code con el archivo `.env` abierto en el editor. El archivo se encuentra en el directorio `banckend/.env`.

En el panel izquierdo del explorador de archivos, se observa la estructura de carpetas con `banckend` expandido, mostrando los archivos: `index.js`, `db.js`, `package.json`, y `.env` resaltado.

En el editor principal, se muestra el contenido del archivo `.env`:

```
# Base de Datos
DB_HOST=localhost
DB_USER=defensacivil_user
DB_PASSWORD=********
DB_NAME=DefensaCivilH
DB_PORT=3306

# Servidor
PORT=3000
NODE_ENV=development

# API Externa
APIS_PERU_TOKEN=tu_token_aqui

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
```

Las variables están organizadas en secciones con comentarios que las agrupan. La contraseña (`DB_PASSWORD`) aparece ofuscada con asteriscos (`********`) para proteger la información sensible.

En la parte inferior del editor, se muestra la barra de estado indicando que el archivo está guardado y el tipo de archivo (`.env`).

**Elementos a resaltar:** Los nombres de las variables de entorno, los valores de ejemplo, y la ofuscación de la contraseña."

---

### 4. ESTRUCTURA DE DIRECTORIOS DEL FRONTEND

**Título:** Figura 4.2: Estructura de directorios del frontend

**Descripción:**
"Esta captura de pantalla muestra el explorador de archivos de Visual Studio Code con la estructura de directorios del proyecto `defensacivil-frontend` expandida.

En el panel izquierdo, se observa la jerarquía de carpetas:

```
defensacivil-frontend/
├── src/
│   ├── app/
│   │   ├── app.ts
│   │   ├── app.html
│   │   ├── app.css
│   │   ├── app.routes.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard.ts
│   │   │   ├── dashboard.html
│   │   │   └── dashboard.css
│   │   ├── solicitudes/
│   │   │   ├── solicitudes.ts
│   │   │   ├── solicitudes.html
│   │   │   └── solicitudes.css
│   │   ├── locales/
│   │   │   ├── locales.ts
│   │   │   ├── locales.html
│   │   │   └── locales.css
│   │   ├── fiscalizacion/
│   │   ├── calendario/
│   │   ├── notificaciones/
│   │   ├── login/
│   │   └── service/
│   ├── assets/
│   └── environments/
├── angular.json
├── package.json
└── tsconfig.json
```

Cada carpeta de módulo (como `dashboard`, `solicitudes`, `locales`) muestra sus archivos `.ts`, `.html`, y `.css` correspondientes. Las carpetas están organizadas de manera lógica, con cada módulo encapsulando sus propios componentes.

En la parte superior del explorador, se muestra la ruta completa: `defensacivil-frontend/src/app`.

**Elementos a resaltar:** La organización de los módulos, la estructura de carpetas, y los archivos principales de cada módulo."

---

### 5. VISTA DEL DASHBOARD

**Título:** Figura 6.1: Vista del Dashboard Principal

**Descripción:**
"Esta captura de pantalla muestra la interfaz completa del Dashboard del Sistema de Gestión de Defensa Civil en un navegador web (Chrome, Firefox, o Edge).

En la **parte superior**, se observan las tarjetas KPI (Key Performance Indicators) organizadas en una fila horizontal. Cada tarjeta es compacta y muestra:
- **Tarjeta 1:** "Solicitudes Pendientes" con un ícono de documento, el número "25" en grande, y un color de fondo azul claro
- **Tarjeta 2:** "Locales Registrados" con un ícono de tienda, el número "150" en grande, y un color de fondo verde claro
- **Tarjeta 3:** "Fiscalizaciones Programadas" con un ícono de calendario, el número "12" en grande, y un color de fondo amarillo claro
- **Tarjeta 4:** "Alertas Críticas" con un ícono de alarma, el número "5" en grande, y un color de fondo rojo claro

Debajo de los KPIs, la pantalla se divide en dos columnas:

**Columna Izquierda - Widget de Alertas Inteligentes:**
- Título: "Alertas Inteligentes" con un ícono de campana
- Lista de alertas priorizadas:
  - Alerta de "Alta" prioridad (fondo rojo claro): "3 licencias próximas a vencer"
  - Alerta de "Media" prioridad (fondo amarillo claro): "Fiscalización pendiente de revisión"
  - Alerta de "Baja" prioridad (fondo azul claro): "Nueva solicitud recibida"
- Cada alerta tiene un botón "Marcar como atendida" y un botón "Ver detalles"

**Columna Derecha - Mapa Interactivo:**
- Título: "Mapa Interactivo" con controles para cambiar el tipo de mapa (Mapa, Satélite, Híbrido) y un filtro por zona
- Mapa de Google Maps centrado en Huanchaco, mostrando:
  - Marcadores azules que representan locales comerciales
  - Marcadores rojos que representan fiscalizaciones
  - Info-windows al hacer clic en un marcador, mostrando información del local o fiscalización
- En la parte inferior del mapa, una leyenda que explica los colores de los marcadores

En la **barra lateral izquierda** (parcialmente visible), se observa el menú de navegación con el módulo "Dashboard" resaltado.

**Líneas de anotación:** Líneas punteadas rojas conectan las etiquetas descriptivas ("Tarjetas KPI", "Alertas Inteligentes", "Mapa Interactivo") con sus respectivas secciones en la interfaz.

**Elementos a resaltar:** Las tarjetas KPI, el widget de alertas, el mapa interactivo, y la organización general del dashboard."

---

### 6. MAPA DE LOCALES CON MARCADORES

**Título:** Figura 8.2: Mapa de Locales con Marcadores

**Descripción:**
"Esta captura de pantalla muestra el modal del Mapa de Locales que se abre al hacer clic en el botón 'Ver Mapa de Locales' en el módulo de Locales.

El modal ocupa la mayor parte de la pantalla con un fondo semi-transparente oscuro detrás. En la parte superior del modal, se observa:
- Un título "Mapa de Locales" en letras grandes y negritas
- Un botón de cierre (X) en la esquina superior derecha

En el centro del modal, se muestra un mapa de Google Maps que ocupa aproximadamente el 80% del espacio del modal. El mapa está centrado en el distrito de Huanchaco, mostrando las calles, edificios, y la costa del océano Pacífico.

Sobre el mapa, se distribuyen múltiples marcadores azules que representan la ubicación de cada local comercial. Cada marcador muestra:
- El nombre del local (razón social o expediente) truncado a aproximadamente 20 caracteres
- El texto aparece en color blanco sobre un fondo azul redondeado
- El tamaño de la fuente es pequeño pero legible

Al hacer clic en uno de los marcadores, se abre un info-window (ventana de información) que muestra:
- Título: "Local: [Razón Social]"
- Información: "Expediente: [Número]", "Dirección: [Dirección completa]", "Estado: [Estado de la licencia]"
- Un botón "Ver Detalles" para acceder a más información

En la parte inferior del modal, se muestra un resumen con el texto: "Total de locales mostrados: 150" y un botón "Cerrar".

**Líneas de anotación:** 
- Una línea punteada roja conecta el texto "Marcadores de Locales" con uno de los marcadores azules en el mapa
- Otra línea punteada roja conecta el texto "Info-window" con una ventana de información abierta

**Elementos a resaltar:** Los marcadores azules con nombres de locales, el info-window abierto, y el botón de cierre del modal."

---

### 7. FORMULARIO DE CREACIÓN DE FISCALIZACIÓN

**Título:** Figura 9.2: Formulario de Creación de Fiscalización

**Descripción:**
"Esta captura de pantalla muestra el formulario completo para crear una nueva fiscalización, que se abre al hacer clic en el botón 'Nueva Fiscalización' en el módulo de Fiscalizaciones.

El formulario está organizado en varias secciones con un diseño limpio y moderno:

**Sección 1: Información General**
- Campo "Origen" (dropdown): Muestra opciones: "Oficio", "Denuncia", "Post-ITSE", "Operativo", "Reinspección" (con "Oficio" seleccionado)
- Campo "Local" (búsqueda): Un campo de búsqueda con autocompletado que permite buscar y seleccionar un local por nombre o expediente
- Campo "Inspector Asignado" (dropdown): Lista de inspectores disponibles
- Campo "Fecha Programada" (selector de fecha): Muestra un calendario al hacer clic, con la fecha actual seleccionada

**Sección 2: Tipo de Infracción**
- Título: "Seleccione el tipo de infracción detectada"
- Lista de checkboxes:
  - ☐ Falta de señalización de seguridad
  - ☑ Extintores vencidos o ausentes
  - ☐ Salidas de emergencia bloqueadas
  - ☑ Sistema eléctrico en mal estado
  - ☐ Falta de certificado de seguridad
  - (más opciones visibles al desplazarse)

**Sección 3: Observaciones**
- Área de texto grande (textarea) con placeholder: "Ingrese las observaciones y hallazgos de la fiscalización..."
- El área permite múltiples líneas de texto

**Sección 4: Evidencias Fotográficas**
- Título: "Subir Evidencias Fotográficas"
- Área de carga de archivos con estilo "drag and drop"
- Texto: "Arrastre las imágenes aquí o haga clic para seleccionar"
- Botón "Seleccionar Archivos"
- Vista previa de imágenes subidas (miniaturas) si hay archivos seleccionados

**Sección 5: Botones de Acción**
- Botón "Guardar" (verde, grande) a la izquierda
- Botón "Cancelar" (gris, grande) a la derecha

**Líneas de anotación:**
- Una línea punteada roja conecta el texto "Campo Origen" con el dropdown de origen
- Otra línea conecta "Checkboxes de Infracciones" con la lista de checkboxes
- Otra línea conecta "Área de Carga de Archivos" con la sección de evidencias fotográficas

**Elementos a resaltar:** Los campos del formulario, los checkboxes de infracciones, el área de carga de archivos, y los botones de acción."

---

### 8. CALENDARIO DE EVENTOS

**Título:** Figura 10.1: Vista del Calendario de Eventos

**Descripción:**
"Esta captura de pantalla muestra el módulo de Calendario del Sistema de Gestión de Defensa Civil con una vista mensual del calendario.

En la **parte superior del calendario**, se observan:
- Controles de navegación: botones "◀ Anterior" y "Siguiente ▶" para cambiar de mes
- El mes y año actual resaltados: "Diciembre 2024"
- Botones para cambiar la vista: "Mes", "Semana", "Día" (con "Mes" seleccionado)
- Filtros por tipo de evento: checkboxes para "Vencimientos", "Inspecciones", "Fiscalizaciones", "Subsanaciones"

El **calendario principal** muestra una cuadrícula con los días del mes:
- Los días están organizados en filas y columnas (7 columnas para los días de la semana)
- Los encabezados de las columnas muestran: "Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"
- Cada día muestra su número y los eventos programados para ese día

**Eventos en el calendario:**
- **Eventos de vencimiento de licencias** (bloques rojos): Se muestran en los días 5, 12, 18, 25 con el texto "Vencimiento: [Nombre del Local]"
- **Inspecciones programadas** (bloques azules): Se muestran en los días 3, 8, 15, 22 con el texto "Inspección: [Nombre del Local]"
- **Fiscalizaciones** (bloques verdes): Se muestran en los días 7, 14, 21, 28 con el texto "Fiscalización: [Nombre del Local]"
- **Plazos de subsanación** (bloques amarillos): Se muestran en los días 10, 17, 24 con el texto "Subsanación: [Nombre del Local]"

Al hacer clic en un evento (por ejemplo, un bloque rojo del día 5), se abre un **modal de detalles del evento** que muestra:
- Título: "Detalles del Evento"
- Información: "Tipo: Vencimiento de Licencia", "Local: [Nombre]", "Fecha: 05/12/2024", "Descripción: La licencia del local vence en esta fecha"
- Botones: "Ver Detalles del Local", "Cerrar"

**Líneas de anotación:**
- Una línea punteada roja conecta el texto "Evento de Vencimiento" con un bloque rojo en el calendario
- Otra línea conecta "Modal de Detalles" con el modal abierto

**Elementos a resaltar:** Los bloques de eventos de diferentes colores, los controles de navegación, los filtros, y el modal de detalles."

---

### 9. DIAGRAMA ENTIDAD-RELACIÓN

**Título:** Figura 12.1: Diagrama Entidad-Relación de la Base de Datos

**Descripción:**
"Esta captura de pantalla muestra un diagrama ER (Entidad-Relación) de la base de datos del Sistema de Gestión de Defensa Civil, creado con MySQL Workbench o una herramienta similar.

El diagrama muestra las siguientes **tablas (entidades)**:

1. **Tabla `usuarios`** (rectángulo en la esquina superior izquierda):
   - Campos: `id` (PK, INT), `nombre` (VARCHAR), `email` (VARCHAR), `password` (VARCHAR), `rol` (VARCHAR), `fecha_creacion` (DATETIME)
   - La clave primaria `id` está resaltada en negrita

2. **Tabla `solicitudes`** (rectángulo en el centro superior):
   - Campos: `id` (PK, INT), `expediente` (VARCHAR), `solicitante_id` (FK, INT), `razon_social` (VARCHAR), `direccion` (TEXT), `latitud` (DECIMAL), `longitud` (DECIMAL), `tipo` (ENUM), `estado` (VARCHAR), `fecha_creacion` (DATETIME)
   - La clave foránea `solicitante_id` está conectada a `usuarios.id`

3. **Tabla `locales`** (rectángulo en el centro):
   - Campos: `id` (PK, INT), `expediente` (VARCHAR), `razon_social` (VARCHAR), `direccion` (TEXT), `latitud` (DECIMAL), `longitud` (DECIMAL), `estado_licencia` (VARCHAR), `nivel_riesgo` (VARCHAR), `fecha_registro` (DATETIME)

4. **Tabla `fiscalizaciones`** (rectángulo en el centro inferior):
   - Campos: `id` (PK, INT), `local_id` (FK, INT), `inspector_id` (FK, INT), `fecha_programada` (DATE), `fecha_ejecucion` (DATE), `origen` (VARCHAR), `estado` (VARCHAR), `tipo_infraccion` (VARCHAR), `observaciones` (TEXT), `monto_multa` (DECIMAL), `latitud` (DECIMAL), `longitud` (DECIMAL), `fecha_creacion` (DATETIME)
   - Las claves foráneas `local_id` y `inspector_id` están conectadas a `locales.id` y `usuarios.id` respectivamente

5. **Tabla `notificaciones`** (rectángulo en la esquina superior derecha):
   - Campos: `id` (PK, INT), `solicitud_id` (FK, INT), `destinatario` (VARCHAR), `tipo` (VARCHAR), `asunto` (VARCHAR), `contenido` (TEXT), `estado` (VARCHAR), `fecha_envio` (DATETIME)
   - La clave foránea `solicitud_id` está conectada a `solicitudes.id`

**Relaciones (líneas que conectan las tablas):**
- Una línea con un símbolo de "1" y "N" conecta `usuarios.id` con `solicitudes.solicitante_id` (relación uno a muchos)
- Una línea con un símbolo de "1" y "N" conecta `locales.id` con `fiscalizaciones.local_id` (relación uno a muchos)
- Una línea con un símbolo de "1" y "N" conecta `usuarios.id` con `fiscalizaciones.inspector_id` (relación uno a muchos)
- Una línea con un símbolo de "1" y "N" conecta `solicitudes.id` con `notificaciones.solicitud_id` (relación uno a muchos)

**Elementos a resaltar:** Las tablas principales, las claves primarias (PK), las claves foráneas (FK), y las relaciones entre las tablas."

---

### 10. ERROR DE CONEXIÓN A LA BASE DE DATOS

**Título:** Figura 15.1: Error de Conexión a la Base de Datos

**Descripción:**
"Esta captura de pantalla muestra la terminal de comandos con un error de conexión a la base de datos MySQL.

En la parte superior de la terminal, se observa:
- La ruta del directorio: `C:\Users\[Usuario]\defensacivil-frontend\banckend>`
- El comando ejecutado: `npm start` o `node index.js`

En el cuerpo de la salida, se muestra:
- Mensajes de inicio normales del servidor Node.js
- Luego, un mensaje de error en rojo:

```
Error: connect ECONNREFUSED 127.0.0.1:3306
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1146:16)
    at PromisePool.execute (C:\...\node_modules\mysql2\lib\pool.js:...)
    at async Object.<anonymous> (C:\...\banckend\index.js:...)
```

El error indica que el servidor MySQL no está disponible en la dirección `127.0.0.1` (localhost) en el puerto `3306`, o que las credenciales de conexión son incorrectas.

Debajo del error, se muestra el stack trace completo que indica la línea del archivo donde ocurrió el error (por ejemplo, `banckend\index.js:25`).

En la parte inferior de la terminal, el prompt está listo para el siguiente comando, pero el servidor no se inició correctamente.

**Elementos a resaltar:** El mensaje de error en rojo, la dirección y puerto (`127.0.0.1:3306`), y el stack trace que indica la ubicación del error."

---

## CONSEJOS GENERALES PARA CAPTURAR IMÁGENES

1. **Calidad y Resolución:**
   - Usar capturas de pantalla de alta resolución (al menos 1920x1080)
   - Asegurarse de que el texto sea legible
   - Evitar imágenes borrosas o pixeladas

2. **Recorte y Enfoque:**
   - Recortar las imágenes para mostrar solo lo relevante
   - Eliminar barras de tareas, menús innecesarios, y elementos distractores
   - Enfocar en los elementos que se están describiendo

3. **Anotaciones y Líneas:**
   - Usar herramientas de edición (Paint, Photoshop, GIMP) para añadir líneas punteadas rojas
   - Añadir recuadros o círculos para resaltar elementos específicos
   - Usar texto con fondo blanco o transparente para etiquetas

4. **Consistencia:**
   - Mantener un estilo consistente en todas las imágenes
   - Usar los mismos colores para las anotaciones (rojo para líneas punteadas, blanco para texto)
   - Mantener el mismo tamaño de fuente para las anotaciones

5. **Datos Sensibles:**
   - Ofuscar contraseñas, tokens, y otra información sensible
   - Usar datos de ejemplo en lugar de datos reales
   - Evitar mostrar información personal o confidencial

6. **Contexto:**
   - Incluir suficiente contexto para que la imagen sea comprensible
   - Mostrar la barra de direcciones del navegador si es relevante
   - Incluir mensajes de error completos si se trata de troubleshooting

---

## HERRAMIENTAS RECOMENDADAS PARA CAPTURAR Y EDITAR IMÁGENES

1. **Captura de Pantalla:**
   - Windows: Herramienta de recorte (Snipping Tool) o Win + Shift + S
   - macOS: Cmd + Shift + 4
   - Linux: Gnome Screenshot o herramientas similares

2. **Edición de Imágenes:**
   - Paint (Windows) - básico
   - GIMP - gratuito y potente
   - Photoshop - profesional
   - Snagit - especializado en capturas de pantalla
   - Greenshot - gratuito y fácil de usar

3. **Añadir Anotaciones:**
   - Usar herramientas de forma (líneas, flechas, recuadros)
   - Añadir texto con fuentes claras y legibles
   - Usar colores contrastantes (rojo para anotaciones, blanco para texto)

---

Esta guía debe usarse como referencia al crear las imágenes para el Manual de Aplicación del Código Fuente. Cada imagen debe seguir estos estándares para mantener la consistencia y claridad del documento.






