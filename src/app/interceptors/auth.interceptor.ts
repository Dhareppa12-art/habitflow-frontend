import { Injectable } from '@angular/core';
import { HttpEvent,HttpHandler,HttpInterceptor,HttpRequest} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = this.authService.getToken();
    const isApiUrl = req.url.startsWith(environment.apiUrl);

    // Only attach token for backend calls
    if (token && isApiUrl) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next.handle(authReq);
    }

    // No token → or not our API → send normal request
    return next.handle(req);
  }
}
