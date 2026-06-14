# HealthGrid

![logo](src/public/favicon-96x96.png)

Panel de administración para gestión de personal de salud, desarrollado con Angular 21.

## Funcionalidades

- **Usuarios** — alta, edición y baja con asignación de roles, especialidades y ubicación
- **Roles** — gestión de roles con permisos asociados (chips)
- **Permisos** — catálogo de permisos disponibles
- **Especialidades** — listado y ABM de especialidades médicas
- **Ubicaciones** — listado y ABM de sedes/ubicaciones
- **Autenticación** — login, registro y recuperación de contraseña
- **Perfil** — edición de datos personales y cambio de contraseña desde la barra lateral

> La app consume la **Core API** real (`https://api.healthcare.cantero.ar`, autenticación Bearer JWT). Como la API no envía headers CORS, en desarrollo las llamadas se redirigen mediante el proxy de Angular (ver más abajo).

## Tecnologías

| Herramienta    | Versión |
| -------------- | ------- |
| Angular        | 21      |
| TypeScript     | ~5.9    |
| RxJS           | ~7.8    |
| lucide-angular | ^1.0    |
| Vitest         | ^4.0    |
| Prettier       | ^3.8    |

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior
- npm 11 o superior (incluido con Node.js)

## Cómo ejecutar el proyecto

El proyecto Angular vive dentro de la carpeta `src/`. Todos los comandos deben ejecutarse desde ahí.

**1. Clonar el repositorio**

```bash
git clone https://github.com/gustavo-cantero/health-grid-core-frontend.git
cd health-grid-core-angular
```

**2. Instalar dependencias**

```bash
cd src
npm install
```

**3. Iniciar el servidor de desarrollo**

```bash
npm start
```

Abrí el navegador en `http://localhost:4200`. La app se recarga automáticamente al guardar cambios.

Para ingresar necesitás credenciales válidas de la Core API (o registrá una cuenta nueva desde `/register`).

## Integración con la API y proxy (CORS)

La app consume la **Core API** (`https://api.healthcare.cantero.ar`, Bearer JWT; spec OpenAPI en `https://api.healthcare.cantero.ar/docs/swagger.yaml`).

La API **no envía headers CORS**, así que el navegador no puede llamarla directamente. `npm start` usa el proxy de Angular (`src/proxy.conf.json`, declarado en `src/angular.json`) para redirigir las llamadas desde el dev server:

- **Desarrollo**: `environment.apiBaseUrl` está vacío → las URLs son relativas (`/auth/login`, `/users`, …) y pasan por el proxy.
- **Producción**: `environment.apiBaseUrl` apunta al host real; requiere CORS habilitado en el servidor o servir el front desde el mismo origen.

La configuración de entornos está en `src/src/environments/`.

## Otros comandos

```bash
# Build de producción (salida en dist/)
npm run build

# Build con watch (modo desarrollo)
npm run watch

# Tests unitarios con Vitest
npm test

# Formatear código con Prettier
npx prettier --write .
```

## Estructura del proyecto

```
src/
  app/
    core/
      guards/       # authGuard (funcional)
      interceptors/ # authInterceptor (agrega Bearer y maneja 401)
      models/       # Interfaces del front + api.model.ts (formas crudas de la API)
      services/     # Servicios HTTP con caché en signals
      utils/        # toError (normaliza errores de la API)
    features/
      auth/         # login, register, forgot-password (rutas públicas)
      core/         # users, roles, permissions, specialities, locations (protegidas)
    layout/
      shell/        # Shell autenticado (sidebar + router-outlet + toast)
      sidebar/      # Navegación + dropdown de perfil
      topbar/
      profile-edit-modal/
      change-password-modal/
    shared/
      services/     # ToastService
      ui/           # modal, toast, chips-input, confirm-delete, confirm-unsaved
  environments/
  styles.scss       # Todos los estilos globales
```

## Patrones de arquitectura

- **Componentes standalone** sin NgModules
- **Signals** para estado local y como caché en los servicios
- **Lazy loading** en todas las rutas
- **Capa de datos HTTP**: cada servicio llama a la Core API con `HttpClient`, mapea la respuesta (snake_case/anidada → camelCase/arrays de IDs) y la cachea en una señal readonly; los componentes leen la señal sin cambios
- **Autenticación**: JWT + `SessionUser` en `localStorage`, header `Authorization` vía `authInterceptor` y rutas protegidas con `authGuard`
- **Reactive Forms** con validación y marcado de errores al enviar
- **Modales** centralizados mediante `<app-modal>` (foco, escape, `aria-modal`)
- Estilos globales en `styles.scss`; variables CSS en `:root`
