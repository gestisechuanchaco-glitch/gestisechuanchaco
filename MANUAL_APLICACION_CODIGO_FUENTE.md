# MANUAL DE APLICACIÓN DEL CÓDIGO FUENTE
## Sistema de Gestión de Defensa Civil - Huanchaco

---

## ÍNDICE

1. Introducción (Página 3)
2. Requerimientos e Instalación (Página 4)
3. Configuración del Entorno de Desarrollo (Página 5)
4. Estructura del Proyecto (Página 6)
5. Menú Principal (Página 8)
6. Módulo Dashboard (Página 10)
7. Módulo Solicitudes (Página 12)
8. Módulo Locales (Página 14)
9. Módulo Fiscalizaciones (Página 16)
10. Módulo Calendario (Página 18)
11. Módulo Notificaciones (Página 20)
12. Base de Datos (Página 22)
13. APIs y Endpoints (Página 24)
14. Despliegue en Producción (Página 26)
15. Solución de Problemas (Página 28)

---

## 1. INTRODUCCIÓN

### 1.1 Propósito del Manual

Este manual está dirigido a desarrolladores, administradores de sistemas y personal técnico que necesite configurar, instalar, desplegar y mantener el Sistema de Gestión de Defensa Civil de Huanchaco. El documento proporciona instrucciones detalladas sobre cómo trabajar con el código fuente, configurar el entorno de desarrollo y producción, y entender la arquitectura del sistema.

### 1.2 Descripción del Sistema

El Sistema de Gestión de Defensa Civil es una aplicación web desarrollada para la Municipalidad Distrital de Huanchaco, que permite gestionar de manera integral todas las solicitudes de licencias ITSE (Inspección Técnica de Seguridad en Establecimientos) y ECSE (Evaluación de Condiciones de Seguridad en Establecimientos), así como el control y seguimiento de locales comerciales, fiscalizaciones e inspecciones técnicas.

### 1.3 Arquitectura del Sistema

El sistema está construido siguiendo una arquitectura cliente-servidor de tres capas:

- **Capa de Presentación (Frontend):** Angular 20.1.0 con TypeScript
- **Capa de Lógica de Negocio (Backend):** Node.js con Express.js 4.18.2
- **Capa de Datos:** MySQL (Base de datos: DefensaCivilH)

**Tecnologías Adicionales:**
- Google Maps API (para mapas interactivos)
- Chart.js (para gráficos y KPIs)
- PDFKit (para generación de documentos)
- Multer (para manejo de archivos)
- bcrypt (para encriptación de contraseñas)

---

## 2. REQUERIMIENTOS E INSTALACIÓN

### 2.1 Requerimientos del Software

**Sistema Operativo:**
- Windows 10/11 (64-bit)
- macOS 10.15 o superior
- Linux (Ubuntu 20.04+, Debian 11+)

**Herramientas de Desarrollo:**
- Node.js (versión 16.x o superior)
- npm (versión 8.x o superior) - viene incluido con Node.js
- Angular CLI (versión 20.x) - se instala globalmente
- MySQL Server (versión 8.0 o superior)
- MySQL Workbench (opcional, para gestión gráfica de la base de datos)
- Git (versión 2.30 o superior)
- Visual Studio Code 2019 o superior (recomendado)

**Navegadores Web Compatibles:**
- Google Chrome (última versión)
- Mozilla Firefox (última versión)
- Microsoft Edge (última versión)

**Requisitos de Hardware:**
- Procesador: Intel Core i3 o equivalente (mínimo), Intel Core i5/i7 o equivalente (recomendado)
- Memoria RAM: 4 GB (mínimo), 8 GB o más (recomendado)
- Espacio en Disco: 1 GB (mínimo), 10 GB o más (recomendado)

### 2.2 Requisitos Previos que se van a Instalar

Antes de instalar el proyecto, es necesario instalar las siguientes herramientas:

1. **Node.js y npm:**
   - Descargar e instalar desde: https://nodejs.org/
   - Verificar instalación: `node -v` y `npm -v`

2. **Angular CLI:**
   - Instalar globalmente: `npm install -g @angular/cli`
   - Verificar instalación: `ng version`

3. **MySQL Server:**
   - Descargar e instalar desde: https://dev.mysql.com/downloads/mysql/
   - Configurar usuario y contraseña durante la instalación

4. **Git:**
   - Descargar e instalar desde: https://git-scm.com/downloads
   - Verificar instalación: `git --version`

---

## 3. CONFIGURACIÓN DEL ENTORNO DE DESARROLLO

### 3.1 Clonar el Repositorio

**Descripción:** Obtener el código fuente del proyecto desde el repositorio Git.

