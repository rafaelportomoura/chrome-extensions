# PIP Auto login

Signs in to PIP through Microsoft SSO without the user clicking through the pages.

## Language

**PIP sign-in**:
The Microsoft SSO sign-in that the PIP web app starts from its "Sign in with Microsoft" button.
_Avoid_: Login, auth

**PIP site**:
One of the PIP web app origins the extension runs on (dev, UAT, production), fixed in the
manifest.
_Avoid_: Environment URL, host

**Allowed tenant**:
The Microsoft Entra ID tenant whose sign-in the extension is permitted to complete.
_Avoid_: Directory, organization

**Allowed client**:
An OAuth client ID whose sign-in the extension is permitted to complete, checked only while the
client ID filter is on.
_Avoid_: Whitelisted app, trusted client

**Active flow**:
A browser tab where the extension clicked "Sign in with Microsoft", or that reached a Microsoft
page carrying the Allowed tenant (and Allowed client), within the last five minutes.
_Avoid_: Session, login in progress

**Preferred account**:
The account picked automatically on the Microsoft account chooser: one email, or the single
account in a given `@domain`.
_Avoid_: Default account, user

**Stay signed in**:
The Microsoft "Stay signed in?" page after the account is chosen, answered Yes.
_Avoid_: KMSI, remember me
