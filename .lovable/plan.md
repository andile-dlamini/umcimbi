Make two targeted changes to `supabase/functions/send-waitlist-launch-emails/index.ts`:

1. **Expand the select query** to include `role` and `business_name`:
   ```typescript
   .select('id, full_name, email, phone_number, role, business_name, launch_email_sent_at, launch_sms_sent_at')
   ```

2. **Update the SMS_BODY constant** to the new isiZulu-inspired copy:
   ```typescript
   const SMS_BODY = `Sawubona! UMCIMBI is live 🎉 Thank you for waiting. Your spot is ready - find vendors, get quotes, pay safely: ${SITE_URL} - Andile`
   ```

No other code changes. Re-deploy the edge function after editing.