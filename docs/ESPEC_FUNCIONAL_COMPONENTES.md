# Especificación funcional y mapping de componentes

Este documento describe, por módulo (tipo-actividades, formato-actividades y registro-actividades), las pantallas de listado, acciones disponibles, flujo de creación y edición, y los posibles errores 422 que el backend puede devolver según el contrato `public/openapi.yml`.

También incluye un inventario de los componentes reutilizables del front-end (inputs/outputs y comportamientos clave) y cómo deben interactuar con las respuestas de la API (especialmente los errores de validación `422` / `ValidationError`).

---

## Índice
- Resumen ejecutivo
- Convenciones y estructura de respuesta de error
- Módulos
  - Tipo de actividades (`/tipo-actividades`)
  - Formato de actividad (`/formato-actividades`)
  - Registro de actividad (`/registro-actividades`)
- Componentes reutilizables
  - Contratos (Inputs / Outputs)
  - Comportamientos y tips de integración
- Casos de error 422 (por endpoint) y mensajes de usuario recomendados
- Ejemplos de manejo de errores en la UI
- Anexos: esquemas clave (resumen)

---

## Resumen ejecutivo
Este documento sirve como especificación funcional para la IU: define los listados, formularios (crear/editar), acciones disponibles en cada módulo y qué errores 422 del API deben mapearse a mensajes específicos en la interfaz.

Se basa en el contrato OpenAPI ubicado en `public/openapi.yml` (MS-NE-PRE-Gestion-Actividades API).

---

## Convenciones
- 2xx: Operación exitosa (201 creación, 200 lectura/actualización, 202 aceptación en borrado).
- 4xx/422: Errores funcionales que deben mostrarse al usuario (validaciones, duplicados, recursos no encontrados).

---

# Módulos (resumen funcional)
A continuación se ofrece una descripción clara y concisa, por módulo, de las vistas principales (Listado, Crear, Editar), qué hace cada una y los puntos de error más relevantes — especialmente duplicados (422) indicando el campo que valida la duplicación.

> Nota: esta sección prioriza una lectura funcional y no entra en todos los detalles técnicos del contrato.

---

## Tipo de actividades (ruta base: `/tipo-actividades`)
Qué hace el módulo
- Permite administrar los "tipos" de actividades que luego se usan en formatos y registros.
- Vistas principales: listado (ver/editar/eliminar), formulario de creación y formulario de edición.
- Uso habitual: crear una etiqueta (nombre + descripción) que será seleccionable en otros formularios.

Vista: Listado
- Muestra tabla con nombre, descripción y acciones.
- Acciones: ver detalle, editar (abrir formulario con datos), eliminar (confirmar).

Vista: Crear / Editar
- Formulario simple con `nombre` y `descripcion`.
- Validaciones cliente: longitud mínima/máxima; requeridos.

Errores importantes (422) y campo que valida duplicidad
- FNE-MS-012: "Tipo de actividad ya se encuentra registrada" — validación de duplicidad sobre el campo `nombre`.
  - UX: mostrar error en el campo `nombre` con mensaje tipo "Nombre ya registrado".
- FNE-MS-011: "Tipo de actividad no encontrada" — ocurre si se intenta editar/eliminar un id inexistente; mostrar mensaje global y volver al listado.

Resumen funcional (una línea):
- Gestiona las etiquetas de tipos de actividad; evita duplicados por `nombre` y permite CRUD básico.

---

## Formato de actividad (ruta base: `/formato-actividades`)
Qué hace el módulo
- Define plantillas o formatos que combinan: tipo de actividad, público objetivo, tipo de asistente, lugar, tema y una `serie` identificadora.
- Vistas principales: crear/editar formato y (opcional) listado. Incluye generación de códigos relacionados al formato.

Vista: Listado
- (Si existe) tabla con serie, tema, lugar y acciones. Desde aquí se puede editar o eliminar.

Vista: Crear / Editar
- Formulario con selects/autocompletes para seleccionar `tipoActividad`, `publicoObjetivo`, `tipoAsistente`, y campos `lugar`, `tema`, `serie`.
- Validaciones cliente: campos obligatorios, patrón de `serie` (mayúsculas, dígitos, guiones), longitudes.

Errores importantes (422) y campo que valida duplicidad
- FNE-MS-014: "Formato de actividad ya se encuentra registrada" — validación de duplicidad sobre el campo `serie` (valor único por formato).
  - Además, en algunos flujos la combinación de campos (tipoActividad + tema + tipoAsistente + publicoObjetivo + lugar) se considera para identificar un formato; si esa combinación ya existe, el backend puede devolver FNE-MS-014.
  - UX: marcar `serie` como campo en conflicto y/o mostrar mensaje general que indique "Formato ya registrado (serie duplicada)".
- FNE-MS-013: "Formato de actividad no encontrada" — al pedir o editar un formato inexistente; mostrar mensaje global y redirigir al listado.

Resumen funcional (una línea):
- Permite crear plantillas reutilizables de actividad; evita duplicidad por `serie` y por combinación de atributos clave.

---

