"use strict";

(() => {
  const query = new URLSearchParams(location.search);
  const get = (id) => document.getElementById(id);
  const stage = get("stage");
  const fileList = get("file-list");
  const settings = get("settings");
  const error = get("error");
  const cache = new Map();
  const syntheticEvents = new WeakSet();
  const historyApp = "display-viewer-v2";
  let files = [];
  let screen = "viewer";
  let requested = null;
  let displayed = null;
  let target = null;
  let loading = false;
  let closing = false;
  let confirmedFile = null;
  let loadSequence = 0;
  let wakeEnabled = query.get("wake") !== "0";
  let wakeLock = null;
  let wakePending = false;
  let wakeGeneration = 0;
  let autoKeyEnabled = query.get("autoKey") === "1";
  let autoKeyTimer = null;
  let autoKeyCount = 0;
  let pageActive = true;

  function updateSize() {
    const image = stage.querySelector("img");
    const rect = image?.getBoundingClientRect();
    const width = rect ? Math.round(rect.width * 100) / 100 : 0;
    const height = rect ? Math.round(rect.height * 100) / 100 : 0;
    get("viewport-status").textContent = `${innerWidth} × ${innerHeight} / ${devicePixelRatio}`;
    get("size-note").textContent = `이미지 표시: ${width} × ${height} CSS px. `
      + (width === 600 && height === 600 && devicePixelRatio === 1
        ? "브라우저 크기 조건 일치. 물리적 1:1 매핑은 미검증."
        : "미리보기 배율 적용. 물리적 1:1 매핑은 미검증.");
  }

  function stateFor(nextScreen) {
    return { app: historyApp, screen: nextScreen, file: displayed ?? requested, target };
  }

  function saveState() {
    history.replaceState(stateFor(screen), "");
  }

  function highlightTarget() {
    fileList.querySelectorAll("[data-file]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.file === target));
      button.tabIndex = button.dataset.file === target ? 0 : -1;
      button.querySelector(".current").textContent = button.dataset.file === stage.querySelector("img")?.alt ? "표시 중" : "";
    });
    get("file-count").textContent = `${files.indexOf(target) + 1} / ${files.length}`;
  }

  function focusTarget() {
    highlightTarget();
    const button = [...fileList.querySelectorAll("[data-file]")].find((item) => item.dataset.file === target);
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: "nearest" });
  }

  function renderScreen(nextScreen) {
    screen = nextScreen;
    get("list-panel").hidden = screen !== "list";
    settings.hidden = screen !== "settings";
    if (screen === "list") focusTarget();
    else if (screen === "settings") get("wake").focus();
    else stage.focus({ preventScroll: true });
  }

  function openList() {
    if (screen !== "viewer" || closing || loading || !files.length) return;
    target = displayed ?? requested ?? files[0];
    saveState();
    history.pushState(stateFor("list"), "");
    renderScreen("list");
    void requestWakeLock();
  }

  function openSettings() {
    if (screen !== "list" || closing) return;
    saveState();
    history.pushState(stateFor("settings"), "");
    renderScreen("settings");
  }

  function goBack() {
    if (screen === "viewer" || closing) return;
    closing = true;
    history.back();
  }

  function confirmTarget() {
    if (screen !== "list" || closing || !files.includes(target)) return;
    confirmedFile = target;
    goBack();
  }

  function buildList() {
    fileList.replaceChildren();
    for (const file of files) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.file = file;
      button.setAttribute("role", "option");
      const name = document.createElement("span");
      name.textContent = file;
      const current = document.createElement("span");
      current.className = "current";
      button.append(name, current);
      button.addEventListener("focus", () => {
        target = file;
        highlightTarget();
        if (screen === "list") saveState();
      });
      button.addEventListener("click", () => { target = file; confirmTarget(); });
      fileList.append(button);
    }
  }

  async function readFiles() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
      const endpoint = local ? "patterns.local.json" : "patterns.json";
      const response = await fetch(new URL(`./${endpoint}`, location.href), {
        cache: "no-store", signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Image list request failed (HTTP ${response.status}).`);
      const data = await response.json();
      if (!Array.isArray(data.files) || !data.files.length || data.files.some((file) =>
        typeof file !== "string" || !/^[^/\\\u0000-\u001f]+\.png$/i.test(file))) {
        throw new Error("Image list must contain PNG file names from the patterns folder.");
      }
      return [...new Set(data.files)].sort();
    } finally {
      clearTimeout(timeout);
    }
  }

  function loadImage(file) {
    if (cache.has(file)) return cache.get(file);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.alt = file;
      image.draggable = false;
      const timer = setTimeout(() => {
        image.onload = image.onerror = null;
        reject(new Error("Image load timed out. Check the connection and retry."));
      }, 15000);
      image.onerror = () => {
        clearTimeout(timer);
        reject(new Error("Image could not be loaded. Check the path and connection."));
      };
      image.onload = async () => {
        try {
          if (image.naturalWidth !== 600 || image.naturalHeight !== 600) {
            throw new Error("Expected a 600 x 600 image. Automatic resizing is not allowed.");
          }
          if (image.decode) await image.decode();
          clearTimeout(timer);
          resolve(image);
        } catch (cause) {
          clearTimeout(timer);
          reject(cause);
        }
      };
      image.src = new URL(`./patterns/${encodeURIComponent(file)}`, location.href).href;
    }).catch((cause) => {
      cache.delete(file);
      throw cause;
    });
    cache.set(file, promise);
    return promise;
  }

  async function selectPattern(file) {
    requested = file;
    loading = true;
    const sequence = ++loadSequence;
    // Do not leave a previous measurement pattern visible while a new one loads.
    stage.replaceChildren();
    error.hidden = true;
    get("pattern-status").textContent = `${file} 로딩 중`;
    try {
      const image = await loadImage(file);
      if (sequence !== loadSequence) return;
      stage.replaceChildren(image);
      displayed = file;
      loading = false;
      get("pattern-status").textContent = `${file} · 600 × 600`;
      const url = new URL(location.href);
      url.searchParams.delete("pattern");
      url.searchParams.delete("menu");
      url.searchParams.set("file", file);
      history.replaceState(stateFor(screen), "", url);
      updateSize();
      highlightTarget();
      // Preload adjacent files, not the whole folder.
      const index = files.indexOf(file);
      for (const offset of [-1, 1]) {
        const next = files[(index + offset + files.length) % files.length];
        if (next !== file) void loadImage(next).catch(() => {});
      }
    } catch (cause) {
      if (sequence !== loadSequence) return;
      loading = false;
      get("pattern-status").textContent = `${file} 실패`;
      error.textContent = `${file}: ${cause.message}`;
      error.hidden = false;
      openList();
    }
  }

  function updateWakeButton() {
    get("wake").textContent = `화면 유지 요청: ${wakeEnabled ? "켜짐" : "꺼짐"}`;
    get("wake").setAttribute("aria-pressed", String(wakeEnabled));
  }

  async function requestWakeLock() {
    if (!wakeEnabled || !pageActive || document.hidden || wakeLock || wakePending) return;
    if (!navigator.wakeLock?.request) {
      get("wake-status").textContent = "이 브라우저에서 API 미지원";
      return;
    }
    const generation = wakeGeneration;
    wakePending = true;
    get("wake-status").textContent = "요청 중";
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (generation !== wakeGeneration || !wakeEnabled || !pageActive || document.hidden) {
        await lock.release();
        return;
      }
      if (lock.released) {
        get("wake-status").textContent = "요청 직후 해제됨 · 껐다 켜서 재요청";
        return;
      }
      wakeLock = lock;
      get("wake-status").textContent = "API 승인 · 안경 유지 효과는 미검증";
      lock.addEventListener("release", () => {
        if (wakeLock !== lock) return;
        wakeLock = null;
        get("wake-status").textContent = wakeEnabled ? "해제됨 · 껐다 켜서 재요청" : "꺼짐";
      });
    } catch (cause) {
      if (generation === wakeGeneration) get("wake-status").textContent = `요청 실패 (${cause.name})`;
    } finally {
      wakePending = false;
      // A stale request may have completed after disable/enable or page restore.
      if (generation !== wakeGeneration && wakeEnabled && pageActive && !document.hidden) void requestWakeLock();
    }
  }

  function releaseWakeLock() {
    wakeGeneration++;
    const previous = wakeLock;
    wakeLock = null;
    if (previous) void previous.release().catch(() => {});
    get("wake-status").textContent = wakeEnabled ? "백그라운드에서 중지" : "꺼짐";
  }

  function updateAutoKeyStatus() {
    get("auto-key").textContent = `자동 키 실험: ${autoKeyEnabled ? "켜짐" : "꺼짐"}`;
    get("auto-key").setAttribute("aria-pressed", String(autoKeyEnabled));
    get("key-status").textContent = autoKeyEnabled
      ? `10초 / ${autoKeyCount}회 / isTrusted=false` : "꺼짐";
  }

  function configureAutoKeys() {
    clearInterval(autoKeyTimer);
    autoKeyTimer = null;
    updateAutoKeyStatus();
    if (!autoKeyEnabled || !pageActive || document.hidden) return;
    autoKeyTimer = setInterval(() => {
      if (document.hidden || !pageActive) return;
      for (const type of ["keydown", "keyup"]) {
        const event = new KeyboardEvent(type, { key: "ArrowUp", code: "ArrowUp", bubbles: true, cancelable: true });
        syntheticEvents.add(event);
        document.dispatchEvent(event);
      }
      autoKeyCount++;
      updateAutoKeyStatus();
    }, 10000);
  }

  document.addEventListener("keydown", (event) => {
    if (syntheticEvents.has(event)) { event.preventDefault(); return; }
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const arrow = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key);
    if (arrow) {
      event.preventDefault();
      if (closing || !files.length) return;
      if (screen === "viewer" && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
        const direction = event.key === "ArrowRight" ? 1 : -1;
        void selectPattern(files[(files.indexOf(requested) + direction + files.length) % files.length]);
      } else if (screen === "list") {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          const direction = event.key === "ArrowDown" ? 1 : -1;
          target = files[(files.indexOf(target) + direction + files.length) % files.length];
          focusTarget();
        } else if (event.key === "ArrowRight") openSettings();
      } else if (screen === "settings" && ["ArrowUp", "ArrowDown"].includes(event.key)) {
        const buttons = [...settings.querySelectorAll("button")];
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const index = buttons.indexOf(document.activeElement);
        buttons[(index + direction + buttons.length) % buttons.length].focus();
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (event.repeat || closing) return;
      if (screen === "viewer") openList();
      else if (screen === "list" && document.activeElement !== get("open-settings")) confirmTarget();
      else if (document.activeElement?.tagName === "BUTTON") document.activeElement.click();
    } else if (event.key === "Escape" && screen !== "viewer") {
      event.preventDefault();
      if (!event.repeat) goBack();
    }
  });
  document.addEventListener("keyup", (event) => {
    if (syntheticEvents.has(event) || event.key === "Enter" || event.key === " ") event.preventDefault();
  });
  // Native middle tap traverses browser history; it need not send Escape.
  addEventListener("popstate", (event) => {
    closing = false;
    const state = event.state;
    if (state?.app !== historyApp) return;
    const commit = confirmedFile;
    confirmedFile = null;
    if (state.screen === "list" && screen === "viewer") target = displayed ?? requested;
    else if (files.includes(state.target)) target = state.target;
    renderScreen(state.screen);
    const desired = commit ?? state.file;
    if (screen === "viewer" && files.includes(desired) &&
      (desired !== displayed || !stage.querySelector("img"))) {
      void selectPattern(desired);
    } else if (screen === "viewer") saveState();
  });
  get("open-settings").addEventListener("click", openSettings);
  stage.addEventListener("click", openList);
  get("wake").addEventListener("click", () => {
    wakeEnabled = !wakeEnabled;
    updateWakeButton();
    if (wakeEnabled) void requestWakeLock(); else releaseWakeLock();
  });
  get("auto-key").addEventListener("click", () => {
    autoKeyEnabled = !autoKeyEnabled;
    configureAutoKeys();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseWakeLock(); else void requestWakeLock();
    configureAutoKeys();
  });
  addEventListener("pagehide", () => { pageActive = false; releaseWakeLock(); configureAutoKeys(); });
  addEventListener("pageshow", () => { pageActive = true; void requestWakeLock(); configureAutoKeys(); });
  addEventListener("resize", updateSize);
  updateWakeButton();
  if (!wakeEnabled) get("wake-status").textContent = "꺼짐";
  configureAutoKeys();
  void requestWakeLock();
  async function start() {
    try {
      files = await readFiles();
      buildList();
      const restored = history.state?.app === historyApp ? history.state : null;
      const initial = restored?.file ?? query.get("file") ?? `lut_${query.get("pattern") ?? "W"}.png`;
      requested = files.includes(initial) ? initial : files[0];
      target = files.includes(restored?.target) ? restored.target : requested;
      renderScreen(restored?.screen ?? "viewer");
      saveState();
      await selectPattern(requested);
    } catch (cause) {
      error.textContent = `Image list unavailable. Check GitHub Pages/Jekyll deployment or the local index. ${cause.message}`;
      error.hidden = false;
    }
  }
  void start();
})();
