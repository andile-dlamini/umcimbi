

## Plan: Update ANTHROPIC_API_KEY Secret

Replace the existing `ANTHROPIC_API_KEY` with a new value so the `analyse-quote` edge function can connect to the Anthropic API successfully.

### Steps
1. Use the `add_secret` tool to prompt you for the new `ANTHROPIC_API_KEY` value
2. Test the `analyse-quote` edge function to confirm it works with the updated key

