# Proyecto: app-prevencope

> The repository has been reset to a sanitized Angular baseline. The active
> migration replaces the legacy Spring/IONOS backend with Supabase. See
> [`docs/SUPABASE_MIGRATION.md`](docs/SUPABASE_MIGRATION.md) before making
> backend, authentication, database, or file-storage changes.

## Resumen

Aplicación Angular (con soporte SSR) para administración de formatos y registros de actividades. UI basada en Angular Material y componentes reutilizables en `src/app/shared`. Uso de `ReactiveForms` y validaciones centralizadas.

## Tecnologías

- TypeScript, JavaScript
- Angular (Material)
- NPM
- SSR (ficheros `main.server.ts`, `server.ts`)
- FontAwesome (íconos en componentes)
- Testing: archivos `*.spec.ts` (Karma/Jasmine o la configuración del proyecto)

## Comandos habituales

- `npm ci` — instalar exactamente las dependencias bloqueadas
- `npm run supabase:start` — iniciar el stack local dedicado
- `npx supabase db reset --local` — recrear el esquema y el seed local
- `npm start` — ejecutar Angular en modo desarrollo
- `npm run build` — generar build de producción
- `npm test -- --watch=false` — ejecutar tests Angular
- `npm run supabase:stop` — detener el stack local

La configuración completa, las variables públicas, las verificaciones SQL,
el despliegue, la importación y la recuperación están en
[`docs/SUPABASE_MIGRATION.md`](docs/SUPABASE_MIGRATION.md). No use una clave
`service_role` en Angular ni cambie la sesión Vercel de otros proyectos.

## Estructura principal (resumen)

Raíz: `src/`

- `index.html`, `main.ts`, `main.server.ts`, `server.ts`
- `styles.css`, `styles.scss`
- `app/`
  - `app.ts`, `app.routes.ts`, `app.config.ts`...
  - `layout/` (layout global)
    - `header/`, `footer/` (plantillas, estilos y tests)
  - `modules/`
    - `activity-format/`, `activity-register/`, `activity-type/` (cada módulo con `components/`, `interface/`, `repository/`, `service/`, `resolver/`)
  - `shared/`
    - `components/` (componentes reutilizables)
    - `const/` (constantes como `regex.const.ts`)
    - `interface/` (interfaces comunes)
    - `service/` (servicios reutilizables: `validators`, `snackbar`, `api`, `interceptor`, `local-storage`, `dialog`, `theme`)
- `assets/` (imágenes, logo, estilos parciales)

> Nota: revisar `src/app/modules/activity-register/components/form-activity-register/form-activity-register.html` para ejemplo de uso de componentes reutilizables.

## Componentes reutilizables (carpeta `src/app/shared/components`)

A continuación se describen los componentes más relevantes, entradas (`@Input`), salidas (`@Output`) y comportamiento esencial.

### `app-form-field-input`

Descripción: input genérico con integración `FormControl`, validaciones dinámicas, filtrado de caracteres y control de tamaño.

Entradas principales:

- `@Input() inputType: string = 'text'` — tipos predefinidos: `'text'`, `'digitos'`, `'letters'`, `'alphanumeric'` (también puede usarse `allowedChars`).
- `@Input() control: FormControl` — control reactivo.
- `@Input() controlName: string`
- `@Input() label`, `placeholder`, `isEditable`, `showClearButton`
- Validaciones opcionales:
  - `@Input() required: boolean`
  - `@Input() maxLength?: number`
  - `@Input() minLength?: number`
  - `@Input() exactLength?: number` — aplica min y max iguales
  - `@Input() allowedChars?: 'letters' | 'alphanumeric' | 'numbers'`
- `@Input() size: 'sm'|'md'|'lg'|string` — clases CSS para tamaño
  Salidas:
- `@Output() valueChanged = new EventEmitter<string>()` — emisión con debounce (p.ej. 1s)
- `@Output() deleteData = new EventEmitter<string>()` — emite valor anterior al limpiar

Comportamiento clave:

- `ngOnInit` aplica validadores opcionales y subscribe a `valueChanges` (con `distinctUntilChanged()` y `debounceTime`).
- `onInput(event)` filtra caracteres según `inputType` o `allowedChars` y llama a `enforceMaxLength`.
- `enforceMaxLength(input)` corta el valor si supera `maxLength`, actualiza `FormControl` y mantiene caret.
- Recomendación de plantilla: añadir `[attr.maxlength]="getMaxLength()"` en el elemento `<input>` para prevención nativa además del control por código.

Ejemplo (uso en template):

- `<app-form-field-input [control]="form.controls['dni']" [maxLength]="8" [inputType]="'digitos'"></app-form-field-input>`

### `app-form-field-auto-complete`

Descripción: autocomplete personalizado con `MatAutocomplete`, soporte para `options`, `keyField`, `valueField`, `isLoading`, `messageErrors`.