**Pasos:**
1. Abrir una terminal o línea de comandos
2. Navegar al directorio donde se desea clonar el proyecto
3. Ejecutar el comando: `git clone [URL_DEL_REPOSITORIO]`
4. Navegar al directorio del proyecto: `cd defensacivil-frontend`

**Imagen Requerida:**
- **Título:** Figura 3.1: Clonación del repositorio del proyecto
- **Descripción:** Captura de pantalla de la terminal mostrando la ejecución del comando `git clone` y la estructura de carpetas resultante. Se observa la creación de las carpetas `defensacivil-frontend` y `banckend`, junto con los mensajes de confirmación de Git.

### 3.2 Configuración de la Base de Datos

**Descripción:** Crear la base de datos MySQL y configurar las credenciales.

**Pasos:**
1. Abrir MySQL Workbench o la línea de comandos de MySQL
2. Conectar al servidor MySQL
3. Ejecutar los siguientes comandos:
   ```sql
   CREATE DATABASE DefensaCivilH;
   CREATE USER 'defensacivil_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
   GRANT ALL PRIVILEGES ON DefensaCivilH.* TO 'defensacivil_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
4. Importar el esquema de la base de datos (si existe un archivo `.sql`):
   ```bash
   mysql -u defensacivil_user -p DefensaCivilH < schema.sql
   ```

**Imagen Requerida:**
- **Título:** Figura 3.2: Creación de la base de datos en MySQL
- **Descripción:** Captura de pantalla de MySQL Workbench mostrando la ejecución exitosa del comando `CREATE DATABASE DefensaCivilH;`. Se observa el panel de consultas con el comando ejecutado y el panel de resultados confirmando la creación de la base de datos. En la esquina inferior, se muestra la lista de bases de datos con `DefensaCivilH` resaltada.

### 3.3 Configuración del Backend (Node.js/Express)

**Descripción:** Configurar el servidor backend del sistema.

**Pasos:**
1. Navegar al directorio del backend: `cd banckend`
2. Instalar las dependencias: `npm install`
3. Crear el archivo `.env` en la raíz del directorio `banckend` con el siguiente contenido:
   ```env
   # Base de Datos
   DB_HOST=localhost
   DB_USER=defensacivil_user
   DB_PASSWORD=tu_contraseña_segura
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
4. Verificar que el archivo `db.js` esté configurado para usar variables de entorno

**Imagen Requerida:**
- **Título:** Figura 3.3: Instalación de dependencias del backend
- **Descripción:** Captura de pantalla de la terminal mostrando la ejecución del comando `npm install` en el directorio `banckend`. Se observa el progreso de la instalación de paquetes como `express`, `mysql2`, `cors`, `dotenv`, y la creación de la carpeta `node_modules`.

**Imagen Requerida:**
- **Título:** Figura 3.4: Configuración del archivo `.env` del backend
- **Descripción:** Captura de pantalla de Visual Studio Code mostrando el archivo `.env` abierto en el editor. Se observan las variables de entorno configuradas: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, y `NODE_ENV`. Los valores sensibles (como contraseñas) aparecen ofuscados o con valores de ejemplo.

### 3.4 Configuración del Frontend (Angular)

**Descripción:** Configurar la aplicación frontend de Angular.

**Pasos:**
1. Navegar al directorio del frontend: `cd defensacivil-frontend` (o `cd ..` si estás en `banckend`)
2. Instalar las dependencias: `npm install`
3. Configurar el archivo `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api'
   };
   ```
4. Verificar que la URL de la API apunte al backend correcto

**Imagen Requerida:**
- **Título:** Figura 3.5: Instalación de dependencias del frontend
- **Descripción:** Captura de pantalla de la terminal mostrando la ejecución del comando `npm install` en el directorio `defensacivil-frontend`. Se observa el progreso de la instalación de paquetes de Angular y dependencias como `@angular/core`, `@angular/router`, `chart.js`, `rxjs`, y la creación de la carpeta `node_modules`.

**Imagen Requerida:**
- **Título:** Figura 3.6: Configuración del archivo `environment.ts`
- **Descripción:** Captura de pantalla de Visual Studio Code mostrando el archivo `src/environments/environment.ts` abierto. Se observa la configuración de `apiUrl: 'http://localhost:3000/api'` resaltada, indicando la URL del backend al que se conectará el frontend.

---

## 4. ESTRUCTURA DEL PROYECTO

### 4.1 Estructura de Directorios del Backend

**Descripción:** Organización de carpetas y archivos del módulo backend.

