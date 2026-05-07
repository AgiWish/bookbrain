const form = document.getElementById("settingsForm");
const baseUrlInput = document.getElementById("baseUrl");
const extensionTokenInput = document.getElementById("extensionToken");
const defaultPinnedInput = document.getElementById("defaultPinned");
const testButton = document.getElementById("testButton");
const statusEl = document.getElementById("status");

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function readForm() {
  return {
    baseUrl: bookbrainNormalizeBaseUrl(baseUrlInput.value),
    extensionToken: extensionTokenInput.value.trim(),
    defaultPinned: defaultPinnedInput.checked,
  };
}

async function loadSettings() {
  const settings = await bookbrainGetSettings();
  baseUrlInput.value = settings.baseUrl;
  extensionTokenInput.value = settings.extensionToken;
  defaultPinnedInput.checked = settings.defaultPinned;
}

async function saveSettings(event) {
  event.preventDefault();
  const settings = readForm();
  await chrome.storage.local.set(settings);
  setStatus("设置已保存。", "success");
}

async function testConnection() {
  const settings = readForm();
  if (!settings.baseUrl || !settings.extensionToken) {
    setStatus("请先填写完整设置。", "error");
    return;
  }

  testButton.disabled = true;
  testButton.textContent = "测试中...";
  setStatus("");

  try {
    const response = await fetch(`${settings.baseUrl}/api/stats`, {
      headers: bookbrainAuthHeaders(settings),
    });

    if (response.status === 401) {
      throw new Error("插件访问码不正确。");
    }
    if (!response.ok) {
      throw new Error(`连接失败（${response.status}）。`);
    }

    setStatus("连接成功。", "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "连接失败。", "error");
  } finally {
    testButton.disabled = false;
    testButton.textContent = "测试连接";
  }
}

form.addEventListener("submit", saveSettings);
testButton.addEventListener("click", testConnection);
loadSettings().catch((error) => {
  setStatus(error instanceof Error ? error.message : "加载设置失败。", "error");
});
