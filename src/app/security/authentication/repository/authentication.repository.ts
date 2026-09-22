import { inject, Injectable } from '@angular/core';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { from, Observable } from 'rxjs';
import { LoginDatosRequest, LoginDatosResponse, MenuItemDatosRespone, MenuItemResponse } from '../interface/authentication';

interface PermissionRow {
  module_id: string;
  parent_module_id: string | null;
  module_abbreviation: string;
  module_name: string;
  route: string | null;
  icon: string | null;
  sort_order: number | null;
  action_abbreviation: string;
}

const MODULE_ROUTES: Record<string, string> = {
  GTIPACT: ROUTES_WEB.TIPO_ACTIVIDADES,
  GFORACT: ROUTES_WEB.FORMATO_ACTIVIDADES,
  GREGACT: ROUTES_WEB.REGISTRO_ACTIVIDADES,
  GUSU: ROUTES_WEB.USUARIOS,
  GPRM: ROUTES_WEB.PERMISOS,
};

@Injectable({ providedIn: 'root' })
export class AuthenticationRepository {
  private readonly supabaseService = inject(SupabaseService);
  private get supabase() { return this.supabaseService.client; }

  public login(request: LoginDatosRequest): Observable<LoginDatosResponse> {
    return from(this.signIn(request));
  }

  private async signIn(request: LoginDatosRequest): Promise<LoginDatosResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: request.datos.usuario?.trim() ?? '',
      password: request.datos.contrasenia ?? '',
    });
    if (error) throw error;
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles').select('id').eq('id', data.user.id).eq('is_active', true).maybeSingle();
    if (profileError || !profile) {
      await this.supabase.auth.signOut();
      throw new Error('La cuenta no tiene un perfil activo. Consulte al administrador.');
    }
    let menus: MenuItemResponse[];
    try {
      menus = await this.loadMenu();
    } catch (menuError) {
      await this.supabase.auth.signOut();
      throw menuError;
    }
    const links = menus.flatMap((item) => [item, ...(item.items ?? [])])
      .map((item) => item.link).filter((link): link is string => !!link);
    const first = links.includes(`/${ROUTES_WEB.REGISTRO_ACTIVIDADES}`)
      ? `/${ROUTES_WEB.REGISTRO_ACTIVIDADES}` : links[0];
    if (!first) {
      await this.supabase.auth.signOut();
      throw new Error('La cuenta no tiene permisos activos. Consulte al administrador.');
    }
    return { datos: { pathDefault: first } };
  }

  getMenuItems(): Observable<MenuItemDatosRespone> {
    return from(this.loadMenu().then((datos) => ({ datos })));
  }

  private async loadMenu(): Promise<MenuItemResponse[]> {
    const { data, error } = await this.supabase.rpc('my_permissions');
    if (error) throw error;
    const rows = (data ?? []) as PermissionRow[];
    const modules = new Map<string, MenuItemResponse & { parent?: string | null }>();
    for (const row of rows) {
      let item = modules.get(row.module_id);
      if (!item) {
        item = {
          title: row.module_name,
          abreviatura: row.module_abbreviation,
          icon: row.icon ?? undefined,
          link: MODULE_ROUTES[row.module_abbreviation]
            ? `/${MODULE_ROUTES[row.module_abbreviation]}` : undefined,
          order: row.sort_order,
          permisos: [],
          parent: row.parent_module_id,
        };
        modules.set(row.module_id, item);
      }
      if (!item.permisos?.some((permission) => permission.abreviatura === row.action_abbreviation)) {
        item.permisos?.push({ codigoAccion: '', descripcion: '', abreviatura: row.action_abbreviation });
      }
    }
    const visible = [...modules.entries()].filter(([, item]) =>
      item.permisos?.some((permission) => permission.abreviatura === 'LIST'));
    const result: MenuItemResponse[] = [];
    for (const [, item] of visible) {
      const parent = item.parent ? modules.get(item.parent) : undefined;
      if (parent && visible.some(([key]) => key === item.parent)) {
        (parent.items ??= []).push(item);
      } else {
        result.push(item);
      }
    }
    const sort = (items: MenuItemResponse[]) => {
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      items.forEach((item) => item.items && sort(item.items));
    };
    sort(result);
    return result;
  }
}
