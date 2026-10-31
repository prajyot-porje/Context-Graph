# Gmail and authentication setup

Updated October 31, 2026. The app sends OTPs from a dedicated personal Gmail account through Gmail SMTP. No purchased domain or Google Workspace subscription is required. Recipients can use their own email addresses; they do not need Gmail App Passwords or access to the sender account.

## Current release verification

The owner has configured the dedicated Gmail sender and App Password locally and on Vercel. Local SMTP authentication succeeded and the test message was confirmed in the dedicated Gmail inbox through read-only IMAP. No code or password is written to the verification reports.

The authentication migration is installed in the configured Supabase database, TLS validation works with the bundled public Supabase CA, and schema/RLS/server-access checks passed. The agent owns local/live OTP verification, publishing through the existing GitHub–Vercel integration, and deployed checks. No further SQL, certificate setup or terminal commands are assigned to the owner. Final owner validation is an ordinary signup/login and inbox check after deployment.

Operator commands: `npm run auth:check` checks database readiness; `npm run auth:smoke` runs non-destructive HTTP checks; `npm run email:check` explicitly sends a self-addressed SMTP test. `scripts/verify-live-auth.mts --base URL` verifies real signup, inbox OTPs, password login, recovery, replay rejection and old-session revocation. It uses only a unique alias of the configured sender, opens the mailbox read-only, keeps credentials/codes in memory, and deletes only its own temporary app account. IMAP is an operator-only dev dependency, not part of the deployed auth flow.

Non-secret reports are saved in ignored `.test-output/`. The detailed sections below remain an operations reference rather than tasks the owner must complete.

## 1. Prepare the dedicated sender

