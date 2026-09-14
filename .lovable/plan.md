# Plan: Route vendors to business setup after OTP/password completion

## What we're changing
In `src/pages/auth/AuthPage.tsx`, after a vendor finishes phone verification and password creation, send them straight into the vendor business-setup step instead of the generic success screen.

## Current state (verified)
At line 605 the handler unconditionally calls:
```ts
setStep('success');
toast.success('Account created successfully!');
```

## Proposed change
Wrap that final routing in a role check so vendors land on the business step:
```ts
if (selectedRole === 'vendor') {
  setStep('business');
  toast.success("Account created. Let's set up your business.");
} else {
  setStep('success');
  toast.success('Account created successfully!');
}
```

## Boundaries / out of scope
- Leave the `trackPixel` calls above it untouched.
- Leave auto sign-in, `setCreatedUserId`, and error handling untouched.
- Do not change the Google signup path, `initialStep` resolution, the success screen UI, `backMap`, `getSteps`, or wizard resume logic.
- No other files are modified.