El directorio `banckend` contiene:
```
banckend/
├── index.js              # Punto de entrada principal del servidor
├── db.js                 # Configuración de la conexión a la base de datos
├── package.json          # Dependencias y scripts del proyecto
├── .env                  # Variables de entorno (no se sube a Git)
├── .env.example          # Ejemplo de variables de entorno
├── .gitignore           # Archivos ignorados por Git
└── uploads/             # Directorio para archivos subidos
```

**Imagen Requerida:**
- **Título:** Figura 4.1: Estructura de directorios del backend
- **Descripción:** Captura de pantalla del explorador de archivos de Visual Studio Code mostrando la estructura de carpetas del directorio `banckend`. Se observan los archivos principales como `index.js`, `db.js`, `package.json`, y la carpeta `uploads`. El archivo `.env` aparece atenuado o con un ícono que indica que está ignorado por Git.

### 4.2 Estructura de Directorios del Frontend

**Descripción:** Organización de carpetas y archivos del módulo frontend.

El directorio `defensacivil-frontend` contiene:
```
defensacivil-frontend/
├── src/
│   ├── app/
│   │   ├── app.ts              # Componente raíz de la aplicación
│   │   ├── app.html            # Template del componente raíz
│   │   ├── app.css             # Estilos globales
│   │   ├── app.routes.ts       # Configuración de rutas
│   │   ├── dashboard/          # Módulo Dashboard
│   │   ├── solicitudes/        # Módulo Solicitudes
│   │   ├── locales/            # Módulo Locales
│   │   ├── fiscalizacion/      # Módulo Fiscalizaciones
│   │   ├── calendario/         # Módulo Calendario
│   │   ├── notificaciones/     # Módulo Notificaciones
│   │   ├── login/              # Módulo de Login
│   │   └── service/            # Servicios compartidos
│   ├── assets/                 # Recursos estáticos (imágenes, iconos)
│   └── environments/           # Configuración de entornos
├── angular.json                # Configuración de Angular
├── package.json               # Dependencias del proyecto
└── tsconfig.json              # Configuración de TypeScript
```

**Imagen Requerida:**
- **Título:** Figura 4.2: Estructura de directorios del frontend
- **Descripción:** Captura de pantalla del explorador de archivos de Visual Studio Code mostrando la estructura de carpetas del directorio `defensacivil-frontend/src/app`. Se observan los módulos principales como `dashboard`, `solicitudes`, `locales`, `fiscalizacion`, `calendario`, `notificaciones`, y la carpeta `service` que contiene los servicios compartidos. Cada módulo muestra sus archivos `.ts`, `.html`, y `.css`.

---

## 5. MENÚ PRINCIPAL

**Descripción:** Pantalla de inicio y navegación principal del sistema.

**Funcionalidad:** El menú principal proporciona acceso a todos los módulos del sistema a través de una barra lateral de navegación. Incluye el logo de Defensa Civil, enlaces a cada módulo (Dashboard, Solicitudes, Locales, Fiscalizaciones, Calendario, Notificaciones), y opciones de usuario (Perfil, Ajustes, Cerrar Sesión).

**Archivos Relacionados:**
- `src/app/app.ts` - Lógica del componente raíz
- `src/app/app.html` - Template del menú principal
- `src/app/app.css` - Estilos del menú

**Imagen Requerida:**
- **Título:** Figura 5.1: Vista del Menú Principal del Sistema
- **Descripción:** Captura de pantalla del menú principal del Sistema de Gestión de Defensa Civil. Se observa la barra lateral izquierda con el logo de Defensa Civil en la parte superior, seguido de los enlaces de navegación: "Dashboard", "Solicitudes", "Locales", "Fiscalizaciones", "Calendario", "Notificaciones". En la parte inferior de la barra lateral, se muestran las opciones de usuario: "Perfil", "Ajustes", y "Cerrar Sesión". El área de contenido principal muestra la vista del módulo seleccionado (en este caso, el Dashboard). Una línea punteada roja conecta el texto "Menú Principal" con la barra lateral de navegación.

---

## 6. MÓDULO DASHBOARD

**Descripción:** Panel de control principal que muestra métricas clave, alertas inteligentes y un mapa interactivo.

**Funcionalidad:** 
- Visualización de KPIs (Key Performance Indicators) como Solicitudes Pendientes, Locales Registrados, Fiscalizaciones Programadas
- Widget de Alertas Inteligentes con recordatorios automáticos
- Mapa Interactivo con ubicación de locales y fiscalizaciones
- Gráficos de tendencias y estadísticas

**Archivos Relacionados:**
- `src/app/dashboard/dashboard.ts` - Lógica del componente
- `src/app/dashboard/dashboard.html` - Template del dashboard
- `src/app/dashboard/dashboard.css` - Estilos del dashboard

