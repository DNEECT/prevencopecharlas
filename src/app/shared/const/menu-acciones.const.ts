import { MenuItems } from '@shared/interface/header-table.interface';

export const MENU_ACTIONS_ITEM: {
  ADD: MenuItems;
  EDIT: MenuItems;
  DELETE: MenuItems;
  EXPORT: MenuItems;
  IMPORT: MenuItems;
  PRINT: MenuItems;
  SHOW: MenuItems;
  ACTIVE: MenuItems;
  INACTIVE: MenuItems;
  RESET: MenuItems;
  APROBE: MenuItems;
  OBSERVER: MenuItems;
} = {
  ADD: {
    id: 1,
    options: 'Agregar',
    icon: 'add',
    color: '#2E7D32', // verde
  },
  EDIT: {
    id: 2,
    options: 'Editar',
    icon: 'edit',
    color: '#1976D2', // azul
  },
  DELETE: {
    id: 3,
    options: 'Eliminar',
    icon: 'delete',
    color: '#D32F2F', // rojo
  },
  EXPORT: {
    id: 4,
    options: 'Exportar',
    icon: 'file_download',
    color: '#00796B', // teal
  },
  IMPORT: {
    id: 5,
    options: 'Importar',
    icon: 'file_upload',
    color: '#F57C00', // naranja
  },
  PRINT: {
    id: 6,
    options: 'Imprimir',
    icon: 'print',
    color: '#6A1B9A', // morado
  },
  SHOW: {
    id: 7,
    options: 'Ver',
    icon: 'visibility',
    color: '#616161', // gris
  },
  ACTIVE: {
    id: 8,
    options: 'Activar',
    icon: 'check_circle_outline',
    color: '#388E3C', // verde oscuro
  },
  INACTIVE: {
    id: 8,
    options: 'Desactivar',
    icon: 'highlight_off',
    color: '#9E9E9E', // gris claro
  },
  RESET: {
    id: 9,
    options: 'Resetear',
    icon: 'restart_alt',
    color: '#FFB300', // ámbar
  },
  APROBE: {
    id: 9,
    options: 'Aprobar',
    icon: 'check_circle',
    color: '#29f511',
  },
  OBSERVER: {
    id: 9,
    options: 'Observar',
    icon: 'check_circle',
    color: '#FFB300',
  },
};
