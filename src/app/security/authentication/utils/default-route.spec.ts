import { MenuItemResponse } from '../interface/authentication';
import { normalizeDefaultRoute, resolveDefaultRoute } from './default-route';

describe('default route', () => {
  it('prefers the activity register when it is authorized', () => {
    const menu: MenuItemResponse[] = [
      { title: 'Usuarios', link: '/usuario', isVisible: true },
      { title: 'Registro de actividades', link: '/registro-actividad', isVisible: true },
    ];

    expect(resolveDefaultRoute(menu)).toBe('/registro-actividad');
  });

  it('uses the first authorized child when the activity register is unavailable', () => {
    const menu: MenuItemResponse[] = [
      {
        title: 'Administración',
        isVisible: true,
        items: [{ title: 'Formato de actividad', link: '/formato-actividad', isVisible: true }],
      },
    ];

    expect(resolveDefaultRoute(menu)).toBe('/formato-actividad');
  });

  it('ignores hidden routes and normalizes the leading slash', () => {
    const menu: MenuItemResponse[] = [
      { title: 'Oculto', link: '/usuario', isVisible: false },
      { title: 'Permisos', link: 'permiso', isVisible: true },
    ];

    expect(resolveDefaultRoute(menu)).toBe('/permiso');
    expect(normalizeDefaultRoute('registro-actividad')).toBe('/registro-actividad');
  });
});
