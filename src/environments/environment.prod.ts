// Ambiente de PRODUCCIÓN
export const environment = {
  production: true,
  apiUrl: 'https://touchedly-unbegrudged-natividad.ngrok-free.dev',
  // URL del servicio de predicción de riesgo (Python)
  // El backend Node.js actúa como proxy, así que usa la misma URL base
  predictApiUrl: 'https://touchedly-unbegrudged-natividad.ngrok-free.dev',
  enableLogs: false, // ❌ Los logs están DESACTIVADOS en producción
  appName: 'Defensa Civil Huanchaco',
  version: '1.0.0'
};










