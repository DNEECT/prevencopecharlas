import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { UsuarioResponse } from '../interface/user';
import { UserService } from '../service/user.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';

@Injectable({
  providedIn: 'root',
})
export class UserPasswordResolver implements Resolve<UsuarioResponse | null> {
  private readonly service: UserService = inject(UserService);
  private readonly router: Router = inject(Router);
  private readonly snackbarService: SnackbarService = inject(SnackbarService);

  resolve(_route: ActivatedRouteSnapshot): Observable<UsuarioResponse | null> {
    return this.service.obtenerUsuario().pipe(
      catchError(() => {
        this.router.navigate([ROUTES_WEB.USUARIOS]).then();
        this.snackbarService.openErrorSnackBar('No se encontro el usuario');
        return EMPTY;
      }),
    );
  }
}
