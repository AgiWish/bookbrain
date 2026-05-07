/* eslint-disable @typescript-eslint/no-unused-vars */

const BOOKBRAIN_DEFAULT_SETTINGS = {
  baseUrl: "https://book.agiwish.com",
  extensionToken: "",
  defaultPinned: false,
};

function bookbrainNormalizeBaseUrl(value) {
  return (value || "").trim().replace(/\/+$/, "");
}

function bookbrainIsUnsupportedUrl(url) {
  return /^(chrome|chrome-extension|edge|moz-extension|safari-web-extension|brave|about|devtools|file):/i.test(url || "");
}

async function bookbrainGetSettings() {
  const stored = await chrome.storage.local.get(BOOKBRAIN_DEFAULT_SETTINGS);
  return {
    baseUrl: bookbrainNormalizeBaseUrl(stored.baseUrl || BOOKBRAIN_DEFAULT_SETTINGS.baseUrl),
    extensionToken: stored.extensionToken || stored.password || "",
    defaultPinned: Boolean(stored.defaultPinned),
  };
}

function bookbrainAuthHeaders(settings) {
  return {
    "X-BookBrain-Extension-Token": settings.extensionToken,
  };
}

async function bookbrainParseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(text.slice(0, 160) || `请求失败（${response.status}）`);
  }
  return response.json();
}

async function bookbrainSaveBookmark(input) {
  const settings = await bookbrainGetSettings();
  if (!settings.baseUrl || !settings.extensionToken) {
    throw new Error("请先完成插件设置。");
  }
  if (!input.url || bookbrainIsUnsupportedUrl(input.url)) {
    throw new Error("当前页面不能保存。");
  }

  const response = await fetch(`${settings.baseUrl}/api/bookmarks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bookbrainAuthHeaders(settings),
    },
    body: JSON.stringify({
      title: (input.title || "").trim(),
      url: input.url.trim(),
      autoClassify: true,
      pinned: input.pinned ?? settings.defaultPinned,
    }),
  });

  const data = await bookbrainParseJsonResponse(response);
  if (response.status === 409) {
    return { status: "exists", message: data.error || "这个网页已经收藏过了。" };
  }
  if (response.status === 401) {
    throw new Error("插件访问码不正确，请检查设置。");
  }
  if (!response.ok) {
    throw new Error(data.error || `保存失败（${response.status}）`);
  }

  return { status: "created", message: "已保存到 BookBrain。", bookmark: data.bookmark };
}

async function bookbrainListPinned(limit = 30) {
  const settings = await bookbrainGetSettings();
  if (!settings.baseUrl || !settings.extensionToken) {
    throw new Error("请先完成插件设置。");
  }
  const params = new URLSearchParams({ pinned: "true", limit: String(limit), page: "1" });
  const response = await fetch(`${settings.baseUrl}/api/bookmarks?${params}`, {
    headers: bookbrainAuthHeaders(settings),
  });
  const data = await bookbrainParseJsonResponse(response);
  if (response.status === 401) {
    throw new Error("插件访问码不正确，请检查设置。");
  }
  if (!response.ok) {
    throw new Error(data.error || `加载常用收藏失败（${response.status}）`);
  }
  // The list endpoint returns { bookmarks: [...] } in current builds; older
  // builds returned a bare array — accept either.
  return Array.isArray(data) ? data : data.bookmarks || data.results || [];
}

async function bookbrainSearchBookmarks(query, limit = 8) {
  const settings = await bookbrainGetSettings();
  if (!settings.baseUrl || !settings.extensionToken) {
    throw new Error("请先完成插件设置。");
  }
  const q = (query || "").trim();
  if (!q) return { results: [], total: 0 };

  const params = new URLSearchParams({ q, mode: "hybrid", limit: String(limit) });
  const response = await fetch(`${settings.baseUrl}/api/search?${params}`, {
    headers: bookbrainAuthHeaders(settings),
  });
  const data = await bookbrainParseJsonResponse(response);
  if (response.status === 401) {
    throw new Error("插件访问码不正确，请检查设置。");
  }
  if (!response.ok) {
    throw new Error(data.error || `搜索失败（${response.status}）`);
  }

  return {
    results: Array.isArray(data.results) ? data.results : [],
    total: data.total ?? 0,
  };
}
