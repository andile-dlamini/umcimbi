# Surgical changes to `analyse-quote` edge function

Two minimal edits to `supabase/functions/analyse-quote/index.ts`, no other changes.

## Change 1 — JWT auth gate (line 19–20)
Insert auth verification at start of `try` block. Extract Bearer token, validate via `SUPABASE_ANON_KEY` auth client. Return 401 if missing or invalid.

## Change 2 — Prompt-injection guard (lines 31, 47)
- Add `const safenotes = notes ? String(notes).slice(0, 500) : null;` immediately before the `fetch` call.
- Swap `notes` for `safenotes` in the user message string.

## Deploy
`supabase functions deploy analyse-quote`

## Untouched
Anthropic prompt body, model, max_tokens, platform_events logging, corsHeaders, fallback object, all other lines.