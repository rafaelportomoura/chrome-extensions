// Runs on accounts.google.com. Clicks through the account chooser and the
// consent screen, but only inside an OAuth flow started by an allowed client ID.
(async () => {
  const LOG_PREFIX = "[gcloud-auto-login]";
  const CONTINUE_LABELS = ["continue", "allow", "continuar", "permitir"];
  const SELECT_ALL_LABELS = ["select all", "selecionar tudo", "selecionar todos"];
  const MAX_RUNTIME_MS = 60 * 1000;

  const settings = await loadSettings();
  if (!settings.enabled) return;

  if (!(await isAllowedFlow(settings.allowedClientIds))) return;
  console.log(LOG_PREFIX, "allowed gcloud OAuth flow detected");

  const clicked = new WeakSet();
  const startedAt = Date.now();

  const observer = new MutationObserver(debounce(tick, 300));
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  tick();

  function tick() {
    if (Date.now() - startedAt > MAX_RUNTIME_MS) {
      observer.disconnect();
      return;
    }
    pickAccount() || selectAllScopes() || clickContinue();
  }

  function pickAccount() {
    const accounts = [...document.querySelectorAll("[data-identifier], [data-email]")]
      .filter(isVisible)
      .filter((el) => !clicked.has(el));
    if (accounts.length === 0) return false;

    const emailOf = (el) =>
      (el.getAttribute("data-identifier") || el.getAttribute("data-email") || "").toLowerCase();
    const preferred = settings.preferredEmail.trim().toLowerCase();

    let target = null;
    if (preferred) {
      target = accounts.find((el) => emailOf(el) === preferred);
    } else {
      const uniqueEmails = new Set(accounts.map(emailOf));
      if (uniqueEmails.size === 1) target = accounts[0];
    }
    if (!target) return false;

    console.log(LOG_PREFIX, "choosing account", emailOf(target));
    return click(target);
  }

  function selectAllScopes() {
    const boxes = [...document.querySelectorAll('input[type="checkbox"], [role="checkbox"]')]
      .filter(isVisible)
      .filter((el) => matchesLabel(accessibleLabel(el), SELECT_ALL_LABELS))
      .filter((el) => !isChecked(el) && !clicked.has(el));
    if (boxes.length === 0) return false;

    console.log(LOG_PREFIX, "selecting all scopes");
    return click(boxes[0]);
  }

  function clickContinue() {
    const buttons = [...document.querySelectorAll('button, [role="button"]')]
      .filter(isVisible)
      .filter((el) => !el.disabled && el.getAttribute("aria-disabled") !== "true")
      .filter((el) => matchesLabel(el.textContent, CONTINUE_LABELS))
      .filter((el) => !clicked.has(el));
    if (buttons.length === 0) return false;

    console.log(LOG_PREFIX, "clicking", buttons[0].textContent.trim());
    return click(buttons[0]);
  }

  function click(el) {
    clicked.add(el);
    el.scrollIntoView({ block: "center" });
    el.click();
    return true;
  }

  async function isAllowedFlow(allowedClientIds) {
    const url = fullyDecode(location.href);
    const hasAllowedClient = allowedClientIds.some((id) => id && url.includes(id));
    if (hasAllowedClient) {
      await chrome.runtime.sendMessage({ type: "markFlow" });
      return true;
    }
    const { active } = await chrome.runtime.sendMessage({ type: "isFlowActive" });
    return active;
  }

  function fullyDecode(value) {
    let previous;
    for (let i = 0; i < 5 && previous !== value; i++) {
      previous = value;
      try {
        value = decodeURIComponent(value);
      } catch {
        break;
      }
    }
    return value;
  }

  function accessibleLabel(el) {
    const labelledBy = el.getAttribute("aria-labelledby");
    const byId = labelledBy && document.getElementById(labelledBy)?.textContent;
    return (
      el.getAttribute("aria-label") ||
      byId ||
      el.closest("label")?.textContent ||
      (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent) ||
      ""
    );
  }

  function matchesLabel(text, labels) {
    const normalized = (text || "").trim().toLowerCase();
    return labels.includes(normalized);
  }

  function isChecked(el) {
    return el.checked === true || el.getAttribute("aria-checked") === "true";
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== "hidden";
  }

  function debounce(fn, waitMs) {
    let timer;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(fn, waitMs);
    };
  }
})();
