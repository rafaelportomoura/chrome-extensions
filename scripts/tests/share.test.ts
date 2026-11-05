import { describe, expect, it } from "vitest";
import {
  fillPlaceholders,
  localeSection,
  type Package,
  renderInstall,
  renderMessage,
  type ShareSources,
} from "../src/share.ts";

const doc = `# Title

Preamble for maintainers.

## pt-BR

# Olá {{name}}

### Passos
Texto

## en

Hello {{name}}
`;

const pkg: Package = {
  name: "Demo",
  folder: "demo",
  version: "1.2.3",
  zip: "demo-1.2.3.zip",
};

describe("localeSection", () => {
  it("returns only the requested locale, keeping deeper headings", () => {
    expect(localeSection(doc, "pt-BR", "doc")).toBe("# Olá {{name}}\n\n### Passos\nTexto");
    expect(localeSection(doc, "en", "doc")).toBe("Hello {{name}}");
  });

  it("fails when the locale section is missing or empty", () => {
    expect(() => localeSection("## pt-BR\nOi", "en", "DESCRIPTION.md")).toThrow(
      'DESCRIPTION.md has no "## en" section',
    );
    expect(() => localeSection("## en\n\n## pt-BR\nOi", "en", "x")).toThrow("empty");
  });
});

describe("fillPlaceholders", () => {
  it("fills every placeholder and collapses the blank lines an empty one leaves", () => {
    expect(fillPlaceholders("A {{name}}\n\n{{gap}}\n\nB", { name: "x", gap: "" }, "t")).toBe(
      "A x\n\nB\n",
    );
  });

  it("fails on a placeholder with no value", () => {
    expect(() => fillPlaceholders("{{name}} {{nope}}", { name: "x" }, "INSTALL.md")).toThrow(
      "INSTALL.md uses placeholders with no value: nope",
    );
  });
});

describe("rendering", () => {
  const sources: ShareSources = {
    installTemplate:
      "## pt-BR\nInstale {{name}} de {{zip}}\n\n{{extension_steps}}\n\nFim\n## en\nInstall {{name}}\n\n{{extension_steps}}",
    messageTemplate:
      "## pt-BR\n{{name}} {{version}}\n\n{{description}}\n## en\n{{name}} {{version}}\n\n{{description}}",
    description: "## pt-BR\nFaz algo.\n## en\nDoes something.",
  };

  it("builds the install guide with and without extension steps", () => {
    expect(renderInstall(sources, pkg, "pt-BR")).toBe("Instale Demo de demo-1.2.3.zip\n\nFim\n");
    expect(
      renderInstall(
        { ...sources, extensionInstall: "## pt-BR\nPasso extra\n## en\nExtra step" },
        pkg,
        "en",
      ),
    ).toBe("Install Demo\n\nExtra step\n");
  });

  it("builds the chat message in the requested locale", () => {
    expect(renderMessage(sources, pkg, "pt-BR")).toBe("Demo 1.2.3\n\nFaz algo.\n");
    expect(renderMessage(sources, pkg, "en")).toBe("Demo 1.2.3\n\nDoes something.\n");
  });

  it("names the extension file when its locale section is missing", () => {
    expect(() =>
      renderInstall({ ...sources, extensionInstall: "## pt-BR\nSó pt" }, pkg, "en"),
    ).toThrow('exts/demo/INSTALL.md has no "## en" section');
  });
});
