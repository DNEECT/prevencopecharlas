export interface HeaderTable {
  id: string;
  label: string;
  datatype:
    | 'string'
    | 'number'
    | 'date'
    | 'checked'
    | 'estado'
    | 'null'
    | 'array-objeto'
    | 'objeto'
    | 'permisos'
    | 'options'
    | 'options-butons';
  campoArrayObjeto?: string;
  campoObjeto?: string;
  order?: string;
  maxwidth?: string;
}

export interface MenuItems {
  id: number;
  icon: string;
  options: string;
  color?: string;
}
