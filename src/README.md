# HealthGrid

Panel de administración (módulo **Core**) de HealthGrid, construido con **Angular 21**. Gestiona usuarios, roles, permisos, especialidades y ubicaciones, con autenticación por JWT contra la Core API.

## Stack

- **Angular 21** — componentes standalone (sin NgModules), señales (`signal`) para el estado y rutas con lazy loading.
- **Reactive Forms** + control flow nativo (`@if` / `@for`).
- **lucide-angular** para iconos.
- **Vitest** para tests unitarios.
- **Prettier** como único formateador (no hay linter configurado).

## Requisitos

- Node.js (versión compatible con Angular 21) y npm.
- `npm install` para instalar dependencias.

## Desarrollo

```bash
npm start          # dev server en http://localhost:4200
npm run build      # build de producción (sale a dist/)
npm test           # tests unitarios con Vitest
npm run watch      # build de desarrollo en modo watch
npx prettier --write .   # formatear el código
```

Una vez levantado el server, abrí `http://localhost:4200/`. La app recarga automáticamente al guardar cambios.

## Integración con la API y proxy (CORS)

La app consume la **Core API** (`https://api.healthcare.cantero.ar`, autenticación Bearer JWT; spec OpenAPI en `https://api.healthcare.cantero.ar/docs/swagger.yaml`).

La API **no envía headers CORS**, por lo que el navegador no puede llamarla directamente. `npm start` usa el proxy de Angular (`proxy.conf.json`, declarado en `angular.json`) para redirigir las llamadas al backend desde el dev server:

- **Desarrollo**: `environment.apiBaseUrl` está vacío → las URLs son relativas (`/auth/login`, `/users`, …) y pasan por el proxy.
- **Producción**: `environment.apiBaseUrl` apunta al host real. Requiere CORS habilitado en el servidor o servir el front desde el mismo origen.

La configuración de entornos vive en `src/environments/`.

## Estructura

```
src/app/
  core/
    guards/         # authGuard (funcional)
    interceptors/   # authInterceptor (agrega Bearer y maneja 401)
    models/         # interfaces del front + api.model.ts (formas crudas de la API)
    services/       # servicios HTTP con caché en señales
    utils/          # toError (normaliza errores de la API)
  features/
    auth/           # login, register, forgot-password (rutas públicas)
    core/           # users, roles, permissions, specialities, locations (protegidas)
  layout/           # shell, sidebar, modales de perfil y contraseña
  shared/           # ToastService + componentes UI reutilizables (modal, toast, chips-input)
src/styles.scss     # todos los estilos globales
```

### Capa de datos

Cada servicio mantiene una caché privada en `signal<T[]>` (expuesta como readonly), llama a la API con `HttpClient` y vuelca la respuesta en la señal con `tap()`. Los modelos del front usan camelCase y arrays de IDs (`roleIds`, `permissionIds`); cada servicio mapea desde la forma anidada/snake_case de la API (`fromApi()`). Las ediciones de relaciones (roles, permisos, etc.) hacen *diff* contra la caché y disparan los endpoints `POST`/`DELETE` de sub-recursos.

### Autenticación

`AuthService` persiste el JWT (`hg_token`) y un `SessionUser` derivado (`hg_session`) en `localStorage`. `authInterceptor` agrega el header `Authorization: Bearer` a las llamadas a la API y, ante un 401, limpia la sesión y redirige a `/login`. Las rutas protegidas usan `authGuard`.

## Build

```bash
npm run build
```

Compila el proyecto en `dist/`. El build de producción optimiza la aplicación por defecto.

## Tests

```bash
npm test
```

Ejecuta los tests unitarios con [Vitest](https://vitest.dev/).
