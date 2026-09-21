import { inject, Injectable } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { EvidenceKind, FileRepository } from '../repository/file.repository';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly fileRepository = inject(FileRepository);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackbarService = inject(SnackbarService);

  /** Upload to the private activity bucket and return its object path. */
  public uploadFile(file: File, activityId: string, kind: EvidenceKind): Observable<string> {
    return this.fileRepository.upload(file, activityId, kind);
  }

  public replaceFile(file: File, activityId: string, kind: EvidenceKind,
    previousPath: string | null): Observable<string> {
    return this.fileRepository.replace(file, activityId, kind, previousPath);
  }

  public removeFile(activityId: string, path: string): Observable<void> {
    return this.fileRepository.remove(activityId, path);
  }

  /** Download a private object through a short-lived signed URL. */
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
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        },
        error: () => this.snackbarService.openWarningSnackBar('El archivo no está disponible.'),
      });
  }

  /**
   * Extrae el nombre del archivo de una ruta completa
   */
  private extractFileName(rutaArchivo: string): string {
    return rutaArchivo.split('/').pop() || rutaArchivo;
  }
}
