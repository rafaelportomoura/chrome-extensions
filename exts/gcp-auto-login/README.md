# GCP Auto login

Clicks through the Google sign-in pages that `gcloud auth login` and
`gcloud auth application-default login` open in the browser: the account chooser, the
"Select all" scopes checkbox and the Continue / Allow buttons. On the success page it closes the
tab.

Built with `pnpm --filter gcp-auto-login build`; load `exts/gcp-auto-login/dist` with
**Load unpacked**.

## Code map

| File                                       | Role                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `src/content.ts`                           | Entry on `accounts.google.com`: checks the flow, then drives the page on every DOM change. |
| `src/sign-in-page.ts`                      | Picks the account, ticks "Select all", clicks Continue / Allow.                            |
| `src/url.ts`                               | Finds an allowed client ID in the (multiply encoded) page URL.                             |
| `src/background.ts`, `src/flow-tracker.ts` | Background worker that remembers which tabs have an active flow.                           |
| `src/success.ts`                           | Entry on the success page: ends the flow and closes the tab.                               |
| `src/options.ts`, `static/options.html`    | Settings page, also used as the toolbar popup.                                             |
| `src/settings.ts`                          | Settings shape, defaults and storage.                                                      |

## How it works

1. A content script runs on `accounts.google.com`. It acts only when the page URL carries an
   allowed OAuth client ID, and then marks the tab as an active flow in the background worker.
2. Later pages of the same sign-in do not always carry the client ID, so they act only while the
   tab's flow is active (5 minutes from the last marked page). This includes
   `login.microsoftonline.com`, where a Google Workspace account federated to Microsoft Entra ID
   lands for SSO: the same steps below apply there.
3. On each page it picks the preferred account, ticks "Select all" for the requested scopes, and
   clicks Continue / Allow. Labels are matched in English and Portuguese. It stops after
   60 seconds on a page.
4. On `cloud.google.com/sdk/auth_success` it ends the flow and, if configured, closes the tab.

Every action is logged to the page console with the `[gcloud-auto-login]` prefix.

## Settings

Open them from the toolbar icon or the extension's options page. They sync across browsers.

| Setting                  | Default                 | Effect                                                                                          |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Enabled                  | on                      | Turns the whole extension on or off.                                                            |
| Close the success tab    | on                      | Closes the tab on the success page.                                                             |
| Preferred account        | empty                   | Email to pick on the account chooser. Empty: pick only when the chooser shows a single account. |
| Allowed OAuth client IDs | gcloud's two client IDs | Sign-ins the extension may complete.                                                            |

Default allowed client IDs:

- `32555940559.apps.googleusercontent.com` (`gcloud auth login`)
- `764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com`
  (`gcloud auth application-default login`)

## Limitations

- Button and checkbox labels are matched in English and Portuguese only; another Google UI
  language leaves the pages untouched.
- With no preferred account and several accounts on the chooser, the user picks the account.
- Password, 2FA and other challenges are left to the user.
- Google can change the page markup at any time, which stops the clicks until the selectors are
  updated.
