import { inject, Injectable } from '@angular/core';
import { Observable, map, finalize } from 'rxjs';
import { FileRepository, FileUploadResponse } from '../repository/file.repository';
import { DialogService } from '@shared/service/dialog/dialog.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly fileRepository = inject(FileRepository);
  private readonly dialogService: DialogService = inject(DialogService);

  /**
   * Sube un archivo y retorna la URL/ruta del archivo guardado (string)
   */
  public uploadFile(file: File): Observable<string> {
    return this.fileRepository.upload(file).pipe(
      map((response: FileUploadResponse) => response.datos.codigo)
    );
  }

  /**
   * Descarga un archivo por su ruta completa
   * @param rutaArchivo Ruta completa del archivo (ej: /var/www/files/ventas/public/images/archivo.jpg)
   */
  public downloadFile(rutaArchivo: string): Observable<Blob> {
    return this.fileRepository.download(rutaArchivo);
  }

  /**
   * Descarga y abre el archivo en una nueva pestaña o lo descarga
   * @param rutaArchivo Ruta completa del archivo
   * @param openInNewTab Si true, abre en nueva pestaña; si false, descarga
   */
  public downloadAndOpen(rutaArchivo: string, openInNewTab: boolean = false): void {
    // Extraer nombre del archivo de la ruta
    const nombreArchivo = this.extractFileName(rutaArchivo);

    this.dialogService.openLoadingWindow();
    this.downloadFile(rutaArchivo)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog()
        }),
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          if (openInNewTab) {
            window.open(url, '_blank');
          } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo;
            a.click();
          }
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: (err) => console.error('Error al descargar archivo:', err),
      });
  }

  /**
   * Extrae el nombre del archivo de una ruta completa
   */
  private extractFileName(rutaArchivo: string): string {
    return rutaArchivo.split('/').pop() || rutaArchivo;
  }
}
