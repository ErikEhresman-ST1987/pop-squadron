const status = () => document.getElementById('offline-status');
function show(message) {
  const element = status();
  if (element) element.textContent = message;
}
export async function setupOffline() {
  if (!('serviceWorker' in navigator)) {
    show('Offline installation unavailable in this browser');
    return;
  }
  show(navigator.onLine ? 'Preparing offline play…' : 'Offline · Checking cached game');
  try {
    const registration = await navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL });
    // Check for updates on each online launch; iOS may keep a standalone
    // web app alive with a previously activated service worker.
    if (navigator.onLine) registration.update().catch(error => console.warn('Offline update check:', error));
    // Reload on a new controller to use one coherent offline build.
    const originalController = navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!originalController || !navigator.onLine) return;
      try {
        const key = 'pop-squadron-worker-refresh';
        const script = navigator.serviceWorker.controller?.scriptURL ?? '';
        if (sessionStorage.getItem(key) === script) return;
        sessionStorage.setItem(key, script);
      } catch { /* Storage may be unavailable. */ }
      window.location.reload();
    });
    const worker = registration.installing || registration.waiting || registration.active;
    if (worker?.state === 'activated') show('Offline game cache available');
    else if (worker) worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') show('Offline game cache available');
      if (worker.state === 'redundant') show('Offline setup failed · Retry online');
    });
    window.addEventListener('offline', () => show('Offline · Using saved game files'));
    window.addEventListener('online', () => show('Online · Offline cache available after installation'));
  } catch (error) {
    show('Offline setup unavailable · Retry online');
    console.warn('Pop Squadron offline setup:', error);
  }
}
