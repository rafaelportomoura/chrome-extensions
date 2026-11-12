# Install guide template

`pnpm zip` fills the chosen locale's section and ships it as `INSTALL.md` inside the zip.
Placeholders: `{{name}}`, `{{version}}`, `{{folder}}`, `{{zip}}`, `{{extension_steps}}` (the
locale's section of the extension's own `INSTALL.md`, or nothing). Inside a section, use `#` and
`###` headings only: `##` starts the next locale.

## pt-BR

# Como instalar {{name}} {{version}}

### Use uma pasta fixa

O Chrome carrega a extensão direto da pasta escolhida em Carregar sem compactação. Se a pasta for apagada ou movida, a extensão para de funcionar.

O Chrome também identifica a extensão pelo caminho dessa pasta. Na mesma pasta, as configurações continuam valendo nas próximas versões. Numa pasta nova, o Chrome cria outra extensão e você configura tudo de novo.

Crie uma pasta só para isso, fora de Downloads, por exemplo ~/chrome-extensions/{{folder}}.

### Instalar

1. Descompacte o {{zip}} na pasta fixa.
2. No Chrome, abra chrome://extensions.
3. Ative o Modo do desenvolvedor, no canto superior direito.
4. Clique em Carregar sem compactação e escolha a pasta fixa (a que tem o manifest.json).
5. Para deixar o ícone à vista, clique no quebra-cabeça da barra do Chrome e no alfinete ao lado de {{name}}.

{{extension_steps}}

### Atualizar

1. Descompacte o zip novo e copie o conteúdo para a mesma pasta, substituindo os arquivos antigos.
2. Abra chrome://extensions.
3. No card de {{name}}, clique no ícone de recarregar (a seta circular).
4. Confira a versão no card. As configurações continuam lá.

Não remova a extensão nem use Carregar sem compactação de novo para atualizar: basta substituir os arquivos e recarregar.

## en

# How to install {{name}} {{version}}

### Use a fixed folder

Chrome loads the extension straight from the folder picked in Load unpacked. If that folder is deleted or moved, the extension stops working.

Chrome also identifies the extension by that folder's path. In the same folder, the settings carry over to later versions. In a new folder, Chrome creates another extension and you configure everything again.

Create a folder just for this, outside Downloads, for example ~/chrome-extensions/{{folder}}.

### Install

1. Unzip {{zip}} into the fixed folder.
2. In Chrome, open chrome://extensions.
3. Turn on Developer mode, in the top right corner.
4. Click Load unpacked and pick the fixed folder (the one with manifest.json).
5. To keep the icon in sight, click the puzzle piece in Chrome's toolbar and the pin next to {{name}}.

{{extension_steps}}

### Update

1. Unzip the new zip and copy its contents into the same folder, replacing the old files.
2. Open chrome://extensions.
3. On the {{name}} card, click the reload icon (the circular arrow).
4. Check the version on the card. The settings are still there.

Do not remove the extension or use Load unpacked again to update: replace the files and reload.
