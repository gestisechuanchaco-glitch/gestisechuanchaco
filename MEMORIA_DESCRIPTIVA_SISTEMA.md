# Software SISTEMA DE GESTIÓN DE DEFENSA CIVIL - HUANCHACO

## 1. Problema que resuelve

El Sistema de Gestión de Defensa Civil proporciona a la Municipalidad Distrital de Huanchaco la capacidad de gestionar de manera integral y eficiente todas las solicitudes de licencias ITSE (Inspección Técnica de Seguridad en Establecimientos) y ECSE (Evaluación de Condiciones de Seguridad en Establecimientos), así como el control y seguimiento de locales comerciales, fiscalizaciones e inspecciones técnicas. Gracias a esta tecnología, es posible digitalizar completamente el proceso de tramitación de licencias, desde el registro inicial hasta la emisión del certificado, permitiendo a los funcionarios municipales ofrecer un servicio más ágil, transparente y preciso a los ciudadanos. El objetivo es brindar una herramienta que, mediante automatización de procesos e inteligencia artificial, apoye la evaluación de riesgos, la gestión documental, la planificación de inspecciones y el control de cumplimiento normativo, facilitando una administración pública más eficiente y moderna.

## 2. Funcionalidad

### Menú Dashboard

**Descripción:** En este módulo principal se visualiza un panel de control integral que muestra métricas clave del sistema en tiempo real, incluyendo el número total de solicitudes, locales registrados, estados de trámites, alertas críticas, gráficos de tendencias y un mapa interactivo con la distribución geográfica de establecimientos. Además, incluye un widget de alertas inteligentes que genera recordatorios automáticos sobre vencimientos, plazos y acciones pendientes, facilitando la toma de decisiones estratégicas y la gestión proactiva de los procesos municipales.

### Menú Registro de Solicitudes

**Descripción:** Este módulo permite al usuario registrar las solicitudes de licencias ITSE y ECSE mediante un formulario multi-página que captura información completa del solicitante (datos personales, DNI, contacto), datos del establecimiento (razón social, RUC, dirección, coordenadas GPS), información técnica (área, número de pisos, giro comercial, nivel de riesgo) y documentación requerida. Incluye integración con mapas para georreferenciación, consulta RENIEC para validación de datos, predicción automática de nivel de riesgo mediante machine learning, y soporte para renovaciones de licencias existentes.

### Menú Reportes

**Descripción:** Este módulo permite al usuario visualizar, gestionar y exportar todas las solicitudes registradas en el sistema. Incluye filtros avanzados por estado, expediente, fecha y otros criterios, permitiendo editar información de solicitudes, asignar inspectores, finalizar trámites, generar certificados en PDF, gestionar documentos, y realizar un seguimiento completo del estado de cada solicitud. Además, proporciona un panel de notificaciones para el seguimiento de comunicaciones enviadas a los solicitantes.

### Menú Locales

**Descripción:** Este módulo permite al usuario gestionar el inventario completo de locales comerciales registrados en el sistema. Proporciona funcionalidades para visualizar, buscar y filtrar locales por diversos criterios (expediente, razón social, estado de licencia, nivel de riesgo), ver detalles completos de cada establecimiento, gestionar renovaciones, y visualizar la ubicación de todos los locales en un mapa interactivo con marcadores georreferenciados. También incluye alertas sobre vencimientos de licencias y renovaciones pendientes.

### Menú Fiscalizaciones

**Descripción:** Este módulo permite al usuario gestionar el proceso completo de fiscalizaciones a establecimientos comerciales, desde la programación hasta la conclusión del caso. Incluye la creación de fiscalizaciones por diferentes orígenes (oficio, denuncia, post-ITSE, operativo, reinspección), registro de infracciones detectadas, gestión de evidencias fotográficas, cálculo automático de multas, generación de actas y notificaciones, y seguimiento del estado de subsanación. Permite filtrar y buscar fiscalizaciones por estado, inspector, fecha, tipo de infracción y otros criterios.

### Menú Inspecciones

**Descripción:** Este módulo permite al usuario programar, ejecutar y registrar las inspecciones técnicas realizadas a los establecimientos. Incluye la asignación de inspectores, registro de observaciones y hallazgos durante la inspección, captura de evidencias fotográficas, evaluación de condiciones de seguridad, y generación de informes técnicos. También proporciona un historial completo de todas las inspecciones realizadas con sus respectivos resultados.

### Menú Calendario

**Descripción:** Este módulo permite al usuario visualizar en un calendario interactivo todos los eventos importantes del sistema, incluyendo vencimientos de licencias, fechas programadas de inspecciones y fiscalizaciones, plazos de subsanación, y otros eventos relevantes. Proporciona vistas mensual, semanal y diaria, permite filtrar eventos por tipo, y genera notificaciones automáticas sobre eventos próximos a vencer.

### Menú Notificaciones

**Descripción:** Este módulo centraliza todas las notificaciones del sistema, permitiendo al usuario visualizar el historial completo de comunicaciones enviadas a los solicitantes, gestionar envíos masivos, configurar plantillas de notificaciones, y realizar seguimiento del estado de entrega. Incluye integración con WhatsApp para envío automático de notificaciones y recordatorios a los ciudadanos.

### Menú Historial

**Descripción:** Este módulo permite al usuario visualizar un historial completo de todas las acciones realizadas en el sistema, incluyendo solicitudes procesadas, inspecciones ejecutadas, fiscalizaciones realizadas, cambios de estado, y modificaciones de datos. Proporciona filtros avanzados por fecha, usuario, tipo de acción y módulo, facilitando la auditoría y el seguimiento de procesos.

### Menú Perfil

**Descripción:** Este módulo permite al usuario gestionar su perfil personal dentro del sistema, incluyendo la modificación de datos de contacto, cambio de contraseña, visualización de actividad reciente, y configuración de preferencias de notificaciones y visualización.

### Menú Ajustes

**Descripción:** Este módulo permite a los administradores configurar parámetros generales del sistema, gestionar usuarios y roles, configurar permisos de acceso, definir tipos de infracciones y sus montos de multa, y realizar otras configuraciones administrativas necesarias para el funcionamiento del sistema.

### Salir del Sistema

**Descripción:** Este módulo permite al usuario cerrar sesión de manera segura, invalidando el token de autenticación y redirigiendo a la página de inicio de sesión.

## 3. Arquitectura de software

**Lenguaje de programación Frontend:** TypeScript 5.x  
**Framework Frontend:** Angular 20.1.0 (Componentes Standalone)  
**Lenguaje de programación Backend:** JavaScript (Node.js)  
**Framework Backend:** Express.js 4.18.2  
**Base de datos:** MySQL (DefensaCivilH)  
**Patrones de diseño:** MVC (Modelo Vista Controlador), RESTful API  
**Tecnologías adicionales:** Google Maps API, Chart.js, PDFKit, Multer (manejo de archivos), bcrypt (encriptación de contraseñas)







