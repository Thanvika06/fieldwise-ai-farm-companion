<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- AI calls (Gemini via `@lovable.dev/ai-gateway`) live only in `src/lib/ai.server.ts` / `src/lib/chat.server.ts`, exposed through `src/lib/ai.functions.ts` server functions and the `/api/chat` streaming route — keeps keys and prompts off the client.
- AI server functions return `{ ok: false, code, message }` instead of throwing — the UI shows friendly errors and offers clearly labelled demo results.
- Every number shown carries a source badge (`DataBadge`: sample / live / demo / AI / simulated) — the app must never present demo values as real readings.
- Farm field data is static sample data in `src/lib/farm-data.ts`; health and irrigation rules are pure functions in `src/lib/farm-logic.ts` with tests in `src/test/farm-logic.test.ts` — keep rules testable and out of components.
- Shared farm state (simulation, settings, alerts) lives in `FarmProvider` (`src/lib/farm-store.tsx`) so the digital-twin simulation reflects across dashboard, analytics and reports.
- App pages sit under the pathless `_platform` layout (sidebar + top bar); the landing page `/` stays outside it.
- AgriBot conversations are stored in sessionStorage per thread (`src/lib/chat-threads.ts`) with one route per thread (`/assistant/$threadId`) — the user chose multiple, session-only conversations.
- Weather comes from Open-Meteo (no key) via `getWeather` server function, falling back to labelled demo weather.
