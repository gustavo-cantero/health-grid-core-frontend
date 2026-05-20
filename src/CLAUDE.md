# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build
npm test           # vitest unit tests
npm run watch      # dev build with file watching
npx prettier --write .  # format code
```

There is no lint script configured — prettier is the only formatter.

## Architecture

**Angular 21** app using standalone components (no NgModules), signals for state, and lazy-loaded routes.

### Folder structure

```
src/
  app/
    core/
      guards/       # authGuard (functional)
      models/       # TypeScript interfaces (User, Role, Permission, Speciality, Location)
      services/     # All data services (in-memory, signal-based)
    features/
      auth/         # login, register, forgot-password (public routes)
      core/         # users, roles, permissions, specialities, locations (protected)
    layout/
      shell/        # authenticated app shell (sidebar + router-outlet + toast)
      sidebar/      # nav + profile dropdown
      profile-edit-modal/
    shared/
      services/     # ToastService
      ui/           # modal, toast, chips-input reusable components
  environments/     # environment.ts (prod) + environment.development.ts
  styles.scss       # ALL global styles — no component-level stylesheets
```

### Data layer — all fake, no HTTP

Every service (`UserService`, `RoleService`, etc.) stores data in a `signal<T[]>` and returns `Observable<T>` via `of(value).pipe(delay(300))`. There is no real backend. `AuthService` simulates login with any credentials (accepts any non-empty email/password pair).

Services expose a readonly signal for the current state (e.g., `users.users()`) alongside observable-based mutation methods (`create`, `update`, `remove`).

### Routing

Two top-level groups:
1. **Public** — `/login`, `/register`, `/forgot-password` (no guard)
2. **Protected** — everything else, guarded by `authGuard`, rendered inside `ShellComponent`

All routes use `loadComponent` (lazy loading). The shell's children are under `core/*`.

### State management pattern

- Services hold canonical state in a private `signal<T[]>` and expose it as readonly
- Components read from service signals directly in templates (`service.items()`)
- Edit modals use `effect()` to populate their form when the `user`/`role` input changes and `open()` is true
- Local draft state (e.g., chips selections) uses component-level `signal<number[]>([])`

### Modal pattern

All modals wrap `<app-modal>` (in `shared/ui/modal/`), which handles backdrop, escape key, focus trap, and `aria-modal`. Each feature has a `*-create-modal` and `*-edit-modal` (or a combined `*-form-modal` for simpler entities). Modals receive the entity as an `input()` signal and emit `close` / `saved` / `updated` outputs.

Form validation: call `form.markAllAsTouched()` on invalid submit; display `.form-error` spans conditionally on `control.invalid && control.touched`.

### Styling

All CSS lives in `src/styles.scss` — no component encapsulation. CSS variables are defined in `:root` (e.g., `--green-primary`, `--navy`). Key utility classes: `.form-group`, `.form-row`, `.form-error`, `.modal`, `.btn-main`, `.btn-cancel`, `.badge-*`, `.alert-error`, `.alert-success`.

Icons come from `lucide-angular`.
