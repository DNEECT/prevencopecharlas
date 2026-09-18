import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormatoActividadResponse } from '@modules/activity-format/interface/activity-format';
import { ActivityFormatService } from '@modules/activity-format/service/activity-format.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityFormatResolver implements Resolve<FormatoActividadResponse | null> {
  private readonly service: ActivityFormatService = inject(ActivityFormatService);
  private readonly router: Router = inject(Router);
  private readonly snackbarService: SnackbarService = inject(SnackbarService);

  resolve(route: ActivatedRouteSnapshot): Observable<FormatoActividadResponse | null> {
    const codigo = route.paramMap.get('codigoFormatoActividad');
    if (!codigo) {
      this.router.navigate(['/inicio/formato-actividad']).then();
      this.snackbarService.openErrorSnackBar('No se encontro el formato de actividad');
      return EMPTY;
    }

    return this.service.obtener(codigo).pipe(
      catchError(() => {
        this.router.navigate(['/inicio/formato-actividad']).then();
        this.snackbarService.openErrorSnackBar('No se encontro el formato de actividad');
        return EMPTY;
      }),
    );
  }
}
