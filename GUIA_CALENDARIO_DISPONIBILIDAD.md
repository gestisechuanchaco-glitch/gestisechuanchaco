# 📅 Guía: Crear Eventos y Ver Disponibilidad

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. 🆕 **Crear Eventos desde el Calendario**

#### ¿Cómo funciona?
1. **Click en una fecha vacía** del calendario
2. Se abre un modal para crear un nuevo evento
3. Seleccionas el tipo (Inspección o Fiscalización)
4. Seleccionas la hora
5. Opcionalmente seleccionas un inspector
6. Click en "Continuar"
7. Se abre el formulario correspondiente con la fecha y hora prellenadas

#### Ventajas:
- ✅ **Rápido:** No necesitas ir a otro módulo primero
- ✅ **Visual:** Ves el calendario y eliges la fecha directamente
- ✅ **Prellenado:** La fecha y hora se llenan automáticamente
- ✅ **Asignación opcional:** Puedes asignar inspector desde el inicio

#### Ejemplo de uso:
```
1. Abres el calendario
2. Ves que el 25 de febrero está libre
3. Click en esa fecha
4. Seleccionas "Inspección" y hora "10:00"
5. Seleccionas inspector "Juan Pérez"
6. Click "Continuar"
7. Se abre el formulario de solicitudes con todo prellenado
```

---

### 2. 👥 **Vista de Disponibilidad de Inspectores**

#### ¿Cómo funciona?
1. Click en el botón **"Ver Disponibilidad"** en el calendario
2. Seleccionas una fecha
3. Click en "Consultar"
4. Ves la lista de todos los inspectores con su estado:
   - 🟢 **Disponible:** Sin eventos asignados
   - 🟡 **Ocupado:** Tiene 1-4 eventos
   - 🔴 **Sobrecargado:** Tiene 5 o más eventos

#### Información mostrada:
- ✅ Nombre del inspector
- ✅ Estado de disponibilidad
- ✅ Cantidad de eventos asignados
- ✅ Lista de eventos con hora
- ✅ Tipo de cada evento (Inspección/Fiscalización/Reinspección)

#### Ventajas:
- ✅ **Planificación:** Sabes quién está disponible antes de asignar
- ✅ **Balanceo de carga:** Evitas sobrecargar a un inspector
- ✅ **Visibilidad:** Ves todos los eventos de cada inspector en un día
- ✅ **Decisiones informadas:** Asignas basándote en datos reales

#### Ejemplo de uso:
```
1. Quieres programar una inspección para el 20 de febrero
2. Click en "Ver Disponibilidad"
3. Seleccionas fecha: 20 de febrero
4. Click "Consultar"
5. Ves que:
   - Inspector A: Disponible (0 eventos)
   - Inspector B: Ocupado (3 eventos)
   - Inspector C: Sobrecargado (6 eventos)
6. Decides asignar a Inspector A porque está disponible
```

---

## 🎯 CASOS DE USO PRÁCTICOS

### Caso 1: Planificar Semana Completa
```
Lunes: Ver disponibilidad → Asignar inspecciones a inspectores disponibles
Martes: Click en fecha → Crear fiscalización directamente
Miércoles: Ver disponibilidad → Redistribuir carga si es necesario
```

### Caso 2: Asignación Inteligente
```
1. Necesitas asignar 3 inspecciones para mañana
2. Abres "Ver Disponibilidad" para mañana
3. Ves que Inspector A tiene 0 eventos (disponible)
4. Inspector B tiene 2 eventos (ocupado pero manejable)
5. Inspector C tiene 6 eventos (sobrecargado)
6. Asignas las 3 inspecciones a Inspector A
```

### Caso 3: Creación Rápida
```
1. Estás viendo el calendario
2. Notas que falta una inspección el día 15
3. Click directo en el día 15
4. Seleccionas tipo y hora
5. Se abre el formulario prellenado
6. Completas los datos y guardas
7. ¡Listo! Evento creado en 30 segundos
```

---

## 📊 ESTADOS DE DISPONIBILIDAD

### 🟢 Disponible
- **Condición:** 0 eventos asignados
- **Significado:** Inspector completamente libre
- **Recomendación:** Ideal para asignar nuevas tareas

### 🟡 Ocupado
- **Condición:** 1-4 eventos asignados
- **Significado:** Inspector tiene trabajo pero puede manejar más
- **Recomendación:** Puede aceptar 1-2 eventos más

### 🔴 Sobrecargado
- **Condición:** 5 o más eventos asignados
- **Significado:** Inspector tiene demasiada carga
- **Recomendación:** NO asignar más eventos, redistribuir carga

---

## 🔧 CONFIGURACIÓN

### Umbral de Sobrecarga
En el backend (`banckend/index.js` línea 2499):
```javascript
let carga_alta = eventosCount >= 5; // 5 o más eventos = sobrecargado
```

Puedes ajustar este número según tus necesidades:
- `>= 3` para ser más estricto
- `>= 7` para ser más flexible

---

## 💡 TIPS Y MEJORES PRÁCTICAS

### Para Administradores:
1. **Revisa disponibilidad antes de asignar:** Evita sobrecargar inspectores
2. **Usa el calendario para planificar:** Ve la semana completa antes de asignar
3. **Balancea la carga:** Distribuye eventos entre todos los inspectores
4. **Crea eventos desde el calendario:** Es más rápido y visual

### Para Inspectores:
1. **Revisa tu calendario diario:** Ve qué tienes programado
2. **Planifica tus rutas:** Usa el mapa de recorrido si tienes múltiples visitas
3. **Comunica sobrecargas:** Si ves que estás sobrecargado, avisa al administrador

---

## 🚀 FLUJO COMPLETO DE TRABAJO

### Escenario: Programar 5 inspecciones para la próxima semana

1. **Abrir Calendario**
   - Navegar a `/calendario`

2. **Ver Disponibilidad**
   - Click en "Ver Disponibilidad"
   - Seleccionar fecha del lunes
   - Ver qué inspectores están disponibles

3. **Crear Eventos**
   - Click en la fecha del lunes
   - Seleccionar "Inspección"
   - Seleccionar inspector disponible
   - Click "Continuar"
   - Completar formulario

4. **Repetir para otros días**
   - Mismo proceso para martes, miércoles, etc.

5. **Verificar Balance**
   - Volver a "Ver Disponibilidad"
   - Verificar que ningún inspector esté sobrecargado

---

## ✅ BENEFICIOS

### Antes (sin estas funcionalidades):
- ❌ Tenías que ir a cada módulo para crear eventos
- ❌ No sabías quién estaba disponible
- ❌ Fácil sobrecargar a un inspector
- ❌ Planificación manual y propensa a errores

### Ahora (con estas funcionalidades):
- ✅ Creas eventos directamente desde el calendario
- ✅ Ves quién está disponible antes de asignar
- ✅ Evitas sobrecargar inspectores
- ✅ Planificación visual y eficiente
- ✅ Mejor distribución de carga de trabajo

---

## 🎉 ¡TODO LISTO!

Las funcionalidades están completamente implementadas y listas para usar:

1. ✅ **Crear eventos desde calendario** - Click en fecha
2. ✅ **Ver disponibilidad** - Botón "Ver Disponibilidad"
3. ✅ **Prellenado automático** - Fecha e inspector se llenan solos
4. ✅ **Estados visuales** - Colores para identificar disponibilidad

**¡Disfruta de tu nuevo calendario mejorado!** 🚀

