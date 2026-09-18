import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http: HttpClient = inject(HttpClient);

  public get(
    path: string,
    params?: any,
    data?: any,
    headersParams?: Record<string, string>,
    // useCache: si true usará cache en memoria (solo para GET). ttlMs: tiempo de vida en ms.
    useCache: boolean = false,
    ttlMs?: number,
  ): Observable<any> {
    // si se solicita cache, añadir headers que el interceptor entenderá
    const headersWithCache = headersParams ? { ...headersParams } : {};
    if (useCache) {
      headersWithCache['X-Use-Cache'] = '1';
      if (ttlMs) headersWithCache['X-Cache-TTL'] = String(ttlMs);
    }

    return this.request({
      method: 'GET',
      data,
      path,
      isExport: false,
      params,
      headersParams: headersWithCache,
    });
  }

  public post(
    path: string,
    data?: any,
    params?: any,
    headersParams?: Record<string, string>,
  ): Observable<any> {
    return this.request({
      method: 'POST',
      data,
      path,
      isExport: false,
      params,
      headersParams,
    });
  }

  public put(path: string, data?: any): Observable<any> {
    return this.request({
      method: 'PUT',
      data,
      path,
    });
  }

  public patch(path: string, data?: any): Observable<any> {
    return this.request({
      method: 'PATCH',
      data,
      path,
    });
  }

  public delete(path: string, data?: any): Observable<any> {
    return this.request({
      method: 'DELETE',
      data,
      path,
    });
  }

  public export(path: string, data?: any): Observable<any> {
    return this.request({
      method: 'POST',
      data,
      path,
      isExport: true,
    });
  }

  private request({
    method,
    data,
    path,
    isExport = false,
    params,
    headersParams,
  }: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
    path: string;
    isExport?: boolean;
    params?: any;
    headersParams?: Record<string, string>;
  }): Observable<any> {
    const options: any = {};
    let dataCodificada;
    if (data instanceof FormData) {
      dataCodificada = data;
    } else {
      dataCodificada = JSON.stringify(data || {});
      options.headers = new HttpHeaders(this.getHeaders(true, headersParams));
    }

    if (params) {
      options.params = params;
    }
    if (isExport) {
      options.observe = 'response';
      options.responseType = 'blob' as 'json';
    }

    switch (method) {
      case 'GET':
        return this.http.get(path, options);
      case 'POST':
        return this.http.post(path, dataCodificada, options);
      case 'PUT':
        return this.http.put(path, dataCodificada, options);
      case 'PATCH':
        return this.http.patch(path, dataCodificada, options);
      case 'DELETE':
        return this.http.delete(path, options);
    }
  }

  public getHeaders(
    includeJsonContentType: boolean = true,
    headersParams?: Record<string, string>,
  ) {
    const headers: { [header: string]: string } = {};

    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (headersParams) {
      Object.assign(headers, headersParams);
    }

    return headers;
  }
}
