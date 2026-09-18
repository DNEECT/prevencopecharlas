import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UsuarioResponse } from '../interface/user';
import { UserService } from '../service/user.service';

@Injectable({
  providedIn: 'root',
})
export class UserResolver implements Resolve<UsuarioResponse | null> {
  private readonly service: UserService = inject(UserService);
  private readonly router: Router = inject(Router);
  private readonly snackbarService: SnackbarService = inject(SnackbarService);

  resolve(route: ActivatedRouteSnapshot): Observable<UsuarioResponse | null> {
    const codigo = route.paramMap.get('codigoUsuario');
    if (!codigo) {
      this.router.navigate(['/inicio/usuario']).then();
      this.snackbarService.openErrorSnackBar('No se encontro el usuario');
      return EMPTY;
    }

    return this.service.obtener(codigo).pipe(
      catchError(() => {
        this.router.navigate(['/inicio/usuario']).then();
        this.snackbarService.openErrorSnackBar('No se encontro el usuario');
        return EMPTY;
      }),
    );
  }
}
