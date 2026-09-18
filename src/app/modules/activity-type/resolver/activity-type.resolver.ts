import { inject, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivityTypeService } from '@modules/activity-type/service/activity-type.service';
import { TipoActividadResponse } from '@modules/activity-type/interface/activity-type';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityTypeResolver implements Resolve<TipoActividadResponse | null> {
  private readonly service: ActivityTypeService = inject(ActivityTypeService);
  private readonly router: Router = inject(Router);
  private readonly snackbarService: SnackbarService = inject(SnackbarService);

  resolve(route: ActivatedRouteSnapshot): Observable<TipoActividadResponse | null> {
    const codigo = route.paramMap.get('codigoTipoActividad');
    if (!codigo) {
      this.router.navigate(['/inicio/tipo-actividad']).then();
      this.snackbarService.openErrorSnackBar('No se encontro el tipo de actividad');
      return EMPTY;
    }

    return this.service.obtener(codigo).pipe(
      catchError(() => {
        this.router.navigate(['/inicio/tipo-actividad']).then();
        this.snackbarService.openErrorSnackBar('No se encontro el tipo de actividad');
        return EMPTY;
      }),
    );
  }
}
