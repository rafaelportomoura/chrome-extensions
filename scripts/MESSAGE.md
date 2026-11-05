# Chat message template

Plain text pasted into Slack or Teams, rendered by `pnpm zip`. One section per locale.
Placeholders: `{{name}}`, `{{version}}`, `{{folder}}`, `{{zip}}`, `{{description}}` (the locale's
section of the extension's `DESCRIPTION.md`).

## pt-BR

{{name}} {{version}}

{{description}}

Para instalar, descompacte o {{zip}} e siga o INSTALL.md que vem dentro.

## en

{{name}} {{version}}

{{description}}

To install, unzip {{zip}} and follow the INSTALL.md inside.
