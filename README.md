# HealthGrid

Panel de administración para gestión de personal de salud, desarrollado con Angular 21.

## Funcionalidades

- **Usuarios** — alta, edición y baja con asignación de roles, especialidades y ubicación
- **Roles** — gestión de roles con permisos asociados (chips)
- **Permisos** — catálogo de permisos disponibles
- **Especialidades** — listado y ABM de especialidades médicas
- **Ubicaciones** — listado y ABM de sedes/ubicaciones
- **Autenticación** — login, registro y recuperación de contraseña
- **Perfil** — edición de datos personales y cambio de contraseña desde la barra lateral

> Toda la capa de datos es en memoria (sin backend real). El login acepta cualquier combinación no vacía de email y contraseña.

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

Para ingresar, usá cualquier combinación no vacía de email y contraseña (no hay backend real).

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
      models/       # Interfaces TypeScript (User, Role, Permission, Speciality, Location)
      services/     # Servicios de datos (en memoria, basados en signals)
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
- **Signals** para estado local y en servicios
- **Lazy loading** en todas las rutas
- **Reactive Forms** con validación y marcado de errores al enviar
- **Modales** centralizados mediante `<app-modal>` (foco, escape, `aria-modal`)
- Estilos globales en `styles.scss`; variables CSS en `:root`
