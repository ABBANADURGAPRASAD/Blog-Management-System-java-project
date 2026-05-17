# Blog Management System — Angular Frontend

Modern **Angular 20** single-page application for the Blog Management System. Connects to the **Spring Boot** backend via a dev proxy and provides blogging, social, messaging, and anonymous chat experiences.

**Dev URL:** `http://localhost:4400`  
**Backend API:** `http://localhost:8080` (proxied as `/api`, `/uploads`, `/ws`)  
**Run guide:** [`../ExcutionInfofile.md`](../ExcutionInfofile.md)

---

## Table of contents

- [Technologies](#technologies)
- [Architecture](#architecture)
- [How it works](#how-it-works)
- [Why this design is efficient](#why-this-design-is-efficient)
- [Features](#features)
- [New & advanced features](#new--advanced-features)
- [Project structure](#project-structure)
- [Routing](#routing)
- [Services & API layer](#services--api-layer)
- [How to run](#how-to-run)
- [Styling & UX](#styling--ux)
- [Troubleshooting](#troubleshooting)
- [Related documentation](#related-documentation)

---

## Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Framework | **Angular** | 20.x |
| Language | **TypeScript** | 5.8 |
| Reactivity | **RxJS** | 7.8 |
| HTTP | **Angular HttpClient** | REST + multipart |
| Routing | **Angular Router** | Lazy-friendly route config |
| Forms | **Template & reactive patterns** | Login, register, post create |
| Maps | **Leaflet** | 1.9 (anonymous / map features) |
| Build | **Angular CLI** / `@angular-devkit/build-angular` | 20.x |
| Dev proxy | **proxy.conf.json** | Forwards to backend :8080 |
| Package manager | **npm** | 8+ |

---

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│  Browser (localhost:4400)                                 │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Components │→ │ Services    │→ │ HttpClient          │ │
│  │ (UI)       │  │ (state/API) │  │ + auth.interceptor  │ │
│  └────────────┘  └─────────────┘  └──────────┬──────────┘ │
└──────────────────────────────────────────────│────────────┘
                                               │ proxy.conf.json
                                               ▼
                                    Spring Boot :8080
                                    /api  /uploads  /ws
```

**Standalone-style bootstrap:** `AppComponent` is standalone; routes in `app.routes.ts`; `AppModule` wires `HttpClientModule` and routing.

**Cross-cutting:**

- `auth.guard.ts` — protects authenticated routes
- `auth.interceptor.ts` — attaches auth token to outgoing requests
- `shared/header` — global navigation
- `shared/chat-panel` — DM UI shell

---

## How it works

### 1. Authentication flow

1. User registers or logs in via `AuthService` → `POST /api/auth/register` or `/login`.
2. Response includes `User` with `id` and `token`; stored in service/local pattern for session.
3. `authGuard` blocks `/home`, `/create`, `/profile`, etc. if not logged in.
4. `auth.interceptor` adds credentials/headers on API calls.

### 2. Data loading

Feature **services** encapsulate HTTP:

- `PostService` — posts, comments, likes, popular feed
- `UserService` — profile CRUD, image uploads
- `FollowersAndFollowingService` — social graph
- `ChatService` — DMs, inbox, unread counts
- `NotificationService` — alerts
- `AnonymousChatService` — random chat / WebSocket

Components subscribe to `Observable` streams and update templates.

### 3. Proxy (development)

`npm start` runs `ng serve --port 4400` with `proxy.conf.json`:

| Frontend path | Proxied to |
|---------------|-----------|
| `/api/*` | `http://localhost:8080` |
| `/uploads/*` | `http://localhost:8080` |
| `/ws/*` | `http://localhost:8080` (WebSocket) |

No CORS configuration needed in the browser during local dev.

### 4. File uploads

Create post and profile flows build **`FormData`**: JSON part + optional `file` part, matching backend `multipart/form-data` contract.

---

## Why this design is efficient

| Approach | Benefit |
|----------|---------|
| **Thin components, fat services** | Reusable API logic; easier testing and maintenance |
| **Central HTTP interceptor** | One place for auth headers and error handling |
| **Route guards** | Security without duplicating checks in every component |
| **Dev proxy** | Same-origin API calls; no brittle hard-coded backend URLs in components |
| **Relative API paths** (`/api/...`) | Works in dev (proxy) and prod (reverse proxy) |
| **Component-scoped CSS** | Styles don’t leak; faster iteration per feature |
| **RxJS Observables** | Composable async flows for chat and notifications |

---

## Features

### Blogging

- **Home feed** — post grid, pagination, sidebar (popular, tags, recent comments)
- **Create post** — title, content, category, tags, image/video/PDF upload
- **Post detail** — full post, comments, like toggle
- **Popular posts** — engagement-ranked list

### Users & profiles

- **Register / login**
- **Own profile** — stats and activity
- **Profile edit** — bio, links, profile & background images
- **Public user profile** — view other users (`/user/:id`)

### Social

- **Followers & following** — lists, counts, follow/unfollow, relationship status

### Messaging

- **Direct messages** — chat panel, conversations, read state, unread badge
- Integrated with backend `/api/chat/*`

### Anonymous chat

- **Random chat** — matchmaking UI, session messaging (`RandomChatComponent`)
- Uses anonymous chat service + WebSocket where configured

### UX

- Responsive layouts and card-based design
- Protected routes for authenticated areas
- Header navigation across main sections

---

## New & advanced features

| Feature | Component / service | Backend tie-in |
|---------|---------------------|----------------|
| **DM / inbox** | `chat-panel`, `ChatService` | `/api/chat` + optional Kafka delivery |
| **Notifications** | `NotificationService` | `/api/notifications` |
| **Follow graph** | `followers-and-following` | `/api/followersAndFollowing` |
| **@Mentions** | Post/comment flows | Mention fields on API |
| **Anonymous random chat** | `random-chat` | Anonymous chat + WebSocket |
| **Map / Leaflet** | Random chat / map UI | Map presence APIs |
| **AI moderation (future UI)** | Status badges when backend enabled | `moderationStatus` on entities |

When AI moderation is enabled on the backend, the UI can show **Pending / Approved / Warning / Blocked** badges—wire when `moderation_status` is exposed in API responses.

---

## Project structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/                 # Feed & sidebar
│   │   │   ├── create-post/          # New post + upload
│   │   │   ├── post-detail/          # Single post + comments
│   │   │   ├── profile/              # Own profile
│   │   │   ├── profile-edit/         # Edit account
│   │   │   ├── user-profile/         # Other user's profile
│   │   │   ├── login/ / register/
│   │   │   ├── followers-and-following/
│   │   │   └── random-chat/          # Anonymous chat
│   │   ├── shared/
│   │   │   ├── header/               # Nav bar
│   │   │   └── chat-panel/           # DM drawer/panel
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── post.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── followers-and-following.service.ts
│   │   │   ├── anonymous-chat.service.ts
│   │   │   └── chat-launch.service.ts
│   │   ├── auth.guard.ts
│   │   ├── auth.interceptor.ts
│   │   ├── app.routes.ts
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   ├── styles.css
│   └── index.html
├── proxy.conf.json
├── angular.json
├── package.json
└── tsconfig.json
```

---

## Routing

| Path | Component | Auth |
|------|-----------|------|
| `/` | Redirect → `/login` | — |
| `/login` | LoginComponent | Public |
| `/register` | RegisterComponent | Public |
| `/home` | HomeComponent | Guard |
| `/create` | CreatePostComponent | Guard |
| `/profile` | ProfileComponent | Guard |
| `/profile/edit` | ProfileEditComponent | Guard |
| `/user/:id` | UserProfileComponent | Guard |
| `/random-chat` | RandomChatComponent | Guard |

---

## Services & API layer

All services use **relative URLs** (e.g. `/api/posts`) so the proxy works in development.

| Service | Responsibility |
|---------|----------------|
| `AuthService` | Login, register, session user |
| `PostService` | Posts, comments, likes, popular |
| `UserService` | Profile GET/PUT, image uploads, user search |
| `FollowersAndFollowingService` | Follow graph |
| `ChatService` | Messages, inbox, read, unread count |
| `NotificationService` | User notifications |
| `AnonymousChatService` | Anonymous sessions & WS |
| `ChatLaunchService` | Open DM from profile, etc. |

**API contract:** [`../Backend/UI_HANDOFF.md`](../Backend/UI_HANDOFF.md)

---

## How to run

### Prerequisites

- Node.js 18+ (16+ minimum)
- npm 8+
- Backend running on **port 8080**

### Install & start

```bash
cd frontend
npm install
npm start
```

Opens **http://localhost:4400** with proxy to backend.

Alternative:

```bash
npx ng serve --port 4400 --proxy-config proxy.conf.json
```

### Production build

```bash
npm run build
```

Output: `dist/blog-management-frontend/` — deploy behind nginx/Apache with `/api` routed to Spring Boot.

---

## Styling & UX

- Global theme in `src/styles.css`
- Per-component `.css` files
- Gradient header, cards, hover transitions
- Responsive grids on home and profile

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API 404 / network error | Start backend on `8080`; use `npm start` (not raw `file://`) |
| CORS errors | Use dev server + `proxy.conf.json`; don’t call `localhost:8080` directly from browser |
| Wrong port | Frontend uses **4400** (`package.json`), not 4200 |
| Auth redirect loop | Clear storage; login again |
| Upload fails | Check backend 10MB limit; use `multipart/form-data` |
| WebSocket fails | Ensure proxy `/ws` and backend WebSocket config |

---

## Related documentation

| Document | Description |
|----------|-------------|
| [`../README.md`](../README.md) | Full project overview |
| [`../ExcutionInfofile.md`](../ExcutionInfofile.md) | Execution steps |
| [`../Backend/README.md`](../Backend/README.md) | Backend architecture |
| [`../Backend/UI_HANDOFF.md`](../Backend/UI_HANDOFF.md) | REST API reference |
| [`docs/README.md`](docs/README.md) | Frontend docs index |

---

## License

Part of the Blog Management System — see repository root license.
