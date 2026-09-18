# Manual de Despliegue Local de Aplicaciones Angular en Windows

## Introducción
Este manual detalla el procedimiento para instalar, configurar y desplegar una aplicación Angular de manera local en un sistema operativo Windows. Está dirigido a desarrolladoras y desarrolladores que requieran ejecutar aplicaciones Angular para pruebas, desarrollo o demostraciones internas.

---

## 1. Requisitos Previos

Para ejecutar Angular correctamente en Windows, se deben cumplir los siguientes requisitos:

### 1.1 Node.js
Angular depende de Node.js para su funcionamiento.

- Descarga oficial: https://nodejs.org
- Se recomienda instalar la versión **LTS**.

Verificación de la instalación:

```bash
node -v
npm -v
```

### 1.2 Angular CLI
El Angular CLI es la herramienta oficial para crear, compilar y administrar proyectos Angular.

Instalación global:

```bash
npm install -g @angular/cli
```

Verificación:

```bash
ng version
```

---

## 2. Obtención del Proyecto Angular

### 2.1 Desde un repositorio Git

```bash
git clone <URL_DEL_REPOSITORIO>
cd nombre-del-proyecto
```

### 2.2 Desde carpeta local
Si ya cuentas con el proyecto:

```bash
cd nombre-del-proyecto
```

---

## 3. Instalación de Dependencias

Dentro de la carpeta del proyecto, ejecutar:

```bash
npm install
```

Este comando descargará todas las librerías necesarias indicadas en el archivo `package.json`.

---

## 4. Ejecución del Proyecto en Modo Desarrollo

Para iniciar el servidor de desarrollo de Angular:

```bash
ng serve
```

Para exponerlo en toda la red local y definir un puerto específico:

```bash
ng serve --host 0.0.0.0 --port 4200
```

Acceso en navegador:

```
http://localhost:4200/
```

---

## 5. Construcción del Proyecto para Producción

Generar el build estándar:

```bash
ng build
```

Generar build optimizado para despliegue:

```bash
ng build --configuration production
```

Este proceso genera una carpeta:

```
/dist/<nombre-del-proyecto>
```

---

## 6. Ejecución del Build de Producción de Forma Local

Debido a que Angular compilado requiere ser servido desde un servidor web, es necesario utilizar un servidor local.

### 6.1 Instalar servidor local

```bash
npm install -g http-server
```

### 6.2 Servir el build

```bash
cd dist/nombre-del-proyecto
http-server -p 8080
```

Abrir:

```
http://localhost:8080/
```

---

## 7. Solución de Problemas Frecuentes

### 7.1 “The Angular CLI requires a minimum Node.js version…”
Actualizar Node.js desde el sitio oficial.

### 7.2 Error: “Cannot find module”
Ejecutar:

```bash
npm install
```

### 7.3 Pantalla en blanco al abrir el build
No abrir `index.html` directamente.
Usar un servidor como:

```bash
http-server
```

### 7.4 Angular no responde en red local
Usar:

```bash
ng serve --host 0.0.0.0 --disable-host-check
```

---
# Fin del Documento