**Imagen Requerida:**
- **Título:** Figura 6.1: Vista del Dashboard Principal
- **Descripción:** Captura de pantalla del Dashboard del Sistema de Gestión de Defensa Civil. En la parte superior, se observan las tarjetas KPI reducidas que muestran métricas clave: "Solicitudes Pendientes" (con un ícono y número), "Locales Registrados", "Fiscalizaciones Programadas", cada una con su respectivo valor numérico y color distintivo. Debajo de los KPIs, a la izquierda se muestra el widget de "Alertas Inteligentes" con una lista de notificaciones priorizadas (Alta, Media, Baja) y botones de acción. A la derecha, se visualiza el "Mapa Interactivo" que muestra la ubicación de locales (marcadores azules) y fiscalizaciones (marcadores rojos) en el distrito de Huanchaco, con controles para cambiar el tipo de mapa y filtrar por zona. Líneas punteadas rojas conectan las etiquetas descriptivas con cada sección del dashboard.

---

## 7. MÓDULO SOLICITUDES

**Descripción:** Gestión completa de solicitudes de licencias ITSE y ECSE.

**Funcionalidad:**
- Registro de nuevas solicitudes mediante formulario multi-página
- Visualización de solicitudes en tabla con filtros avanzados
- Edición y actualización de solicitudes
- Asignación de inspectores
- Generación de certificados en PDF
- Seguimiento del estado de cada solicitud

**Archivos Relacionados:**
- `src/app/solicitudes/solicitudes.ts` - Lógica del componente
- `src/app/solicitudes/solicitudes.html` - Template del módulo
- `src/app/solicitudes/solicitudes.css` - Estilos del módulo

**Imagen Requerida:**
- **Título:** Figura 7.1: Vista del Módulo de Solicitudes
- **Descripción:** Captura de pantalla del módulo de Solicitudes mostrando una tabla con las solicitudes registradas. En la parte superior, se observan filtros de búsqueda por expediente, estado, fecha, y un botón "Nueva Solicitud". La tabla muestra columnas: "Expediente", "Solicitante", "Razón Social", "Tipo", "Estado", "Fecha", y "Acciones". Cada fila contiene botones para "Ver Detalle", "Editar", y "Generar PDF". En la parte inferior, se muestra la paginación de la tabla. Una línea punteada roja apunta desde el texto "Formulario de Solicitud" hacia el botón "Nueva Solicitud", y otra línea conecta "Tabla de Solicitudes" con la tabla de datos.

**Imagen Requerida:**
- **Título:** Figura 7.2: Formulario de Registro de Solicitud
- **Descripción:** Captura de pantalla del formulario de creación de una nueva solicitud ITSE/ECSE. El formulario está dividido en secciones: "Datos del Solicitante" (DNI, Nombres, Apellidos, Teléfono, Correo), "Datos del Establecimiento" (Razón Social, RUC, Dirección, Coordenadas GPS), "Información Técnica" (Área, Número de Pisos, Giro Comercial, Nivel de Riesgo), y "Documentación" (área para subir archivos). Un mapa interactivo se muestra para la georreferenciación del establecimiento. En la parte inferior, se encuentran los botones "Guardar" y "Cancelar". Líneas punteadas rojas conectan las instrucciones con los campos relevantes del formulario.

---

## 8. MÓDULO LOCALES

**Descripción:** Gestión del inventario de locales comerciales y visualización en mapa.

**Funcionalidad:**
- Visualización de locales en tabla con filtros
- Búsqueda por expediente, razón social, estado
- Visualización del mapa de locales con marcadores georreferenciados
- Detalles completos de cada local
- Gestión de renovaciones de licencias

**Archivos Relacionados:**
- `src/app/locales/locales.ts` - Lógica del componente
- `src/app/locales/locales.html` - Template del módulo
- `src/app/locales/locales.css` - Estilos del módulo

**Imagen Requerida:**
- **Título:** Figura 8.1: Vista del Módulo de Locales
- **Descripción:** Captura de pantalla del módulo de Locales mostrando una tabla con los locales registrados. En la parte superior, se observan filtros de búsqueda y un botón "Ver Mapa de Locales". La tabla muestra columnas: "Expediente", "Razón Social", "Dirección", "Estado de Licencia", "Nivel de Riesgo", y "Acciones". Cada fila tiene botones para "Ver Detalle" y "Ver en Mapa". Una línea punteada roja conecta el texto "Tabla de Locales" con la tabla de datos.

