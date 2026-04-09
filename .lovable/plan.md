

## Plan: Add Debug Logging and Trim Secrets in create-ozow-payment

### Summary
Three targeted changes to `supabase/functions/create-ozow-payment/index.ts` to help diagnose the Ozow HashCheck failure.

### Changes (single file)

**1. Trim all Ozow secrets (lines 100-106)**
Replace the 7 secret reads with `.trim()` versions using fallback to empty string.

**2. Add debug logging before the fetch call (after line 171)**
Insert three `console.log` lines showing the payload (with truncated hash), private key length, and site code.

**3. Replace error handling block (lines 184-190)**
Log full `ozowRes.status` and `JSON.stringify(ozowData)` separately, return full `ozowData` in response details.

### After deployment
You tap Pay Deposit, then I check the edge function logs and report:
- Private key length
- Full Ozow error response