## Registro de actividad (ruta base: `/registro-actividades`)
Qué hace el módulo
- Registra la realización concreta de una actividad usando un `formato`/tipo/tema/lugar/fecha; contiene la lista de participantes.
- Vistas: listado de registros, detalle/edición de un registro, y formulario para crear un nuevo registro.
- Uso habitual: guardar asistencias, observaciones y participantes (DNI, nombre, sexo, edad, etc.).

Vista: Listado
- Tabla con código, tema, lugar, fecha, número de participantes y opciones (ver, editar, eliminar, exportar).

Vista: Crear / Editar
- Formulario principal con campos del registro (tipo, tema, lugar, fecha, hora, proceso electoral opcional, observaciones) y una subtabla/lista de participantes.
- Cada participante se agrega mediante un mini-formulario; al añadirse se crea un `indice` autoincremental local para la UI.

Errores importantes (422) y campo que valida duplicidad
- FNE-MS-014: (aparece también en este contexto) duplicidad relacionada al formato/serie que se usa como referencia; campo implicado: `serie` del formato asociado.
  - Si el backend detecta conflicto relacionado con el formato enlazado, devolverá FNE-MS-014; UX: señalar que el formato/serie está duplicado o en conflicto.
- FNE-MS-015: "Registro de actividad no encontrada" — ocurre al solicitar/editar un registro inexistente; mostrar mensaje y volver al listado.
- FNE-MS-016: "Proceso electoral no encontrada" — si se envía un `codProcesoElectoral` inválido; UX: marcar el selector del proceso con error.
- Validaciones de participantes: si el API devuelve `ValidationError.detalles` (por ejemplo `datos.participantes[0].dni`), mapear ese mensaje al participante/field correspondiente (mostrar error en la fila o en el mini-formulario).

Resumen funcional (una línea):
- Registra eventos concretos y sus asistentes; valida referencias (formatos, procesos) y mapea errores por participante si el backend los retorna.

---

# Componentes reutilizables (inventario detallado)
Cada componente incluye contrato (Inputs/Outputs) y recomendaciones de uso.

### `app-form-field-input`
- Path: `src/app/shared/components/form-field-input/`
- Inputs:
  - `control: FormControl` (obligatorio)
  - `inputType?: 'text'|'digitos'|'letters'|'alphanumeric'`
  - `maxLength?: number`, `minLength?: number`, `exactLength?: number`
  - `required?: boolean`, `allowedChars?: 'letters'|'alphanumeric'|'numbers'`
  - `placeholder`, `label`, `isEditable`, `showClearButton`, `controlName`
- Outputs:
  - `valueChanged: EventEmitter<string>` (debounced)
  - `deleteData: EventEmitter<string>`
- Recomendaciones:
  - Añadir `[attr.maxlength]="getMaxLength()"` en el `<input>` para prevención nativa.
  - Para errores de servidor: usar `control.setErrors({ server: 'mensaje' })` y mostrar el mensaje en `mat-error`.

### `app-form-field-auto-complete`
- Path: `.../form-field-auto-complete/`
- Inputs: `control`, `options`, `keyField`, `valueField`, `isLoading`, `placeholder`
- Outputs: `valueChanged: EventEmitter<any>`
- Recomendaciones: exponer métodos para `openPanel()`/`closePanel()` desde el parent si se necesita abrir programáticamente.

### `app-form-field-date`
- Inputs: `control`, `minDate?`, `maxDate?`, `placeholder`
- Comportamiento: usar formato `YYYY-MM-DD` para enviar al backend.

### `app-form-field-time`
- Inputs: `control`, `placeholder`
- Validación: RFC: pattern `^([01]?[0-9]|2[0-3]):[0-5][0-9]$`.

### `app-form-field-text-area`
- Inputs: `control`, `maxLength`, `rows`, `placeholder`
- Salidas: `valueChanged` opcional

### `app-form-field-file` / `app-form-field-drag-drop`
- Inputs: `control`, `multiple?`, `accept?`, `maxSizeMB?`, `isEditable?`
- Outputs: `valueChanged: EventEmitter<File[]|File|null>`
- Comportamiento:
  - No escribir programáticamente `input[type=file].value` salvo `''` para reset.
  - Mantener `selectedFiles: File[]` y mostrar lista con botones descargar/eliminar.

### `app-table-paginate`
- Inputs: `dataSource`, `headers: HeaderTable[]`, `pageSizeOptions?`, `loading?`
- Outputs: `optionSelect: EventEmitter<{ menuItem: MenuItems, element: any }>`
- Comportamiento: implementar `datatype` para celdas: `string`, `date`, `checked` (muestra 'X' para true), `options-buttons` (renderiza botones pequeños con íconos), `menu` (si se desea), etc.

### `breadcrumbs`, `snackbar-info`, `dialog-base`, `dialog-upload`
- Breadcrumbs: exponer API para `setRoot()` y `pushPath()`; cuando se añade `/nuevo` a la ruta, no incluirlo como enlace final si así lo requiere UX.
- Snackbar: mostrar mensajes transitorios para éxito, advertencia, error.
- Dialogs: confirmación antes de eliminar; upload con progreso si se requiere.

---

