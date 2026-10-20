# CLAUDE.md — Frontend

This file provides guidance to Claude Code (claude.ai/code) when working in `Frontend/`.

## Scope

This folder is the MultimediaServer web client: React + Vite in **JavaScript** (not TypeScript). It talks to the backend only over HTTP. **Do not read or edit `../Backend/` from a frontend session**: everything the client needs about the API is in the contract below. If the client needs an API change, describe it to the user as a backend task. Do not implement it from here.

Status: **scaffolded** (Vite 8, React 19, React Router 7, `lucide-react` icons, `oxlint`). All 10 screens are built and wired to the API contract below.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
npm run lint
```

## Project structure

Feature-based. Import across folders with the `@/` alias (`@/` = `src/`).

```
src/
  main.jsx              entry: global styles + <App>
  app/                  App (providers), router (lazy routes + guards), NotFoundPage
  config/env.js         API_URL from VITE_API_URL
  api/                  the only code that talks HTTP
    client.js           request/requestList/requestBlob/uploadWithProgress: all response quirks live here
    tokenStore.js       the only owner of the JWT (see "Session and credentials") + 401 hook
    *.api.js            one module per resource (auth, users, genres, moviesSeries, multimedia)
  components/
    layout/             AppLayout, Sidebar, Brand
    ui/                 reusable primitives: Button/IconButton, Field, Alert, Modal, ConfirmDialog,
                        Pagination, SegmentedControl, ProgressBar, Spinner/EmptyState/ErrorState
  features/             one folder per area; each page is the default export of *Page.jsx
    auth/               AuthProvider + useAuth, guards (RequireAuth, RequireRole, PublicOnly), LoginPage
    catalog/            CatalogPage, TitleDetailPage, components/ (Poster, TitleCard)
    player/             PlayerPage
    account/            AccountPage
    admin/content|multimedia|genres|users/
  hooks/                useAsync, usePosterUrl (blob cache), useGenres, useDebouncedValue, useDocumentTitle
  styles/               tokens.css (design tokens), base.css, ui.css (shared classes)
  utils/format.js       labels, durations, grouping by season
```

- Styling: design tokens as CSS variables in `styles/tokens.css`; shared classes (`.btn`, `.field`, `.table`, `.card`, `.dialog`…) in `styles/ui.css`; page-specific layout in a co-located `*.module.css`.
- Data loading: `useAsync(loader, deps)` returns `{ data, error, loading, reload, setData }`. No query library yet.
- Errors: every API failure is an `ApiError` with `status`, `message` (shown as-is) and `fieldErrors` (validation list mapped by field).

## Implementation decisions (departures from the mockups)

- **Player** uses the native `<video controls>` (as the contract says) instead of the mockup's custom control bar.
- **Catalog filters**: the API filters only by `name`, so the type and genre filters apply to the current page of results. A backend task to add `type` / `genreId` query params would make them exact.
- **Role without `/users/me`**: `features/auth/resolveCurrentUser.js` tries `GET /users/me`; if missing, an ADMIN finds themselves in `GET /users`, and anyone else is treated as USER with unknown id (then "Mi cuenta" shows a notice instead of the form). Remove the fallback once the backend adds `/users/me`.
- **Content table "Archivos" column** makes one `GET /multimedia?movieSeriesId=` per row, since the list has no counts.
- Deletes of genres, episodes and users ask for confirmation first (the mockups only show the title cascade dialog).

## Session and credentials

- **The password is never stored.** It lives only in the login form state and is cleared after a failed attempt.
- **Only the JWT and the username are kept**, by `src/api/tokenStore.js`. Nothing else reads or writes the token.
  - The token is held in memory and persisted so a reload keeps the session: in **`sessionStorage`** by default (ends when the tab or browser closes), or in **`localStorage`** when the user ticks "Mantener la sesión iniciada".
  - The JWT `exp` claim is decoded (not verified; the server is the authority). An expired token is never sent: the client ends the session first. `AuthProvider` also logs out on a timer exactly at `exp`, showing "Tu sesión ha caducado".
  - Tabs stay in sync through the `storage` event: logging out in one tab ends the persisted session in the others ("Se ha cerrado la sesión en otra pestaña."). A tab-scoped (`sessionStorage`) session ignores other tabs.
- `client.js` adds `Authorization: Bearer <jwt>` to every request (`fetch` and XHR uploads). The only exception is the video URL, which carries `?token=` because a `<video>` tag cannot send headers.
- Production builds get a `Content-Security-Policy` meta tag (see `vite.config.js`) to limit the impact of XSS on the stored token. `frame-ancestors` cannot be set from a meta tag; the backend already sends `X-Frame-Options: DENY`, and the web server that hosts the build should do the same.
- Long term, an `HttpOnly; Secure; SameSite` cookie set by the backend would keep the token out of JavaScript entirely. That is a backend change (and needs CORS with credentials or a same-origin deploy).

## Configuration

- `VITE_API_URL`: the base URL the browser uses for the API. Default **`/api`**, which the Vite dev/preview server proxies to the backend (same origin, so no CORS). Keep it in `.env.local`, never hard-coded. See `.env.example`.
- `VITE_API_PROXY_TARGET`: where the proxy forwards `/api` (default `http://localhost:8080`).
- Calling the backend directly from another origin (e.g. `VITE_API_URL=http://localhost:8080`) also works: the backend sends CORS headers on every endpoint and answers the `OPTIONS` preflight with 200 without a token (see "CORS" in the API contract).

