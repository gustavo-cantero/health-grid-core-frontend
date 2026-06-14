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

`npm start` proxies API calls through `proxy.conf.json` (wired in `angular.json` → `serve.options.proxyConfig`) to `https://api.healthcare.cantero.ar`. This proxy is **required**: the API sends no CORS headers, so browser requests only work via the dev server. In development `environment.apiBaseUrl` is empty (relative URLs hit the proxy); in production it's the absolute API host (needs server-side CORS or same-origin hosting).

## Architecture

**Angular 21** app using standalone components (no NgModules), signals for state, and lazy-loaded routes.

### Folder structure

```
src/
  app/
    core/
      guards/       # authGuard (functional)
      models/       # Front-end interfaces (User, Role, …) + api.model.ts (raw API shapes)
      interceptors/ # authInterceptor (Bearer token + 401 handling)
      services/     # HTTP data services (signal-backed cache)
      utils/        # toError (HttpErrorResponse → Error with API message)
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

### Component file convention

Each component has three files in the same directory:
- `*.component.ts` — class, decorator, imports
- `*.component.html` — template (referenced via `templateUrl`)
- `*.component.scss` — component styles (referenced via `styleUrls`; currently empty since all styles live in `styles.scss`)

Always use `templateUrl` and `styleUrls` with paths relative to the component TS file. Never use inline `template` or `styles`.

### Data layer — real HTTP against the Core API

Services call the Core API (OpenAPI spec at `https://api.healthcare.cantero.ar/docs/swagger.yaml`, Bearer JWT) via `HttpClient`, but keep the **signal-backed cache** pattern: each service holds a private `signal<T[]>`, exposes it readonly (e.g. `users.users()`), and `tap()`s HTTP responses into it. Components still call `list().subscribe()` in `ngOnInit` to populate the store and read the signal in templates — pagination/search stay client-side.

**Mapping is the key concern.** The front-end models use camelCase + ID arrays (`roleIds`, `permissionIds`) and a derived role `color`; the API uses snake_case + nested objects (`first_name`, `roles[]`, `permissions[]`) and paginated lists (`PaginatedResponse { data, total, pagination }`). Each service has a `fromApi()` mapper. List calls request `pageSize=1000` to fetch everything at once. Role `color` has no API equivalent — it's derived deterministically from the id.

**Relationship edits diff, then call sub-resource endpoints.** `UserService.update()` / `RoleService.update()` accept the same patch shape the modals already send (e.g. `{ roleIds: [...] }`), diff it against the cached entity, and fire the per-item `POST`/`DELETE` endpoints (`/users/{id}/roles`, `/roles/{id}/permissions`, …) via `forkJoin`, then re-`GET` the entity to refresh the cache.

**Auth.** `AuthService` persists the JWT (`hg_token`) and a derived `SessionUser` (`hg_session`, includes `id`) in `localStorage`. `authInterceptor` attaches the Bearer header to API requests and, on 401, clears the session and redirects to `/login`. API errors (`{ error: string }`) are normalized by `toError()` so components can show `err.message`.

This mapper-in-the-service design means **components, templates, and the front-end models are untouched** when wiring endpoints — change services, not callers. The API also exposes Events endpoints (types/subscriptions/log) that currently have no UI and no service.

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
