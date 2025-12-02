# 🚀 GUÍA RÁPIDA DE MEJORAS - Defensa Civil Frontend

Esta guía te ayudará a implementar las mejoras prioritarias identificadas en la revisión.

---

## 🔴 PRIORIDAD 1: Variables de Entorno

### Paso 1: Instalar dotenv en el backend

```bash
cd banckend
npm install dotenv
```

### Paso 2: Crear archivo `.env`

Crea `banckend/.env` con el siguiente contenido:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123eRe456
DB_NAME=DefensaCivilH
DB_PORT=3306

# Servidor
PORT=3000
NODE_ENV=development

# API Externa
APIS_PERU_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFudG9uaWFob3JuYTZAZ21haWwuY29tIn0.eICLNsCmEB8CYuJ-6kvnabVno6LL8ah5q0RofZi-Wbw

# JWT (si lo implementas después)
JWT_SECRET=tu_secreto_super_seguro_aqui
```

### Paso 3: Crear archivo `.env.example`

Crea `banckend/.env.example` (este SÍ se sube a Git):

```env
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_aqui
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

### Paso 4: Actualizar `db.js`

```javascript
require('dotenv').config();
const mysql = require('mysql2');

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

### Paso 5: Actualizar `index.js`

Al inicio del archivo, después de los requires:

```javascript
require('dotenv').config();
```

Y actualiza cualquier referencia hardcodeada a usar `process.env`.

### Paso 6: Actualizar `.gitignore`

Asegúrate de que `banckend/.gitignore` incluya:

```
node_modules/
.env
.env.local
.env.*.local
uploads/
*.log
.DS_Store
```

---

## 🔴 PRIORIDAD 2: Actualizar Frontend para usar Environment

### Paso 1: Actualizar `environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  enableLogs: true,
  appName: 'Defensa Civil Huanchaco',
  version: '1.0.0',
  apisPeruToken: 'TU_TOKEN_AQUI' // O mejor, obtenerlo del backend
};
```

### Paso 2: Actualizar `fiscalizacion.ts`

Reemplaza:
```typescript
private tokenApisPeru = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
```

Por:
```typescript
import { environment } from '../../environments/environment';
private tokenApisPeru = environment.apisPeruToken;
```

O mejor aún, crear un endpoint en el backend que consulte la API de SUNAT, así el token nunca se expone en el frontend.

---

## 🟡 PRIORIDAD 3: Refactorizar Backend

### Estructura Sugerida:

```
banckend/
├── index.js (solo configuración Express)
├── db.js
├── config/
│   └── environment.js
├── routes/
│   ├── auth.js
│   ├── solicitudes.js
│   ├── fiscalizaciones.js
│   ├── locales.js
│   ├── notificaciones.js
│   └── usuarios.js
├── middleware/
│   ├── errorHandler.js
│   ├── logger.js
│   └── auth.js
├── controllers/
│   ├── solicitudesController.js
│   ├── fiscalizacionesController.js
│   └── ...
└── utils/
    ├── validators.js
    └── helpers.js