1. Create a dedicated `@gmail.com` account, or use one you already control. Keep it separate from your personal inbox.
2. Sign in and enable **2-Step Verification** at [Google Account Security](https://myaccount.google.com/security).
3. Open [App Passwords](https://myaccount.google.com/apppasswords). Create one named `ContextGraph SMTP`.
4. Copy the generated App Password into your environment settings. Use this App Password, **not your regular Google password**. Spaces in Google's displayed password are removed by the app.
5. Keep account recovery options current. Do not share this account or its App Password with the ten recipients, commit it, or paste it into chat.

If App Passwords is unavailable, check Google's [account eligibility requirements](https://support.google.com/mail/answer/185833). Advanced Protection, some security-key-only settings and managed-account restrictions can prevent its use. The current integration requires an App Password; it does not implement Gmail API OAuth. Do not turn off two-step verification or enable obsolete less-secure-app settings.

Gmail applies [sending limits](https://support.google.com/mail/answer/22839?hl=en), and may reject messages or challenge cloud-server logins. There is no inbox-delivery guarantee. This setup is intended for the small beta; sending codes to ten different people is supported. Repeated resends and recovery emails count toward limits too.

## 2. Local environment

Use Node.js 22.13+ or Node.js 24, then install dependencies with `npm ci`. Add these values to the ignored `.env.local` file:

```dotenv
GMAIL_SMTP_USER=your.dedicated.account@gmail.com
GMAIL_SMTP_APP_PASSWORD=your-generated-app-password
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Keep your existing `BETTER_AUTH_SECRET`, `SUPABASE_DATABASE_URL`, Google OAuth credentials and other product settings. Use a long randomly generated auth secret. Do not prefix Gmail credentials with `NEXT_PUBLIC_`.

Remove obsolete `RESEND_API_KEY`, `EMAIL_FROM` and `EMAIL_API_URL` settings after switching. They are no longer read. Do **not** set `GMAIL_SMTP_TEST_PORT`; it is reserved for isolated automated fixtures, and is rejected on Vercel.

Restart `npm run dev` whenever environment settings change. Open the same hostname specified by both URL variables; mixing `localhost` and `127.0.0.1` will fail origin checks.

The sender is always `ContextGraph <GMAIL_SMTP_USER>`. SMTP uses `smtp.gmail.com:465` with TLS and normal certificate validation. No SMTP hostname/port/from variable is needed for Gmail.

## 3. Database migration and TLS

Back up your database before applying changes. On an existing database, review and run **only** `supabase/2026-10-31-auth-hardening.sql` through the Supabase SQL editor if the previous recovery/OAuth migrations are already installed. It adds the private `auth_request_limits` table and expiry index; it does not delete context, users or keys. RLS is enabled without browser policies. The server database role must be allowed to access it.

Alternatively, the existing full upgrade runner now includes this migration. With credentials loaded explicitly:

```powershell
node --env-file=.env.local --import tsx scripts/migrate-recovery.mts
# Review .test-output/auth-upgrade.sql and checked-in additive SQL; back up first.
node --env-file=.env.local --import tsx scripts/migrate-recovery.mts --apply
```

The runner's first command is dry-run only. Its generated file contains provider schema upgrades; the checked-in application migrations are applied by the second command. Do not apply the fresh auth snapshot over existing users. Fresh installations use the README's fresh-schema sequence; `supabase/schema.sql` includes the new limiter table.

Database TLS verifies the server certificate and hostname. Supabase hosts automatically use the bundled official public Supabase CA; this setup is already working. Connection-URL SSL flags cannot disable verification. For a different provider or a future CA rotation only: if a different CA is required, download the appropriate database CA certificate from your provider dashboard and set `DATABASE_CA_CERT` to the PEM contents. Real newlines or literal `\n` are supported. Keep `DATABASE_SSL` unset for remote databases. `DATABASE_SSL=false` is permitted only for an explicit loopback development database. Never fix a remote certificate error by disabling validation. The application pool defaults to three connections. Credential serialization uses a separate pool capped at two connections to avoid starving Better Auth queries; budget up to five connections per warm instance by default.

## 4. Vercel environment and deployment

In **Project → Settings → Environment Variables**, add:

| Variable | Value |
| --- | --- |
| `GMAIL_SMTP_USER` | The dedicated `@gmail.com` address |
| `GMAIL_SMTP_APP_PASSWORD` | Its Google App Password; mark sensitive |
| `BETTER_AUTH_URL` | Your stable `https://YOUR-PROJECT.vercel.app` URL |
| `NEXT_PUBLIC_APP_URL` | The exact same stable URL |
| `DATABASE_CA_CERT` | Provider CA PEM, only if needed for the database certificate chain |

Keep existing auth secret, database, Google OAuth, cron and model settings. Apply the Gmail variables to Production, and to Preview only if preview users should send real emails. Consider a separate sender and database for previews: local/preview/production using one sender share Gmail's account limits.

Remove obsolete Resend variables. Never add the SMTP test-port variable to Vercel. Redeploy after changing variables; an existing deployment does not acquire updated values automatically.

Preview deployments trust their own exact `VERCEL_URL`. The app no longer trusts every `*.vercel.app` origin. Use a stable URL for real Google OAuth tests; arbitrary preview URLs must also be explicitly registered in Google's console.

## 5. Google sign-in settings

Keep `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` configured where Google sign-in should appear. In the Google Cloud OAuth client's authorized redirect URIs, include:

```text
http://localhost:3000/api/auth/callback/google
https://YOUR-PROJECT.vercel.app/api/auth/callback/google
```

Use your real stable deployment URL. If Google's consent app is in testing, add the ten people as OAuth test users when Google's audience rules require it. This is a Google OAuth setting, unrelated to Gmail SMTP recipients.

## 6. Smoke-test delivery and account flows

The following command intentionally sends one test email to the address you supply:

```powershell
node --env-file=.env.local --import tsx scripts/check-email.mts --to YOUR_RECIPIENT@gmail.com
```

It confirms SMTP acceptance and then asks you to check the inbox/spam folder. The test email does not create an account or a usable account-verification code. No secret or OTP is printed by the command.

Test these workflows locally, then repeat them on the deployed site:

1. **New signup:** email → code → choose/confirm a 12–128 character password → automatic password sign-in → setup. There is no name field, and no session before mailbox proof and password creation.
2. **Returning user:** email/password → sign in. No new OTP is required.
3. **Google:** Continue with Google → normal entry. Google-only users can choose **Forgot password or need to set one?**, verify their inbox and add a password; Google remains available.
4. **Recovery:** verify email → set a new password → sign in. The old password and old website sessions must stop working. OAuth MCP tokens tied to revoked sessions stop working; legacy API keys are deliberately preserved and can be replaced in Settings if compromise is suspected.
5. **Interrupted signup:** repeat signup or choose recovery with the same email. The owner chooses a fresh password after proof; no previously planted password is activated. An unverified password registration must complete recovery before Google can link to it.
6. **Wrong login:** generic error with visible signup/recovery links. Choosing signup preserves the email; the app deliberately avoids an automatic redirect that reveals membership. If signup is used for an existing account, it performs the same verified password-recovery flow.
7. **Abuse/error checks:** expired/wrong/replayed codes fail; a resend countdown appears; SMTP outages show an error rather than claiming successful delivery. Successful SMTP submission is not proof of inbox receipt.

Use ten different recipient addresses for the team test. No recipient allowlist or Resend dashboard invitation is needed.

## 7. Diagnostics and operating limits

Check local console output or **Vercel → Deployment → Runtime Logs** for `[email]` entries:

| Event/code | Action |
| --- | --- |
| `smtp_accepted` | Gmail accepted the message; check recipient inbox/spam and sender Sent folder |
| `EAUTH` | Check sender address, App Password, 2-Step Verification, Google security notifications and quota responses |
| `ECONNECTION`, `ESOCKET`, `ETIMEDOUT` | Check hosting egress to port 465 and provider availability |
| `EENVELOPE`, `DELIVERY_FAILED` | Check recipient validity, sender configuration, Gmail restrictions and account limits |
| HTTP 429 | Wait for the returned retry window; do not repeatedly resend |
| Missing `auth_request_limits` | Apply the additive database migration before using the new auth flow |
| Database certificate error | Configure the provider CA and confirm the database hostname |

Diagnostics contain a correlation reference and safe error category, not raw SMTP responses, recipient addresses, passwords or OTPs. Better Auth may log a sanitized email-delivery failure too. Changing the Gmail login password can revoke App Passwords; generate a new one and update local/Vercel settings if that happens.

Send budgets are database-backed: one request per recipient per minute, five per recipient per 15 minutes, 50 per source IP per hour, and 300 globally per rolling 24 hours. Signup and recovery share these budgets. Local requests share a development IP bucket; on Vercel the app uses Vercel's ingress header. Proof checks/completions share ten requests per recipient per five minutes, with three wrong guesses per OTP in Better Auth. Password login has a per-email budget as well as the provider's shared backend limiter. Counters store HMAC identities, not plaintext emails/IPs, and the existing daily cleanup removes expired rows. Limits apply per database; Gmail limits apply per sender account.

## 8. Release and rollback

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and `npm run test:e2e` before release. Automated tests use disposable PostgreSQL and a local SMTP server, not real Gmail. Actual Gmail delivery, Google-account login and Vercel egress require the manual smoke tests above.

Apply the additive migration before deploying the code. Keep the same production auth secret; rotating it logs users out and changes signing behavior. No destructive migration is needed. Keep the new table if rolling back application code, and preserve user/context data. Rolling back to the old authentication implementation reintroduces the audit findings, so prefer fixing forward.


## Validation recorded for this change

- `npm test`: 9 files and 58 tests passed, including real PostgreSQL and local SMTP integration.
- Browser verification: all five existing scenarios passed, plus the new failed-login/prefilled-signup/mobile-recovery scenario passed separately. Screenshots are under `.test-output/`.
- Production build: `node --import tsx scripts/build-test.mts --webpack` passed with isolated fixture settings. Do not deploy that fixture-configured build.
- Default Turbopack production build hit a PostCSS worker process-startup failure on the Windows host. If the same environment issue occurs locally, `node node_modules/next/dist/bin/next build --webpack` uses Next.js's supported alternative compiler (direct invocation also avoids npm argument-forwarding issues). This does not require changing authentication configuration. Vercel's own build and actual Google/Gmail smoke tests remain release checks.

The security regressions demonstrate that the old planted password is rejected after owner claiming, legitimate password login remains available, Google-only recovery creates a working password while preserving its verified Google binding, old session cookies fail after recovery, and replayed/expired/wrong-purpose codes cannot change credentials. Public login and recovery share serialization to prevent an in-flight old-password login surviving recovery. Tests also cover SMTP rejection, cross-origin requests, concurrent budget enforcement and disabled legacy bypass endpoints. No real Gmail messages or production data were used in automated validation.
