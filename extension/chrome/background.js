importScripts("shared.js");

const CONTEXT_MENU_ID = "save-to-bookbrain";
const PINNED_CACHE_KEY = "bookbrainPinnedCache";
const PINNED_REFRESH_ALARM = "bookbrain-refresh-pinned";

// Refresh the pinned-bookmarks cache in the background so the popup can paint
// instantly without waiting on a network round-trip. Failure is silent — the
// popup will fall back to its own network call if the cache is stale.
async function refreshPinnedCache() {
  try {
    const items = await bookbrainListPinned(30);
    await chrome.storage.local.set({
      [PINNED_CACHE_KEY]: { items, fetchedAt: Date.now() },
    });
  } catch (error) {
    console.debug("Pinned cache refresh failed", error);
  }
}

// Refresh on browser startup, on install/update, and once per hour.
chrome.runtime.onStartup.addListener(() => refreshPinnedCache());
chrome.alarms.create(PINNED_REFRESH_ALARM, { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === PINNED_REFRESH_ALARM) refreshPinnedCache();
});

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
  // Likely flipped pinned state, so refresh cache opportunistically.
  refreshPinnedCache();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "保存到 BookBrain",
    contexts: ["page", "link"],
  });
  refreshPinnedCache();
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
