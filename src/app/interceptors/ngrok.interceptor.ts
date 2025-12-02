import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo agregar header de ngrok si la petición es hacia nuestro backend (ngrok)
  // No agregarlo a APIs externas como apisperu.com, codart.cgrt.net, etc.
  const requestUrl = req.url.toLowerCase();
  const apiUrl = environment.apiUrl.toLowerCase();
  
  // Verificar si la petición es hacia nuestro backend (contiene la URL de ngrok)
  const isNgrokRequest = requestUrl.includes(apiUrl) || 
                         requestUrl.startsWith(apiUrl) ||
                         (apiUrl.includes('ngrok') && requestUrl.includes('ngrok'));
  
  // Excluir APIs externas conocidas
  const isExternalApi = requestUrl.includes('apisperu.com') || 
                        requestUrl.includes('codart.cgrt.net') ||
                        requestUrl.includes('dniruc.apisperu.com');
  
  // Solo agregar el header si es una petición a nuestro backend y no es una API externa
  if (isNgrokRequest && !isExternalApi) {
    const clonedReq = req.clone({
      setHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    return next(clonedReq);
  }
  
  // Para peticiones externas, no agregar ningún header adicional
  return next(req);
};

