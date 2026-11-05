import { spawnSync } from "node:child_process";

export interface ClipboardCommand {
  command: string;
  args: string[];
}

// PowerShell rather than clip.exe: clip.exe reads stdin in the OEM code page and mangles accents.
const POWERSHELL: ClipboardCommand = {
  command: "powershell.exe",
  args: [
    "-NoProfile",
    "-Command",
    "[Console]::InputEncoding = [Text.Encoding]::UTF8; Set-Clipboard -Value ([Console]::In.ReadToEnd())",
  ],
};

/** Clipboard tools to try, in order, for the given platform. */
export function clipboardCommands(
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
): ClipboardCommand[] {
  if (platform === "darwin") return [{ command: "pbcopy", args: [] }];
  if (platform === "win32") return [POWERSHELL];

  const linux: ClipboardCommand[] = [
    { command: "wl-copy", args: [] },
    { command: "xclip", args: ["-selection", "clipboard"] },
    { command: "xsel", args: ["--clipboard", "--input"] },
  ];
  return env.WSL_DISTRO_NAME ? [POWERSHELL, ...linux] : linux;
}

/** Copies text with the first tool that works. Returns its name, or null when none did. */
export function copyToClipboard(text: string): string | null {
  for (const { command, args } of clipboardCommands(process.platform, process.env)) {
    const result = spawnSync(command, args, { input: text, stdio: ["pipe", "ignore", "ignore"] });
    if (!result.error && result.status === 0) return command;
  }
  return null;
}