**Imagen Requerida:**
- **Título:** Figura 8.2: Mapa de Locales con Marcadores
- **Descripción:** Captura de pantalla del modal del Mapa de Locales. Se muestra un mapa de Google Maps centrado en el distrito de Huanchaco con múltiples marcadores azules que representan la ubicación de cada local. Cada marcador muestra el nombre del local (razón social o expediente) truncado a 20 caracteres. Al hacer clic en un marcador, se abre un info-window que muestra: "Razón Social: [nombre]", "Dirección: [dirección]", "Expediente: [número]", y "Estado: [estado]". En la parte superior del modal, se observa un botón "Cerrar" (X) y un título "Mapa de Locales". En la parte inferior, se muestra un resumen con el número total de locales mostrados. Líneas punteadas rojas conectan las instrucciones con los marcadores y el botón de cierre.

---

## 9. MÓDULO FISCALIZACIONES

**Descripción:** Gestión completa del proceso de fiscalizaciones a establecimientos.

**Funcionalidad:**
- Creación de fiscalizaciones por diferentes orígenes (oficio, denuncia, post-ITSE, operativo, reinspección)
- Registro de infracciones detectadas
- Gestión de evidencias fotográficas
- Cálculo automático de multas
- Generación de actas y notificaciones
- Seguimiento del estado de subsanación

**Archivos Relacionados:**
- `src/app/fiscalizacion/fiscalizacion.ts` - Lógica del componente
- `src/app/fiscalizacion/fiscalizacion.html` - Template del módulo
- `src/app/fiscalizacion/fiscalizacion.css` - Estilos del módulo

**Imagen Requerida:**
- **Título:** Figura 9.1: Vista del Módulo de Fiscalizaciones
- **Descripción:** Captura de pantalla del módulo de Fiscalizaciones mostrando una tabla con las fiscalizaciones registradas. En la parte superior, se observan filtros por estado, inspector, fecha, tipo de infracción, y un botón "Nueva Fiscalización". La tabla muestra columnas: "Número", "Local", "Inspector", "Fecha", "Origen", "Estado", "Tipo de Infracción", y "Acciones". Cada fila tiene botones para "Ver Detalle", "Editar", y "Generar Acta". Los estados se muestran con colores distintivos (Programada, En Ejecución, Ejecutada, Notificada, Subsanada, Multada, Cerrado). Una línea punteada roja conecta el texto "Tabla de Fiscalizaciones" con la tabla de datos.

**Imagen Requerida:**
- **Título:** Figura 9.2: Formulario de Creación de Fiscalización
- **Descripción:** Captura de pantalla del formulario de creación de una nueva fiscalización. El formulario incluye campos para: "Origen" (dropdown con opciones: Oficio, Denuncia, Post-ITSE, Operativo, Reinspección), "Local" (búsqueda y selección), "Inspector Asignado", "Fecha Programada", "Tipo de Infracción" (checklist con opciones como: Falta de señalización, Extintores vencidos, Salidas de emergencia bloqueadas, etc.), "Observaciones" (área de texto), y "Evidencias Fotográficas" (área para subir imágenes). En la parte inferior, se muestran los botones "Guardar" y "Cancelar". Líneas punteadas rojas conectan las instrucciones con los campos relevantes del formulario.

---

## 10. MÓDULO CALENDARIO

**Descripción:** Visualización de eventos importantes en un calendario interactivo.

**Funcionalidad:**
- Vista mensual, semanal y diaria del calendario
- Eventos por tipo (vencimientos de licencias, inspecciones programadas, fiscalizaciones, plazos de subsanación)
- Filtros por tipo de evento
- Notificaciones automáticas sobre eventos próximos
- Detalles de cada evento al hacer clic

**Archivos Relacionados:**
- `src/app/calendario/calendario.ts` - Lógica del componente
- `src/app/calendario/calendario.html` - Template del módulo
- `src/app/calendario/calendario.css` - Estilos del módulo

**Imagen Requerida:**
- **Título:** Figura 10.1: Vista del Calendario de Eventos
- **Descripción:** Captura de pantalla del módulo de Calendario mostrando una vista mensual del calendario. Se observa el calendario con los días del mes organizados en una cuadrícula. Los eventos se muestran como bloques de colores en los días correspondientes: eventos de vencimiento de licencias (rojo), inspecciones programadas (azul), fiscalizaciones (verde), y plazos de subsanación (amarillo). En la parte superior, se encuentran controles para cambiar de mes y filtros por tipo de evento. Al hacer clic en un evento, se abre un modal con los detalles: "Tipo: [tipo]", "Local: [nombre]", "Fecha: [fecha]", "Descripción: [descripción]". Líneas punteadas rojas conectan las instrucciones con los eventos y los controles del calendario.

---

## 11. MÓDULO NOTIFICACIONES

**Descripción:** Centralización y gestión de todas las notificaciones del sistema.