## Design reference

**Mockups: `docs/mockups/`** holds a local copy of all 10 screens. Read `docs/mockups/README.md` first: it maps each file to its screen and route, and explains the `.dc.html` format (they are a visual reference, not code to copy). **Before building a screen, open its mockup file** and follow its layout, copy and states. The live canvas is https://claude.ai/artifact/AimuQeTbiVLCxMoNg5Qq9v.

- **Look**: dark streaming UI. Background `#0E1014`; surfaces `#161920` / `#1E222B`; borders `#2B303B`; text `#ECEEF2`; secondary text `#A3ABB9` / `#C9CED8`; accent amber `#F2A93B` (with text `#1B1306` on it); accent tint `#2A2418`; danger `#E5675C` (text `#FFB4AB`, background `#2A1714`); success text `#A6E3B2` on `#142318`; info text `#B9D3F5` on `#15202E`.
- **Type**: Sora 600/700 for headings, Inter 400/500/600 for body (Google Fonts).
- **Shape**: radii 10px (controls), 14px (cards and tables), 16px (dialogs); touch targets at least 44px; posters are 2:3 and video is 16:9.
- **Layout**: a left sidebar (240px) plus fluid content; the sidebar stacks on top at phone width; wide tables scroll horizontally inside their box.
- **Accessibility**: real `<button>`, `<a>`, `<label>` and `<input>` elements; `aria-label` on icon-only buttons; dialogs use `role="dialog"` and `aria-modal`.

## Screens, routes and roles

| Route (suggested) | Screen (mockup) | Roles |
|---|---|---|
| `/login` | Login | public |
| `/` | Catalog: search by name, filter MOVIE/SERIE and genres, poster grid, pagination | USER, ADMIN |
| `/titles/:id` | Detail: synopsis, genres, episodes grouped by season, Play button | USER, ADMIN |
| `/watch/:multimediaId` | Player: `<video>` plus a "next episodes" list | USER, ADMIN |
| `/account` | My account: personal data, username, password; the role is shown locked; no delete option | USER, ADMIN |
| `/admin/content` | Content table plus a cascade-delete confirmation | ADMIN |
| `/admin/content/new`, `/admin/content/:id/edit` | Movie/series form with poster upload | ADMIN |
| `/admin/multimedia` | Episodes per title plus a video upload form with progress | ADMIN |
| `/admin/genres` | Inline add and edit; delete shows the backend error when the genre is in use | ADMIN |
| `/admin/users` | Full-width table, a "Nuevo usuario" button that opens a modal form; another admin's row is locked | ADMIN |

- **USER**: read-only catalog plus playback. Can edit only their own account (personal data, username, password), never their role. The sidebar shows only "Catálogo" and "Mi cuenta".
- **ADMIN**: everything, plus the "Administración" sidebar section and the create, edit and delete buttons in the catalog and detail screens.
- Hide what the role cannot do, but **the backend is the authority**: still handle 403 everywhere.
- Guard `/admin/*` routes on the client by role. Send logged-out users to `/login`.

## API contract (backend at `VITE_API_URL`)

### Auth

- `POST /login` with JSON `{ "username", "password" }` → `200 { "Authentication": "<jwt>", "username": "...", "id": <number>, "rol": "ADMIN"|"USER", "message": "..." }`. A failure returns `401 { "message", "code", "status" }`.
- Every other call sends `Authorization: Bearer <jwt>`. A `401` means the token is missing, expired or invalid (or the user was renamed, deactivated or deleted): clear the session and go to `/login`.
- `GET /users/me` (any authenticated user) → `200` with the caller's `FullUserDTO`. Use it to restore `id` and `rol` after a reload, when only the token was kept.
- **CORS**: any origin, no credentials (the token goes in `Authorization`, never in cookies). Allowed methods `GET, POST, PUT, DELETE, OPTIONS`; allowed request headers `Authorization`, `Content-Type`, `Range`; exposed response headers `Location`, `Content-Range`, `Accept-Ranges`, `Content-Disposition`. Preflights need no token and are cached for 1 hour.
- When a user changes their own username, their token stops working: force a new login after saving.

### Response quirks (handle them in one API helper)

- **Lists** return a **plain JSON array**, with no page object and no total count. Paginate with `?page=0&size=10&sort=field,asc`. Treat "fewer items than `size`" as the last page.
- **An empty list** returns `200` with an object `{"message":"No existen ... registrados"}` instead of `[]`. Normalize it to `[]`.
- These message bodies (empty list, `DELETE`) are sent as a Java `String`, so they may arrive as `text/plain`. Read them with `response.text()` and `JSON.parse`, not only `response.json()`.
- `POST` → `201` with the created object (and a `Location` header). `PUT` → `200` with **no body**: refetch afterwards. `DELETE` → `200 {"message":"Registro eliminado correctamente"}`.
- **`PUT` takes the `id` in the body**, never in the URL. Fields sent as `null` or omitted are left unchanged.

