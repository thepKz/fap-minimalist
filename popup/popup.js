const STORAGE_KEY = "fapMinimalSkinEnabled";

function setStatus(message, isWarn) {
  const el = document.getElementById("status");
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = "";
    el.classList.remove("is-warn");
    return;
  }
  el.hidden = false;
  el.textContent = message;
  el.classList.toggle("is-warn", Boolean(isWarn));
}

function sendToActiveTab(message) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        resolve(false);
        return;
      }
      chrome.tabs.sendMessage(tab.id, message, () => {
        const err = chrome.runtime.lastError;
        resolve(!err);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("skin-toggle");
  if (!toggle) return;

  chrome.storage.local.get([STORAGE_KEY], (result) => {
    toggle.checked = result[STORAGE_KEY] !== false;
  });

  toggle.addEventListener("change", async () => {
    setStatus("");
    const enabled = toggle.checked;
    chrome.storage.local.set({ [STORAGE_KEY]: enabled });

    const ok = await sendToActiveTab({ type: "fap-skin-set", enabled });
    if (!ok) {
      setStatus("Mở trang fap.fpt.edu.vn rồi thử lại.", true);
    }
  });
});