```

### Ejemplo: Crear `routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const { usuario, contraseña, rol } = req.body;
  
  try {
    const [results] = await pool.promise().query(
      `SELECT 
        u.id, u.usuario, u.nombres_completos, u.contraseña, u.rol_id, 
        u.fecha_creacion, u.email, u.foto_perfil, r.nombre as rol
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE u.usuario = ? AND r.nombre = ?`,
      [usuario, rol]
    );

    if (results.length === 0) {
      return res.json({ success: false, message: 'Usuario o rol incorrecto' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(contraseña, user.contraseña);
    
    if (!passwordMatch) {
      return res.json({ success: false, message: 'Contraseña incorrecta' });
    }

    // Construir URL de foto
    let fotoPerfilUrl = null;
    if (user.foto_perfil) {
      fotoPerfilUrl = user.foto_perfil.startsWith('http') 
        ? user.foto_perfil 
        : `http://localhost:${process.env.PORT || 3000}${user.foto_perfil}`;
    }

    // Actualizar última sesión
    await pool.promise().query(
      'UPDATE usuarios SET ultima_sesion = NOW() WHERE id = ?', 
      [user.id]
    );

    res.json({ 
      success: true,
      token: 'session-' + Date.now(),
      usuario: {
        id: user.id,
        usuario: user.usuario,
        nombres_apellidos: user.nombres_completos || user.usuario,
        nombre_completo: user.nombres_completos || user.usuario,
        fullName: user.nombres_completos || user.usuario,
        email: user.email || 'admin@huanchaco.gob.pe',
        rol: user.rol,
        rol_id: user.rol_id,
        roleId: user.rol_id,
        roleName: user.rol,
        foto_perfil: fotoPerfilUrl,
        fecha_creacion: user.fecha_creacion
      }
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error de base de datos',
      detail: error.message
    });
  }
});

module.exports = router;
```

### Actualizar `index.js` principal

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use('/login', require('./routes/auth'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/fiscalizaciones', require('./routes/fiscalizaciones'));
// ... más rutas

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
```

---

## 🟡 PRIORIDAD 4: Mejorar Tipado TypeScript

### Crear `src/app/interfaces/`

Crear archivos de interfaces:

**`src/app/interfaces/solicitud.interface.ts`**
```typescript
export interface Solicitud {
  id: number;
  rol: string;
  nombres_apellidos: string;
  dni_ce: string;
  estado: string;
  numerodeexpediente: string;
  razon_social: string;
  inspector_asignado?: string;
  fecha: Date | string;
  tipo_tramite: 'ITSE' | 'ECSE';
  // ... más campos
}
```

**`src/app/interfaces/fiscalizacion.interface.ts`**
```typescript
export interface Fiscalizacion {
  id: number;
  numero_fiscalizacion: string;
  fecha_fiscalizacion: string;
  origen: string;
  razon_social: string;
  // ... más campos
}
```

Luego actualizar los componentes para usar estas interfaces en lugar de `any`.

---

## 🟢 PRIORIDAD 5: Testing Básico

### Instalar dependencias de testing

```bash
npm install --save-dev jest @types/jest
```

### Ejemplo: Test para LoginService

**`src/app/service/login.service.spec.ts`**
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(LoginService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Seguridad (PRIORIDAD 1)
- [ ] Instalar dotenv
- [ ] Crear `.env` y `.env.example`
- [ ] Actualizar `db.js` para usar variables de entorno
- [ ] Actualizar `index.js` para cargar dotenv
- [ ] Verificar `.gitignore` incluye `.env`
- [ ] Mover token de API a variables de entorno
- [ ] Actualizar frontend para usar environment

### Organización (PRIORIDAD 2)
- [ ] Crear estructura de carpetas sugerida
- [ ] Refactorizar `index.js` en módulos
- [ ] Crear `routes/auth.js`
- [ ] Crear `routes/solicitudes.js`
- [ ] Crear middleware de errores
- [ ] Mover lógica de negocio a controllers

### Calidad de Código (PRIORIDAD 3)
- [ ] Crear interfaces TypeScript
- [ ] Actualizar componentes para usar interfaces
- [ ] Eliminar uso de `any` donde sea posible
- [ ] Agregar validaciones en formularios
- [ ] Mejorar mensajes de error

### Testing (PRIORIDAD 4)
- [ ] Configurar Jest/Karma
- [ ] Crear tests para servicios
- [ ] Crear tests para componentes críticos
- [ ] Configurar cobertura de código

---

## 📝 NOTAS ADICIONALES

1. **Backup antes de cambios:** Siempre haz backup antes de refactorizar
2. **Commits frecuentes:** Haz commits pequeños y frecuentes
3. **Probar cada cambio:** Prueba cada mejora antes de pasar a la siguiente
4. **Documentar cambios:** Documenta los cambios que hagas

---

**¡Éxito con las mejoras! 🚀**

