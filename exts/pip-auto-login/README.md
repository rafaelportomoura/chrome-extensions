# PIP Auto login

Signs in to PIP (Patria Investment Platform) through Microsoft SSO: clicks "Sign in with
Microsoft" on the PIP sign-in page, picks the preferred account on the Microsoft account chooser
and answers Yes on "Stay signed in?".

Built with `pnpm --filter pip-auto-login build`; load `exts/pip-auto-login/dist` with
**Load unpacked**.

## Code map

| File                                        | Role                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/pip.ts`, `src/pip-page.ts`             | Entry on the PIP sites: clicks "Sign in with Microsoft" once per flow, ends the flow. |
| `src/microsoft.ts`, `src/microsoft-page.ts` | Entry on `login.microsoftonline.com`: picks the account, answers "Stay signed in?".   |
| `src/url.ts`                                | Checks the tenant and client ID in the (possibly encoded) Microsoft URL.              |
| `src/dom.ts`                                | Visibility, labels and click helpers both pages share.                                |
| `src/background.ts`, `src/flow-tracker.ts`  | Background worker that remembers which tabs have an active flow.                      |
| `src/options.ts`, `static/options.html`     | Settings page, also used as the toolbar popup.                                        |
| `src/settings.ts`                           | Settings shape, defaults and storage.                                                 |

## How it works

1. A content script runs on the PIP sites: `web.dev-pip.internal`, `web.uat-pip.internal` and
   `web.pip.internal`, fixed in the manifest. When a page shows the "Sign in with Microsoft"
   button (found by its text, on any route), it marks the tab as an active flow and clicks it.
2. If the button shows again while the tab's flow is active, the sign-in most likely failed:
   the extension stops and leaves the click to the user instead of looping.
3. On `login.microsoftonline.com` it acts only when the URL carries the configured tenant and,
   with "Filter by client ID" on, an allowed client ID, or while the tab's flow is active
   (5 minutes from the last marked page). PIP asks Microsoft with `prompt=select_account`, so
   the account chooser shows on every sign-in.
4. On the chooser it picks the preferred account; on "Stay signed in?" it clicks Yes. Labels
   are matched in English and Portuguese. It stops after 60 seconds on a page.
5. Once the tab has stayed in PIP outside the `/auth` routes for 5 seconds, the flow ends. The
   tab stays open.

Every action is logged to the page console with the `[pip-auto-login]` prefix.

## Settings

Open them from the toolbar icon or the extension's options page. They sync across browsers.

| Setting             | Default                                | Effect                                                                                               |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Enabled             | on                                     | Turns the whole extension on or off.                                                                 |
| Preferred account   | `@patria.com`                          | An email, or an `@domain` exactly one chooser account must match. Empty: pick only a single account. |
| Microsoft tenant ID | `60367fa4-9ea6-46cb-8d81-c9698bb7db3a` | Tenant whose sign-in the extension may complete.                                                     |
| Filter by client ID | on                                     | On: the sign-in must also carry an allowed client ID. Off: the tenant is enough.                     |
| Allowed client IDs  | `3185aa47-2c41-4cac-9a92-f23a8f3f6c65` | Client IDs (the PIP web app) whose sign-in the extension may complete.                               |

## Limitations

- The PIP sites are fixed in the manifest; adding one is a code change.
- Labels are matched in English and Portuguese only.
- With several accounts matching the preferred `@domain`, or none, the user picks the account.
- App consent, password, MFA and other challenges are left to the user.
- PIP or Microsoft can change the page markup at any time, which stops the clicks until the
  selectors are updated.