Entradas:

- `@Input() options: any[]`
- `@Input() keyField`, `valueField`
- `@Input() control: FormControl`
- `@Input() isLoading: boolean`
- `@Input() messageErrors: ErrorField[]`
  Salidas:
- `@Output() valueChanged = new EventEmitter<any>()` — emite selección o texto

Comportamiento:

- Maneja `MatAutocompleteTrigger` (abrir/cerrar con control y focus).
- Debounce y filtrado de opciones.

### `app-form-field-date`, `app-form-field-time`

Descripción: campos de fecha/hora basados en `MatDatepicker` y `MatTime` (o componentes propios). Integración con `FormControl` y mensajes de error.

Entradas/Salidas:

- `control`, `controlName`, `label`, `placeholder`, `messageErrors`.

### `app-form-field-text-area`

Descripción: textarea con validaciones similares a `form-field-input`. Soporta `maxLength` y cuenta de caracteres si se desea.

### `app-form-field-file`, `app-form-field-drag-drop`, `dialog-upload`

Descripción: manejo de carga de archivos, arrastrar y soltar, modal para subida con progreso.

### `app-table-paginate`

Descripción: tabla reutilizable con paginación opcional, encabezados configurables y emisión de acciones por fila.
Entradas:

- `@Input() dataSource`, `headers`, `loading`, `enablePagination`
  Salida:
- `(optionSelect)` event con `{ action, row }`

### `snackbar-info`, `dialog-*`, `breadcrumbs`

Componentes para UX: notificaciones, modales con configuración centralizada.

## Interfaces y constantes

- `src/app/shared/interface/error-field.interface.ts` — formato para mensajes de error.
- `src/app/shared/const/regex.const.ts` — expresiones regulares reutilizables (p.ej. validaciones de emails, números).
- Otras interfaces: `api.interface.ts`, `auto-complete-interface.ts`, `header-table.interface.ts`, etc.

## Servicios reutilizables

- `ValidatorsService` — helpers para clases de estado (`getClass`), generación de validadores, mensajes.
- `SnackbarService` — encapsula `MatSnackBar`.
- `ApiService` — llamadas HTTP REST centralizadas.
- `Interceptor` — token auth, manejo de errores global.
- `LocalStorageService` — abstracción para almacenamiento local.
- `DialogService` — abrir diálogos reutilizables (`dialog-base`, `dialog-wrapper`).

## Estilos

- Globales en `src/styles.scss`, variables en `src/assets/styles/color.variables.scss`.
- Componentes usan `scss` locales (p.ej. `footer/footer.scss`).
- Clases utilitarias para tamaños (`size-sm`, `size-md`, `size-lg`) y layout (`form-grid`, `form-item`, `col-span-*`).

## Buenas prácticas y patrones usados

- Formularios reactivos (`FormControl`, `FormGroup`) para validación y control central.
- Componente `form-field-input` aplica validadores dinámicamente sin sobrescribir validadores existentes (mezcla existentes + nuevos).
- Debounce en emisión de `valueChanged` para reducir llamadas (p.ej. búsquedas).
- Evitar expresiones coma; usar `if/else` claro (cumplir reglas ESLint `no-sequences`).
- Manejo de caret al truncar valores para buena UX.
- Componentes pequeños y reutilizables, con `@Input` y `@Output` claros.

## Cómo añadir un nuevo componente reutilizable (pasos resumidos)

1. Crear carpeta en `src/app/shared/components/[nombre]/`.
2. Añadir `component.ts`, `component.html`, `component.scss` y `component.spec.ts`.
3. Declarar el componente en el módulo compartido (o `SharedModule`).
4. Documentar `@Input` y `@Output` en comentarios y README.
5. Añadir tests unitarios y styles responsivos.

## Testing y validación

- Escribir `*.spec.ts` para componentes y servicios.
- Ejecutar `npm test`.
- Añadir pruebas para `ValidatorsService` y comportamientos críticos (p.ej. `enforceMaxLength`, `onInput`).

## Notas finales específicas del proyecto

- Plantillas principales: `src/app/layout/footer/footer.html` y `src/app/layout/header/header.html` contienen elementos globales (logo, enlaces sociales).
- Para inputs que requieren bloqueo al superar `maxLength`, use `app-form-field-input` con `maxLength` y asegúrese de incluir `[attr.maxlength]="getMaxLength()"` en la plantilla del input.
- Revisar `src/app/modules/activity-register/components/form-activity-register/form-activity-register.html` como ejemplo práctico de composición de campos y subformularios (participantes, fechas, autocompletes).

---

Documento generado con enfoque en estructura, componentes reutilizables y prácticas aplicadas en `src/`. Actualizar este README cuando se creen/modifiquen componentes o servicios.