# Casos de error 422 por endpoint y mensajes UI sugeridos
A continuación se listan los errores 422 que aparecen en `openapi.yml` y la sugerencia para manejarlos en la IU.

- `/tipo-actividades` (POST/PUT/GET/DELETE):
  - FNE-MS-011: "Tipo de actividad no encontrada"
    - Cuándo: GET/PUT/DELETE con `codigoTipoActividad` inexistente.
    - UI: mostrar diálogo o snackbar: "Tipo de actividad no encontrada" y redirigir al listado.
  - FNE-MS-012: "Tipo de actividad ya se encuentra registrada"
    - Cuándo: POST/PUT cuando `nombre` duplicado.
    - UI: marcar campo `nombre` con error: "Nombre ya registrado".

- `/formato-actividades` (POST/PUT/GET):
  - FNE-MS-013: "Formato de actividad no encontrada"
    - Cuándo: GET/PUT por id inexistente o generación de código con parámetros que no empatan.
    - UI: mensaje global: "Formato de actividad no encontrada".
  - FNE-MS-014: "Formato de actividad ya se encuentra registrada"
    - Cuándo: POST/PUT por duplicidad (serie).
    - UI: marcar campo `serie` con error y mostrar detalle "Serie duplicada".

- `/registro-actividades` (POST/PUT/GET):
  - FNE-MS-013 / FNE-MS-013-2: "Formato de actividad no encontrada" (en generación de código o validaciones relacionadas)
    - UI: mostrar mensaje y validar datos relacionados (tema/tipo/lugar/asistente/público).
  - FNE-MS-014: duplicidad de formato
  - FNE-MS-015: "Registro de actividad no encontrada"
    - Cuándo: GET/PUT/DELETE con id inexistente
    - UI: mensaje global y redirigir al listado
  - FNE-MS-016: "Proceso electoral no encontrada"
    - Cuándo: PUT/POST cuando `codProcesoElectoral` referenciado no existe
    - UI: marcar selector de proceso con error y mostrar "Proceso electoral no encontrada".

Errores de validación de campos (ValidationError)
- Si la respuesta sigue la estructura `ValidationError`, es preferible mapear cada `detalles[].campo` con la ruta del form control y asignar el error al control correspondiente.
- Ejemplo: `datos.participantes[0].dni` -> localizar el control del participante índice 0 y llamar `setErrors({ server: 'dni debe tener 8 caracteres' })`.

---

# Ejemplos de manejo en la UI

1) Al enviar formulario de creación de tipo de actividad (POST):
- Mostrar spinner hasta respuesta.
- Si 201: mostrar snackbar "Tipo de actividad creado" y redirigir.
- Si 422 / FNE-MS-012: `form.controls['nombre'].setErrors({ server: 'Nombre ya registrado' })`.
- Si 400 con FNE-MS-009 o FNE-MS-010: mostrar errores globales o por campo según `detalles`.

2) Al crear registro (`/registro-actividades`):
- Validar localmente que `participantes.length >= 1`.
- En respuesta 422 con `detalles`, mapear errores a participantes (por índice) y a campos del formulario (por ruta).
- Si 422 FNE-MS-016: marcar select de `codProcesoElectoral` con error.

3) Al exportar participantes a Excel:
- Construir workbook con ExcelJS:
  - Hoja 1: metadatos (Tema, Lugar, Fecha, Hora)
  - Hoja 2 (o debajo): tabla de participantes con columnas: N°, DNI, NOMBRES, SEXO, EDAD, ORG, CARGO, TEL, CORREO, POBLACION
- Manejar fallo (catch) mostrando snackbar con error técnico.

---

# Anexos: resumen esquemas clave (campos obligatorios y pattern)
- `TipoActividadRequest`: nombre (3-50), descripcion (5-250)
- `FormatoActividadRequest`: codTipoActividad (uuid), codPublicoObjetivo (uuid), codTipoAsistente (uuid), lugar (<=250), tema (<=500), serie (^[A-Z0-9\-]{1,20}$)
- `RegistroActividadRequest`: campos obligatorios listados arriba, `participantes` minItems 1
- `RegistroActividadParticipanteRequest`: dni (^[0-9]{8}$), nombresCompletos (3-200), sexo (Masculino|Femenino), edad (0-120), organizacion (<=50)

---

# Conclusión y siguientes pasos sugeridos
- Integrar mapping de errores en un helper `ApiErrorMapper` que convierta `ValidationError` a `FormControl` errors.
- Añadir tests E2E que simulen errores 422 y verifiquen que los mensajes aparecen correctamente y los campos se marcan.
- Implementar manejo centralizado de `ErrorResponse`/`ValidationError` en `interceptor` o `api.service` para facilitar el consumo por los componentes.

Si quieres, genero automáticamente:
- `docs/ESPEC_FUNCIONAL_COMPONENTES.md` en el repo (ya creado),
- Un helper TypeScript `ApiErrorMapper` y ejemplo de uso para mapear `ValidationError` a `FormGroup`.

Dime si quieres que añada el helper y ejemplos de código para aplicar automáticamente errores del servidor a los formularios (puedo generarlo y aplicarlo en un componente de ejemplo).
