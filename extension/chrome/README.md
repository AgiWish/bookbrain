# BookBrain Chrome Extension

Chrome Manifest V3 extension for saving the current tab to BookBrain and searching saved bookmarks.

## Install Locally

1. Open Chrome and visit `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder:

```text
extension/chrome
```

## Configure

Open the extension options page and set:

```text
BookBrain URL: http://book.agiwish.com
BookBrain URL: https://book.agiwish.com
Extension token: your BOOKBRAIN_EXTENSION_TOKEN
```

Click `Test connection` before using the popup.

## Use

1. Open any normal web page.
2. Click the BookBrain extension icon.
3. Click `保存当前网页`. BookBrain classifies the bookmark automatically.
4. Use the search box to find saved bookmarks by keyword or semantic intent.

You can also:

- Right-click a page or link and choose `保存到 BookBrain`.
- Press `Alt+Shift+B` to save the current page with your defaults.

The extension sends:

```http
POST /api/bookmarks
```

with `X-BookBrain-Extension-Token`. It does not require browser login cookies.

## Notes

- The extension intentionally uses only `activeTab` and `storage` permissions.
- It does not read browsing history.
- It does not support `chrome://`, `edge://`, `about:`, `devtools:`, or local file pages.
- If you move BookBrain to another domain, add that domain to `host_permissions` in `manifest.json`.
