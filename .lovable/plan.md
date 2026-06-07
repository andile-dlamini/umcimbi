## Change
In `src/lib/chatNotifications.ts`, update the fallback conversation lookup block (lines 40-55) so it runs whenever no event-specific conversation was found, regardless of whether an `eventId` was provided.

### Current code
```typescript
    // If no event-specific conversation found and we have an eventId, create one for this event
    // If no eventId, fall back to finding any conversation between user and vendor
    if (!conversationId && !eventId) {
      const { data: anyConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (anyConv) {
        conversationId = anyConv.id;
      }
    }
```

### New code
```typescript
    // If no event-specific conversation found, fall back to any conversation
    // between this user and vendor — this handles conversations created without
    // an event_id or with a different event_id
    if (!conversationId) {
      const { data: anyConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (anyConv) {
        conversationId = anyConv.id;
      }
    }
```

### Impact
- Notifications will now reuse an existing conversation between a user and vendor even when scoped to a specific event, preventing duplicate chat threads.
- No other files touched. No migration needed.