# GCP Auto login

Completes the Google sign-in pages that the gcloud CLI opens, without the user clicking through
them.

## Language

**gcloud sign-in**:
The Google OAuth sign-in opened in the browser by `gcloud auth login` or
`gcloud auth application-default login`.
_Avoid_: Login, auth

**Allowed client**:
An OAuth client ID whose sign-in the extension is permitted to complete automatically.
_Avoid_: Whitelisted app, trusted client

**Active flow**:
A browser tab that reached a page carrying an Allowed client within the last five minutes.
_Avoid_: Session, login in progress

**Preferred account**:
The account picked automatically on the account chooser, on Google and on the Microsoft SSO page
a federated Google Workspace account signs in through.
_Avoid_: Default account, user

**Success page**:
The "You are now authenticated" page that ends a gcloud sign-in.
_Avoid_: Callback, done page
