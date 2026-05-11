# Add Event Brief card to ChatThread

Insert a read-only Event Brief card in `src/pages/chat/ChatThread.tsx`, between the sticky header's closing `</div>` and the `{/* Messages */}` comment. Renders only when `conversation.event` is present.

## Content

- Pill with `event.type` (capitalized) + event name
- Date row: formatted `dd MMMM yyyy`, fallback "Date not specified"
- Location row: fallback "Location not specified"
- Guest count row: rendered as `"{count} guests"` (e.g. "100 guests"), fallback "Guest count not specified"
- Notes row: only if present

## Constraints

- Single insertion; no other edits
- Use existing `format` import (already present)
- No role gating — visible to both organizer and vendor
- Keep the existing "Regarding: ..." pill in the header unchanged
- Do not modify `useChat.ts`, `MakeQuotationSheet`, or any other file
- Use semantic tokens already in the snippet (`border-border`, `bg-primary/5`, `text-primary`, `text-foreground`, `text-muted-foreground`)
