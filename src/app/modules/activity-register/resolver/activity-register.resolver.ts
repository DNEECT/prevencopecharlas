import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegistroActividadResponse } from '@modules/activity-register/interface/activity-register';
import { ActivityRegisterService } from '@modules/activity-register/service/activity-register.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityRegisterResolver implements Resolve<RegistroActividadResponse | null> {
  private readonly service: ActivityRegisterService = inject(ActivityRegisterService);
  private readonly router: Router = inject(Router);
  private readonly snackbarService: SnackbarService = inject(SnackbarService);

  resolve(route: ActivatedRouteSnapshot): Observable<RegistroActividadResponse | null> {
    const codigo = route.paramMap.get('codigoRegistroActividad');
    if (!codigo) {
      this.router.navigate(['/inicio/registro-actividad']).then();
      this.snackbarService.openErrorSnackBar('No se encontro el registro de actividad');
      return EMPTY;
    }

    return this.service.obtener(codigo).pipe(
      catchError(() => {
        this.router.navigate(['/inicio/registro-actividad']).then();
        this.snackbarService.openErrorSnackBar('No se encontro el registro de actividad');
        return EMPTY;
      }),
    );
  }
}
