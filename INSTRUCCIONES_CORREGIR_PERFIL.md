# 🔧 SOLUCIÓN: Error "Usuario no encontrado" en Perfil

## ❌ PROBLEMA
El localStorage tiene guardado `usuario_id = 1`, pero ese usuario NO existe en la base de datos.

## ✅ SOLUCIÓN RÁPIDA

### Opción 1: Cerrar sesión y volver a entrar (RECOMENDADO)

1. **Cierra sesión** en la aplicación
2. Presiona `F12` para abrir DevTools
3. Ve a la pestaña **Console**
4. Ejecuta:
   ```javascript
   localStorage.clear();
   ```
5. **Vuelve a iniciar sesión** con tu usuario (antonia, peru, etc.)
6. El sistema guardará automáticamente el ID correcto

---

### Opción 2: Corregir manualmente el localStorage

1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña **Console**
3. Ejecuta el siguiente código (ajusta el ID según tu usuario):

```javascript
// Si eres ANTONIA (Administrador)
localStorage.setItem('usuario_id', '2');
let user = JSON.parse(localStorage.getItem('user') || '{}');
user.id = 2;
localStorage.setItem('user', JSON.stringify(user));
location.reload();
```

```javascript
// Si eres PERU (Administrativo)
localStorage.setItem('usuario_id', '3');
let user = JSON.parse(localStorage.getItem('user') || '{}');
user.id = 3;
localStorage.setItem('user', JSON.stringify(user));
location.reload();
```

```javascript
// Si eres DCARRANZAL (Administrativo)
localStorage.setItem('usuario_id', '8');
let user = JSON.parse(localStorage.getItem('user') || '{}');
user.id = 8;
localStorage.setItem('user', JSON.stringify(user));
location.reload();
```

---

## 📋 USUARIOS CORRECTOS EN TU BASE DE DATOS

| ID | Usuario      | Nombre                          | Rol              |
|----|--------------|---------------------------------|------------------|
| 2  | antonia      | antonia gianella horna...       | Administrador    |
| 3  | peru         | peru libertdad mendez           | Administrativo   |
| 8  | Dcarranzal   | Ing. Denniz Paul Carranza Luna  | Administrativo   |
| 9  | DMmartinez   | Ing. David Martínez Reluz       | Inspector        |
| 10 | Vmanuel      | Arq. Victor Manuel Ruiz Vásquez | Inspector        |

---

## 🎯 DESPUÉS DE CORREGIR

1. Ve a la sección **Perfil**
2. Haz clic en el botón de **cámara** 📷
3. Selecciona una imagen (máx 5MB)
4. La foto se subirá correctamente ✅

---

## 🔍 VERIFICAR QUE FUNCIONÓ

Abre DevTools (`F12`) → Console y ejecuta:
```javascript
console.log('ID actual:', localStorage.getItem('usuario_id'));
console.log('User completo:', JSON.parse(localStorage.getItem('user')));
```

Deberías ver tu ID correcto (2, 3, 8, 9 o 10).


