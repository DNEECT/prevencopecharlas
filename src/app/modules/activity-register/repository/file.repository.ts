import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/service/api/api.service';
import { HttpClient } from '@angular/common/http';
import {ROUTES_SERVIDOR_PATH} from '@shared/const/routes-servidor.const';

export interface FileUploadDatos {
  codigo: string;
}

export interface FileUploadResponse {
  datos: FileUploadDatos;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class FileRepository {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);

  private readonly uriFile = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.FILES}`;

  public upload(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.apiService.post(`${this.uriFile}/upload`, formData);
  }

  public download(rutaArchivo: string): Observable<Blob> {
    return this.http.get(`${this.uriFile}/download`, {
      params: { rutaArchivo },
      responseType: 'blob',
    });
  }
}
