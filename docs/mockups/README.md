# Mockups — MultimediaServer frontend

A local copy of the design canvas https://claude.ai/artifact/AimuQeTbiVLCxMoNg5Qq9v (version of 2026-10-20). Use these files as the **visual reference** for layout, copy, colors, spacing and screen states. **They are not code to copy into the app**: rebuild each screen as React components.

## Screens

| File | Screen | Role | Suggested route |
|---|---|---|---|
| `Main.dc.html` | Login (with a 401 error state) | public | `/login` |
| `Catalog.dc.html` | Catalog: search, MOVIE/SERIE filter, genre chips, poster grid, pagination | USER, ADMIN | `/` |
| `Detail.dc.html` | Series detail: info, Play, episodes by season; admin buttons | USER, ADMIN | `/titles/:id` |
| `Player.dc.html` | Video player plus next episodes | USER, ADMIN | `/watch/:multimediaId` |
| `Profile.dc.html` | My account (USER view; role locked, no delete) | USER, ADMIN | `/account` |
| `AdminCatalog.dc.html` | Content table plus a cascade-delete dialog | ADMIN | `/admin/content` |
| `MovieForm.dc.html` | Movie/series form, poster upload, field error example | ADMIN | `/admin/content/:id/edit` (and `/new`) |
| `MultimediaAdmin.dc.html` | Episodes per title plus a video upload with progress | ADMIN | `/admin/multimedia` |
| `Users.dc.html` | Full-width user table plus a "Nuevo usuario" modal form | ADMIN | `/admin/users` |
| `Genres.dc.html` | Genres: inline add, edit row, in-use delete error | ADMIN | `/admin/genres` |

`canvas.json` is the canvas index (frame positions, titles and the two sticky notes about roles). It is only useful for the canvas itself.

## How to read a `.dc.html` file

These files use the design canvas's component format, so opening them directly in a browser will not render them properly.

- The screen markup is inside `<x-dc> … </x-dc>`. Styles are inline (`style="…"`), plus a few shared classes in `<helmet><style>` (sidebar `.nav`, icon buttons `.ib`, table cells and form fields).
- `{{name}}` holes are filled from `renderVals()` in the `<script type="text/x-dc">` block at the end. That block holds the **sample data** (titles, episodes, users) and the small amount of mockup state (for example `isAdmin` from the `role` tweak, or the users modal's open state).
- `<sc-for list="{{items}}" as="it">` means "repeat for each item". `<sc-if value="{{flag}}">` means "render only when the flag is true". In React these become `.map()` and conditional rendering.
- `<a href="Other.dc.html">` links are prototype navigation between screens. In the app they become router links.
- `data-props` on the script tag lists the canvas tweaks: `role` (USER/ADMIN) in Catalog and Detail, `showDialog` in AdminCatalog, `uploadPct` in MultimediaAdmin and `showModal` in Users. These are design levers, not product features.
- Icons are inline stroke SVGs (24×24 viewBox, 2px stroke), similar to the Lucide/Feather style. An icon library such as `lucide-react` matches them.
- Sample text in brackets, for example `[Sinopsis de la serie]`, is a placeholder for API data.

## Keeping it in sync

When the canvas changes, refresh this folder from the artifact and update the date above. If the app's implementation intentionally departs from a mockup, note the decision in `../../CLAUDE.md`.