**Funcionalidad:**
- Historial completo de comunicaciones enviadas
- Envío de notificaciones masivas
- Configuración de plantillas de notificaciones
- Seguimiento del estado de entrega
- Integración con WhatsApp para envío automático

**Archivos Relacionados:**
- `src/app/notificaciones/notificaciones.ts` - Lógica del componente
- `src/app/notificaciones/notificaciones.html` - Template del módulo
- `src/app/notificaciones/notificaciones.css` - Estilos del módulo

**Imagen Requerida:**
- **Título:** Figura 11.1: Vista del Módulo de Notificaciones
- **Descripción:** Captura de pantalla del módulo de Notificaciones mostrando una tabla con el historial de notificaciones enviadas. La tabla muestra columnas: "Fecha", "Destinatario", "Tipo", "Asunto", "Estado", y "Acciones". Cada fila tiene un botón "Ver Detalle" para ver el contenido completo de la notificación. En la parte superior, se encuentran filtros por fecha, tipo, estado, y un botón "Nueva Notificación". Los estados se muestran con colores: "Enviada" (verde), "Pendiente" (amarillo), "Fallida" (rojo). Una línea punteada roja conecta el texto "Historial de Notificaciones" con la tabla de datos.

---

## 12. BASE DE DATOS

### 12.1 Esquema de la Base de Datos

**Descripción:** Estructura de las tablas principales de la base de datos MySQL.

**Tablas Principales:**
- `solicitudes` - Almacena las solicitudes de licencias ITSE/ECSE
- `locales` - Almacena la información de los locales comerciales
- `fiscalizaciones` - Almacena los registros de fiscalizaciones
- `usuarios` - Almacena la información de los usuarios del sistema
- `notificaciones` - Almacena el historial de notificaciones enviadas
- `inspecciones` - Almacena los registros de inspecciones técnicas

**Imagen Requerida:**
- **Título:** Figura 12.1: Diagrama Entidad-Relación de la Base de Datos
- **Descripción:** Diagrama ER de la base de datos del Sistema de Gestión de Defensa Civil. Se observan las tablas principales: `solicitudes`, `locales`, `fiscalizaciones`, `usuarios`, `notificaciones`, `inspecciones`, cada una con sus campos clave. Las relaciones entre tablas se muestran con líneas que conectan las claves primarias (PK) con las claves foráneas (FK). Por ejemplo, `fiscalizaciones` tiene una relación con `locales` a través de `local_id`, y `solicitudes` tiene una relación con `usuarios` a través de `usuario_id`. Cada tabla muestra sus campos principales como: `id`, `nombre`, `fecha_creacion`, etc.

### 12.2 Configuración de Conexión

**Descripción:** Configuración de la conexión a la base de datos en el backend.

El archivo `banckend/db.js` contiene la configuración de la conexión usando el pool de conexiones de MySQL:

```javascript
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'DefensaCivilH',
  port: process.env.DB_PORT || 3306
});

module.exports = {
  pool,
  promise: pool.promise()
};
```

**Imagen Requerida:**
- **Título:** Figura 12.2: Configuración de la Conexión a la Base de Datos
- **Descripción:** Captura de pantalla de Visual Studio Code mostrando el archivo `banckend/db.js` abierto. Se observa el código de configuración del pool de conexiones de MySQL, con las variables de entorno resaltadas: `process.env.DB_HOST`, `process.env.DB_USER`, `process.env.DB_PASSWORD`, `process.env.DB_NAME`, y `process.env.DB_PORT`. El código muestra la importación de `mysql2` y `dotenv`, y la exportación del pool de conexiones.

---

## 13. APIs Y ENDPOINTS

### 13.1 Endpoints Principales del Backend

**Descripción:** Lista de los endpoints de la API REST del backend.

**Endpoints de Solicitudes:**
- `GET /api/solicitudes` - Obtener todas las solicitudes
- `POST /api/solicitudes` - Crear una nueva solicitud
- `GET /api/solicitudes/:id` - Obtener una solicitud por ID
- `PUT /api/solicitudes/:id` - Actualizar una solicitud
- `DELETE /api/solicitudes/:id` - Eliminar una solicitud

**Endpoints de Locales:**
- `GET /api/locales` - Obtener todos los locales (incluye latitud, longitud, dirección)
- `GET /api/locales/:id` - Obtener un local por ID
- `POST /api/locales` - Crear un nuevo local
- `PUT /api/locales/:id` - Actualizar un local

**Endpoints de Fiscalizaciones:**
- `GET /api/fiscalizaciones` - Obtener todas las fiscalizaciones
- `POST /api/fiscalizaciones` - Crear una nueva fiscalización
- `GET /api/fiscalizaciones/:id` - Obtener una fiscalización por ID
- `PUT /api/fiscalizaciones/:id` - Actualizar una fiscalización

