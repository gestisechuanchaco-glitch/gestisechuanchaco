/**
 * ============================================
 * SCRIPT DE MIGRACIÓN DE CONTRASEÑAS A BCRYPT
 * ============================================
 * 
 * PROPÓSITO: Convertir todas las contraseñas de texto plano a hash bcrypt
 * FECHA: 2025-10-23
 * 
 * ⚠️ IMPORTANTE: Ejecutar UNA SOLA VEZ después de implementar bcrypt
 * 
 * MODO DE USO:
 *   node migrar_contraseñas.js
 * 
 * ============================================
 */

const bcrypt = require('bcrypt');
const { pool } = require('./db');

// Configuración
const SALT_ROUNDS = 10; // Nivel de seguridad (10 es estándar)
const DRY_RUN = false;  // Cambiar a false para ejecutar realmente

console.log('🔐 ============================================');
console.log('🔐  SCRIPT DE MIGRACIÓN DE CONTRASEÑAS');
console.log('🔐 ============================================\n');

if (DRY_RUN) {
  console.log('⚠️  MODO PRUEBA ACTIVADO - No se modificará la base de datos\n');
} else {
  console.log('✅ MODO REAL - Se modificará la base de datos\n');
}

async function migrarContraseñas() {
  try {
    // PASO 1: Obtener todos los usuarios
    pool.query('SELECT id, usuario, contraseña FROM usuarios ORDER BY id', async (err, usuarios) => {
      if (err) {
        console.error('❌ Error al obtener usuarios:', err.message);
        process.exit(1);
      }

      if (usuarios.length === 0) {
        console.log('⚠️  No se encontraron usuarios en la base de datos');
        process.exit(0);
      }

      console.log(`📊 Encontrados ${usuarios.length} usuarios\n`);
      console.log('─'.repeat(80));

      let migrados = 0;
      let yaHasheados = 0;
      let errores = 0;

      // PASO 2: Procesar cada usuario
      for (let i = 0; i < usuarios.length; i++) {
        const user = usuarios[i];
        const numero = `[${i + 1}/${usuarios.length}]`;

        // Verificar si ya está hasheada (bcrypt hashes empiezan con $2b$ o $2a$)
        if (user.contraseña && (user.contraseña.startsWith('$2b$') || user.contraseña.startsWith('$2a$'))) {
          console.log(`${numero} ✅ ${user.usuario.padEnd(20)} - Ya tiene hash bcrypt`);
          yaHasheados++;
          continue;
        }

        // Verificar si la contraseña es null o vacía
        if (!user.contraseña || user.contraseña.trim() === '') {
          console.log(`${numero} ⚠️  ${user.usuario.padEnd(20)} - Contraseña vacía, saltando`);
          errores++;
          continue;
        }

        try {
          // PASO 3: Hashear la contraseña actual
          const contraseniaOriginal = user.contraseña;
          const hashedPassword = await bcrypt.hash(contraseniaOriginal, SALT_ROUNDS);

          if (DRY_RUN) {
            console.log(`${numero} 🔍 ${user.usuario.padEnd(20)} - SIMULACIÓN: ${contraseniaOriginal} → ${hashedPassword.substring(0, 20)}...`);
            migrados++;
          } else {
            // PASO 4: Actualizar en la base de datos
            await new Promise((resolve, reject) => {
              pool.query(
                'UPDATE usuarios SET contraseña = ? WHERE id = ?',
                [hashedPassword, user.id],
                (errUpdate) => {
                  if (errUpdate) {
                    reject(errUpdate);
                  } else {
                    resolve();
                  }
                }
              );
            });

            console.log(`${numero} ✅ ${user.usuario.padEnd(20)} - Contraseña migrada exitosamente`);
            migrados++;
          }
        } catch (error) {
          console.error(`${numero} ❌ ${user.usuario.padEnd(20)} - Error:`, error.message);
          errores++;
        }
      }

      // PASO 5: Resumen final
      console.log('\n' + '─'.repeat(80));
      console.log('\n📊 RESUMEN DE MIGRACIÓN:');
      console.log('─'.repeat(80));
      console.log(`Total de usuarios:      ${usuarios.length}`);
      console.log(`Migrados exitosamente:  ${migrados} ✅`);
      console.log(`Ya hasheados:           ${yaHasheados} 🔒`);
      console.log(`Errores:                ${errores} ${errores > 0 ? '❌' : '✅'}`);
      console.log('─'.repeat(80));

      if (DRY_RUN) {
        console.log('\n⚠️  MODO PRUEBA - No se realizaron cambios reales');
        console.log('💡 Para ejecutar la migración real, cambia DRY_RUN = false en el script\n');
      } else {
        console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
        console.log('🔐 Todas las contraseñas ahora están protegidas con bcrypt');
        console.log('🎯 Los usuarios pueden seguir iniciando sesión con sus contraseñas habituales\n');
      }

      // Cerrar conexión
      pool.end((errEnd) => {
        if (errEnd) {
          console.error('❌ Error al cerrar conexión:', errEnd.message);
        }
        process.exit(errores > 0 ? 1 : 0);
      });
    });
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error);
    process.exit(1);
  }
}

// EJECUTAR MIGRACIÓN
migrarContraseñas();

