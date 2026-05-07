const form = document.getElementById("bookmarkForm");
const titleEl = document.getElementById("title");
const urlEl = document.getElementById("url");
const pinnedInput = document.getElementById("pinned");
const saveButton = document.getElementById("saveButton");
const statusEl = document.getElementById("status");
const setupNotice = document.getElementById("setupNotice");
const openOptionsButton = document.getElementById("openOptions");
const pageHint = document.getElementById("pageHint");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const pinnedList = document.getElementById("pinnedList");
const refreshPinnedButton = document.getElementById("refreshPinned");

let currentTab = null;
let searchTimer = null;
const PINNED_CACHE_KEY = "bookbrainPinnedCache";
const PINNED_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setSaving(isSaving, label = "保存中...") {
  saveButton.disabled = isSaving;
  saveButton.textContent = isSaving ? label : "保存当前网页";
}

async function loadInitialState() {
  const [settings, tab] = await Promise.all([bookbrainGetSettings(), getActiveTab()]);
  currentTab = tab;

  if (!settings.baseUrl || !settings.extensionToken) {
    setupNotice.classList.remove("hidden");
  }

  pinnedInput.checked = settings.defaultPinned;

  if (!tab?.url || bookbrainIsUnsupportedUrl(tab.url)) {
    titleEl.textContent = "当前页面不可收藏";
    urlEl.textContent = "";
    pageHint.textContent = "当前页面不可收藏";
    saveButton.disabled = true;
    setStatus("请切换到普通网页后再保存。", "error");
    return;
  }

  titleEl.textContent = tab.title || "未命名网页";
  urlEl.textContent = tab.url;
  pageHint.textContent = (() => {
    try {
      return new URL(tab.url).hostname.replace(/^www\./, "");
    } catch {
      return "保存当前网页";
    }
  })();
}

async function submitBookmark(event) {
  event.preventDefault();
  setSaving(true);
  setStatus("");

  try {
    const result = await bookbrainSaveBookmark({
      title: currentTab?.title || titleEl.textContent,
      url: currentTab?.url || urlEl.textContent,
      pinned: pinnedInput.checked,
    });

    const bookmark = result.bookmark;
    const location = [bookmark?.category, bookmark?.subfolder].filter(Boolean).join(" / ");
    setStatus(
      location ? `已保存到 ${location}` : result.message,
      result.status === "created" ? "success" : "error"
    );
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "保存失败。", "error");
  } finally {
    setSaving(false);
  }
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function renderSearchResults(results) {
  searchResults.innerHTML = "";
  if (!searchInput.value.trim()) return;
  if (results.length === 0) {
    searchResults.innerHTML = '<p class="empty">没有找到相关收藏</p>';
    return;
  }

  for (const item of results.slice(0, 8)) {
    const button = document.createElement("button");
    button.className = "result-item";
    button.type = "button";
    button.innerHTML = `
      <span class="result-title"></span>
      <span class="result-meta"></span>
    `;
    button.querySelector(".result-title").textContent = item.title || item.url;
    button.querySelector(".result-meta").textContent = [
      hostOf(item.url),
      [item.category, item.subfolder].filter(Boolean).join(" / "),
      (item.tags || []).slice(0, 2).join(", "),
    ].filter(Boolean).join(" · ");
    button.addEventListener("click", () => {
      chrome.tabs.create({ url: item.url });
    });
    searchResults.appendChild(button);
  }
}

async function runSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    searchResults.innerHTML = "";
    return;
  }

  searchResults.innerHTML = '<p class="empty">搜索中...</p>';
  try {
    const data = await bookbrainSearchBookmarks(query);
    renderSearchResults(data.results);
  } catch (error) {
    searchResults.innerHTML = `<p class="empty error">${error instanceof Error ? error.message : "搜索失败"}</p>`;
  }
}

function renderPinnedList(items) {
  pinnedList.innerHTML = "";
  if (!Array.isArray(items) || items.length === 0) {
    pinnedList.innerHTML = '<p class="empty">没有常用收藏。在保存网页时勾选「加入常用收藏」即可加进来。</p>';
    return;
  }

  for (const item of items) {
    const button = document.createElement("button");
    button.className = "pinned-item";
    button.type = "button";

    const host = hostOf(item.url);
    const favicon = item.favicon || (host ? `https://www.google.com/s2/favicons?domain=${host}&sz=32` : "");

    const img = document.createElement("img");
    img.className = "pinned-favicon";
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    if (favicon) img.src = favicon;
    img.addEventListener("error", () => { img.style.visibility = "hidden"; });

    const text = document.createElement("div");
    text.className = "pinned-text";
    const title = document.createElement("span");
    title.className = "pinned-title";
    title.textContent = item.title || item.url;
    const hostEl = document.createElement("span");
    hostEl.className = "pinned-host";
    hostEl.textContent = host;
    text.appendChild(title);
    text.appendChild(hostEl);

    button.appendChild(img);
    button.appendChild(text);
    button.addEventListener("click", () => {
      chrome.tabs.create({ url: item.url });
    });
    pinnedList.appendChild(button);
  }
}

async function loadPinned({ force = false } = {}) {
  // 1. Try the cache first for instant render — popups should feel snappy.
  if (!force) {
    try {
      const cached = (await chrome.storage.local.get(PINNED_CACHE_KEY))[PINNED_CACHE_KEY];
      if (cached?.items) renderPinnedList(cached.items);
    } catch {
      // ignore
    }
  } else {
    pinnedList.innerHTML = '<p class="empty">刷新中...</p>';
  }

  // 2. Then fetch fresh in the background and replace.
  try {
    const items = await bookbrainListPinned(30);
    renderPinnedList(items);
    await chrome.storage.local.set({
      [PINNED_CACHE_KEY]: { items, fetchedAt: Date.now() },
    });
  } catch (error) {
    // If the cache rendered something, keep it visible; only show the error
    // when we have nothing to fall back on.
    if (!pinnedList.querySelector(".pinned-item")) {
      pinnedList.innerHTML = `<p class="empty error">${error instanceof Error ? error.message : "加载失败"}</p>`;
    }
  }
}

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

refreshPinnedButton.addEventListener("click", () => {
  loadPinned({ force: true });
});

form.addEventListener("submit", submitBookmark);
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 300);
});
loadInitialState().catch((error) => {
  setStatus(error instanceof Error ? error.message : "初始化失败。", "error");
});

loadPinned().catch((error) => {
  console.warn("Failed to load pinned bookmarks", error);
});
