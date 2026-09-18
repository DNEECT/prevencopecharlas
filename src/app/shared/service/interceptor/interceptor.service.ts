import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpHeaders,
} from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { AuthenticationService } from '../../../security/authentication/service/authentication.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Injectable()
export class InterceptorControlService {
  public constructor() {}

  public skipInterceptor = false;
}

@Injectable()
export class InterceptorService implements HttpInterceptor {
  private readonly snackbarService: SnackbarService = inject(SnackbarService);
  private readonly interceptorControlService: InterceptorControlService =
    inject(InterceptorControlService);
  private readonly authenticationService: AuthenticationService = inject(AuthenticationService);
  private readonly platformId = inject(PLATFORM_ID);

  // Cache en memoria dentro del interceptor
  private readonly cache = new Map<string, { expiry: number; response: HttpResponse<any> }>();
  private readonly DEFAULT_TTL = 1000 * 60 * 2; // 2 minutos

  // buildKey ahora considera si la petición fue proxied y mantiene método + url original
  private buildKey(req: HttpRequest<any>): string {
    const original = req.headers.get('X-Original-Url');
    if (original) {
      return `${req.method}:${original}${req.urlWithParams.includes('?') ? '' : ''}`;
    }
    return `${req.method}:${req.urlWithParams}`;
  }

  private getFromCache(key: string): HttpResponse<any> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.response;
  }

  private setCache(key: string, response: HttpResponse<any>, ttlMs?: number) {
    const expiry = Date.now() + (ttlMs ?? this.DEFAULT_TTL);
    this.cache.set(key, { expiry, response });
  }

  private invalidateRelated(url: string) {
    // Invalidar por prefijo de URL (simple heurística)
    for (const k of Array.from(this.cache.keys())) {
      if (k.startsWith(url) || url.startsWith(k)) {
        this.cache.delete(k);
      }
    }
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.interceptorControlService.skipInterceptor) {
      return next.handle(request);
    }

    // Leer flags de cache desde la petición original (si vienen del cliente)
    const useCache = request.headers.get('X-Use-Cache') === '1';
    const ttlHeader = request.headers.get('X-Cache-TTL');
    const ttlMs = ttlHeader ? Number(ttlHeader) : undefined;

    // Construir headers limpios (no hacer merge con los entrantes)
    const token = this.authenticationService.getAccessToken();
    let headers = new HttpHeaders({
      'Transaccion-Id': uuidv4(),
      'Nombre-Aplicacion': 'SGCS',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Si la URL apunta a ngrok, agregar el header para saltarse la advertencia de navegador
    if (request.url.includes('ngrok')) {
      headers = headers.set('ngrok-skip-browser-warning', '1');
    }

    const isAbsolute = /^https?:\/\//i.test(request.url);
    const proxyPath = environment.proxyPath;

    let proxiedReq: HttpRequest<any>;

    // Si la petición es relativa y apunta a /proxy o /api/proxy, reescribirla
    const isProxyRelativeRequest = !isAbsolute && /^\/(api\/proxy|proxy)(?:$|[/?#])/.test(request.url);
    if (isProxyRelativeRequest) {
      // Si proxyPath es absoluto (p. ej. en dev -> http://localhost:54733/proxy) reescribimos a ese URL
      if (proxyPath && /^https?:\/\//i.test(proxyPath)) {
        proxiedReq = request.clone({ url: proxyPath, headers, body: request.body });
      } else {
        // En producción proxyPath suele ser '/api/proxy' (relativo) -> mantener relativo
        proxiedReq = request.clone({ url: request.url, headers, body: request.body });
      }
    } else {
      if (isAbsolute) {
        // Para GET enviamos la URL original como query (más sencillo para caching en servidor proxy)
        if (request.method === 'GET') {
          const proxiedUrl = `${proxyPath}?url=${encodeURIComponent(request.url)}`;
          headers = headers.set('X-Original-Url', request.url);
          // NOTE: no propagamos cookies (no withCredentials). Si requieres cookies, configúralo explícitamente
          proxiedReq = request.clone({ url: proxiedUrl, headers });
        } else {
          // Para métodos con body enviamos a la ruta proxy y añadimos X-Original-Url
          headers = headers.set('X-Original-Url', request.url).set('X-Original-Method', request.method);

          // Enviar el body tal cual llega. Preservar Content-Type si estaba en la petición original.
          const contentTypeHeader = request.headers.get('Content-Type') || request.headers.get('content-type');
          if (contentTypeHeader) {
            headers = headers.set('Content-Type', contentTypeHeader);
          }

          // Clonar manteniendo el body original (sin envolver ni serializar)
          proxiedReq = request.clone({ url: proxyPath, headers, body: request.body });
        }
      } else {
        // Petición local (relativa) -> solo aplicar headers mínimos
        proxiedReq = request.clone({ headers });
      }
    }

    // Construir forwardedReq eliminando flags de cache que no queremos enviar al backend
    let forwardedHeaders = proxiedReq.headers;
    if (forwardedHeaders.has('X-Use-Cache')) {
      forwardedHeaders = forwardedHeaders.delete('X-Use-Cache');
    }
    if (forwardedHeaders.has('X-Cache-TTL')) {
      forwardedHeaders = forwardedHeaders.delete('X-Cache-TTL');
    }
    const forwardedReq = proxiedReq.clone({ headers: forwardedHeaders });

    if (forwardedReq.method === 'GET' && useCache) {
      const key = this.buildKey(forwardedReq);
      const cached = this.getFromCache(key);
      if (cached) {
        return of(cached.clone({}));
      }
      return next.handle(forwardedReq).pipe(
        tap((event) => {
          if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
            this.setCache(key, event, ttlMs);
          }
        }),
        catchError((error: HttpErrorResponse) => this.handleError(error)),
      );
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(forwardedReq.method)) {
      // invalidar cache de recursos relacionados (si corresponde), usando la URL original cuando exista
      const original = forwardedReq.headers.get('X-Original-Url') ?? forwardedReq.urlWithParams;
      this.invalidateRelated(original);
    }

    return next
      .handle(forwardedReq)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse): Observable<HttpEvent<any>> {
    let mensaje = error?.error?.error?.mensaje || error.message;

    if (error.status === 0 && error.error instanceof ProgressEvent) {
      mensaje = 'Error de red o CORS. Verifica la configuración del servidor.';
      if (isPlatformBrowser(this.platformId)) {
        this.snackbarService.openErrorSnackBar(mensaje);
      }
    } else if (error.status === 401) {
      // Durante SSR no debemos invocar navegación ni componentes que dependan del inyector
      if (isPlatformBrowser(this.platformId)) {
        this.authenticationService.signOut();
        this.snackbarService.openErrorSnackBar(mensaje);
        setTimeout(() => {
          location.reload();
        }, 3000);
      }
    } else {
      if (isPlatformBrowser(this.platformId)) {
        this.snackbarService.openWarningSnackBar(mensaje);
      }
    }

    // rethrow
    throw error;
  }
}
