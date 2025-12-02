import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  // Agregar header de ngrok si la URL contiene ngrok
  if (environment.apiUrl.includes('ngrok')) {
    const clonedReq = req.clone({
      setHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    return next(clonedReq);
  }
  return next(req);
};

