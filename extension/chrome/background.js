importScripts("shared.js");

const CONTEXT_MENU_ID = "save-to-bookbrain";

function setBadge(tabId, text, color) {
  if (!tabId) return;
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: "" });
  }, 2500);
}

async function saveTab(tab) {
  const result = await bookbrainSaveBookmark({
    title: tab?.title || "",
    url: tab?.url || "",
  });
  setBadge(tab?.id, result.status === "created" ? "OK" : "OLD", result.status === "created" ? "#059669" : "#f59e0b");
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "保存到 BookBrain",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;
  const url = info.linkUrl || info.pageUrl || tab?.url || "";
  const title = info.linkUrl ? info.linkUrl : tab?.title || "";

  bookbrainSaveBookmark({ title, url })
    .then((result) => {
      setBadge(tab?.id, result.status === "created" ? "OK" : "OLD", result.status === "created" ? "#059669" : "#f59e0b");
    })
    .catch(() => {
      setBadge(tab?.id, "ERR", "#dc2626");
    });
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "save-current-page") return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    saveTab(tab).catch(() => {
      setBadge(tab?.id, "ERR", "#dc2626");
    });
  });
});
