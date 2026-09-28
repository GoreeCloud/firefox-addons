const titleInput = document.querySelector("#tab-title");
const pageTitle = document.querySelector("#page-title");
const status = document.querySelector("#status");
const form = document.querySelector("#rename-form");
const saveButton = document.querySelector("#save");
const restoreButton = document.querySelector("#restore");
const cancelButton = document.querySelector("#cancel");

const params = new URLSearchParams(location.search);
const tabId = Number(params.get("tabId"));

function setStatus(message, state = "") {
  status.textContent = message;
  if (state) status.dataset.state = state;
  else delete status.dataset.state;
}

function setBusy(busy) {
  saveButton.disabled = busy;
  restoreButton.disabled = busy;
  titleInput.disabled = busy;
}

function errorMessage(reason, maxLength, rollbackApplied = false) {
  switch (reason) {
    case "page-not-scriptable":
      return "Firefox does not allow extensions to rename this page. Built-in, protected, PDF, reader, and some Mozilla pages are restricted.";
    case "title-too-long":
      return `Keep the custom tab title to ${maxLength || 160} characters or fewer.`;
    case "tab-not-found":
      return "This Firefox tab is no longer open.";
    case "session-metadata-write-failed":
      return rollbackApplied
        ? "Firefox could not save the local title metadata, so Advanced Tab Manager restored the previous tab title."
        : "Firefox could not save the local title metadata, and the previous tab title could not be fully restored. Reopen Rename tab title… to review this tab.";
    default:
      return "The tab title could not be changed.";
  }
}

async function load() {
  if (!Number.isInteger(tabId)) {
    setStatus("The rename request is invalid.", "error");
    setBusy(true);
    return;
  }

  const result = await browser.runtime.sendMessage({
    type: "atm:get-tab-title-rename-state",
    tabId
  });

  if (!result?.ok) {
    setStatus(errorMessage(result?.reason, result?.maxLength, result?.rollbackApplied), "error");
    setBusy(true);
    return;
  }

  if (!result.eligible) {
    setStatus(errorMessage("page-not-scriptable"), "error");
    setBusy(true);
    return;
  }

  titleInput.maxLength = result.maxLength || 160;
  titleInput.value = result.customTitle || result.pageTitle || "";
  pageTitle.textContent = result.pageTitle ? `Current page title: ${result.pageTitle}` : "This page currently has no title.";
  titleInput.focus();
  titleInput.select();
}

async function applyTitle(title) {
  setBusy(true);
  setStatus(title ? "Renaming tab…" : "Restoring page title…");

  const result = await browser.runtime.sendMessage({
    type: "atm:set-tab-title-override",
    tabId,
    title
  });

  if (!result?.ok) {
    setBusy(false);
    setStatus(errorMessage(result?.reason, result?.maxLength), "error");
    titleInput.focus();
    return;
  }

  window.close();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  applyTitle(titleInput.value).catch((error) => {
    console.error(error);
    setBusy(false);
    setStatus("The tab title could not be changed.", "error");
  });
});

restoreButton.addEventListener("click", () => {
  applyTitle("").catch((error) => {
    console.error(error);
    setBusy(false);
    setStatus("The page title could not be restored.", "error");
  });
});

cancelButton.addEventListener("click", () => window.close());

load().catch((error) => {
  console.error(error);
  setStatus("The rename dialog could not read this tab.", "error");
  setBusy(true);
});