**Endpoints de Calendario:**
- `GET /api/calendario/eventos` - Obtener todos los eventos del calendario

**Imagen Requerida:**
- **Título:** Figura 13.1: Ejemplo de Respuesta del Endpoint `/api/locales`
- **Descripción:** Captura de pantalla de Postman o Insomnia mostrando una solicitud GET al endpoint `/api/locales` y su respuesta JSON. Se observa la estructura JSON de la respuesta que incluye un array de objetos con los campos: `id`, `expediente`, `razon_social`, `direccion`, `latitud`, `longitud`, `estado_licencia`, `nivel_riesgo`, etc. El código de estado HTTP 200 se muestra en verde, indicando una respuesta exitosa. En el panel de respuesta, se resaltan los campos `latitud`, `longitud`, y `direccion` que son utilizados para mostrar los locales en el mapa.

---

## 14. DESPLIEGUE EN PRODUCCIÓN

### 14.1 Preparación del Backend para Producción

**Descripción:** Configurar el backend para el entorno de producción.

**Pasos:**
1. Actualizar el archivo `.env` con las variables de producción:
   ```env
   NODE_ENV=production
   DB_HOST=tu_servidor_db
   DB_USER=usuario_produccion
   DB_PASSWORD=contraseña_segura
   DB_NAME=DefensaCivilH
   PORT=3000
   ```
2. Instalar dependencias de producción: `npm install --production`
3. Usar un gestor de procesos como PM2: `pm2 start index.js --name defensacivil-backend`

**Imagen Requerida:**
- **Título:** Figura 14.1: Inicio del Backend en Producción con PM2
- **Descripción:** Captura de pantalla de la terminal mostrando el comando `pm2 start index.js --name defensacivil-backend` y la salida exitosa. Se observa la lista de procesos PM2 con el proceso `defensacivil-backend` en estado "online", mostrando el PID, el uso de memoria, y el tiempo de actividad.

### 14.2 Construcción del Frontend para Producción

**Descripción:** Compilar el frontend de Angular para producción.

**Pasos:**
1. Navegar al directorio del frontend: `cd defensacivil-frontend`
2. Construir la aplicación: `ng build --configuration=production`
3. Los archivos compilados se generarán en la carpeta `dist/defensacivil-frontend/`

**Imagen Requerida:**
- **Título:** Figura 14.2: Construcción del Frontend para Producción
- **Descripción:** Captura de pantalla de la terminal mostrando la ejecución del comando `ng build --configuration=production`. Se observa el progreso de la compilación, la optimización de los archivos, y la generación de los archivos en la carpeta `dist/defensacivil-frontend/`. Al final, se muestra un mensaje de éxito indicando que la compilación se completó correctamente y el tamaño de los archivos generados.

### 14.3 Configuración del Servidor Web (Nginx)

**Descripción:** Configurar Nginx para servir el frontend y hacer proxy al backend.

