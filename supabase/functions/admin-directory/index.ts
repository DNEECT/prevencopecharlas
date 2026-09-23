import '@supabase/functions-js/edge-runtime.d.ts';
import { createSupabaseContext } from '@supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Json = Record<string, unknown>;

interface DirectoryRequest {
  action?: string;
  page?: number;
  pageSize?: number;
  search?: string | null;
  userId?: string;
  roleId?: string;
  user?: {
    numeroDocumento?: string | null;
    nombres?: string | null;
    apellidos?: string | null;
    username?: string | null;
    correo?: string | null;
    direccion?: string | null;
    fechaNacimiento?: string | null;
    roles?: string[];
  };
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

function fail(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function required(value: string | null | undefined, label: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${label} es obligatorio.`);
  return normalized;
}

function normalizedUser(input: DirectoryRequest['user']) {
  if (!input) throw new Error('Los datos del usuario son obligatorios.');
  const roles = [...new Set(input.roles ?? [])];
  if (!roles.length || roles.some((role) => !uuidPattern.test(role))) {
    throw new Error('Seleccione al menos un rol válido.');
  }
  const email = required(input.correo, 'El correo').toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('El correo no tiene un formato válido.');
  }
  const username = required(input.username, 'El nombre de usuario');
  if (username.length > 20) throw new Error('El nombre de usuario admite hasta 20 caracteres.');
  const address = input.direccion?.trim() || null;
  if (address && address.length > 100) throw new Error('La dirección admite hasta 100 caracteres.');
  return {
    numeroDocumento: required(input.numeroDocumento, 'El número de documento'),
    nombres: required(input.nombres, 'Los nombres'),
    apellidos: required(input.apellidos, 'Los apellidos'),
    username,
    correo: email,
    direccion: address,
    fechaNacimiento: input.fechaNacimiento || null,
    roles,
  };
}

function randomPassword(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}!Aa1`;
}

function permissionSet(rows: Array<{ module_abbreviation: string; action_abbreviation: string }>) {
  return new Set(rows.map((row) => `${row.module_abbreviation}:${row.action_abbreviation}`));
}

function requirePermission(permissions: Set<string>, module: string, action: string) {
  if (!permissions.has(`${module}:${action}`)) {
    throw Object.assign(new Error('No tiene permisos para realizar esta operación.'), {
      status: 403,
    });
  }
}

function mapProfile(profile: Json, memberships: Array<Json>) {
  return {
    codigoUsuario: profile.id,
    numeroDocumento: profile.document_number ?? '',
    nombres: profile.first_names,
    apellidos: profile.last_names,
    username: profile.username,
    correo: profile.email,
    direccion: profile.address ?? '',
    fechaNacimiento: profile.birth_date ?? '',
    roles: memberships
      .filter((membership) => membership.profile_id === profile.id && membership.is_active)
      .map((membership) => membership.roles as Json)
      .filter((role) => role?.is_active)
      .map((role) => ({
        codigoRol: role.id,
        nombre: role.name,
        descripcion: role.description ?? '',
      })),
    estado: profile.is_active,
  };
}

function rpcParameters(actorId: string, userId: string, user: ReturnType<typeof normalizedUser>) {
  return {
    p_actor: actorId,
    p_user_id: userId,
    p_document_number: user.numeroDocumento,
    p_first_names: user.nombres,
    p_last_names: user.apellidos,
    p_username: user.username,
    p_email: user.correo,
    p_address: user.direccion,
    p_birth_date: user.fechaNacimiento,
    p_role_ids: user.roles,
  };
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (req.method !== 'POST') return fail('Método no permitido.', 405);

    const { data: context, error: contextError } = await createSupabaseContext(req, {
      auth: 'user',
    });
    if (contextError || !context) {
      return fail(contextError?.message ?? 'Sesión inválida.', contextError?.status ?? 401);
    }

    try {
      const { data: userData, error: userError } = await context.supabase.auth.getUser();
      if (userError || !userData.user) return fail('Sesión inválida.', 401);
      const actorId = userData.user.id;

      const { data: permissionRows, error: permissionError } =
        await context.supabase.rpc('my_permissions');
      if (permissionError) throw permissionError;
      const permissions = permissionSet(permissionRows ?? []);
      const body = (await req.json()) as DirectoryRequest;

      if (body.action === 'list-users') {
        requirePermission(permissions, 'GUSU', 'LIST');
        const { data: profiles, error } = await context.supabaseAdmin
          .from('profiles')
          .select(
            'id,document_number,first_names,last_names,username,email,address,birth_date,is_active',
          )
          .order('last_names')
          .order('first_names')
          .limit(1000);
        if (error) throw error;
        const ids = (profiles ?? []).map((profile) => profile.id);
        const memberships = ids.length
          ? await context.supabaseAdmin
              .from('profile_roles')
              .select('profile_id,is_active,roles(id,name,description,is_active)')
              .in('profile_id', ids)
          : { data: [], error: null };
        if (memberships.error) throw memberships.error;
        const search = body.search?.trim().toLocaleLowerCase('es-PE') ?? '';
        const filtered = (profiles ?? []).filter(
          (profile) =>
            !search ||
            [
              profile.document_number,
              profile.first_names,
              profile.last_names,
              profile.username,
              profile.email,
            ].some((value) =>
              String(value ?? '')
                .toLocaleLowerCase('es-PE')
                .includes(search),
            ),
        );
        const page = Math.max(0, Number.isInteger(body.page) ? body.page! : 0);
        const pageSize = Math.min(
          1000,
          Math.max(1, Number.isInteger(body.pageSize) ? body.pageSize! : 20),
        );
        const start = page * pageSize;
        return json({
          usuarios: filtered
            .slice(start, start + pageSize)
            .map((profile) => mapProfile(profile, memberships.data ?? [])),
          totalElementos: filtered.length,
          numeroPagina: page,
          tamanioPagina: pageSize,
        });
      }

      if (body.action === 'get-user') {
        requirePermission(permissions, 'GUSU', 'LIST');
        if (!body.userId || !uuidPattern.test(body.userId))
          return fail('Identificador de usuario inválido.');
        const { data: profile, error } = await context.supabaseAdmin
          .from('profiles')
          .select(
            'id,document_number,first_names,last_names,username,email,address,birth_date,is_active',
          )
          .eq('id', body.userId)
          .maybeSingle();
        if (error) throw error;
        if (!profile) return fail('Usuario no encontrado.', 404);
        const { data: memberships, error: membershipError } = await context.supabaseAdmin
          .from('profile_roles')
          .select('profile_id,is_active,roles(id,name,description,is_active)')
          .eq('profile_id', body.userId);
        if (membershipError) throw membershipError;
        return json({ datos: mapProfile(profile, memberships ?? []) });
      }

      if (body.action === 'list-roles') {
        if (!permissions.has('GUSU:LIST') && !permissions.has('GPRM:LIST')) {
          requirePermission(permissions, 'GUSU', 'LIST');
        }
        const { data, error } = await context.supabaseAdmin
          .from('roles')
          .select('id,name,description')
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        return json({
          datos: (data ?? []).map((role) => ({
            codigoRol: role.id,
            nombre: role.name,
            descripcion: role.description ?? '',
          })),
        });
      }

      if (body.action === 'create-user') {
        requirePermission(permissions, 'GUSU', 'ADD');
        const user = normalizedUser(body.user);
        const { data: created, error: createError } =
          await context.supabaseAdmin.auth.admin.createUser({
            email: user.correo,
            password: randomPassword(),
            email_confirm: true,
            app_metadata: { onboarding_state: 'pending_invitation', created_by: actorId },
          });
        if (createError || !created.user)
          throw createError ?? new Error('No se pudo crear la identidad.');
        const { error: profileError } = await context.supabaseAdmin.rpc(
          'service_create_user_profile',
          rpcParameters(actorId, created.user.id, user),
        );
        if (profileError) {
          await context.supabaseAdmin.auth.admin.deleteUser(created.user.id);
          throw profileError;
        }
        return json(
          { datos: { codigo: 'OK', mensaje: 'Usuario creado; invitación pendiente.' } },
          201,
        );
      }

      if (body.action === 'update-user') {
        requirePermission(permissions, 'GUSU', 'EDIT');
        if (!body.userId || !uuidPattern.test(body.userId))
          return fail('Identificador de usuario inválido.');
        const user = normalizedUser(body.user);
        const { data: existing, error: existingError } = await context.supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', body.userId)
          .single();
        if (existingError) throw existingError;
        const emailChanged = existing.email.toLowerCase() !== user.correo;
        if (emailChanged) {
          const { error } = await context.supabaseAdmin.auth.admin.updateUserById(body.userId, {
            email: user.correo,
            email_confirm: true,
          });
          if (error) throw error;
        }
        const { error: updateError } = await context.supabaseAdmin.rpc(
          'service_update_user_profile',
          rpcParameters(actorId, body.userId, user),
        );
        if (updateError) {
          if (emailChanged) {
            await context.supabaseAdmin.auth.admin.updateUserById(body.userId, {
              email: existing.email,
              email_confirm: true,
            });
          }
          throw updateError;
        }
        return json({ datos: { codigo: 'OK', mensaje: 'Usuario actualizado.' } });
      }

      if (body.action === 'toggle-user') {
        requirePermission(permissions, 'GUSU', 'DELETE');
        if (!body.userId || !uuidPattern.test(body.userId))
          return fail('Identificador de usuario inválido.');
        const { data: profile, error: profileError } = await context.supabaseAdmin
          .from('profiles')
          .select('is_active')
          .eq('id', body.userId)
          .single();
        if (profileError) throw profileError;
        const nextActive = !profile.is_active;
        const { error: statusError } = await context.supabaseAdmin.rpc('service_set_user_active', {
          p_actor: actorId,
          p_user_id: body.userId,
          p_active: nextActive,
        });
        if (statusError) throw statusError;
        const { error: authError } = await context.supabaseAdmin.auth.admin.updateUserById(
          body.userId,
          { ban_duration: nextActive ? 'none' : '876000h' },
        );
        if (authError) {
          await context.supabaseAdmin.rpc('service_set_user_active', {
            p_actor: actorId,
            p_user_id: body.userId,
            p_active: profile.is_active,
          });
          throw authError;
        }
        return json({
          datos: {
            codigo: 'OK',
            mensaje: nextActive ? 'Usuario activado.' : 'Usuario desactivado.',
          },
        });
      }

      if (body.action === 'list-actions') {
        requirePermission(permissions, 'GPRM', 'LIST');
        const { data, error } = await context.supabaseAdmin
          .from('actions')
          .select('id,description,abbreviation')
          .eq('is_active', true)
          .order('description');
        if (error) throw error;
        return json({
          datos: (data ?? []).map((action) => ({
            codigoAccion: action.id,
            descripcion: action.description ?? action.abbreviation,
            abreviatura: action.abbreviation,
          })),
        });
      }

      if (body.action === 'list-permissions') {
        requirePermission(permissions, 'GPRM', 'LIST');
        if (!body.roleId || !uuidPattern.test(body.roleId))
          return fail('Identificador de rol inválido.');
        const [
          { data: modules, error: modulesError },
          { data: moduleActions, error: actionsError },
          { data: roleModules, error: roleModulesError },
        ] = await Promise.all([
          context.supabaseAdmin
            .from('modules')
            .select('id,name,sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          context.supabaseAdmin
            .from('module_actions')
            .select('id,module_id,is_active,actions(id,description,abbreviation,is_active)')
            .eq('is_active', true),
          context.supabaseAdmin
            .from('role_modules')
            .select('id,module_id,is_active')
            .eq('role_id', body.roleId),
        ]);
        if (modulesError || actionsError || roleModulesError) {
          throw modulesError ?? actionsError ?? roleModulesError;
        }
        const roleModuleIds = (roleModules ?? []).map((item) => item.id);
        const grants = roleModuleIds.length
          ? await context.supabaseAdmin
              .from('role_module_actions')
              .select('id,role_module_id,module_action_id,is_active')
              .in('role_module_id', roleModuleIds)
          : { data: [], error: null };
        if (grants.error) throw grants.error;
        const roleModuleByModule = new Map(
          (roleModules ?? []).map((item) => [item.module_id, item]),
        );
        const grantByAction = new Map(
          (grants.data ?? []).map((item) => [item.module_action_id, item]),
        );
        return json({
          datos: (modules ?? []).map((module) => {
            const roleModule = roleModuleByModule.get(module.id);
            return {
              codigoRolModulo: roleModule?.id ?? '',
              codigoModulo: module.id,
              nombreModulo: module.name,
              acciones: (moduleActions ?? [])
                .filter((item) => item.module_id === module.id)
                .map((item) => {
                  const action = item.actions as unknown as Json;
                  const grant = grantByAction.get(item.id);
                  return {
                    codigoModuloAccionRolModulo: grant?.id ?? '',
                    codigoAccion: action.id,
                    nombreAccion: action.description ?? action.abbreviation,
                    estado: Boolean(roleModule?.is_active && action.is_active && grant?.is_active),
                  };
                }),
            };
          }),
        });
      }

      return fail('Operación administrativa desconocida.', 404);
    } catch (error) {
      console.error('[admin-directory]', error);
      const candidate = error as { message?: string; code?: string; status?: number };
      const status =
        candidate.status ??
        (candidate.code === '42501'
          ? 403
          : candidate.code === '23505' || candidate.code === '23514'
            ? 409
            : 400);
      return fail(candidate.message ?? 'No se pudo completar la operación.', status);
    }
  },
};
