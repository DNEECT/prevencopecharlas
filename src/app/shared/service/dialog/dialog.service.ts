import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogBaseComponent } from '@shared/components/dialog-base/dialog-base.component';
import { DialogLoadingComponent } from '@shared/components/dialog-loading/dialog-loading.component';
import { DialogUploadComponent } from '@shared/components/dialog-upload/dialog-upload.component';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { DialogDataDto, DialogParams } from '@shared/interface/dialog.interface';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly matDialog: MatDialog = inject(MatDialog);
  private readonly breakpointObserver: BreakpointObserver = inject(BreakpointObserver);
  private readonly standardDialogParams: DialogParams = {
    width: this.breakpointObserver.isMatched('(max-width: 1200px)') ? '80%' : '30%',
    minWidth: '300px',
    height: '280px',
    minHeight: '250px',
    hasBackdrop: true,
    backdropClass: 'blur-backdrop',
    disableClose: true,
  };

  public openDialogConfirmacion(title: string, content: string): Observable<any> {
    const data: DialogDataDto = {
      tittle: title,
      content,
      icon: 'warning',
      color: '#f5a623',
      actions: [
        { name: 'Cancelar', style: 'button-border', returnValue: false },
        { name: 'Aceptar', style: 'button-fill', returnValue: true },
      ],
    };

    const dialogParams: DialogParams = {
      width: this.breakpointObserver.isMatched('(max-width: 1200px)') ? '80%' : '30%',
      height: 'auto',
      minWidth: '300px',
      hasBackdrop: true,
      backdropClass: 'blur-backdrop',
      disableClose: true,
    };

    return this.openBaseDialog(data, dialogParams);
  }

  public openUploadDialog(
    title: string = 'Subir archivo Excel',
    template?: string,
  ): Observable<any[] | null> {
    const dialogRef = this.matDialog.open(DialogUploadComponent, {
      width: this.breakpointObserver.isMatched('(max-width: 1200px)') ? '90%' : '30%',
      data: {
        tittle: title,
        acceptedTypes: '.xlsx,.xls',
        template,
      },
      disableClose: true,
    });

    return dialogRef.afterClosed();
  }

  public openComponentDialog(component: any, data?: any): Observable<any> {
    const dialogParams: DialogParams = {
      width: this.breakpointObserver.isMatched('(max-width: 1200px)') ? '90%' : '55%',
      height: 'auto',
      minHeight: '200px',
      minWidth: '300px',
      maxHeight: this.breakpointObserver.isMatched('(max-width: 1200px)') ? '80%' : '60%',
      hasBackdrop: true,
      backdropClass: 'blur-backdrop',
      disableClose: true,
    };

    const dialogRef = this.matDialog.open(DialogWrapperComponent, {
      ...dialogParams,
      data: {
        component,
        data,
      },
    });

    return dialogRef.afterClosed();
  }

  private openBaseDialog(data: DialogDataDto, dialogParams?: DialogParams): Observable<any> {
    const dialogRef = this.matDialog.open(
      DialogBaseComponent,
      this.setParams<DialogDataDto>('baseDialog', data, dialogParams),
    );

    return dialogRef.afterClosed();
  }

  public openLoadingWindow(content?: string, tittle?: string) {
    if (this.matDialog.getDialogById('loadingWindow')) {
      return;
    }

    this.matDialog.open(DialogLoadingComponent, {
      id: 'loadingWindow',
      panelClass: ['loadingDialog'],
      width: '100%',
      backdropClass: 'blur-backdrop',
      disableClose: true,
      data: {
        content: content ?? 'Operación en proceso...',
        tittle,
      },
    });
  }

  public closeDialog(id: string = 'loadingWindow') {
    this.matDialog.getDialogById(id)?.close();
  }

  public closeAllDialogs() {
    this.matDialog.closeAll();
  }

  private setParams<T>(
    id: string,
    data: T,
    dialogParams: DialogParams | undefined,
  ): MatDialogConfig {
    return {
      id,
      data,
      width: dialogParams?.width ? dialogParams.width : this.standardDialogParams.width,
      minWidth: dialogParams?.minWidth ? dialogParams.minWidth : this.standardDialogParams.minWidth,
      maxWidth: dialogParams?.maxWidth ? dialogParams.maxWidth : 'none',
      height: dialogParams?.height ? dialogParams.height : this.standardDialogParams.height,
      minHeight: dialogParams?.minHeight
        ? dialogParams.minHeight
        : this.standardDialogParams.minHeight,
      maxHeight: dialogParams?.maxHeight ? dialogParams.maxHeight : 'none',
      hasBackdrop: dialogParams?.hasBackdrop
        ? dialogParams.hasBackdrop
        : this.standardDialogParams.hasBackdrop,
      backdropClass: dialogParams?.backdropClass
        ? dialogParams.backdropClass
        : this.standardDialogParams.backdropClass,
      panelClass: dialogParams?.panelClass ? dialogParams.panelClass : ['blocked-dialog'],
      disableClose: dialogParams?.disableClose
        ? dialogParams.disableClose
        : this.standardDialogParams.disableClose,
    };
  }
}