**Configuración de Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Servir el frontend
    location / {
        root /var/www/defensacivil-frontend/dist/defensacivil-frontend;
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Imagen Requerida:**
- **Título:** Figura 14.3: Configuración de Nginx para el Sistema
- **Descripción:** Captura de pantalla de Visual Studio Code mostrando el archivo de configuración de Nginx (`/etc/nginx/sites-available/defensacivil`). Se observa la configuración del servidor con el bloque `server`, la directiva `listen 80`, la configuración de `location /` para servir el frontend, y la configuración de `location /api` para hacer proxy al backend en `http://localhost:3000`. El código está resaltado con colores para facilitar la lectura.

---

## 15. SOLUCIÓN DE PROBLEMAS

### 15.1 Problemas Comunes y Soluciones

**Problema 1: Error de Conexión a la Base de Datos**

**Síntomas:** El backend no puede conectarse a la base de datos MySQL.

**Soluciones:**
1. Verificar que MySQL Server esté corriendo
2. Verificar las credenciales en el archivo `.env`
3. Verificar que el usuario tenga los permisos necesarios
4. Verificar que el puerto 3306 esté abierto

**Imagen Requerida:**
- **Título:** Figura 15.1: Error de Conexión a la Base de Datos
- **Descripción:** Captura de pantalla de la terminal mostrando un error de conexión a la base de datos. Se observa el mensaje de error: "Error: connect ECONNREFUSED 127.0.0.1:3306" o similar. El error indica que el servidor MySQL no está disponible o las credenciales son incorrectas. Se muestra el stack trace del error y la línea del archivo donde ocurrió.

**Problema 2: El Frontend no se Conecta al Backend**

**Síntomas:** El frontend muestra errores de CORS o no puede obtener datos del backend.

**Soluciones:**
1. Verificar que el backend esté corriendo en el puerto 3000
2. Verificar que la URL en `environment.ts` sea correcta
3. Verificar la configuración de CORS en el backend
4. Verificar la consola del navegador para errores específicos

**Imagen Requerida:**
- **Título:** Figura 15.2: Error de CORS en el Navegador
- **Descripción:** Captura de pantalla de la consola del navegador (Chrome DevTools) mostrando un error de CORS. Se observa el mensaje de error: "Access to XMLHttpRequest at 'http://localhost:3000/api/locales' from origin 'http://localhost:4200' has been blocked by CORS policy". El error indica que el backend no está configurado para permitir solicitudes desde el origen del frontend. Se muestra la pestaña "Console" con el error resaltado en rojo.

**Problema 3: El Mapa no se Renderiza**

**Síntomas:** El mapa de Google Maps no se muestra o aparece en blanco.

**Soluciones:**
1. Verificar que la API key de Google Maps esté configurada correctamente
2. Verificar que el elemento del mapa tenga dimensiones definidas
3. Verificar que se esté llamando a `google.maps.event.trigger(map, 'resize')` después de que el mapa se inicialice
4. Verificar la consola del navegador para errores de la API de Google Maps

**Imagen Requerida:**
- **Título:** Figura 15.3: Error de Renderizado del Mapa
- **Descripción:** Captura de pantalla de la consola del navegador mostrando un error relacionado con Google Maps. Se observa el mensaje de error: "Google Maps JavaScript API error: InvalidKeyMapError" o "Map container is not properly sized". El error indica que la API key es inválida o que el contenedor del mapa no tiene dimensiones correctas. Se muestra la pestaña "Console" con el error resaltado y la pestaña "Elements" mostrando el elemento del mapa con dimensiones cero.

---

## ANEXOS

### A. Comandos Útiles

**Backend:**
```bash
# Iniciar servidor de desarrollo
npm start

# Iniciar con nodemon (reinicio automático)
npm run dev

# Instalar dependencias
npm install
```

**Frontend:**
```bash
# Iniciar servidor de desarrollo
ng serve

# Iniciar en puerto específico
ng serve --port 4200

# Construir para producción
ng build --configuration=production

# Ejecutar pruebas
ng test
```

**Base de Datos:**
```bash
# Conectar a MySQL
mysql -u defensacivil_user -p DefensaCivilH

# Importar esquema
mysql -u defensacivil_user -p DefensaCivilH < schema.sql

# Exportar base de datos
mysqldump -u defensacivil_user -p DefensaCivilH > backup.sql
```

### B. Variables de Entorno

**Backend (.env):**
```env
DB_HOST=localhost
DB_USER=defensacivil_user
DB_PASSWORD=tu_contraseña_segura
DB_NAME=DefensaCivilH
DB_PORT=3306
PORT=3000
NODE_ENV=development
APIS_PERU_TOKEN=tu_token_aqui
JWT_SECRET=tu_secreto_super_seguro_aqui
```

**Frontend (environment.ts):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  googleMapsApiKey: 'tu_api_key_aqui'
};
```

### C. Estructura de Tablas Principales

**Tabla: solicitudes**
```sql
CREATE TABLE solicitudes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  expediente VARCHAR(50),
  solicitante_id INT,
  razon_social VARCHAR(255),
  direccion TEXT,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  tipo ENUM('ITSE', 'ECSE'),
  estado VARCHAR(50),
  fecha_creacion DATETIME,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
);
```

**Tabla: locales**
```sql
CREATE TABLE locales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  expediente VARCHAR(50),
  razon_social VARCHAR(255),
  direccion TEXT,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  estado_licencia VARCHAR(50),
  nivel_riesgo VARCHAR(50),
  fecha_registro DATETIME
);
```

**Tabla: fiscalizaciones**
```sql
CREATE TABLE fiscalizaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  local_id INT,
  inspector_id INT,
  fecha_programada DATE,
  fecha_ejecucion DATE,
  origen VARCHAR(50),
  estado VARCHAR(50),
  tipo_infraccion VARCHAR(255),
  observaciones TEXT,
  monto_multa DECIMAL(10, 2),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  fecha_creacion DATETIME,
  FOREIGN KEY (local_id) REFERENCES locales(id),
  FOREIGN KEY (inspector_id) REFERENCES usuarios(id)
);
```

---

**Manual elaborado por:**
- [Nombre del Equipo de Desarrollo]
- Sistema de Gestión de Defensa Civil - Huanchaco
- Versión 1.0
- Fecha: [Fecha actual]

---

**Manual de Aplicación del Código Fuente - Sistema de Gestión de Defensa Civil - Huanchaco**