### Errors

- Business errors: `{ "message": "<texto en español>", "code": <http>, "status": <http> }`. Use `400` for invalid data, duplicates and broken rules; `403` when the role is not allowed; `404` when the record does not exist or is deleted.
- Bean-validation errors: `400` with a **list** `[{ "field": "username", "message": "..." }]`. Map each item to its form field.
- Show `message` as-is; it is already user-facing Spanish.

### Resources

`FullUserDTO` `{ id, username, rol: "ADMIN"|"USER", status: "ACTIVE"|"INACTIVE"|"DELETED", name, lastname, email }`. The person fields can be `null` (the initial admin has none).

| Method | Path | Who | Body |
|---|---|---|---|
| GET | `/users` | ADMIN | — |
| GET | `/users/me` | any authenticated user (their own account) | — |
| GET | `/users/{id}` | ADMIN any; USER only their own | — |
| POST | `/users` | ADMIN | JSON `{ username, password (8–72), rol?, name, lastname, email }` |
| PUT | `/users` | see rules | JSON `{ id, username?, password?, rol?, name?, lastname?, email? }` |
| DELETE | `/users/{id}` | ADMIN | — |

User rules enforced by the backend (mirror them in the UI):
- There is always at least one active ADMIN.
- An ADMIN edits and deletes their own account and USER accounts, never another ADMIN's.
- An ADMIN can promote a USER and demote themselves.
- A USER updates only their own account, cannot change their role and cannot delete any account.

`FullGenreDTO` `{ id, genre }`

| Method | Path | Who | Body |
|---|---|---|---|
| GET | `/genres`, `/genres/{id}` | any authenticated | — |
| POST | `/genres` | ADMIN | JSON `{ genre }` (max 50, unique) |
| PUT | `/genres` | ADMIN | JSON `{ id, genre? }` |
| DELETE | `/genres/{id}` | ADMIN | — (400 if any title uses it; usage is not exposed beforehand) |

`FullMovieSeriesDTO` `{ id, name, synopsis, posterPath, releaseYear, classification, type: "MOVIE"|"SERIE", genreIds: number[] }`

| Method | Path | Who | Body |
|---|---|---|---|
| GET | `/movies-series?name=&type=&genreId=` | any authenticated | — (all filters optional and combinable: `name` substring, case-insensitive; `type` `MOVIE`/`SERIE`; `genreId` entries with that genre. An invalid `type` → `400`) |
| GET | `/movies-series/{id}` | any authenticated | — |
| GET | `/movies-series/{id}/poster` | any authenticated | — (image; 404 if none) |
| POST | `/movies-series` | ADMIN | `multipart/form-data`: `name`, `synopsis`, `releaseYear` (1901–2155), `classification?` (max 10), `type`, `genreIds` (repeat the field), `poster?` (JPG/PNG/WEBP, max 5MB) |
| PUT | `/movies-series` | ADMIN | multipart: `id` plus any of the above; `genreIds` replaces all genres; `poster` replaces the old one |
| DELETE | `/movies-series/{id}` | ADMIN | — (also deletes its multimedia) |

Changing `type` fails while the title has multimedia.

`FullMultimediaDTO` `{ id, movieSeriesId, multimediaPath, title, season, episodeNumber, durationSeconds }`

| Method | Path | Who | Body |
|---|---|---|---|
| GET | `/multimedia?movieSeriesId=` | any authenticated | — (sorted by season, episode) |
| GET | `/multimedia/{id}` | any authenticated | — |
| GET | `/multimedia/{id}/video?token=<jwt>` | any authenticated | — (streams with Range/206) |
| POST | `/multimedia` | ADMIN | multipart: `movieSeriesId`, `title?` (max 100), `season`, `episodeNumber`, `video` (MP4/WEBM, required, up to 10GB) |
| PUT | `/multimedia` | ADMIN | multipart: `id`, `title?`, `season?`, `episodeNumber?`, `video?` |
| DELETE | `/multimedia/{id}` | ADMIN | — |

- A MOVIE has exactly one video and no season or episode (to replace the video, use `PUT`).
- A SERIE episode needs `season` (0 or more) and `episodeNumber` (1 or more), unique within the series.
- The server computes `durationSeconds` with ffprobe after the upload, so a large upload takes a while to answer.
- Show upload progress with `XMLHttpRequest` (`upload.onprogress`), since `fetch` cannot report it.

### Media in the browser

- **Video**: `<video src="${API}/multimedia/${id}/video?token=${jwt}" controls>`. Only this endpoint accepts `?token=`.
- **Poster**: the endpoint **requires the Authorization header**, so a plain `<img src>` gets 401. Fetch it with the header and show it with `URL.createObjectURL(blob)` (cache it, and revoke the URL on unmount). If the backend later makes posters public, switch to `<img src>`.
