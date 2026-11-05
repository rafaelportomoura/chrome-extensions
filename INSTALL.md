# Install guide template

`pnpm zip` fills the chosen locale's section and ships it as `INSTALL.md` inside the zip.
Placeholders: `{{name}}`, `{{version}}`, `{{folder}}`, `{{zip}}`, `{{extension_steps}}` (the
locale's section of the extension's own `INSTALL.md`, or nothing). Inside a section, use `#` and
`###` headings only: `##` starts the next locale.

## pt-BR

# Como instalar {{name}} {{version}}

### Instalar

1. Descompacte o {{zip}} numa pasta que você vai manter. O Chrome carrega a extensão dessa pasta, então não apague nem mova depois.
2. No Chrome, abra chrome://extensions.
3. Ative o Modo do desenvolvedor, no canto superior direito.
4. Clique em Carregar sem compactação e escolha a pasta descompactada (a que tem o manifest.json).
5. Para deixar o ícone à vista, clique no quebra-cabeça da barra do Chrome e no alfinete ao lado de {{name}}.

{{extension_steps}}

### Atualizar

1. Descompacte a versão nova por cima da mesma pasta.
2. Em chrome://extensions, clique no ícone de recarregar no card de {{name}}.

## en

# How to install {{name}} {{version}}

### Install

1. Unzip {{zip}} into a folder you will keep. Chrome loads the extension from that folder, so do not delete or move it afterwards.
2. In Chrome, open chrome://extensions.
3. Turn on Developer mode, in the top right corner.
4. Click Load unpacked and pick the unzipped folder (the one with manifest.json).
5. To keep the icon in sight, click the puzzle piece in Chrome's toolbar and the pin next to {{name}}.

{{extension_steps}}

### Update

1. Unzip the new version over the same folder.
2. In chrome://extensions, click the reload icon on the {{name}} card.
