# Frontend documentation (explanations)

Explanation-only notes for the **Angular** app. For setup and commands, see the main [frontend README](../README.md).

---

## Layout overview

| Path | Purpose |
|------|---------|
| `src/app/` | Application shell: routing, root component, global styles |
| `src/app/components/` | Feature UI components (e.g. home, profile, post detail) |
| `src/app/services/` | HTTP clients and shared state (call backend `/api/...`) |
| `src/assets/` | Static assets (images, optional README per asset folder) |
| `src/environments/` | API base URL and environment flags |

---

## Typical files (not exhaustive)

| Pattern | Role |
|---------|------|
| `*.component.ts` | Component logic, lifecycle, bindings |
| `*.component.html` | Template |
| `*.component.css` | Scoped styles |
| `*.service.ts` | Injectable services (`HttpClient` to Spring Boot) |
| `app.routes.ts` / `app.config.ts` | Routing and application configuration |

---

## Backend alignment

- Base URL usually matches `environment.ts` (e.g. `http://localhost:8080`).
- Endpoint details: see **`Backend/UI_HANDOFF.md`** in the repo root’s Backend folder.

---

## Related documentation

- [Backend docs index](../../Backend/docs/README.md) (Java modules explained file-by-file)
- [Root project README](../../README.md)
