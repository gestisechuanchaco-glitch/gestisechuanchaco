// Script de prueba para verificar fiscalizaciones
const { pool } = require('./db');

console.log('🧪 Iniciando pruebas de fiscalizaciones...\n');

// Test 1: Verificar conexión
pool.query('SELECT 1 as test', (err, results) => {
  if (err) {
    console.error('❌ Error de conexión:', err);
    process.exit(1);
  }
  console.log('✅ Conexión a la base de datos OK\n');
  
  // Test 2: Verificar si existe la tabla
  pool.query('SHOW TABLES LIKE "fiscalizaciones"', (err, results) => {
    if (err) {
      console.error('❌ Error al verificar tabla:', err);
      process.exit(1);
    }
    
    if (results.length === 0) {
      console.error('❌ La tabla "fiscalizaciones" NO EXISTE');
      process.exit(1);
    }
    
    console.log('✅ La tabla "fiscalizaciones" existe\n');
    
    // Test 3: Contar registros
    pool.query('SELECT COUNT(*) as total FROM fiscalizaciones', (err, results) => {
      if (err) {
        console.error('❌ Error al contar registros:', err);
        process.exit(1);
      }
      
      const total = results[0].total;
      console.log(`📊 Total de fiscalizaciones: ${total}\n`);
      
      if (total === 0) {
        console.warn('⚠️ No hay fiscalizaciones registradas');
        process.exit(0);
      }
      
      // Test 4: Ver estructura de la tabla
      pool.query('DESCRIBE fiscalizaciones', (err, results) => {
        if (err) {
          console.error('❌ Error al obtener estructura:', err);
          process.exit(1);
        }
        
        console.log('📋 Estructura de la tabla "fiscalizaciones":');
        results.forEach(col => {
          console.log(`   - ${col.Field} (${col.Type})`);
        });
        console.log('');
        
        // Test 5: Ver últimos registros
        pool.query('SELECT * FROM fiscalizaciones ORDER BY creado_en DESC LIMIT 3', (err, results) => {
          if (err) {
            console.error('❌ Error al obtener registros:', err);
            process.exit(1);
          }
          
          console.log('🔍 Últimas 3 fiscalizaciones:');
          results.forEach(f => {
            console.log(`   ID: ${f.id} | Nº: ${f.numero_fiscalizacion} | Estado: ${f.estado} | Gravedad: ${f.gravedad} | Multa: ${f.monto_multa}`);
          });
          console.log('');
          
          // Test 6: Estadísticas
          const queries = {
            total: 'SELECT COUNT(*) as total FROM fiscalizaciones',
            pendientes: `SELECT COUNT(*) as pendientes FROM fiscalizaciones 
                         WHERE estado IN ('Programada', 'En Ejecución', 'Ejecutada', 'Notificada')`,
            subsanadas: `SELECT COUNT(*) as subsanadas FROM fiscalizaciones 
                         WHERE estado = 'Subsanada'`,
            montoTotal: `SELECT SUM(monto_multa) as monto FROM fiscalizaciones 
                         WHERE monto_multa > 0`,
            muyGraves: `SELECT COUNT(*) as muy_graves FROM fiscalizaciones 
                        WHERE gravedad = 'Muy Grave'`
          };
          
          console.log('📈 Ejecutando queries de estadísticas...\n');
          
          Promise.all([
            new Promise((resolve, reject) => {
              pool.query(queries.total, (err, rows) => {
                if (err) reject(err);
                else {
                  console.log(`   ✓ Total: ${rows[0].total}`);
                  resolve();
                }
              });
            }),
            new Promise((resolve, reject) => {
              pool.query(queries.pendientes, (err, rows) => {
                if (err) reject(err);
                else {
                  console.log(`   ✓ Pendientes: ${rows[0].pendientes}`);
                  resolve();
                }
              });
            }),
            new Promise((resolve, reject) => {
              pool.query(queries.subsanadas, (err, rows) => {
                if (err) reject(err);
                else {
                  console.log(`   ✓ Subsanadas: ${rows[0].subsanadas}`);
                  resolve();
                }
              });
            }),
            new Promise((resolve, reject) => {
              pool.query(queries.montoTotal, (err, rows) => {
                if (err) reject(err);
                else {
                  console.log(`   ✓ Monto Total: S/ ${rows[0].monto || 0}`);
                  resolve();
                }
              });
            }),
            new Promise((resolve, reject) => {
              pool.query(queries.muyGraves, (err, rows) => {
                if (err) reject(err);
                else {
                  console.log(`   ✓ Muy Graves: ${rows[0].muy_graves}`);
                  resolve();
                }
              });
            })
          ]).then(() => {
            console.log('\n🎉 Todas las pruebas completadas exitosamente!\n');
            process.exit(0);
          }).catch(err => {
            console.error('\n❌ Error en estadísticas:', err);
            process.exit(1);
          });
        });
      });
    });
  });
});








