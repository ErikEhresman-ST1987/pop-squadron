const status = () => document.getElementById('offline-status');
const build = __POP_BUILD_ID__;
const base = import.meta.env.BASE_URL;
const refreshKey = 'pop-squadron-refreshed-build';
let registration;
let checking = false;
let refreshing = false;
let pendingRefresh = null;
function missionActive() {
  const game = document.getElementById('game');
  return Boolean(game && !game.hidden);
}
function applyPendingRefresh() {
  if (!pendingRefresh || missionActive()) return;
  const { version, manual } = pendingRefresh;
  pendingRefresh = null;
  refreshFor(version, manual);
}
// An automatic retry is limited per release, but manual retries are never blocked.

function show(message) {
  const element = status();
  if (element) element.textContent = message;
}
function currentVersion() { return build.slice(0, 9); }
async function refreshFor(version, manual = false) {
  if (refreshing || !navigator.onLine || !version || version === build) return;
  if (missionActive()) {
    pendingRefresh = { version, manual };
    show('Update ready · Will install when you return to hangar');
    return;
  }
  // Activation can precede controllerchange. Reloading before the new worker
  // controls this page simply returns the previous cached HTML on iOS.
  const controller = navigator.serviceWorker.controller;
  const controllingBuild = controller ? await readWorkerBuild(controller) : null;
  if (controllingBuild !== version) {
    pendingRefresh = { version, manual };
    show('Update installing · Waiting for new version to take control');
    return;
  }
  if (missionActive()) {
    pendingRefresh = { version, manual };
    show('Update ready · Will install when you return to hangar');
    return;
  }
  try {
    // The stored value limits automatic navigation loops, not explicit user retries.
    if (!manual && sessionStorage.getItem(refreshKey) === version) {
      show('New version ready · Tap Check for Updates to retry loading it');
      return;
    }
    sessionStorage.setItem(refreshKey, version);
  } catch { /* Private storage may be disabled. */ }
  refreshing = true;
  show('New version ready · Loading ' + version.slice(0, 9) + '…');
  // A distinct navigation URL avoids iOS restoring the identical page snapshot.
  // The active worker still serves its own coherent cached HTML for navigation.
  const url = new URL(window.location.href);
  url.searchParams.set('release', version.slice(0, 16));
  window.location.replace(url.href);
}
async function probeRelease() {
  const response = await fetch(base + 'release.json?check=' + Date.now(), { cache: 'no-store' });
  if (!response.ok) throw new Error('Release check HTTP ' + response.status);
  const release = await response.json();
  if (!release || typeof release.build !== 'string' || !release.build) throw new Error('Invalid release metadata');
  return release.build;
}
export async function checkForUpdates(manual = false) {
  if (checking) return;
  if (!navigator.onLine) { show('Offline · Installed version ' + currentVersion()); return; }
  checking = true;
  show('Checking for updates · Installed ' + currentVersion());
  try {
    const latest = await probeRelease();
    if (latest === build) {
      try { sessionStorage.removeItem(refreshKey); } catch { /* Storage unavailable. */ }
      show('Up to date · Version ' + currentVersion());
      return;
    }
    show('New version ' + latest.slice(0, 9) + ' found · Installing…');
    if (!registration) throw new Error('Offline worker unavailable');
    await registration.update();
    // An activated worker precaches a complete matching build before taking control.
    // Never reload solely because release.json is newer than the active worker.
    const worker = registration.waiting || registration.installing;
    if (worker) {
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') void refreshFor(latest, manual);
        if (worker.state === 'redundant') show('Update failed · Tap Check for Updates');
      });
    } else if (navigator.serviceWorker.controller) {
      // update() may already have activated the new worker.
      const activeBuild = await readWorkerBuild(navigator.serviceWorker.controller);
      if (activeBuild === latest) void refreshFor(latest, manual);
      else show('New version found · Retry Check for Updates shortly');
    } else show('Update installing · Reopen when complete');
  } catch (error) {
    show('Update check unavailable · Offline game remains playable');
    console.warn('Pop Squadron update check:', error);
  } finally { checking = false; }
}
function readWorkerBuild(worker) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve(null), 2500);
    channel.port1.onmessage = event => { clearTimeout(timeout); resolve(event.data?.build ?? null); };
    try { worker.postMessage({ type: 'BUILD_VERSION' }, [channel.port2]); }
    catch { clearTimeout(timeout); resolve(null); }
  });
}
export async function setupOffline() {
  window.addEventListener('pop-squadron-hangar', applyPendingRefresh);
  const button = document.getElementById('check-updates');
  if (button) button.addEventListener('click', () => { void checkForUpdates(true); });
  if (!('serviceWorker' in navigator)) {
    show('Offline installation unavailable in this browser');
    return;
  }
  show('Installed version ' + currentVersion() + ' · Preparing offline play…');
  try {
    registration = await navigator.serviceWorker.register(base + 'sw.js', {
      scope: base, updateViaCache: 'none'
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!navigator.onLine || !navigator.serviceWorker.controller) return;
      void readWorkerBuild(navigator.serviceWorker.controller).then(version => {
        if (!version || version === build) return;
        const manual = pendingRefresh?.version === version && pendingRefresh.manual;
        pendingRefresh = null;
        void refreshFor(version, manual);
      });
    });
    const worker = registration.installing || registration.waiting || registration.active;
    if (worker && worker.state !== 'activated') worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant') show('Offline setup failed · Retry online');
    });
    window.addEventListener('online', () => { void checkForUpdates(); });
    window.addEventListener('offline', () => show('Offline · Version ' + currentVersion() + ' available'));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) void checkForUpdates();
    });
    // Also check when the installed PWA resumes from the app switcher.
    window.addEventListener('pageshow', () => { if (navigator.onLine) void checkForUpdates(); });
    await checkForUpdates();
  } catch (error) {
    show('Offline setup unavailable · Retry online');
    console.warn('Pop Squadron offline setup:', error);
  }
}
