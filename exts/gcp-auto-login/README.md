# gcloud Auto Login

Clicks through the Google sign-in pages that `gcloud auth login` and
`gcloud auth application-default login` open in the browser: the account chooser, the
"Select all" scopes checkbox and the Continue / Allow buttons. On the success page it closes the
tab.

Legacy extension: plain JavaScript, no build, no tests. Load this folder directly with
**Load unpacked**.

## How it works

1. A content script runs on `accounts.google.com`. It acts only when the page URL carries an
   allowed OAuth client ID, and then marks the tab as an active flow in the background worker.
2. Later pages of the same sign-in do not always carry the client ID, so they act only while the
   tab's flow is active (5 minutes from the last marked page).
3. On each page it picks the preferred account, ticks "Select all" for the requested scopes, and
   clicks Continue / Allow. Labels are matched in English and Portuguese. It stops after
   60 seconds on a page.
4. On `cloud.google.com/sdk/auth_success` it ends the flow and, if configured, closes the tab.

Every action is logged to the page console with the `[gcloud-auto-login]` prefix.

## Settings

Open them from the toolbar icon or the extension's options page. They sync across browsers.

| Setting | Default | Effect |
| --- | --- | --- |
| Enabled | on | Turns the whole extension on or off. |
| Close the success tab | on | Closes the tab on the success page. |
| Preferred account | empty | Email to pick on the account chooser. Empty: pick only when the chooser shows a single account. |
| Allowed OAuth client IDs | gcloud's two client IDs | Sign-ins the extension may complete. |

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
