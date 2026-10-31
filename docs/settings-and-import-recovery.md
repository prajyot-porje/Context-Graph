# Settings and import recovery

Updated November 1, 2026.

## Why the reported import closed

The previous connection UI canceled the active waiting import when the user selected a different provider. A copied ChatGPT prompt could therefore keep an ID that the website had silently canceled. The server correctly rejected that closed attempt, but the UI had not made the cancellation explicit.

Provider changes now preserve attempts. The selected ID is retained in the URL and included in status refreshes. Reopening a provider resumes its active attempt. A stale setup ID can resolve to an existing newer website-created attempt for that same owner and provider; it cannot create an attempt or reopen a discard. Submissions to the old closed ID remain rejected, with instructions to call setup and use its returned ID. Draft submission returns a direct review URL. Only an explicit discard or expiry closes unsaved work.

Step three polls for the approved draft and has a Refresh control. The draft appears on that same page for review and save. A note is a saved fact; nodes organize facts in the graph. Connecting or sending a draft does not make it permanent saved context.

## Settings that work

- Account: display name, built-in profile icons, cropped/resized photo upload, read-only verified email.
- Appearance: dark, light or system theme, and default graph/notes view. These preferences apply to this device.
- Connected tools: observed client identity/activity, connect another tool and confirmed disconnect. Saved context is preserved.
- Context capture: server-backed enable/pause, pending/failed counts and retry.
- Security: existing password recovery, safe session summaries, sign out a session or other sessions, generate/replace/revoke terminal API keys. Tokens are never included in the settings session response.
- Data & privacy: saved-node/note JSON export, explicit unsaved-draft discard and privacy policy. There are no fake training/privacy toggles for controls owned by external AI providers.

No additional environment variables, storage service or database migration is needed. Avatar data uses the existing Better Auth image column and is limited to controlled static icons or small validated JPEG data URLs. Export is tenant-scoped and excludes keys, session tokens and unsaved drafts. Full account deletion remains outside this release.

## Research

The familiar sidebar and focused setting rows follow the existing product design system. OpenAI's [app-permission guidance](https://help.openai.com/en/articles/20001495-managing-app-permissions-in-chatgpt) distinguishes connection permissions from account-wide personalization/data controls. ContextGraph similarly separates access, ongoing capture and privacy information. [ChatGPT personalization guidance](https://learn.chatgpt.com/docs/personalize) is a reference for grouping preferences, not a promise that ContextGraph controls another provider's memory or training policies.
