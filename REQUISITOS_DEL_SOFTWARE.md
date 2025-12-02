# REQUISITOS DEL SOFTWARE
## Sistema de Gestión de Defensa Civil - Huanchaco

---

Requisitos del software:

Sistema Operativo: Windows, macOS o Linux
Visual Studio Code: Versión compatible (2019 o superior)
Node.js: Versión 18.x o superior (recomendado 20.x LTS)
Angular CLI: Versión 20.1.3 o superior
MySQL: Versión 5.7 o superior (recomendado 8.0)
Navegador compatible: Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, etc.
Procesador: Intel Core i3 o equivalente
Memoria en RAM: 4 GB o superior
Espacio en disco duro: 1 GB o superior

Requisitos previos que se van a instalar:

Instalar Node.js (versión 18.x o superior)
Instalar Angular CLI (versión 20.1.3 o superior)
MySQL configurado y funcionando (versión 5.7 o superior)
Base de datos DefensaCivilH creada y configurada
Configurar API Key de Google Maps (opcional, para funcionalidad de mapas)
Instalar dependencias del backend (npm install en carpeta banckend/)
Instalar dependencias del frontend (npm install en carpeta raíz)

---

## PASOS PARA LA INSTALACIÓN

1. **Instalar Node.js** desde https://nodejs.org/ (versión 18.x o superior)
2. **Instalar Angular CLI** ejecutando: `npm install -g @angular/cli@20.1.3`
3. **Instalar MySQL** desde https://dev.mysql.com/downloads/mysql/ (versión 5.7 o superior)
4. **Crear base de datos** DefensaCivilH en MySQL
5. **Descargar el proyecto** y abrir en Visual Studio Code
6. **Instalar dependencias del backend**: `cd banckend` → `npm install`
7. **Configurar conexión a BD** editando `banckend/db.js` con sus credenciales
8. **Instalar dependencias del frontend**: `cd ..` → `npm install`
9. **Ejecutar scripts SQL** para crear las tablas necesarias
10. **Iniciar backend**: `cd banckend` → `node index.js` (puerto 3000)
11. **Iniciar frontend**: `ng serve` (puerto 4200)
12. **Acceder al sistema** en http://localhost:4200

---

**© 2025 Municipalidad Distrital de Huanchaco - Todos los derechos reservados**
